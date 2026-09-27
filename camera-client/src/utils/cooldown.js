const lastMatchTime = {};
const COOLDOWN_MS = 15000;

export function canFire(label) {
  const now = Date.now();
  const last = lastMatchTime[label];

  if (last && now - last < COOLDOWN_MS) {
    return false;
  }

  lastMatchTime[label] = now;
  return true;
}