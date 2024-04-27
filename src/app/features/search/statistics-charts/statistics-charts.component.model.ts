import { LedgerItem } from "@src/app/core/models/ledger-item.model"

export interface RangeGroupItem {
  tagId: string,
  price: number,
  tagName: string
  items: Array<LedgerItem>
}
