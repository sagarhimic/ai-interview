import { Component, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { Preloader } from './components/preloader/preloader';
import { PreloaderService } from './core/_services/preloader-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Preloader],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  private sub: Subscription;

  protected readonly title = signal('ai-interview');

  constructor(private router: Router, private preloader: PreloaderService) {

    this.sub = this.router.events.subscribe(event => {
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

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
