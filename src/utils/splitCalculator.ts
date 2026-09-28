import { ExpenseSplit } from '../types/expense';

/**
 * Calcula a divisão igualitária de uma despesa.
 * Distribui qualquer resto (centavos) de forma determinística (1 centavo a mais para os primeiros).
 * Se o recipientId estiver nos participantes, a parte dele é calculada como 0, 
 * e o valor é dividido apenas entre os outros.
 * 
 * @param totalCents Valor total em centavos
 * @param participantIds Array com os IDs dos participantes
 * @param recipientId ID do recebedor (caso seja um pagamento direto)
 * @param expenseId ID da despesa (para gerar as splits corretamente)
 * @returns Array de ExpenseSplit
 */
export function calculateEqualSplit(
  totalCents: number,
  participantIds: string[],
  recipientId: string | null,
  expenseId: string = ''
): ExpenseSplit[] {
  if (participantIds.length === 0) return [];
  if (totalCents <= 0) {
    return participantIds.map(memberId => ({
      expenseId,
      memberId,
      amountCents: 0
    }));
  }

  // Removemos o recebedor da conta de divisão, pois ele não paga a si mesmo
  const payers = participantIds.filter(id => id !== recipientId);
  const numberOfPayers = payers.length;

  if (numberOfPayers === 0) {
    return participantIds.map(memberId => ({
      expenseId,
      memberId,
      amountCents: 0
    }));
  }

  const baseAmount = Math.floor(totalCents / numberOfPayers);
  let remainder = totalCents % numberOfPayers;

  return participantIds.map(memberId => {
    if (memberId === recipientId) {
      return { expenseId, memberId, amountCents: 0 };
    }

    let amountCents = baseAmount;
    if (remainder > 0) {
      amountCents += 1;
      remainder -= 1;
    }

    return { expenseId, memberId, amountCents };
  });
}

/**
 * Valida a integridade das divisões informadas.
 * 
 * @param splits Array com as divisões
 * @param totalCents Total esperado
 * @returns Resultado da validação
 */
export function validateSplits(
  splits: ExpenseSplit[],
  totalCents: number
): { valid: boolean; message: string } {
  if (!splits || splits.length === 0) {
    return { valid: false, message: 'Nenhum participante na divisão.' };
  }

  const sum = splits.reduce((acc, split) => acc + split.amountCents, 0);

  if (sum > totalCents) {
    return { valid: false, message: 'A soma das divisões não pode exceder o valor total.' };
  }

  const hasNegative = splits.some(split => split.amountCents < 0);
  if (hasNegative) {
    return { valid: false, message: 'As divisões não podem ter valores negativos.' };
  }

  const hasInvalidMember = splits.some(split => !split.memberId);
  if (hasInvalidMember) {
    return { valid: false, message: 'ID de membro inválido em uma das divisões.' };
  }

  return { valid: true, message: '' };
}
