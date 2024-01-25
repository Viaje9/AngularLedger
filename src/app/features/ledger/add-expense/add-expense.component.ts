import { CommonModule } from '@angular/common';
import { Component, type OnInit, ViewChild, ElementRef } from '@angular/core';
import { Firestore, collection, collectionData, orderBy, query } from '@angular/fire/firestore';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TagInfo } from '@src/app/core/models/tag.model';
import { debounceTime, fromEvent, merge, take } from 'rxjs';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.css',

})
export class AddExpenseComponent implements OnInit {
  @ViewChild('scrollTags') scrollTagsRef!: ElementRef;
  @ViewChild('tagGroup') tagGroupRef!: ElementRef;

  maxTagGroupPage = 0
  currentTagGroupPage = 0
  translateFactor = 'translate(0, 0)'

  tagsGroup: TagInfo[][] = [];

  selectedTagId = '';
  constructor(
    private route: ActivatedRoute
  ) {
    this.tagsGroup = this.route.snapshot.data['tagListGroup'];
  }
  ngOnInit(): void {

  }
  ngAfterViewInit(): void {

    const scrollWidth = this.scrollTagsRef.nativeElement.scrollWidth;
    const tagGroupWidth = this.tagGroupRef.nativeElement.scrollWidth;
    this.maxTagGroupPage = Math.ceil(scrollWidth / tagGroupWidth)

  }

  onSwipeRight(): void {
    if (this.currentTagGroupPage > 0) {
      this.currentTagGroupPage -= 1
      const translate = this.currentTagGroupPage * 100
      this.translateFactor = `translate(-${translate}%, 0)`
    }
  }

  onSwipeLeft(): void {
    if (this.currentTagGroupPage < this.maxTagGroupPage - 1) {
      this.currentTagGroupPage += 1
      const translate = this.currentTagGroupPage * 100
      this.translateFactor = `translate(-${translate}%, 0)`
    }
  }

  onTagClick(tagId: string) {
    if (this.selectedTagId === tagId) {
      this.selectedTagId = ''
    } else {
      this.selectedTagId = tagId
    }
  }
}
