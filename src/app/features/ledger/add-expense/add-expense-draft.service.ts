import { Injectable } from '@angular/core';
import { AuthService } from '@src/app/core/services/auth.service';

export interface AddExpenseDraft {
  date: string;
  price: number | undefined;
  selectedTagId: string;
  description: string;
  tagGroupPage: number;
}

@Injectable({ providedIn: 'root' })
export class AddExpenseDraftService {
  private draft: AddExpenseDraft | null = null;

  constructor(private auth: AuthService) {}

  private key(): string {
    return `angular-ledger:add-expense-draft:v1:${this.auth.accountId ?? 'anonymous'}`;
  }

  save(value: AddExpenseDraft): void {
    this.draft = { ...value };
    try { sessionStorage.setItem(this.key(), JSON.stringify(this.draft)); } catch { /* Optional storage. */ }
  }

  get(date: string): AddExpenseDraft | null {
    if (!this.draft) {
      try {
        const raw = sessionStorage.getItem(this.key());
        const value: unknown = raw && JSON.parse(raw);
        if (value && typeof value === 'object' &&
            'date' in value && typeof value.date === 'string' &&
            'selectedTagId' in value && typeof value.selectedTagId === 'string' &&
            'description' in value && typeof value.description === 'string' &&
            'tagGroupPage' in value && typeof value.tagGroupPage === 'number' &&
            (!('price' in value) || typeof value.price === 'number')) {
          this.draft = value as AddExpenseDraft;
        }
      } catch { /* Ignore unavailable or malformed storage. */ }
    }
    return this.draft?.date === date ? { ...this.draft } : null;
  }

  setDescription(description: string): void {
    if (!this.draft) return;
    this.save({ ...this.draft, description });
  }

  clear(): void {
    this.draft = null;
    try { sessionStorage.removeItem(this.key()); } catch { /* Optional storage. */ }
  }
}
