import { Component, type OnInit, ViewChild, ElementRef, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TagInfo } from '@src/app/core/models/tag.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LoaderService } from '@src/app/core/services/loader.service';
import { ModalService } from '@src/app/core/services/modal.service';
import { SharedModule } from '@src/app/shared/shared.module';
import { Timestamp } from '@angular/fire/firestore';
import dayjs from 'dayjs';
import { isValidDate } from '@src/app/utils/validator';

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
    const dateString = this.route.snapshot.queryParamMap.get('date') || ''

    if (isValidDate(dateString)) {
      this.date = Timestamp.fromDate(dayjs(dateString, 'YYYY-MM-DD').toDate())
    } else {
      this.router.navigate(['/'])
    }
  }
  ngOnInit(): void {
    const { price, description } = this.route.snapshot.queryParams;
    const priceNum = parseInt(price)
    if(priceNum > 0) {
      this.price = priceNum
    }

    if(description) {
      this.description = description
    }
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
      this.showError()
    }).then(() => {
      this.onClickBack()
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

  showError() {
    this.modalService.openConfirm({
      content: '操作失敗',
      okText: '確認',
      showCancelBtn: false,
      outsideClose: true,
    });
  }
}
