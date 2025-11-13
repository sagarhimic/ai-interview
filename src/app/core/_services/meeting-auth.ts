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
export class MeetingAuth {

  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  authentication(data : any): Observable<any> {
    httpOptions.params = {};
    return this.http.post(`${this.base}/login/`,data, httpOptions);
  }

  getUser(candidate_id : any): Observable<any> {
    httpOptions.params = {};
    return this.http.post(`${this.base}/candidate/{candidate_id}`, httpOptions);
  }

  
}
