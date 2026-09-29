import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useHouse } from '../../contexts/HouseContext';
import { useExpense } from '../../contexts/ExpenseContext';
import { formatCurrency, formatDate, getCurrentCompetence, formatCompetence } from '../../utils/formatters';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOW } from '../../theme';
import { ExpenseStackParamList } from '../../types/navigation';
import { Expense } from '../../types/expense';

type NavigationProp = NativeStackNavigationProp<ExpenseStackParamList, 'ExpenseList'>;

export const ExpenseListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { house } = useHouse();
  const { expenses, monthSummary, loading, loadExpenses, loadMonthSummary } = useExpense();

  const [competence, setCompetence] = useState(getCurrentCompetence());
  const [refreshing, setRefreshing] = useState(false);

  const fetchMonthData = useCallback(async () => {
    if (!house?.id || !user?.uid) return;
    try {
      await Promise.all([
        loadExpenses(house.id, competence, user.uid),
        loadMonthSummary(house.id, competence, user.uid),
      ]);
    } catch {
      // Erros tratados pelo contexto
    }
  }, [house?.id, competence, user?.uid, loadExpenses, loadMonthSummary]);

  useFocusEffect(
    useCallback(() => {
      fetchMonthData();
    }, [fetchMonthData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMonthData();
    setRefreshing(false);
  };

  const handlePrevMonth = () => {
    const [year, month] = competence.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    setCompetence(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleNextMonth = () => {
    const [year, month] = competence.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    setCompetence(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const renderExpenseCard = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item.id })}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardAmount}>{formatCurrency(item.totalCents)}</Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.dateContainer}>
            <Feather name="calendar" size={14} color={COLORS.textLight} />
            <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
          </View>
          <Text style={styles.cardMeta}>
            {item.recipientId ? 'Para morador' : 'Pagamento direto'}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer scroll={false} padding={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Contas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateExpense')}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Seletor de mês */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrow}>
          <Feather name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{formatCompetence(competence)}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrow}>
          <Feather name="chevron-right" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Resumo do mês */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total de despesas</Text>
        <Text style={styles.summaryAmount}>
          {formatCurrency(monthSummary?.totalExpenses ?? 0)}
        </Text>
        {monthSummary && monthSummary.totalPending > 0 && (
          <Text style={styles.summaryPending}>
            Pendente: {formatCurrency(monthSummary.totalPending - monthSummary.totalPaid)}
          </Text>
        )}
      </View>

      {/* Lista de despesas */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="Nenhuma despesa neste mês"
              message="Toque no botão + para registrar uma nova despesa."
              icon="file-text"
            />
          ) : null
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.card,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  monthArrow: {
    padding: SPACING.xs,
  },
  monthText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
  },
  summaryCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    ...SHADOW.card,
  },
  summaryLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primaryLight,
    marginBottom: SPACING.xs,
  },
  summaryAmount: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
  },
  summaryPending: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primaryLight,
    marginTop: SPACING.xs,
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  cardAmount: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  cardDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  cardMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});
