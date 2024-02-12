import { CommonModule } from '@angular/common';
import { Component, ViewChild, type OnInit, TemplateRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ModalService } from '@src/app/core/services/modal.service';
import { SharedModule } from '@src/app/shared/shared.module';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.css',
})
export class BudgetComponent implements OnInit {
  @ViewChild('templateRef') templateRef!: TemplateRef<any> | undefined;

  dateNumList = Array.from({ length: 31 }).map((_, i) => i + 1)

  selectedDate = parseInt(localStorage.getItem('selectedDate') || '0')

  showBudget = localStorage.getItem('showBudget') === '1'
  showBudgetDisabled = false

  budgetAmount = parseInt(localStorage.getItem('budgetAmount') || '0')

  constructor(
    private modalService: ModalService,
  ) { }

  ngOnInit(): void {
    this.showBudgetDisabled = !this.selectedDate
  }

  onChangeBudgetAmount() {
    localStorage.setItem('budgetAmount', `${this.budgetAmount}`)
  }

  onChangeShowBudget() {
    localStorage.setItem('showBudget', this.showBudget ? "1" : "0")

  }

  onClickDate(num: number) {
    if (num === this.selectedDate) {
      this.selectedDate = 0
      localStorage.setItem('selectedDate', '')
      this.showBudgetDisabled = true
    } else {
      this.selectedDate = num
      localStorage.setItem('selectedDate', `${num}`)
      this.showBudgetDisabled = false
    }
  }

  onSelectDate() {
    this.modalService.openConfirm({
      title: "選擇日期",
      okText: '確認',
      showCancelBtn: false,
      outsideClose: true,
      contentTemplateRef: this.templateRef
    });
  }

}
