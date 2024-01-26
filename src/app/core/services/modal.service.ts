import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ModalComponent } from '../components/modal/modal.component';
import { ModalOption } from '../models/modal-option';
import { ReplaySubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  modalQueue: number[] = []
  currentModal$ = new ReplaySubject<number>();
  executeStatus$ = new Subject();
  constructor(
    public dialog: MatDialog,
  ) {
    this.executeModal()
  }

  executeModal() {
    this.executeStatus$.subscribe(() => {
      if (this.modalQueue.length > 0) {
        this.currentModal$.next(this.modalQueue[0])
      }
    })
  }

  /**
   * @description 開啟confirmModal
   * @param title 標題，不帶入會根據 type 設定
   * @param content 內容
   * @param okText 確認按鈕文字 (預設文字：確認)
   * @param cancelText 取消按鈕文字 (預設文字：取消)
   * @param outsideClose 是否可點擊modal外部區塊關閉
   * @param showCrossBtn 是否顯示右上 X 按鈕
   * @param onOk 確認按鈕 callback
   * @param onCancel 取消按鈕 callback
   */
  openConfirm(data: ModalOption): Promise<MatDialogRef<ModalComponent> | null> {
    const executeId = Date.now()
    this.pushModalConfig(executeId)

    const config = ({
      title = '通知',
      content,
      okText = '確認',
      cancelText = '取消',
      outsideClose = false,
      showCrossBtn = true,
      showCancelBtn = true,
      btnCenter = true,
      contentTemplateRef,
    }: ModalOption) => ({
      data: {
        content,
        title,
        okText,
        cancelText,
        outsideClose,
        showCrossBtn,
        showCancelBtn,
        btnCenter,
        contentTemplateRef
      }
    })

    if (this.modalQueue.length === 1) {
      this.executeStatus$.next(true)
    }

    return new Promise((resolve) => {
      this.currentModal$.subscribe((id) => {
        if (id === executeId) {
          const commonDialogRef = this.dialog.open(ModalComponent, config(data));
          resolve(commonDialogRef)
          commonDialogRef.componentInstance.doConfirm.subscribe(() => {
            if (data.onOk) {
              data.onOk();
            }
            this.modalQueue.shift()
            commonDialogRef.close()
            this.executeStatus$.next(true)
          });

          commonDialogRef.componentInstance.doCancel.subscribe(() => {
            if (data.onCancel) {
              data.onCancel();
            }
            this.modalQueue.shift()
            commonDialogRef.close()
            this.executeStatus$.next(true)
          });
        }
      })
    })

  }


  pushModalConfig(executeId: number) {
    this.modalQueue.push(executeId)
  }

  cleanQueue() {
    const currentModal = this.modalQueue[0]
    this.modalQueue = [currentModal]
  }
}
