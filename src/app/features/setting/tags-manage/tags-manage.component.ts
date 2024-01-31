import { Component, type OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '@src/app/shared/shared.module';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { LoaderService } from '@src/app/core/services/loader.service';
import { TagInfo } from '@src/app/core/models/tag.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';
import { TransactionType } from '@src/app/core/models/transaction-type.model';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AddTagStatusEnum } from '../add-tag/add-tag.model';

@UntilDestroy()
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

  get TransactionTypeEnum() {
    return TransactionTypeEnum
  }

  transactionType: TransactionType = this.TransactionTypeEnum.Expense

  private readonly destroy$ = new Subject();
  tagList$!: Observable<TagInfo[]>

  tagList: TagInfo[] = [];
  keepTagList: TagInfo[] = [];
  isDrop = false;

  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private ledgerService: LedgerService
  ) {
    this.transactionType = this.router?.getCurrentNavigation()?.extras.state?.['transactionType'] || this.TransactionTypeEnum.Expense
    this.onChangeTransactionType(this.transactionType)
  }

  ngOnInit(): void {
  }

  onChangeTransactionType(type: TransactionType) {
    this.loaderService.start()
    this.destroy$.next(true);
    this.transactionType = type
    this.tagList$ = this.ledgerService.getTagList(this.transactionType).pipe(untilDestroyed(this))
    this.tagList$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.loaderService.stop()
      this.tagList = data
    })
  }


  goToEditTag(id: string) {
    this.router.navigate(['/setting/addTag'], {
      state: {
        docId: id,
        transactionType: this.transactionType,
        tagStatus: AddTagStatusEnum.Edit
      }
    })
  }

  onClickAddTag() {
    this.router.navigate(['/setting/addTag'], {
      state: {
        transactionType: this.transactionType,
        tagStatus: AddTagStatusEnum.Add
      }
    })
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
    await this.ledgerService.updateTagsSort(this.tagList).then(() => {
      this.isDrop = false
      this.keepTagList = []
    }).catch(error => {
      this.doDropList()
      console.error('Error in batch update:', error);
    }).finally(() => {
      this.loaderService.stop()
    })
  }
}
