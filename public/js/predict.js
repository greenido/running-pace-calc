//
// Race prediction and training paces. Pure functions, no DOM.
//
// Two independent models live here:
//
//   * Riegel's endurance formula, for "I ran X, what should Y take?"
//   * The Daniels/Gilbert VO2 model, for turning a race result into
//     training paces.
//
// Both are estimates. They assume trained-for distances and ignore terrain,
// heat and how the taper went.
//

// Official distances, in metres.
export const RACE_DISTANCES = [
  { id: '5k', label: '5K', meters: 5000 },
  { id: '10k', label: '10K', meters: 10000 },
  { id: '15k', label: '15K', meters: 15000 },
  { id: 'half', label: 'Half Marathon', meters: 21097.5 },
  { id: 'marathon', label: 'Marathon', meters: 42195 },
  { id: '50k', label: '50K', meters: 50000 },
  { id: '50mi', label: '50 Miles', meters: 80467 },
  { id: '100k', label: '100K', meters: 100000 },
  { id: '100mi', label: '100 Miles', meters: 160934 },
];

//
// Riegel: T2 = T1 * (D2/D1)^1.06
//
// The 1.06 exponent is the published average. It is optimistic when
// extrapolating a long way up — a marathon predicted off a 5K assumes
// marathon-specific endurance the 5K never tested.
//
export function riegel(timeSeconds, fromMeters, toMeters, exponent = 1.06) {
  if (!positive(timeSeconds) || !positive(fromMeters) || !positive(toMeters)) return null;
  return timeSeconds * (toMeters / fromMeters) ** exponent;
}

export function predictAll(timeSeconds, fromMeters, exponent = 1.06) {
  if (!positive(timeSeconds) || !positive(fromMeters)) return [];
  return RACE_DISTANCES.map((race) => ({
    ...race,
    seconds: riegel(timeSeconds, fromMeters, race.meters, exponent),
    isSource: Math.abs(race.meters - fromMeters) < 1,
  }));
}

//
// VDOT — an effective VO2max read off a race result.
//
export function vdot(distanceMeters, timeSeconds) {
  if (!positive(distanceMeters) || !positive(timeSeconds)) return null;

  const minutes = timeSeconds / 60;
  const velocity = distanceMeters / minutes; // metres per minute

  // Fraction of VO2max sustainable for a race of this duration.
  const fraction =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * minutes) +
    0.2989558 * Math.exp(-0.1932605 * minutes);

  return oxygenCost(velocity) / fraction;
}

// Daniels/Gilbert: the oxygen cost of running at a given velocity.
function oxygenCost(velocity) {
  return -4.6 + 0.182258 * velocity + 0.000104 * velocity ** 2;
}

// The same curve solved the other way — what velocity costs this much oxygen.
function velocityForCost(cost) {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - cost;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  return (-b + Math.sqrt(discriminant)) / (2 * a);
}

// Percentages of VDOT that each training zone is run at.
const ZONES = [
  { id: 'easy', label: 'Easy / Long', percent: 0.7 },
  { id: 'marathon', label: 'Marathon', percent: 0.84 },
  { id: 'threshold', label: 'Threshold / Tempo', percent: 0.88 },
  { id: 'interval', label: 'Interval', percent: 0.98 },
  { id: 'repetition', label: 'Repetition', percent: 1.06 },
];

//
// Training paces, in seconds per kilometre.
//
export function trainingPaces(vdotValue) {
  if (!positive(vdotValue)) return [];

  return ZONES.map((zone) => {
    const velocity = velocityForCost(vdotValue * zone.percent);
    return {
      ...zone,
      secondsPerKm: velocity && velocity > 0 ? 1000 / velocity * 60 : null,
    };
  });
}

export const METERS_PER_MILE = 1609.34;

export function perKmToPerMile(secondsPerKm) {
  if (!positive(secondsPerKm)) return null;
  return secondsPerKm * (METERS_PER_MILE / 1000);
}

function positive(n) {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}
