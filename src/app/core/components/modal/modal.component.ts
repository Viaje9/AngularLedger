import { Component, EventEmitter, Inject, Input, OnInit, Output, output, TemplateRef, ViewChild } from '@angular/core';
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
  doConfirm = output<void>();
  doCancel = output<void>();

  title = '通知'
  content: string | SafeHtml = '';
  okText = '確認'
  cancelText = '取消'
  outsideClose = false;
  showCrossBtn = true;
  showCancelBtn = true
  btnCenter = true
  fullScreen = false;
  contentTemplateRef?: TemplateRef<any>;
  afterViewInitEvent!: () => void

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: ModalData,
  ) {
    if (this.data) {
      const {
        title,
        content,
        okText,
        cancelText,
        showCrossBtn,
        outsideClose,
        showCancelBtn,
        contentTemplateRef,
        btnCenter,
        fullScreen,
        afterViewInit
      } = data;
      this.title = title || this.title;
      this.content = content || this.content;
      this.okText = okText || this.okText;
      this.cancelText = cancelText || this.cancelText;
      this.showCrossBtn = showCrossBtn || this.showCrossBtn;
      this.outsideClose = outsideClose || this.outsideClose;
      this.showCancelBtn = showCancelBtn || this.showCancelBtn;
      this.btnCenter = btnCenter || this.btnCenter;
      this.contentTemplateRef = contentTemplateRef
      this.fullScreen = fullScreen || this.fullScreen;
      this.afterViewInitEvent = afterViewInit || (() => { })
    }
  }

  ngOnInit(): void { }


  ngAfterViewInit(): void {
    this.afterViewInitEvent()
  }

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
