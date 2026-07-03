import { useNavigate } from 'react-router-dom';
import { Button, Paragraph } from '@toss/tds-mobile';
import { useAppStore } from '../store/useAppStore';
import './IntroScreen.css';

export default function IntroScreen() {
  const navigate = useNavigate();
  const setHasSeenIntro = useAppStore((s) => s.setHasSeenIntro);

  const handleStart = () => {
    setHasSeenIntro(true);
    navigate('/home', { replace: true });
  };

  return (
    <div className="screen intro-screen">
      <div className="intro-screen__body">
        <section className="intro-screen__group intro-screen__group--label" aria-label="앱 유형">
          <Paragraph.Text typography="t6" color="adaptive-grey-600">
            안 쓴 돈 기록 앱
          </Paragraph.Text>
        </section>

        <section className="intro-screen__group intro-screen__group--headline" aria-label="앱 소개">
          <Paragraph.Text typography="t2" fontWeight="bold" className="intro-screen__title">
            쓸까 말까 하다
            <br />
            안 쓴 돈,
            <br />
            모아보세요
          </Paragraph.Text>
        </section>

        <section className="intro-screen__group intro-screen__group--desc" aria-label="앱 설명">
          <Paragraph.Text typography="t5" color="adaptive-grey-600" className="intro-screen__desc">
            택시, 외식, 쇼핑… 참았던 소비를 기록하면
            <br />
            얼마나 아꼈는지 한눈에 볼 수 있어요.
          </Paragraph.Text>
        </section>

        <section className="intro-screen__group intro-screen__group--features" aria-label="주요 기능">
          <ul className="intro-screen__features">
            <li>
              <Paragraph.Text typography="t5" fontWeight="medium">
                참은 소비를 간편하게 기록
              </Paragraph.Text>
            </li>
            <li>
              <Paragraph.Text typography="t5" fontWeight="medium">
                안 쓴 돈을 직관적으로 확인할 수 있는 지폐 모드와 어항 모드
              </Paragraph.Text>
            </li>
            <li>
              <Paragraph.Text typography="t5" fontWeight="medium">
                카테고리별 월간 통계 제공
              </Paragraph.Text>
            </li>
          </ul>
        </section>
      </div>
      <footer className="screen-bottom-footer intro-screen__footer">
        <Button display="full" size="xlarge" onClick={handleStart}>
          시작하기
        </Button>
      </footer>
    </div>
  );
}
