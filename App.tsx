import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from './src/contexts/AuthContext';
import { HouseProvider } from './src/contexts/HouseContext';
import { TaskProvider } from './src/contexts/TaskContext';
import { ExpenseProvider } from './src/contexts/ExpenseContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AuthProvider>
          <HouseProvider>
            <ExpenseProvider>
              <TaskProvider>
                <RootNavigator />
              </TaskProvider>
            </ExpenseProvider>
          </HouseProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
