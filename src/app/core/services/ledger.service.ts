import { Injectable } from '@angular/core';
import { CollectionReference, DocumentData, Firestore, collection, collectionData, doc, docData, getDocs, limit, orderBy, query, where, addDoc, getDoc, updateDoc, deleteDoc, writeBatch } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, catchError, map, take, tap } from 'rxjs';
import { TagInfo } from '../models/tag.model';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {

  tagsCollection!: CollectionReference<DocumentData, DocumentData>
  constructor(
    private firestore: Firestore,
    private auth: AuthService
  ) {
    this.tagsCollection = collection(this.firestore, this.tagsPath);
  }


  get tagsPath() {
    return `users/${this.auth.userUid}/tags`
  }

  getTagList() {
    // 使用Snapshot快照
    // const userId = this.auth.userUid;
    // const tagsCollection = collection(this.firestore, `users/${userId}/tags`);
    // const q = query(tagsCollection, where('userId', '==', userId));
    // const querySnapshot = await getDocs(q);
    // return querySnapshot.docs.map(doc => doc.data());

    // 使用collectionData
    return collectionData(query(this.tagsCollection, orderBy('sort', 'asc')), { idField: 'id' }) as Observable<TagInfo[]>;
  }

  getTagInfo(docId: string) {
    const docRef = doc(this.firestore, this.tagsPath, docId)
    return getDoc(docRef)
  }

  getTagLastSort() {
    return collectionData(query(this.tagsCollection, orderBy('sort', 'desc'), limit(1)))
      .pipe(map(e => e[0]['sort'] + 1)).pipe(take(1))
  }

  addTagDoc(data: {
    tagIconName: string,
    tagName: string,
    sort: number,
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
}
