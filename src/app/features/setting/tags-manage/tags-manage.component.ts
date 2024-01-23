import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-tags-manage',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './tags-manage.component.html',
  styleUrl: './tags-manage.component.css',
})
export class TagsManageComponent implements OnInit {

  ngOnInit(): void { }

}
