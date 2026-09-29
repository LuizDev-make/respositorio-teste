import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExpenseStackParamList } from '../types/navigation';
import { COLORS } from '../theme';

import { ExpenseListScreen } from '../screens/Expenses/ExpenseListScreen';
import { ExpenseDetailScreen } from '../screens/Expenses/ExpenseDetailScreen';
import { CreateExpenseScreen } from '../screens/Expenses/CreateExpenseScreen';
import { EditExpenseScreen } from '../screens/Expenses/EditExpenseScreen';
import { RegisterPaymentScreen } from '../screens/Expenses/RegisterPaymentScreen';

const Stack = createNativeStackNavigator<ExpenseStackParamList>();

export function ExpenseNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <Stack.Screen name="CreateExpense" component={CreateExpenseScreen} />
      <Stack.Screen name="EditExpense" component={EditExpenseScreen} />
      <Stack.Screen name="RegisterPayment" component={RegisterPaymentScreen} />
    </Stack.Navigator>
  );
}
