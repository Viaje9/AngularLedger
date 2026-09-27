import { Injectable } from '@angular/core';
import {
  archiveTag, createEntry, createTag, deleteEntry, getEntriesSummary, getEntry,
  getTag, listEntries, listTags, restoreTag, setTagOrder, updateEntry, updateTag,
} from '../../api/generated/sdk.gen';
import type { EntriesResponse, Entry, EntryKind, Tag } from '../../api/generated/types.gen';
import { AddLedgerItem, LedgerItem } from '../models/ledger-item.model';
import { TagInfo } from '../models/tag.model';
import { TransactionType } from '../models/transaction-type.model';
import { AuthService } from './auth.service';

interface TagListCache {
  fetchedAtMs: number;
  items: TagInfo[];
}

const toTag = (tag: Tag): TagInfo => ({
  id: tag.id, tagName: tag.name, tagIconName: tag.iconName,
  transactionType: tag.kind, sort: tag.sortOrder, archivedAtMs: tag.archivedAtMs,
});

const toItem = (entry: Entry): LedgerItem => ({
  id: entry.id, date: new Date(entry.occurredAtMs),
  price: (entry.amountMinor / 10 ** entry.currencyScale).toString(),
  tagId: entry.tagId, description: entry.description, tagInfo: toTag(entry.tag),
});

const amountMinor = (price: string): number => {
  if (!/^\d+(?:\.\d{1,2})?$/.test(price)) throw new Error('金額格式錯誤');
  const [units, fraction = ''] = price.split('.');
  const result = Number(units) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(result)) throw new Error('金額超出範圍');
  return result;
};

const dayRange = (start: Date, end: Date) => {
  const from = new Date(start); from.setHours(0, 0, 0, 0);
  const to = new Date(end); to.setHours(0, 0, 0, 0); to.setDate(to.getDate() + 1);
  return { fromMs: from.getTime(), toMs: to.getTime() };
};

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly tagCachePrefix = 'angular-ledger:tags:v1:';
  private readonly tagCacheMaxAgeMs = 24 * 60 * 60 * 1000;
  private tagCache = new Map<string, TagListCache>();
  private tagRefreshes = new Map<string, Promise<TagInfo[]>>();
  private tagCacheVersions = new Map<string, number>();
  private scheduledTagPrefetches = new Set<string>();

  constructor(private auth: AuthService) {}

  private tagCacheKey(type: TransactionType): string | null {
    return this.auth.accountId ? `${this.tagCachePrefix}${this.auth.accountId}:${type}` : null;
  }

  private copyTags(items: TagInfo[]): TagInfo[] {
    return items.map(item => ({ ...item }));
  }

  private readTagCache(key: string, type: TransactionType): TagListCache | null {
    const inMemory = this.tagCache.get(key);
    if (inMemory) return inMemory;
    if (typeof localStorage === 'undefined') return null;

    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      const cache: unknown = JSON.parse(raw);
      if (!cache || typeof cache !== 'object' ||
          !('fetchedAtMs' in cache) || typeof cache.fetchedAtMs !== 'number' ||
          !Number.isFinite(cache.fetchedAtMs) ||
          !('items' in cache) || !Array.isArray(cache.items) ||
          !cache.items.every((item: unknown) =>
            item !== null && typeof item === 'object' &&
            'id' in item && typeof item.id === 'string' &&
            'tagName' in item && typeof item.tagName === 'string' &&
            'tagIconName' in item && typeof item.tagIconName === 'string' &&
            'transactionType' in item && item.transactionType === type &&
            'sort' in item && typeof item.sort === 'number' && Number.isFinite(item.sort) &&
            'archivedAtMs' in item && item.archivedAtMs === null)) {
        localStorage.removeItem(key);
        return null;
      }
      const valid = cache as TagListCache;
      this.tagCache.set(key, valid);
      return valid;
    } catch {
      return null;
    }
  }

  private writeTagCache(key: string, items: TagInfo[]): void {
    const cache = { fetchedAtMs: Date.now(), items: this.copyTags(items) };
    this.tagCache.set(key, cache);
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(key, JSON.stringify(cache)); } catch { /* Cache is optional. */ }
  }

  private async loadTagList(type: TransactionType, includeArchived = false): Promise<TagInfo[]> {
    const { data } = await listTags({ query: { kind: type, includeArchived }, throwOnError: true });
    return data.items.map(toTag);
  }

  private refreshActiveTags(type: TransactionType, key: string): Promise<TagInfo[]> {
    const pending = this.tagRefreshes.get(key);
    if (pending) return pending;

    const version = this.tagCacheVersions.get(key) ?? 0;
    const refresh = this.loadTagList(type).then(items => {
      if (this.tagCacheKey(type) === key && version === (this.tagCacheVersions.get(key) ?? 0)) {
        this.writeTagCache(key, items);
      }
      return items;
    }).finally(() => {
      if (this.tagRefreshes.get(key) === refresh) this.tagRefreshes.delete(key);
    });
    this.tagRefreshes.set(key, refresh);
    return refresh;
  }

  private invalidateTagCache(type: TransactionType): void {
    const key = this.tagCacheKey(type);
    if (!key) return;
    this.tagCacheVersions.set(key, (this.tagCacheVersions.get(key) ?? 0) + 1);
    this.tagRefreshes.delete(key);
    this.tagCache.delete(key);
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(key); } catch { /* Cache is optional. */ }
  }

  async getTagList(type: TransactionType, includeArchived = false): Promise<TagInfo[]> {
    if (includeArchived) return this.loadTagList(type, true);
    const key = this.tagCacheKey(type);
    if (!key) return this.loadTagList(type);

    const cached = this.readTagCache(key, type);
    if (cached) {
      if (cached.fetchedAtMs > Date.now() ||
          Date.now() - cached.fetchedAtMs >= this.tagCacheMaxAgeMs) {
        void this.refreshActiveTags(type, key).catch(() => { /* Keep the cached list. */ });
      }
      return this.copyTags(cached.items);
    }
    return this.copyTags(await this.refreshActiveTags(type, key));
  }

  prefetchTagList(type: TransactionType): void {
    const key = this.tagCacheKey(type);
    if (!key || this.readTagCache(key, type) || this.scheduledTagPrefetches.has(key)) return;

    this.scheduledTagPrefetches.add(key);
    const prefetch = () => {
      this.scheduledTagPrefetches.delete(key);
      if (this.tagCacheKey(type) !== key || this.readTagCache(key, type)) return;
      void this.refreshActiveTags(type, key).catch(() => { /* Try again on demand. */ });
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(prefetch, { timeout: 5000 });
    } else {
      setTimeout(prefetch, 1000);
    }
  }

  async getTagInfo(id: string): Promise<TagInfo> {
    const { data } = await getTag({ path: { id }, throwOnError: true });
    return toTag(data);
  }

  async getTagLastSort(type: TransactionType): Promise<number> {
    const tags = await this.getTagList(type);
    return tags.length ? Math.max(...tags.map(tag => tag.sort)) + 1 : 0;
  }

  async addTagDoc(data: { tagIconName: string; tagName: string; sort: number; transactionType: TransactionType }) {
    const { data: tag } = await createTag({ body: { kind: data.transactionType, name: data.tagName, iconName: data.tagIconName }, throwOnError: true });
    this.invalidateTagCache(tag.kind);
    return toTag(tag);
  }

  async updateTagDoc(id: string, tagIconName: string, tagName: string) {
    const { data } = await updateTag({ path: { id }, body: { name: tagName, iconName: tagIconName }, throwOnError: true });
    this.invalidateTagCache(data.kind);
    return toTag(data);
  }

  async removeTagDoc(id: string) {
    const { data } = await archiveTag({ path: { id }, throwOnError: true });
    this.invalidateTagCache(data.kind);
  }

  async restoreTagDoc(id: string) {
    const { data } = await restoreTag({ path: { id }, throwOnError: true });
    this.invalidateTagCache(data.kind);
  }

  async updateTagsSort(tags: TagInfo[]) {
    if (!tags.length) return;
    await setTagOrder({ body: { kind: tags[0].transactionType, tagIds: tags.map(tag => tag.id) }, throwOnError: true });
    this.invalidateTagCache(tags[0].transactionType);
  }

  private async listRange(kind: EntryKind, start: Date, end: Date): Promise<LedgerItem[]> {
    const items: LedgerItem[] = [];
    const range = dayRange(start, end);
    let cursor: string | null = null;
    do {
      const { data }: { data: EntriesResponse } = await listEntries({ query: { kind, ...range, limit: 100, ...(cursor ? { cursor } : {}) }, throwOnError: true });
      items.push(...data.items.map(toItem));
      cursor = data.nextCursor;
    } while (cursor);
    return items;
  }

  private async entry(kind: EntryKind, id: string): Promise<LedgerItem> {
    const { data } = await getEntry({ path: { kind, id }, throwOnError: true });
    return toItem(data);
  }

  private async add(kind: EntryKind, value: AddLedgerItem) {
    const { data } = await createEntry({ body: {
      kind, occurredAtMs: value.date.getTime(), amountMinor: amountMinor(value.price),
      currencyCode: 'TWD', currencyScale: 2, tagId: value.tagId, description: value.description,
    }, throwOnError: true });
    return toItem(data);
  }

  private async update(kind: EntryKind, value: AddLedgerItem & { docId: string }) {
    const { data } = await updateEntry({ path: { kind, id: value.docId }, body: {
      occurredAtMs: value.date.getTime(), amountMinor: amountMinor(value.price),
      currencyCode: 'TWD', currencyScale: 2, tagId: value.tagId, description: value.description,
    }, throwOnError: true });
    return toItem(data);
  }

  private async remove(kind: EntryKind, id: string) {
    await deleteEntry({ path: { kind, id }, throwOnError: true });
  }

  getExpenseInfo(id: string) { return this.entry('expense', id); }
  getIncomeInfo(id: string) { return this.entry('income', id); }
  addExpense(value: AddLedgerItem) { return this.add('expense', value); }
  addIncome(value: AddLedgerItem) { return this.add('income', value); }
  updateExpense(value: AddLedgerItem & { docId: string }) { return this.update('expense', value); }
  updateIncome(value: AddLedgerItem & { docId: string }) { return this.update('income', value); }
  deleteExpense(id: string) { return this.remove('expense', id); }
  deleteIncome(id: string) { return this.remove('income', id); }
  getTodayExpenseList(date: Date) { return this.listRange('expense', date, date); }
  getTodayIncomeList(date: Date) { return this.listRange('income', date, date); }
  getRangeItems(start: Date, end: Date) { return this.listRange('expense', start, end); }
  async getBudgetAmount(start: Date, end: Date): Promise<number> {
    const { data } = await getEntriesSummary({ query: {
      kind: 'expense', ...dayRange(start, end), currencyCode: 'TWD',
    }, throwOnError: true });
    return data.totalMinor / 100;
  }
}
