import { Component, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MeetingToken } from '../../core/_services/meeting-token';
import { MeetingAuth } from '../../core/_services/meeting-auth';

@Component({
  selector: 'app-meeting-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './meeting-login.html',
  styleUrl: './meeting-login.scss',
})
export class MeetingLogin {

    loading = false;
    errorMessage = '';
    form  : any;
    user_info : any;

    constructor(
      private fb: FormBuilder,
      private http: HttpClient,
      private router: Router,
      private auth: MeetingAuth,
      private _meetToken:MeetingToken,
      private renderer: Renderer2
    ) {
      this.form = this.fb.group({
        meeting_id: ['', Validators.required],
        password: ['', Validators.required],
      }); 
    }

    login() {
      if (this.form.invalid) return;
      this.loading = true;
      const formData = new FormData();
      formData.append('meeting_id', this.form.value.meeting_id!);
      formData.append('password', this.form.value.password!);

      this.auth.authentication(formData).subscribe({
        next: (res) => {
          this._meetToken.setToken(res.access_token);
          this._meetToken.setUserData(JSON.stringify(res));
          alert('Login successful!');
          document.body.classList.add('meeting');
          this.router.navigate(['/interview']); // or any route
        },
        error: (err) => {
          this.errorMessage = err.error.detail || 'Invalid credentials';
          this.loading = false;
        },
      });
  }

  GetUserInfo() {
    this.loading = true;
    const user_info = this._meetToken.getUserData;
    console.log(user_info);
  }
}
