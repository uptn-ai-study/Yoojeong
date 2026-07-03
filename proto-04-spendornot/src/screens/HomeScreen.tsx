import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Paragraph } from '@toss/tds-mobile';
import AppFixedBottomCTA from '../components/AppFixedBottomCTA';
import NicknameModal from '../components/NicknameModal';
import { useAppStore } from '../store/useAppStore';
import { formatAmount, getCurrentMonth } from '../utils/format';
import { getLevelImage } from '../utils/level';
import './HomeScreen.css';

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.12L16.62 5.5a1.5 1.5 0 0 0-2.12 0L4 16v4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="12" width="4" height="8" rx="1" fill="currentColor" />
      <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" />
      <rect x="16" y="4" width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const userName = useAppStore((s) => s.user?.name ?? '');
  const hasSetNickname = useAppStore((s) => s.hasSetNickname ?? false);
  const setHasSeenIntro = useAppStore((s) => s.setHasSeenIntro);
  const viewMode = useAppStore((s) => s.viewMode ?? 'bill');
  const toggleViewMode = useAppStore((s) => s.toggleViewMode);
  const monthlyAmount = useAppStore((s) => s.getMonthlyTotal());

  const [showNicknameModal, setShowNicknameModal] = useState(() => !hasSetNickname);
  const [showEditNicknameModal, setShowEditNicknameModal] = useState(false);

  const handleNicknameComplete = () => {
    setShowNicknameModal(false);
  };

  const handleNicknameCancel = () => {
    setHasSeenIntro(false);
    navigate('/intro', { replace: true });
  };

  const handleEditNicknameComplete = () => {
    setShowEditNicknameModal(false);
  };

  const displayName = userName;
  const imageSrc = getLevelImage(monthlyAmount, viewMode);
  const month = getCurrentMonth();

  return (
    <div className="screen home-screen screen--fixed-bottom-cta">
      {showNicknameModal && (
        <NicknameModal
          mode="initial"
          onComplete={handleNicknameComplete}
          onCancel={handleNicknameCancel}
        />
      )}

      {showEditNicknameModal && (
        <NicknameModal
          mode="edit"
          initialValue={userName}
          onComplete={handleEditNicknameComplete}
          onCancel={() => setShowEditNicknameModal(false)}
        />
      )}

      <div className="home-screen__image-wrap" aria-hidden="true">
        <img src={imageSrc} alt="" className="home-screen__image" />
      </div>

      <header className="home-screen__header">
        <div className="home-screen__header-actions">
          <Button
            type="button"
            size="medium"
            variant="weak"
            color="dark"
            className="home-screen__stats-btn"
            onClick={() => navigate('/stats/monthly')}
            aria-label="통계 보기"
          >
            <StatsIcon />
          </Button>
          <Button type="button" size="medium" variant="weak" color="dark" onClick={toggleViewMode}>
            {viewMode === 'bill' ? '어항 모드' : '지폐 모드'}
          </Button>
        </div>

        <div className="home-screen__copy">
          <Paragraph.Text typography="t1" fontWeight="bold" className="home-screen__month">
            {month}월
          </Paragraph.Text>
          <div className="home-screen__title">
            <Paragraph.Text typography="t4" fontWeight="bold" className="home-screen__name-row">
              <span>{displayName}님의</span>
              {hasSetNickname && (
                <button
                  type="button"
                  className="home-screen__edit-name"
                  onClick={() => setShowEditNicknameModal(true)}
                  aria-label="별명 수정"
                >
                  <PencilIcon />
                </button>
              )}
            </Paragraph.Text>
            <Paragraph.Text typography="t4" fontWeight="bold">
              쓸까 말까 하다 안 쓴
            </Paragraph.Text>
            <Paragraph.Text typography="t2" fontWeight="bold">
              {formatAmount(monthlyAmount)}원
            </Paragraph.Text>
          </div>
        </div>
      </header>

      <AppFixedBottomCTA onClick={() => navigate('/record')}>안 썼어요 기록하기</AppFixedBottomCTA>
    </div>
  );
}
