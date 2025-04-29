/**
 * Firebase Cloud Storage 客户端
 * 提供对 Firebase Storage 的文件上传、下载和管理功能
 */
import { getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, 
         listAll, getMetadata, updateMetadata, FirebaseStorage, 
         StorageReference, UploadResult, StorageError } from 'firebase/storage';

import { createDatabaseError } from '@/core/lib/db/types/database';
import { DatabaseErrorCode } from '@/core/lib/db/types/common';
import { DatabaseLogger, getDatabaseLogger } from '@/core/lib/db/errors/database-logger';

import { FirebaseConfig } from './firebase-config';


/**
 * 文件元数据
 */
export interface FileMetadata {
  /**
   * 文件名
   */
  name: string;
  
  /**
   * 完整路径
   */
  fullPath: string;
  
  /**
   * 内容类型
   */
  contentType?: string;
  
  /**
   * 文件大小（字节）
   */
  size: number;
  
  /**
   * 创建时间
   */
  createdAt: Date;
  
  /**
   * 更新时间
   */
  updatedAt: Date;
  
  /**
   * 下载 URL
   */
  downloadURL?: string;
  
  /**
   * 自定义元数据
   */
  customMetadata?: Record<string, string>;
}

/**
 * 上传选项
 */
export interface UploadOptions {
  /**
   * 内容类型
   * @default 自动检测
   */
  contentType?: string;
  
  /**
   * 自定义元数据
   */
  customMetadata?: Record<string, string>;
  
  /**
   * 是否获取下载 URL
   * @default true
   */
  getURL?: boolean;
  
  /**
   * 进度回调
   * @param progress 上传进度（0-100）
   */
  onProgress?: (progress: number) => void;
}

/**
 * Firebase Cloud Storage 客户端服务
 */
export class FirebaseStorageService {
  private storage: FirebaseStorage;
  private logger: DatabaseLogger;
  private bucketName: string;
  private maxUploadSize: number;
  
  constructor(private config: FirebaseConfig) {
    this.logger = getDatabaseLogger('FirebaseStorage');
    this.bucketName = config.storage?.bucketName || '';
    this.maxUploadSize = config.storage?.maxUploadSize || 10 * 1024 * 1024; // 默认 10MB
    this.initialize();
  }
  
  /**
   * 初始化 Cloud Storage
   */
  private initialize(): void {
    try {
      const app = getApp();
      this.storage = getStorage(app, this.bucketName);
      
      // 检查是否需要连接到模拟器
      if (this.config.storage?.useEmulator && 
          this.config.storage.emulatorHost && 
          this.config.storage.emulatorPort) {
        const { connectStorageEmulator } = require('firebase/storage');
        connectStorageEmulator(
          this.storage, 
          this.config.storage.emulatorHost, 
          this.config.storage.emulatorPort
        );
        this.logger.info(`Connected to Storage emulator at ${this.config.storage.emulatorHost}:${this.config.storage.emulatorPort}`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize Cloud Storage', error);
      throw createDatabaseError(DatabaseErrorCode.INITIALIZATION_ERROR, 'Failed to initialize Cloud Storage', error);
    }
  }
  
  /**
   * 上传文件
   * @param path 目标路径，包括文件名
   * @param data 文件数据 (Blob, File, Uint8Array 等)
   * @param options 上传选项
   * @returns 上传结果，包含文件元数据
   */
  async uploadFile(
    path: string, 
    data: Blob | Uint8Array | ArrayBuffer, 
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    try {
      // 文件大小检查
      let fileSize = 0;
      if (data instanceof Blob) {
        fileSize = data.size;
      } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
        fileSize = data.byteLength;
      }
      
      if (fileSize > this.maxUploadSize) {
        throw createDatabaseError(DatabaseErrorCode.INVALID_DATA, `File size (${fileSize} bytes) exceeds maximum allowed size (${this.maxUploadSize} bytes)`);
      }
      
      // 创建 Storage 引用
      const storageRef = ref(this.storage, path);
      
      // 设置元数据
      const metadata = {
        contentType: options.contentType,
        customMetadata: options.customMetadata
      };
      
      // 上传文件
      const uploadResult = await uploadBytes(storageRef, data, metadata);
      
      // 获取完整元数据
      const fileMetadata = await this.getFileMetadata(path);
      
      // 获取下载 URL（如果需要）
      if (options.getURL !== false) {
        fileMetadata.downloadURL = await getDownloadURL(storageRef);
      }
      
      return fileMetadata;
    } catch (error) {
      this.logger.error(`Failed to upload file to ${path}`, error);
      throw this.handleStorageError(error, `Failed to upload file to ${path}`);
    }
  }
  
  /**
   * 获取文件下载 URL
   * @param path 文件路径
   * @returns 下载 URL
   */
  async getFileURL(path: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      this.logger.error(`Failed to get download URL for ${path}`, error);
      throw this.handleStorageError(error, `Failed to get download URL for ${path}`);
    }
  }
  
  /**
   * 删除文件
   * @param path 文件路径
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      this.logger.error(`Failed to delete file at ${path}`, error);
      throw this.handleStorageError(error, `Failed to delete file at ${path}`);
    }
  }
  
  /**
   * 获取文件元数据
   * @param path 文件路径
   * @returns 文件元数据
   */
  async getFileMetadata(path: string): Promise<FileMetadata> {
    try {
      const storageRef = ref(this.storage, path);
      const metadata = await getMetadata(storageRef);
      
      return {
        name: metadata.name,
        fullPath: metadata.fullPath,
        contentType: metadata.contentType,
        size: metadata.size,
        createdAt: new Date(metadata.timeCreated),
        updatedAt: new Date(metadata.updated),
        customMetadata: metadata.customMetadata
      };
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${path}`, error);
      throw this.handleStorageError(error, `Failed to get metadata for ${path}`);
    }
  }
  
  /**
   * 更新文件元数据
   * @param path 文件路径
   * @param metadata 要更新的元数据
   * @returns 更新后的完整元数据
   */
  async updateFileMetadata(
    path: string, 
    metadata: { contentType?: string; customMetadata?: Record<string, string> }
  ): Promise<FileMetadata> {
    try {
      const storageRef = ref(this.storage, path);
      await updateMetadata(storageRef, metadata);
      return await this.getFileMetadata(path);
    } catch (error) {
      this.logger.error(`Failed to update metadata for ${path}`, error);
      throw this.handleStorageError(error, `Failed to update metadata for ${path}`);
    }
  }
  
  /**
   * 列出目录中的所有文件
   * @param dirPath 目录路径
   * @returns 文件列表和子目录列表
   */
  async listFiles(dirPath: string): Promise<{ files: string[]; prefixes: string[] }> {
    try {
      const dirRef = ref(this.storage, dirPath);
      const listResult = await listAll(dirRef);
      
      return {
        files: listResult.items.map(item => item.fullPath),
        prefixes: listResult.prefixes.map(prefix => prefix.fullPath)
      };
    } catch (error) {
      this.logger.error(`Failed to list files in ${dirPath}`, error);
      throw this.handleStorageError(error, `Failed to list files in ${dirPath}`);
    }
  }
  
  /**
   * 处理 Storage 错误
   * @param error 原始错误
   * @param message 错误消息
   * @returns 格式化的数据库错误
   */
  private handleStorageError(error: any, message: string): DatabaseError {
    const storageError = error as StorageError;
    
    let errorCode: DatabaseErrorCode;
    switch (storageError.code) {
      case 'storage/object-not-found':
        errorCode = DatabaseErrorCode.NOT_FOUND;
        break;
      case 'storage/unauthorized':
        errorCode = DatabaseErrorCode.PERMISSION_DENIED;
        break;
      case 'storage/canceled':
        errorCode = DatabaseErrorCode.OPERATION_FAILED;
        break;
      case 'storage/invalid-argument':
        errorCode = DatabaseErrorCode.INVALID_DATA;
        break;
      case 'storage/retry-limit-exceeded':
        errorCode = DatabaseErrorCode.OPERATION_FAILED;
        break;
      default:
        errorCode = DatabaseErrorCode.FIREBASE_ERROR;
        break;
    }
    
    return createDatabaseError(errorCode, message, error);
  }
} 