import { Component, OnInit, signal, DestroyRef, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Preloader } from './components/preloader/preloader';
import { PreloaderService } from './core/_services/preloader-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Preloader],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {

  protected readonly title = signal('ai-interview');
  private readonly destroyRef = inject(DestroyRef);

  constructor(private router: Router, private preloader: PreloaderService) {}

  ngOnInit(): void {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.preloader.show();
        }
        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.preloader.hide();
        }
      });
  }
}
