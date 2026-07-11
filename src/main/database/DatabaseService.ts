import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { runMigrations } from './migrations';

export class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'elos.db');
  }

  async initialize(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Initialize database
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');

      // Run migrations
      await runMigrations(this.db);

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async backup(caminho: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const backupDir = path.dirname(caminho);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Copy database file directly
      fs.copyFileSync(this.dbPath, caminho);
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async restaurar(caminho: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      if (!fs.existsSync(caminho)) {
        throw new Error('Backup file not found');
      }
      
      // Close current database
      this.db.close();
      
      // Copy backup file to database location
      fs.copyFileSync(caminho, this.dbPath);
      
      // Reopen database
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Import app for getPath
import { app } from 'electron';