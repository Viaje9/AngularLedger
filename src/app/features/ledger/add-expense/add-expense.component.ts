import { Component, type OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TagInfo } from '@src/app/core/models/tag.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LoaderService } from '@src/app/core/services/loader.service';
import { ModalService } from '@src/app/core/services/modal.service';
import { SharedModule } from '@src/app/shared/shared.module';
import { EditExpenseInitData, StatusEnum, StatusType } from './add-expense.model';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.css',

})
export class AddExpenseComponent implements OnInit {
  @ViewChild('scrollTags') scrollTagsRef!: ElementRef;
  @ViewChild('tagGroup') tagGroupRef!: ElementRef;
  @ViewChild('templateRef') templateRef!: TemplateRef<any> | undefined;
  @ViewChild('priceInput') priceInput!: ElementRef;

  get StatusEnum() {
    return StatusEnum
  }

  maxTagGroupPage = 0
  currentTagGroupPage = 0
  translateFactor = 'translate(0, 0)'
  price!: number;

  tagsGroup: TagInfo[][] = [];

  selectedTagId = '';
  description = '';
  date!: Timestamp;
  expenseStatus!: StatusType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: ModalService,
    private loaderService: LoaderService,
    private ledgerService: LedgerService
  ) {
    this.tagsGroup = this.route.snapshot.data['tagListGroup'];
    this.expenseStatus = this.route.snapshot.data['data'].expenseStatus;
    if (this.expenseStatus === StatusEnum.Edit) {
      const expenseData = this.route.snapshot.data['data'] as EditExpenseInitData
      this.price = parseInt(expenseData.price)
      this.selectedTagId = expenseData.tagId
      this.description = expenseData.description
      this.date = expenseData.date
    } else if (this.expenseStatus === StatusEnum.Add) {
      this.date = this.route.snapshot.data['data'].date
    }
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
    this.router.navigateByUrl('/', {
      state: {
        transactionType: TransactionTypeEnum.Expense,
        date: this.date.toDate()
      }
    });
  }

  async onClickSave() {

    if (!this.saveCheck()) {
      return
    }

    this.loaderService.start()
    await this.ledgerService.addExpense({
      date: this.date,
      price: this.price.toString(),
      tagId: this.selectedTagId,
      description: this.description
    }).catch((error) => {
      console.error("Error adding document: ", error);
    }).then(() => {
      this.router.navigateByUrl('/', {
        state: {
          transactionType: TransactionTypeEnum.Expense,
          date: this.date.toDate()
        }
      });
    }).finally(() => this.loaderService.stop())
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
      console.error("Error updating document: ", error);
    }).then(() => {
      this.router.navigateByUrl('/', {
        state: {
          transactionType: TransactionTypeEnum.Expense,
          date: this.date.toDate()
        }
      });
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
      contentTemplateRef: this.templateRef
    });
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
    this.ledgerService.deleteExpense(this.route.snapshot.data['data'].docId).then(() => {
      this.router.navigateByUrl('/', {
        state: {
          transactionType: TransactionTypeEnum.Expense,
          date: this.date.toDate()
        }
      });
    }).finally(() => this.loaderService.stop())
  }
}
