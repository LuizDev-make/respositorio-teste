import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { MemberAvatar } from '../../components/MemberAvatar';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useHouse } from '../../contexts/HouseContext';
import { useExpense } from '../../contexts/ExpenseContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOW } from '../../theme';
import { ExpenseStackParamList } from '../../types/navigation';
import { ExpenseSplit, Payment } from '../../types/expense';

type DetailRoute = RouteProp<ExpenseStackParamList, 'ExpenseDetail'>;
type DetailNav = NativeStackNavigationProp<ExpenseStackParamList, 'ExpenseDetail'>;

interface SplitWithPayments extends ExpenseSplit {
  totalPaid: number;
  remaining: number;
}

export const ExpenseDetailScreen = () => {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<DetailNav>();
  const { expenseId } = route.params;

  const { user } = useAuth();
  const { members } = useHouse();
  const { currentExpense, loadExpense, deleteExpense, loadPayments } = useExpense();

  const [splits, setSplits] = useState<SplitWithPayments[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getMemberName = useCallback(
    (userId: string): string => {
      const member = members.find((m) => m.userId === userId);
      return member?.displayName || 'Morador';
    },
    [members]
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        await loadExpense(expenseId, user.uid);
        const paymentsData = await loadPayments(expenseId, user.uid);
        setPayments(paymentsData || []);

        // Buscar splits
        const q = query(collection(db, 'expense_splits'), where('expenseId', '==', expenseId));
        const snapshot = await getDocs(q);
        const rawSplits = snapshot.docs.map((doc) => doc.data() as ExpenseSplit);

        // Calcular pagamentos por membro
        const paidByMember: Record<string, number> = {};
        (paymentsData || []).forEach((p: Payment) => {
          paidByMember[p.payerId] = (paidByMember[p.payerId] || 0) + p.amountCents;
        });

        const enriched: SplitWithPayments[] = rawSplits.map((s) => ({
          ...s,
          totalPaid: paidByMember[s.memberId] || 0,
          remaining: s.amountCents - (paidByMember[s.memberId] || 0),
        }));

        setSplits(enriched);
      } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes da despesa.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [expenseId, user?.uid]);

  const handleDelete = async () => {
    if (!user?.uid) return;
    try {
      setIsDeleting(true);
      await deleteExpense(expenseId, user.uid);
      setShowDeleteConfirm(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir a despesa.');
      setIsDeleting(false);
    }
  };

  const handleRegisterPayment = (split: SplitWithPayments) => {
    if (split.remaining <= 0) return;
    navigation.navigate('RegisterPayment', {
      expenseId,
      payerId: split.memberId,
      payerName: getMemberName(split.memberId),
      maxAmountCents: split.remaining,
    });
  };

  if (loading || !currentExpense) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const isAuthor = user?.uid === currentExpense.authorId;
  const hasPayments = payments.length > 0;
  const recipientName = currentExpense.recipientId
    ? getMemberName(currentExpense.recipientId)
    : null;

  return (
    <ScreenContainer scroll={false} padding={false}>
      {isDeleting && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header com voltar */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes da despesa</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Info principal */}
        <View style={styles.mainInfo}>
          <Text style={styles.expenseTitle}>{currentExpense.title}</Text>
          <Text style={styles.expenseAmount}>
            {formatCurrency(currentExpense.totalCents)}
          </Text>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={14} color={COLORS.textLight} />
            <Text style={styles.metaText}>{formatDate(currentExpense.date)}</Text>
          </View>
        </View>

        {/* Informações gerais */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Criado por</Text>
            <View style={styles.infoValue}>
              <MemberAvatar name={getMemberName(currentExpense.authorId)} size={24} />
              <Text style={styles.infoName}>{getMemberName(currentExpense.authorId)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quem recebe</Text>
            <View style={styles.infoValue}>
              {recipientName ? (
                <>
                  <MemberAvatar name={recipientName} size={24} />
                  <Text style={styles.infoName}>{recipientName}</Text>
                </>
              ) : (
                <>
                  <Feather name="external-link" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.infoName}>Pagamento direto (externo)</Text>
                </>
              )}
            </View>
          </View>
        </Card>

        {/* Divisão / Quem falta pagar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Divisão</Text>
          {splits
            .filter((s) => !(currentExpense.recipientId === s.memberId && s.amountCents === 0))
            .map((split) => {
              const isPaid = split.remaining <= 0;
              return (
                <Card key={split.memberId} style={styles.splitCard}>
                  <View style={styles.splitRow}>
                    <MemberAvatar name={getMemberName(split.memberId)} size={40} />
                    <View style={styles.splitInfo}>
                      <Text style={styles.splitName}>{getMemberName(split.memberId)}</Text>
                      <Text style={styles.splitDetail}>
                        Pendência inicial: {formatCurrency(split.amountCents)}
                      </Text>
                      {split.totalPaid > 0 && (
                        <Text style={styles.splitPaid}>
                          Pago: {formatCurrency(split.totalPaid)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.splitStatus}>
                      <Text
                        style={[
                          styles.statusAmount,
                          isPaid ? styles.paidColor : styles.pendingColor,
                        ]}
                      >
                        {isPaid ? 'Pago' : formatCurrency(split.remaining)}
                      </Text>
                      {!isPaid && (
                        <Text style={styles.statusLabel}>Pendente</Text>
                      )}
                    </View>
                  </View>
                  {!isPaid && (
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() => handleRegisterPayment(split)}
                      activeOpacity={0.7}
                    >
                      <Feather name="dollar-sign" size={14} color={COLORS.primaryDark} />
                      <Text style={styles.payButtonText}>Registrar pagamento</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              );
            })}
        </View>

        {/* Histórico de pagamentos */}
        {payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pagamentos registrados</Text>
            {payments.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={styles.paymentLeft}>
                  <Feather name="check-circle" size={16} color={COLORS.success} />
                  <Text style={styles.paymentPayer}>
                    {getMemberName(payment.payerId)}
                  </Text>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(payment.amountCents)}
                  </Text>
                  <Text style={styles.paymentDate}>{formatDate(payment.paidAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Ações do autor */}
        {isAuthor && (
          <View style={styles.actions}>
            <Button
              title="Editar despesa"
              variant="outline"
              icon="edit-2"
              onPress={() => navigation.navigate('EditExpense', { expenseId })}
              fullWidth
            />
            <Button
              title="Excluir despesa"
              variant="danger"
              icon="trash-2"
              onPress={() => setShowDeleteConfirm(true)}
              fullWidth
            />
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Excluir esta despesa?"
        message={
          hasPayments
            ? 'Esta despesa possui pagamentos registrados. A exclusão é lógica e retirará dos totais.'
            : 'Tem certeza que deseja excluir esta despesa?'
        }
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        destructive
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  deletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  container: {
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerPlaceholder: {
    width: 32,
  },
  mainInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  expenseTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  expenseAmount: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
  },
  infoCard: {
    marginBottom: SPACING.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  infoLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  infoValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  splitCard: {
    marginBottom: SPACING.md,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  splitName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  splitDetail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  splitPaid: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginTop: 2,
  },
  splitStatus: {
    alignItems: 'flex-end',
  },
  statusAmount: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  paidColor: {
    color: COLORS.success,
  },
  pendingColor: {
    color: COLORS.error,
  },
  statusLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  payButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  payButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  paymentPayer: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.success,
  },
  paymentDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  actions: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
});
