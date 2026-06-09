const API_PATH = '/api/rankings';

export async function fetchRankings() {
  try {
    const res = await fetch(API_PATH);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function submitRankingScore(id, score) {
  try {
    const res = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, score }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
