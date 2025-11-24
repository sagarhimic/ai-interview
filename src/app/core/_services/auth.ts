import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RecruiterAuthResponse } from '../models/api-responses';
import { ErrorHandlerService } from './error-handler';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private base = environment.apiBase;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Authenticate recruiter with employee credentials
   */
  authentication(data: FormData | any): Observable<RecruiterAuthResponse> {
    return this.http.post<RecruiterAuthResponse>(
      `${this.base}/recruiter/login/`,
      data
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }
}
