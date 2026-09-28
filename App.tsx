import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from './src/contexts/AuthContext';
import { HouseProvider } from './src/contexts/HouseContext';
import { TaskProvider } from './src/contexts/TaskContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AuthProvider>
          <HouseProvider>
            <TaskProvider>
              <RootNavigator />
            </TaskProvider>
          </HouseProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
