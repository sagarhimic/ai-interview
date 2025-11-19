import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/_services/auth';
import { Token } from '../../core/_services/token';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})

export class Login {
   
    loading = false;
    errorMessage = '';
    form  : any;
    user_info : any;

    constructor(
      private fb: FormBuilder,
      private http: HttpClient,
      private router: Router,
      private auth: Auth,
      private _token:Token,
      private renderer: Renderer2
    ) {
      this.form = this.fb.group({
        employee_id: ['', Validators.required],
        password: ['', Validators.required],
      }); 
    }

    login() {
    
    if (this.form.invalid) return;

    this.loading = true;
    const formData = new FormData();
    formData.append('employee_id', this.form.value.employee_id!);
    formData.append('password', this.form.value.password!);

    this.auth.authentication(formData).subscribe({
      next: (res) => {
        this._token.setToken(res.access_token);
        this._token.setUserData(JSON.stringify(res));
        alert('Login successful!');
        document.body.classList.add('recruiter');
        this.router.navigate(['/dashboard']); // or any route
      },
      error: (err) => {
        this.errorMessage = err.error.detail || 'Invalid credentials';
        this.loading = false;
      },
    });
  }

  GetUserInfo() {
    
    this.loading = true;
    
    const user_info = this._token.getUserData;
    
    console.log(user_info);
  }
}
