import { Timestamp } from "@angular/fire/firestore";

export interface AddExpenseInitData {
  date: Timestamp;
}



export type AddExpenseInitDataType = AddExpenseInitData | void
