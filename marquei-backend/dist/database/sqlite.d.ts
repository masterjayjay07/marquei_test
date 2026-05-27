import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
declare let db: Database<sqlite3.Database, sqlite3.Statement> | null;
export declare function initializeDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>>;
export declare function getDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>>;
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export declare function setupDatabase(): Promise<void>;
export { db };
//# sourceMappingURL=sqlite.d.ts.map