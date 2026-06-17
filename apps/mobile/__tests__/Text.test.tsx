import { render, screen } from '@testing-library/react-native';

import { Text } from '@/components/ui/Text';

// NativeWind compiles className → style through the Metro transformer, which is
// absent under jest — so the resolved RN `style` is undefined here and the raw
// className passes through. This test pins the variant → font-family *class*
// (Text's half of the chain); the class → family-string half (e.g.
// font-sans-bold → IBMPlexSans_700Bold) is pinned by the runner-independent
// tailwind-font-mapping.test.ts under Vitest. Together they are the Slice-1
// weight-mapping regression net.
function classesFor(variant: Parameters<typeof Text>[0]['variant']) {
  render(<Text variant={variant}>x</Text>);
  const classes = String(screen.getByText('x').props.className).split(/\s+/);
  screen.unmount();
  return classes;
}

describe('Text variant → font-family class', () => {
  it('body uses font-sans (400)', () => {
    expect(classesFor('body')).toContain('font-sans');
  });

  it('bodyMedium uses font-sans-medium (500)', () => {
    expect(classesFor('bodyLarge')).toContain('font-sans-medium');
  });

  it('bodyBold uses font-sans-bold (700)', () => {
    expect(classesFor('label')).toContain('font-sans-bold');
  });

  it('heading + headingLg use font-display (Fraunces 600)', () => {
    expect(classesFor('h2')).toContain('font-display');
    expect(classesFor('h1')).toContain('font-display');
  });

  it('headingLg no longer carries the no-op font-bold weight utility', () => {
    // Custom-cut fonts ignore RN fontWeight on iOS; font-bold was dead. Weight
    // is family-selected now. This guards the Slice-1 removal from regressing.
    expect(classesFor('h1')).not.toContain('font-bold');
  });
});
