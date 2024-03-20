import { TemplateRef } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

export interface ModalOption {
  title?: string;
  content?: string | SafeHtml;
  /**
   * @description 確認按鈕 callback
   * **/
  onOk?: () => void;
  /**
   * @description 取消按鈕 callback，僅 ConfirmModel
   * **/
  onCancel?: () => void;
  /**
   * @description 確認按鈕文字，僅 PromptModal
   * **/
  buttonText?: string;
  /**
   * @description 確認按鈕文字，僅 ConfirmModel
   * **/
  okText?: string;
  /**
   * @description 取消按鈕文字，僅 ConfirmModel
   * **/
  cancelText?: string;
  /**
   * @description 是否可點擊modal外部區塊關閉
   * **/
  outsideClose?: boolean;
  /**
   * @description 是否顯示由上 X 按鈕
   * **/
  showCrossBtn?: boolean;
  /**
   * @description 是否顯示取消按鈕
   * **/
  showCancelBtn?: boolean;
  /**
   * @description 是否置中，預設為 true
   * **/
  btnCenter?: boolean;
  /**
   * @description 自定義content
   * **/
  contentTemplateRef?: TemplateRef<any>
  /**
   * @description 是否全螢幕
   * @default false
   * **/
  fullScreen?: boolean;
  /**
   * @description contentTemplateRef 初始化後的 callback
   * **/
  afterViewInit?: () => void;
}
