import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SocialLinkComponent } from '../../components/social-link/social-link.component';
import { BreadcrumbComponent } from "../../components/breadcrumb/breadcrumb.component";
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-blog',
    standalone: true,
    templateUrl: './blog.component.html',
    styleUrl: './blog.component.scss',
    imports: [RouterModule, RouterOutlet, SocialLinkComponent, BreadcrumbComponent]
})
export class BlogComponent {
  readonly social = environment.social;
}
