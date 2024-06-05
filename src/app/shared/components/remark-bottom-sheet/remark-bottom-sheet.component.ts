import { Component, output, type AfterViewInit, viewChild, ElementRef, inject, ChangeDetectorRef, signal, WritableSignal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { SharedModule } from '../../shared.module';

interface DescInfo {
  id: number;
  name: string;
}

@Component({
  selector: 'app-remark-bottom-sheet',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './remark-bottom-sheet.component.html',
  styleUrl: './remark-bottom-sheet.component.css',
})
export class RemarkBottomSheetComponent implements AfterViewInit {

  onSubmit = output<string>();

  descriptionRef = viewChild.required<ElementRef>('descriptionRef');
  description: string = inject(MAT_BOTTOM_SHEET_DATA).description;
  cdr = inject(ChangeDetectorRef);

  descriptionValue = signal('');
  descriptionOptions = signal<DescInfo[]>(JSON.parse(localStorage.getItem('keepDescItems') || '[]'))

  filterOptions: DescInfo[] = [];
  preventInputBlur = false;

  ngOnInit(): void {
    this.descriptionValue.set(this.description)
    this.processOptions(this.descriptionValue());
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

  onClickRemoveOption(value: number) {
    const descInfo = this.descriptionOptions().find(info => info.id === value)
    const newOptions = this.descriptionOptions().filter((info) => info.id !== descInfo?.id)
    localStorage.setItem('keepDescItems', JSON.stringify(newOptions))
    this.descriptionOptions.set(newOptions)
    this.preventInputBlur = true;
    this.processOptions(this.descriptionValue());
    this.descriptionRef().nativeElement.focus();
  }

  onClickSubmit() {
    const hasDescription = this.descriptionOptions().some(info => info.name.trim() === this.descriptionValue().trim())
    if (!hasDescription && this.descriptionValue().trim()) {
      const newOptions: DescInfo[] = [{
        id: Date.now(),
        name: this.descriptionValue().trim()
      }, ...this.descriptionOptions()]
      localStorage.setItem('keepDescItems', JSON.stringify(newOptions))
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
