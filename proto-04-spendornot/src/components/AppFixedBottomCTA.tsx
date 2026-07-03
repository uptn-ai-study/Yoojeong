import { FixedBottomCTA, type FixedBottomCTAProps } from '@toss/tds-mobile';
import './AppFixedBottomCTA.css';

type AppFixedBottomCTAProps = Omit<FixedBottomCTAProps, 'fixed'>;

export default function AppFixedBottomCTA({
  background = 'none',
  className,
  containerStyle,
  ...props
}: AppFixedBottomCTAProps) {
  return (
    <FixedBottomCTA
      background={background}
      className={['app-bottom-cta', className].filter(Boolean).join(' ')}
      hasSafeAreaPadding={false}
      hasPaddingBottom={false}
      containerStyle={{
        bottom: 'var(--bottom-cta-safe-padding)',
        paddingBottom: 0,
        ...containerStyle,
      }}
      {...props}
    />
  );
}
