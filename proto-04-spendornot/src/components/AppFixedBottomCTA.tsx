import { FixedBottomCTA, type FixedBottomCTAProps } from '@toss/tds-mobile';

type AppFixedBottomCTAProps = Omit<FixedBottomCTAProps, 'fixed'>;

export default function AppFixedBottomCTA({
  background = 'none',
  containerStyle,
  ...props
}: AppFixedBottomCTAProps) {
  return (
    <FixedBottomCTA
      background={background}
      hasSafeAreaPadding={false}
      hasPaddingBottom={false}
      containerStyle={{
        paddingBottom: 'var(--bottom-cta-safe-padding)',
        ...containerStyle,
      }}
      {...props}
    />
  );
}
