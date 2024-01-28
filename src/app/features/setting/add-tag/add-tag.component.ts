import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CollectionReference, DocumentData, Firestore, addDoc, collection, getDocs, query, orderBy, doc, docData, limit, collectionData, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Observable, ReplaySubject, map, take } from 'rxjs';
import { LoaderService } from 'src/app/core/services/loader.service';
import { TagInfo } from '@src/app/core/models/tag.model';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
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
    private route: ActivatedRoute,
    private ledgerService: LedgerService
  ) {
    const docId = this.router?.getCurrentNavigation()?.extras.state?.['docId']
    if (docId) {
      this.ledgerService.getTagInfo(docId).then(docSnap => {
        if (docSnap.exists()) {
          const result = docSnap.data() as TagInfo
          this.docId = docId;
          this.lastSort = result.sort;
          this.selectedTag = result.tagIconName;
          this.tagname = result.tagName;
        }
      })
    } else {
      this.ledgerService.getTagLastSort().pipe(untilDestroyed(this)).subscribe(result => {
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
      await this.ledgerService.addTagDoc({
        tagName,
        tagIconName,
        sort: this.lastSort
      }).catch((error) => {
        console.error("Error adding document: ", error);
      }).then(() => {
        this.router.navigateByUrl('/setting/tagsManage');
      }).finally(() => this.loaderService.stop())

    } else {
      await this.ledgerService
        .updateTagDoc(this.docId, tagIconName, tagName)
        .catch((error) => {
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
    await this.ledgerService.removeTagDoc(this.docId).then(() => {
      this.router.navigateByUrl('/setting/tagsManage');
    }).catch(error => {
      console.error('Error removing document: ', error);
    }).finally(() => this.loaderService.stop())
  }
}


