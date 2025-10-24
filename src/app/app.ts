import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Inverview } from "./inverview/inverview";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Inverview],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ai-interview');
}
