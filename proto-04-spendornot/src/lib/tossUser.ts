import { getAnonymousKey } from '@apps-in-toss/web-framework';

const DEV_KEY_STORAGE = 'spendornot-dev-toss-user-key';

function getDevTossUserKey(): string {
  const existing = localStorage.getItem(DEV_KEY_STORAGE);
  if (existing) return existing;

  const devKey = `dev-${crypto.randomUUID()}`;
  localStorage.setItem(DEV_KEY_STORAGE, devKey);
  return devKey;
}

export async function resolveTossUserKey(): Promise<string> {
  try {
    const result = await getAnonymousKey();
    if (result && result !== 'ERROR' && result.type === 'HASH' && result.hash) {
      return result.hash;
    }
  } catch {
    // 브라우저 개발 환경 등 토스 브릿지가 없을 때 로컬 키 사용
  }

  return getDevTossUserKey();
}
