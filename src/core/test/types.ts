// Type definitions for IndexedDB mock implementation
export interface ArrayIterator<T> extends Iterator<T> {
  [Symbol.iterator](): ArrayIterator<T>;
  [Symbol.toStringTag]: string;
  [Symbol.dispose](): void;
  forEach(callbackfn: (value: T, index: number, array: T[]) => void): void;
  map<U>(callbackfn: (value: T, index: number, array: T[]) => U): ArrayIterator<U>;
  filter(callbackfn: (value: T, index: number, array: T[]) => boolean): ArrayIterator<T>;
  take(count: number): ArrayIterator<T>;
  drop(count: number): ArrayIterator<T>;
  flatMap<U>(callbackfn: (value: T, index: number, array: T[]) => Iterator<U> | Iterable<U>): ArrayIterator<U>;
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
  reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
  some(callbackfn: (value: T, index: number, array: T[]) => boolean): boolean;
  every(callbackfn: (value: T, index: number, array: T[]) => boolean): boolean;
  find(callbackfn: (value: T, index: number, array: T[]) => boolean): T | undefined;
  findIndex(callbackfn: (value: T, index: number, array: T[]) => boolean): number;
  includes(searchElement: T, fromIndex?: number): boolean;
  indexOf(searchElement: T, fromIndex?: number): number;
  lastIndexOf(searchElement: T, fromIndex?: number): number;
  join(separator?: string): string;
  toArray(): T[];
}

export class MockArrayIterator<T> implements ArrayIterator<T> {
  private currentIndex = 0;
  private array: T[];

  constructor(array: T[]) {
    this.array = array;
  }

  next(): IteratorResult<T> {
    if (this.currentIndex < this.array.length) {
      return { value: this.array[this.currentIndex++], done: false };
    }
    return { value: undefined, done: true };
  }

  [Symbol.iterator](): ArrayIterator<T> {
    return new MockArrayIterator(this.array);
  }

  [Symbol.toStringTag]: string = 'ArrayIterator';

  [Symbol.dispose](): void {
    // No-op in mock
  }

  forEach(callbackfn: (value: T, index: number, array: T[]) => void): void {
    this.array.forEach(callbackfn);
  }

  map<U>(callbackfn: (value: T, index: number, array: T[]) => U): ArrayIterator<U> {
    return new MockArrayIterator(this.array.map(callbackfn));
  }

  filter(callbackfn: (value: T, index: number, array: T[]) => boolean): ArrayIterator<T> {
    return new MockArrayIterator(this.array.filter(callbackfn));
  }

  take(count: number): ArrayIterator<T> {
    return new MockArrayIterator(this.array.slice(0, count));
  }

  drop(count: number): ArrayIterator<T> {
    return new MockArrayIterator(this.array.slice(count));
  }

  flatMap<U>(callbackfn: (value: T, index: number, array: T[]) => Iterator<U> | Iterable<U>): ArrayIterator<U> {
    const result: U[] = [];
    this.array.forEach((value, index) => {
      const mapped = callbackfn(value, index, this.array);
      if (Symbol.iterator in mapped) {
        result.push(...Array.from(mapped as Iterable<U>));
      } else {
        const iterator = mapped as Iterator<U>;
        let next;
        while (!(next = iterator.next()).done) {
          result.push(next.value);
        }
      }
    });
    return new MockArrayIterator(result);
  }

  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U {
    return this.array.reduce(callbackfn, initialValue);
  }

  reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U {
    return this.array.reduceRight(callbackfn, initialValue);
  }

  some(callbackfn: (value: T, index: number, array: T[]) => boolean): boolean {
    return this.array.some(callbackfn);
  }

  every(callbackfn: (value: T, index: number, array: T[]) => boolean): boolean {
    return this.array.every(callbackfn);
  }

  find(callbackfn: (value: T, index: number, array: T[]) => boolean): T | undefined {
    return this.array.find(callbackfn);
  }

  findIndex(callbackfn: (value: T, index: number, array: T[]) => boolean): number {
    return this.array.findIndex(callbackfn);
  }

  includes(searchElement: T, fromIndex?: number): boolean {
    return this.array.includes(searchElement, fromIndex);
  }

  indexOf(searchElement: T, fromIndex?: number): number {
    return this.array.indexOf(searchElement, fromIndex);
  }

  lastIndexOf(searchElement: T, fromIndex?: number): number {
    return this.array.lastIndexOf(searchElement, fromIndex);
  }

  join(separator?: string): string {
    return this.array.join(separator);
  }

  toArray(): T[] {
    return [...this.array];
  }
} 