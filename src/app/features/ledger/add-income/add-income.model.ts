export interface AddIncomeInitData {
  incomeStatus: StatusType;
  date: Date;
}

export interface EditIncomeInitData {
  incomeStatus: StatusType;
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


export type AddIncomeInitDataType = AddIncomeInitData | EditIncomeInitData | void
