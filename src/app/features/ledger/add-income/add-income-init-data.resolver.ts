import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import { AddIncomeInitDataType, StatusEnum, StatusType } from './add-income.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LedgerItem } from '@src/app/core/models/ledger-item.model';
import dayjs from 'dayjs';

export const AddIncomeInitDataResolver: ResolveFn<AddIncomeInitDataType> =
  (route) => {
    const ledgerService = inject(LedgerService)
    const router = inject(Router)
    const incomeStatus = (route.queryParamMap.has('id') ? StatusEnum.Edit : router?.getCurrentNavigation()?.extras.state?.['incomeStatus'] || (route.queryParamMap.has('date') ? StatusEnum.Add : undefined)) as StatusType

    if (incomeStatus === StatusEnum.Edit) {
      const docId = route.queryParamMap.get('id') || router?.getCurrentNavigation()?.extras.state?.['docId'] || ''
      return ledgerService.getIncomeInfo(docId).then(result => {
          return {
            incomeStatus: incomeStatus,
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
    } else if (incomeStatus === StatusEnum.Add) {
      const date = router?.getCurrentNavigation()?.extras.state?.['date'] || route.queryParamMap.get('date')
      if (date) {
        return {
          incomeStatus: incomeStatus,
          date: typeof date === 'string' ? dayjs(date).toDate() : new Date(date),
        }
      }
    }

    router.navigate(['/'])
    return
  };
