export class FirebaseError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'FirebaseError';
  }
} 