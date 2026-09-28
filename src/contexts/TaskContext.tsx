import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task, TaskOccurrence } from '@/types/task';
import * as taskService from '@/services/taskService';

interface TaskContextData {
  tasks: Task[];
  currentOccurrences: TaskOccurrence[];
  myOccurrences: TaskOccurrence[];
  loading: boolean;
  error: string | null;
  loadHouseTasks: (houseId: string, userId: string) => Promise<void>;
  loadCurrentOccurrences: (houseId: string, userId: string) => Promise<void>;
  loadMyOccurrences: (houseId: string, userId: string) => Promise<void>;
  createTask: (params: {
    houseId: string;
    userId: string;
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly';
    rotationOrder: string[];
  }) => Promise<Task>;
  updateTask: (params: {
    taskId: string;
    userId: string;
    title?: string;
    description?: string | null;
    frequency?: 'daily' | 'weekly';
    rotationOrder?: string[];
  }) => Promise<Task>;
  deactivateTask: (taskId: string, userId: string) => Promise<void>;
  completeOccurrence: (occurrenceId: string, userId: string) => Promise<TaskOccurrence>;
  getTaskOccurrences: (taskId: string, userId: string, month?: string) => Promise<TaskOccurrence[]>;
  refreshAll: (houseId: string, userId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextData>({} as TaskContextData);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentOccurrences, setCurrentOccurrences] = useState<TaskOccurrence[]>([]);
  const [myOccurrences, setMyOccurrences] = useState<TaskOccurrence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHouseTasks = useCallback(async (houseId: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const houseTasks = await taskService.getHouseTasks(houseId, userId);
      setTasks(houseTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCurrentOccurrences = useCallback(async (houseId: string, userId: string) => {
    try {
      const occurrences = await taskService.getCurrentOccurrences(houseId, userId);
      setCurrentOccurrences(occurrences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ocorrências');
    }
  }, []);

  const loadMyOccurrences = useCallback(async (houseId: string, userId: string) => {
    try {
      const occurrences = await taskService.getMyOccurrences(houseId, userId);
      setMyOccurrences(occurrences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar minhas ocorrências');
    }
  }, []);

  const createTaskAction = useCallback(async (params: {
    houseId: string;
    userId: string;
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly';
    rotationOrder: string[];
  }) => {
    setLoading(true);
    setError(null);
    try {
      const newTask = await taskService.createTask(params);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tarefa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskAction = useCallback(async (params: {
    taskId: string;
    userId: string;
    title?: string;
    description?: string | null;
    frequency?: 'daily' | 'weekly';
    rotationOrder?: string[];
  }) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await taskService.updateTask(params);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tarefa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deactivateTaskAction = useCallback(async (taskId: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await taskService.deactivateTask(taskId, userId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desativar tarefa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeOccurrenceAction = useCallback(async (occurrenceId: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const completed = await taskService.completeOccurrence(occurrenceId, userId);
      setCurrentOccurrences(prev =>
        prev.map(o => o.id === completed.id ? completed : o)
      );
      setMyOccurrences(prev =>
        prev.map(o => o.id === completed.id ? completed : o)
      );
      return completed;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao concluir ocorrência');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTaskOccurrencesAction = useCallback(async (
    taskId: string,
    userId: string,
    month?: string
  ) => {
    try {
      return await taskService.getTaskOccurrences(taskId, userId, month ? { month } : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
      throw err;
    }
  }, []);

  const refreshAll = useCallback(async (houseId: string, userId: string) => {
    await Promise.all([
      loadHouseTasks(houseId, userId),
      loadCurrentOccurrences(houseId, userId),
      loadMyOccurrences(houseId, userId),
    ]);
  }, [loadHouseTasks, loadCurrentOccurrences, loadMyOccurrences]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        currentOccurrences,
        myOccurrences,
        loading,
        error,
        loadHouseTasks,
        loadCurrentOccurrences,
        loadMyOccurrences,
        createTask: createTaskAction,
        updateTask: updateTaskAction,
        deactivateTask: deactivateTaskAction,
        completeOccurrence: completeOccurrenceAction,
        getTaskOccurrences: getTaskOccurrencesAction,
        refreshAll,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTask(): TaskContextData {
  const context = useContext(TaskContext);
  if (!context || Object.keys(context).length === 0) {
    throw new Error('useTask deve ser usado dentro de um TaskProvider');
  }
  return context;
}
