import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {

  ngOnInit(): void { }

}
