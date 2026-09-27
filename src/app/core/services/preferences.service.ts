import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {
  createSavedDescription, deleteBudget, deleteSavedDescription, getBudget,
  listSavedDescriptions, putBudget, saveDescriptionsFromEntries,
} from '../../api/generated/sdk.gen';
import type { Budget, SavedDescription } from '../../api/generated/types.gen';

interface DescriptionsCache {
  fetchedAtMs: number;
  items: SavedDescription[];
}

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly descriptionsCachePrefix = 'angular-ledger:saved-descriptions:v1:';
  private readonly descriptionsCacheMaxAgeMs = 5 * 60 * 1000;
  private descriptionsRefresh: { key: string | null; promise: Promise<SavedDescription[]> } | null = null;
  private descriptionsVersion = 0;

  constructor(private auth: AuthService) {}

  private descriptionsCacheKey(): string | null {
    return this.auth.accountId
      ? `${this.descriptionsCachePrefix}${this.auth.accountId}`
      : null;
  }

  private readDescriptionsCache(): DescriptionsCache | null {
    const key = this.descriptionsCacheKey();
    if (!key || typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      const cache: unknown = JSON.parse(raw);
      if (cache === null || typeof cache !== 'object' ||
          !('fetchedAtMs' in cache) || typeof cache.fetchedAtMs !== 'number' ||
          !Number.isFinite(cache.fetchedAtMs) ||
          !('items' in cache) || !Array.isArray(cache.items) || !cache.items.every(item =>
        item !== null && typeof item === 'object' &&
        typeof item.id === 'string' && typeof item.description === 'string' &&
        Number.isFinite(item.createdAtMs))) {
        localStorage.removeItem(key);
        return null;
      }
      return cache as DescriptionsCache;
    } catch {
      return null;
    }
  }

  cachedDescriptions(): SavedDescription[] | null {
    return this.readDescriptionsCache()?.items ?? null;
  }

  shouldRefreshDescriptions(): boolean {
    const cache = this.readDescriptionsCache();
    return !cache || cache.items.length === 0 ||
      cache.fetchedAtMs > Date.now() ||
      Date.now() - cache.fetchedAtMs >= this.descriptionsCacheMaxAgeMs;
  }

  private saveDescriptionsCache(items: SavedDescription[]): void {
    const key = this.descriptionsCacheKey();
    if (!key || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify({ fetchedAtMs: Date.now(), items }));
    } catch {
      // Storage may be unavailable or full; D1 remains the source of truth.
    }
  }

  private clearDescriptionsCache(): void {
    this.descriptionsVersion++;
    const key = this.descriptionsCacheKey();
    if (!key || typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(key); } catch { /* Storage is optional. */ }
  }

  async getBudget(): Promise<Budget | null> {
    const { data } = await getBudget({ throwOnError: true });
    return data.budget;
  }

  async saveBudget(value: Budget): Promise<Budget> {
    const { data } = await putBudget({ body: value, throwOnError: true });
    return data.budget!;
  }

  async clearBudget() {
    await deleteBudget({ throwOnError: true });
  }

  refreshDescriptions(): Promise<SavedDescription[]> {
    const key = this.descriptionsCacheKey();
    if (this.descriptionsRefresh?.key === key) return this.descriptionsRefresh.promise;
    const version = this.descriptionsVersion;
    const promise = listSavedDescriptions({ throwOnError: true })
      .then(({ data }) => {
        if (key !== this.descriptionsCacheKey()) {
          throw new Error('Account changed while loading saved descriptions');
        }
        if (version !== this.descriptionsVersion) {
          return this.cachedDescriptions() ?? data.items;
        }
        this.saveDescriptionsCache(data.items);
        return data.items;
      })
      .finally(() => {
        if (this.descriptionsRefresh?.promise === promise) this.descriptionsRefresh = null;
      });
    this.descriptionsRefresh = { key, promise };
    return promise;
  }

  async addDescription(description: string) {
    const { data } = await createSavedDescription({ body: { description }, throwOnError: true });
    this.descriptionsVersion++;
    const cached = this.cachedDescriptions();
    if (cached) this.saveDescriptionsCache([data, ...cached.filter(item => item.id !== data.id)]);
    return data;
  }

  async removeDescription(id: string) {
    await deleteSavedDescription({ path: { id }, throwOnError: true });
    this.descriptionsVersion++;
    const cached = this.cachedDescriptions();
    if (cached) this.saveDescriptionsCache(cached.filter(item => item.id !== id));
  }

  async saveExpenseDescriptions() {
    const { data } = await saveDescriptionsFromEntries({ throwOnError: true });
    this.clearDescriptionsCache();
    return data;
  }
}
