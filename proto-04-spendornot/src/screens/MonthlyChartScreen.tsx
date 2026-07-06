import { useNavigate } from 'react-router-dom';
import { Paragraph } from '@toss/tds-mobile';
import ScreenHeader from '../components/ScreenHeader';
import { BRAND_PRIMARY_COLOR } from '../constants/brand';
import { useAppStore } from '../store/useAppStore';
import { formatAmount } from '../utils/format';
import './StatsScreen.css';
import './MonthlyChartScreen.css';

export default function MonthlyChartScreen() {
  const navigate = useNavigate();
  const getMonthlyStatsHistory = useAppStore((s) => s.getMonthlyStatsHistory);
  const getTotalAmount = useAppStore((s) => s.getTotalAmount);

  const monthlyStats = getMonthlyStatsHistory();
  const maxTotal = Math.max(...monthlyStats.map((item) => item.total), 1);
  const allTimeTotal = getTotalAmount();

  return (
    <div className="screen stats-screen monthly-chart-screen">
      <ScreenHeader
        title="월별 아낀 돈 통계 그래프"
        titleFit
        onClose={() => navigate('/home')}
      />

      <div className="stats-screen__body">
        <section className="stats-screen__total-card" style={{ backgroundColor: BRAND_PRIMARY_COLOR }}>
          <Paragraph.Text
            typography="t1"
            fontWeight="bold"
            color="#ffffff"
            className="stats-screen__total-amount"
          >
            {formatAmount(allTimeTotal)}원
          </Paragraph.Text>
        </section>

        {monthlyStats.length === 0 ? (
          <Paragraph.Text typography="t5" color="adaptive-grey-600" className="monthly-chart-screen__empty">
            아직 기록된 월별 데이터가 없어요.
          </Paragraph.Text>
        ) : (
          <section className="stats-screen__list-section">
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
          </section>
        )}
      </div>
    </div>
  );
}
