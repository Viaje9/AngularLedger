import { Component, type OnInit } from '@angular/core';
import { SharedModule } from '@src/app/shared/shared.module';
import { TransactionType } from '@src/app/core/models/transaction-type.model';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';
import { ActivatedRoute, Router } from '@angular/router';
import { EditIncomeInitData, StatusEnum } from '../add-income/add-income.model';
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
  selector: 'app-income-overview',
  standalone: true,
  imports: [
    SharedModule,
    AngularMaterialDatepickerModule,
  ],
  templateUrl: './income-overview.component.html',
  styleUrl: './income-overview.component.css',
})
export class IncomeOverviewComponent implements OnInit {

  get TransactionTypeEnum() {
    return TransactionTypeEnum
  }

  transactionType: TransactionType = this.TransactionTypeEnum.Income

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
    this.getIncomeList()
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
    this.getIncomeList()
  }

  formateDate(date: Date) {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  onClickAdd() {
    this.router.navigate(['/addIncome'], {
      state: {
        incomeStatus: StatusEnum.Add,
        date: this.currentDate
      }
    })
  }

  getIncomeList() {
    this.loaderService.start()
    this.ledgerService.getTodayIncomeList(this.currentDate).then((incomeList) => {
      this.ledgerItems = incomeList
    }).finally(() => {
      this.loaderService.stop()
    })
  }

  totalAmount() {
    return this.ledgerItems.reduce((acc, item) => acc + parseInt(item.price), 0)
  }

  goToEditTag(item: LedgerItem) {
    const stateData: EditIncomeInitData = {
      incomeStatus: StatusEnum.Edit,
      docId: item.id,
      date: item.date,
      price: item.price,
      tagId: item.tagId,
      description: item.description

    }
    this.router.navigate(['/addIncome'], {
      state: stateData
    })
  }

  goToExpense() {
    this.router.navigate(['/expenseOverview'], {
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
