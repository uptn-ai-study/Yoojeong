import type { ReactNode } from 'react';
import { Paragraph, TopNavigationBackButton } from '@toss/tds-mobile';
import './ScreenHeader.css';

interface ScreenHeaderProps {
  title: ReactNode;
  subtitle?: string;
  titleTypography?: 't3' | 't5';
  titleFontWeight?: 'bold' | 'semibold';
  titleFit?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ScreenHeader({
  title,
  subtitle,
  titleTypography = 't3',
  titleFontWeight = 'bold',
  titleFit = false,
  onBack,
  onClose,
}: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div className={`screen-header__row${onClose && !onBack ? ' screen-header__row--close' : ''}`}>
        {onBack && (
          <div className="screen-header__back">
            <TopNavigationBackButton onClick={onBack} aria-label="뒤로 가기" />
          </div>
        )}
        <div className="screen-header__text">
          <Paragraph.Text typography={titleTypography} fontWeight={titleFontWeight}>
            {titleFit ? <span className="screen-header__title-fit">{title}</span> : title}
          </Paragraph.Text>
          {subtitle && (
            <Paragraph.Text typography="t6" color="adaptive-grey-600">
              {subtitle}
            </Paragraph.Text>
          )}
        </div>
        {onClose && (
          <button type="button" className="screen-header__close" onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </button>
        )}
      </div>
    </header>
  );
}
