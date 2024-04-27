import { Component, type OnInit } from '@angular/core';
import { SharedModule } from '@src/app/shared/shared.module';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from '@src/app/core/services/loader.service';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LedgerItem } from '@src/app/core/models/ledger-item.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import dayjs from 'dayjs';
import { take } from 'rxjs';
import { AngularMaterialDatepickerModule } from '@src/app/shared/angular-material-datepicker.module';
import { ModalService } from '@src/app/core/services/modal.service';
import { isValidDate } from '@src/app/utils/validator';


@UntilDestroy()
@Component({
  selector: 'app-expense-overview',
  standalone: true,
  imports: [
    SharedModule,
    AngularMaterialDatepickerModule,
  ],
  templateUrl: './expense-overview.component.html',
  styleUrl: './expense-overview.component.css',
})
export class ExpenseOverviewComponent implements OnInit {

  currentDate = new Date()

  ledgerItems: LedgerItem[] = []

  showBudget = localStorage.getItem('showBudget') === '1'
  budgetAmount = parseInt(localStorage.getItem('budgetAmount') || '0')
  currentRangeBudget = 0
  startDate = ''
  endDate = ''

  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private ledgerService: LedgerService,
    private modalService: ModalService,
    private activatedRoute: ActivatedRoute
  ) {
    const dateString = this.activatedRoute.snapshot.queryParams['date']

    if (isValidDate(dateString)) {
      this.currentDate = dayjs(dateString, 'YYYY-MM-DD').toDate()
    }

    this.currentDate.setHours(0, 0, 0, 0);
  }

  ngOnInit() {
    this.countBudget()
    this.getExpenseList()
  }

  countBudget() {
    const selectedDate = parseInt(localStorage.getItem('selectedDate') || '0')
    if (selectedDate) {
      const inputDate = dayjs(this.currentDate);
      let startDateOfDay, endDateOfDay
      if (inputDate.date() >= selectedDate) {
        startDateOfDay = inputDate.date(selectedDate)
        endDateOfDay = inputDate.add(1, 'month').date(selectedDate).subtract(1, 'day')
      } else {
        startDateOfDay = inputDate.subtract(1, 'month').date(selectedDate)
        endDateOfDay = inputDate.date(selectedDate).subtract(1, 'day')
      }

      const startDate = startDateOfDay.format('YYYY/MM/DD')
      const endDate = endDateOfDay.format('YYYY/MM/DD')

      if (startDate !== this.startDate && endDate !== this.endDate) {
        this.startDate = startDate
        this.endDate = endDate
        this.ledgerService.getBudgetAmount(startDateOfDay.toDate(), endDateOfDay.toDate()).pipe(untilDestroyed(this))
          .subscribe((amount) => {
            this.currentRangeBudget = this.budgetAmount - amount
          })
      }
    }
  }

  calculateDiffRangeDay() {
    const startDateOfDayJs = dayjs(this.currentDate)
    const endDateOfDayJs = dayjs(this.endDate, 'YYYY/MM/DD')
    return endDateOfDayJs.diff(startDateOfDayJs, 'day') + 1;
  }

  calculateRangeDayBudget() {
    const startDateOfDayJs = dayjs(this.currentDate)
    const endDateOfDayJs = dayjs(this.endDate, 'YYYY/MM/DD')
    const diff = endDateOfDayJs.diff(startDateOfDayJs, 'day') + 1;
    return parseInt((this.currentRangeBudget / diff).toFixed()) - this.totalAmount()
  }

  calculateTodayBudget() {
    const startDateOfDayJs = dayjs(this.startDate, 'YYYY/MM/DD')
    const endDateOfDayJs = dayjs(this.endDate, 'YYYY/MM/DD')
    const diff = endDateOfDayJs.diff(startDateOfDayJs, 'day') + 1;
    return parseInt((this.budgetAmount / diff).toFixed()) - this.totalAmount()
  }

  onSwipeLeft() {
    const copyData = structuredClone(this.currentDate)
    copyData.setDate(this.currentDate.getDate() + 1)
    this.currentDate = copyData
    this.onDateChange()

  }
  onSwipeRight() {
    const copyData = structuredClone(this.currentDate)
    copyData.setDate(this.currentDate.getDate() - 1)
    this.currentDate = copyData
    this.onDateChange()
  }

  onDateChange() {
    this.getExpenseList()
    this.countBudget()
  }

  formateDate(date: Date) {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  getExpenseList() {
    this.loaderService.start()
    this.ledgerService.getTodayExpenseList(this.currentDate).pipe(take(1), untilDestroyed(this))
      .subscribe((expenseList) => {
        this.ledgerItems = expenseList
        this.loaderService.stop()
      })
  }

  totalAmount() {
    return this.ledgerItems.reduce((acc, item) => acc + parseInt(item.price), 0)
  }

  goToEditExpense(item: LedgerItem) {
    this.router.navigate(['/editExpense'], {
      state: {
        docId: item.id,
      }
    })
  }

  goToAdd() {
    this.router.navigate(['/addExpense'], {
      queryParams: {
        date: dayjs(this.currentDate).format('YYYY-MM-DD'),
      }
    })
  }

  goToIncome() {
    this.router.navigate(['/incomeOverview'], {
      queryParams: {
        date: dayjs(this.currentDate).format('YYYY-MM-DD')
      }
    })
  }

  onClickStatistics() {
    if (localStorage.getItem('showBudget') === '1') {
      this.router.navigate(['/search/statisticsCharts'], {
        state: {
          date: this.currentDate
        }
      })
    } else {
      this.modalService.openConfirm({
        title: "通知",
        content: "請先設定預算週期，再查看統計圖表",
        okText: '確認',
        outsideClose: false,
        onOk: () => {
          this.router.navigate(['/setting/budget'], {
            state: {
              date: this.currentDate
            }
          })
        }
      });
    }

  }
}


