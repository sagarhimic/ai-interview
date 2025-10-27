import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const httpOptions = {
    headers: new HttpHeaders({
        //'Content-Type': 'text/plain'
    }),
    params: {}
};

@Injectable({
  providedIn: 'root'
})
export class Interviews {
  private base = environment.apiBase;
 
  constructor(private http: HttpClient) {}

  generateQuestions(data : any): Observable<any> {
    httpOptions.params = {};
    return this.http.post(`${this.base}/generate_questions/`,data, httpOptions);
  }

  submitAnswer(data : any): Observable<any> {
    httpOptions.params = {};
    return this.http.post(`${this.base}/submit_answer/`,data, httpOptions);
  }

  dataFrameSet(data : any): Observable<any> {
    httpOptions.params = {};
    return this.http.post(`${this.base}/analyze_frame/`,data, httpOptions);
  }
}