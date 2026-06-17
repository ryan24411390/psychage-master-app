import { FlashList } from '@shopify/flash-list';
import { useMemo } from 'react';
import { View } from 'react-native';

import type { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';
import { MindMateIntro } from './MindMateIntro';

// FlashList per the stack rule (any list >20 items) — a conversation grows past
// that. v2 auto-sizes, so no estimatedItemSize. The intro is the empty state.
export function MessageList({ messages }: { messages: ChatMessage[] }) {
  // FlashList inverted renders bottom-up. We reverse the array so newest is at index 0.
  const displayMessages = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <View className="flex-1" style={{ transform: [{ scaleY: -1 }] }}>
      <FlashList
        data={displayMessages}
        contentContainerStyle={{ paddingVertical: 16 }}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={{ transform: [{ scaleY: -1 }] }}>
            <MessageBubble message={item} />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ transform: [{ scaleY: -1 }] }}>
            <MindMateIntro />
          </View>
        }
        keyboardShouldPersistTaps="handled"
        testID="mindmate-message-list"
      />
    </View>
  );
}
