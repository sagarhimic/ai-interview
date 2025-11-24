import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage';
import { ROUTES } from '../constants/routes';

@Injectable({
  providedIn: 'root'
})
export class Token {

  constructor(
    private router: Router,
    private storage: StorageService
  ) {}

  setUserData(user_data: string): void {
    this.storage.setItem('user_data', user_data);
  }

  // ✅ Save token after login
  setToken(access_token: string): void {
    this.storage.setItem('access_token', access_token);
  }

  // ✅ Get stored token
  getToken(): string | null {
    return this.storage.getItem('access_token');
  }

  // ✅ Check if logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ✅ Logout user
  logout(): void {
    this.storage.clear();
    document.body.classList.remove('recruiter');
    this.router.navigate([ROUTES.ROOT]);
  }

  public getUserData(): any | null {
    return this.storage.getItemAsJSON('user_data');
  }
  
}
