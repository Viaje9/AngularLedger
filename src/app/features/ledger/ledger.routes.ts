import { Routes } from '@angular/router';
import { LedgerOverviewComponent } from './ledger-overview/ledger-overview.component';
import { LedgerComponent } from './ledger.component';
import { AddExpenseComponent } from './add-expense/add-expense.component';
import { BudgetComponent } from './budget/budget.component';
import { TagListGroupResolver } from '@src/app/features/ledger/add-expense/tag-list-group.resolver';

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
        path: 'addExpense',
        component: AddExpenseComponent,
        resolve:{
          tagListGroup: TagListGroupResolver
        }
      },
      {
        path: 'budget',
        component: BudgetComponent,
      },
    ],
  },
];


