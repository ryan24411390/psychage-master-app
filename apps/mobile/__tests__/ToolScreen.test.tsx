import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ToolScreen } from '@/components/ui/ToolScreen';

import { renderWithProviders } from './_helpers';

// 0f — the single tool-chrome standard. These lock the chrome contract every tool
// surface relies on: the SR-2 Help-now cluster is always present, the back/title
// row is conditional, and there is never a mascot in chrome.
describe('ToolScreen', () => {
  it('always renders the chrome cluster: logo + Help-now (SR-2) + account', () => {
    renderWithProviders(
      <ToolScreen scroll="none">
        <Text>body</Text>
      </ToolScreen>,
      { haptics: true },
    );
    expect(screen.getByText('Psychage')).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy();
    expect(screen.getByLabelText('Account')).toBeTruthy();
    // Exactly one Help-now — guards against double-chrome when wrapping tools.
    expect(screen.getAllByLabelText('Help now')).toHaveLength(1);
  });

  it('renders no back control when onBack is omitted', () => {
    renderWithProviders(
      <ToolScreen scroll="none">
        <Text>body</Text>
      </ToolScreen>,
      { haptics: true },
    );
    expect(screen.queryByLabelText('Back')).toBeNull();
  });

  it('renders a back control that fires onBack', () => {
    const onBack = jest.fn();
    renderWithProviders(
      <ToolScreen scroll="none" onBack={onBack}>
        <Text>body</Text>
      </ToolScreen>,
      { haptics: true },
    );
    fireEvent.press(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('uses backLabel for both the visible label and accessibility', () => {
    renderWithProviders(
      <ToolScreen scroll="none" onBack={() => {}} backLabel="Relationship Health">
        <Text>body</Text>
      </ToolScreen>,
      { haptics: true },
    );
    expect(screen.getByLabelText('Relationship Health')).toBeTruthy();
    expect(screen.getByText('Relationship Health')).toBeTruthy();
  });

  it('renders a title in the header when provided', () => {
    renderWithProviders(
      <ToolScreen scroll="none" title="Sleep">
        <Text>body</Text>
      </ToolScreen>,
      { haptics: true },
    );
    expect(screen.getByText('Sleep')).toBeTruthy();
  });

  it('renders its children', () => {
    renderWithProviders(
      <ToolScreen scroll="none">
        <Text testID="tool-body">hello</Text>
      </ToolScreen>,
      { haptics: true },
    );
    expect(screen.getByTestId('tool-body')).toBeTruthy();
  });

  it('never renders a mascot in chrome', () => {
    renderWithProviders(
      <ToolScreen onBack={() => {}} title="Anything">
        <Text>body</Text>
      </ToolScreen>,
      { haptics: true },
    );
    expect(screen.queryByTestId(/mascot/i)).toBeNull();
  });
});
