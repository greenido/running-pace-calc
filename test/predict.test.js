import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatClock, formatPace, parseClock } from '../public/js/pace.js';
import {
  RACE_DISTANCES,
  riegel,
  predictAll,
  vdot,
  trainingPaces,
  perKmToPerMile,
} from '../public/js/predict.js';

const meters = (id) => RACE_DISTANCES.find((r) => r.id === id).meters;

test('riegel scales a 10K up to a marathon', () => {
  // 45:00 10K -> marathon. (42195/10000)^1.06 = 4.6006, so 2700s * 4.6006.
  const predicted = riegel(parseClock('45:00'), meters('10k'), meters('marathon'));
  assert.equal(formatClock(predicted), '03:27:01');
});

test('riegel scales down as well as up', () => {
  // 0.5^1.06 = 0.4796
  const fiveK = riegel(parseClock('45:00'), meters('10k'), meters('5k'));
  assert.equal(formatClock(fiveK), '00:21:35');
});

test('riegel returns the same time for the same distance', () => {
  const same = riegel(parseClock('45:00'), meters('10k'), meters('10k'));
  assert.equal(Math.round(same), parseClock('45:00'));
});

test('riegel rejects zero and negative input', () => {
  assert.equal(riegel(0, 10000, 42195), null);
  assert.equal(riegel(2700, 0, 42195), null);
  assert.equal(riegel(2700, 10000, -1), null);
});

test('predictAll covers every distance and flags the source', () => {
  const rows = predictAll(parseClock('45:00'), meters('10k'));
  assert.equal(rows.length, RACE_DISTANCES.length);

  const source = rows.filter((r) => r.isSource);
  assert.equal(source.length, 1);
  assert.equal(source[0].id, '10k');

  // Times must increase with distance.
  const times = rows.map((r) => r.seconds);
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
});

// Daniels' published VDOT table gives 45:16 for a 10K at VDOT 45, 19:57 for
// a 5K at VDOT 50, and a marathon just under 2:56 at VDOT 55.
test('vdot matches the published tables within a point', () => {
  assert.ok(Math.abs(vdot(meters('10k'), parseClock('45:00')) - 45) < 1);
  assert.ok(Math.abs(vdot(meters('marathon'), parseClock('2:59:00')) - 54) < 1.5);
  assert.ok(Math.abs(vdot(meters('5k'), parseClock('20:00')) - 50) < 1);
});

test('vdot rises as the same distance is run faster', () => {
  const slower = vdot(meters('10k'), parseClock('50:00'));
  const faster = vdot(meters('10k'), parseClock('40:00'));
  assert.ok(faster > slower);
});

test('vdot rejects unusable input', () => {
  assert.equal(vdot(0, 2700), null);
  assert.equal(vdot(10000, 0), null);
  assert.equal(vdot(10000, NaN), null);
});

test('training paces are ordered from easy to fastest', () => {
  const paces = trainingPaces(vdot(meters('10k'), parseClock('45:00')));
  assert.equal(paces.length, 5);

  const seconds = paces.map((p) => p.secondsPerKm);
  // Slower zones take more seconds per km, so the list descends.
  assert.deepEqual(seconds, [...seconds].sort((a, b) => b - a));
});

test('training paces sit either side of the race that produced them', () => {
  // A 45:00 10K is 4:30/km. Easy must be slower, interval faster.
  const paces = trainingPaces(vdot(meters('10k'), parseClock('45:00')));
  const byId = Object.fromEntries(paces.map((p) => [p.id, p.secondsPerKm]));

  assert.ok(byId.easy > 270, 'easy pace should be slower than 4:30/km');
  assert.ok(byId.interval < 270, 'interval pace should be faster than 4:30/km');
  // Daniels puts threshold for VDOT 45 at about 4:41/km.
  assert.equal(formatPace(byId.threshold), '4:37');
});

test('trainingPaces returns nothing rather than throwing on bad vdot', () => {
  assert.deepEqual(trainingPaces(0), []);
  assert.deepEqual(trainingPaces(null), []);
});

test('perKmToPerMile stretches the pace by the right factor', () => {
  assert.equal(formatPace(perKmToPerMile(270)), '7:15');
  assert.equal(perKmToPerMile(0), null);
});
