import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { XraySearch } from '../../core/_services/xray-search';

@Component({
  selector: 'app-profile-search',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './profile-search.html',
  styleUrl: './profile-search.scss',
})
export class ProfileSearch {

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

  responseData: any = null;     // store entire response
  loading = false;

  allProfiles: any[] = [];     // full list (100)
  visibleProfiles: any[] = []; // profiles shown on UI
  batchSize = 20;
  currentIndex = 0;

  constructor(
    private xraySearchService: XraySearch
  ) { }

  // onSubmit() {
  //   this.loading = true;

  //   const payload = this.searchForm.value;

  //   this.xraySearchService.xraySearch(payload).subscribe({
  //     next: (res) => {
  //       this.responseData = res;
  //       this.profiles = res?.profiles || [];
  //       this.loading = false;

  //       console.log(this.responseData);
  //       console.log("Profiles:", this.profiles);
  //     },
  //     error: (err) => {
  //       console.error("Search Error:", err);
  //       this.loading = false;
  //     }
  //   });
  // }


  onSubmit() {
    this.loading = true;

    this.xraySearchService.xraySearch(this.searchForm.value).subscribe({
      next: (res) => {
        this.responseData = res;
        this.allProfiles = res.profiles; 
        this.visibleProfiles = [];
        this.currentIndex = 0;
        this.loadMore();  // show first 20
        this.loading = false;
      }
    });
  }

  loadMore() {
    const nextBatch = this.allProfiles.slice(
      this.currentIndex,
      this.currentIndex + this.batchSize
    );
    this.visibleProfiles.push(...nextBatch);
    this.currentIndex += this.batchSize;
  }


}
