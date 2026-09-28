/**
 * Utilitários de formatação para o app Moradia
 */

/**
 * Formata um valor em centavos para o formato de moeda brasileiro (BRL)
 * @param cents Valor em centavos
 * @returns String formatada, ex: "R$ 1.234,56"
 */
export function formatCurrency(cents: number): string {
  const value = (cents / 100).toFixed(2);
  const parts = value.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${parts.join(',')}`;
}

/**
 * Formata uma data para o formato DD/MM/YYYY
 * @param date Objeto Date
 * @returns String formatada, ex: "27/09/2026"
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formata uma data para o formato DD/MM/YYYY HH:mm
 * @param date Objeto Date
 * @returns String formatada, ex: "27/09/2026 15:30"
 */
export function formatDateTime(date: Date): string {
  const dateStr = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Formata competência de YYYY-MM para Nome Mês YYYY
 * @param competence String no formato YYYY-MM
 * @returns String formatada, ex: "Setembro 2026"
 */
export function formatCompetence(competence: string): string {
  const [year, month] = competence.split('-');
  const monthName = MONTHS[parseInt(month, 10) - 1];
  return `${monthName} ${year}`;
}

/**
 * Retorna a competência atual no formato YYYY-MM
 * @returns String no formato YYYY-MM
 */
export function getCurrentCompetence(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Converte input do usuário (string de moeda) para centavos inteiros
 * @param input Input do usuário, ex: "1.234,56" ou "1234.56"
 * @returns Valor em centavos
 */
export function parseCurrencyInput(input: string): number {
  if (!input) return 0;
  // Mantém apenas números
  const numericOnly = input.replace(/[^0-9]/g, '');
  if (!numericOnly) return 0;
  // A string sem símbolos e vírgulas assumindo que as duas últimas casas são decimais
  return parseInt(numericOnly, 10);
}
