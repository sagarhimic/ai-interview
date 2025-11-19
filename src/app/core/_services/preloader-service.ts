import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreloaderService {

  private _loading$ = new BehaviorSubject<boolean>(false);
  loading$ = this._loading$.asObservable();

  private counter = 0;

  show() {
    this.counter++;
    this._loading$.next(true);
  }

  hide() {
    this.counter = Math.max(0, this.counter - 1);
    if (this.counter === 0) {
      this._loading$.next(false);
    }
  }

  reset() {
    this.counter = 0;
    this._loading$.next(false);
  }
}