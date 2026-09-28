import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Expense, Payment, MemberBalance, MonthSummary } from '@/types/expense';
import * as expenseService from '@/services/expenseService';

interface ExpenseContextData {
  expenses: Expense[];
  currentExpense: Expense | null;
  monthSummary: MonthSummary | null;
  loading: boolean;
  error: string | null;
  loadExpenses: (houseId: string, competence: string, userId: string) => Promise<void>;
  loadExpense: (expenseId: string, userId: string) => Promise<void>;
  createExpense: (params: expenseService.CreateExpenseParams) => Promise<Expense>;
  updateExpense: (params: expenseService.UpdateExpenseParams) => Promise<Expense>;
  deleteExpense: (expenseId: string, userId: string) => Promise<void>;
  registerPayment: (params: expenseService.RegisterPaymentParams) => Promise<Payment>;
  loadPayments: (expenseId: string, userId: string) => Promise<Payment[]>;
  loadMemberBalance: (houseId: string, memberId: string, competence: string) => Promise<MemberBalance>;
  loadMonthSummary: (houseId: string, competence: string, userId: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

export const ExpenseContext = createContext<ExpenseContextData>({} as ExpenseContextData);

interface ExpenseProviderProps {
  children: ReactNode;
}

export const ExpenseProvider: React.FC<ExpenseProviderProps> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastLoadParams, setLastLoadParams] = useState<{houseId: string, competence: string, userId: string} | null>(null);

  const loadExpenses = useCallback(async (houseId: string, competence: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await expenseService.getExpensesByCompetence(houseId, competence, userId);
      setExpenses(data);
      setLastLoadParams({ houseId, competence, userId });
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar despesas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshExpenses = useCallback(async () => {
    if (lastLoadParams) {
      await loadExpenses(lastLoadParams.houseId, lastLoadParams.competence, lastLoadParams.userId);
    }
  }, [lastLoadParams, loadExpenses]);

  const loadExpense = useCallback(async (expenseId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await expenseService.getExpenseById(expenseId, userId);
      setCurrentExpense(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar despesa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (params: expenseService.CreateExpenseParams) => {
    try {
      setLoading(true);
      setError(null);
      const newExpense = await expenseService.createExpense(params);
      await refreshExpenses();
      return newExpense;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar despesa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshExpenses]);

  const updateExpense = useCallback(async (params: expenseService.UpdateExpenseParams) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await expenseService.updateExpense(params);
      if (currentExpense?.id === updated.id) {
        setCurrentExpense(updated);
      }
      await refreshExpenses();
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar despesa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentExpense, refreshExpenses]);

  const deleteExpense = useCallback(async (expenseId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      await expenseService.deleteExpense(expenseId, userId);
      if (currentExpense?.id === expenseId) {
        setCurrentExpense(null);
      }
      await refreshExpenses();
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar despesa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentExpense, refreshExpenses]);

  const registerPayment = useCallback(async (params: expenseService.RegisterPaymentParams) => {
    try {
      setLoading(true);
      setError(null);
      const payment = await expenseService.registerPayment(params);
      await refreshExpenses();
      return payment;
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar pagamento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshExpenses]);

  const loadPayments = useCallback(async (expenseId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await expenseService.getExpensePayments(expenseId, userId);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pagamentos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMemberBalance = useCallback(async (houseId: string, memberId: string, competence: string) => {
    try {
      setLoading(true);
      setError(null);
      return await expenseService.getMemberBalance(houseId, memberId, competence);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar saldo do membro');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMonthSummary = useCallback(async (houseId: string, competence: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const summary = await expenseService.getMonthSummary(houseId, competence, userId);
      setMonthSummary(summary);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar resumo do mês');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        currentExpense,
        monthSummary,
        loading,
        error,
        loadExpenses,
        loadExpense,
        createExpense,
        updateExpense,
        deleteExpense,
        registerPayment,
        loadPayments,
        loadMemberBalance,
        loadMonthSummary,
        refreshExpenses
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpense deve ser usado dentro de um ExpenseProvider');
  }
  return context;
};
