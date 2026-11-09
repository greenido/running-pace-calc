//
// Pure pace math — no DOM in here, so it can be unit tested directly.
//
// @Author: Ido
// @date: April 2019
//

//
// Seconds are the single internal currency. Everything is rounded to whole
// seconds *before* being split into minutes/seconds, which is what keeps a
// 7.999 min/mi pace rendering as "8:00" instead of "7:60".
//

//
// "3:30:00" -> 12600, "4:59" -> 299, "45" -> 45. Returns null on junk.
//
export function parseClock(text) {
  if (typeof text !== 'string') return null;
  const parts = text.trim().split(':');
  if (parts.length === 0 || parts.length > 3) return null;

  let total = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    total = total * 60 + Number(part);
  }
  return total;
}

//
// 12600 -> "03:30:00"
//
export function formatClock(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '--:--:--';
  const total = Math.round(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

//
// 481 -> "8:01". Minutes are not padded — runners write "8:01", not "08:01".
//
export function formatPace(secondsPerUnit) {
  if (!Number.isFinite(secondsPerUnit) || secondsPerUnit < 0) return '--:--';
  const total = Math.round(secondsPerUnit);
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
}

export function paceFromTime(totalSeconds, distance) {
  if (!isUsable(totalSeconds) || !isUsable(distance) || distance <= 0) return null;
  return totalSeconds / distance;
}

export function timeFromPace(secondsPerUnit, distance) {
  if (!isUsable(secondsPerUnit) || !isUsable(distance) || distance <= 0) return null;
  return secondsPerUnit * distance;
}

//
// Cumulative split times at each whole mile/km, plus the final partial leg
// (a marathon ends on 42.2, so the last row is the 0.2).
//
// `negativeSplit` is the fraction faster the second half is run — 0.02 means
// the back half is 2% quicker than the front. The finish time is held fixed,
// so the first half slows to pay for it. Zero gives even pace.
//
export function splits(secondsPerUnit, distance, { negativeSplit = 0 } = {}) {
  if (!isUsable(secondsPerUnit) || !isUsable(distance) || distance <= 0) return [];
  if (!Number.isFinite(negativeSplit) || negativeSplit <= -1 || negativeSplit >= 1) return [];

  const elapsedAt = splitSchedule(secondsPerUnit, distance, negativeSplit);

  // Each row's pace is the time since the previous mark over the distance
  // covered, so the short final row is not reported as a full unit's pace.
  const rows = [];
  let prevMark = 0;
  let prevElapsed = 0;
  const push = (mark, at, partial) => {
    const cumulative = elapsedAt(at);
    rows.push({ mark, cumulative, pace: (cumulative - prevElapsed) / (at - prevMark), partial });
    prevMark = at;
    prevElapsed = cumulative;
  };

  const whole = Math.floor(distance);
  for (let mark = 1; mark <= whole; mark++) push(mark, mark, false);

  // Guard against float noise: 42.2 - 42 is 0.19999999999999574.
  if (distance - whole > 0.001) push(round1(distance), distance, true);
  return rows;
}

//
// Solving total = firstPace*(D/2) + secondPace*(D/2) with
// secondPace = firstPace*(1 - negativeSplit) gives the front-half pace.
//
function splitSchedule(secondsPerUnit, distance, negativeSplit) {
  const total = secondsPerUnit * distance;
  const half = distance / 2;
  const firstPace = (2 * total) / (distance * (2 - negativeSplit));
  const secondPace = firstPace * (1 - negativeSplit);

  return (covered) =>
    covered <= half ? firstPace * covered : firstPace * half + secondPace * (covered - half);
}

function isUsable(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
