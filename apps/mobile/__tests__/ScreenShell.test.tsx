import { screen } from '@testing-library/react-native';

import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';

import { renderWithProviders } from './_helpers';

describe('ScreenShell', () => {
  it('renders its children', () => {
    renderWithProviders(
      <ScreenShell>
        <Text>hello</Text>
      </ScreenShell>,
    );
    expect(screen.getByText('hello')).toBeOnTheScreen();
  });

  it('applies the themed background token, never a raw bg-white', () => {
    // NativeWind className → style is a no-op under jest (no Metro transformer),
    // so the background is asserted on the resolved className rather than style.
    renderWithProviders(
      <ScreenShell testID="shell">
        <Text>hello</Text>
      </ScreenShell>,
    );
    const classes = String(screen.getByTestId('shell').props.className).split(/\s+/);
    expect(classes).toContain('bg-background');
    expect(classes).toContain('dark:bg-background-dark');
    expect(classes).not.toContain('bg-white');
  });
});
