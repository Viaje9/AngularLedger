import { Timestamp } from "@angular/fire/firestore";


export interface EditExpenseInitData {
  docId: string;
  date: Timestamp;
  price: string;
  tagId: string;
  description: string;
}
