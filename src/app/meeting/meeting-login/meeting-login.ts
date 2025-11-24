import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MeetingToken } from '../../core/_services/meeting-token';
import { MeetingAuth } from '../../core/_services/meeting-auth';
import { NgToastService } from 'ng-angular-popup';
import { ROUTES } from '../../core/constants/routes';
import { MeetingAuthResponse } from '../../core/models/api-responses';

@Component({
  selector: 'app-meeting-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './meeting-login.html',
  styleUrl: './meeting-login.scss',
})
export class MeetingLogin implements OnInit, OnDestroy {

  loading = false;
  errorMessage = '';
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private auth: MeetingAuth,
    private _meetToken: MeetingToken,
    private renderer: Renderer2,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      meeting_id: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  login(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const formData = new FormData();
    formData.append('meeting_id', this.form.value.meeting_id!);
    formData.append('password', this.form.value.password!);

    this.auth.authentication(formData).subscribe({
      next: (res: MeetingAuthResponse) => {
        this._meetToken.setToken(res.access_token);
        this._meetToken.setUserData(JSON.stringify(res));
        this.toast.success('Login successful!');
        document.body.classList.add('meeting');
        this.router.navigate([ROUTES.MEETING.INTERVIEW]);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Invalid credentials';
        this.toast.danger(this.errorMessage);
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
