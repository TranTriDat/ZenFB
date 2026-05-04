import Dexie, { Table } from 'dexie';

export interface ZenFBPost {
  id?: number;
  name: string;
  text: string;
  mediaUrl: string;
  tags: string;
  created_at: number;
}

export class ZenFBDatabase extends Dexie {
  posts!: Table<ZenFBPost>; 

  constructor() {
    super('ZenFBDatabase');
    this.version(1).stores({
      posts: '++id, name, created_at' // Primary key and indexed props
    });
  }
}

export const db = new ZenFBDatabase();
