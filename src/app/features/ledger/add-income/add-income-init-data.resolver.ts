import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import { AddIncomeInitDataType, StatusEnum, StatusType } from './add-income.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LedgerItem } from '@src/app/core/models/ledger-item.model';
import { Timestamp } from '@angular/fire/firestore';

export const AddIncomeInitDataResolver: ResolveFn<AddIncomeInitDataType> =
  () => {
    const ledgerService = inject(LedgerService)
    const router = inject(Router)
    const incomeStatus = router?.getCurrentNavigation()?.extras.state?.['incomeStatus'] as StatusType

    if (incomeStatus === StatusEnum.Edit) {
      const docId = router?.getCurrentNavigation()?.extras.state?.['docId']
      return ledgerService.getIncomeInfo(docId).then(docSnap => {
        if (docSnap.exists()) {
          const result = docSnap.data() as LedgerItem
          return {
            incomeStatus: incomeStatus,
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
    } else if (incomeStatus === StatusEnum.Add) {
      const date = router?.getCurrentNavigation()?.extras.state?.['date']
      if (date) {
        return {
          incomeStatus: incomeStatus,
          date: Timestamp.fromDate(date),
        }
      }
    }

    router.navigate(['/'])
    return
  };
