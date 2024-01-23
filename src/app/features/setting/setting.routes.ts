import { Routes } from '@angular/router';
import { SettingComponent } from './setting.component';
import { TagsManageComponent } from './tags-manage/tags-manage.component';

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
    ],
  },
];


