import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map, take } from 'rxjs';
import { TagInfo } from '../models/tag.model';
import { Firestore, collection, collectionData, orderBy, query } from '@angular/fire/firestore';

export const TagListGroupResolver: ResolveFn<TagInfo[][]> =
  () => {
    const firestore = inject(Firestore)
    return collectionData(query(collection(firestore, 'tagList'), orderBy('sort', 'asc')), { idField: 'id' })
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
