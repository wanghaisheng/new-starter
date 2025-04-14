import { User } from '@/core/lib/db/types/user';
import { AuthError } from './auth-error';
import { AuthProvider, AuthProviderType, AuthSession } from './auth-types';
import { AuthProviderFactory, Environment } from './auth-provider-factory';
import { Logger } from '@/core/lib/utils/logger';

const logger = new Logger('AuthService');

/**
 * Service for handling authentication
 * This service uses the auth provider factory to get the appropriate auth provider
 */
export class AuthService {
  private authProvider: AuthProvider;
  
  constructor(env: Environment = 'mock') {
    this.authProvider = AuthProviderFactory.getAuthProvider(env);
    logger.info('AuthService initialized', { env });
  }
  
  /**
   * Sign in with email and password
   * @param email User's email
   * @param password User's password
   * @returns Authentication session with user and token
   * @throws AuthError if authentication fails
   */
  async signInWithEmail(email: string, password: string): Promise<AuthSession> {
    logger.info('Signing in with email', { email });
    return this.authProvider.signInWithEmail(email, password);
  }
  
  /**
   * Sign in with a third-party provider
   * @param provider The provider to use for authentication
   * @returns Authentication session with user and token
   * @throws AuthError if authentication fails
   */
  async signInWithProvider(provider: AuthProviderType): Promise<AuthSession> {
    logger.info('Signing in with provider', { provider });
    return this.authProvider.signInWithProvider(provider);
  }
  
  /**
   * Sign in with phone number and verification code
   * @param phoneNumber User's phone number
   * @param verificationCode Verification code sent to the phone
   * @returns Authentication session with user and token
   * @throws AuthError if authentication fails
   */
  async signInWithPhone(phoneNumber: string, verificationCode: string): Promise<AuthSession> {
    logger.info('Signing in with phone', { phoneNumber });
    return this.authProvider.signInWithPhone({ phoneNumber, verificationCode });
  }
  
  /**
   * Create a new user with email and password
   * @param email User's email
   * @param password User's password
   * @param name User's name
   * @returns Newly created user
   * @throws AuthError if registration fails
   */
  async createUserWithEmail(email: string, password: string, name: string): Promise<User> {
    logger.info('Creating user with email', { email, name });
    return this.authProvider.createUser({ email, name });
  }
  
  /**
   * Sign out the current user
   * @returns Promise that resolves when sign out is complete
   */
  async signOut(): Promise<void> {
    logger.info('Signing out user');
    return this.authProvider.signOut();
  }
  
  /**
   * Get the current authenticated user
   * @returns The current user or null if not authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    return this.authProvider.getCurrentUser();
  }
  
  /**
   * Check if a user is authenticated
   * @returns True if a user is authenticated, false otherwise
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
  
  /**
   * Send a password reset email
   * @param email The email address to send the reset link to
   * @returns Promise that resolves when the email is sent
   * @throws AuthError if the email doesn't exist or sending fails
   */
  async resetPassword(email: string): Promise<void> {
    logger.info('Sending password reset email', { email });
    return this.authProvider.resetPassword(email);
  }
  
  /**
   * Update the current user's profile
   * @param userData The user data to update
   * @returns The updated user
   * @throws AuthError if the update fails
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    logger.info('Updating user profile');
    return this.authProvider.updateProfile(userData);
  }
  
  /**
   * Send a verification code to a phone number
   * @param phoneNumber The phone number to send the code to
   * @returns Promise that resolves when the code is sent
   * @throws AuthError if sending fails
   */
  async sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
    logger.info('Sending phone verification code', { phoneNumber });
    return this.authProvider.sendPhoneVerificationCode(phoneNumber);
  }
  
  /**
   * Reset the auth provider
   * This is useful for testing or when you need to create a new instance
   */
  reset(): void {
    AuthProviderFactory.reset();
    this.authProvider = AuthProviderFactory.getAuthProvider();
    logger.info('Auth provider reset');
  }
} 