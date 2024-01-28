import { CommonModule } from '@angular/common';
import { Component, inject, type OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Firestore, collectionData, collection, orderBy, query, doc, getDocs, deleteDoc, writeBatch } from '@angular/fire/firestore';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { SharedModule } from '@src/app/shared/shared.module';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { LoaderService } from '@src/app/core/services/loader.service';
import { TagInfo } from '@src/app/core/models/tag.model';
import { LedgerService } from '@src/app/core/services/ledger.service';

@Component({
  selector: 'app-tags-manage',
  standalone: true,
  imports: [
    SharedModule,
    CdkDropList,
    CdkDrag
  ],
  templateUrl: './tags-manage.component.html',
  styleUrl: './tags-manage.component.css',
})
export class TagsManageComponent implements OnInit {

  tagList: TagInfo[] = [];
  keepTagList: TagInfo[] = [];
  isDrop = false;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private loaderService: LoaderService,
    private ledgerService: LedgerService
  ) {

    this.ledgerService.getTagList().subscribe((data) => {
      console.log('test', data);

      this.tagList = data
    })

    //     this.ledgerService.getTagList().then((data) => {
    //       console.log(data);
    //
    //       // this.tagList = data
    //     }).catch((error) => {
    //       console.log(error);
    //
    //     })


    // const itemCollection = collection(this.firestore, 'tagList');
    // const tagList$ = collectionData(query(itemCollection, orderBy('sort', 'asc')), { idField: 'id' }) as Observable<TagInfo[]>;
    // tagList$.subscribe((data) => {
    //   this.tagList = data;
    // })
  }

  ngOnInit(): void {
  }


  goToRemoveTag(id: string) {
    this.router.navigate(['/setting/addTag'], { state: { docId: id } })
  }

  doDropList() {
    if (!this.isDrop) {
      this.keepTagList = structuredClone(this.tagList)
      this.isDrop = true
    } else {
      this.tagList = this.keepTagList
      this.isDrop = false
    }
  }

  dropTag(event: CdkDragDrop<string[]>) {

    const deepCopyTagList = structuredClone(this.tagList)

    // 從原數組中取出要移動的元素
    const movedTag = deepCopyTagList[event.previousIndex];

    // 創建一個不包含該元素的新數組
    const arrayWithoutElement = [
      ...deepCopyTagList.slice(0, event.previousIndex),
      ...deepCopyTagList.slice(event.previousIndex + 1)
    ];

    // 在指定位置插入元素，創建最終數組
    const newTagList = [
      ...arrayWithoutElement.slice(0, event.currentIndex),
      movedTag,
      ...arrayWithoutElement.slice(event.currentIndex)
    ];

    this.tagList = newTagList.map((tag, index) => ({ ...tag, sort: index }))
  }

  async onConfirm() {
    this.loaderService.start()
    const batch = writeBatch(this.firestore)
    this.tagList.forEach((tag) => {
      const docRef = doc(this.firestore, 'tagList', tag.id);
      batch.update(docRef, { sort: tag.sort });
    })
    await batch.commit().then(() => {
      this.isDrop = false
      this.keepTagList = []
    }).catch(error => {
      console.error('Error in batch update:', error);
    }).finally(() => {
      this.loaderService.stop()
    })
  }
}
