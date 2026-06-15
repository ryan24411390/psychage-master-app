import re

with open('/Users/raiyanabdullah/dev/psychage-fresh/apps/mobile/features/find/FindCareScreen.tsx', 'r') as f:
    content = f.read()

# 1. Fix Tap function signature
content = content.replace(
    "function Tap({ onPress, children, className, style }: { onPress?: () => void; children: React.ReactNode; className?: string; style?: ViewStyle }) {",
    "function Tap({ onPress, children, className, style, accessibilityLabel, accessibilityRole }: { onPress?: () => void; children: React.ReactNode; className?: string; style?: ViewStyle; accessibilityLabel?: string; accessibilityRole?: any }) {"
)

# 2. Fix TEAL and FAINT
content = content.replace("color = TEAL", "color = teal")
content = content.replace("placeholderTextColor={FAINT}", "placeholderTextColor={faint}")
content = content.replace("color={sv ? TEAL : FAINT}", "color={sv ? teal : faint}")
content = content.replace("color={saved ? TEAL : FAINT}", "color={saved ? teal : faint}")
content = content.replace("backgroundColor: TEAL", "backgroundColor: teal")

# 3. Fix soft in Row component
content = content.replace(
    "function Row({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {\n  return (",
    "function Row({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {\n  const { colorScheme } = useColorScheme();\n  const soft = colorScheme === 'dark' ? colors.text.secondary.dark : colors.text.secondary.light;\n  return ("
)

with open('/Users/raiyanabdullah/dev/psychage-fresh/apps/mobile/features/find/FindCareScreen.tsx', 'w') as f:
    f.write(content)
