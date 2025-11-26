import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage';
import { ROUTES } from '../constants/routes';

@Injectable({
  providedIn: 'root'
})
export class MeetingToken {

  constructor(
    private router: Router,
    private storage: StorageService
  ) {}

  setUserData(user_data: string): void {
    this.storage.setItem('user_data', user_data);
  }

  // ✅ Save token after login
  setToken(meet_access_token: string): void {
    this.storage.setItem('meet_access_token', meet_access_token);
  }

  // ✅ Get stored token
  getToken(): string | null {
    return this.storage.getItem('meet_access_token');
  }

  // ✅ Check if logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ✅ Logout user
  logout(): void {
    this.closeAllModals();
    this.storage.clear();
    document.body.classList.remove('meeting');
    this.router.navigate([ROUTES.MEETING.LOGIN]);
  }

  // ✅ Close all Bootstrap modals and remove backdrops
  private closeAllModals(): void {
    // Close all open modals
    const openModals = document.querySelectorAll('.modal.show');
    openModals.forEach(modal => {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      modal.setAttribute('style', 'display: none');
    });

    // Remove all modal backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());

    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }

  public getUserData(): any | null {
    return this.storage.getItemAsJSON('user_data');
  }
  
}
