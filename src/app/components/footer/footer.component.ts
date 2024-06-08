import { Component } from '@angular/core';
import { SocialLinkComponent } from "../social-link/social-link.component";
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  imports: [RouterModule, SocialLinkComponent]
})
export class FooterComponent {
  readonly social = environment.social;
  readonly title = environment.title;
}
