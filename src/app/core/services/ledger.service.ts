import { Injectable } from '@angular/core';
import {
  CollectionReference,
  DocumentData,
  Firestore,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
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
    return getDocs(query(this.tagsCollection, where('transactionType', '==', type), orderBy('sort', 'asc')))
      .then((querySnapshot) => querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))) as Promise<TagInfo[]>;
  }

  getTagInfo(docId: string) {
    const docRef = doc(this.firestore, this.tagsPath, docId)
    return getDoc(docRef)
  }

  /**
   * 取得所有tag並過濾出指定的tagIdList
   */
  private async getTagListWithId(tagIdList: string[]) {
    if (!tagIdList.length) return []
    const userId = this.auth.userUid;
    const tagsCollection = collection(this.firestore, `users/${userId}/tags`);
    const q = query(tagsCollection);
    const querySnapshot = await getDocs(q);
    const tagList = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })).filter((tag) => tagIdList.includes(tag.id));
    return tagList
  }

  getTagLastSort(type: TransactionType) {
    return getDocs(query(this.tagsCollection, where('transactionType', '==', type), orderBy('sort', 'desc'), limit(1)))
      .then(querySnapshot => querySnapshot.docs.map(doc => doc.data()))
      .then(e => {
        if (e.length) {
          return e[0]['sort']
        }
        return 0

      })
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
    const q = query(this.expenseListCollection, ...this.queryDate(date, 'date'))
    return getDocs(q).then(async (querySnapshot) => {
      const expenseList = querySnapshot.docs.map(doc => ({ ...doc.data() as AddLedgerItem, id: doc.id }));
      const tagIdList = expenseList.map((e) => e['tagId']);
      const tagInfoList = await this.getTagListWithId(tagIdList)
      const list = expenseList.map((expenseItem) => {
        const tagInfo = tagInfoList.find((tag) => tag.id === expenseItem.tagId) as TagInfo;
        return {
          ...expenseItem,
          tagInfo
        }
      })
      return list;
    }) as Promise<LedgerItem[]>;
  }

  /** expense end */

  /** income start */

  getTodayIncomeList(date: Date) {
    return getDocs(query(this.incomeListCollection, ...this.queryDate(date, 'date')))
      .then(querySnapshot => querySnapshot.docs.map((doc) => ({ ...doc.data() as AddLedgerItem, id: doc.id })))
      .then(async (incomeList) => {
        const tagIdList = incomeList.map((e) => e['tagId'])
        const tagInfoList = await this.getTagListWithId(tagIdList)
        const list = incomeList.map((incomeItem) => {
          const tagInfo = tagInfoList.find((tag) => tag.id === incomeItem.tagId) as TagInfo;
          return {
            ...incomeItem,
            tagInfo
          }
        })
        return list;
      }) as Promise<LedgerItem[]>;
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

    const q = query(this.expenseListCollection, where('date', '>=', startOfTimestamp), where('date', '<=', endOfDayTimestamp))

    return getDocs(q).then((querySnapshot) => {
      return querySnapshot.docs.reduce((acc, item) => acc + parseInt(item.data()['price']), 0)
    })
  }

  getRangeItems(startDate: Date, endDate: Date) {
    const startOfDate = structuredClone(startDate)
    startOfDate.setHours(0, 0, 0, 0);

    const startOfTimestamp = Timestamp.fromDate(startOfDate);

    const endOfDay = structuredClone(endDate)
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayTimestamp = Timestamp.fromDate(endOfDay);
    const q = query(this.expenseListCollection, where('date', '>=', startOfTimestamp), where('date', '<=', endOfDayTimestamp))
    return getDocs(q).then(async (querySnapshot) => {
      return querySnapshot.docs.map((doc) => ({ ...doc.data() }))
    }).then(async (expenseList) => {
      const q = query(this.tagsCollection);
      const querySnapshot = await getDocs(q);
      const tagList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const list = [];
      for (const expenseItem of expenseList) {
        const item = expenseItem as AddLedgerItem;
        const tagInfo = tagList.find((tag) => tag.id === item.tagId);
        expenseItem['tagInfo'] = tagInfo || {};
        list.push(expenseItem);
      }
      return list
    }) as Promise<LedgerItem[]>;
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

  getExpenseList() {
    return getDocs(this.expenseListCollection).then((querySnapshot) => querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))) as Promise<LedgerItem[]>;
  }
}
