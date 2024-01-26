import { Component, EventEmitter, Inject, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SafeHtml } from '@angular/platform-browser';
import { ModalData } from './modal.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit {
  @Output() doConfirm = new EventEmitter();
  @Output() doCancel = new EventEmitter();


  title = '通知'
  content: string | SafeHtml = '';
  okText = '確認'
  cancelText = '取消'
  showCrossBtn = true;
  outsideClose = false;
  showCancelBtn = true
  templateRef?: TemplateRef<any>;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: ModalData,
  ) {
    if (this.data) {
      const { title, content, okText, cancelText, showCrossBtn, outsideClose, showCancelBtn, contentTemplateRef } =
        data;
      this.title = title;
      this.content = content;
      this.okText = okText;
      this.cancelText = cancelText;
      this.showCrossBtn = showCrossBtn;
      this.outsideClose = outsideClose;
      this.showCancelBtn = showCancelBtn
      this.templateRef = contentTemplateRef
    }
  }

  ngOnInit(): void { }

  clickOutsideClose(): void {
    if (this.outsideClose) {
      this.cancel();
    }
  }

  cancel(): void {
    this.doCancel.emit();
  }

  ok(): void {
    this.doConfirm.emit();
  }
}
