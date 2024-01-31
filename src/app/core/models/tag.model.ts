import { TransactionType } from './transaction-type.model';
export interface TagInfo {
  tagIconName: string;
  transactionType: TransactionType;
  tagName: string;
  sort: number;
  id: string;
}
