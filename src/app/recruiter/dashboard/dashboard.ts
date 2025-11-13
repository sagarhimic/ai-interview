import { Component } from '@angular/core';
import { Token } from '../../core/_services/token';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

  constructor(
    private _token: Token,
  ) {}


  logout() {
    const modalBackdrop = document.querySelector('.modal-backdrop');
    modalBackdrop?.remove();
    
    this._token.logout();
  }

}
