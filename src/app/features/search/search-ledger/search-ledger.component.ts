import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LedgerItem } from '@src/app/core/models/ledger-item.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LoaderService } from '@src/app/core/services/loader.service';
import { AngularMaterialDatepickerModule } from '@src/app/shared/angular-material-datepicker.module';
import { SharedModule } from '@src/app/shared/shared.module';
import { take } from 'rxjs';
import dayjs from 'dayjs';
import { TagInfo } from '@src/app/core/models/tag.model';

@UntilDestroy()
@Component({
  selector: 'app-search-ledger',
  standalone: true,
  imports: [
    SharedModule,
    AngularMaterialDatepickerModule,
  ],
  templateUrl: './search-ledger.component.html',
  styleUrl: './search-ledger.component.scss',
})
export class SearchLedgerComponent implements OnInit {

  rangeList: LedgerItem[] = []
  rawRangeList: LedgerItem[] = []

  tagList: TagInfo[] = []

  range = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [Validators.required]),
  });

  selectedTagId = ''

  searchText = ''

  get dayjs() {
    return dayjs
  }

  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private ledgerService: LedgerService,
  ) {

  }

  ngOnInit(): void { }


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
      this.loaderService.start()
      this.ledgerService.getRangeItems(startDate, endDate).pipe(take(1), untilDestroyed(this)).subscribe((list) => {
        this.loaderService.stop()
        this.rawRangeList = list
        this.rangeList = list
        this.tagList = list.map((item) => item.tagInfo).filter((tag, index, self) => self.findIndex((t) => t.id === tag.id) === index)
      })
    }
  }

  onTagChange() {
    if (this.selectedTagId) {
      this.rangeList = this.rawRangeList.filter((item) => item.tagId === this.selectedTagId)
    } else {
      this.rangeList = this.rawRangeList
    }
  }

  onSearchChange(rawSearchText: string) {
    const searchText = rawSearchText.trim() || ''
    if (searchText) {
      this.rangeList = this.rawRangeList
        .filter((item) => item.tagId === this.selectedTagId || !this.selectedTagId)
        .filter((item) => item.description.includes(searchText))
    } else {
      this.rangeList = this.rawRangeList
        .filter((item) => item.tagId === this.selectedTagId || !this.selectedTagId)
    }
  }

  clearSearch() {
    this.searchText = ''
    this.onSearchChange('')
  }
}
