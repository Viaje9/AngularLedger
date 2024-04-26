import { Routes } from '@angular/router';
import { LedgerOverviewComponent } from './ledger-overview/ledger-overview.component';
import { LedgerComponent } from './ledger.component';
import { AddExpenseComponent } from './add-expense/add-expense.component';
import { AddExpenseTagListGroupResolver } from '@src/app/features/ledger/add-expense/add-expense-tag-list-group.resolver';
import { AddExpenseInitDataResolver } from './add-expense/add-expense-init-data.resolver';
import { AddIncomeComponent } from './add-income/add-income.component';
import { AddIncomeTagListGroupResolver } from './add-income/add-income-tag-list-group.resolver';
import { AddIncomeInitDataResolver } from './add-income/add-income-init-data.resolver';
import { ExpenseOverviewComponent } from './expense-overview/expense-overview.component';

export const LEDGER_ROUTES: Routes = [
  {
    path: '',
    component: LedgerComponent,
    children: [
      {
        path: '',
        component: LedgerOverviewComponent,
      },
      {
        path: 'expenseOverview',
        component: ExpenseOverviewComponent,
      },
      {
        path: 'addExpense',
        component: AddExpenseComponent,
        resolve: {
          tagListGroup: AddExpenseTagListGroupResolver,
          data: AddExpenseInitDataResolver
        }
      },
      {
        path: 'addIncome',
        component: AddIncomeComponent,
        resolve: {
          tagListGroup: AddIncomeTagListGroupResolver,
          data: AddIncomeInitDataResolver
        }
      }
    ],
  },
];


