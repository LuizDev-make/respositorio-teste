import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useHouse } from '../contexts/HouseContext';
import { COLORS, SPACING } from '../theme';

import { AuthNavigator } from './AuthNavigator';
import { HouseNavigator } from './HouseNavigator';
import { MainTabNavigator } from './MainTabNavigator';

/**
 * RootNavigator — controla o fluxo de navegação principal:
 *
 * 1. Sem sessão → AuthNavigator (Welcome, Login, Register, ForgotPassword)
 * 2. Autenticado sem casa → HouseNavigator (HouseChoice, CreateHouse, JoinHouse)
 * 3. Autenticado com casa → MainTabNavigator (Home, Contas, Tarefas, Compras, Casa)
 */
export function RootNavigator() {
  const { user, loading: authLoading } = useAuth();
  const { house, loading: houseLoading, loadUserHouse } = useHouse();

  // Quando o usuário autentica, carrega a casa dele
  useEffect(() => {
    if (user && !house) {
      loadUserHouse(user.uid);
    }
  }, [user, house, loadUserHouse]);

  // Tela de carregamento inicial
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>moradia</Text>
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  // Usuário não autenticado → telas de auth
  if (!user) {
    return <AuthNavigator />;
  }

  // Aguardando verificação da casa
  if (houseLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Verificando sua casa...</Text>
      </View>
    );
  }

  // Autenticado sem casa → fluxo de configuração da casa
  if (!house) {
    return <HouseNavigator />;
  }

  // Autenticado com casa → app principal
  return <MainTabNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    gap: SPACING.md,
  },
  brandContainer: {
    marginBottom: SPACING.xl,
  },
  brandText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
});
