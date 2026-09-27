import { Component, output, type AfterViewInit, viewChild, ElementRef, inject, ChangeDetectorRef, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PreferencesService } from '@src/app/core/services/preferences.service';
import { SharedModule } from '../../shared.module';

interface DescInfo {
  id: string;
  name: string;
}

@Component({
    selector: 'app-remark-bottom-sheet',
    imports: [
        SharedModule,
    ],
    templateUrl: './remark-bottom-sheet.component.html',
    styleUrl: './remark-bottom-sheet.component.css'
})
export class RemarkBottomSheetComponent implements AfterViewInit {

  onSubmit = output<string>();

  descriptionRef = viewChild.required<ElementRef>('descriptionRef');
  description: string = inject(MAT_BOTTOM_SHEET_DATA).description;
  cdr = inject(ChangeDetectorRef);
  preferences = inject(PreferencesService);
  snackBar = inject(MatSnackBar);
  submitting = false;

  descriptionValue = signal('');
  descriptionOptions = signal<DescInfo[]>([])

  filterOptions: DescInfo[] = [];
  preventInputBlur = false;

  ngOnInit(): void {
    this.descriptionValue.set(this.description)
    this.processOptions(this.descriptionValue());
    this.preferences.descriptions().then(items => {
      this.descriptionOptions.set(items.map(item => ({ id: item.id, name: item.description })));
      this.processOptions(this.descriptionValue());
    }).catch(() => this.snackBar.open('載入常用備註失敗', '', { duration: 3000 }));
  }

  private processOptions(desc = '') {
    this.filterOptions = this.descriptionOptions()
      .filter((info) => {
        return info.name.includes(desc);
      })
  }


  ngAfterViewInit() {
    this.descriptionRef().nativeElement.focus();
    setTimeout(() => {
      window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth", });
    }, 0)
  }

  onFocus() {
    this.processOptions(this.descriptionValue());
  }

  onChangeInput(event: CompositionEvent | Event) {
    if (event instanceof CompositionEvent) {
      this.processOptions(event.data);
    }

    if (event instanceof Event) {
      this.processOptions((event.target as HTMLInputElement).value);
    }
  }

  onClickOption(value: string) {
    this.descriptionValue.set(value)
    this.processOptions(this.descriptionValue());
    this.preventInputBlur = true;
    this.descriptionRef().nativeElement.focus();
  }

  onClickRemoveOption(value: string) {
    const descInfo = this.descriptionOptions().find(info => info.id === value)
    const newOptions = this.descriptionOptions().filter((info) => info.id !== descInfo?.id)
    this.preferences.removeDescription(value).then(() => {
      this.descriptionOptions.set(newOptions);
      this.processOptions(this.descriptionValue());
    }).catch(() => this.snackBar.open('刪除常用備註失敗', '', { duration: 3000 }));
    this.preventInputBlur = true;
    this.processOptions(this.descriptionValue());
    this.descriptionRef().nativeElement.focus();
  }

  async onClickSubmit() {
    if (this.submitting) return;
    this.submitting = true;
    const hasDescription = this.descriptionOptions().some(info => info.name.trim() === this.descriptionValue().trim())
    if (!hasDescription && this.descriptionValue().trim()) {
      try {
        const saved = await this.preferences.addDescription(this.descriptionValue().trim());
        this.descriptionOptions.update(items => [{ id: saved.id, name: saved.description }, ...items]);
      } catch {
        this.snackBar.open('常用備註未儲存，這筆記帳仍可使用備註', '', { duration: 3000 });
      }
    }

    this.onSubmit.emit(this.descriptionValue());
  }

  onBlur() {
    setTimeout(() => {
      if (!this.preventInputBlur) {
        this.onClickSubmit();
      } else {
        this.preventInputBlur = false;
      }
    })
  }
}
