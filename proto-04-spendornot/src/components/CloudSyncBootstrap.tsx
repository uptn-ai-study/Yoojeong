import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function CloudSyncBootstrap() {
  const initializeFromCloud = useAppStore((s) => s.initializeFromCloud);
  const isCloudEnabled = useAppStore((s) => s.isCloudEnabled);

  useEffect(() => {
    if (!isCloudEnabled) return;
    void initializeFromCloud();
  }, [initializeFromCloud, isCloudEnabled]);

  return null;
}
