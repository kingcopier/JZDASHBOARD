import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { User } from 'firebase/auth';
import type { UserRecord } from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Called once on every auth state change.
 * If the user has no doc in /users/{uid} yet, creates one with role 'pending'.
 * If they're the hardcoded admin email they get role 'admin' immediately.
 * Returns the user's current role.
 */
export async function ensureUserDoc(firebaseUser: User): Promise<UserRecord['role']> {
  const ADMIN_EMAIL = 'ceicopiers@gmail.com';
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return (snap.data() as UserRecord).role;
  }

  // First time — create the user record
  const isAdmin = firebaseUser.email === ADMIN_EMAIL;
  const role: UserRecord['role'] = isAdmin ? 'admin' : 'pending';

  const record: Omit<UserRecord, 'id'> = {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    displayName: firebaseUser.displayName ?? undefined,
    photoURL: firebaseUser.photoURL ?? undefined,
    role,
    createdAt: Date.now(),
  };

  await setDoc(ref, record);
  return role;
}
