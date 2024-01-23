import { CommonModule } from '@angular/common';
import { Component, type OnInit, ViewChild, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { debounceTime, fromEvent, merge } from 'rxjs';

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

  isDropScroll = false;

  groupStartList: number[] = []
  findClosestNum = 0

  tagsGroup: string[] = ['Food', 'Transport', 'Entertainment', 'Other'];
  ngOnInit(): void {

  }
  ngAfterViewInit(): void {
    // this.currentScrollLeft = this.scrollTagsRef.nativeElement.scrollLeft
    //  console.log(this.scrollTagsRef.nativeElement.scrollLeft);
    const scrollWidth = this.scrollTagsRef.nativeElement.scrollWidth;
    const tagGroupWidth = this.tagGroupRef.nativeElement.scrollWidth;

    // 座標
    this.groupStartList = Array.from({ length: Math.ceil(scrollWidth / tagGroupWidth) }).map((_, i) => {
      return tagGroupWidth * i
    })

    // console.log(list);


    // console.log(this.scrollTagsRef.nativeElement.scrollWidth);
    // console.log(this.tagGroupRef.nativeElement.scrollWidth);
    // console.log(this.scrollWidth);


    const mouseDown$ = fromEvent(this.scrollTagsRef.nativeElement, 'mousedown');
    const mouseUp$ = fromEvent(document, 'mouseup');
    const touchStart$ = fromEvent(this.scrollTagsRef.nativeElement, 'touchstart');
    const touchEnd$ = fromEvent(document, 'touchend');

    const dragStart$ = merge(mouseDown$, touchStart$);
    const dragEnd$ = merge(mouseUp$, touchEnd$);

    dragStart$.subscribe(this.onDragStart.bind(this));
    dragEnd$.subscribe(this.onDragEnd.bind(this));

  }

  onScrollTagsGroup(): void {
    // console.log(this.scrollTagsRef.nativeElement.scrollLeft);
  }

  onDragStart(): void {
    // console.log( this.scrollWidth);

    this.isDropScroll = true
  }

  onDragEnd(): void {
    console.log('onDragEnd');

    // if (!this.isDropScroll) return
    this.isDropScroll = false
    const scrollLeft = this.scrollTagsRef.nativeElement.scrollLeft
    this.findClosestNum = this.findClosest(scrollLeft)
    console.log(this.findClosest(scrollLeft), scrollLeft);

    this.scrollTagsRef.nativeElement.scrollTo({
      left: this.findClosest(scrollLeft),
      behavior: 'smooth'
    })
    // fromEvent(this.scrollTagsRef.nativeElement, 'scroll').pipe(debounceTime(100)).subscribe(() => {
    //   if(this.findClosest(scrollLeft) !== scrollLeft) {
    //     this.scrollTagsRef.nativeElement.scrollTo({
    //       left: this.findClosest(scrollLeft),
    //       behavior: 'smooth'
    //     })
    //   }
    // });

    // scrollLeft = this.findClosest(this.scrollTagsRef.nativeElement.scrollLeft)
  }

  findClosest(target: number): number {
    return this.groupStartList.reduce((prev, curr) => (Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev));
  }





}
