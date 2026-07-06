import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

const RESET_FLAG = 'spendornot-reset';

export function markAppResetPending(): void {
  sessionStorage.setItem(RESET_FLAG, '1');
}

export function consumeAppResetPending(): boolean {
  if (sessionStorage.getItem(RESET_FLAG) !== '1') {
    return false;
  }
  sessionStorage.removeItem(RESET_FLAG);
  return true;
}

export default function CloudSyncBootstrap() {
  const initializeFromCloud = useAppStore((s) => s.initializeFromCloud);
  const resetAppData = useAppStore((s) => s.resetAppData);
  const isCloudEnabled = useAppStore((s) => s.isCloudEnabled);

  useEffect(() => {
    if (consumeAppResetPending()) {
      void resetAppData();
      return;
    }

    if (!isCloudEnabled) return;
    void initializeFromCloud();
  }, [initializeFromCloud, isCloudEnabled, resetAppData]);

  return null;
}
