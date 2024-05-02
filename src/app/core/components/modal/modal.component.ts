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
  showCrossBtn = true;
  outsideClose = false;
  showCancelBtn = true
  btnCenter = true
  templateRef?: TemplateRef<any>;
  fullScreen = false;
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
      this.title = title;
      this.content = content;
      this.okText = okText;
      this.cancelText = cancelText;
      this.showCrossBtn = showCrossBtn;
      this.outsideClose = outsideClose;
      this.showCancelBtn = showCancelBtn
      this.btnCenter = btnCenter
      this.templateRef = contentTemplateRef
      this.fullScreen = fullScreen
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
