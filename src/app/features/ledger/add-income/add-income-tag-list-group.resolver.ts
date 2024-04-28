import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map, take } from 'rxjs';
import { TagInfo } from '../../../core/models/tag.model';
import { LedgerService } from '../../../core/services/ledger.service';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';

export const AddIncomeTagListGroupResolver: ResolveFn<TagInfo[][]> =
  () => {
    const ledgerService = inject(LedgerService)
    return ledgerService.getTagList(TransactionTypeEnum.Income)
      .then(tagList => {
        const result = (tagList as TagInfo[]).reduce((acc: TagInfo[][], cur, i) => {
          const num = Math.floor(i / 9)
          if (!acc[num]) {
            acc[num] = [cur]
          } else {
            acc[num].push(cur)
          }
          return acc
        }, [])
        return result
      })
  };
