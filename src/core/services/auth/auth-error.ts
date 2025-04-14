/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  /**
   * Error code for the authentication error
   */
  code: string;

  /**
   * Create a new AuthError
   * @param message Error message
   * @param code Error code
   */
  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
} 