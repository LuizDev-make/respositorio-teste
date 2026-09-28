/**
 * Utilitários de validação para o app Moradia
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 6) {
    return { valid: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
  }
  return { valid: true, message: '' };
}

export function validateHouseName(name: string): { valid: boolean; message: string } {
  if (!name || name.trim().length < 3) {
    return { valid: false, message: 'O nome da casa deve ter pelo menos 3 caracteres.' };
  }
  if (name.length > 50) {
    return { valid: false, message: 'O nome da casa não pode exceder 50 caracteres.' };
  }
  return { valid: true, message: '' };
}

export function validateExpenseTitle(title: string): { valid: boolean; message: string } {
  if (!title || title.trim().length < 3) {
    return { valid: false, message: 'O título da despesa deve ter pelo menos 3 caracteres.' };
  }
  if (title.length > 100) {
    return { valid: false, message: 'O título da despesa não pode exceder 100 caracteres.' };
  }
  return { valid: true, message: '' };
}

export function validateAmountCents(cents: number): { valid: boolean; message: string } {
  if (cents <= 0) {
    return { valid: false, message: 'O valor deve ser maior que zero.' };
  }
  return { valid: true, message: '' };
}

export function validateSplitAmounts(
  splits: { memberId: string; amountCents: number }[],
  totalCents: number,
  recipientId: string | null
): { valid: boolean; message: string } {
  const sum = splits.reduce((acc, split) => acc + split.amountCents, 0);
  
  if (sum > totalCents) {
    return { valid: false, message: 'A soma das divisões não pode exceder o valor total.' };
  }

  const hasNegative = splits.some(split => split.amountCents < 0);
  if (hasNegative) {
    return { valid: false, message: 'As divisões não podem ter valores negativos.' };
  }

  // Verifica se o recebedor está na divisão com valor > 0
  if (recipientId) {
    const recipientSplit = splits.find(s => s.memberId === recipientId);
    if (recipientSplit && recipientSplit.amountCents > 0) {
      return { valid: false, message: 'O recebedor não pode pagar a si mesmo.' };
    }
  }

  return { valid: true, message: '' };
}

export function validateTaskTitle(title: string): { valid: boolean; message: string } {
  if (!title || title.trim().length < 3) {
    return { valid: false, message: 'O título da tarefa deve ter pelo menos 3 caracteres.' };
  }
  if (title.length > 100) {
    return { valid: false, message: 'O título da tarefa não pode exceder 100 caracteres.' };
  }
  return { valid: true, message: '' };
}
