import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/_services/auth';
import { Token } from '../../core/_services/token';
import { NgToastService } from 'ng-angular-popup';
import { ROUTES } from '../../core/constants/routes';
import { RecruiterAuthResponse } from '../../core/models/api-responses';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit, OnDestroy {
   
  loading = false;
  errorMessage = '';
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private auth: Auth,
    private _token: Token,
    private renderer: Renderer2,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      employee_id: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  login(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const formData = new FormData();
    formData.append('employee_id', this.form.value.employee_id!);
    formData.append('password', this.form.value.password!);

    this.auth.authentication(formData).subscribe({
      next: (res: RecruiterAuthResponse) => {
        this._token.setToken(res.access_token);
        this._token.setUserData(JSON.stringify(res));
        this.toast.success('Login successful!');
        document.body.classList.add('recruiter');
        this.router.navigate([ROUTES.RECRUITER.DASHBOARD]);
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
