import { Paragraph } from '@toss/tds-mobile';
import { APP_BUILD_ID } from '../constants/build';
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
        <Paragraph.Text typography="t7" color="adaptive-grey-500" className="splash-screen__build-id">
          {APP_BUILD_ID}
        </Paragraph.Text>
      </div>
    </div>
  );
}
