import { TagInfo } from './tag.model';

export interface LedgerItem {
  id: string;
  date: Date;
  price: string;
  tagId: string;
  description: string;
  tagInfo: TagInfo;
}

export interface AddLedgerItem {
  date: Date;
  price: string;
  tagId: string;
  description: string;
}
