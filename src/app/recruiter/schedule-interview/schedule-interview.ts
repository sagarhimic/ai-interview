import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Recruiter } from '../../core/_services/recruiter';
import { StorageService } from '../../core/_services/storage';
import { NgToastService } from 'ng-angular-popup';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-interview',
  imports: [ RouterModule, CommonModule ],
  templateUrl: './schedule-interview.html',
  styleUrl: './schedule-interview.scss',
})
export class ScheduleInterview implements OnInit {

  records: any[] = [];
  loading = false;
  recruiterId: string = '';

  constructor(
    private recruiterService: Recruiter,
    private storage: StorageService,
    private toast: NgToastService
  ) { }

  ngOnInit(): void {
    // Set recruiter ID from stored user data
    const userData = this.storage.getItemAsJSON('user_data') as {
      user?: { id?: string };
    };

    if (userData?.user?.id) {
        this.recruiterId = userData.user.id;
        this.loadScheduledInterviews();
    } else {
      this.toast.danger('Recruiter ID not found. Please login again.');
    }
  }

  loadScheduledInterviews(): void {
    this.loading = true;
    this.recruiterService.interviewSchedules(this.recruiterId).subscribe({
      next: (response) => {
        this.loading = false;
        this.records = response.records || response || [];
        console.log('Interview schedules:', this.records);
      },
      error: (error) => {
        this.loading = false;
        this.toast.danger(error.message || 'Failed to load interview schedules');
      }
    });
  }
}
