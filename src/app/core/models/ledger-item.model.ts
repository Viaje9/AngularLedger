import { TagInfo } from '@src/app/core/models/tag.model';

export interface LedgerItem {
  id: string;
  date: string;
  price: string;
  tagId: string;
  description: string;
  tagInfo: TagInfo;
}


export interface AddExpenseItem {
  date: string;
  price: string;
  tagId: string;
  description: string;
}
