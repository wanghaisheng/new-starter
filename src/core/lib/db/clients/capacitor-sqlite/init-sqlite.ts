import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { defineCustomElements } from 'jeep-sqlite/loader';
import { sqliteDataSource } from '../../datasources/sqlite.datasource';
import 'reflect-metadata';
import { HTMLAttributes } from 'react';

type StencilToReact<T> = {
  [P in keyof T]?: T[P] & Omit<HTMLAttributes<Element>, 'className'> & {
    class?: string;
  };
};

declare global {
  export namespace JSX {
    interface IntrinsicElements extends StencilToReact<any> {}
  }
}

let initialized = false;
let sqlite: SQLiteConnection;
const platform = Capacitor.getPlatform();

export const initializeSQLite = async () => {
  try {
    // Initialize TypeORM data source first
    await sqliteDataSource.initialize();
    console.log('TypeORM Data Source initialized');

    // Platform-specific SQLite initialization
    if (platform === 'web') {
      // Web platform: Initialize jeep-sqlite
      defineCustomElements(window);
      const jeepEl = document.createElement('jeep-sqlite');
      document.body.appendChild(jeepEl);
      await customElements.whenDefined('jeep-sqlite');
      await jeepEl.componentOnReady();
      
      // Initialize SQLite connection
      sqlite = new SQLiteConnection(CapacitorSQLite);
      await sqlite.initWebStore();
      console.log('SQLite Web Store initialized');
    } else {
      // Native platform: Direct SQLite initialization
      sqlite = new SQLiteConnection(CapacitorSQLite);
      console.log('SQLite Native initialized');
    }

    return sqlite;
  } catch (error) {
    console.error('Error initializing SQLite:', error);
    throw error;
  }
}; 