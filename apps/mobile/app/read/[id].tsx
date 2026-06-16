import { Redirect, useLocalSearchParams } from 'expo-router';

// Legacy reading route. The home rails now link directly to the real reader at
// /article/[slug]; this redirect keeps any lingering /read/[id] deep link resolving
// to the real article instead of the old stub.
export default function ReadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/article/${id}` as never} />;
}
