import { CommonModule } from '@angular/common';
import { Component, inject, type OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Firestore, collectionData, collection, orderBy, query } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-tags-manage',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './tags-manage.component.html',
  styleUrl: './tags-manage.component.css',
})
export class TagsManageComponent implements OnInit {

  tagList$!: Observable<TagInfo[]>

  constructor(private firestore: Firestore) {
    const itemCollection = collection(this.firestore, 'tagList')
    this.tagList$ = collectionData(query(itemCollection, orderBy('sort', 'desc'))) as Observable<TagInfo[]>;


  }
  ngOnInit(): void { }


}

interface TagInfo {
  tagIconName: string;
  tagName: string;
  sort: number;
}
