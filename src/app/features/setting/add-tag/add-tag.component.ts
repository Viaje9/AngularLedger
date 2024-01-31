import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CollectionReference, DocumentData } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { LoaderService } from 'src/app/core/services/loader.service';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TransactionType } from '@src/app/core/models/transaction-type.model';
import { AddTagStatus, AddTagStatusEnum } from './add-tag.model';

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
  transactionType!: TransactionType
  tagStatus!: AddTagStatus

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
    private router: Router,
    private loaderService: LoaderService,
    private route: ActivatedRoute,
    private ledgerService: LedgerService
  ) {
    const initData = this.route.snapshot.data['data']
    this.tagStatus = initData.tagStatus
    if (initData.tagStatus === AddTagStatusEnum.Edit) {
      this.docId = initData.docId
      this.lastSort = initData.lastSort
      this.selectedTag = initData.selectedTag
      this.tagname = initData.tagName
    } else if (initData.tagStatus === AddTagStatusEnum.Add) {
      this.transactionType = initData.transactionType
      this.lastSort = initData.lastSort
    } else {
      this.router.navigateByUrl('/setting/tagsManage');
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

    if (this.tagStatus === AddTagStatusEnum.Add) {
      await this.ledgerService.addTagDoc({
        tagName,
        tagIconName,
        sort: this.lastSort,
        transactionType: this.transactionType
      }).catch((error) => {
        console.error("Error adding document: ", error);
      }).then(() => {
        this.router.navigateByUrl('/setting/tagsManage', {
          state: {
            transactionType: this.transactionType
          }
        });
      }).finally(() => this.loaderService.stop())

    } else if (this.tagStatus === AddTagStatusEnum.Edit) {
      await this.ledgerService
        .updateTagDoc(this.docId, tagIconName, tagName)
        .catch((error) => {
          console.error("Error adding document: ", error);
        }).then(() => {
          this.router.navigateByUrl('/setting/tagsManage', {
            state: {
              transactionType: this.transactionType
            }
          });
        }).finally(() => this.loaderService.stop())
    } else {
      this.loaderService.stop()
    }
  }

  async onClickRemoveTag() {
    if (this.tagStatus === AddTagStatusEnum.Add) {
      return
    } else if (this.tagStatus === AddTagStatusEnum.Edit) {
      this.loaderService.start()
      await this.ledgerService.removeTagDoc(this.docId).then(() => {
        this.router.navigateByUrl('/setting/tagsManage', {
          state: {
            transactionType: this.transactionType
          }
        });
      }).catch(error => {
        console.error('Error removing document: ', error);
      }).finally(() => this.loaderService.stop())
    }
  }
}


