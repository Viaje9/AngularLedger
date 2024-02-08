import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import { map, take } from 'rxjs';
import { TagInfo } from '../../../core/models/tag.model';
import { LedgerService } from '../../../core/services/ledger.service';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';
import { AddTagInitDataType, AddTagStatus, AddTagStatusEnum, EditTagInitData } from './add-tag.model';

export const AddTagInitDataResolver: ResolveFn<AddTagInitDataType> =
  () => {
    const ledgerService = inject(LedgerService)
    const router = inject(Router)
    const docId = router?.getCurrentNavigation()?.extras.state?.['docId']
    const transactionType = router?.getCurrentNavigation()?.extras.state?.['transactionType']
    const tagStatus = router?.getCurrentNavigation()?.extras.state?.['tagStatus'] as AddTagStatus
    if (tagStatus === AddTagStatusEnum.Edit) {
      return ledgerService.getTagInfo(docId).then(docSnap => {
        if (docSnap.exists()) {
          const result = docSnap.data() as TagInfo
          return {
            tagStatus,
            docId: docId,
            lastSort: result.sort,
            selectedTag: result.tagIconName,
            tagName: result.tagName,
          } as EditTagInitData
        } else {
          router.navigate(['/setting/tags-manage'])
        }

        return
      })
    } else if (tagStatus === AddTagStatusEnum.Add){
      if(transactionType) {
        return ledgerService.getTagLastSort(TransactionTypeEnum.Expense).pipe(take(1)).pipe(map(e => {
          return {
            tagStatus,
            transactionType,
            lastSort: e
          } as AddTagInitDataType
        }))
      }
    }
    router.navigate(['/setting/tags-manage'])
    return
  };
