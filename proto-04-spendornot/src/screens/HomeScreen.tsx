import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Paragraph } from '@toss/tds-mobile';
import NicknameModal from '../components/NicknameModal';
import { useAppStore } from '../store/useAppStore';
import { formatAmount, getCurrentMonth } from '../utils/format';
import { getLevelImage } from '../utils/level';
import { MAX_NICKNAME_LENGTH } from '../types';
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

  const displayName = userName.slice(0, MAX_NICKNAME_LENGTH);
  const currentMonth = getCurrentMonth();
  const imageSrc = getLevelImage(monthlyAmount, viewMode);

  return (
    <div className="screen home-screen home-screen--hero">
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

      <div className="home-screen__image-wrap home-screen__image-wrap--offset" aria-hidden="true">
        <img src={imageSrc} alt="" className="home-screen__image" />
      </div>

      <header className="home-screen__header">
        <div className="home-screen__summary">
          <div className="home-screen__copy">
            <Paragraph.Text typography="t5" fontWeight="semibold" className="home-screen__line home-screen__line--context">
              <span className="home-screen__period">이번 달</span>
              <span
                className={`home-screen__name-group${hasSetNickname ? ' home-screen__name-group--editable' : ''}`}
              >
                <span className="home-screen__nickname">{displayName}</span>님의
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
              </span>
            </Paragraph.Text>
            <Paragraph.Text typography="t5" fontWeight="bold" className="home-screen__line home-screen__line--lead">
              쓸까 말까 하다 안 쓴
            </Paragraph.Text>
          </div>
          <div className="home-screen__amount-row">
            <Paragraph.Text typography="t2" fontWeight="bold" className="home-screen__amount">
              {formatAmount(monthlyAmount)}원
            </Paragraph.Text>
            <button
              type="button"
              className="home-screen__add-btn"
              onClick={() => navigate('/record')}
              aria-label="안 썼어요 기록하기"
            >
              +
            </button>
          </div>
        </div>
      </header>

      <footer className="screen-bottom-footer home-screen__footer">
        <div className="home-screen__footer-actions">
          <Button
            type="button"
            size="medium"
            variant="weak"
            color="dark"
            display="full"
            className="home-screen__footer-action-btn"
            onClick={toggleViewMode}
          >
            {viewMode === 'bill' ? '어항모드' : '지폐모드'}
          </Button>
          <Button
            type="button"
            size="medium"
            variant="weak"
            color="dark"
            display="full"
            className="home-screen__footer-action-btn"
            onClick={() => navigate('/stats/monthly')}
          >
            {currentMonth}월 통계
          </Button>
          <Button
            type="button"
            size="medium"
            variant="weak"
            color="dark"
            display="full"
            className="home-screen__footer-action-btn"
            onClick={() => navigate('/stats/monthly-chart')}
          >
            월별 통계
          </Button>
        </div>
      </footer>
    </div>
  );
}
