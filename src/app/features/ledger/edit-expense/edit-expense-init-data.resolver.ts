import { inject } from '@angular/core';
import {  ResolveFn, Router} from '@angular/router';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LedgerItem } from '@src/app/core/models/ledger-item.model';
import { EditExpenseInitData } from './edit-expense.model';

export const EditExpenseInitDataResolver: ResolveFn<EditExpenseInitData | void> =
  () => {
    const ledgerService = inject(LedgerService)
    const router = inject(Router)

    const docId = router?.getCurrentNavigation()?.extras.state?.['docId']
    return ledgerService.getExpenseInfo(docId).then(docSnap => {
      if (docSnap.exists()) {
        const result = docSnap.data() as LedgerItem
        return {
          docId: docId,
          date: result.date,
          price: result.price,
          tagId: result.tagId,
          description: result.description,
        }
      } else {
        router.navigate(['/'])
      }
      return
    })
  };
