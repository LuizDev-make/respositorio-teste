import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Input } from '../../components/Input';
import { CurrencyInput } from '../../components/CurrencyInput';
import { Button } from '../../components/Button';
import { MemberAvatar } from '../../components/MemberAvatar';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../contexts/AuthContext';
import { useHouse } from '../../contexts/HouseContext';
import { useExpense } from '../../contexts/ExpenseContext';
import { formatCurrency, getCurrentCompetence } from '../../utils/formatters';
import { calculateEqualSplit } from '../../utils/splitCalculator';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { ExpenseStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<ExpenseStackParamList, 'CreateExpense'>;

export const CreateExpenseScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { house, members } = useHouse();
  const { createExpense } = useExpense();

  const [title, setTitle] = useState('');
  const [totalCents, setTotalCents] = useState(0);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [splitAmounts, setSplitAmounts] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar participantes com todos os moradores
  useEffect(() => {
    if (members.length > 0 && selectedParticipants.length === 0) {
      setSelectedParticipants(members.map((m) => m.userId));
    }
  }, [members]);

  const toggleParticipant = (memberId: string) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(memberId)) {
        const next = prev.filter((id) => id !== memberId);
        const newSplits = { ...splitAmounts };
        delete newSplits[memberId];
        setSplitAmounts(newSplits);
        return next;
      }
      return [...prev, memberId];
    });
  };

  const handleSuggestEqualSplit = () => {
    if (totalCents <= 0) {
      Alert.alert('Atenção', 'Informe um valor total maior que zero primeiro.');
      return;
    }
    if (selectedParticipants.length === 0) {
      Alert.alert('Atenção', 'Selecione ao menos um participante.');
      return;
    }

    const splits = calculateEqualSplit(totalCents, selectedParticipants, recipientId);
    const newAmounts: Record<string, number> = {};
    splits.forEach((s) => {
      newAmounts[s.memberId] = s.amountCents;
    });
    setSplitAmounts(newAmounts);
  };

  const handleUpdateSplit = (memberId: string, value: number) => {
    setSplitAmounts((prev) => ({ ...prev, [memberId]: value }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'A descrição é obrigatória.';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Máximo 100 caracteres.';
    }
    if (totalCents <= 0) {
      newErrors.amount = 'O valor total deve ser maior que zero.';
    }
    if (selectedParticipants.length === 0) {
      newErrors.participants = 'Selecione ao menos um participante.';
    }

    // Validar splits
    let sumSplits = 0;
    for (const pid of selectedParticipants) {
      const amount = splitAmounts[pid] || 0;
      if (amount < 0) {
        newErrors.splits = 'As divisões não podem ter valores negativos.';
        break;
      }
      if (pid === recipientId && amount > 0) {
        newErrors.splits = 'O recebedor não pode pagar a si mesmo. O valor dele deve ser zero.';
        break;
      }
      sumSplits += amount;
    }

    if (!newErrors.splits && sumSplits > totalCents) {
      newErrors.splits = 'A soma das divisões não pode ser maior que o total.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user?.uid || !house?.id) return;

    const now = new Date();
    const competence = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const splits = selectedParticipants.map((pid) => ({
      memberId: pid,
      amountCents: splitAmounts[pid] || 0,
    }));

    try {
      setIsSubmitting(true);
      await createExpense({
        houseId: house.id,
        authorId: user.uid,
        title: title.trim(),
        totalCents,
        date: now,
        competence,
        recipientId,
        splits,
      });
      navigation.goBack();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Erro ao registrar despesa. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberName = (userId: string): string => {
    const member = members.find((m) => m.userId === userId);
    return member?.displayName || 'Morador';
  };

  return (
    <ScreenContainer scroll={false} padding={false}>
      {isSubmitting && <LoadingOverlay visible message="Salvando despesa..." />}

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Registrar despesa</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Erros globais */}
        {errors.submit && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={COLORS.error} />
            <Text style={styles.errorBannerText}>{errors.submit}</Text>
          </View>
        )}

        {/* Campos do formulário */}
        <View style={styles.section}>
          <Input
            label="Descrição"
            placeholder="Ex: Conta de luz, Supermercado"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors((e) => ({ ...e, title: '' }));
            }}
            error={errors.title}
            leftIcon="edit-3"
          />

          <CurrencyInput
            label="Valor total"
            value={totalCents}
            onChangeValue={(val) => {
              setTotalCents(val);
              if (errors.amount) setErrors((e) => ({ ...e, amount: '' }));
            }}
            error={errors.amount}
          />

          <Text style={styles.dateNote}>
            Data: {new Date().toLocaleDateString('pt-BR')} (Hoje)
          </Text>
        </View>

        {/* Quem recebe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quem recebe</Text>
          <Text style={styles.sectionHint}>
            Selecione quem vai receber o valor. Se ninguém recebe, é um pagamento direto.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.chip, recipientId === null && styles.chipSelected]}
              onPress={() => setRecipientId(null)}
            >
              <Feather name="external-link" size={16} color={recipientId === null ? COLORS.primaryDark : COLORS.textSecondary} />
              <Text style={[styles.chipText, recipientId === null && styles.chipTextSelected]}>
                Ninguém (direto)
              </Text>
            </TouchableOpacity>

            {members.map((member) => (
              <TouchableOpacity
                key={`rec-${member.userId}`}
                style={[styles.chip, recipientId === member.userId && styles.chipSelected]}
                onPress={() => {
                  setRecipientId(member.userId);
                  // Zerar a divisão do recebedor automaticamente
                  setSplitAmounts((prev) => ({ ...prev, [member.userId]: 0 }));
                }}
              >
                <MemberAvatar name={member.displayName} size={20} />
                <Text style={[styles.chipText, recipientId === member.userId && styles.chipTextSelected]}>
                  {member.displayName.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Participantes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participantes</Text>
          {errors.participants && <Text style={styles.fieldError}>{errors.participants}</Text>}
          {members.map((member) => (
            <TouchableOpacity
              key={`part-${member.userId}`}
              style={styles.participantRow}
              onPress={() => toggleParticipant(member.userId)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, selectedParticipants.includes(member.userId) && styles.checkboxSelected]}>
                {selectedParticipants.includes(member.userId) && (
                  <Feather name="check" size={14} color={COLORS.white} />
                )}
              </View>
              <MemberAvatar name={member.displayName} size={32} />
              <Text style={styles.participantName}>{member.displayName}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divisão */}
        <View style={styles.section}>
          <View style={styles.splitHeader}>
            <Text style={styles.sectionTitle}>Divisão</Text>
            <TouchableOpacity style={styles.suggestButton} onPress={handleSuggestEqualSplit}>
              <Feather name="pie-chart" size={16} color={COLORS.primary} />
              <Text style={styles.suggestText}>Divisão igual</Text>
            </TouchableOpacity>
          </View>

          {errors.splits && <Text style={styles.fieldError}>{errors.splits}</Text>}

          {selectedParticipants.length === 0 ? (
            <Text style={styles.emptyText}>Selecione os participantes acima.</Text>
          ) : (
            selectedParticipants.map((memberId) => {
              const isRecipient = memberId === recipientId;
              const currentValue = splitAmounts[memberId] || 0;
              return (
                <View key={`split-${memberId}`} style={styles.splitRow}>
                  <View style={styles.splitMemberInfo}>
                    <MemberAvatar name={getMemberName(memberId)} size={32} />
                    <Text style={styles.splitMemberName}>
                      {getMemberName(memberId).split(' ')[0]}
                    </Text>
                  </View>
                  <View style={styles.splitInputContainer}>
                    {isRecipient ? (
                      <Text style={styles.recipientNote}>R$ 0,00 (Recebedor)</Text>
                    ) : (
                      <CurrencyInput
                        value={currentValue}
                        onChangeValue={(val) => handleUpdateSplit(memberId, val)}
                      />
                    )}
                  </View>
                </View>
              );
            })
          )}

          {/* Resumo da divisão */}
          {selectedParticipants.length > 0 && (
            <View style={styles.splitSummary}>
              <Text style={styles.splitSummaryText}>
                Soma: {formatCurrency(selectedParticipants.reduce((acc, pid) => acc + (splitAmounts[pid] || 0), 0))}
                {' / '}
                Total: {formatCurrency(totalCents)}
              </Text>
            </View>
          )}
        </View>

        {/* Botão registrar */}
        <Button
          title="Registrar despesa"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          fullWidth
        />
        <View style={styles.bottomPadding} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  errorBannerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error,
    flex: 1,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  dateNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    gap: SPACING.xs,
  },
  chipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  participantName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  fieldError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.xs,
  },
  suggestText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  splitMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  splitMemberName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  splitInputContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  recipientNote: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.success,
    fontWeight: '600',
  },
  splitSummary: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  splitSummaryText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primaryDark,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
});
