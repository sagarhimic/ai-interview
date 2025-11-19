import { Component, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Menu } from '../menu/menu';
import { CommonModule } from '@angular/common';
import { Toggle } from '../../core/_services/toggle';

@Component({
  selector: 'app-recruiter-layout',
  imports: [RouterOutlet, Header, Menu, CommonModule],
  templateUrl: './recruiter-layout.html',
  styleUrl: './recruiter-layout.scss',
})

export class RecruiterLayout {

  // isSidebarToggled
      isSidebarToggled = false;
  
      // isToggled
      isToggled = false;
  
      constructor(
        private renderer: Renderer2,
          private toggleService: Toggle
      ) {
          this.toggleService.isSidebarToggled$.subscribe(isSidebarToggled => {
              this.isSidebarToggled = isSidebarToggled;
          });
      }


    ngOnInit() {
        // Add recruiter body class for all recruiter pages
        this.renderer.addClass(document.body, 'recruiter-mode');
    }

    ngOnDestroy() {
        // Remove class when leaving recruiter area
        this.renderer.removeClass(document.body, 'recruiter-mode');
    }

  
    // Burger Menu Toggle
    toggle() {
        this.toggleService.toggle();
    }

}

