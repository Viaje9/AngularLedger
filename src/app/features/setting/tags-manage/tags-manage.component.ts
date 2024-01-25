import { CommonModule } from '@angular/common';
import { Component, inject, type OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Firestore, collectionData, collection, orderBy, query, doc, getDocs, deleteDoc } from '@angular/fire/firestore';
import { Observable, tap } from 'rxjs';
import { SharedModule } from '@src/app/shared/shared.module';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tags-manage',
  standalone: true,
  imports: [
    SharedModule,
    CdkDropList,
    CdkDrag
  ],
  templateUrl: './tags-manage.component.html',
  styleUrl: './tags-manage.component.css',
})
export class TagsManageComponent implements OnInit {

  tagList$!: Observable<TagInfo[]>

  constructor(private firestore: Firestore, private router: Router) {
    const itemCollection = collection(this.firestore, 'tagList');
    const options = { idField: 'id' }; // Specify the field name for the document ID
    this.tagList$ = collectionData(itemCollection, options) as Observable<TagInfo[]>;
  }

  ngOnInit(): void {
  }


  goToRemoveTag(id: string) {
    this.router.navigate(['/setting/addTag'], { state: { docId: id } })
  }


}

interface TagInfo {
  tagIconName: string;
  tagName: string;
  sort: number;
  id: string;
}
