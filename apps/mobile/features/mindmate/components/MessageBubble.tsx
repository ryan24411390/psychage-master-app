import { Linking, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import type { ChatMessage } from '../types';
import { Citations } from './Citations';

// One conversation turn. User turns align right on the teal brand fill; assistant
// turns align left on the surface card. While a turn is streaming with no text yet,
// a calm ellipsis stands in for a spinner (sensorial restraint, no urgency).
//
// Assistant turns render through react-native-markdown-display (the server replies in
// markdown — bold, lists, links). User turns stay plain. Markdown's only styling
// surface is its `style` object prop (no className), so the theme-derived style map
// below is a SANCTIONED exception to the NativeWind-only rule (convention #9). Links
// open in the platform handler. Server-validated citations render below the reply.
export function MessageBubble({ message }: { message: ChatMessage }) {
  const tc = useThemeColors();
  const isUser = message.role === 'user';
  const awaiting = message.isStreaming && message.content.length === 0;

  const bubble = isUser
    ? 'bg-primary dark:bg-primary-dark rounded-br-md'
    : 'bg-surface border border-border/40 dark:bg-surface-dark dark:border-border-dark/40 rounded-bl-md shadow-sm';
  const textColor = isUser ? 'text-white' : 'text-text-primary dark:text-text-primary-dark';

  return (
    <View className={`w-full px-4 py-1 ${isUser ? 'items-end' : 'items-start'}`}>
      <View className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${bubble}`}>
        {awaiting ? (
          <Text variant="body" className={textColor}>
            …
          </Text>
        ) : isUser ? (
          <Text variant="body" className={textColor}>
            {message.content}
          </Text>
        ) : (
          <Markdown
            style={markdownStyles(tc.ink, tc.primary)}
            onLinkPress={(url) => {
              void Linking.openURL(url).catch(() => {});
              return false;
            }}
          >
            {message.content}
          </Markdown>
        )}
      </View>

      {!isUser && !message.isStreaming && message.citations && message.citations.length > 0 ? (
        <Citations citations={message.citations} />
      ) : null}
    </View>
  );
}

// Theme-derived markdown style map. Tight block margins (replies are short-form) and
// brand-teal links. Colors come from useThemeColors so the reply reads on the true-
// black dark canvas. Only the few elements the server actually emits are styled.
function markdownStyles(ink: string, link: string) {
  return {
    body: { color: ink, fontSize: 16, lineHeight: 23, margin: 0 },
    paragraph: { marginTop: 0, marginBottom: 8 },
    strong: { fontWeight: '700' as const },
    em: { fontStyle: 'italic' as const },
    bullet_list: { marginTop: 0, marginBottom: 8 },
    ordered_list: { marginTop: 0, marginBottom: 8 },
    list_item: { marginBottom: 2 },
    link: { color: link, textDecorationLine: 'underline' as const },
    heading1: { color: ink, fontSize: 20, fontWeight: '700' as const, marginBottom: 6 },
    heading2: { color: ink, fontSize: 18, fontWeight: '700' as const, marginBottom: 6 },
    heading3: { color: ink, fontSize: 16, fontWeight: '700' as const, marginBottom: 4 },
  };
}
