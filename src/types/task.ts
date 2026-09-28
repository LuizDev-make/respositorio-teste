export type TaskFrequency = 'daily' | 'weekly';

export type OccurrenceStatus = 'pending' | 'completed' | 'overdue';

export interface Task {
  id: string;
  houseId: string;
  title: string;
  description: string | null;
  frequency: TaskFrequency;
  /** IDs dos participantes na ordem do rodízio */
  rotationOrder: string[];
  /** Índice atual no rodízio para próximas ocorrências */
  currentRotationIndex: number;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskOccurrence {
  id: string;
  taskId: string;
  houseId: string;
  /** ID do responsável desta ocorrência */
  assigneeId: string;
  /** Data limite */
  dueDate: Date;
  status: OccurrenceStatus;
  completedAt: Date | null;
  completedBy: string | null;
  createdAt: Date;
}
