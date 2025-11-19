import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Token } from '../../core/_services/token';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Toggle } from '../../core/_services/toggle';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {

  // isSidebarToggled
  isSidebarToggled = false;

  // isToggled
  isToggled = false;

  loggedInUser: any;

  constructor(
    private _token: Token,
    private toggleService: Toggle,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
        this.toggleService.isSidebarToggled$.subscribe(isSidebarToggled => {
            this.isSidebarToggled = isSidebarToggled;
        });
        // Subscribe to router events to toggle the sidebar on navigation
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            // Check if the sidebar is currently toggled and if so, toggle it
            if (this.isSidebarToggled) {
                this.toggleService.toggle(); // Close the sidebar if it's open
            }
        });
    }


    ngOnInit(): void {
        this.loggedInUser = this._token.getUserData();

        console.log('Logged in user data:', this.loggedInUser);

        // Example: Access specific properties
        if (this.loggedInUser) {
            const userName = this.loggedInUser.user.name; // Adjust based on actual property names
            const userEmail = this.loggedInUser.user.email; // Adjust based on actual property names
            const userEmpId = this.loggedInUser.user.employee_id; // Adjust based on actual property names
        }
    }
    

    // Burger Menu Toggle
    toggle() {
        this.toggleService.toggle();
    }


    // Dark Mode
    toggleTheme() {
        //this.themeService.toggleTheme();
    }

    // Header Sticky
    isSticky: boolean = false;
    @HostListener('window:scroll')
    checkScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollPosition >= 50) {
            this.isSticky = true;
        } else {
            this.isSticky = false;
        }
    }

    // Dropdown Menu
    isConnectedAppsDropdownOpen = false;
    isLanguageDropdownOpen = false;
    isNotificationsDropdownOpen = false;
    isProfileDropdownOpen = false;
    toggleConnectedAppsDropdown() {
        this.isConnectedAppsDropdownOpen = !this.isConnectedAppsDropdownOpen;
    }
    toggleLanguageDropdown() {
        this.isLanguageDropdownOpen = !this.isLanguageDropdownOpen;
    }
    toggleNotificationsDropdown() {
        this.isNotificationsDropdownOpen = !this.isNotificationsDropdownOpen;
    }
    toggleProfileDropdown() {
        this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    }
    @HostListener('document:click', ['$event'])
    handleClickOutside(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.connected-apps-menu')) {
            this.isConnectedAppsDropdownOpen = false;
        }
        if (!target.closest('.language-menu')) {
            this.isLanguageDropdownOpen = false;
        }
        if (!target.closest('.notifications-menu')) {
            this.isNotificationsDropdownOpen = false;
        }
        if (!target.closest('.profile-menu')) {
            this.isProfileDropdownOpen = false;
        }
    }



  logout() {
    const modalBackdrop = document.querySelector('.modal-backdrop');
    modalBackdrop?.remove();
    
    this._token.logout();
  }

}