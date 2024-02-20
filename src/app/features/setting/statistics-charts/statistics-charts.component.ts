import { Component, ViewChild, type OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularMaterialDatepickerModule } from '@src/app/shared/angular-material-datepicker.module';
import { SharedModule } from '@src/app/shared/shared.module';
import dayjs from 'dayjs';
import { DateTabsEnum, DateTabsType } from './statistics-charts.component.enum';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LedgerItem } from '@src/app/core/models/ledger-item.model';
import { LoaderService } from '@src/app/core/services/loader.service';
import { RangeGroupItem } from './statistics-charts.component.model';
import { PieChartComponent } from '@src/app/shared/components/pie-chart/pie-chart.component';
import { PieChartItem } from '@src/app/core/models/pie-chart-item.model';
import { MatDateRangeInput } from '@angular/material/datepicker';
import { take } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-statistics-charts',
  standalone: true,
  imports: [
    SharedModule,
    AngularMaterialDatepickerModule,
    PieChartComponent
  ],
  templateUrl: './statistics-charts.component.html',
  styleUrl: './statistics-charts.component.css',
})
export class StatisticsChartsComponent implements OnInit {
  @ViewChild('rangeInput') rangeInput!: MatDateRangeInput<any>;

  range = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [Validators.required]),
  });

  previousDate!: Date;

  dateTab: DateTabsType = DateTabsEnum.Range_TAB

  groupList: RangeGroupItem[] = []

  pieChartItems: PieChartItem[] = []

  rangeList: Array<PieChartItem & { backgroundColor: string, percent: string }> = []

  totalPriceText = ''

  get DateTabsEnum() {
    return DateTabsEnum
  }

  constructor(
    private router: Router,
    private ledgerService: LedgerService,
    private loaderService: LoaderService,
  ) {
    const perviousDate = this.router?.getCurrentNavigation()?.extras.state?.['date'] as Date || new Date()
    if (perviousDate) {
      this.previousDate = perviousDate
      this.setRange()
      this.getRangeItems()
    } else {
      this.dateTab = DateTabsEnum.CUSTOM_TAB
    }

  }

  ngOnInit(): void {

  }

  onDateChange() {
    if (this.range.valid) {
      this.getRangeItems()
    }
  }

  setRange() {
    const selectedDate = parseInt(localStorage.getItem('selectedDate') || '0')
    const inputDate = dayjs(this.previousDate);
    let startDateOfDay, endDateOfDay
    if (inputDate.date() >= selectedDate) {
      startDateOfDay = inputDate.date(selectedDate)
      endDateOfDay = inputDate.add(1, 'month').date(selectedDate).subtract(1, 'day')
    } else {
      startDateOfDay = inputDate.subtract(1, 'month').date(selectedDate)
      endDateOfDay = inputDate.date(selectedDate).subtract(1, 'day')
    }

    this.range.setValue({
      start: startDateOfDay.toDate(),
      end: endDateOfDay.toDate()
    })
    // const startDate = startDateOfDay.format('YYYY/MM/DD')
    // const endDate = endDateOfDay.format('YYYY/MM/DD')
  }

  onSwipeLeft() {
    this.previousDate = dayjs(this.previousDate).add(1, 'month').toDate()
    this.setRange()
    this.onDateChange()
  }

  onSwipeRight() {
    this.previousDate = dayjs(this.previousDate).subtract(1, 'month').toDate()
    this.setRange()
    this.onDateChange()
  }

  onClickBack() {
    this.router.navigateByUrl('/');
  }

  onClickTab(dateTab: DateTabsType) {
    this.dateTab = dateTab
    if (dateTab === DateTabsEnum.Range_TAB) {
      this.setRange()
    }
  }

  getRangeItems() {
    const startDate = this.range.getRawValue().start
    const endDate = this.range.getRawValue().end
    if (startDate && endDate) {
      this.loaderService.start()
      this.ledgerService.getRangeItems(startDate, endDate).pipe(take(1), untilDestroyed(this)).subscribe((list) => {
        this.loaderService.stop()
        const groupList = list.reduce((acc, item: LedgerItem) => {
          const group = acc.find((groupInfo: RangeGroupItem) => groupInfo.tagId === item.tagId)
          if (!group) {
            const groupItem: RangeGroupItem = {
              tagId: item.tagId,
              price: parseInt(item.price),
              tagName: item.tagInfo.tagName
            }
            acc.push(groupItem)
          } else {
            const index = acc.findIndex((groupInfo: any) => groupInfo.tagId === item.tagId)
            acc[index].price += parseInt(item.price)
          }
          return acc
        }, [] as RangeGroupItem[]).sort((a, b) => b.price - a.price)

        this.groupList = groupList
        this.totalPriceText = `$ ${groupList.reduce((acc, item) => acc + item.price, 0)}`
        this.pieChartItems = groupList.map(e => {
          return {
            label: e.tagName,
            value: e.price
          }
        })
      })
    }
  }

  setLedgerList(list: Array<PieChartItem & { backgroundColor: string }>) {
    const total = list.reduce((acc, item) => acc + item.value, 0)
    this.rangeList = list.map(item => {
      return {
        ...item,
        percent: `${((item.value / total) * 100).toFixed(2)}%`
      }
    })
  }

}
