import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import { AddExpenseInitDataType, StatusEnum, StatusType } from './add-expense.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LedgerItem } from '@src/app/core/models/ledger-item.model';
import { Timestamp } from '@angular/fire/firestore';

export const AddExpenseInitDataResolver: ResolveFn<AddExpenseInitDataType> =
  () => {
    const ledgerService = inject(LedgerService)
    const router = inject(Router)
    const expenseStatus = router?.getCurrentNavigation()?.extras.state?.['expenseStatus'] as StatusType

    if (expenseStatus === StatusEnum.Edit) {
      const docId = router?.getCurrentNavigation()?.extras.state?.['docId']
      return ledgerService.getExpenseInfo(docId).then(docSnap => {
        if (docSnap.exists()) {
          const result = docSnap.data() as LedgerItem
          return {
            expenseStatus: expenseStatus,
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
    } else if (expenseStatus === StatusEnum.Add) {
      const date = router?.getCurrentNavigation()?.extras.state?.['date']
      if (date) {
        return {
          expenseStatus: expenseStatus,
          date: Timestamp.fromDate(date),
        }
      }
    }

    router.navigate(['/'])
    return
  };
