import { inject } from '@angular/core';
import {  ResolveFn, Router} from '@angular/router';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LedgerItem } from '@src/app/core/models/ledger-item.model';
import { EditExpenseInitData } from './edit-expense.model';

export const EditExpenseInitDataResolver: ResolveFn<EditExpenseInitData | void> =
  (route) => {
    const ledgerService = inject(LedgerService)
    const router = inject(Router)

    const docId = router?.getCurrentNavigation()?.extras.state?.['docId'] || route.queryParamMap.get('id') || ''
    return ledgerService.getExpenseInfo(docId).then(result => {
        return {
          docId: docId,
          date: result.date,
          price: result.price,
          tagId: result.tagId,
          description: result.description,
        }
    }).catch(() => {
      router.navigate(['/'])
      return
    })
  };
