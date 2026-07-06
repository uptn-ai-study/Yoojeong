import { useNavigate } from 'react-router-dom';
import { Paragraph } from '@toss/tds-mobile';
import StatsQuickNav from '../components/StatsQuickNav';
import ScreenHeader from '../components/ScreenHeader';
import { BRAND_PRIMARY_COLOR } from '../constants/brand';
import { useAppStore } from '../store/useAppStore';
import type { Category } from '../types';
import { CATEGORIES } from '../types';
import { formatAmount, getCurrentMonth } from '../utils/format';
import { formatTodayLabel, formatWeekRangeLabel } from '../utils/dateRange';
import './StatsScreen.css';

export type StatsPeriod = 'daily' | 'weekly' | 'monthly';

interface StatsPeriodScreenProps {
  period: StatsPeriod;
}

function getTitle(period: StatsPeriod): string {
  if (period === 'daily') {
    return '오늘의 쓸까 말까 하다 안 쓴 내역';
  }

  if (period === 'weekly') {
    return '이번 주의 쓸까 말까 하다 안 쓴 내역';
  }

  return '이번 달의 쓸까 말까 하다 안 쓴 내역';
}

function getSubtitle(period: StatsPeriod): string {
  if (period === 'daily') {
    return formatTodayLabel();
  }

  if (period === 'weekly') {
    return formatWeekRangeLabel();
  }

  return `${getCurrentMonth()}월`;
}

export default function StatsPeriodScreen({ period }: StatsPeriodScreenProps) {
  const navigate = useNavigate();
  const getDailyTotal = useAppStore((s) => s.getDailyTotal);
  const getDailyCategoryTotal = useAppStore((s) => s.getDailyCategoryTotal);
  const getMonthlyTotal = useAppStore((s) => s.getMonthlyTotal);
  const getMonthlyCategoryTotal = useAppStore((s) => s.getMonthlyCategoryTotal);

  const title = getTitle(period);
  const subtitle = getSubtitle(period);

  const total = period === 'daily' ? getDailyTotal() : getMonthlyTotal();

  const getCategoryTotal = (category: Category) => {
    if (period === 'daily') return getDailyCategoryTotal(category);
    return getMonthlyCategoryTotal(category);
  };

  return (
    <div className="screen stats-screen">
      <ScreenHeader
        title={title}
        titleFit
        subtitle={subtitle}
        onClose={() => navigate('/home')}
      />

      <div className="stats-screen__body">
        <StatsQuickNav />

        <section className="stats-screen__total-card" style={{ backgroundColor: BRAND_PRIMARY_COLOR }}>
          <Paragraph.Text
            typography="t1"
            fontWeight="bold"
            color="#ffffff"
            className="stats-screen__total-amount"
          >
            {formatAmount(total)}원
          </Paragraph.Text>
        </section>

        <section className="stats-screen__list-section">
          <ul className="stats-screen__list">
            {CATEGORIES.map((category) => {
              const amount = getCategoryTotal(category);
              return (
                <li key={category} className="stats-screen__list-item">
                  <Paragraph.Text typography="t5" fontWeight="semibold">
                    {category}
                  </Paragraph.Text>
                  <Paragraph.Text typography="t5" fontWeight="bold">
                    {formatAmount(amount)}원
                  </Paragraph.Text>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
