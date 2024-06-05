import { Component, type OnInit, ElementRef, TemplateRef, ChangeDetectorRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TagInfo } from '@src/app/core/models/tag.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LoaderService } from '@src/app/core/services/loader.service';
import { ModalService } from '@src/app/core/services/modal.service';
import { SharedModule } from '@src/app/shared/shared.module';
import { Timestamp } from '@angular/fire/firestore';
import dayjs from 'dayjs';
import { isValidDate } from '@src/app/utils/validator';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { RemarkBottomSheetComponent } from '@src/app/shared/components/remark-bottom-sheet/remark-bottom-sheet.component';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [
    SharedModule,
    MatBottomSheetModule,
  ],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.css',

})
export class AddExpenseComponent implements OnInit {
  scrollTagsRef = viewChild.required<ElementRef>('scrollTags');
  tagGroupRef = viewChild.required<ElementRef>('tagGroup');
  priceInput = viewChild.required<ElementRef>('priceInput');

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
    private changeDetectorRef: ChangeDetectorRef,
    private bottomSheet: MatBottomSheet
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
    if (priceNum > 0) {
      this.price = priceNum
    }

    if (description) {
      this.description = description
    }

  }
  ngAfterViewInit(): void {
    const scrollWidth = this.scrollTagsRef().nativeElement.scrollWidth;
    const tagGroupWidth = this.tagGroupRef().nativeElement.scrollWidth;
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
      if (!this.price?.toString()) {
        this.priceInput().nativeElement.focus()
      }
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

  saveCheck() {
    const checkTag = this.tagsGroup.some(tags => tags.some(tagInfo => tagInfo.id === this.selectedTagId))

    if (!this.selectedTagId || !this.price?.toString() || !checkTag) {
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
    const bottomSheetRef = this.bottomSheet.open(RemarkBottomSheetComponent, {
      data: {
        description: this.description
      },
      panelClass: ['max-h-96', 'relative']
    });

    bottomSheetRef.instance.onSubmit.subscribe((description: string) => {
      this.description = description
      bottomSheetRef.dismiss()
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
