import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage';

/**
 * Simplified ThemeService
 * Manages theme preferences using a configuration-based approach
 */
interface ThemeConfig {
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private themeConfig: ThemeConfig = {};
  private isToggled = new BehaviorSubject<boolean>(false);
  public isToggled$ = this.isToggled.asObservable();

  // CSS classes that map to theme settings
  private classMap: { [key: string]: string } = {
    isDarkTheme: 'dark-theme',
    isBodyBGTheme: 'body-bg-color',
  };

  constructor(private storage: StorageService) {
    if (this.isBrowser()) {
      this.loadThemeConfig();
      this.applyTheme();
    }
  }

  /**
   * Check if code is running in the browser
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * Load all theme settings from storage
   */
  private loadThemeConfig(): void {
    for (const key of Object.keys(this.classMap)) {
      const value = this.storage.getItem(key);
      this.themeConfig[key] = value ? JSON.parse(value) : false;
    }
  }

  /**
   * Apply all theme settings to DOM
   */
  private applyTheme(): void {
    if (!this.isBrowser()) return;

    for (const [key, cssClass] of Object.entries(this.classMap)) {
      const isActive = this.themeConfig[key];
      if (isActive) {
        document.body.classList.add(cssClass);
      } else {
        document.body.classList.remove(cssClass);
      }
    }
  }

  /**
   * Toggle a theme setting
   */
  toggle(themeKey: string): void {
    if (!this.classMap[themeKey]) {
      console.warn(`Unknown theme: ${themeKey}`);
      return;
    }

    this.themeConfig[themeKey] = !this.themeConfig[themeKey];
    this.storage.setItem(themeKey, JSON.stringify(this.themeConfig[themeKey]));
    this.applyTheme();
  }

  /**
   * Get a theme setting
   */
  get(themeKey: string): boolean {
    return this.themeConfig[themeKey] || false;
  }

  /**
   * Set a theme setting
   */
  set(themeKey: string, value: boolean): void {
    this.themeConfig[themeKey] = value;
    this.storage.setItem(themeKey, JSON.stringify(value));
    this.applyTheme();
  }

  /**
   * Toggle dark theme specifically
   */
  toggleTheme(): void {
    this.toggle('isDarkTheme');
  }

  /**
   * Check if dark theme is active
   */
  isDark(): boolean {
    return this.get('isDarkTheme');
  }

  /**
   * Toggle body background theme
   */
  toggleBodyBGTheme(): void {
    this.toggle('isBodyBGTheme');
  }

  /**
   * Check if body background theme is active
   */
  isBodyBG(): boolean {
    return this.get('isBodyBGTheme');
  }
}
