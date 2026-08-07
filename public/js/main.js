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

const el = (id) => document.getElementById(id);

let lastMode = null;

// marathon-food.html loads this script too. Without this guard the module
// throws on any page that has no calculator markup.
if (el('paceForm')) {
  init();
}

function init() {
  restoreFromUrl();
  render();

  const form = el('paceForm');
  form.addEventListener('input', onFormChange);
  form.addEventListener('change', onFormChange);
  el('shareBtn').addEventListener('click', share);
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
  const rows = splits(paceSeconds, distance);
  const body = el('splitsBody');
  el('splitsSummary').textContent = `Splits (${rows.length} × ${unit})`;

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
