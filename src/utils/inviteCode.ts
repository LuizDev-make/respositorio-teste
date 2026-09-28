import { INVITE_CODE_CHARS, INVITE_CODE_LENGTH } from '@/config/constants';

/**
 * Gera um código de convite alfanumérico único e não sequencial.
 * Usa caracteres sem ambiguidade (sem 0/O, 1/I/L).
 */
export function generateInviteCode(): string {
  let code = '';
  const array = new Uint8Array(INVITE_CODE_LENGTH);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
      code += INVITE_CODE_CHARS[array[i] % INVITE_CODE_CHARS.length];
    }
  } else {
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
      code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
    }
  }
  return code;
}

/**
 * Normaliza código de convite: remove espaços, converte para maiúsculas.
 */
export function normalizeInviteCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase().trim();
}

/**
 * Valida formato do código de convite.
 */
export function isValidInviteCodeFormat(code: string): boolean {
  const normalized = normalizeInviteCode(code);
  if (normalized.length !== INVITE_CODE_LENGTH) return false;
  return [...normalized].every((char) => INVITE_CODE_CHARS.includes(char));
}
