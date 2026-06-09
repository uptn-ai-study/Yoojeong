export const TOP_N = 10;
export const MAX_STORED = 100;
export const TABLE_NAME = 'iconhunt_rankings';

/** 최초 실행 시 TOP 10이 비어 보이지 않도록 하는 목업 데이터 */
export const DEMO_RANKINGS = [
  { id: 'VioletBear', score: 12_480, timestamp: 1 },
  { id: 'CoralFox', score: 11_920, timestamp: 2 },
  { id: 'TealOwl', score: 10_650, timestamp: 3 },
  { id: 'AmberTiger', score: 9_840, timestamp: 4 },
  { id: 'IndigoHare', score: 8_720, timestamp: 5 },
  { id: 'JadeKoala', score: 7_560, timestamp: 6 },
  { id: 'ScarletDuck', score: 6_430, timestamp: 7 },
  { id: 'AzureLynx', score: 5_290, timestamp: 8 },
  { id: 'GoldenPanda', score: 4_150, timestamp: 9 },
  { id: 'CrimsonWolf', score: 3_080, timestamp: 10 },
];

export function sortByScore(entries) {
  return [...entries].sort((a, b) => b.score - a.score || (b.timestamp ?? 0) - (a.timestamp ?? 0));
}

export function topN(entries, n = TOP_N) {
  return sortByScore(entries).slice(0, n);
}

export function validatePlayerId(id) {
  return typeof id === 'string' && /^[A-Za-z]{4,24}$/.test(id);
}

export function validateScore(score) {
  return (
    typeof score === 'number' &&
    Number.isFinite(score) &&
    score > 0 &&
    score <= 99_999_999
  );
}

export function upsertScore(entries, id, score) {
  if (!validatePlayerId(id) || !validateScore(score)) return null;

  const prev = entries.find((e) => e.id === id);
  const bestScore = Math.max(score, prev?.score ?? 0);
  if (prev && bestScore === prev.score) return null;

  const entry = {
    id,
    score: bestScore,
    timestamp: Date.now(),
  };

  return sortByScore([
    ...entries.filter((e) => e.id !== id),
    entry,
  ]).slice(0, MAX_STORED);
}

export function seedIfEmpty(entries) {
  if (entries && entries.length > 0) return entries;
  return [...DEMO_RANKINGS];
}
