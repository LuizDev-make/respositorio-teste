import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ScreenContainer, Card } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useHouse } from '../../contexts/HouseContext';
import { Feather } from '@expo/vector-icons';

type NavigationProp = BottomTabNavigationProp<any>;

export function HomeScreen() {
  const { user } = useAuth();
  const { house, members } = useHouse();
  const navigation = useNavigation<NavigationProp>();

  const firstName = user?.displayName?.split(' ')[0] || 'Usuário';

  const handleNotImplemented = () => {
    Alert.alert('Em breve', 'Esta funcionalidade será implementada em breve.');
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.brand}>moradia</Text>
          <TouchableOpacity 
            style={styles.bellButton}
            onPress={handleNotImplemented}
          >
            <Feather name="bell" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Oi, {firstName}.</Text>
          <Text style={styles.subtitle}>Sua casa, seu ritmo.</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Expenses')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Feather name="dollar-sign" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Contas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleNotImplemented}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.successLight }]}>
              <Feather name="check-circle" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.actionText}>Tarefas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleNotImplemented}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.errorLight }]}>
              <Feather name="shopping-cart" size={24} color={COLORS.error} />
            </View>
            <Text style={styles.actionText}>Compras</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sua Casa</Text>
            <TouchableOpacity onPress={() => navigation.navigate('House')}>
              <Text style={styles.sectionLink}>Ver mais</Text>
            </TouchableOpacity>
          </View>
          
          <Card style={styles.houseCard}>
            <View style={styles.houseIconContainer}>
              <Feather name="home" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.houseInfo}>
              <Text style={styles.houseName}>{house?.name}</Text>
              <Text style={styles.houseMembers}>
                {members.length} {members.length === 1 ? 'morador' : 'moradores'}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textLight} />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividade Recente</Text>
          <View style={styles.emptyState}>
            <Feather name="activity" size={32} color={COLORS.textLight} />
            <Text style={styles.emptyStateText}>Nenhuma atividade recente.</Text>
          </View>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  brand: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  bellButton: {
    padding: SPACING.xs,
  },
  greetingContainer: {
    marginBottom: SPACING.xl,
  },
  greeting: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOW.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionText: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  sectionLink: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontFamily: 'Inter-SemiBold',
  },
  houseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  houseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  houseInfo: {
    flex: 1,
  },
  houseName: {
    ...TYPOGRAPHY.subtitle1,
    color: COLORS.text,
    marginBottom: 4,
  },
  houseMembers: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    ...SHADOW.sm,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
});
