import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-tag',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './add-tag.component.html',
  styleUrl: './add-tag.component.css',
})
export class AddTagComponent implements OnInit {

  selectedTag = ''

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


  ngOnInit(): void { }

  onClickTag(tag: string) {
    if (this.selectedTag === tag) {
      this.selectedTag = '';
      return
    }
    this.selectedTag = tag;
  }

}
