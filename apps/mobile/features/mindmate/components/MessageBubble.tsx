import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

import type { ChatMessage } from '../types';

// One conversation turn. User turns align right on the teal brand fill; assistant
// turns align left on the surface card. While a turn is streaming with no text yet,
// a calm ellipsis stands in for a spinner (sensorial restraint, no urgency).
export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const awaiting = message.isStreaming && message.content.length === 0;

  const bubble = isUser
    ? 'bg-primary dark:bg-primary-dark rounded-br-md'
    : 'bg-surface border border-border/50 dark:bg-surface-dark dark:border-border-dark/50 rounded-bl-md';
  const textColor = isUser
    ? 'text-white'
    : 'text-text-primary dark:text-text-primary-dark';

  return (
    <View className={`w-full px-4 py-1 ${isUser ? 'items-end' : 'items-start'}`}>
      <View className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${bubble}`}>
        <Text variant="body" className={textColor}>
          {awaiting ? '…' : message.content}
        </Text>
      </View>
    </View>
  );
}
