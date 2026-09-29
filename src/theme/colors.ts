/**
 * Paleta de cores do app Moradia — baseada no protótipo (telas.png)
 */
export const COLORS = {
  // Primárias
  primary: '#6C3FC5',
  primaryLight: '#EDE7F6',
  primaryDark: '#4A148C',
  primarySoft: '#B39DDB',

  // Neutras
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8F6FC',
  surface: '#FFFFFF',

  // Texto
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Bordas e divisores
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',

  // Feedback
  error: '#DC2626',
  errorLight: '#FEE2E2',
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Cards e overlay
  card: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',

  // Sombras
  shadow: '#000000',
} as const;

export type ColorKey = keyof typeof COLORS;
