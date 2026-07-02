import { Navigate } from 'react-router-dom';
import StatsPeriodScreen from './StatsPeriodScreen';

export default function StatsScreen() {
  return <Navigate to="/stats/monthly" replace />;
}

export { StatsPeriodScreen };
