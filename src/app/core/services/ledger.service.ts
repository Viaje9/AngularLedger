import { Injectable } from '@angular/core';
import { CollectionReference, DocumentData, Firestore, collection, collectionData, doc, docData, getDocs, limit, orderBy, query, where, addDoc, getDoc, updateDoc, deleteDoc, writeBatch } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, catchError, map, take, tap } from 'rxjs';
import { TagInfo } from '../models/tag.model';
import { TransactionType } from '../models/transaction-type.model';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {

  tagsCollection!: CollectionReference<DocumentData, DocumentData>
  expenseListCollection!: CollectionReference<DocumentData, DocumentData>
  constructor(
    private firestore: Firestore,
    private auth: AuthService
  ) {
    this.tagsCollection = collection(this.firestore, this.tagsPath);
    this.expenseListCollection = collection(this.firestore, this.expenseListPath);
  }


  get tagsPath() {
    return `users/${this.auth.userUid}/tags`
  }

  get expenseListPath() {
    return `users/${this.auth.userUid}/expenseList`
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

  addExpense(data: {
    date: string;
    price: string;
    tagId: string;
    description: string;
  }) {
    return addDoc(this.expenseListCollection, data)
  }

  getTodayExpenseList(date: string) {
    return collectionData(query(this.expenseListCollection, where('date', '==', date)), { idField: 'id' }) as Observable<any[]>;
  }
}
