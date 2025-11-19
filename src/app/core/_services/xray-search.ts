import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class XraySearch {

  private base = environment.apiBase;
 
  constructor(private http: HttpClient) {}

  /** Helper: Dynamically build httpOptions with JWT token */
  private getHttpOptions() {
    const meetToken = localStorage.getItem('meet_access_token'); // ⬅️ token from login
    let headers = new HttpHeaders();

    if (meetToken) {
      headers = headers.set('Authorization', `Bearer ${meetToken}`);
    }

    // you can add other headers if needed (ex: JSON or multipart)
    return { headers, params: {} };
  }

    
  /** Xray Search API Call */
   xraySearch(data: any): Observable<any> {
      const options = this.getHttpOptions();
      return this.http.post(`${this.base}/xray_search/`, data, options);
    }
  
}
