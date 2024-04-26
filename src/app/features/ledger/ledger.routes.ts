import { Routes } from '@angular/router';
import { LedgerComponent } from './ledger.component';
import { AddExpenseComponent } from './add-expense/add-expense.component';
import { AddExpenseTagListGroupResolver } from '@src/app/features/ledger/add-expense/add-expense-tag-list-group.resolver';
import { AddExpenseInitDataResolver } from './add-expense/add-expense-init-data.resolver';
import { AddIncomeComponent } from './add-income/add-income.component';
import { AddIncomeTagListGroupResolver } from './add-income/add-income-tag-list-group.resolver';
import { AddIncomeInitDataResolver } from './add-income/add-income-init-data.resolver';
import { ExpenseOverviewComponent } from './expense-overview/expense-overview.component';
import { IncomeOverviewComponent } from './income-overview/income-overview.component';
import { EditExpenseComponent } from './edit-expense/edit-expense.component';
import { EditExpenseTagListGroupResolver } from './edit-expense/edit-expense-tag-list-group.resolver';
import { EditExpenseInitDataResolver } from './edit-expense/edit-expense-init-data.resolver';

export const LEDGER_ROUTES: Routes = [
  {
    path: '',
    component: LedgerComponent,
    children: [
      {
        path: '', pathMatch: 'full', redirectTo: 'expenseOverview'
      },
      {
        path: 'expenseOverview',
        component: ExpenseOverviewComponent,
      },
      {
        path: 'editExpense',
        component: EditExpenseComponent,
        resolve: {
          tagListGroup: EditExpenseTagListGroupResolver,
          data: EditExpenseInitDataResolver
        }
      },
      {
        path: 'incomeOverview',
        component: IncomeOverviewComponent,
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


