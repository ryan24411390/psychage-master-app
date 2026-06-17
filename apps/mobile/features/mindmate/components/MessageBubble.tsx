import { Sparkles } from 'lucide-react-native';
import { Linking, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import type { ChatMessage } from '../types';
import { Citations } from './Citations';
import { ThinkingIndicator } from './ThinkingIndicator';

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
    ? 'bg-primary dark:bg-primary-dark rounded-br-sm'
    : 'bg-surface border border-border/40 dark:bg-surface-dark dark:border-border-dark/40 rounded-bl-sm shadow-sm';
  const textColor = isUser ? 'text-white' : 'text-text-primary dark:text-text-primary-dark';

  return (
    <Animated.View
      entering={FadeInDown.springify().mass(0.5).damping(12)}
      className={`w-full px-4 py-2 flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      <View className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
        {!isUser && (
          <View className="mr-2 mt-1 h-8 w-8 items-center justify-center rounded-full bg-primary/10 dark:bg-primary-dark/20">
            <Sparkles size={16} color={tc.primary} strokeWidth={2.5} />
          </View>
        )}

        <View className={`max-w-[80%] rounded-2xl px-4 py-3 ${bubble}`}>
          {awaiting ? (
            <ThinkingIndicator />
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
      </View>

      {!isUser && !message.isStreaming && message.citations && message.citations.length > 0 ? (
        <View className="ml-10 mt-1">
          <Citations citations={message.citations} />
        </View>
      ) : null}
    </Animated.View>
  );
}

// Theme-derived markdown style map. Tight block margins (replies are short-form) and
// brand-teal links. Colors come from useThemeColors so the reply reads on the true-
// black dark canvas. Only the few elements the server actually emits are styled.
function markdownStyles(ink: string, link: string) {
  return {
    body: { color: ink, fontSize: 16, lineHeight: 24, margin: 0 },
    paragraph: { marginTop: 0, marginBottom: 12 },
    strong: { fontWeight: '700' as const, color: ink },
    em: { fontStyle: 'italic' as const, color: ink },
    bullet_list: { marginTop: 0, marginBottom: 12 },
    ordered_list: { marginTop: 0, marginBottom: 12 },
    list_item: { marginBottom: 6 },
    link: { color: link, textDecorationLine: 'underline' as const },
    heading1: { color: ink, fontSize: 22, fontWeight: '700' as const, marginBottom: 8, marginTop: 12 },
    heading2: { color: ink, fontSize: 20, fontWeight: '700' as const, marginBottom: 8, marginTop: 12 },
    heading3: { color: ink, fontSize: 18, fontWeight: '700' as const, marginBottom: 6, marginTop: 10 },
    code_block: { backgroundColor: 'rgba(0,0,0,0.05)', padding: 12, borderRadius: 8, marginBottom: 12 },
    code_inline: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, fontFamily: 'Menlo' },
  };
}
