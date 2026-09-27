import { Injectable } from '@angular/core';
import {
  createSavedDescription, deleteBudget, deleteSavedDescription, getBudget,
  listSavedDescriptions, putBudget, saveDescriptionsFromEntries,
} from '../../api/generated/sdk.gen';
import type { Budget, SavedDescription } from '../../api/generated/types.gen';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  async getBudget(): Promise<Budget | null> {
    const { data } = await getBudget({ throwOnError: true });
    return data.budget;
  }

  async saveBudget(value: Budget): Promise<Budget> {
    const { data } = await putBudget({ body: value, throwOnError: true });
    return data.budget!;
  }

  async clearBudget() {
    await deleteBudget({ throwOnError: true });
  }

  async descriptions(): Promise<SavedDescription[]> {
    const { data } = await listSavedDescriptions({ throwOnError: true });
    return data.items;
  }

  async addDescription(description: string) {
    const { data } = await createSavedDescription({ body: { description }, throwOnError: true });
    return data;
  }

  async removeDescription(id: string) {
    await deleteSavedDescription({ path: { id }, throwOnError: true });
  }

  async saveExpenseDescriptions() {
    const { data } = await saveDescriptionsFromEntries({ throwOnError: true });
    return data;
  }
}
