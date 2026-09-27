import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ModalService } from '@src/app/core/services/modal.service';
import { PreferencesService } from '@src/app/core/services/preferences.service';
import { SharedModule } from '@src/app/shared/shared.module';

@Component({
  selector: 'app-budget',
  imports: [SharedModule],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.css'
})
export class BudgetComponent implements OnInit {
  @ViewChild('templateRef') templateRef!: TemplateRef<unknown>;
  dateNumList = Array.from({ length: 31 }, (_, i) => i + 1);
  selectedDate = 0;
  showBudget = false;
  showBudgetDisabled = true;
  budgetAmount = 0;
  private saveQueue: Promise<unknown> = Promise.resolve();

  constructor(
    private modalService: ModalService,
    private preferences: PreferencesService,
  ) {}

  async ngOnInit() {
    try {
      const budget = await this.preferences.getBudget();
      this.selectedDate = budget?.cycleDay ?? 0;
      this.budgetAmount = (budget?.amountMinor ?? 0) / 100;
      this.showBudget = budget?.showBudget ?? false;
      this.showBudgetDisabled = !this.selectedDate || !this.budgetAmount;
    } catch {
      this.showError();
    }
  }

  async save() {
    try {
      const amountMinor = this.budgetAmount * 100;
      if (!Number.isFinite(this.budgetAmount) || this.budgetAmount < 0 ||
          !Number.isSafeInteger(Math.round(amountMinor)) ||
          Math.abs(amountMinor - Math.round(amountMinor)) > 0.000001) {
        throw new Error('invalid amount');
      }
      const value = {
        amountMinor: Math.round(amountMinor),
        currencyCode: 'TWD',
        currencyScale: 2,
        cycleDay: this.selectedDate || null,
        showBudget: this.showBudget && Boolean(this.selectedDate && this.budgetAmount),
      } as const;
      this.saveQueue = this.saveQueue.catch(() => {}).then(() => this.preferences.saveBudget(value));
      await this.saveQueue;
    } catch {
      this.showError();
    }
  }

  onChangeBudgetAmount() {
    if (!this.budgetAmount) this.showBudget = false;
    this.showBudgetDisabled = !this.selectedDate || !this.budgetAmount;
    void this.save();
  }

  onChangeShowBudget() { void this.save(); }

  onClickDate(num: number) {
    this.selectedDate = num === this.selectedDate ? 0 : num;
    this.showBudgetDisabled = !this.selectedDate || !this.budgetAmount;
  }

  onSelectDate() {
    this.modalService.openConfirm({
      title: '選擇日期',
      okText: '確認',
      showCancelBtn: false,
      outsideClose: false,
      contentTemplateRef: this.templateRef,
      onOk: () => {
        this.showBudget = Boolean(this.selectedDate && this.budgetAmount);
        void this.save();
      },
    });
  }

  private showError() {
    this.modalService.openConfirm({ content: '儲存預算失敗', showCancelBtn: false });
  }
}
