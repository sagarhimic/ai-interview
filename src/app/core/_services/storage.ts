import { Injectable } from '@angular/core';

/**
 * StorageService: Abstraction layer for localStorage
 * Benefits:
 * - Single point for all persistent storage access
 * - Can easily migrate to IndexedDB, sessionStorage, etc.
 * - Centralized validation and error handling
 * - Reduces XSS attack surface
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {

  /**
   * Set a value in storage
   * @param key Storage key
   * @param value Value to store (will be stringified if object)
   */
  setItem(key: string, value: string | object): void {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`Storage Error: Failed to set ${key}`, error);
    }
  }

  /**
   * Get a value from storage
   * @param key Storage key
   * @returns Stored value or null
   */
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Storage Error: Failed to get ${key}`, error);
      return null;
    }
  }

  /**
   * Get and parse a JSON value from storage
   * @param key Storage key
   * @returns Parsed object or null
   */
  getItemAsJSON<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Storage Error: Failed to parse ${key}`, error);
      return null;
    }
  }

  /**
   * Remove a value from storage
   * @param key Storage key
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage Error: Failed to remove ${key}`, error);
    }
  }

  /**
   * Clear all storage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage Error: Failed to clear storage', error);
    }
  }

  /**
   * Check if a key exists in storage
   * @param key Storage key
   */
  hasItem(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Storage Error: Failed to check ${key}`, error);
      return false;
    }
  }
}
