import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import { map, take } from 'rxjs';
import { TagInfo } from '../../../core/models/tag.model';
import { LedgerService } from '../../../core/services/ledger.service';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';
import { AddTagInitDataType, AddTagStatus, AddTagStatusEnum, EditTagInitData } from './add-tag.model';

export const AddTagInitDataResolver: ResolveFn<AddTagInitDataType> =
  (route) => {
    const ledgerService = inject(LedgerService)
    const router = inject(Router)
    const docId = route.queryParamMap.get('id') || router?.getCurrentNavigation()?.extras.state?.['docId']
    const transactionType = route.queryParamMap.get('kind') || router?.getCurrentNavigation()?.extras.state?.['transactionType']
    const tagStatus = (docId ? AddTagStatusEnum.Edit : transactionType ? AddTagStatusEnum.Add : undefined) as AddTagStatus
    if (tagStatus === AddTagStatusEnum.Edit) {
      return ledgerService.getTagInfo(docId).then(result => {
          return {
            tagStatus,
            docId: docId,
            lastSort: result.sort,
            transactionType: result.transactionType,
            selectedTag: result.tagIconName,
            tagName: result.tagName,
          } as EditTagInitData
      }).catch(() => {
        router.navigate(['/setting/tagsManage'])
        return
      })
    } else if (tagStatus === AddTagStatusEnum.Add){
      if(transactionType) {
        return ledgerService.getTagLastSort(transactionType).then(e => {
          return {
            tagStatus,
            transactionType,
            lastSort: e
          } as AddTagInitDataType
        })
      }
    }
    router.navigate(['/setting/tagsManage'])
    return
  };
