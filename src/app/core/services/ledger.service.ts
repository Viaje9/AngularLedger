import { Injectable } from '@angular/core';
import { CollectionReference, DocumentData, Firestore, collection, collectionData, getDocs, orderBy, query, where } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, catchError, tap } from 'rxjs';
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
    console.log(this.auth.userUid);
    this.tagsCollection = collection(this.firestore, `users/${this.auth.userUid}/tags`);
  }

  getTagList() {
    // 使用Snapshot快照
    // const userId = this.auth.userUid;
    // const tagsCollection = collection(this.firestore, `users/${userId}/tags`);
    // const q = query(tagsCollection, where('userId', '==', userId));
    // const querySnapshot = await getDocs(q);
    // return querySnapshot.docs.map(doc => doc.data());

    // 使用collectionData
    return collectionData(query(this.tagsCollection), { idField: 'id' }) as Observable<TagInfo[]>;
  }
}
