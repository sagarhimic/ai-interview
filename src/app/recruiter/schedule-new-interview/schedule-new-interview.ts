import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { Recruiter } from '../../core/_services/recruiter';
import { NgToastService } from 'ng-angular-popup';
import { StorageService } from '../../core/_services/storage';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-new-interview',
  imports: [RouterLink, NgxEditorModule, ReactiveFormsModule, CommonModule],
  templateUrl: './schedule-new-interview.html',
  styleUrl: './schedule-new-interview.scss',
})
export class ScheduleNewInterview {

  ScheduleNewInterviewForm = new FormGroup({
    profile_name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    job_title: new FormControl('', [Validators.required]),
    profile_email: new FormControl('', [Validators.required, Validators.email]),
    mobile: new FormControl('', [Validators.required, Validators.pattern(/^\d{10}$/)]),
    interview_date: new FormControl('', [Validators.required]),
    interview_duration: new FormControl('', [Validators.required, Validators.min(5)]),
    location: new FormControl('', [Validators.required]),
    recruiter_id: new FormControl('', [Validators.required]),
    job_description: new FormControl('', [Validators.required]),
    required_skills: new FormControl('', [Validators.required]),
  });

  selectedFile: File | null = null;
  loading = false;

  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  // Getter to check if form is ready to submit
  get isFormValid(): boolean {
    const jobDescription = this.ScheduleNewInterviewForm.get('job_description')?.value;
    const hasJobDescription = !!(jobDescription && jobDescription.trim().length > 0);
    return this.ScheduleNewInterviewForm.valid && !!this.selectedFile && hasJobDescription;
  }

  // Debug method to get invalid controls
  getInvalidControls(): string[] {
    const invalid: string[] = [];
    const controls = this.ScheduleNewInterviewForm.controls;
    for (const name in controls) {
      if (controls[name as keyof typeof controls].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }

  constructor(
    private recruiterService: Recruiter,
    private toast: NgToastService,
    private storage: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.editor = new Editor();
    
    // Set recruiter ID from stored user data
    const userData = this.storage.getItemAsJSON('user_data') as {
      user?: { id?: string };
    };

    if (userData?.user?.id) {
      this.ScheduleNewInterviewForm.patchValue({
        recruiter_id: userData.user.id
      });
    }


  }
  ngOnDestroy(): void {
    this.editor.destroy();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Validate file type (PDF/DOC/DOCX)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(this.selectedFile.type)) {
        this.toast.danger('Please upload a valid resume file (PDF, DOC, or DOCX)');
        this.selectedFile = null;
        input.value = '';
      }
      
      // Validate file size (max 5MB)
      if (this.selectedFile && this.selectedFile.size > 5 * 1024 * 1024) {
        this.toast.danger('File size should not exceed 5MB');
        this.selectedFile = null;
        input.value = '';
      }
    }
  }

  onSubmit(): void {
    if (this.ScheduleNewInterviewForm.invalid) {
      this.toast.danger('Please fill all required fields correctly');
      Object.keys(this.ScheduleNewInterviewForm.controls).forEach(key => {
        const control = this.ScheduleNewInterviewForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    if (!this.selectedFile) {
      this.toast.danger('Please upload candidate resume');
      return;
    }

    const jobDescription = this.ScheduleNewInterviewForm.get('job_description')?.value;
    if (!jobDescription || jobDescription.trim().length === 0) {
      this.toast.danger('Please fill in the job description');
      return;
    }

    this.loading = true;

    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    const formValues = this.ScheduleNewInterviewForm.value;

    // Append all form fields
    Object.keys(formValues).forEach(key => {
      let value = formValues[key as keyof typeof formValues];
      
      // Format interview_date to "yyyy-mm-dd HH:MM:SS"
      if (key === 'interview_date' && value) {
        const date = new Date(value as string);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      
      // Handle job_description - it might be an object from ngx-editor
      if (key === 'job_description' && value) {
        // If it's an object, convert to string (get HTML content)
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
      }
      
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // Append file
    formData.append('file', this.selectedFile, this.selectedFile.name);

    // Debug: Log FormData contents (FormData doesn't show in console.log directly)
    console.log('FormData contents:');
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    this.recruiterService.scheduleNewInterview(formData).subscribe({
      next: (response) => {
        this.loading = false;
        this.toast.success('Interview scheduled successfully!');
        this.ScheduleNewInterviewForm.reset();
        this.selectedFile = null;
        this.editor.setContent('');
        
        // Navigate to schedule interview list
        setTimeout(() => {
          this.router.navigate(['/schedule-interview']);
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        this.toast.danger(error.message || 'Failed to schedule interview');
      }
    });
  }
}
