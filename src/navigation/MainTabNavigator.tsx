import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { MainTabsParamList } from '../types/navigation';
import { COLORS, SPACING, RADIUS } from '../theme';

import { HomeScreen } from '../screens/Home/HomeScreen';
import { ExpenseNavigator } from './ExpenseNavigator';
import { HouseInfoScreen } from '../screens/House/HouseInfoScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();

/**
 * Tela placeholder para funcionalidades ainda não implementadas na E1.
 */
function ComingSoonScreen({ title }: { title: string }) {
  return (
    <View style={placeholderStyles.container}>
      <View style={placeholderStyles.iconContainer}>
        <Feather name="clock" size={48} color={COLORS.primarySoft} />
      </View>
      <Text style={placeholderStyles.title}>{title}</Text>
      <Text style={placeholderStyles.subtitle}>
        Esta funcionalidade será implementada em breve.
      </Text>
    </View>
  );
}

function TasksPlaceholder() {
  return <ComingSoonScreen title="Tarefas" />;
}

function ShoppingPlaceholder() {
  return <ComingSoonScreen title="Compras" />;
}

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.borderLight,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Feather.glyphMap = 'home';

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Expenses':
              iconName = 'dollar-sign';
              break;
            case 'Tasks':
              iconName = 'check-circle';
              break;
            case 'Shopping':
              iconName = 'shopping-cart';
              break;
            case 'HouseInfo':
              iconName = 'users';
              break;
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpenseNavigator}
        options={{ tabBarLabel: 'Contas' }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksPlaceholder}
        options={{ tabBarLabel: 'Tarefas' }}
      />
      <Tab.Screen
        name="Shopping"
        component={ShoppingPlaceholder}
        options={{ tabBarLabel: 'Compras' }}
      />
      <Tab.Screen
        name="HouseInfo"
        component={HouseInfoScreen}
        options={{ tabBarLabel: 'Casa' }}
      />
    </Tab.Navigator>
  );
}
