import { TransactionType } from "@src/app/core/models/transaction-type.model"

export interface AddTagInitData {
  tagStatus: AddTagStatus;
  transactionType: TransactionType;
  lastSort: number;
}

export interface EditTagInitData {
  tagStatus: AddTagStatus;
  docId: string;
  lastSort: number;
  selectedTag: string;
  tagName: string;
}

export enum AddTagStatusEnum {
  Add = 'add',
  Edit = 'edit'
}


export type AddTagStatus = AddTagStatusEnum.Add | AddTagStatusEnum.Edit


export type AddTagInitDataType =   AddTagInitData | EditTagInitData | void
