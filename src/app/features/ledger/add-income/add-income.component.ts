import { Component, ElementRef, TemplateRef, ViewChild, type OnInit } from '@angular/core';
import { TagInfo } from '@src/app/core/models/tag.model';
import { SharedModule } from '@src/app/shared/shared.module';
import { StatusEnum, StatusType } from '../add-expense/add-expense.model';
import { ActivatedRoute, Router } from '@angular/router';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LoaderService } from '@src/app/core/services/loader.service';
import { ModalService } from '@src/app/core/services/modal.service';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';
import { EditIncomeInitData } from './add-income.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-add-income',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './add-income.component.html',
  styleUrl: './add-income.component.css',
})
export class AddIncomeComponent implements OnInit {
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
  date!: Timestamp
  incomeStatus!: StatusType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: ModalService,
    private loaderService: LoaderService,
    private ledgerService: LedgerService
  ) {
    this.tagsGroup = this.route.snapshot.data['tagListGroup'];
    this.incomeStatus = this.route.snapshot.data['data'].incomeStatus;
    if (this.incomeStatus === StatusEnum.Edit) {
      const incomeData = this.route.snapshot.data['data'] as EditIncomeInitData
      this.price = parseInt(incomeData.price)
      this.selectedTagId = incomeData.tagId
      this.description = incomeData.description
      this.date = incomeData.date
    } else if (this.incomeStatus === StatusEnum.Add) {
      this.date = this.route.snapshot.data['data'].date
    }
  }

  ngOnInit(): void { }


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
        transactionType: TransactionTypeEnum.Income,
        date: this.date.toDate()
      }
    });
  }

  async onClickSave() {

    if (!this.saveCheck()) {
      return
    }

    this.loaderService.start()
    await this.ledgerService.addIncome({
      date: this.date,
      price: this.price.toString(),
      tagId: this.selectedTagId,
      description: this.description
    }).catch((error) => {
      console.error("Error adding document: ", error);
    }).then(() => {
      this.router.navigateByUrl('/', {
        state: {
          transactionType: TransactionTypeEnum.Income,
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
    await this.ledgerService.updateIncome({
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
          transactionType: TransactionTypeEnum.Income,
          date: this.date.toDate()
        }
      });
    }).finally(() => this.loaderService.stop())
  }

  saveCheck() {
    if (!this.selectedTagId || !this.price) {
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
    this.ledgerService.deleteIncome(this.route.snapshot.data['data'].docId).then(() => {
      this.router.navigateByUrl('/', {
        state: {
          transactionType: TransactionTypeEnum.Income,
          date: this.date.toDate()
        }
      });
    }).finally(() => this.loaderService.stop())
  }

}
