//
// DOM wiring for the pace calculator. All the arithmetic lives in pace.js,
// and every user-facing string lives in i18n.js.
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

import {
  t,
  getLang,
  isRtl,
  defaultUnit,
  detectLang,
  readStoredLang,
  applyLanguage,
  initLangSwitch,
} from './i18n.js';

const el = (id) => document.getElementById(id);

let lastMode = null;

// Once someone picks a unit (or a shared link carries one), switching
// language must not override it. Until then Hebrew means kilometres.
let unitChosen = false;
let predictUnitChosen = false;

function init() {
  const params = new URLSearchParams(location.search);
  applyLanguage(startingLang(params));
  restoreFromUrl(params);
  refreshLanguage();

  const form = el('paceForm');
  form.addEventListener('input', onFormChange);
  form.addEventListener('change', onFormChange);
  form.addEventListener('click', onStepClick);
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
  initLangSwitch(onLanguageChange);
  registerServiceWorker();
}

function startingLang(params) {
  return detectLang({
    urlLang: params.get('lang'),
    storedLang: readStoredLang(),
    browserLangs: navigator.languages ?? [navigator.language],
  });
}

function onLanguageChange(lang) {
  if (!unitChosen) setUnit(defaultUnit(lang));
  if (!predictUnitChosen) el('predictUnit').value = defaultUnit(lang);
  refreshLanguage();
  renderPredictions();
}

// The strings that are built in JS rather than tagged in the markup.
function refreshLanguage() {
  for (const button of document.querySelectorAll('.step')) {
    const key = Number(button.dataset.step) < 0 ? 'step.dec' : 'step.inc';
    button.setAttribute('aria-label', t(key, { label: t(button.dataset.label) }));
  }
  for (const option of el('splitStrategy').options) {
    option.textContent = strategyLabel(Number(option.value));
  }
  render();
}

function strategyLabel(negativeSplit) {
  return negativeSplit > 0
    ? t('splits.negative', { percent: (negativeSplit * 100).toFixed(0) })
    : t('splits.even');
}

function onFormChange(event) {
  // Typing a custom distance should select the custom radio for you.
  if (event.target === el('customDistance')) {
    el('dist-custom').checked = true;
  }
  if (event.target.name === 'unit') unitChosen = true;
  render();
}

//
// The −/+ buttons nudge a slider by one and then behave exactly like a drag,
// so render() stays the single place that reacts to input.
//
function onStepClick(event) {
  const button = event.target.closest('.step');
  if (!button) return;
  const slider = el(button.dataset.target);
  const next = Number(slider.value) + Number(button.dataset.step);
  const clamped = Math.min(Number(slider.max), Math.max(Number(slider.min), next));
  if (clamped === Number(slider.value)) return;
  slider.value = clamped;
  slider.dispatchEvent(new Event('input', { bubbles: true }));
}

//
// Reading the form
//

function getUnit() {
  return el('unit-km').checked ? 'km' : 'mi';
}

function setUnit(unit) {
  el(unit === 'km' ? 'unit-km' : 'unit-mi').checked = true;
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
    radio.parentElement.querySelector('.distance-label').textContent =
      `${radio.dataset[unit]} ${unitLabel(unit)}`;
  }
  el('customUnitLabel').textContent = unitLabel(unit);
}

function unitLabel(unit) {
  return t(unit === 'km' ? 'unit.short.km' : 'unit.short.mi');
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
  showPace(paceSeconds, unit);

  el('timeCard').classList.toggle('is-result', mode === 'pace');
  el('paceCard').classList.toggle('is-result', mode === 'time');

  renderSplits(paceSeconds, distance, unit);
  writeUrl(mode, totalSeconds, paceSeconds);
}

// The unit is set smaller than the number so "10:59 Min/Mi" still fits half a
// phone screen.
function showPace(paceSeconds, unit) {
  const number = document.createElement('span');
  const suffix = document.createElement('span');
  number.className = 'num';
  suffix.className = 'unit';
  number.textContent = formatPace(paceSeconds);
  suffix.textContent = t('pace.unit', { unit });
  el('PaceValue').replaceChildren(number, ' ', suffix);
}

function renderSplits(paceSeconds, distance, unit) {
  const negativeSplit = Number(el('splitStrategy').value) || 0;
  const rows = splits(paceSeconds, distance, { negativeSplit });
  const body = el('splitsBody');

  el('splitsSummary').textContent = t('splits.summary', { count: rows.length, unit });
  el('splitsCaption').textContent = strategyLabel(negativeSplit);

  body.replaceChildren(
    ...rows.map((row) => {
      const tr = document.createElement('tr');
      const mark = document.createElement('td');
      const time = document.createElement('td');
      mark.textContent = row.partial
        ? t('splits.finish', { mark: row.mark, unit })
        : `${row.mark} ${unit}`;
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
// to do once it has role="tablist" on it. In Hebrew the tabs run right to
// left, so the arrows flip with them.
function onTabKey(event) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  event.preventDefault();
  const index = TABS.findIndex(({ tab }) => tab === event.currentTarget.id);
  const forward = (event.key === 'ArrowRight') !== isRtl();
  const step = forward ? 1 : -1;
  selectTab(TABS[(index + step + TABS.length) % TABS.length].tab);
}

//
// Predict & train
//

function initPredictor() {
  el('raceDistance').replaceChildren(
    ...RACE_DISTANCES.map((race) => new Option(raceLabel(race), String(race.meters))),
  );
  el('raceDistance').value = String(
    RACE_DISTANCES.find((race) => race.id === '10k').meters,
  );

  el('predictForm').addEventListener('input', renderPredictions);
  el('predictForm').addEventListener('change', (event) => {
    if (event.target === el('predictUnit')) predictUnitChosen = true;
    renderPredictions();
  });
  renderPredictions();
}

function raceLabel(race) {
  return t(`race.${race.id}`);
}

function renderPredictions() {
  // The <option>s are built here, so they are relabelled here too.
  for (const option of el('raceDistance').options) {
    const race = RACE_DISTANCES.find((r) => String(r.meters) === option.value);
    if (race) option.textContent = raceLabel(race);
  }

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
  const perUnitName = t('pace.per', { unit: unitLabel(unit) });
  const unitMeters = unit === 'mi' ? METERS_PER_MILE : 1000;

  el('predictBody').replaceChildren(
    ...predictAll(seconds, meters).map((race) => {
      const tr = document.createElement('tr');
      if (race.isSource) tr.className = 'is-source';
      tr.append(
        cell(race.isSource ? t('predict.yourRace', { label: raceLabel(race) }) : raceLabel(race)),
        cell(formatClock(race.seconds)),
        cell(`${formatPace(race.seconds / (race.meters / unitMeters))} ${perUnitName}`),
      );
      return tr;
    }),
  );

  const vdotValue = vdot(meters, seconds);
  el('vdotValue').textContent = vdotValue ? `— VDOT ${vdotValue.toFixed(1)}` : '';

  el('trainingBody').replaceChildren(
    ...trainingPaces(vdotValue).map((zone) => {
      const tr = document.createElement('tr');
      tr.append(
        cell(t(`zone.${zone.id}`)),
        cell(`${formatPace(perUnit(zone.secondsPerKm))} ${perUnitName}`),
      );
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
    lang: getLang(),
  });
  history.replaceState(null, '', `?${params}`);
}

function restoreFromUrl(params) {
  const urlUnit = params.get('u');
  if (urlUnit === 'km' || urlUnit === 'mi') {
    setUnit(urlUnit);
    unitChosen = true;
  } else {
    setUnit(defaultUnit());
  }
  el('predictUnit').value = defaultUnit();

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
    button.textContent = t('btn.shared');
  } catch {
    button.textContent = t('btn.shareFailed');
  }
  setTimeout(() => {
    button.textContent = t('btn.share');
  }, 2000);
}

//
// Entry point lives at the bottom so every const above it is initialised by
// the time init() runs — a call at the top hits the temporal dead zone.
//
// marathon-food.html has no calculator markup, only the language switch.
//
if (el('paceForm')) {
  init();
} else {
  applyLanguage(startingLang(new URLSearchParams(location.search)));
  initLangSwitch();
}
