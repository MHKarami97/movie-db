import { openDB, IDBPDatabase } from 'idb';
import { IListRepository } from './interfaces.js';
import { CustomList, ListItemRecord, MediaType } from '../types/index.js';

interface FavoriteStoreItem extends ListItemRecord {
  key: string; // `${type}_${id}`
}

export class ListRepository implements IListRepository {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB('movie_db_user_data', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('custom_lists')) {
          db.createObjectStore('custom_lists', { keyPath: 'id' });
        }
      }
    });
  }

  public async getFavorites(): Promise<ListItemRecord[]> {
    const db = await this.dbPromise;
    const items = (await db.getAll('favorites')) as FavoriteStoreItem[];
    return items.map(({ type, id, addedAt, watched }) => ({
      type,
      id,
      addedAt,
      watched: Boolean(watched)
    }));
  }

  public async isFavorite(type: MediaType, id: number): Promise<boolean> {
    const db = await this.dbPromise;
    const item = await db.get('favorites', `${type}_${id}`);
    return Boolean(item);
  }

  public async toggleFavorite(type: MediaType, id: number): Promise<boolean> {
    const db = await this.dbPromise;
    const key = `${type}_${id}`;
    const existing = await db.get('favorites', key);

    if (existing) {
      await db.delete('favorites', key);
      return false;
    } else {
      const item: FavoriteStoreItem = {
        key,
        type,
        id,
        addedAt: Date.now(),
        watched: false
      };
      await db.put('favorites', item);
      return true;
    }
  }

  public async toggleWatched(type: MediaType, id: number): Promise<boolean> {
    const db = await this.dbPromise;
    const key = `${type}_${id}`;
    const existing = (await db.get('favorites', key)) as FavoriteStoreItem | undefined;

    if (existing) {
      existing.watched = !existing.watched;
      await db.put('favorites', existing);
      return Boolean(existing.watched);
    }
    return false;
  }

  public async getCustomLists(): Promise<CustomList[]> {
    const db = await this.dbPromise;
    return (await db.getAll('custom_lists')) as CustomList[];
  }

  public async createCustomList(name: string): Promise<CustomList> {
    const db = await this.dbPromise;
    const now = Date.now();
    const newList: CustomList = {
      id: `list_${now}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
      items: []
    };
    await db.put('custom_lists', newList);
    return newList;
  }

  public async updateCustomList(list: CustomList): Promise<void> {
    const db = await this.dbPromise;
    list.updatedAt = Date.now();
    await db.put('custom_lists', list);
  }

  public async deleteCustomList(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('custom_lists', id);
  }

  public async addToList(listId: string, type: MediaType, id: number): Promise<void> {
    const db = await this.dbPromise;
    const list = (await db.get('custom_lists', listId)) as CustomList | undefined;
    if (!list) return;

    const exists = list.items.some((i) => i.type === type && i.id === id);
    if (!exists) {
      list.items.push({
        type,
        id,
        addedAt: Date.now(),
        watched: false
      });
      list.updatedAt = Date.now();
      await db.put('custom_lists', list);
    }
  }

  public async removeFromList(listId: string, type: MediaType, id: number): Promise<void> {
    const db = await this.dbPromise;
    const list = (await db.get('custom_lists', listId)) as CustomList | undefined;
    if (!list) return;

    list.items = list.items.filter((i) => !(i.type === type && i.id === id));
    list.updatedAt = Date.now();
    await db.put('custom_lists', list);
  }

  public async exportBackup(): Promise<string> {
    const favorites = await this.getFavorites();
    const customLists = await this.getCustomLists();
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites,
      customLists
    };
    return JSON.stringify(backup, null, 2);
  }

  public async importBackup(jsonString: string): Promise<void> {
    const parsed = JSON.parse(jsonString);
    if (!parsed || parsed.version !== 1) {
      throw new Error('فایل پشتیبان نامعتبر یا ناسازگار است.');
    }

    const db = await this.dbPromise;
    const tx = db.transaction(['favorites', 'custom_lists'], 'readwrite');

    if (Array.isArray(parsed.favorites)) {
      for (const fav of parsed.favorites) {
        if (fav.type && fav.id) {
          await tx.objectStore('favorites').put({
            key: `${fav.type}_${fav.id}`,
            type: fav.type,
            id: fav.id,
            addedAt: fav.addedAt || Date.now(),
            watched: Boolean(fav.watched)
          });
        }
      }
    }

    if (Array.isArray(parsed.customLists)) {
      for (const list of parsed.customLists) {
        if (list.id && list.name) {
          await tx.objectStore('custom_lists').put(list);
        }
      }
    }

    await tx.done;
  }
}
