import { Component, type OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TagInfo } from '@src/app/core/models/tag.model';
import { ModalService } from '@src/app/core/services/modal.service';
import { SharedModule } from '@src/app/shared/shared.module';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [
    SharedModule
  ],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.css',

})
export class AddExpenseComponent implements OnInit {
  @ViewChild('scrollTags') scrollTagsRef!: ElementRef;
  @ViewChild('tagGroup') tagGroupRef!: ElementRef;
  @ViewChild('templateRef') templateRef!: TemplateRef<any> | undefined;

  maxTagGroupPage = 0
  currentTagGroupPage = 0
  translateFactor = 'translate(0, 0)'
  price!: number;

  tagsGroup: TagInfo[][] = [];

  selectedTagId = '';
  constructor(
    private route: ActivatedRoute,
    private modalService: ModalService,
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

  async onClickSave() {
    if (!this.selectedTagId || !this.price) {
      this.modalService.openConfirm({
        content: '請輸入金額與選擇標籤',
        okText: '確認',
        showCancelBtn: false,
        outsideClose: true,
      });

    }
  }

  onClickDescription() {
    this.modalService.openConfirm({
      okText: '確認',
      showCancelBtn: false,
      outsideClose: true,
      contentTemplateRef: this.templateRef
    });
  }
}
