import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { Toggle } from '../../core/_services/toggle';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';


interface MenuItem {
    title: string;
    subItems?: MenuItem[];
}

@Component({
  selector: 'app-menu',
  imports: [RouterLink, CommonModule, RouterModule, NgScrollbarModule],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu {

    // isSidebarToggled
    isSidebarToggled = false;

    // isToggled
    isToggled = false;

    constructor(
        private toggleService: Toggle
    ) {
        this.toggleService.isSidebarToggled$.subscribe(isSidebarToggled => {
            this.isSidebarToggled = isSidebarToggled;
        });
    }

    // Burger Menu Toggle
    toggle() {
        this.toggleService.toggle();
    }

    // Accordion
    openSectionIndex: number = -1;
    openSectionIndex2: number = -1;
    openSectionIndex3: number = -1;
    toggleSection(index: number): void {
        if (this.openSectionIndex === index) {
            this.openSectionIndex = -1;
        } else {
            this.openSectionIndex = index;
        }
    }
    toggleSection2(index: number): void {
        if (this.openSectionIndex2 === index) {
            this.openSectionIndex2 = -1;
        } else {
            this.openSectionIndex2 = index;
        }
    }
    toggleSection3(index: number): void {
        if (this.openSectionIndex3 === index) {
            this.openSectionIndex3 = -1;
        } else {
            this.openSectionIndex3 = index;
        }
    }
    isSectionOpen(index: number): boolean {
        return this.openSectionIndex === index;
    }
    isSectionOpen2(index: number): boolean {
        return this.openSectionIndex2 === index;
    }
    isSectionOpen3(index: number): boolean {
        return this.openSectionIndex3 === index;
    }

}