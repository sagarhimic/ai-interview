import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Interviews {
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

  /** Generate AI Questions */
  generateQuestions(data: any): Observable<any> {
    const options = this.getHttpOptions();
    return this.http.post(`${this.base}/generate-questions/`, data, options);
  }

  /** Submit Candidate Answer */
  submitAnswer(data: any): Observable<any> {
    const options = this.getHttpOptions();
    return this.http.post(`${this.base}/submit-answer/`, data, options);
  }

  /** Send Frame for Face/Lip Detection */
  dataFrameSet(data: any): Observable<any> {
    const options = this.getHttpOptions();
    return this.http.post(`${this.base}/analyze_frame/`, data, options);
  }
  
  // in Interviews service
  uploadQuestionAudio(data: FormData): Observable<any> {
    const options = this.getHttpOptions(); // or set headers manually
    return this.http.post(`${this.base}/upload-question-audio/`, data, options);
  }

  uploadFullVideo(data: FormData): Observable<any> {
    const options = this.getHttpOptions();
    return this.http.post(`${this.base}/upload-full-video/`, data, options);
  }

}