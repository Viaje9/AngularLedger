import { CommonModule } from '@angular/common';
import { Component, signal, type OnInit } from '@angular/core';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.css',
})
export class LoaderComponent implements OnInit {
  isLoading = signal(false)
  constructor(private loaderService: LoaderService) {
    this.loaderService.loading$.subscribe(state => {
      this.isLoading.set(state)
    });
  }

  ngOnInit(): void { }

}
