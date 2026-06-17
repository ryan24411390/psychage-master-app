import { AlertTriangle, ArrowRight, MessageSquare, Phone } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

import { openClarityAction } from './open-action';

// CrisisUrgentBanner — shown in the results banner when tier === 'crisis'. RN port of the
// web banner. The web resolves a region crisis line via i18n; mobile uses the 988 / Crisis
// Text Line defaults (tel:/sms: open via Linking). Crisis copy is invitational (SR-3) and
// release-gated on Dr. Dobson review. Crisis access cannot be removed (SR-2).

const CRISIS_RED = '#ef4444';

export function CrisisUrgentBanner() {
  return (
    <View
      accessibilityRole="alert"
      style={{
        marginTop: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${CRISIS_RED}55`,
        backgroundColor: `${CRISIS_RED}14`,
        padding: 20,
      }}
    >
      <View className="flex-row items-start gap-4">
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${CRISIS_RED}26`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={20} color={CRISIS_RED} />
        </View>
        <View className="min-w-0 flex-1">
          <Text variant="h1" style={{ color: CRISIS_RED }}>
            Support is available right now
          </Text>
          <Text variant="body" className="mt-2" style={{ color: CRISIS_RED }}>
            Reaching out can help — and you do not need to do it alone. These lines are free,
            confidential, and open 24/7.
          </Text>

          <View className="mt-4 gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call 988"
              onPress={() => openClarityAction('tel:988')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 44,
                borderRadius: 12,
                backgroundColor: CRISIS_RED,
                paddingHorizontal: 16,
              })}
            >
              <Phone size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Call 988</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Text HOME to 741741"
              onPress={() => openClarityAction('sms:741741?body=HOME')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 44,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: `${CRISIS_RED}55`,
                paddingHorizontal: 16,
              })}
            >
              <MessageSquare size={16} color={CRISIS_RED} />
              <Text style={{ color: CRISIS_RED, fontWeight: '600' }}>Text HOME to 741741</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More crisis resources"
              onPress={() => openClarityAction('/crisis')}
              hitSlop={6}
              className="min-h-[44px] flex-row items-center justify-center gap-1.5"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={{ color: CRISIS_RED, fontWeight: '600' }}>More crisis resources</Text>
              <ArrowRight size={14} color={CRISIS_RED} />
            </Pressable>
          </View>

          <Text variant="caption" className="mt-3" style={{ color: `${CRISIS_RED}cc` }}>
            If you or someone else is in immediate danger, call 911 or go to the nearest ER.
          </Text>
        </View>
      </View>
    </View>
  );
}
