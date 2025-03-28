// Mock implementation of IndexedDB for testing
import { ArrayIterator, MockArrayIterator } from './types';

class MockDOMStringList implements DOMStringList {
  private items: string[] = [];

  get length(): number {
    return this.items.length;
  }

  item(index: number): string | null {
    return this.items[index] || null;
  }

  contains(value: string): boolean {
    return this.items.includes(value);
  }

  [index: number]: string;

  [Symbol.iterator](): ArrayIterator<string> {
    return new MockArrayIterator(this.items);
  }

  add(value: string): void {
    this.items.push(value);
  }

  remove(value: string): void {
    const index = this.items.indexOf(value);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}

export class MockIDBDatabase implements IDBDatabase {
  private stores: Map<string, Map<string, any>> = new Map();
  public readonly version: number;
  public readonly name: string;
  public readonly objectStoreNames: MockDOMStringList;
  public onabort: ((this: IDBDatabase, ev: Event) => any) | null = null;
  public onclose: ((this: IDBDatabase, ev: Event) => any) | null = null;
  public onerror: ((this: IDBDatabase, ev: Event) => any) | null = null;
  public onversionchange: ((this: IDBDatabase, ev: IDBVersionChangeEvent) => any) | null = null;

  constructor(name: string, version: number) {
    this.name = name;
    this.version = version;
    this.objectStoreNames = new MockDOMStringList();
  }

  createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore {
    if (!this.stores.has(name)) {
      this.stores.set(name, new Map());
      this.objectStoreNames.add(name);
    }
    return new MockIDBObjectStore(name, this.stores.get(name)!, this);
  }

  deleteObjectStore(name: string): void {
    this.stores.delete(name);
    this.objectStoreNames.remove(name);
  }

  transaction(storeNames: string | string[], mode?: IDBTransactionMode): IDBTransaction {
    return new MockIDBTransaction(storeNames, mode, this.stores, this);
  }

  close(): void {
    // No-op in mock
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {}
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {}
  dispatchEvent(event: Event): boolean { return true; }
}

export class MockIDBObjectStore implements IDBObjectStore {
  private store: Map<string, any>;
  private indexes: Map<string, Map<any, Set<string>>> = new Map();
  public readonly name: string;
  public readonly keyPath: string | string[];
  public readonly indexNames: MockDOMStringList;
  public readonly autoIncrement: boolean = false;
  public readonly transaction: IDBTransaction;
  private _db: IDBDatabase;

  constructor(name: string, store: Map<string, any>, db: IDBDatabase) {
    this.name = name;
    this.store = store;
    this._db = db;
    this.indexNames = new MockDOMStringList();
    this.transaction = new MockIDBTransaction(name, 'readwrite', new Map([[name, store]]), db);
    this.keyPath = 'id';
  }

  get db(): IDBDatabase {
    return this._db;
  }

  add(value: any, key?: IDBValidKey): IDBRequest {
    const request = new MockIDBRequest(this);
    const id = key?.toString() || crypto.randomUUID();
    this.store.set(id, value);
    request.result = id;
    return request;
  }

  put(value: any, key?: IDBValidKey): IDBRequest {
    const request = new MockIDBRequest(this);
    const id = key?.toString() || crypto.randomUUID();
    this.store.set(id, value);
    request.result = id;
    return request;
  }

  get(key: IDBValidKey): IDBRequest {
    const request = new MockIDBRequest(this);
    request.result = this.store.get(key.toString());
    return request;
  }

  getKey(key: IDBValidKey): IDBRequest {
    const request = new MockIDBRequest(this);
    request.result = key.toString();
    return request;
  }

  delete(key: IDBValidKey): IDBRequest {
    const request = new MockIDBRequest(this);
    this.store.delete(key.toString());
    return request;
  }

  clear(): IDBRequest {
    const request = new MockIDBRequest(this);
    this.store.clear();
    return request;
  }

  createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters): IDBIndex {
    const index = new Map<any, Set<string>>();
    this.indexes.set(name, index);
    this.indexNames.add(name);
    return new MockIDBIndex(name, keyPath, options, index, this);
  }

  deleteIndex(name: string): void {
    this.indexes.delete(name);
    this.indexNames.remove(name);
  }

  getAll(): IDBRequest {
    const request = new MockIDBRequest(this);
    request.result = Array.from(this.store.values());
    return request;
  }

  getAllKeys(): IDBRequest {
    const request = new MockIDBRequest(this);
    request.result = Array.from(this.store.keys());
    return request;
  }

  index(name: string): IDBIndex {
    const index = this.indexes.get(name);
    if (!index) {
      throw new Error(`Index ${name} not found`);
    }
    return new MockIDBIndex(name, '', undefined, index, this);
  }

  openCursor(range?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest {
    throw new Error('Method not implemented.');
  }

  openKeyCursor(range?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest {
    throw new Error('Method not implemented.');
  }

  count(query?: IDBValidKey | IDBKeyRange): IDBRequest {
    throw new Error('Method not implemented.');
  }
}

export class MockIDBIndex implements IDBIndex {
  private index: Map<any, Set<string>>;
  public readonly name: string;
  public readonly keyPath: string | string[];
  public readonly options: IDBIndexParameters | undefined;
  public readonly objectStore: IDBObjectStore;
  public readonly multiEntry: boolean = false;
  public readonly unique: boolean = false;

  constructor(
    name: string,
    keyPath: string | string[],
    options: IDBIndexParameters | undefined,
    index: Map<any, Set<string>>,
    objectStore: IDBObjectStore
  ) {
    this.name = name;
    this.keyPath = keyPath;
    this.options = options;
    this.index = index;
    this.objectStore = objectStore;
  }

  get(key: IDBValidKey): IDBRequest {
    const request = new MockIDBRequest(this);
    request.result = this.index.get(key.toString());
    return request;
  }

  getKey(key: IDBValidKey): IDBRequest {
    const request = new MockIDBRequest(this);
    request.result = this.index.get(key.toString());
    return request;
  }

  getAll(): IDBRequest {
    const request = new MockIDBRequest(this);
    request.result = Array.from(this.index.values()).flatMap(set => Array.from(set));
    return request;
  }

  getAllKeys(): IDBRequest {
    const request = new MockIDBRequest(this);
    request.result = Array.from(this.index.keys());
    return request;
  }

  count(key?: IDBValidKey | IDBKeyRange): IDBRequest {
    throw new Error('Method not implemented.');
  }

  openCursor(range?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest {
    throw new Error('Method not implemented.');
  }

  openKeyCursor(range?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest {
    throw new Error('Method not implemented.');
  }
}

export class MockIDBTransaction implements IDBTransaction {
  public readonly db: IDBDatabase;
  public readonly durability: IDBTransactionDurability = 'default';
  public readonly mode: IDBTransactionMode;
  public readonly objectStoreNames: MockDOMStringList;
  public readonly error: DOMException | null = null;
  public onabort: ((this: IDBTransaction, ev: Event) => any) | null = null;
  public oncomplete: ((this: IDBTransaction, ev: Event) => any) | null = null;
  public onerror: ((this: IDBTransaction, ev: Event) => any) | null = null;

  constructor(
    storeNames: string | string[],
    mode: IDBTransactionMode | undefined,
    private stores: Map<string, Map<string, any>>,
    db: IDBDatabase
  ) {
    this.mode = mode || 'readonly';
    this.db = db;
    this.objectStoreNames = new MockDOMStringList();
    if (typeof storeNames === 'string') {
      this.objectStoreNames.add(storeNames);
    } else {
      storeNames.forEach(name => this.objectStoreNames.add(name));
    }
  }

  objectStore(name: string): IDBObjectStore {
    const store = this.stores.get(name);
    if (!store) {
      throw new Error(`Store ${name} not found`);
    }
    return new MockIDBObjectStore(name, store, this.db);
  }

  commit(): void {
    // No-op in mock
  }

  abort(): void {
    // No-op in mock
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {}
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {}
  dispatchEvent(event: Event): boolean { return true; }
}

export class MockIDBRequest<T = any> implements IDBRequest<T> {
  public result: T;
  public error: DOMException | null = null;
  public readyState: IDBRequestReadyState = 'done';
  public source: IDBObjectStore | IDBIndex | IDBCursor;
  public transaction: IDBTransaction | null = null;

  onsuccess: ((this: IDBRequest<T>, ev: Event) => any) | null = null;
  onerror: ((this: IDBRequest<T>, ev: Event) => any) | null = null;

  constructor(source: IDBObjectStore | IDBIndex | IDBCursor) {
    this.source = source;
  }

  setResult(result: T): void {
    this.result = result;
    if (this.onsuccess) {
      this.onsuccess(new Event('success'));
    }
  }

  setError(error: DOMException): void {
    this.error = error;
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {}
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {}
  dispatchEvent(event: Event): boolean { return true; }
}

// Mock the global indexedDB object
const mockIndexedDB = {
  open(name: string, version: number): IDBOpenDBRequest {
    const request = new MockIDBRequest();
    request.result = new MockIDBDatabase(name, version);
    if (request.onsuccess) {
      request.onsuccess(new Event('success'));
    }
    return request as unknown as IDBOpenDBRequest;
  },
  deleteDatabase(name: string): IDBOpenDBRequest {
    const request = new MockIDBRequest();
    if (request.onsuccess) {
      request.onsuccess(new Event('success'));
    }
    return request as unknown as IDBOpenDBRequest;
  }
};

// Add the mock to the global scope
(global as any).indexedDB = mockIndexedDB; 