import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Task, TaskOccurrence, TaskFrequency, OccurrenceStatus } from '@/types/task';
import { verifyMembership } from '@/services/houseService';
import {
  MAX_TASK_TITLE_LENGTH,
  MAX_TASK_DESCRIPTION_LENGTH,
} from '@/config/constants';

const TASKS_COLLECTION = 'tasks';
const OCCURRENCES_COLLECTION = 'task_occurrences';
const MEMBERSHIPS_COLLECTION = 'memberships';

// --- Interfaces de parâmetros ---

export interface CreateTaskParams {
  houseId: string;
  userId: string;
  title: string;
  description?: string;
  frequency: TaskFrequency;
  /** IDs dos participantes na ordem do rodízio */
  rotationOrder: string[];
}

export interface UpdateTaskParams {
  taskId: string;
  userId: string;
  title?: string;
  description?: string | null;
  frequency?: TaskFrequency;
  rotationOrder?: string[];
}

// --- Funções auxiliares ---

/** Converte Timestamp do Firestore para Date */
const toDate = (ts: unknown): Date => {
  if (!ts) return new Date();
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate();
  }
  return new Date(ts as string | number);
};

/** Adiciona dias a uma data */
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Verifica se todos os userIds pertencem à casa usando a coleção memberships.
 * Reutiliza o verifyMembership do houseService.
 */
const verifyAllMembersOfHouse = async (
  houseId: string,
  userIds: string[],
): Promise<boolean> => {
  const checks = await Promise.all(
    userIds.map((uid) => verifyMembership(uid, houseId)),
  );
  return checks.every(Boolean);
};

/** Converte documento Firestore em TaskOccurrence tipado */
const docToOccurrence = (data: Record<string, unknown>): TaskOccurrence => ({
  id: data.id as string,
  taskId: data.taskId as string,
  houseId: data.houseId as string,
  assigneeId: data.assigneeId as string,
  dueDate: toDate(data.dueDate),
  status: data.status as OccurrenceStatus,
  completedAt: data.completedAt ? toDate(data.completedAt) : null,
  completedBy: (data.completedBy as string) || null,
  createdAt: toDate(data.createdAt),
});

/** Converte documento Firestore em Task tipado */
const docToTask = (data: Record<string, unknown>): Task => ({
  id: data.id as string,
  houseId: data.houseId as string,
  title: data.title as string,
  description: (data.description as string) || null,
  frequency: data.frequency as TaskFrequency,
  rotationOrder: data.rotationOrder as string[],
  currentRotationIndex: data.currentRotationIndex as number,
  active: data.active as boolean,
  createdBy: (data.createdBy || data.creatorId) as string,
  createdAt: toDate(data.createdAt),
  updatedAt: toDate(data.updatedAt),
});

// ============================
// 1. Criar tarefa
// ============================
export const createTask = async (params: CreateTaskParams): Promise<Task> => {
  const { houseId, userId, title, description, frequency, rotationOrder } = params;

  // Validações
  if (!title || title.trim() === '') {
    throw new Error('Título da tarefa é obrigatório');
  }
  if (title.length > MAX_TASK_TITLE_LENGTH) {
    throw new Error(`Título deve ter no máximo ${MAX_TASK_TITLE_LENGTH} caracteres`);
  }
  if (description && description.length > MAX_TASK_DESCRIPTION_LENGTH) {
    throw new Error(`Descrição deve ter no máximo ${MAX_TASK_DESCRIPTION_LENGTH} caracteres`);
  }
  if (!rotationOrder || rotationOrder.length === 0) {
    throw new Error('É necessário pelo menos um participante');
  }

  // Verificar que o criador e todos os participantes pertencem à casa
  const allUsers = Array.from(new Set([userId, ...rotationOrder]));
  const allBelong = await verifyAllMembersOfHouse(houseId, allUsers);
  if (!allBelong) {
    throw new Error('Todos os participantes devem pertencer à casa');
  }

  let createdTask: Task | null = null;

  await runTransaction(db, async (transaction) => {
    const taskRef = doc(collection(db, TASKS_COLLECTION));
    const now = new Date();

    const taskData = {
      id: taskRef.id,
      houseId,
      createdBy: userId,
      title: title.trim(),
      description: description?.trim() || null,
      frequency,
      rotationOrder,
      currentRotationIndex: 0,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(taskRef, taskData);

    // Gerar primeira ocorrência automaticamente
    const firstOccurrenceRef = doc(collection(db, OCCURRENCES_COLLECTION));
    const dueDate = frequency === 'daily' ? addDays(now, 1) : addDays(now, 7);

    const occurrenceData = {
      id: firstOccurrenceRef.id,
      taskId: taskRef.id,
      houseId,
      assigneeId: rotationOrder[0],
      dueDate: Timestamp.fromDate(dueDate),
      status: 'pending' as OccurrenceStatus,
      completedAt: null,
      completedBy: null,
      createdAt: serverTimestamp(),
    };

    transaction.set(firstOccurrenceRef, occurrenceData);

    createdTask = {
      ...taskData,
      description: taskData.description,
      createdAt: now,
      updatedAt: now,
    } as Task;
  });

  return createdTask!;
};

// ============================
// 2. Consultar tarefa
// ============================
export const getTask = async (
  taskId: string,
  requestingUserId: string,
): Promise<Task | null> => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  const taskSnap = await getDoc(taskRef);

  if (!taskSnap.exists()) return null;
  const data = taskSnap.data();

  const belongs = await verifyMembership(requestingUserId, data.houseId as string);
  if (!belongs) {
    throw new Error('Você não tem permissão para acessar esta tarefa');
  }

  return docToTask(data);
};

// ============================
// 3. Listar tarefas da casa
// ============================
export const getHouseTasks = async (
  houseId: string,
  requestingUserId: string,
): Promise<Task[]> => {
  const belongs = await verifyMembership(requestingUserId, houseId);
  if (!belongs) {
    throw new Error('Você não tem permissão para acessar esta tarefa');
  }

  const tasksQuery = query(
    collection(db, TASKS_COLLECTION),
    where('houseId', '==', houseId),
    where('active', '==', true),
    orderBy('createdAt', 'desc'),
  );

  const snapshot = await getDocs(tasksQuery);
  return snapshot.docs.map((d) => docToTask(d.data()));
};

// ============================
// 4. Editar tarefa
// ============================
export const updateTask = async (params: UpdateTaskParams): Promise<Task> => {
  const { taskId, userId, title, description, frequency, rotationOrder } = params;

  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  const taskSnap = await getDoc(taskRef);
  if (!taskSnap.exists()) {
    throw new Error('Tarefa não encontrada');
  }

  const taskData = taskSnap.data();
  const belongs = await verifyMembership(userId, taskData.houseId as string);
  if (!belongs) {
    throw new Error('Você não tem permissão para acessar esta tarefa');
  }

  // Validar campos
  if (title !== undefined) {
    if (title.trim() === '') throw new Error('Título da tarefa é obrigatório');
    if (title.length > MAX_TASK_TITLE_LENGTH) {
      throw new Error(`Título deve ter no máximo ${MAX_TASK_TITLE_LENGTH} caracteres`);
    }
  }
  if (description !== undefined && description !== null && description.length > MAX_TASK_DESCRIPTION_LENGTH) {
    throw new Error(`Descrição deve ter no máximo ${MAX_TASK_DESCRIPTION_LENGTH} caracteres`);
  }

  // Montar atualizações (afetam apenas ocorrências futuras)
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description;
  if (frequency !== undefined) updates.frequency = frequency;

  if (rotationOrder !== undefined) {
    if (rotationOrder.length === 0) {
      throw new Error('É necessário pelo menos um participante');
    }
    const allBelong = await verifyAllMembersOfHouse(taskData.houseId as string, rotationOrder);
    if (!allBelong) {
      throw new Error('Todos os participantes devem pertencer à casa');
    }
    updates.rotationOrder = rotationOrder;
    // Ajustar índice se necessário (não ultrapassar o novo tamanho)
    const currentIdx = (taskData.currentRotationIndex as number) || 0;
    updates.currentRotationIndex = Math.min(currentIdx, rotationOrder.length - 1);
  }

  await updateDoc(taskRef, updates);

  const updatedSnap = await getDoc(taskRef);
  return docToTask(updatedSnap.data()!);
};

// ============================
// 5. Desativar tarefa
// ============================
export const deactivateTask = async (
  taskId: string,
  userId: string,
): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  const taskSnap = await getDoc(taskRef);
  if (!taskSnap.exists()) {
    throw new Error('Tarefa não encontrada');
  }

  const data = taskSnap.data();
  const belongs = await verifyMembership(userId, data.houseId as string);
  if (!belongs) {
    throw new Error('Você não tem permissão para acessar esta tarefa');
  }

  await updateDoc(taskRef, {
    active: false,
    updatedAt: serverTimestamp(),
  });
};

// ============================
// 6. Listar ocorrências de uma tarefa
// ============================
export const getTaskOccurrences = async (
  taskId: string,
  requestingUserId: string,
  options?: { month?: string },
): Promise<TaskOccurrence[]> => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  const taskSnap = await getDoc(taskRef);
  if (!taskSnap.exists()) {
    throw new Error('Tarefa não encontrada');
  }

  const data = taskSnap.data();
  const belongs = await verifyMembership(requestingUserId, data.houseId as string);
  if (!belongs) {
    throw new Error('Você não tem permissão para acessar esta tarefa');
  }

  const occQuery = query(
    collection(db, OCCURRENCES_COLLECTION),
    where('taskId', '==', taskId),
    orderBy('dueDate', 'desc'),
  );

  const snapshot = await getDocs(occQuery);
  let occurrences = snapshot.docs.map((d) => docToOccurrence(d.data()));

  // Filtrar por mês se solicitado
  if (options?.month) {
    const [yearStr, monthStr] = options.month.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    occurrences = occurrences.filter((occ) => {
      const d = occ.dueDate;
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }

  return occurrences;
};

// ============================
// 7. Ocorrências pendentes/atrasadas da casa
// ============================
export const getCurrentOccurrences = async (
  houseId: string,
  requestingUserId: string,
): Promise<TaskOccurrence[]> => {
  const belongs = await verifyMembership(requestingUserId, houseId);
  if (!belongs) {
    throw new Error('Você não tem permissão para acessar esta tarefa');
  }

  const occQuery = query(
    collection(db, OCCURRENCES_COLLECTION),
    where('houseId', '==', houseId),
    where('status', 'in', ['pending', 'overdue']),
    orderBy('dueDate', 'asc'),
  );

  const snapshot = await getDocs(occQuery);
  return snapshot.docs.map((d) => docToOccurrence(d.data()));
};

// ============================
// 8. Minhas ocorrências pendentes
// ============================
export const getMyOccurrences = async (
  houseId: string,
  userId: string,
): Promise<TaskOccurrence[]> => {
  const belongs = await verifyMembership(userId, houseId);
  if (!belongs) {
    throw new Error('Você não tem permissão para acessar esta tarefa');
  }

  const occQuery = query(
    collection(db, OCCURRENCES_COLLECTION),
    where('houseId', '==', houseId),
    where('assigneeId', '==', userId),
    where('status', 'in', ['pending', 'overdue']),
    orderBy('dueDate', 'asc'),
  );

  const snapshot = await getDocs(occQuery);
  return snapshot.docs.map((d) => docToOccurrence(d.data()));
};

// ============================
// 9. Concluir ocorrência
// ============================
export const completeOccurrence = async (
  occurrenceId: string,
  userId: string,
): Promise<TaskOccurrence> => {
  let finalOccurrence: TaskOccurrence | null = null;
  let taskDataForNext: Record<string, unknown> | null = null;
  let currentDueDate: Date | null = null;

  await runTransaction(db, async (transaction) => {
    const occRef = doc(db, OCCURRENCES_COLLECTION, occurrenceId);
    const occSnap = await transaction.get(occRef);
    if (!occSnap.exists()) {
      throw new Error('Ocorrência não encontrada');
    }

    const occData = occSnap.data();

    // Verificar permissão
    const taskRef = doc(db, TASKS_COLLECTION, occData.taskId as string);
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists()) {
      throw new Error('Tarefa não encontrada');
    }
    const taskData = taskSnap.data();

    const belongs = await verifyMembership(userId, taskData.houseId as string);
    if (!belongs) {
      throw new Error('Você não tem permissão para acessar esta tarefa');
    }

    // Apenas o responsável pode concluir
    if (occData.assigneeId !== userId) {
      throw new Error('Apenas o responsável pode concluir esta ocorrência');
    }

    // Se já concluída, retornar sem erro (idempotente)
    if (occData.status === 'completed') {
      finalOccurrence = docToOccurrence(occData);
      return;
    }

    const now = new Date();
    transaction.update(occRef, {
      status: 'completed',
      completedAt: Timestamp.fromDate(now),
      completedBy: userId,
    });

    finalOccurrence = {
      ...docToOccurrence(occData),
      status: 'completed',
      completedAt: now,
      completedBy: userId,
    };

    taskDataForNext = taskData;
    currentDueDate = toDate(occData.dueDate);
  });

  // Gerar próxima ocorrência fora da transação (evitar reads conflitantes)
  if (finalOccurrence && (finalOccurrence as TaskOccurrence).status === 'completed' && taskDataForNext) {
    await generateNextOccurrence(taskDataForNext, currentDueDate!);
  }

  if (!finalOccurrence) {
    throw new Error('Ocorrência não encontrada');
  }

  return finalOccurrence;
};

// ============================
// 10. Gerar próxima ocorrência (interno)
// ============================
const generateNextOccurrence = async (
  taskData: Record<string, unknown>,
  currentOccurrenceDueDate: Date,
): Promise<TaskOccurrence | null> => {
  if (!(taskData.active as boolean)) return null;

  const rotationOrder = taskData.rotationOrder as string[];
  const currentIndex = (taskData.currentRotationIndex as number) || 0;
  const nextIndex = (currentIndex + 1) % rotationOrder.length;
  const nextAssigneeId = rotationOrder[nextIndex];
  const frequency = taskData.frequency as TaskFrequency;

  const nextDueDate =
    frequency === 'daily'
      ? addDays(currentOccurrenceDueDate, 1)
      : addDays(currentOccurrenceDueDate, 7);

  // Prevenir ocorrência duplicada para o mesmo período
  const startOfDay = new Date(nextDueDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(nextDueDate);
  endOfDay.setHours(23, 59, 59, 999);

  const duplicateQuery = query(
    collection(db, OCCURRENCES_COLLECTION),
    where('taskId', '==', taskData.id),
    where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
    where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
  );
  const duplicateSnap = await getDocs(duplicateQuery);
  if (!duplicateSnap.empty) {
    return null; // Já existe ocorrência para este período
  }

  const newOccRef = doc(collection(db, OCCURRENCES_COLLECTION));
  const newOccData = {
    id: newOccRef.id,
    taskId: taskData.id as string,
    houseId: taskData.houseId as string,
    assigneeId: nextAssigneeId,
    dueDate: Timestamp.fromDate(nextDueDate),
    status: 'pending' as OccurrenceStatus,
    completedAt: null,
    completedBy: null,
    createdAt: serverTimestamp(),
  };

  await setDoc(newOccRef, newOccData);

  // Avançar índice do rodízio na tarefa
  const taskRef = doc(db, TASKS_COLLECTION, taskData.id as string);
  await updateDoc(taskRef, {
    currentRotationIndex: nextIndex,
    updatedAt: serverTimestamp(),
  });

  return {
    ...newOccData,
    dueDate: nextDueDate,
    completedAt: null,
    completedBy: null,
    createdAt: new Date(),
  } as TaskOccurrence;
};

// ============================
// 11. Marcar ocorrências atrasadas
// ============================
export const checkOverdueOccurrences = async (
  houseId: string,
): Promise<number> => {
  const now = new Date();

  const occQuery = query(
    collection(db, OCCURRENCES_COLLECTION),
    where('houseId', '==', houseId),
    where('status', '==', 'pending'),
    where('dueDate', '<', Timestamp.fromDate(now)),
  );

  const snapshot = await getDocs(occQuery);
  if (snapshot.empty) return 0;

  let count = 0;
  for (const docSnap of snapshot.docs) {
    await updateDoc(docSnap.ref, { status: 'overdue' });
    count++;
  }

  return count;
};
