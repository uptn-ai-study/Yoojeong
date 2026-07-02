import { useNavigate } from 'react-router-dom';
import { Paragraph } from '@toss/tds-mobile';
import ScreenHeader from '../components/ScreenHeader';
import { BRAND_PRIMARY_COLOR } from '../constants/brand';
import { useAppStore } from '../store/useAppStore';
import { formatAmount } from '../utils/format';
import './MonthlyChartScreen.css';

export default function MonthlyChartScreen() {
  const navigate = useNavigate();
  const getMonthlyStatsHistory = useAppStore((s) => s.getMonthlyStatsHistory);
  const getTotalAmount = useAppStore((s) => s.getTotalAmount);

  const monthlyStats = getMonthlyStatsHistory();
  const maxTotal = Math.max(...monthlyStats.map((item) => item.total), 1);
  const allTimeTotal = getTotalAmount();

  return (
    <div className="screen monthly-chart-screen">
      <ScreenHeader
        title={
          <>
            월별 아낀 돈
            <br />
            통계 그래프
          </>
        }
        onBack={() => navigate('/stats/monthly')}
      />

      <section className="monthly-chart-screen__summary" style={{ backgroundColor: BRAND_PRIMARY_COLOR }}>
        <Paragraph.Text
          typography="t6"
          color="#ffffff"
          className="monthly-chart-screen__summary-label"
          style={{ opacity: 0.85 }}
        >
          누적 총합
        </Paragraph.Text>
        <Paragraph.Text
          typography="t2"
          fontWeight="bold"
          color="#ffffff"
          className="monthly-chart-screen__summary-amount"
        >
          {formatAmount(allTimeTotal)}원
        </Paragraph.Text>
      </section>

      {monthlyStats.length === 0 ? (
        <Paragraph.Text typography="t5" color="adaptive-grey-600" className="monthly-chart-screen__empty">
          아직 기록된 월별 데이터가 없어요.
        </Paragraph.Text>
      ) : (
        <section className="monthly-chart-screen__chart" aria-label="월별 아낀 돈 그래프">
          <div className="monthly-chart-screen__bars">
            {monthlyStats.map((item) => {
              const heightPercent = Math.max((item.total / maxTotal) * 100, 4);
              return (
                <div key={item.key} className="monthly-chart-screen__bar-item">
                  <Paragraph.Text
                    typography="t7"
                    fontWeight="semibold"
                    color="adaptive-grey-600"
                    className="monthly-chart-screen__bar-amount"
                  >
                    {formatAmount(item.total)}
                  </Paragraph.Text>
                  <div className="monthly-chart-screen__bar-track">
                    <div
                      className="monthly-chart-screen__bar-fill"
                      style={{ height: `${heightPercent}%`, backgroundColor: BRAND_PRIMARY_COLOR }}
                    />
                  </div>
                  <Paragraph.Text typography="t7" fontWeight="semibold" className="monthly-chart-screen__bar-label">
                    {item.label}
                  </Paragraph.Text>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
