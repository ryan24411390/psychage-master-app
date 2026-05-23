import { Text, View } from 'react-native';

import { CONFIDENCE_CAP } from '@psychage/shared/navigator/constants';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg text-black">Phase 6 Slice 3 — scaffold boot</Text>
      <Text className="text-sm text-neutral-500 mt-2">
        @psychage/shared resolved: CONFIDENCE_CAP = {CONFIDENCE_CAP}
      </Text>
    </View>
  );
}
