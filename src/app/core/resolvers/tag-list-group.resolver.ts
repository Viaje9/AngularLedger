import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map, take } from 'rxjs';
import { TagInfo } from '../models/tag.model';
import { LedgerService } from '../services/ledger.service';

export const TagListGroupResolver: ResolveFn<TagInfo[][]> =
  () => {
    const ledgerService = inject(LedgerService)
    return ledgerService.getTagList()
      .pipe(take(1), map(tagList => {
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
      }))
  };
