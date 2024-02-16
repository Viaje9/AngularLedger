import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { Injectable, NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter, provideNativeDateAdapter } from '@angular/material/core';


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

const modules = [
  MatFormFieldModule,
  MatInputModule,
  MatDatepickerModule
];


@NgModule({
  imports: [
    ...modules
  ],
  exports: [
    ...modules
  ],
  providers: [
    provideNativeDateAdapter(),
    {
      provide: DateAdapter, useClass: CustomDateAdapter
    },
    {
      provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS
    },
  ],
})
export class AngularMaterialDatepickerModule { }
