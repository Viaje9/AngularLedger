import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { ChangeDetectorRef, Component, Injectable, type OnInit } from '@angular/core';
import { SharedModule } from '@src/app/shared/shared.module';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input'; // Import the missing MatInputModule
import { TransactionType } from '@src/app/core/models/transaction-type.model';
import { TransactionTypeEnum } from '@src/app/core/enums/transaction-type.enum';
import { Router } from '@angular/router';
import { StatusEnum } from '../add-expense/add-expense.model';
import { LoaderService } from '@src/app/core/services/loader.service';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { LedgerItem } from '@src/app/core/models/ledger-item.model';


const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'YYYY/MM/DD',
  },
  display: {
    dateInput: 'YYYY/MM/DD',
    monthYearLabel: 'YYYY MM',
    dateA11yLabel: 'YYYY/MM/DD',
    monthYearA11yLabel: 'YYYY MM',
  },
};

@Injectable()
class CustomDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'YYYY/MM/DD') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${year}/${month}/${day}`;
    } else if (displayFormat === 'YYYY MM') {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${month}月 ${date.getFullYear()}`;
    } else {
      return date.toDateString();
    }
  }
}

@Component({
  selector: 'app-ledger-overview',
  standalone: true,
  imports: [
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule
  ],
  providers: [
    provideNativeDateAdapter(),
    {
      provide: DateAdapter, useClass: CustomDateAdapter
    },
    {
      provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS
    },
    { provide: MAT_DATE_LOCALE, useValue: 'zh-TW' }
  ],
  templateUrl: './ledger-overview.component.html',
  styleUrl: './ledger-overview.component.css',
})
export class LedgerOverviewComponent implements OnInit {

  get TransactionTypeEnum() {
    return TransactionTypeEnum
  }

  transactionType: TransactionType = this.TransactionTypeEnum.Expense

  currentDate = new Date()

  ledgerItems: LedgerItem[] = []

  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private ledgerService: LedgerService
  ) {
    if (this.transactionType === this.TransactionTypeEnum.Expense) {
      this.getExpenseList()
    }
  }

  ngOnInit() {
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
    if (this.transactionType === this.TransactionTypeEnum.Expense) {
      this.getExpenseList()
    }
  }

  formateDate(date: Date) {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  onClickAdd() {
    if (this.transactionType === this.TransactionTypeEnum.Expense) {
      this.router.navigate(['/addExpense'], {
        state: {
          expenseStatus: StatusEnum.Add,
          date: this.formateDate(this.currentDate)
        }
      })
    }
  }

  getExpenseList() {
    this.loaderService.start()
    this.ledgerService.getTodayExpenseList(this.formateDate(this.currentDate))
      .subscribe((e) => {
        console.log(e);
        this.ledgerItems = e
        this.loaderService.stop()
      })
  }
}


