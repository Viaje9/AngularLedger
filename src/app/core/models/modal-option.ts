import { TemplateRef } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { ModalData } from '../components/modal/modal.model';


export interface ModalOption extends ModalData {
  /**
   * @description 確認按鈕 callback
   * **/
  onOk?: () => void;
  /**
   * @description 取消按鈕 callback，僅 ConfirmModel
   * **/
  onCancel?: () => void;
}
