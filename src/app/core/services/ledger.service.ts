import { Injectable } from '@angular/core';
import {
  archiveTag, createEntry, createTag, deleteEntry, getEntriesSummary, getEntry,
  getTag, listEntries, listTags, restoreTag, setTagOrder, updateEntry, updateTag,
} from '../../api/generated/sdk.gen';
import type { EntriesResponse, Entry, EntryKind, Tag } from '../../api/generated/types.gen';
import { AddLedgerItem, LedgerItem } from '../models/ledger-item.model';
import { TagInfo } from '../models/tag.model';
import { TransactionType } from '../models/transaction-type.model';

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
  async getTagList(type: TransactionType, includeArchived = false): Promise<TagInfo[]> {
    const { data } = await listTags({ query: { kind: type, includeArchived }, throwOnError: true });
    return data.items.map(toTag);
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
    return toTag(tag);
  }

  async updateTagDoc(id: string, tagIconName: string, tagName: string) {
    const { data } = await updateTag({ path: { id }, body: { name: tagName, iconName: tagIconName }, throwOnError: true });
    return toTag(data);
  }

  async removeTagDoc(id: string) {
    await archiveTag({ path: { id }, throwOnError: true });
  }

  async restoreTagDoc(id: string) {
    await restoreTag({ path: { id }, throwOnError: true });
  }

  async updateTagsSort(tags: TagInfo[]) {
    if (!tags.length) return;
    await setTagOrder({ body: { kind: tags[0].transactionType, tagIds: tags.map(tag => tag.id) }, throwOnError: true });
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
