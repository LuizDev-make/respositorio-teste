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
  limit,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { House, HouseMember, HouseMembership } from '@/types/house';
import { generateInviteCode, normalizeInviteCode, isValidInviteCodeFormat } from '@/utils/inviteCode';
import { MAX_HOUSE_NAME_LENGTH } from '@/config/constants';

// Nomes das coleções
const HOUSES_COLLECTION = 'houses';
const MEMBERSHIPS_COLLECTION = 'memberships';
const USERS_COLLECTION = 'users';
const HOUSE_INVITES_COLLECTION = 'house_invites';

// Máximo de tentativas para gerar código único
const MAX_CODE_ATTEMPTS = 5;

// --- Funções auxiliares ---

/** Converte Timestamp Firestore para Date */
const toDate = (ts: unknown): Date => {
  if (!ts) return new Date();
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate();
  }
  return new Date(ts as string | number);
};

/** Converte documento Firestore em House tipada */
const docToHouse = (id: string, data: Record<string, unknown>): House => ({
  id,
  name: data.name as string,
  inviteCode: data.inviteCode as string,
  createdBy: data.createdBy as string,
  createdAt: toDate(data.createdAt),
});

// ============================
// 1. Criar casa
// ============================

/**
 * Cria uma nova casa e vincula o criador como primeiro membro.
 * Operação atômica via transaction.
 */
export const createHouse = async (
  userId: string,
  houseName: string,
): Promise<House> => {
  // Validar nome
  if (!houseName || houseName.trim().length === 0) {
    throw new Error('Nome da casa é obrigatório');
  }
  if (houseName.trim().length > MAX_HOUSE_NAME_LENGTH) {
    throw new Error(`Nome da casa deve ter no máximo ${MAX_HOUSE_NAME_LENGTH} caracteres`);
  }

  // Verificar se o usuário já pertence a uma casa (uma casa por usuário no MVP)
  const existingMembership = await getUserMembership(userId);
  if (existingMembership) {
    throw new Error('Você já pertence a uma casa');
  }

  return runTransaction(db, async (transaction) => {
    // Gerar código de convite único com tratamento de colisão
    let inviteCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < MAX_CODE_ATTEMPTS) {
      inviteCode = generateInviteCode();
      const inviteRef = doc(db, HOUSE_INVITES_COLLECTION, inviteCode);
      const inviteSnap = await transaction.get(inviteRef);

      if (!inviteSnap.exists()) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Erro ao gerar código de convite. Tente novamente.');
    }

    // Criar casa
    const houseRef = doc(collection(db, HOUSES_COLLECTION));
    const now = new Date();

    const houseData = {
      id: houseRef.id,
      name: houseName.trim(),
      inviteCode,
      createdBy: userId,
      createdAt: serverTimestamp(),
    };

    transaction.set(houseRef, houseData);

    // Criar mapeamento de convite (documento separado para busca segura)
    const inviteRef = doc(db, HOUSE_INVITES_COLLECTION, inviteCode);
    transaction.set(inviteRef, {
      houseId: houseRef.id,
      createdAt: serverTimestamp(),
    });

    // Criar vínculo (membership) — ID determinístico para impedir duplicidade
    const membershipId = `${userId}_${houseRef.id}`;
    const membershipRef = doc(db, MEMBERSHIPS_COLLECTION, membershipId);
    transaction.set(membershipRef, {
      userId,
      houseId: houseRef.id,
      joinedAt: serverTimestamp(),
    });

    return {
      id: houseRef.id,
      name: houseName.trim(),
      inviteCode,
      createdBy: userId,
      createdAt: now,
    };
  });
};

// ============================
// 2. Entrar em uma casa por código
// ============================

/**
 * Permite que um usuário autenticado entre em uma casa usando o código de convite.
 * Normaliza o código antes de buscar.
 */
export const joinHouseByCode = async (
  userId: string,
  code: string,
): Promise<House> => {
  if (!code || code.trim().length === 0) {
    throw new Error('Código de convite inválido');
  }

  const normalizedCode = normalizeInviteCode(code);

  // Validar formato
  if (!isValidInviteCodeFormat(normalizedCode)) {
    throw new Error('Código de convite inválido');
  }

  // Verificar se o usuário já pertence a uma casa
  const existingMembership = await getUserMembership(userId);

  // Buscar casa pelo código via coleção house_invites (não expõe lista de casas)
  const inviteRef = doc(db, HOUSE_INVITES_COLLECTION, normalizedCode);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    throw new Error('Nenhuma casa encontrada com este código');
  }

  const inviteData = inviteSnap.data();
  const houseId = inviteData.houseId as string;

  // Verificar duplicidade e regra de uma casa
  if (existingMembership) {
    if (existingMembership.houseId === houseId) {
      throw new Error('Você já é membro desta casa');
    }
    throw new Error('Você já pertence a uma casa');
  }

  return runTransaction(db, async (transaction) => {
    // Buscar dados da casa
    const houseRef = doc(db, HOUSES_COLLECTION, houseId);
    const houseSnap = await transaction.get(houseRef);

    if (!houseSnap.exists()) {
      throw new Error('Casa não encontrada');
    }

    // Criar vínculo — ID determinístico para impedir duplicidade
    const membershipId = `${userId}_${houseId}`;
    const membershipRef = doc(db, MEMBERSHIPS_COLLECTION, membershipId);

    // Verificar se já existe dentro da transação
    const existingRef = await transaction.get(membershipRef);
    if (existingRef.exists()) {
      throw new Error('Você já é membro desta casa');
    }

    transaction.set(membershipRef, {
      userId,
      houseId,
      joinedAt: serverTimestamp(),
    });

    const data = houseSnap.data();
    return docToHouse(houseId, data);
  });
};

// ============================
// 3. Consultar casa do usuário
// ============================

/**
 * Retorna a casa do usuário autenticado, ou null se não tiver vínculo.
 */
export const getUserHouse = async (userId: string): Promise<House | null> => {
  const membership = await getUserMembership(userId);
  if (!membership) {
    return null;
  }

  const houseRef = doc(db, HOUSES_COLLECTION, membership.houseId);
  const houseSnap = await getDoc(houseRef);

  if (!houseSnap.exists()) {
    return null;
  }

  return docToHouse(houseSnap.id, houseSnap.data());
};

// ============================
// 4. Consultar moradores da casa
// ============================

/**
 * Retorna todos os moradores de uma casa com nome e telefone.
 * Verifica que o solicitante pertence à casa.
 */
export const getHouseMembers = async (
  houseId: string,
  requestingUserId: string,
): Promise<HouseMember[]> => {
  const hasAccess = await verifyMembership(requestingUserId, houseId);
  if (!hasAccess) {
    throw new Error('Você não tem permissão para acessar esta casa');
  }

  const membershipsQuery = query(
    collection(db, MEMBERSHIPS_COLLECTION),
    where('houseId', '==', houseId),
  );
  const membershipsSnapshot = await getDocs(membershipsQuery);

  const members: HouseMember[] = [];

  for (const membershipDoc of membershipsSnapshot.docs) {
    const membershipData = membershipDoc.data();
    const userRef = doc(db, USERS_COLLECTION, membershipData.userId as string);
    const userSnap = await getDoc(userRef);

    const displayName = userSnap.exists()
      ? (userSnap.data().displayName as string) || 'Morador'
      : 'Morador';
    const phone = userSnap.exists()
      ? (userSnap.data().phone as string | null) || null
      : null;

    members.push({
      houseId: membershipData.houseId as string,
      userId: membershipData.userId as string,
      joinedAt: toDate(membershipData.joinedAt),
      displayName,
      phone,
    });
  }

  return members;
};

// ============================
// 5. Consultar casa por ID
// ============================

/**
 * Retorna uma casa pelo ID. Verifica permissão do solicitante.
 */
export const getHouseById = async (
  houseId: string,
  requestingUserId: string,
): Promise<House | null> => {
  const hasAccess = await verifyMembership(requestingUserId, houseId);
  if (!hasAccess) {
    throw new Error('Você não tem permissão para acessar esta casa');
  }

  const houseRef = doc(db, HOUSES_COLLECTION, houseId);
  const houseSnap = await getDoc(houseRef);

  if (!houseSnap.exists()) {
    throw new Error('Casa não encontrada');
  }

  return docToHouse(houseSnap.id, houseSnap.data());
};

// ============================
// 6. Consultar vínculo do usuário
// ============================

/**
 * Retorna o vínculo (membership) do usuário, ou null se não tiver casa.
 */
export const getUserMembership = async (
  userId: string,
): Promise<HouseMembership | null> => {
  const membershipsQuery = query(
    collection(db, MEMBERSHIPS_COLLECTION),
    where('userId', '==', userId),
    limit(1),
  );
  const snapshot = await getDocs(membershipsQuery);

  if (snapshot.empty) {
    return null;
  }

  const data = snapshot.docs[0].data();
  return {
    houseId: data.houseId as string,
    userId: data.userId as string,
    joinedAt: toDate(data.joinedAt),
  };
};

// ============================
// 7. Verificar vínculo
// ============================

/**
 * Verifica se um usuário pertence a uma casa específica.
 * Usado por outros serviços para autorização.
 */
export const verifyMembership = async (
  userId: string,
  houseId: string,
): Promise<boolean> => {
  // Usar ID determinístico para verificação rápida (sem query)
  const membershipId = `${userId}_${houseId}`;
  const membershipRef = doc(db, MEMBERSHIPS_COLLECTION, membershipId);
  const membershipSnap = await getDoc(membershipRef);
  return membershipSnap.exists();
};
