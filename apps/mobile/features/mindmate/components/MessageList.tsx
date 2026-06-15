import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';

import type { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';
import { MindMateIntro } from './MindMateIntro';

// FlashList per the stack rule (any list >20 items) — a conversation grows past
// that. v2 auto-sizes, so no estimatedItemSize. The intro is the empty state.
export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <View className="flex-1">
      <FlashList
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        ListEmptyComponent={MindMateIntro}
        keyboardShouldPersistTaps="handled"
        testID="mindmate-message-list"
      />
    </View>
  );
}
