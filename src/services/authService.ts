import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User, UserProfile } from '@/types/user';

const mapAuthError = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/user-not-found':
      return 'Usuário não encontrado.';
    case 'auth/wrong-password':
      return 'Senha incorreta.';
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente mais tarde.';
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
};

const mapFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: firebaseUser.uid,
        displayName: data.displayName || firebaseUser.displayName || '',
        email: data.email || firebaseUser.email || '',
        phone: data.phone || null,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user document:', error);
    return null;
  }
};

export const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await firebaseUpdateProfile(firebaseUser, { displayName });

    const newUserDoc = {
      uid: firebaseUser.uid,
      displayName,
      email,
      phone: null,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);

    return {
      uid: firebaseUser.uid,
      displayName,
      email,
      phone: null,
      createdAt: new Date(),
    };
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = await mapFirebaseUserToUser(userCredential.user);
    if (!user) {
      throw new Error('Usuário não encontrado no banco de dados.');
    }
    return user;
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    return await mapFirebaseUserToUser(firebaseUser);
  }
  return null;
};

export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
  return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user = await mapFirebaseUserToUser(firebaseUser);
      callback(user);
    } else {
      callback(null);
    }
  });
};

export const updateProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const firebaseUser = auth.currentUser;
    if (firebaseUser && firebaseUser.uid === userId && data.displayName) {
      await firebaseUpdateProfile(firebaseUser, { displayName: data.displayName });
    }

    const updates: any = { ...data };
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'users', userId), updates);
    }
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
};
