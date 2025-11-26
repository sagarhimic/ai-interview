import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage';

/**
 * Generic TokenService: Unified token management for Recruiter and Meeting flows
 * Must be initialized with init() before use
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private tokenKey: string = '';
  private userDataKey = 'user_data';
  private modeClass: string = '';
  private logoutRedirectPath: string = '';
  private isInitialized = false;

  constructor(
    private storage: StorageService,
    private router: Router
  ) {}

  /**
   * Initialize token service with configuration
   * Must be called before using the service
   */
  init(tokenKey: string, modeClass: string, logoutRedirectPath: string): void {
    this.tokenKey = tokenKey;
    this.modeClass = modeClass;
    this.logoutRedirectPath = logoutRedirectPath;
    this.isInitialized = true;
  }

  /**
   * Check if service is initialized
   */
  private checkInitialized(): void {
    if (!this.isInitialized) {
      console.warn('TokenService not initialized. Call init() first.');
    }
  }

  /**
   * Save token after login
   */
  setToken(accessToken: string): void {
    this.checkInitialized();
    this.storage.setItem(this.tokenKey, accessToken);
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    this.checkInitialized();
    return this.storage.getItem(this.tokenKey);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Save user data (typically the full auth response)
   */
  setUserData(userData: object | string): void {
    this.storage.setItem(this.userDataKey, userData);
  }

  /**
   * Retrieve user data
   */
  getUserData(): any | null {
    return this.storage.getItemAsJSON(this.userDataKey);
  }

  /**
   * Logout user
   */
  logout(): void {
    this.checkInitialized();
    this.closeAllModals();
    this.storage.clear();
    
    // Remove mode class from body
    if (this.modeClass) {
      document.body.classList.remove(this.modeClass);
    }

    // Redirect to login
    this.router.navigate([this.logoutRedirectPath]);
  }

  /**
   * Close all Bootstrap modals and remove backdrops
   */
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

  /**
   * Clear all auth data
   */
  clearAll(): void {
    this.storage.clear();
    if (this.modeClass) {
      document.body.classList.remove(this.modeClass);
    }
  }
}
