import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CurrencyInput } from '../../components/CurrencyInput';
import { Button } from '../../components/Button';
import { MemberAvatar } from '../../components/MemberAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useHouse } from '../../contexts/HouseContext';
import { useExpense } from '../../contexts/ExpenseContext';
import { formatCurrency } from '../../utils/formatters';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOW } from '../../theme';
import { ExpenseStackParamList } from '../../types/navigation';

type PaymentRoute = RouteProp<ExpenseStackParamList, 'RegisterPayment'>;
type PaymentNav = NativeStackNavigationProp<ExpenseStackParamList, 'RegisterPayment'>;

export const RegisterPaymentScreen = () => {
  const route = useRoute<PaymentRoute>();
  const navigation = useNavigation<PaymentNav>();
  const { expenseId, payerId, payerName, maxAmountCents } = route.params;

  const { user } = useAuth();
  const { currentExpense, registerPayment } = useExpense();
  const { members } = useHouse();

  const [amountCents, setAmountCents] = useState(maxAmountCents);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipientName = currentExpense?.recipientId
    ? members.find((m) => m.userId === currentExpense.recipientId)?.displayName || 'Morador'
    : 'Externo (pagamento direto)';

  const handleSubmit = async () => {
    if (amountCents <= 0) {
      setError('O valor do pagamento deve ser maior que zero.');
      return;
    }
    if (amountCents > maxAmountCents) {
      setError(`O valor não pode ultrapassar ${formatCurrency(maxAmountCents)}.`);
      return;
    }
    if (!user?.uid) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await registerPayment({
        expenseId,
        payerId,
        amountCents,
        registeredBy: user.uid,
      });

      Alert.alert('Pagamento registrado!', `${payerName} pagou ${formatCurrency(amountCents)}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar pagamento. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer padding={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Registrar pagamento</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Erro */}
        {error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Fluxo: Pagador → Recebedor */}
        <View style={styles.flowCard}>
          <View style={styles.flowSide}>
            <MemberAvatar name={payerName} size={48} />
            <Text style={styles.flowName}>{payerName}</Text>
            <Text style={styles.flowRole}>Pagador</Text>
          </View>

          <View style={styles.flowArrow}>
            <Feather name="arrow-right" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.flowSide}>
            <View style={styles.recipientCircle}>
              <Feather
                name={currentExpense?.recipientId ? 'user' : 'external-link'}
                size={24}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.flowName}>{recipientName}</Text>
            <Text style={styles.flowRole}>Recebedor</Text>
          </View>
        </View>

        {/* Valor pendente */}
        <View style={styles.pendingInfo}>
          <Text style={styles.pendingLabel}>Valor pendente</Text>
          <Text style={styles.pendingAmount}>{formatCurrency(maxAmountCents)}</Text>
        </View>

        {/* Input de valor */}
        <View style={styles.formSection}>
          <CurrencyInput
            label="Valor a pagar"
            value={amountCents}
            onChangeValue={(val) => {
              setAmountCents(val);
              if (error) setError(null);
            }}
          />
        </View>

        {/* Botão confirmar */}
        <Button
          title="Confirmar pagamento"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          icon="check"
          fullWidth
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backButton: {
    padding: SPACING.xs,
  },
  screenTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error,
    flex: 1,
  },
  flowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
    ...SHADOW.card,
  },
  flowSide: {
    flex: 1,
    alignItems: 'center',
  },
  flowName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  flowRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  flowArrow: {
    paddingHorizontal: SPACING.md,
  },
  recipientCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingInfo: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  pendingLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  pendingAmount: {
    ...TYPOGRAPHY.h2,
    color: COLORS.error,
  },
  formSection: {
    marginBottom: SPACING.xl,
  },
});
