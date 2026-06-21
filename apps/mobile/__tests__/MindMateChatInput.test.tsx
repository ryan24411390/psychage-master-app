import { fireEvent, screen } from '@testing-library/react-native';

import { ChatInput } from '@/features/mindmate/components/ChatInput';

import { renderWithProviders } from './_helpers';

describe('ChatInput', () => {
  it('sends on Return (onSubmitEditing) with the trimmed text', () => {
    const onSend = jest.fn();
    renderWithProviders(<ChatInput onSend={onSend} />, { haptics: true });

    const input = screen.getByTestId('mindmate-input');
    fireEvent.changeText(input, '  what is anxiety  ');
    fireEvent(input, 'submitEditing');

    expect(onSend).toHaveBeenCalledWith('what is anxiety');
  });

  it('does not send empty / whitespace-only text on Return', () => {
    const onSend = jest.fn();
    renderWithProviders(<ChatInput onSend={onSend} />, { haptics: true });

    const input = screen.getByTestId('mindmate-input');
    fireEvent.changeText(input, '   ');
    fireEvent(input, 'submitEditing');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('the send button submits the same way', () => {
    const onSend = jest.fn();
    renderWithProviders(<ChatInput onSend={onSend} />, { haptics: true });

    fireEvent.changeText(screen.getByTestId('mindmate-input'), 'hello');
    fireEvent.press(screen.getByTestId('mindmate-send'));

    expect(onSend).toHaveBeenCalledWith('hello');
  });

  it('does not send while a reply is streaming (disabled)', () => {
    const onSend = jest.fn();
    renderWithProviders(<ChatInput onSend={onSend} disabled />, { haptics: true });

    const input = screen.getByTestId('mindmate-input');
    fireEvent.changeText(input, 'hello');
    fireEvent(input, 'submitEditing');

    expect(onSend).not.toHaveBeenCalled();
  });
});
