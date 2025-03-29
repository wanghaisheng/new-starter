import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FirebaseAuthService } from '../../../../clients/firebase/firebase-auth';
import { mockFirebaseAuth, testUser, createMockError } from './mocks';

describe('FirebaseAuthService', () => {
  let authService: FirebaseAuthService;

  beforeEach(() => {
    authService = new FirebaseAuthService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in user with email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({
        user: testUser,
      });

      const result = await authService.signIn(email, password);

      expect(result).toEqual(testUser);
      expect(mockFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        email,
        password
      );
    });

    it('should handle sign in error', async () => {
      const email = 'test@example.com';
      const password = 'wrong-password';

      mockFirebaseAuth.signInWithEmailAndPassword.mockRejectedValueOnce(
        createMockError('auth/wrong-password', 'Wrong password')
      );

      await expect(authService.signIn(email, password)).rejects.toThrow(
        'Wrong password'
      );
    });
  });

  describe('signUp', () => {
    it('should create new user with email and password', async () => {
      const email = 'new@example.com';
      const password = 'password123';

      mockFirebaseAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({
        user: { ...testUser, email },
      });

      const result = await authService.signUp(email, password);

      expect(result).toEqual({ ...testUser, email });
      expect(mockFirebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        email,
        password
      );
    });

    it('should handle sign up error', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      mockFirebaseAuth.createUserWithEmailAndPassword.mockRejectedValueOnce(
        createMockError('auth/email-already-in-use', 'Email already in use')
      );

      await expect(authService.signUp(email, password)).rejects.toThrow(
        'Email already in use'
      );
    });
  });

  describe('signOut', () => {
    it('should sign out user', async () => {
      mockFirebaseAuth.signOut.mockResolvedValueOnce(undefined);

      await authService.signOut();

      expect(mockFirebaseAuth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out error', async () => {
      mockFirebaseAuth.signOut.mockRejectedValueOnce(
        createMockError('auth/sign-out-failed', 'Sign out failed')
      );

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com';

      mockFirebaseAuth.sendPasswordResetEmail.mockResolvedValueOnce(undefined);

      await authService.resetPassword(email);

      expect(mockFirebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(email);
    });

    it('should handle password reset error', async () => {
      const email = 'nonexistent@example.com';

      mockFirebaseAuth.sendPasswordResetEmail.mockRejectedValueOnce(
        createMockError('auth/user-not-found', 'User not found')
      );

      await expect(authService.resetPassword(email)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('onAuthStateChanged', () => {
    it('should subscribe to auth state changes', () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      mockFirebaseAuth.onAuthStateChanged.mockReturnValueOnce(unsubscribe);

      const result = authService.onAuthStateChanged(callback);

      expect(mockFirebaseAuth.onAuthStateChanged).toHaveBeenCalledWith(callback);
      expect(result).toBe(unsubscribe);
    });

    it('should handle auth state change', () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      mockFirebaseAuth.onAuthStateChanged.mockImplementationOnce(callback => {
        callback(testUser);
        return unsubscribe;
      });

      authService.onAuthStateChanged(callback);

      expect(callback).toHaveBeenCalledWith(testUser);
    });
  });
}); 