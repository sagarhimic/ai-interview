import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage';
import { ScheduleInterviewResponse } from '../models/api-responses';
import { ErrorHandlerService } from './error-handler';

@Injectable({
  providedIn: 'root'
})
export class Recruiter {
  private base = environment.apiBase;
 
  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private storage: StorageService
  ) {}

  /** Helper: Dynamically build httpOptions with JWT token */
  private getHttpOptions() {
    const token = this.storage.getItem('access_token');
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return { headers };
  }


  /**
   * Get interview schedules for a recruiter
   */
  interviewSchedules(recruiterId: string): Observable<any> {
    const token = this.storage.getItem('access_token');
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.post<any>(
      `${this.base}/recruiter/interview_schedules/`,
      {},  // Empty body
      { 
        headers,
        params: { recruiter_id: recruiterId }  // Pass as query parameter
      }
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }

  /**
   * Schedule new interview by uploading candidate data and resume
   */
  scheduleNewInterview(data: FormData): Observable<ScheduleInterviewResponse> {
    const token = this.storage.getItem('access_token');
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // Note: Don't set Content-Type for FormData - browser sets it automatically with boundary
    
    return this.http.post<ScheduleInterviewResponse>(
      `${this.base}/recruiter/upload_candidate/`,
      data,
      { headers }
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }
}