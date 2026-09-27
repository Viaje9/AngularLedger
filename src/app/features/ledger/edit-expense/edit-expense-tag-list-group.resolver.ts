import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { TagInfo } from '../../../core/models/tag.model';
import { LedgerService } from '../../../core/services/ledger.service';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';

export const EditExpenseTagListGroupResolver: ResolveFn<TagInfo[][]> =
  (route) => {
    const ledgerService = inject(LedgerService)
    const docId = route.queryParamMap.get('id') || inject(Router).getCurrentNavigation()?.extras.state?.['docId']
    return Promise.all([
      ledgerService.getTagList(TransactionTypeEnum.Expense),
      docId ? ledgerService.getExpenseInfo(docId) : Promise.resolve(null),
    ]).then(([tagList, entry]) => {
        if (entry && !tagList.some(tag => tag.id === entry.tagId)) {
          tagList.push(entry.tagInfo)
        }
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
