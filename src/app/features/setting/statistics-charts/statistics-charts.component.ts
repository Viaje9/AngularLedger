import { Component, ViewChild, type OnInit, ElementRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularMaterialDatepickerModule } from '@src/app/shared/angular-material-datepicker.module';
import { SharedModule } from '@src/app/shared/shared.module';
import dayjs from 'dayjs';
import { DateTabsEnum, DateTabsType } from './statistics-charts.component.enum';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { AddLedgerItem, LedgerItem } from '@src/app/core/models/ledger-item.model';
import { LoaderService } from '@src/app/core/services/loader.service';
import { RangeGroupItem } from './statistics-charts.component.model';
import { PieChartComponent } from '@src/app/shared/components/pie-chart/pie-chart.component';

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

  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  previousDate!: Date;

  dateTab: DateTabsType = DateTabsEnum.Range_TAB

  groupList: RangeGroupItem[] = []

  get DateTabsEnum() {
    return DateTabsEnum
  }

  constructor(
    private router: Router,
    private ledgerService: LedgerService,
    private loaderService: LoaderService,
  ) {
    const perviousDate = this.router?.getCurrentNavigation()?.extras.state?.['date'] as Date
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

  ngAfterViewInit(): void {

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
  }

  onSwipeRight() {
    this.previousDate = dayjs(this.previousDate).subtract(1, 'month').toDate()
    this.setRange()
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
      this.ledgerService.getRangeItems(startDate, endDate).subscribe((list) => {
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
        }, [] as RangeGroupItem[])
        this.groupList = groupList
      })
    }
  }

}
