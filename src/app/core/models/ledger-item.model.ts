import { Timestamp } from '@angular/fire/firestore';
import { TagInfo } from '@src/app/core/models/tag.model';

export interface LedgerItem {
  id: string;
  date: Timestamp;
  price: string;
  tagId: string;
  description: string;
  tagInfo: TagInfo;
}


export interface AddLedgerItem {
  date: Timestamp;
  price: string;
  tagId: string;
  description: string;
}
