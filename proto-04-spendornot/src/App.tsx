import { type ReactNode, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import IntroScreen from './screens/IntroScreen';
import SplashScreen from './screens/SplashScreen';
import RecordScreen from './screens/RecordScreen';
import StatsScreen from './screens/StatsScreen';
import StatsPeriodScreen from './screens/StatsPeriodScreen';
import MonthlyChartScreen from './screens/MonthlyChartScreen';
import { useAppStore } from './store/useAppStore';

const SPLASH_DURATION_MS = 2000;

function SplashGate({ children }: { children: ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  navigateRef.current = navigate;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDone(true);
      navigateRef.current('/home', { replace: true });
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  if (!splashDone) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

function ProtectedStats({ children }: { children: ReactNode }) {
  const hasSeenIntro = useAppStore((s) => s.hasSeenIntro);
  const hasSetNickname = useAppStore((s) => s.hasSetNickname);

  if (!hasSeenIntro) return <Navigate to="/intro" replace />;
  if (!hasSetNickname) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const hasSeenIntro = useAppStore((s) => s.hasSeenIntro);
  const hasSetNickname = useAppStore((s) => s.hasSetNickname);

  return (
    <Routes>
      <Route
        path="/"
        element={hasSeenIntro ? <Navigate to="/home" replace /> : <IntroScreen />}
      />
      <Route path="/splash" element={<Navigate to="/" replace />} />
      <Route
        path="/intro"
        element={hasSeenIntro ? <Navigate to="/home" replace /> : <IntroScreen />}
      />
      <Route
        path="/home"
        element={
          hasSeenIntro ? <HomeScreen /> : <Navigate to="/intro" replace />
        }
      />
      <Route
        path="/record"
        element={
          hasSeenIntro && hasSetNickname ? (
            <RecordScreen />
          ) : (
            <Navigate to={hasSeenIntro ? '/home' : '/intro'} replace />
          )
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedStats>
            <StatsScreen />
          </ProtectedStats>
        }
      />
      <Route
        path="/stats/daily"
        element={
          <ProtectedStats>
            <StatsPeriodScreen period="daily" />
          </ProtectedStats>
        }
      />
      <Route
        path="/stats/weekly"
        element={
          <ProtectedStats>
            <StatsPeriodScreen period="weekly" />
          </ProtectedStats>
        }
      />
      <Route
        path="/stats/monthly"
        element={
          <ProtectedStats>
            <StatsPeriodScreen period="monthly" />
          </ProtectedStats>
        }
      />
      <Route
        path="/stats/monthly-chart"
        element={
          <ProtectedStats>
            <MonthlyChartScreen />
          </ProtectedStats>
        }
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <SplashGate>
        <AppRoutes />
      </SplashGate>
    </BrowserRouter>
  );
}
