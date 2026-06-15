import re

with open('/Users/raiyanabdullah/dev/psychage-fresh/apps/mobile/features/find/FindCareScreen.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = re.sub(
    r"import Animated, \{ FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming \} from 'react-native-reanimated';",
    "import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';\nimport { useColorScheme } from 'nativewind';\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';",
    content
)

content = re.sub(
    r"import \{ recordRecentlyViewed \} from '@/lib/persistence/recently-viewed';",
    "import { recordRecentlyViewed } from '@/lib/persistence/recently-viewed';\nimport { colors } from '@/lib/colors';",
    content
)

# 2. Remove Prototype palette
content = re.sub(
    r"// Prototype palette.*?\nconst RED = '#D63A30';\n",
    "",
    content,
    flags=re.DOTALL
)

# 3. Add useColorScheme hook to FindCareScreen
content = re.sub(
    r"  const dl = useDirectoryLocation\(\);",
    "  const dl = useDirectoryLocation();\n  const { colorScheme } = useColorScheme();\n  const isDark = colorScheme === 'dark';\n  const insets = useSafeAreaInsets();\n\n  const ink = isDark ? colors.text.primary.dark : colors.text.primary.light;\n  const soft = isDark ? colors.text.secondary.dark : colors.text.secondary.light;\n  const faint = isDark ? colors.text.tertiary.dark : colors.text.tertiary.light;\n  const teal = isDark ? colors.teal[400] : colors.teal[600];\n  const tealPress = isDark ? colors.teal[500] : colors.teal[700];\n  const red = isDark ? colors.crisis.dark : colors.crisis.light;\n",
    content
)

# 4. Tap component updates (accessibility)
content = re.sub(
    r"function Tap\(\{ onPress, children, className, style \} : \{ onPress\?: \(\) => void; children: React\.ReactNode; className\?: string; style\?: ViewStyle \}\) \{",
    "function Tap({ onPress, children, className, style, accessibilityLabel, accessibilityRole }: { onPress?: () => void; children: React.ReactNode; className?: string; style?: ViewStyle; accessibilityLabel?: string; accessibilityRole?: any }) {",
    content
)
content = re.sub(
    r"<Pressable onPress=\{onPress\} onPressIn=",
    "<Pressable accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityRole ?? 'button'} onPress={onPress} onPressIn=",
    content
)

# 5. Skeleton
content = re.sub(
    r"bg-\[\#EAE6DB\] mb-3",
    "bg-border dark:bg-border-dark mb-4",
    content
)

# 6. Global replacements for colors and spacing
replacements = [
    # Backgrounds
    ("bg-[#F4F1E9]", "bg-background dark:bg-background-dark"),
    ("bg-white", "bg-surface dark:bg-surface-dark"),
    ("bg-[#E2F0EC]", "bg-surface-accent dark:bg-surface-accent-dark"),
    ("bg-[#ECE8DC]", "bg-surface-active dark:bg-surface-active-dark"),
    ("bg-[#FBF1DC]", "bg-surface-active dark:bg-surface-active-dark"),
    ("bg-[#FBE9E7]", "bg-[#FBE9E7] dark:bg-[#3D2523]"), # Crisis background

    # Borders
    ("border-[#0000001A]", "border-border dark:border-border-dark"),
    ("border-[#D63A30]", "border-error dark:border-error-dark"),

    # Text Colors
    ("text-[#1B1B19]", "text-text-primary dark:text-text-primary-dark"),
    ("text-[#6F6E67]", "text-text-secondary dark:text-text-secondary-dark"),
    ("text-[#A6A39A]", "text-text-tertiary dark:text-text-tertiary-dark"),
    ("text-[#16897A]", "text-primary dark:text-primary-dark"),
    ("text-[#0F6E5F]", "text-primary-hover dark:text-primary-hover-dark"),
    ("text-[#A9791F]", "text-warning dark:text-warning-dark"),

    # Typography (Size & Weight)
    ("text-[34px]", "text-4xl"),
    ("text-[27px]", "text-3xl"),
    ("text-[26px]", "text-3xl"),
    ("text-[23px]", "text-2xl"),
    ("text-[22px]", "text-2xl"),
    ("text-[15.5px]", "text-base"),
    ("text-[15px]", "text-base"),
    ("text-[14.5px]", "text-sm"),
    ("text-[13.5px]", "text-sm"),
    ("text-[13px]", "text-sm"),
    ("text-[12.5px]", "text-xs"),
    ("text-[11.5px]", "text-xs"),
    ("text-[11px]", "text-[11px]"),

    # Spacing adjustments for minimum 44x44 touch targets
    ("className=\"p-1\"", "className=\"p-2.5\""), # For ChevronLeft
    ("px-3.5 py-3", "px-4 py-3.5"), # Standardize inputs
    ("py-3.5", "py-4"), # Standardize list items
    ("px-[22px]", "px-5"), # Screen edges
    ("px-[18px]", "px-5"), # Screen edges

    # Shadows
    ("rounded-2xl mb-3 overflow-hidden", "rounded-2xl mb-4 overflow-hidden shadow-sm dark:shadow-none"),
    ("rounded-2xl p-4 mb-2.5 bg-surface", "rounded-2xl p-4 mb-3 bg-surface shadow-sm dark:shadow-none"),

    # Component specifics
    ("color={INK}", "color={ink}"),
    ("color={SOFT}", "color={soft}"),
    ("color={FAINT}", "color={faint}"),
    ("color={TEAL}", "color={teal}"),
    ("color={TEAL_PRESS}", "color={tealPress}"),
    ("color={RED}", "color={red}"),
    ("fill={sv ? TEAL : 'transparent'}", "fill={sv ? teal : 'transparent'}"),
    ("fill={saved ? TEAL : 'transparent'}", "fill={saved ? teal : 'transparent'}"),
]

for old, new in replacements:
    content = content.replace(old, new)

# 7. Update header avatar padding inside shared chrome
content = re.sub(
    r"const Header = \(\{ back, title \}: \{ back\?: \(\) => void; title\?: string \}\) => \(\n    <View className=\"flex-row items-center justify-between px-5 pt-1 pb-2\">",
    "const Header = ({ back, title }: { back?: () => void; title?: string }) => (\n    <View className=\"flex-row items-center justify-between px-5 pt-2 pb-3\">",
    content
)

# 8. Fix Search icon clear button touch target
content = re.sub(
    r"<Tap onPress=\{\(\) => setQuery\(''\)\}\><X size=\{16\} color=\{soft\} \/></Tap>",
    "<Tap accessibilityLabel=\"Clear search\" onPress={() => setQuery('')} className=\"p-2 -mr-2\"><X size={16} color={soft} /></Tap>",
    content
)

# 9. Update safe area usage for bottom content
content = re.sub(
    r"contentContainerStyle=\{\{ paddingBottom: 28 \}\}",
    "contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 28) }}",
    content
)

content = re.sub(
    r"bottom-\[18px\]",
    "bottom-[24px]",
    content
)

content = re.sub(
    r"paddingBottom: 16",
    "paddingBottom: insets.bottom + 16",
    content
)

with open('/Users/raiyanabdullah/dev/psychage-fresh/apps/mobile/features/find/FindCareScreen.tsx', 'w') as f:
    f.write(content)
