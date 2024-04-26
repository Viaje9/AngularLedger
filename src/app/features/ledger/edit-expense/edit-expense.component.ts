import { Component, type OnInit, ViewChild, ElementRef, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TagInfo } from '@src/app/core/models/tag.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LoaderService } from '@src/app/core/services/loader.service';
import { ModalService } from '@src/app/core/services/modal.service';
import { SharedModule } from '@src/app/shared/shared.module';
import { EditExpenseInitData } from './edit-expense.model';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';
import { Timestamp, query } from '@angular/fire/firestore';
import dayjs from 'dayjs';

@Component({
  selector: 'app-edit-expense',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './edit-expense.component.html',
  styleUrl: './edit-expense.component.css',

})
export class EditExpenseComponent implements OnInit {
  @ViewChild('scrollTags') scrollTagsRef!: ElementRef;
  @ViewChild('tagGroup') tagGroupRef!: ElementRef;
  @ViewChild('templateRef') templateRef!: TemplateRef<any> | undefined;
  @ViewChild('priceInput') priceInput!: ElementRef;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef;

  maxTagGroupPage = 0
  currentTagGroupPage = 0
  translateFactor = 'translate(0, 0)'
  price!: number;

  tagsGroup: TagInfo[][] = [];

  selectedTagId = '';
  description = '';
  date!: Timestamp;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: ModalService,
    private loaderService: LoaderService,
    private ledgerService: LedgerService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.tagsGroup = this.route.snapshot.data['tagListGroup'];
    const expenseData = this.route.snapshot.data['data'] as EditExpenseInitData
    this.price = parseInt(expenseData.price)
    this.selectedTagId = expenseData.tagId
    this.description = expenseData.description
    this.date = expenseData.date
  }
  ngOnInit(): void {

  }
  ngAfterViewInit(): void {
    const scrollWidth = this.scrollTagsRef.nativeElement.scrollWidth;
    const tagGroupWidth = this.tagGroupRef.nativeElement.scrollWidth;
    this.maxTagGroupPage = Math.ceil(scrollWidth / tagGroupWidth)

  }

  onSwipeRight(): void {
    if (this.currentTagGroupPage > 0) {
      this.currentTagGroupPage -= 1
      const translate = this.currentTagGroupPage * 100
      this.translateFactor = `translate(-${translate}%, 0)`
    }
  }

  onSwipeLeft(): void {
    if (this.currentTagGroupPage < this.maxTagGroupPage - 1) {
      this.currentTagGroupPage += 1
      const translate = this.currentTagGroupPage * 100
      this.translateFactor = `translate(-${translate}%, 0)`
    }
  }

  onTagClick(tagId: string) {
    if (this.selectedTagId === tagId) {
      this.selectedTagId = ''
    } else {
      this.priceInput.nativeElement.focus()
      this.selectedTagId = tagId

    }
  }

  onClickBack() {
    this.router.navigate(['/'], {
      queryParams: {
        date: dayjs(this.date.toDate()).format('YYYY-MM-DD')
      }
    });
  }

  async onClickEdit() {
    if (!this.saveCheck()) {
      return
    }

    this.loaderService.start()
    await this.ledgerService.updateExpense({
      docId: this.route.snapshot.data['data'].docId,
      date: this.date,
      price: this.price.toString(),
      tagId: this.selectedTagId,
      description: this.description
    }).catch((error) => {
      this.showError()
    }).then(() => {
      this.onClickBack()
    }).finally(() => this.loaderService.stop())
  }

  saveCheck() {
    const checkTag = this.tagsGroup.some(tags => tags.some(tagInfo => tagInfo.id === this.selectedTagId))

    if (!this.selectedTagId || !this.price || !checkTag) {
      this.modalService.openConfirm({
        content: '請輸入金額與選擇標籤',
        okText: '確認',
        showCancelBtn: false,
        outsideClose: true,
      });
      return false
    }
    return true
  }

  onClickDescription() {
    this.modalService.openConfirm({
      title: "備註",
      okText: '確認',
      showCancelBtn: false,
      outsideClose: true,
      contentTemplateRef: this.templateRef,
      afterViewInit: () => {
        this.changeDetectorRef.detectChanges()
        this.descriptionInput?.nativeElement.focus()
      }
    })
  }

  onClickDelete() {
    this.modalService.openConfirm({
      content: '確認刪除？',
      outsideClose: true,
      onOk: () => {
        this.doDelete()
      },
    });
  }

  doDelete() {
    this.loaderService.start()
    this.ledgerService.deleteExpense(this.route.snapshot.data['data'].docId)
      .catch((error) => {
        this.showError()
      })
      .then(() => {
        this.onClickBack()
      })
      .finally(() => this.loaderService.stop())
  }

  showError() {
    this.modalService.openConfirm({
      content: '操作失敗',
      okText: '確認',
      showCancelBtn: false,
      outsideClose: true,
    });
  }
}
