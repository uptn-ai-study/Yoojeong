import { useLocation, useNavigate } from 'react-router-dom';
import { SegmentedControl } from '@toss/tds-mobile';
import './StatsQuickNav.css';

const NAV_ITEMS = [
  { to: '/stats/daily', value: 'daily', label: '오늘' },
  { to: '/stats/weekly', value: 'weekly', label: '이번 주' },
  { to: '/stats/monthly', value: 'monthly', label: '이번 달' },
] as const;

export default function StatsQuickNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const current =
    NAV_ITEMS.find((item) => location.pathname === item.to)?.value ?? 'monthly';

  return (
    <nav className="stats-quick-nav" aria-label="통계 기간 바로가기">
      <SegmentedControl
        size="large"
        value={current}
        onChange={(value) => {
          const item = NAV_ITEMS.find((navItem) => navItem.value === value);
          if (item) {
            navigate(item.to);
          }
        }}
      >
        {NAV_ITEMS.map((item) => (
          <SegmentedControl.Item key={item.value} value={item.value}>
            {item.label}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
    </nav>
  );
}
