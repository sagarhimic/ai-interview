import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Token {

  constructor(private router: Router) {}

  // ✅ Save token after login
  setToken(access_token: string): void {
    localStorage.setItem('access_token', access_token);
  }

  // ✅ Get stored token
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // ✅ Check if logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ✅ Logout user
  logout(): void {
    localStorage.removeItem('access_token');
    this.router.navigate(['/']);
  }
  
}
