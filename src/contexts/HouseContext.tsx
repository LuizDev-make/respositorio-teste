import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { House, HouseMember } from '@/types/house';
import * as houseService from '@/services/houseService';

interface HouseContextData {
  house: House | null;
  members: HouseMember[];
  loading: boolean;
  error: string | null;
  createHouse: (userId: string, name: string) => Promise<House>;
  joinHouse: (userId: string, code: string) => Promise<House>;
  loadUserHouse: (userId: string) => Promise<void>;
  loadMembers: (houseId: string, userId: string) => Promise<void>;
  refreshHouse: (userId: string) => Promise<void>;
}

const HouseContext = createContext<HouseContextData>({} as HouseContextData);

export function HouseProvider({ children }: { children: ReactNode }) {
  const [house, setHouse] = useState<House | null>(null);
  const [members, setMembers] = useState<HouseMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserHouse = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const userHouse = await houseService.getUserHouse(userId);
      setHouse(userHouse);
      if (userHouse) {
        const houseMembers = await houseService.getHouseMembers(userHouse.id, userId);
        setMembers(houseMembers);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar casa';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createHouseAction = useCallback(async (userId: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const newHouse = await houseService.createHouse(userId, name);
      setHouse(newHouse);
      const houseMembers = await houseService.getHouseMembers(newHouse.id, userId);
      setMembers(houseMembers);
      return newHouse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar casa';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinHouseAction = useCallback(async (userId: string, code: string) => {
    setLoading(true);
    setError(null);
    try {
      const joinedHouse = await houseService.joinHouseByCode(userId, code);
      setHouse(joinedHouse);
      const houseMembers = await houseService.getHouseMembers(joinedHouse.id, userId);
      setMembers(houseMembers);
      return joinedHouse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar na casa';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async (houseId: string, userId: string) => {
    try {
      const houseMembers = await houseService.getHouseMembers(houseId, userId);
      setMembers(houseMembers);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar moradores';
      setError(message);
    }
  }, []);

  const refreshHouse = useCallback(async (userId: string) => {
    await loadUserHouse(userId);
  }, [loadUserHouse]);

  return (
    <HouseContext.Provider
      value={{
        house,
        members,
        loading,
        error,
        createHouse: createHouseAction,
        joinHouse: joinHouseAction,
        loadUserHouse,
        loadMembers,
        refreshHouse,
      }}
    >
      {children}
    </HouseContext.Provider>
  );
}

export function useHouse(): HouseContextData {
  const context = useContext(HouseContext);
  if (!context || Object.keys(context).length === 0) {
    throw new Error('useHouse deve ser usado dentro de um HouseProvider');
  }
  return context;
}
