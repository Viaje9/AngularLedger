import { Injectable } from '@angular/core';
import { CollectionReference, DocumentData, Firestore, collection, collectionData, doc, docData, getDocs, limit, orderBy, query, where, addDoc, getDoc, updateDoc, deleteDoc, writeBatch, Timestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, catchError, map, mergeMap, take, tap } from 'rxjs';
import { TagInfo } from '../models/tag.model';
import { TransactionType } from '../models/transaction-type.model';
import { AddLedgerItem, LedgerItem } from '../models/ledger-item.model';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {

  tagsCollection!: CollectionReference<DocumentData, DocumentData>
  expenseListCollection!: CollectionReference<DocumentData, DocumentData>
  incomeListCollection!: CollectionReference<DocumentData, DocumentData>
  constructor(
    private firestore: Firestore,
    private auth: AuthService
  ) {
    this.tagsCollection = collection(this.firestore, this.tagsPath);
    this.expenseListCollection = collection(this.firestore, this.expenseListPath);
    this.incomeListCollection = collection(this.firestore, this.incomeListPath);
  }


  get tagsPath() {
    return `users/${this.auth.userUid}/tags`
  }

  get expenseListPath() {
    return `users/${this.auth.userUid}/expenseList`
  }

  get incomeListPath() {
    return `users/${this.auth.userUid}/incomeList`
  }

  /** tags start */

  getTagList(type: TransactionType) {
    // 使用Snapshot快照
    // const userId = this.auth.userUid;
    // const tagsCollection = collection(this.firestore, `users/${userId}/tags`);
    // const q = query(tagsCollection, where('userId', '==', userId));
    // const querySnapshot = await getDocs(q);
    // return querySnapshot.docs.map(doc => doc.data());
    // where('transactionType', '==', type)
    // 使用collectionData
    return collectionData(query(this.tagsCollection, where('transactionType', '==', type), orderBy('sort', 'asc')), { idField: 'id' }) as Observable<TagInfo[]>;
  }

  getTagInfo(docId: string) {
    const docRef = doc(this.firestore, this.tagsPath, docId)
    return getDoc(docRef)
  }

  getTagLastSort(type: TransactionType) {
    return collectionData(query(this.tagsCollection, where('transactionType', '==', type), orderBy('sort', 'desc'), limit(1)))
      .pipe(map(e => {
        if (e.length) {
          return e[0]['sort'] + 1
        }
        return 0
      })).pipe(take(1))
  }

  addTagDoc(data: {
    tagIconName: string,
    tagName: string,
    sort: number,
    transactionType: TransactionType
  }) {
    return addDoc(this.tagsCollection, data)
  }

  updateTagDoc(docId: string, tagIconName: string, tagName: string) {
    const docRef = doc(this.firestore, this.tagsPath, docId)
    return updateDoc(docRef, {
      tagName,
      tagIconName,
    })
  }

  removeTagDoc(docId: string) {
    const docRef = doc(this.firestore, this.tagsPath, docId)
    return deleteDoc(docRef)
  }

  updateTagsSort(newTags: TagInfo[]) {
    const batch = writeBatch(this.firestore)
    newTags.forEach((tag) => {
      const docRef = doc(this.firestore, this.tagsPath, tag.id);
      batch.update(docRef, { sort: tag.sort });
    })
    return batch.commit()
  }

  update(newTags: TagInfo[]) {
    const batch = writeBatch(this.firestore)
    newTags.forEach((tag) => {
      const docRef = doc(this.firestore, this.tagsPath, tag.id);
      batch.update(docRef, {
        sort: tag.sort,
        tagName: tag.tagName,
        tagIconName: tag.tagIconName,
        transactionType: tag.transactionType
      });
    })
    return batch.commit()
  }

  /** tags end */

  /** expense start */

  getExpenseInfo(docId: string) {
    const docRef = doc(this.firestore, this.expenseListPath, docId)
    return getDoc(docRef)
  }

  addExpense(data: AddLedgerItem) {
    return addDoc(this.expenseListCollection, data)
  }

  updateExpense(data: AddLedgerItem & { docId: string }) {
    const docRef = doc(this.firestore, this.expenseListPath, data.docId)
    return updateDoc(docRef, {
      date: data.date,
      price: data.price,
      tagId: data.tagId,
      description: data.description
    })
  }

  deleteExpense(docId: string) {
    const docRef = doc(this.firestore, this.expenseListPath, docId)
    return deleteDoc(docRef)
  }

  getTodayExpenseList(date: Date) {
    return collectionData(query(this.expenseListCollection, ...this.queryDate(date, 'date')), { idField: 'id' }).pipe(mergeMap(async (expenseList) => {
      const list = [];
      for (const expenseItem of expenseList) {
        const item = expenseItem as AddLedgerItem;

        const tagInfo = await this.getTagInfo(item.tagId);
        expenseItem['tagInfo'] = tagInfo?.data() || {};
        list.push(expenseItem);
      }
      return list;
    })) as Observable<any[]>;
  }

  /** expense end */

  /** income start */

  getTodayIncomeList(date: Date) {
    return collectionData(query(this.incomeListCollection, ...this.queryDate(date, 'date')), { idField: 'id' }).pipe(mergeMap(async (incomeList) => {
      const list = [];
      for (const incomeItem of incomeList) {
        const item = incomeItem as AddLedgerItem;
        const tagInfo = await this.getTagInfo(item.tagId);
        incomeItem['tagInfo'] = tagInfo?.data() || {};
        list.push(incomeItem);
      }
      return list;
    })
    ) as Observable<any[]>;
  }

  getIncomeInfo(docId: string) {
    const docRef = doc(this.firestore, this.incomeListPath, docId)
    return getDoc(docRef)
  }

  addIncome(data: AddLedgerItem) {
    return addDoc(this.incomeListCollection, data)
  }

  updateIncome(data: AddLedgerItem & { docId: string }) {
    const docRef = doc(this.firestore, this.incomeListPath, data.docId)
    return updateDoc(docRef, {
      date: data.date,
      price: data.price,
      tagId: data.tagId,
      description: data.description
    })
  }

  deleteIncome(docId: string) {
    const docRef = doc(this.firestore, this.incomeListPath, docId)
    return deleteDoc(docRef)
  }

  /** income end */

  getBudgetAmount(startDate: Date, endDate: Date) {
    const startOfDate = structuredClone(startDate)
    startOfDate.setHours(0, 0, 0, 0);

    const startOfTimestamp = Timestamp.fromDate(startOfDate);

    const endOfDay = structuredClone(endDate)
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

    return collectionData(query(this.expenseListCollection, where('date', '>=', startOfTimestamp), where('date', '<=', endOfDayTimestamp)), { idField: 'id' }).pipe(
      map((expenseList) => {
        return expenseList.reduce((acc, item) => acc + parseInt(item['price']), 0)
      })
    )
  }

  getRangeItems(startDate: Date, endDate: Date) {
    const startOfDate = structuredClone(startDate)
    startOfDate.setHours(0, 0, 0, 0);

    const startOfTimestamp = Timestamp.fromDate(startOfDate);

    const endOfDay = structuredClone(endDate)
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

    return collectionData(query(this.expenseListCollection, where('date', '>=', startOfTimestamp), where('date', '<=', endOfDayTimestamp)), { idField: 'id' }).pipe(
      mergeMap(async (expenseList) => {
        const list = [];
        for (const expenseItem of expenseList) {
          const item = expenseItem as AddLedgerItem;
          const tagInfo = await this.getTagInfo(item.tagId);
          expenseItem['tagInfo'] = tagInfo?.data() || {};
          list.push(expenseItem);
        }
        return list
      })
    ) as Observable<LedgerItem[]>;
  }

  queryDate(date: Date, fieldName: string) {
    // 定義您想要搜索的日期
    const specificDate = structuredClone(date)
    specificDate.setHours(0, 0, 0, 0); // 將時間設定為該日的開始

    // 創建開始時間戳（該日的00:00:00）
    const startOfDay = Timestamp.fromDate(specificDate);

    // 計算結束時間戳（該日的23:59:59）
    const endOfDay = structuredClone(date)
    endOfDay.setHours(23, 59, 59, 999); // 將時間設定為該日的結束
    const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

    return [where(fieldName, '>=', startOfDay), where(fieldName, '<=', endOfDayTimestamp)]
  }
}
