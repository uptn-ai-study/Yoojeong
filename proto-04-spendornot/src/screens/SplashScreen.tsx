import { Paragraph } from '@toss/tds-mobile';
import './SplashScreen.css';

export default function SplashScreen() {
  return (
    <div className="screen splash-screen">
      <div className="splash-screen__content">
        <div className="splash-screen__headline">
          <img
            src="/images/app-icon.webp"
            alt="쓸까말까"
            className="splash-screen__icon"
            width={128}
            height={128}
            decoding="async"
          />
          <Paragraph.Text typography="t1" fontWeight="semibold" className="splash-screen__subtitle">
            기록일지
          </Paragraph.Text>
        </div>
        <Paragraph.Text typography="t6" color="adaptive-grey-600" className="splash-screen__credit">
          By 엘리
        </Paragraph.Text>
      </div>
    </div>
  );
}
