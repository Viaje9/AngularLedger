import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CollectionReference, DocumentData, Firestore, addDoc, collection, getDocs, query, orderBy, doc, docData, limit, collectionData, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Observable, ReplaySubject, map, take } from 'rxjs';
import { LoaderService } from 'src/app/core/services/loader.service';

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
  lastSort = 0
  docId = ''

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

  constructor(
    private firestore: Firestore,
    private router: Router,
    private loaderService: LoaderService,
    private route: ActivatedRoute
  ) {
    const docId = this.router?.getCurrentNavigation()?.extras.state?.['docId']
    if (docId) {
      const docRef = doc(this.firestore, 'tagList', docId)
      docData(docRef).pipe(take(1)).subscribe((res) => {
        const result = res as TagInfo
        this.docId = docId;
        this.lastSort = result.sort;
        this.selectedTag = result.tagIconName;
        this.tagname = result.tagName;
      })
    } else {
      this.tagListCollection = collection(this.firestore, 'tagList')
      collectionData(query(collection(this.firestore, 'tagList'), orderBy('sort', 'desc'), limit(1)))
        .pipe(map(e => e[0]['sort'] + 1)).pipe(take(1)).subscribe(result => {
          this.lastSort = result
        })
    }

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
    this.loaderService.start()

    if (!this.docId) {
      await addDoc(this.tagListCollection, {
        tagName,
        tagIconName,
        sort: this.lastSort
      }).catch((error) => {
        console.error("Error adding document: ", error);
      }).then(() => {
        this.router.navigateByUrl('/setting/tagsManage');
      }).finally(() => this.loaderService.stop())
    } else {
      const docRef = doc(this.firestore, 'tagList', this.docId)
      updateDoc(docRef, {
        tagName,
        tagIconName,
      }).catch((error) => {
        console.error("Error adding document: ", error);
      }).then(() => {
        this.router.navigateByUrl('/setting/tagsManage');
      }).finally(() => this.loaderService.stop())
    }
  }

  async onClickRemoveTag() {
    if (!this.docId) {
      return
    }
    this.loaderService.start()
    const docRef = doc(this.firestore, 'tagList', this.docId)
    await deleteDoc(docRef).then(() => {
      this.router.navigateByUrl('/setting/tagsManage');
    }).catch(error => {
      console.error('Error removing document: ', error);
    }).finally(() => this.loaderService.stop())
  }
}


interface TagInfo {
  tagIconName: string;
  tagName: string;
  sort: number;
  id: string;
}
