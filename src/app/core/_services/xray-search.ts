import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { XraySearchResponse } from '../models/api-responses';
import { ErrorHandlerService } from './error-handler';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root'
})
export class XraySearch {

  private base = environment.apiBase;
 
  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private storage: StorageService
  ) {}

  /** Helper: Dynamically build httpOptions with JWT token */
  private getHttpOptions() {
    const token = this.storage.getItem('access_token'); // ✅ FIXED: Use recruiter token
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return { headers, params: {} };
  }

    
  /** Xray Search API Call */
  xraySearch(data: any): Observable<XraySearchResponse> {
    const options = this.getHttpOptions();
    return this.http.post<XraySearchResponse>(
      `${this.base}/xray_search/`,
      data,
      options
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }
  
}
