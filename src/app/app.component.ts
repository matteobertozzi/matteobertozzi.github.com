import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SocialLinkComponent } from './components/social-link/social-link.component';
import { FooterComponent } from "./components/footer/footer.component";
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [RouterModule, RouterOutlet, SocialLinkComponent, FooterComponent]
})
export class AppComponent {
  readonly social = environment.social;
  readonly title = environment.title;
}
