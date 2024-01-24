import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CollectionReference, DocumentData, Firestore, addDoc, collection, getDocs, query, orderBy, doc, docData, limit, collectionData } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Observable, ReplaySubject, map } from 'rxjs';


@Component({
  selector: 'app-add-tag',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './add-tag.component.html',
  styleUrl: './add-tag.component.css',
})
export class AddTagComponent implements OnInit {

  selectedTag = ''

  tagname = ''


  lastSort$ = new ReplaySubject(1)

  tagList = [
    'fas fa-bread-slice',
    'fas fa-tshirt',
    'fas fa-candy-cane',
    'fas fa-bus',
    'fas fa-shopping-cart',
    'fas fa-coffee',
    'fas fa-headphones',
    'fas fa-utensils',
    'fas fa-book',
    'fas fa-hospital',
    'fas fa-tag',
    'fas fa-phone',
    'fas fa-user',
    'fas fa-home'
  ]

  tagListCollection!: CollectionReference<DocumentData, DocumentData>

  constructor(private firestore: Firestore, private router: Router) {
    collectionData(query(collection(this.firestore, 'tagList'), orderBy('sort', 'desc'), limit(1))).pipe(map(e => e[0]['sort'])).subscribe(result => {
      this.lastSort$.next(result + 1)
    })
  }


  ngOnInit(): void { }

  onClickTag(tag: string) {
    if (this.selectedTag === tag) {
      this.selectedTag = '';
      return
    }
    this.selectedTag = tag;
  }

  onClickAddTag() {
    const tagName = this.tagname.trim()
    if (!tagName || !this.selectedTag) {
      alert('Tag name is empty')
      return
    }
    if (!this.selectedTag) {
      alert('Tag icon is empty')
      return
    }
    this.addTag(tagName, this.selectedTag)
  }

  async addTag(tagName: string, tagIconName: string) {
    this.lastSort$.subscribe(async (sort) => {
      console.log(sort);

      // await addDoc(this.tagListCollection, {
      //   tagName,
      //   tagIconName,
      //   sort: 0
      // }).catch((error) => {
      //   console.error("Error adding document: ", error);
      // }).then(() => {
      //   this.router.navigateByUrl('/setting/tagsManage');
      // })
    })

  }
}


interface TagInfo {
  tagIconName: string;
  tagName: string;
  sort: number;
}
