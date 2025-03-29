import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FirebaseConfig } from './firebase-client';

export type UserRole = 'user' | 'admin' | 'moderator';

export interface UserPermissions {
  role: UserRole;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class FirebasePermissionsService {
  private db;

  constructor(private config: FirebaseConfig) {
    this.db = getFirestore();
  }

  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return {
        role: data.role || 'user',
        permissions: data.permissions || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      throw new Error('Failed to get user permissions');
    }
  }

  async setUserRole(userId: string, role: UserRole): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, {
        role,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error('Failed to set user role');
    }
  }

  async addUserPermission(userId: string, permission: string): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const data = userDoc.data();
      const permissions = data.permissions || [];
      
      if (!permissions.includes(permission)) {
        await updateDoc(userRef, {
          permissions: [...permissions, permission],
          updatedAt: new Date()
        });
      }
    } catch (error) {
      throw new Error('Failed to add user permission');
    }
  }

  async removeUserPermission(userId: string, permission: string): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const data = userDoc.data();
      const permissions = data.permissions || [];
      
      if (permissions.includes(permission)) {
        await updateDoc(userRef, {
          permissions: permissions.filter(p => p !== permission),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      throw new Error('Failed to remove user permission');
    }
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      if (!permissions) {
        return false;
      }

      return permissions.permissions.includes(permission) || 
             permissions.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  async isAdmin(userId: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions?.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  async isModerator(userId: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions?.role === 'moderator';
    } catch (error) {
      return false;
    }
  }
} 