import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { FirebaseConfig } from './firebase-client';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export class FirebaseAuthService {
  private auth;

  constructor(private config: FirebaseConfig) {
    this.auth = getAuth();
  }

  async initialize(): Promise<void> {
    // 初始化认证服务
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      throw new Error('Failed to sign in with email');
    }
  }

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      throw new Error('Failed to sign in with Google');
    }
  }

  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      throw new Error('Failed to sign up');
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch (error) {
      throw new Error('Failed to sign out');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw new Error('Failed to reset password');
    }
  }

  async updateUserProfile(displayName?: string, photoURL?: string): Promise<AuthUser> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No user is signed in');
      }

      await updateProfile(user, { displayName, photoURL });
      return this.mapFirebaseUser(user);
    } catch (error) {
      throw new Error('Failed to update user profile');
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => {
      callback(user ? this.mapFirebaseUser(user) : null);
    });
  }

  getCurrentUser(): AuthUser | null {
    const user = this.auth.currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  private mapFirebaseUser(user: FirebaseUser): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
  }
} 