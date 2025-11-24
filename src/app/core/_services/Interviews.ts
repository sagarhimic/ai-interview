import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  GenerateQuestionsResponse,
  SubmitAnswerResponse,
  AnalyzeFrameResponse,
  UploadResponse,
  GetSummaryResponse,
} from '../models/api-responses';
import { ErrorHandlerService } from './error-handler';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root'
})
export class Interviews {
  private base = environment.apiBase;
 
  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private storage: StorageService
  ) {}

  /** Helper: Dynamically build httpOptions with JWT token */
  private getHttpOptions() {
    const meetToken = this.storage.getItem('meet_access_token');
    let headers = new HttpHeaders();

    if (meetToken) {
      headers = headers.set('Authorization', `Bearer ${meetToken}`);
    }

    return { headers, params: {} };
  }

  /** Generate AI Questions */
  generateQuestions(data: any): Observable<GenerateQuestionsResponse> {
    const options = this.getHttpOptions();
    return this.http.post<GenerateQuestionsResponse>(
      `${this.base}/generate-questions/`,
      data,
      options
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }

  /** Submit Candidate Answer */
  submitAnswer(data: any): Observable<SubmitAnswerResponse> {
    const options = this.getHttpOptions();
    return this.http.post<SubmitAnswerResponse>(
      `${this.base}/submit-answer/`,
      data,
      options
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }

  getSummary(data: any): Observable<GetSummaryResponse> {
    const options = this.getHttpOptions();
    return this.http.post<GetSummaryResponse>(
      `${this.base}/get-candidate-answers/`,
      data,
      options
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }

  /** Send Frame for Face/Lip Detection */
  dataFrameSet(data: any): Observable<AnalyzeFrameResponse> {
    const options = this.getHttpOptions();
    return this.http.post<AnalyzeFrameResponse>(
      `${this.base}/analyze_frame/`,
      data,
      options
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }
  
  uploadQuestionAudio(data: FormData): Observable<UploadResponse> {
    const options = this.getHttpOptions();
    return this.http.post<UploadResponse>(
      `${this.base}/upload-question-audio/`,
      data,
      options
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }

  uploadFullVideo(data: FormData): Observable<UploadResponse> {
    const options = this.getHttpOptions();
    return this.http.post<UploadResponse>(
      `${this.base}/upload-full-video/`,
      data,
      options
    ).pipe(
      catchError(err => this.errorHandler.handleError(err))
    );
  }

}