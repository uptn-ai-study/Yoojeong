import type { ReactNode } from 'react';
import { Paragraph, TopNavigationBackButton } from '@toss/tds-mobile';
import './ScreenHeader.css';

interface ScreenHeaderProps {
  title: ReactNode;
  subtitle?: string;
  onBack: () => void;
}

export default function ScreenHeader({ title, subtitle, onBack }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div className="screen-header__row">
        <div className="screen-header__back">
          <TopNavigationBackButton onClick={onBack} aria-label="뒤로 가기" />
        </div>
        <div className="screen-header__text">
          <Paragraph.Text typography="t3" fontWeight="bold">
            {title}
          </Paragraph.Text>
          {subtitle && (
            <Paragraph.Text typography="t6" color="adaptive-grey-600">
              {subtitle}
            </Paragraph.Text>
          )}
        </div>
      </div>
    </header>
  );
}
