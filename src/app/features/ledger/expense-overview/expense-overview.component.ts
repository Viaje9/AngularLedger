import { Component, type OnInit } from '@angular/core';
import { SharedModule } from '@src/app/shared/shared.module';
import { TransactionType } from '@src/app/core/models/transaction-type.model';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';
import { ActivatedRoute, Router } from '@angular/router';
import { EditExpenseInitData, StatusEnum } from '../add-expense/add-expense.model';
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

  get TransactionTypeEnum() {
    return TransactionTypeEnum
  }

  transactionType: TransactionType = this.TransactionTypeEnum.Expense

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
    this.getExpenseList()
  }

  ngOnInit() {
    this.countBudget()
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

  onClickAdd() {
    this.router.navigate(['/addExpense'], {
      state: {
        expenseStatus: StatusEnum.Add,
        date: this.currentDate
      }
    })
  }

  getExpenseList() {
    this.loaderService.start()
    this.ledgerService.getTodayExpenseList(this.currentDate).pipe(take(1), untilDestroyed(this))
      .subscribe((expenseList) => {
        this.ledgerItems = expenseList
        this.loaderService.stop()
      })
  }

  getIncomeList() {
    this.loaderService.start()
    this.ledgerService.getTodayIncomeList(this.currentDate).pipe(take(1), untilDestroyed(this))
      .subscribe((incomeList) => {
        this.ledgerItems = incomeList
        this.loaderService.stop()
      })
  }

  totalAmount() {
    return this.ledgerItems.reduce((acc, item) => acc + parseInt(item.price), 0)
  }

  goToEditTag(item: LedgerItem) {
    const stateData: EditExpenseInitData = {
      expenseStatus: StatusEnum.Edit,
      docId: item.id,
      date: item.date,
      price: item.price,
      tagId: item.tagId,
      description: item.description

    }
    this.router.navigate(['/addExpense'], {
      state: stateData
    })
  }

  goToIncome() {
    this.router.navigate(['/setting/statisticsCharts'], {
      queryParams: {
        date: dayjs(this.currentDate).format('YYYY-MM-DD')
      }
    })
  }

  onClickStatistics() {
    if (localStorage.getItem('showBudget') === '1') {
      this.router.navigate(['/setting/statisticsCharts'], {
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


