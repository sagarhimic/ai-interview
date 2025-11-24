import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MeetingAuthResponse } from '../models/api-responses';
import { ErrorHandlerService } from './error-handler';

@Injectable({
  providedIn: 'root'
})
export class MeetingAuth {
  private base = environment.apiBase;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Authenticate candidate for meeting with meeting ID
   */
  authentication(data: FormData | any): Observable<MeetingAuthResponse> {
    return this.http.post<MeetingAuthResponse>(
      `${this.base}/login/`,
      data
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }

  /**
   * Get candidate information
   */
  getUser(candidateId: string): Observable<any> {
    return this.http.get<any>(
      `${this.base}/candidate/${candidateId}`
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }
}
