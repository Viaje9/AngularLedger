import { Timestamp } from "@angular/fire/firestore";

export interface AddIncomeInitData {
  incomeStatus: StatusType;
  date: Timestamp;
}

export interface EditIncomeInitData {
  incomeStatus: StatusType;
  docId: string;
  date: Timestamp;
  price: string;
  tagId: string;
  description: string;
}

export enum StatusEnum {
  Add = 'add',
  Edit = 'edit'
}


export type StatusType = StatusEnum.Add | StatusEnum.Edit


export type AddIncomeInitDataType = AddIncomeInitData | EditIncomeInitData | void
