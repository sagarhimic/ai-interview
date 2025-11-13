import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Recruiter {
  private base = environment.apiBase;
 
  constructor(private http: HttpClient) {}

  /** Helper: Dynamically build httpOptions with JWT token */
  private getHttpOptions() {
    const token = localStorage.getItem('access_token'); // ⬅️ token from login
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // you can add other headers if needed (ex: JSON or multipart)
    return { headers, params: {} };
  }

  

}