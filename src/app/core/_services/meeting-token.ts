import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class MeetingToken {

  constructor(private router: Router) {}

  setUserData(user_data: string): void {
    localStorage.setItem('user_data', user_data);
  }

  // ✅ Save token after login
  setToken(meet_access_token: string): void {
    localStorage.setItem('meet_access_token', meet_access_token);
  }

  // ✅ Get stored token
  getToken(): string | null {
    return localStorage.getItem('meet_access_token');
  }


  // ✅ Check if logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ✅ Logout user
  logout(): void {
    localStorage.clear();
    localStorage.removeItem('meet_access_token');
    this.router.navigate(['/meeting-login']);
  }

  public getUserData(): any | null {
    const jsonData = localStorage.getItem('user_data');
    return jsonData ? JSON.parse(jsonData) : null;
}
  
}
