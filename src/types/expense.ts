/** Valores monetários em centavos inteiros */
export interface Expense {
  id: string;
  houseId: string;
  authorId: string;
  title: string;
  /** Total em centavos */
  totalCents: number;
  date: Date;
  /** Mês/ano de competência (YYYY-MM) */
  competence: string;
  /** ID do morador que recebe, null = pagamento direto */
  recipientId: string | null;
  version: number;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseSplit {
  expenseId: string;
  memberId: string;
  /** Valor inicialmente pendente em centavos */
  amountCents: number;
}

export interface Payment {
  id: string;
  expenseId: string;
  payerId: string;
  /** Destinatário do pagamento, null = pagamento direto */
  recipientId: string | null;
  amountCents: number;
  paidAt: Date;
  registeredBy: string;
  createdAt: Date;
}

export interface MemberBalance {
  memberId: string;
  displayName: string;
  totalPending: number;
  totalPaid: number;
  remaining: number;
}

export interface MonthSummary {
  competence: string;
  totalExpenses: number;
  totalPending: number;
  totalPaid: number;
}
