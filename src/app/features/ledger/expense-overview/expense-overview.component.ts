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
import { PreferencesService } from '@src/app/core/services/preferences.service';


@UntilDestroy()
@Component({
    selector: 'app-expense-overview',
    imports: [
        SharedModule,
        AngularMaterialDatepickerModule,
    ],
    templateUrl: './expense-overview.component.html',
    styleUrl: './expense-overview.component.css'
})
export class ExpenseOverviewComponent implements OnInit {

  currentDate = new Date()

  ledgerItems: LedgerItem[] = []
  private listRequestId = 0
  private budgetRequestId = 0

  showBudget = false
  budgetAmount = 0
  selectedDate = 0
  currentRangeBudget = 0
  startDate = ''
  endDate = ''

  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private ledgerService: LedgerService,
    private modalService: ModalService,
    private activatedRoute: ActivatedRoute,
    private preferences: PreferencesService,
  ) {
    const dateString = this.activatedRoute.snapshot.queryParams['date']

    if (isValidDate(dateString)) {
      this.currentDate = dayjs(dateString, 'YYYY-MM-DD').toDate()
    }

    this.currentDate.setHours(0, 0, 0, 0);
  }

  async ngOnInit() {
    this.getExpenseList()
    try {
      const budget = await this.preferences.getBudget()
      this.showBudget = budget?.showBudget ?? false
      this.budgetAmount = (budget?.amountMinor ?? 0) / 100
      this.selectedDate = budget?.cycleDay ?? 0
      this.countBudget()
    } catch {
      this.showBudget = false
    }
  }

  countBudget() {
    const selectedDate = this.selectedDate
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
        const requestId = ++this.budgetRequestId
        this.ledgerService.getBudgetAmount(startDateOfDay.toDate(), endDateOfDay.toDate())
          .then(amount => {
            if (requestId === this.budgetRequestId) this.currentRangeBudget = this.budgetAmount - amount
          })
          .catch(() => this.modalService.openConfirm({
            content: '載入預算統計失敗', showCancelBtn: false,
          }))
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
    const requestId = ++this.listRequestId
    this.loaderService.start()
    this.ledgerService.getTodayExpenseList(this.currentDate)
      .then(expenseList => {
        if (requestId === this.listRequestId) this.ledgerItems = expenseList
      })
      .catch(() => this.modalService.openConfirm({
        content: '載入支出失敗', showCancelBtn: false,
      }))
      .finally(() => this.loaderService.stop())
  }

  totalAmount() {
    return this.ledgerItems.reduce((acc, item) => acc + parseFloat(item.price), 0)
  }

  goToEditExpense(item: LedgerItem) {
    this.router.navigate(['/editExpense'], {
      queryParams: { id: item.id },
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
    if (this.showBudget) {
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
