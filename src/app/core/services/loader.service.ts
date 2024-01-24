import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private executingCounter = 0;
  private loadingStatus$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  get loading$(): Observable<boolean> {
    return this.loadingStatus$.asObservable();
  }

  start(): void {
    this.executingCounter++;

    if (this.executingCounter > 0) {
      this.loadingStatus$.next(true);
    }
  }

  stop(): void {
    if (this.executingCounter > 0) {
      this.executingCounter--;
    }

    if (this.executingCounter <= 0) {
      this.loadingStatus$.next(false);
    }
  }
}
