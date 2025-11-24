import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root'
})
export class Recruiter {
  private base = environment.apiBase;
 
  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {}

  /** Helper: Dynamically build httpOptions with JWT token */
  private getHttpOptions() {
    const token = this.storage.getItem('access_token');
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return { headers, params: {} };
  }

  // Add methods here as needed for recruiter-specific endpoints
}