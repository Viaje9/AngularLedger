import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, type OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { PreferencesService } from '@src/app/core/services/preferences.service';
import { SharedModule } from '@src/app/shared/shared.module';
import { isValidDate } from '@src/app/utils/validator';
import dayjs from 'dayjs';
import { AddExpenseDraftService } from './add-expense-draft.service';

interface DescriptionOption {
  id: string;
  description: string;
}

@Component({
  selector: 'app-add-expense-remark',
  imports: [SharedModule, ScrollingModule],
  templateUrl: './add-expense-remark.component.html',
  styleUrl: './add-expense-remark.component.css',
})
export class AddExpenseRemarkComponent implements OnInit {
  private date = '';

  description = '';
  options: DescriptionOption[] = [];
  filteredOptions: DescriptionOption[] = [];
  loading = true;
  loadFailed = false;
  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private draft: AddExpenseDraftService,
    private preferences: PreferencesService,
    private snackBar: MatSnackBar,
  ) {
    this.date = this.route.snapshot.queryParamMap.get('date') ?? '';
  }

  ngOnInit(): void {
    const saved = this.draft.get(this.date);
    if (!saved) {
      void this.router.navigate(['/addExpense'], {
        queryParams: { date: isValidDate(this.date) ? this.date : dayjs().format('YYYY-MM-DD') },
        replaceUrl: true,
      });
      return;
    }
    this.description = saved.description;

    const cached = this.preferences.cachedDescriptions();
    if (cached !== null) this.setOptions(cached);
    if (!this.preferences.shouldRefreshDescriptions()) {
      this.loading = false;
      return;
    }
    this.preferences.refreshDescriptions()
      .then(items => this.setOptions(items))
      .catch(() => {
        this.loadFailed = !cached?.length;
        if (this.loadFailed) this.snackBar.open('載入常用備註失敗', '', { duration: 3000 });
      })
      .finally(() => { this.loading = false; });
  }

  private setOptions(items: DescriptionOption[]): void {
    this.options = items.map(item => ({ id: item.id, description: item.description }));
    this.filterOptions();
  }

  filterOptions(): void {
    const query = this.description.trim().toLocaleLowerCase();
    this.filteredOptions = this.options.filter(item =>
      item.description.toLocaleLowerCase().includes(query));
  }

  selectOption(description: string): void {
    this.description = description;
    this.filterOptions();
  }

  trackOption(_index: number, item: DescriptionOption): string {
    return item.id;
  }

  async removeOption(id: string): Promise<void> {
    try {
      await this.preferences.removeDescription(id);
      this.options = this.options.filter(item => item.id !== id);
      this.filterOptions();
    } catch {
      this.snackBar.open('刪除常用備註失敗', '', { duration: 3000 });
    }
  }

  back(): void {
    void this.router.navigate(['/addExpense'], { queryParams: { date: this.date } });
  }

  async done(): Promise<void> {
    if (this.submitting) return;
    this.submitting = true;
    const value = this.description.trim();
    if (value && !this.options.some(item => item.description === value)) {
      try {
        await this.preferences.addDescription(value);
      } catch {
        this.snackBar.open('常用備註未儲存，這筆記帳仍可使用備註', '', { duration: 3000 });
      }
    }
    this.draft.setDescription(this.description);
    this.back();
  }
}
