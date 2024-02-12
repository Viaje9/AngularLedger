import { Routes } from '@angular/router';
import { SettingComponent } from './setting.component';
import { TagsManageComponent } from './tags-manage/tags-manage.component';
import { AddTagComponent } from './add-tag/add-tag.component';
import { AddTagInitDataResolver } from './add-tag/add-tag-init-data.resolver';
import { BudgetComponent } from './budget/budget.component';

export const SETTING_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: SettingComponent,
      },
      {
        path: 'tagsManage',
        component: TagsManageComponent,
      },
      {
        path: 'addTag',
        component: AddTagComponent,
        resolve: {
          data: AddTagInitDataResolver
        }
      },
      {
        path: 'budget',
        component: BudgetComponent,
      },
    ],
  },
];


