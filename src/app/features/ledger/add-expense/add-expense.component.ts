import { Component, type OnInit, type OnDestroy, ElementRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TagInfo } from '@src/app/core/models/tag.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LoaderService } from '@src/app/core/services/loader.service';
import { ModalService } from '@src/app/core/services/modal.service';
import { SharedModule } from '@src/app/shared/shared.module';
import dayjs from 'dayjs';
import { isValidDate } from '@src/app/utils/validator';
import { AddExpenseDraftService } from './add-expense-draft.service';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';

@Component({
    selector: 'app-add-expense',
    imports: [
        SharedModule,
    ],
    templateUrl: './add-expense.component.html',
    styleUrl: './add-expense.component.css'
})
export class AddExpenseComponent implements OnInit, OnDestroy {
  priceInput = viewChild.required<ElementRef>('priceInput');

  maxTagGroupPage = 0
  currentTagGroupPage = 0
  translateFactor = 'translate(0, 0)'
  price!: number;

  tagsGroup: TagInfo[][] = [];
  loadingTags = true;
  tagLoadError = false;

  selectedTagId = '';
  description = '';
  date!: Date;
  private openingRemark = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: ModalService,
    private loaderService: LoaderService,
    private ledgerService: LedgerService,
    private draft: AddExpenseDraftService,
  ) {
    const dateString = this.route.snapshot.queryParamMap.get('date') || ''


    if (isValidDate(dateString)) {
      this.date = dayjs(dateString, 'YYYY-MM-DD').toDate()
    } else {
      this.router.navigate(['/'])
    }
  }
  ngOnInit(): void {
    void this.loadTags();
    const { price, description } = this.route.snapshot.queryParams;
    const priceNum = parseFloat(price)
    if (priceNum > 0) {
      this.price = priceNum
    }

    if (description) {
      this.description = description
    }

    const saved = this.draft.get(dayjs(this.date).format('YYYY-MM-DD'));
    if (saved) {
      this.price = saved.price!;
      this.selectedTagId = saved.selectedTagId;
      this.description = saved.description;
      this.currentTagGroupPage = saved.tagGroupPage;
      this.translateFactor = `translate(-${saved.tagGroupPage * 100}%, 0)`;
    }

  }
  ngOnDestroy(): void {
    if (!this.openingRemark) this.draft.clear();
  }
  async loadTags(): Promise<void> {
    this.loadingTags = true;
    this.tagLoadError = false;
    try {
      const tags = await this.ledgerService.getTagList(TransactionTypeEnum.Expense);
      this.tagsGroup = (tags as TagInfo[]).reduce((groups: TagInfo[][], tag, index) => {
        const page = Math.floor(index / 9);
        (groups[page] ??= []).push(tag);
        return groups;
      }, []);
      this.maxTagGroupPage = this.tagsGroup.length;
      this.currentTagGroupPage = Math.min(this.currentTagGroupPage, Math.max(0, this.maxTagGroupPage - 1));
      this.translateFactor = `translate(-${this.currentTagGroupPage * 100}%, 0)`;
    } catch {
      this.tagLoadError = true;
    } finally {
      this.loadingTags = false;
    }
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
    this.draft.clear();
    this.router.navigate(['/'], {
      queryParams: {
        date: dayjs(this.date).format('YYYY-MM-DD')
      }
    });
  }

  async onClickSave() {
    if (!this.saveCheck()) {
      return
    }

    this.loaderService.start()
    try {
      await this.ledgerService.addExpense({
      date: this.date,
      price: this.price.toString(),
      tagId: this.selectedTagId,
      description: this.description
      })
      this.onClickBack()
    } catch {
      this.showError()
    } finally {
      this.loaderService.stop()
    }
  }

  saveCheck() {
    const checkTag = this.tagsGroup.some(tags => tags.some(tagInfo => tagInfo.id === this.selectedTagId))

    if (!this.selectedTagId || !Number.isFinite(this.price) || this.price <= 0 || !checkTag) {
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
    const date = dayjs(this.date).format('YYYY-MM-DD');
    this.draft.save({
      date,
      price: this.price,
      selectedTagId: this.selectedTagId,
      description: this.description,
      tagGroupPage: this.currentTagGroupPage,
    });
    this.openingRemark = true;
    void this.router.navigate(['/addExpense/remark'], { queryParams: { date } });
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
