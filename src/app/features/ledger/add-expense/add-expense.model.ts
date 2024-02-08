export interface AddExpenseInitData {
  expenseStatus: StatusType;
  date: Date;
}

export interface EditExpenseInitData {
  expenseStatus: StatusType;
  docId: string;
  date: Date;
  price: string;
  tagId: string;
  description: string;
}

export enum StatusEnum {
  Add = 'add',
  Edit = 'edit'
}


export type StatusType = StatusEnum.Add | StatusEnum.Edit


export type AddExpenseInitDataType = AddExpenseInitData | EditExpenseInitData | void
