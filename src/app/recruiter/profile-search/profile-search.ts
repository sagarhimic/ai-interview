import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { XraySearch } from '../../core/_services/xray-search';
import { NgToastService } from 'ng-angular-popup';
import { XraySearchResponse, CandidateProfile } from '../../core/models/api-responses';

@Component({
  selector: 'app-profile-search',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './profile-search.html',
  styleUrl: './profile-search.scss',
})
export class ProfileSearch implements OnDestroy {

  searchForm = new FormGroup({
    role: new FormControl(''),
    location: new FormControl(''),
    skills: new FormControl(''),
    company: new FormControl(''),
    min_exp: new FormControl(1),
    max_exp: new FormControl(40),
    pages: new FormControl(3),
    page: new FormControl(1),
    limit: new FormControl(20),
  });

  responseData: XraySearchResponse | null = null;
  loading = false;
  allProfiles: CandidateProfile[] = [];
  visibleProfiles: CandidateProfile[] = [];
  batchSize = 20;
  currentIndex = 0;
  hasMoreProfiles = false;

  constructor(
    private xraySearchService: XraySearch,
    private toast: NgToastService
  ) {}

  onSubmit(): void {
    // Validate min_exp < max_exp
    const minExp = this.searchForm.get('min_exp')?.value || 0;
    const maxExp = this.searchForm.get('max_exp')?.value || 0;
    
    if (minExp > maxExp) {
      this.toast.danger('Minimum experience cannot be greater than maximum');
      return;
    }

    this.loading = true;
    this.xraySearchService.xraySearch(this.searchForm.value).subscribe({
      next: (res: XraySearchResponse) => {
        this.responseData = res;
        this.allProfiles = res.profiles || [];
        this.visibleProfiles = [];
        this.currentIndex = 0;
        this.loadMore();
        this.loading = false;
        this.toast.success(`Found ${res.total_count} profiles`);
      },
      error: (err) => {
        this.loading = false;
        this.toast.danger(err.message || 'Failed to search profiles');
      }
    });
  }

  /**
   * Load next batch of profiles
   */
  loadMore(): void {
    if (this.currentIndex >= this.allProfiles.length) {
      this.hasMoreProfiles = false;
      this.toast.info('No more profiles to load');
      return;
    }

    const nextBatch = this.allProfiles.slice(
      this.currentIndex,
      this.currentIndex + this.batchSize
    );

    if (nextBatch.length === 0) {
      this.hasMoreProfiles = false;
      return;
    }

    this.visibleProfiles.push(...nextBatch);
    this.currentIndex += this.batchSize;
    this.hasMoreProfiles = this.currentIndex < this.allProfiles.length;
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
