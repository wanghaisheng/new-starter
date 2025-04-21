import { IMessageService } from '../types/message-service';
import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  getDoc
} from 'firebase/firestore';

// TODO: 替换为你的 Firebase 配置
const firebaseConfig = {
  // apiKey: '',
  // authDomain: '',
  // projectId: '',
  // ...
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * 基于 Firebase Firestore 的消息服务适配器
 * 实现 IMessageService 接口，支持多端实时同步
 */
export class FirebaseMessageServiceAdapter implements IMessageService {
  private listeners: Array<(messages: Message[]) => void> = [];

  async sendMessage(data: CreateMessageData): Promise<Message> {
    const now = new Date();
    const docRef = await addDoc(collection(db, 'messages'), {
      ...data,
      type: data.type ?? 'text',
      createdAt: now,
      updatedAt: now,
      status: 'sent',
    });
    return {
      id: docRef.id,
      matchId: data.matchId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      type: data.type ?? 'text',
      status: 'sent',
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    const now = new Date();
    const msgRef = doc(db, 'messages', messageId);
    await updateDoc(msgRef, { ...data, updatedAt: now });
    // 查询最新消息（修正：使用 getDoc 而非 .get()）
    const snap = await getDoc(msgRef);
    const msg = snap.exists() ? snap.data() : {};
    return {
      id: messageId,
      matchId: msg.matchId,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: data.content ?? msg.content,
      type: msg.type,
      status: data.status ?? msg.status,
      createdAt: msg.createdAt,
      updatedAt: now,
    } as Message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await deleteDoc(doc(db, 'messages', messageId));
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    const q = query(collection(db, 'messages'), where('senderId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const q = query(collection(db, 'messages'), where('conversationId', '==', conversationId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
  }

  async getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    // Firestore 分页实现（简单版，生产建议用游标）
    const q = query(
      collection(db, 'messages'),
      where('matchId', '==', matchId),
      orderBy('createdAt', 'desc'),
      limit(pageSize * page)
    );
    const querySnapshot = await getDocs(q);
    const all = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    return all.slice((page - 1) * pageSize, page * pageSize);
  }

  async sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message> {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'sent',
    });
    return { id: docRef.id, ...data, createdAt: new Date(), updatedAt: new Date(), status: 'sent' };
  }

  async markAsRead(messageId: string): Promise<void> {
    const msgRef = doc(db, 'messages', messageId);
    await updateDoc(msgRef, { status: 'read', updatedAt: new Date() });
  }

  onMessageChange(callback: (messages: Message[]) => void): () => void {
    const unsub = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      callback(msgs);
    });
    this.listeners.push(callback);
    return () => {
      unsub();
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }
}
