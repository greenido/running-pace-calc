import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseClock,
  formatClock,
  formatPace,
  paceFromTime,
  timeFromPace,
  splits,
} from '../public/js/pace.js';

test('parseClock reads h:mm:ss, m:ss and bare seconds', () => {
  assert.equal(parseClock('3:30:00'), 12600);
  assert.equal(parseClock('4:59'), 299);
  assert.equal(parseClock('45'), 45);
  assert.equal(parseClock(' 3:30:00 '), 12600);
});

test('parseClock rejects junk instead of returning NaN', () => {
  assert.equal(parseClock('abc'), null);
  assert.equal(parseClock('1:2:3:4'), null);
  assert.equal(parseClock('-5'), null);
  assert.equal(parseClock(''), null);
  assert.equal(parseClock(undefined), null);
});

test('formatClock zero-pads every field', () => {
  assert.equal(formatClock(12600), '03:30:00');
  assert.equal(formatClock(0), '00:00:00');
  assert.equal(formatClock(59), '00:00:59');
});

test('formatPace does not pad the minutes', () => {
  assert.equal(formatPace(481), '8:01');
  assert.equal(formatPace(299), '4:59');
  assert.equal(formatPace(0), '0:00');
});

// This is the bug the original code guarded against with a `== 60` check.
// Rounding to whole seconds before the divmod removes the special case.
test('formatPace carries 60 seconds into the next minute', () => {
  assert.equal(formatPace(479.6), '8:00');
  assert.equal(formatPace(7.999 * 60), '8:00');
  assert.notEqual(formatPace(479.6), '7:60');
});

test('paceFromTime matches known race paces', () => {
  // 3:30:00 marathon in miles
  assert.equal(formatPace(paceFromTime(12600, 26.2)), '8:01');
  // the same race in kilometres
  assert.equal(formatPace(paceFromTime(12600, 42.2)), '4:59');
});

test('paceFromTime refuses zero, negative and missing distance', () => {
  assert.equal(paceFromTime(12600, 0), null);
  assert.equal(paceFromTime(12600, -1), null);
  assert.equal(paceFromTime(12600, undefined), null);
  assert.equal(paceFromTime(12600, NaN), null);
});

test('timeFromPace is the inverse of paceFromTime', () => {
  const pace = paceFromTime(12600, 42.2);
  assert.equal(Math.round(timeFromPace(pace, 42.2)), 12600);
  // 299 s/km over 42.2 km is 12617.8s — a hair over the 3:30:00 it was derived
  // from, because "4:59" is the rounded pace.
  assert.equal(formatClock(timeFromPace(parseClock('4:59'), 42.2)), '03:30:18');
});

test('splits produce a row per whole unit plus the final partial', () => {
  const rows = splits(paceFromTime(12600, 42.2), 42.2);
  assert.equal(rows.length, 43); // 42 whole km + the 0.2
  assert.equal(rows[0].mark, 1);
  assert.equal(formatClock(rows[0].cumulative), '00:04:59');

  const last = rows.at(-1);
  assert.equal(last.mark, 42.2);
  assert.equal(last.partial, true);
  assert.equal(formatClock(last.cumulative), '03:30:00');
});

test('each split carries its own pace, the short final row included', () => {
  const pace = paceFromTime(12600, 42.2);
  const rows = splits(pace, 42.2);
  for (const row of rows) assert.ok(Math.abs(row.pace - pace) < 1e-9, `row ${row.mark}`);
  // The 0.2 km tail takes ~60s, but its pace is still per whole km.
  assert.equal(formatPace(rows.at(-1).pace), formatPace(pace));
});

test('a negative split shows a slower front half and a faster back half', () => {
  const pace = paceFromTime(parseClock('3:30:00'), 42.2);
  const rows = splits(pace, 42.2, { negativeSplit: 0.04 });
  assert.ok(rows[0].pace > pace, 'first km slower than average');
  assert.ok(rows.at(-2).pace < pace, 'last whole km faster than average');
  // Back-half pace is exactly 4% under front-half pace.
  assert.ok(Math.abs(rows.at(-2).pace / rows[0].pace - 0.96) < 1e-9);
});

test('splits omit the partial row on a whole-number distance', () => {
  const rows = splits(paceFromTime(3600, 10), 10);
  assert.equal(rows.length, 10);
  assert.equal(rows.every((r) => !r.partial), true);
});

test('splits return nothing rather than throwing on bad input', () => {
  assert.deepEqual(splits(300, 0), []);
  assert.deepEqual(splits(NaN, 42.2), []);
});

test('a negative split holds the finish time but reorders the effort', () => {
  const pace = paceFromTime(parseClock('3:30:00'), 42.2);
  const even = splits(pace, 42.2);
  const negative = splits(pace, 42.2, { negativeSplit: 0.02 });

  // Same race, same finish.
  assert.equal(formatClock(even.at(-1).cumulative), '03:30:00');
  assert.equal(formatClock(negative.at(-1).cumulative), '03:30:00');

  // The first half is given away and the second half takes it back.
  assert.ok(negative[20].cumulative > even[20].cumulative, 'front half is slower');
});

test('negative split zero is identical to even pacing', () => {
  const pace = paceFromTime(parseClock('3:30:00'), 42.2);
  assert.deepEqual(splits(pace, 42.2, { negativeSplit: 0 }), splits(pace, 42.2));
});

test('splits reject a nonsensical split bias', () => {
  const pace = paceFromTime(parseClock('3:30:00'), 42.2);
  assert.deepEqual(splits(pace, 42.2, { negativeSplit: 1 }), []);
  assert.deepEqual(splits(pace, 42.2, { negativeSplit: NaN }), []);
});
