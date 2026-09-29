import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HouseStackParamList } from '../types/navigation';
import { COLORS } from '../theme';

import { HouseChoiceScreen } from '../screens/House/HouseChoiceScreen';
import { CreateHouseScreen } from '../screens/House/CreateHouseScreen';
import { JoinHouseScreen } from '../screens/House/JoinHouseScreen';
import { InviteCodeScreen } from '../screens/House/InviteCodeScreen';

const Stack = createNativeStackNavigator<HouseStackParamList>();

export function HouseNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.white },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HouseChoice" component={HouseChoiceScreen} />
      <Stack.Screen name="CreateHouse" component={CreateHouseScreen} />
      <Stack.Screen name="JoinHouse" component={JoinHouseScreen} />
      <Stack.Screen name="InviteCode" component={InviteCodeScreen} />
    </Stack.Navigator>
  );
}
