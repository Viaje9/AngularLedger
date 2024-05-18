import { CommonModule } from '@angular/common';
import { Component, output, type AfterViewInit, viewChild, ElementRef, inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-remark-bottom-sheet',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './remark-bottom-sheet.component.html',
  styleUrl: './remark-bottom-sheet.component.css',
})
export class RemarkBottomSheetComponent implements AfterViewInit {

  onSubmit = output<string>();

  descriptionRef = viewChild.required<ElementRef>('descriptionRef');
  description: string = inject(MAT_BOTTOM_SHEET_DATA).description;

  ngAfterViewInit() {
    this.descriptionRef().nativeElement.focus();
    setTimeout(() => {
      window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth", });
    }, 0)
  }

}
