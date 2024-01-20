import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent implements OnInit {

  ngOnInit(): void { }

}
