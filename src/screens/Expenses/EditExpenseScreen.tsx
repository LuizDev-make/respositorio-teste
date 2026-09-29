import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useExpense } from '../../contexts/ExpenseContext';
import { formatCurrency } from '../../utils/formatters';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { ExpenseStackParamList } from '../../types/navigation';

type EditRoute = RouteProp<ExpenseStackParamList, 'EditExpense'>;
type EditNav = NativeStackNavigationProp<ExpenseStackParamList, 'EditExpense'>;

export const EditExpenseScreen = () => {
  const route = useRoute<EditRoute>();
  const navigation = useNavigation<EditNav>();
  const { expenseId } = route.params;

  const { user } = useAuth();
  const { currentExpense, loadExpense, updateExpense, loadPayments } = useExpense();

  const [title, setTitle] = useState('');
  const [hasPayments, setHasPayments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!user?.uid) return;
      try {
        setIsLoading(true);
        await loadExpense(expenseId, user.uid);
        const paymentsData = await loadPayments(expenseId, user.uid);
        setHasPayments((paymentsData || []).length > 0);
      } catch (err) {
        Alert.alert('Erro', 'Não foi possível carregar a despesa.');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [expenseId, user?.uid]);

  useEffect(() => {
    if (currentExpense) {
      setTitle(currentExpense.title);
    }
  }, [currentExpense]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }
    if (title.trim().length > 100) {
      setError('Máximo 100 caracteres.');
      return;
    }
    if (!user?.uid || !currentExpense) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await updateExpense({
        expenseId,
        userId: user.uid,
        title: title.trim(),
        date: currentExpense.date,
        expectedVersion: currentExpense.version,
      });
      navigation.goBack();
    } catch (err: any) {
      if (err.message?.includes('modificada por outro') || err.message?.includes('version')) {
        setError('A despesa foi modificada por outro usuário. Volte e tente novamente.');
      } else {
        setError(err.message || 'Erro ao salvar. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !currentExpense) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} padding={false}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Editar despesa</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Aviso de pagamentos existentes */}
        {hasPayments && (
          <View style={styles.warningBanner}>
            <Feather name="info" size={18} color={COLORS.primaryDark} />
            <Text style={styles.warningText}>
              Esta despesa já possui pagamentos registrados. Apenas o título e a data podem ser alterados.
            </Text>
          </View>
        )}

        {/* Erro */}
        {error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Formulário */}
        <View style={styles.section}>
          <Input
            label="Descrição"
            placeholder="Ex: Conta de luz"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (error) setError(null);
            }}
            leftIcon="edit-3"
          />

          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Valor total</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyValue}>
                {formatCurrency(currentExpense.totalCents)}
              </Text>
              {hasPayments && (
                <Text style={styles.readOnlyHint}>Bloqueado (existem pagamentos)</Text>
              )}
            </View>
          </View>
        </View>

        <Button
          title="Salvar alterações"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          fullWidth
        />
      </ScrollView>
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
  screenTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  warningText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error,
    flex: 1,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  readOnlyField: {
    marginTop: SPACING.md,
  },
  readOnlyLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  readOnlyBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  readOnlyValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  readOnlyHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});
