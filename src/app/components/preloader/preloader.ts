import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { PreloaderService } from '../../core/_services/preloader-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-preloader',
  imports: [AsyncPipe],
  templateUrl: './preloader.html',
  styleUrl: './preloader.scss',
})
export class Preloader {

  constructor(public preloader: PreloaderService,
              public router: Router
  ) {}

}
