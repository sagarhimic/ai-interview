import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Auth } from '../core/_services/auth';
import { Token } from '../core/_services/token';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})

export class Login {
   
    loading = false;
    errorMessage = '';
    form  : any;

    constructor(private fb: FormBuilder,
       private http: HttpClient,
        private router: Router,
        private auth: Auth,
      private _token:Token) {
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
        this._token.setToken(res.access_token);
        alert('Login successful!');
        this.router.navigate(['/interview']); // or any route
      },
      error: (err) => {
        this.errorMessage = err.error.detail || 'Invalid credentials';
        this.loading = false;
      },
    });
  }
}
