//
// DOM wiring for the pace calculator. All the arithmetic lives in pace.js.
//
// @Author: Ido
// @date: April 2019
//

import {
  parseClock,
  formatClock,
  formatPace,
  paceFromTime,
  timeFromPace,
  splits,
} from './pace.js';

import {
  RACE_DISTANCES,
  METERS_PER_MILE,
  predictAll,
  vdot,
  trainingPaces,
  perKmToPerMile,
} from './predict.js';

const el = (id) => document.getElementById(id);

let lastMode = null;

function init() {
  restoreFromUrl();
  render();

  const form = el('paceForm');
  form.addEventListener('input', onFormChange);
  form.addEventListener('change', onFormChange);
  el('splitStrategy').addEventListener('change', render);
  el('shareBtn').addEventListener('click', share);
  el('printBtn').addEventListener('click', () => {
    // A collapsed <details> prints as nothing, and the splits are the whole
    // point of the pace band.
    selectTab('tab-calc');
    el('splitsPanel').open = true;
    window.print();
  });

  initTabs();
  initPredictor();
  registerServiceWorker();
}

function onFormChange(event) {
  // Typing a custom distance should select the custom radio for you.
  if (event.target === el('customDistance')) {
    el('dist-custom').checked = true;
  }
  render();
}

//
// Reading the form
//

function getUnit() {
  return el('unit-km').checked ? 'km' : 'mi';
}

function getMode() {
  return el('mode-pace').checked ? 'pace' : 'time';
}

function getDistance() {
  if (el('dist-custom').checked) {
    const custom = Number.parseFloat(el('customDistance').value);
    return Number.isFinite(custom) && custom > 0 ? custom : null;
  }
  for (const radio of document.getElementsByName('distance')) {
    if (radio.checked && radio.value) return Number.parseFloat(radio.value);
  }
  return null;
}

//
// Each preset radio carries both distances as data attributes, so switching
// unit is a relabel rather than a conversion.
//
function syncDistanceOptions() {
  const unit = getUnit();
  for (const radio of document.getElementsByName('distance')) {
    if (!radio.dataset[unit]) continue;
    radio.value = radio.dataset[unit];
    radio.nextElementSibling.textContent = radio.dataset[`${unit}Label`];
  }
  el('customUnitLabel').textContent = unitLabel(unit);
}

function unitLabel(unit) {
  return unit === 'km' ? 'Km' : 'Mi';
}

//
// Rendering
//

function render() {
  const mode = getMode();
  if (lastMode && mode !== lastMode) carryOver(lastMode, mode);
  lastMode = mode;

  syncDistanceOptions();

  const distance = getDistance();
  const unit = unitLabel(getUnit());
  const hours = Number(el('hourSlide').value);
  const minutes = Number(el('minuteSlide').value);
  const seconds = Number(el('secondSlide').value);

  el('hourSlideValue').textContent = hours;
  el('minuteSlideValue').textContent = String(minutes).padStart(2, '0');
  el('secondSlideValue').textContent = String(seconds).padStart(2, '0');

  // In pace mode the hours slider is meaningless — a per-mile pace is never
  // measured in hours — so it is hidden and the minutes/seconds are the pace.
  el('hourSliderRow').hidden = mode === 'pace';

  let totalSeconds;
  let paceSeconds;
  if (mode === 'pace') {
    paceSeconds = minutes * 60 + seconds;
    totalSeconds = timeFromPace(paceSeconds, distance);
  } else {
    totalSeconds = hours * 3600 + minutes * 60 + seconds;
    paceSeconds = paceFromTime(totalSeconds, distance);
  }

  el('TimeValue').textContent = formatClock(totalSeconds);
  el('PaceValue').textContent = `${formatPace(paceSeconds)} Min/${unit}`;

  el('timeCard').classList.toggle('is-result', mode === 'pace');
  el('paceCard').classList.toggle('is-result', mode === 'time');

  renderSplits(paceSeconds, distance, unit);
  writeUrl(mode, totalSeconds, paceSeconds);
}

function renderSplits(paceSeconds, distance, unit) {
  const negativeSplit = Number(el('splitStrategy').value) || 0;
  const rows = splits(paceSeconds, distance, { negativeSplit });
  const body = el('splitsBody');

  el('splitsSummary').textContent = `Splits (${rows.length} × ${unit})`;
  el('splitsCaption').textContent =
    negativeSplit > 0
      ? `Negative split — back half ${(negativeSplit * 100).toFixed(0)}% faster`
      : 'Even pace';

  body.replaceChildren(
    ...rows.map((row) => {
      const tr = document.createElement('tr');
      const mark = document.createElement('td');
      const time = document.createElement('td');
      mark.textContent = row.partial ? `${row.mark} ${unit} (finish)` : `${row.mark} ${unit}`;
      time.textContent = formatClock(row.cumulative);
      tr.append(mark, time);
      return tr;
    }),
  );
}

//
// Tabs
//

const TABS = [
  { tab: 'tab-calc', panel: 'panel-calc' },
  { tab: 'tab-predict', panel: 'panel-predict' },
];

function initTabs() {
  for (const { tab } of TABS) {
    el(tab).addEventListener('click', () => selectTab(tab));
    el(tab).addEventListener('keydown', onTabKey);
  }
}

function selectTab(activeId) {
  for (const { tab, panel } of TABS) {
    const isActive = tab === activeId;
    el(tab).setAttribute('aria-selected', String(isActive));
    el(tab).tabIndex = isActive ? 0 : -1;
    el(panel).hidden = !isActive;
  }
  el(activeId).focus();
}

// Left/right arrows move between tabs, which is what a tablist is expected
// to do once it has role="tablist" on it.
function onTabKey(event) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  event.preventDefault();
  const index = TABS.findIndex(({ tab }) => tab === event.currentTarget.id);
  const step = event.key === 'ArrowRight' ? 1 : -1;
  selectTab(TABS[(index + step + TABS.length) % TABS.length].tab);
}

//
// Predict & train
//

function initPredictor() {
  el('raceDistance').replaceChildren(
    ...RACE_DISTANCES.map((race) => new Option(race.label, String(race.meters))),
  );
  el('raceDistance').value = String(
    RACE_DISTANCES.find((race) => race.id === '10k').meters,
  );

  el('predictForm').addEventListener('input', renderPredictions);
  el('predictForm').addEventListener('change', renderPredictions);
  renderPredictions();
}

function renderPredictions() {
  const meters = Number(el('raceDistance').value);
  const seconds = parseClock(el('raceTime').value);
  const unit = el('predictUnit').value;

  // An unparseable time should say so rather than silently blanking the page.
  const invalid = seconds === null || seconds <= 0;
  el('predictError').hidden = !invalid;
  if (invalid) {
    el('predictBody').replaceChildren();
    el('trainingBody').replaceChildren();
    el('vdotValue').textContent = '';
    return;
  }

  const perUnit = (secondsPerKm) =>
    unit === 'mi' ? perKmToPerMile(secondsPerKm) : secondsPerKm;
  const unitName = unit === 'mi' ? 'Mi' : 'Km';
  const unitMeters = unit === 'mi' ? METERS_PER_MILE : 1000;

  el('predictBody').replaceChildren(
    ...predictAll(seconds, meters).map((race) => {
      const tr = document.createElement('tr');
      if (race.isSource) tr.className = 'is-source';
      tr.append(
        cell(race.isSource ? `${race.label} (your race)` : race.label),
        cell(formatClock(race.seconds)),
        cell(`${formatPace(race.seconds / (race.meters / unitMeters))} /${unitName}`),
      );
      return tr;
    }),
  );

  const vdotValue = vdot(meters, seconds);
  el('vdotValue').textContent = vdotValue ? `— VDOT ${vdotValue.toFixed(1)}` : '';

  el('trainingBody').replaceChildren(
    ...trainingPaces(vdotValue).map((zone) => {
      const tr = document.createElement('tr');
      tr.append(cell(zone.label), cell(`${formatPace(perUnit(zone.secondsPerKm))} /${unitName}`));
      return tr;
    }),
  );
}

function cell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

//
// Offline support
//

function registerServiceWorker() {
  // Skipped on file:// and inside the packaged extension, where the scheme
  // has no service worker to register against.
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

  navigator.serviceWorker.register('sw.js').catch(() => {
    // Offline support is a bonus; the calculator works fine without it.
  });
}

//
// Switching mode keeps the numbers you were looking at, rather than resetting
// the sliders to whatever they happened to be.
//
function carryOver(from, to) {
  const distance = getDistance();
  if (!distance) return;

  if (from === 'time' && to === 'pace') {
    const pace = paceFromTime(
      Number(el('hourSlide').value) * 3600 +
        Number(el('minuteSlide').value) * 60 +
        Number(el('secondSlide').value),
      distance,
    );
    if (pace !== null) setSliders(0, Math.round(pace));
    return;
  }

  const total = timeFromPace(Number(el('minuteSlide').value) * 60 + Number(el('secondSlide').value), distance);
  if (total !== null) setSliders(Math.floor(total / 3600), Math.round(total % 3600));
}

//
// Sliders top out at 24h / 59m / 59s, so a 100 mile shuffle has to clamp.
//
function setSliders(hours, remainderSeconds) {
  const clampedHours = Math.min(hours, 24);
  el('hourSlide').value = clampedHours;
  el('minuteSlide').value = Math.min(Math.floor(remainderSeconds / 60), 59);
  el('secondSlide').value = Math.min(remainderSeconds % 60, 59);
}

//
// Shareable URL state
//

function writeUrl(mode, totalSeconds, paceSeconds) {
  const params = new URLSearchParams({
    u: getUnit(),
    mode,
    d: String(getDistance() ?? ''),
    t: mode === 'pace' ? formatPace(paceSeconds) : formatClock(totalSeconds),
  });
  history.replaceState(null, '', `?${params}`);
}

function restoreFromUrl() {
  const params = new URLSearchParams(location.search);
  if (![...params.keys()].length) return;

  if (params.get('u') === 'km') el('unit-km').checked = true;
  if (params.get('mode') === 'pace') el('mode-pace').checked = true;
  syncDistanceOptions();

  const distance = Number.parseFloat(params.get('d'));
  if (Number.isFinite(distance) && distance > 0) selectDistance(distance);

  const seconds = parseClock(params.get('t') ?? '');
  if (seconds !== null) {
    setSliders(Math.floor(seconds / 3600), seconds % 3600);
  }
}

function selectDistance(distance) {
  for (const radio of document.getElementsByName('distance')) {
    if (Math.abs(Number.parseFloat(radio.value) - distance) < 0.01) {
      radio.checked = true;
      return;
    }
  }
  el('dist-custom').checked = true;
  el('customDistance').value = distance;
}

async function share() {
  const button = el('shareBtn');
  try {
    await navigator.clipboard.writeText(location.href);
    button.textContent = 'Link copied ✓';
  } catch {
    button.textContent = 'Copy from the address bar';
  }
  setTimeout(() => {
    button.textContent = 'Copy link';
  }, 2000);
}

//
// Entry point lives at the bottom so every const above it is initialised by
// the time init() runs — a call at the top hits the temporal dead zone.
//
// The guard is for marathon-food.html, which has no calculator markup.
//
if (el('paceForm')) {
  init();
}
