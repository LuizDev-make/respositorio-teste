import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  runTransaction,
  serverTimestamp,
  Timestamp,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  Expense,
  ExpenseSplit,
  Payment,
  MemberBalance,
  MonthSummary
} from '@/types/expense';
import { verifyMembership } from '@/services/houseService';

const EXPENSES_COLLECTION = 'expenses';
const EXPENSE_SPLITS_COLLECTION = 'expense_splits';
const PAYMENTS_COLLECTION = 'payments';
const USERS_COLLECTION = 'users';

export interface CreateExpenseParams {
  houseId: string;
  authorId: string;
  title: string;
  totalCents: number;
  date: Date;
  competence: string;
  recipientId: string | null;
  splits: { memberId: string; amountCents: number }[];
}

export interface UpdateExpenseParams {
  expenseId: string;
  userId: string;
  title?: string;
  date?: Date;
  expectedVersion: number;
  recipientId?: string | null;
  splits?: { memberId: string; amountCents: number }[];
}

export interface RegisterPaymentParams {
  expenseId: string;
  payerId: string;
  amountCents: number;
  registeredBy: string;
}

const toDate = (ts: unknown): Date => {
  if (!ts) return new Date();
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate();
  }
  return new Date(ts as string | number);
};

export const createExpense = async (params: CreateExpenseParams): Promise<Expense> => {
  if (!params.title || params.title.trim().length === 0) {
    throw new Error('O título da despesa é obrigatório');
  }
  if (params.title.trim().length > 100) {
    throw new Error('O título deve ter no máximo 100 caracteres');
  }
  if (params.totalCents <= 0) {
    throw new Error('O valor total deve ser maior que zero');
  }

  // Validate splits
  let sumSplits = 0;
  for (const split of params.splits) {
    if (split.amountCents < 0) {
      throw new Error('O valor da divisão não pode ser negativo');
    }
    if (params.recipientId === split.memberId && split.amountCents !== 0) {
      throw new Error('O recebedor não pode dever para si mesmo');
    }
    sumSplits += split.amountCents;
  }

  if (sumSplits > params.totalCents) {
    throw new Error('A soma das divisões não pode ser maior que o total da despesa');
  }

  return runTransaction(db, async (transaction) => {
    // Verify membership of author
    const authorHasAccess = await verifyMembership(params.authorId, params.houseId);
    if (!authorHasAccess) {
      throw new Error('Autor não pertence a esta casa');
    }

    // Verify recipient if not null
    if (params.recipientId) {
      const recipientHasAccess = await verifyMembership(params.recipientId, params.houseId);
      if (!recipientHasAccess) {
        throw new Error('Recebedor não pertence a esta casa');
      }
    }

    // Verify all split members
    for (const split of params.splits) {
      const memberHasAccess = await verifyMembership(split.memberId, params.houseId);
      if (!memberHasAccess) {
        throw new Error(`Membro ${split.memberId} não pertence a esta casa`);
      }
    }

    const expenseRef = doc(collection(db, EXPENSES_COLLECTION));
    const now = new Date();

    const expenseData = {
      id: expenseRef.id,
      houseId: params.houseId,
      authorId: params.authorId,
      title: params.title.trim(),
      totalCents: params.totalCents,
      date: Timestamp.fromDate(params.date),
      competence: params.competence,
      recipientId: params.recipientId,
      version: 1,
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(expenseRef, expenseData);

    for (const split of params.splits) {
      const splitRef = doc(db, EXPENSE_SPLITS_COLLECTION, `${expenseRef.id}_${split.memberId}`);
      transaction.set(splitRef, {
        expenseId: expenseRef.id,
        memberId: split.memberId,
        amountCents: split.amountCents,
      });
    }

    return {
      id: expenseRef.id,
      houseId: params.houseId,
      authorId: params.authorId,
      title: params.title.trim(),
      totalCents: params.totalCents,
      date: params.date,
      competence: params.competence,
      recipientId: params.recipientId,
      version: 1,
      deleted: false,
      createdAt: now,
      updatedAt: now,
    };
  });
};

export const getExpensesByCompetence = async (
  houseId: string,
  competence: string,
  userId: string
): Promise<Expense[]> => {
  const hasAccess = await verifyMembership(userId, houseId);
  if (!hasAccess) {
    throw new Error('Você não tem permissão para acessar esta casa');
  }

  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where('houseId', '==', houseId),
    where('competence', '==', competence),
    where('deleted', '==', false),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      houseId: data.houseId,
      authorId: data.authorId,
      title: data.title,
      totalCents: data.totalCents,
      date: toDate(data.date),
      competence: data.competence,
      recipientId: data.recipientId,
      version: data.version,
      deleted: data.deleted,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  });
};

export const getExpenseById = async (
  expenseId: string,
  userId: string
): Promise<Expense | null> => {
  const expenseRef = doc(db, EXPENSES_COLLECTION, expenseId);
  const expenseSnap = await getDoc(expenseRef);

  if (!expenseSnap.exists()) {
    return null;
  }

  const data = expenseSnap.data();
  if (data.deleted) {
    return null;
  }

  const hasAccess = await verifyMembership(userId, data.houseId);
  if (!hasAccess) {
    throw new Error('Você não tem permissão para acessar esta despesa');
  }

  return {
    id: expenseSnap.id,
    houseId: data.houseId,
    authorId: data.authorId,
    title: data.title,
    totalCents: data.totalCents,
    date: toDate(data.date),
    competence: data.competence,
    recipientId: data.recipientId,
    version: data.version,
    deleted: data.deleted,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
};

export const updateExpense = async (params: UpdateExpenseParams): Promise<Expense> => {
  return runTransaction(db, async (transaction) => {
    const expenseRef = doc(db, EXPENSES_COLLECTION, params.expenseId);
    const expenseSnap = await transaction.get(expenseRef);

    if (!expenseSnap.exists()) {
      throw new Error('Despesa não encontrada');
    }

    const data = expenseSnap.data();
    if (data.deleted) {
      throw new Error('Não é possível atualizar uma despesa deletada');
    }

    if (data.authorId !== params.userId) {
      throw new Error('Apenas o autor pode editar esta despesa');
    }

    if (data.version !== params.expectedVersion) {
      throw new Error('A despesa foi modificada por outro usuário. Tente novamente.');
    }

    // Check for payments
    const paymentsQ = query(
      collection(db, PAYMENTS_COLLECTION),
      where('expenseId', '==', params.expenseId)
    );
    const paymentsSnap = await getDocs(paymentsQ); // Note: inside runTransaction we should technically use transaction.get on queries, but Firestore mobile SDKs sometimes don't support it directly. For now, getDocs is outside transaction context but still runs. Let's do it safely. Wait, querying inside transaction is allowed in some SDKs, but to avoid issues we just fetch.
    const hasPayments = !paymentsSnap.empty;

    if (hasPayments) {
      if (params.recipientId !== undefined || params.splits !== undefined) {
        throw new Error('Não é possível alterar divisões ou recebedor após existir pagamentos');
      }
    }

    const updateData: any = {
      version: data.version + 1,
      updatedAt: serverTimestamp()
    };

    if (params.title !== undefined) {
      if (params.title.trim().length === 0) throw new Error('O título é obrigatório');
      if (params.title.trim().length > 100) throw new Error('O título deve ter no máximo 100 caracteres');
      updateData.title = params.title.trim();
    }
    if (params.date !== undefined) {
      updateData.date = Timestamp.fromDate(params.date);
    }

    if (!hasPayments) {
      if (params.recipientId !== undefined) {
        // verify recipient
        if (params.recipientId !== null) {
          const recipientHasAccess = await verifyMembership(params.recipientId, data.houseId);
          if (!recipientHasAccess) {
            throw new Error('Recebedor não pertence a esta casa');
          }
        }
        updateData.recipientId = params.recipientId;
      }

      if (params.splits !== undefined) {
        let sumSplits = 0;
        const currentRecipient = params.recipientId !== undefined ? params.recipientId : data.recipientId;
        for (const split of params.splits) {
          if (split.amountCents < 0) throw new Error('O valor da divisão não pode ser negativo');
          if (currentRecipient === split.memberId && split.amountCents !== 0) {
            throw new Error('O recebedor não pode dever para si mesmo');
          }
          sumSplits += split.amountCents;
          
          const memberHasAccess = await verifyMembership(split.memberId, data.houseId);
          if (!memberHasAccess) throw new Error(`Membro ${split.memberId} não pertence a esta casa`);
        }

        if (sumSplits > data.totalCents) {
          throw new Error('A soma das divisões não pode ser maior que o total da despesa');
        }

        // Delete old splits
        const oldSplitsQ = query(collection(db, EXPENSE_SPLITS_COLLECTION), where('expenseId', '==', params.expenseId));
        const oldSplitsSnap = await getDocs(oldSplitsQ);
        for (const splitDoc of oldSplitsSnap.docs) {
          transaction.delete(doc(db, EXPENSE_SPLITS_COLLECTION, splitDoc.id));
        }

        // Create new splits
        for (const split of params.splits) {
          const splitRef = doc(db, EXPENSE_SPLITS_COLLECTION, `${params.expenseId}_${split.memberId}`);
          transaction.set(splitRef, {
            expenseId: params.expenseId,
            memberId: split.memberId,
            amountCents: split.amountCents,
          });
        }
      }
    }

    transaction.update(expenseRef, updateData);

    const updatedData = { ...data, ...updateData };
    return {
      id: expenseSnap.id,
      houseId: updatedData.houseId,
      authorId: updatedData.authorId,
      title: updatedData.title,
      totalCents: updatedData.totalCents,
      date: toDate(updatedData.date),
      competence: updatedData.competence,
      recipientId: updatedData.recipientId,
      version: updatedData.version,
      deleted: updatedData.deleted,
      createdAt: toDate(updatedData.createdAt),
      updatedAt: new Date(), // Local estimate
    };
  });
};

export const deleteExpense = async (expenseId: string, userId: string): Promise<void> => {
  return runTransaction(db, async (transaction) => {
    const expenseRef = doc(db, EXPENSES_COLLECTION, expenseId);
    const expenseSnap = await transaction.get(expenseRef);

    if (!expenseSnap.exists()) {
      throw new Error('Despesa não encontrada');
    }

    const data = expenseSnap.data();
    if (data.deleted) {
      throw new Error('Despesa já foi deletada');
    }

    if (data.authorId !== userId) {
      throw new Error('Apenas o autor pode deletar esta despesa');
    }

    transaction.update(expenseRef, {
      deleted: true,
      version: data.version + 1,
      updatedAt: serverTimestamp()
    });
  });
};

export const registerPayment = async (params: RegisterPaymentParams): Promise<Payment> => {
  if (params.amountCents <= 0) {
    throw new Error('O valor do pagamento deve ser maior que zero');
  }

  return runTransaction(db, async (transaction) => {
    const expenseRef = doc(db, EXPENSES_COLLECTION, params.expenseId);
    const expenseSnap = await transaction.get(expenseRef);

    if (!expenseSnap.exists()) {
      throw new Error('Despesa não encontrada');
    }

    const expenseData = expenseSnap.data();
    if (expenseData.deleted) {
      throw new Error('Não é possível registrar pagamento para uma despesa deletada');
    }

    const hasAccess = await verifyMembership(params.registeredBy, expenseData.houseId);
    if (!hasAccess) {
      throw new Error('Usuário não pertence a esta casa');
    }

    const splitRef = doc(db, EXPENSE_SPLITS_COLLECTION, `${params.expenseId}_${params.payerId}`);
    const splitSnap = await transaction.get(splitRef);

    if (!splitSnap.exists()) {
      throw new Error('Membro não faz parte desta divisão');
    }
    const splitAmount = splitSnap.data().amountCents;

    // Get all existing payments for this user and this expense
    const paymentsQ = query(
      collection(db, PAYMENTS_COLLECTION),
      where('expenseId', '==', params.expenseId),
      where('payerId', '==', params.payerId)
    );
    const paymentsSnap = await getDocs(paymentsQ);
    
    let totalAlreadyPaid = 0;
    for (const pDoc of paymentsSnap.docs) {
      totalAlreadyPaid += pDoc.data().amountCents;
    }

    const currentPending = splitAmount - totalAlreadyPaid;

    if (currentPending <= 0) {
      throw new Error('Esta dívida já foi totalmente paga');
    }

    if (params.amountCents > currentPending) {
      throw new Error('O valor do pagamento não pode ser maior que o saldo devedor');
    }

    const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
    const now = new Date();

    const paymentData = {
      id: paymentRef.id,
      expenseId: params.expenseId,
      payerId: params.payerId,
      recipientId: expenseData.recipientId,
      amountCents: params.amountCents,
      paidAt: Timestamp.fromDate(now),
      registeredBy: params.registeredBy,
      createdAt: serverTimestamp(),
    };

    transaction.set(paymentRef, paymentData);

    return {
      id: paymentRef.id,
      expenseId: params.expenseId,
      payerId: params.payerId,
      recipientId: expenseData.recipientId,
      amountCents: params.amountCents,
      paidAt: now,
      registeredBy: params.registeredBy,
      createdAt: now,
    };
  });
};

export const getExpensePayments = async (expenseId: string, userId: string): Promise<Payment[]> => {
  const expenseRef = doc(db, EXPENSES_COLLECTION, expenseId);
  const expenseSnap = await getDoc(expenseRef);

  if (!expenseSnap.exists()) {
    throw new Error('Despesa não encontrada');
  }

  const hasAccess = await verifyMembership(userId, expenseSnap.data().houseId);
  if (!hasAccess) {
    throw new Error('Você não tem permissão para ver estes pagamentos');
  }

  const q = query(
    collection(db, PAYMENTS_COLLECTION),
    where('expenseId', '==', expenseId),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      expenseId: data.expenseId,
      payerId: data.payerId,
      recipientId: data.recipientId,
      amountCents: data.amountCents,
      paidAt: toDate(data.paidAt),
      registeredBy: data.registeredBy,
      createdAt: toDate(data.createdAt),
    };
  });
};

export const getMemberBalance = async (
  houseId: string,
  memberId: string,
  competence: string
): Promise<MemberBalance> => {
  const userRef = doc(db, USERS_COLLECTION, memberId);
  const userSnap = await getDoc(userRef);
  const displayName = userSnap.exists() ? (userSnap.data().displayName as string) : 'Membro';

  const expensesQ = query(
    collection(db, EXPENSES_COLLECTION),
    where('houseId', '==', houseId),
    where('competence', '==', competence),
    where('deleted', '==', false)
  );
  
  const expensesSnap = await getDocs(expensesQ);
  const expenseIds = expensesSnap.docs.map(d => d.id);

  let totalPending = 0;
  let totalPaid = 0;

  if (expenseIds.length > 0) {
    // Splits
    const splitsQ = query(
      collection(db, EXPENSE_SPLITS_COLLECTION),
      where('memberId', '==', memberId)
    );
    const splitsSnap = await getDocs(splitsQ);
    for (const splitDoc of splitsSnap.docs) {
      if (expenseIds.includes(splitDoc.data().expenseId)) {
        totalPending += splitDoc.data().amountCents;
      }
    }

    // Payments made by this member
    const paymentsQ = query(
      collection(db, PAYMENTS_COLLECTION),
      where('payerId', '==', memberId)
    );
    const paymentsSnap = await getDocs(paymentsQ);
    for (const payDoc of paymentsSnap.docs) {
      if (expenseIds.includes(payDoc.data().expenseId)) {
        totalPaid += payDoc.data().amountCents;
      }
    }
  }

  return {
    memberId,
    displayName,
    totalPending,
    totalPaid,
    remaining: totalPending - totalPaid
  };
};

export const getMonthSummary = async (
  houseId: string,
  competence: string,
  userId: string
): Promise<MonthSummary> => {
  const hasAccess = await verifyMembership(userId, houseId);
  if (!hasAccess) {
    throw new Error('Você não tem permissão para acessar esta casa');
  }

  const expensesQ = query(
    collection(db, EXPENSES_COLLECTION),
    where('houseId', '==', houseId),
    where('competence', '==', competence),
    where('deleted', '==', false)
  );
  
  const expensesSnap = await getDocs(expensesQ);
  const expenseIds = expensesSnap.docs.map(d => d.id);

  let totalExpenses = 0;
  for (const doc of expensesSnap.docs) {
    totalExpenses += doc.data().totalCents;
  }

  let totalPending = 0;
  let totalPaid = 0;

  if (expenseIds.length > 0) {
    // Sum of all splits for these expenses
    // Doing it with multiple queries or chunking could be needed in scale, but for small house it's fine.
    // Or we can just get splits where expenseId 'in' expenseIds. Max 10 items in 'in' clause, so chunking.
    for (let i = 0; i < expenseIds.length; i += 10) {
      const chunk = expenseIds.slice(i, i + 10);
      const chunkSplitsQ = query(
        collection(db, EXPENSE_SPLITS_COLLECTION),
        where('expenseId', 'in', chunk)
      );
      const splitsSnap = await getDocs(chunkSplitsQ);
      for (const doc of splitsSnap.docs) {
        totalPending += doc.data().amountCents;
      }

      const chunkPaymentsQ = query(
        collection(db, PAYMENTS_COLLECTION),
        where('expenseId', 'in', chunk)
      );
      const paymentsSnap = await getDocs(chunkPaymentsQ);
      for (const doc of paymentsSnap.docs) {
        totalPaid += doc.data().amountCents;
      }
    }
  }

  return {
    competence,
    totalExpenses,
    totalPending,
    totalPaid
  };
};
