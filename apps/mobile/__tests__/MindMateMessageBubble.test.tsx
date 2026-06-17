import { screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { MessageBubble } from '@/features/mindmate/components/MessageBubble';
import type { ChatMessage } from '@/features/mindmate/types';

import { renderWithProviders } from './_helpers';

describe('MessageBubble', () => {
  it('renders a user turn as plain text (no markdown processing)', () => {
    const msg: ChatMessage = { id: 'u1', role: 'user', content: 'I feel **off** today' };
    renderWithProviders(<MessageBubble message={msg} />);
    // User text is verbatim — the markdown asterisks are NOT stripped.
    expect(screen.getByText('I feel **off** today')).toBeTruthy();
  });

  it('renders an assistant turn through markdown (bold syntax is applied, not shown)', () => {
    const msg: ChatMessage = {
      id: 'a1',
      role: 'assistant',
      content: 'This is **important** information',
    };
    renderWithProviders(<MessageBubble message={msg} />);
    // The bold word renders; the literal `**important**` does not survive markdown.
    expect(screen.getByText('important')).toBeTruthy();
    expect(screen.queryByText('This is **important** information')).toBeNull();
  });

  it('shows the thinking indicator while an assistant turn is streaming with no text yet', () => {
    const msg: ChatMessage = { id: 'a2', role: 'assistant', content: '', isStreaming: true };
    renderWithProviders(<MessageBubble message={msg} />);
    expect(screen.UNSAFE_getByType(View).children.length).toBeGreaterThan(0); // the indicator renders views
  });

  it('renders citations under a completed assistant turn', () => {
    const msg: ChatMessage = {
      id: 'a3',
      role: 'assistant',
      content: 'Anxiety is common.',
      citations: [{ id: 'd1', title: 'Anxiety basics', url: '/learn/anxiety' }],
    };
    renderWithProviders(<MessageBubble message={msg} />);
    expect(screen.getByTestId('mindmate-citations')).toBeTruthy();
    expect(screen.getByText('Anxiety basics')).toBeTruthy();
  });

  it('does NOT render citations while the assistant turn is still streaming', () => {
    const msg: ChatMessage = {
      id: 'a4',
      role: 'assistant',
      content: 'partial',
      isStreaming: true,
      citations: [{ id: 'd1', title: 'Anxiety basics', url: '/learn/anxiety' }],
    };
    renderWithProviders(<MessageBubble message={msg} />);
    expect(screen.queryByTestId('mindmate-citations')).toBeNull();
  });
});
