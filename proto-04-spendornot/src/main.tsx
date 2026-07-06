import './polyfills/setupTossBridgeDev';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import SafeAreaSync from './components/SafeAreaSync';
import CloudSyncBootstrap, { markAppResetPending } from './components/CloudSyncBootstrap';
import App from './App';
import { useAppStore } from './store/useAppStore';
import { isSupabaseConfigured } from './lib/supabase';
import { BRAND_PRIMARY_COLOR } from './constants/brand';
import './styles/global.css';

if (new URLSearchParams(window.location.search).get('reset') === '1') {
  localStorage.removeItem('spendornot-storage');
  localStorage.removeItem('spendornot-dev-toss-user-key');
  markAppResetPending();
  window.history.replaceState({}, '', window.location.pathname);
}

const shouldSeedJune =
  new URLSearchParams(window.location.search).get('seed') === '1' ||
  (import.meta.env.DEV && !isSupabaseConfigured());

if (shouldSeedJune) {
  useAppStore.persist.onFinishHydration(() => {
    useAppStore.getState().seedJuneTestData();
  });

  if (useAppStore.persist.hasHydrated()) {
    useAppStore.getState().seedJuneTestData();
  }
}

if (new URLSearchParams(window.location.search).get('seed') === '1') {
  window.history.replaceState({}, '', window.location.pathname);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TDSMobileAITProvider brandPrimaryColor={BRAND_PRIMARY_COLOR}>
      <SafeAreaSync />
      <CloudSyncBootstrap />
      <App />
    </TDSMobileAITProvider>
  </StrictMode>,
);
