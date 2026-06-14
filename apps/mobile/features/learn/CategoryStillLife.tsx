import { View } from 'react-native';

// CT2 PLACEHOLDER — the clay still-life illustration per Learn category. A neutral
// clay block stands in until the illustration set is commissioned; swapping in the
// real art is a one-file change here. No fabricated artwork.
export function CategoryStillLife({ testID }: { testID?: string }) {
  return <View testID={testID} className="h-12 w-12 rounded-lg bg-border dark:bg-border-dark" />;
}
