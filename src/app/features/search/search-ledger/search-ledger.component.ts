import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LedgerItem } from '@src/app/core/models/ledger-item.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LoaderService } from '@src/app/core/services/loader.service';
import { AngularMaterialDatepickerModule } from '@src/app/shared/angular-material-datepicker.module';
import { SharedModule } from '@src/app/shared/shared.module';
import { take } from 'rxjs';
import dayjs from 'dayjs';
import { TagInfo } from '@src/app/core/models/tag.model';
import { isValidDate } from '@src/app/utils/validator';
import { MatSnackBar } from '@angular/material/snack-bar';

@UntilDestroy()
@Component({
    selector: 'app-search-ledger',
    imports: [
        SharedModule,
        AngularMaterialDatepickerModule,
    ],
    templateUrl: './search-ledger.component.html',
    styleUrl: './search-ledger.component.scss'
})
export class SearchLedgerComponent implements OnInit {

  rangeList: LedgerItem[] = []
  rawRangeList: LedgerItem[] = []
  private rangeRequestId = 0

  tagList: TagInfo[] = []

  range = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [Validators.required]),
  });

  selectedTagId = ''
  selectedSortOption = 'dateDesc'

  searchText = ''

  timeRanges = [
    { value: '1m', label: '一個月' },
    { value: '3m', label: '三個月' },
    { value: '1y', label: '一年' },
    { value: '3y', label: '三年' },
    { value: '5y', label: '五年' }
  ];
  selectedTimeRange = '1m';

  get dayjs() {
    return dayjs
  }

  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private ledgerService: LedgerService,
    private activatedRoute: ActivatedRoute,
    private _snackBar: MatSnackBar
  ) {

    const startDateString = this.activatedRoute.snapshot.queryParams['startDate']
    const endDateString = this.activatedRoute.snapshot.queryParams['endDate']

    if (isValidDate(startDateString)) {
      this.range.controls.start.setValue(dayjs(startDateString, 'YYYY-MM-DD').toDate())
    }

    if (isValidDate(endDateString)) {
      this.range.controls.end.setValue(dayjs(endDateString, 'YYYY-MM-DD').toDate())
    }

  }

  onTimeRangeChange() {
    const endDate = new Date();
    let startDate = new Date();

    switch (this.selectedTimeRange) {
      case '1m':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '3y':
        startDate.setFullYear(startDate.getFullYear() - 3);
        break;
      case '5y':
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
    }

    this.range.setValue({
      start: startDate,
      end: endDate
    });

    this.onDateChange();
  }

  ngOnInit(): void {
    this.getRangeItems()
  }


  onClickBack() {
    this.router.navigateByUrl('/');
  }

  onDateChange() {
    if (this.range.valid) {
      this.getRangeItems()
    }
  }

  getRangeItems() {
    const startDate = this.range.getRawValue().start
    const endDate = this.range.getRawValue().end
    if (startDate && endDate) {
      const requestId = ++this.rangeRequestId
      this.loaderService.start()
      this.ledgerService.getRangeItems(startDate, endDate).then((list) => {
        if (requestId !== this.rangeRequestId) return
        this.rawRangeList = list
        this.rangeList = list
        this.tagList = list.map((item) => item.tagInfo).filter((tag, index, self) => self.findIndex((t) => t.id === tag.id) === index)
        this.applySortAndFilter()
      }).catch(() => {
        if (requestId === this.rangeRequestId) this._snackBar.open('載入記帳資料失敗', '', { duration: 3000 })
      })
        .finally(() => this.loaderService.stop())
    }
  }

  onTagChange() {
    this.applySortAndFilter()
  }

  onSearchChange(rawSearchText: string) {
    this.searchText = rawSearchText.trim()
    this.applySortAndFilter()
  }

  clearSearch() {
    this.searchText = ''
    this.applySortAndFilter()
  }

  onSortChange() {
    this.applySortAndFilter()
  }

  applySortAndFilter() {
    let filteredList = this.rawRangeList

    // 應用標籤過濾
    if (this.selectedTagId) {
      filteredList = filteredList.filter((item) => item.tagId === this.selectedTagId)
    }

    // 應用搜索過濾
    if (this.searchText) {
      filteredList = filteredList.filter((item) => item.description.includes(this.searchText))
    }

    // 應用排序
    switch (this.selectedSortOption) {
      case 'dateDesc':
        filteredList.sort((a, b) => b.date.getTime() - a.date.getTime())
        break
      case 'dateAsc':
        filteredList.sort((a, b) => a.date.getTime() - b.date.getTime())
        break
      case 'priceDesc':
        filteredList.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        break
      case 'priceAsc':
        filteredList.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        break
    }

    this.rangeList = filteredList
  }

  goToExpenseDate(date: Date) {
    this.router.navigate(['/expenseOverview'], {
      queryParams: {
        date: dayjs(date).format('YYYY-MM-DD')
      }
    });
  }

  copyDesc(desc: string) {
    navigator.clipboard.writeText(desc).catch()
    this._snackBar.open('已複製所選文字！', '', {
      panelClass: 'text-center',
      duration: 1 * 1000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
