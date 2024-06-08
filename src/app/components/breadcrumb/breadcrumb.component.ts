import { Component, Signal, signal } from '@angular/core';
import { BreadcrumbService, PageId } from '../../services/breadcrumb.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
  currentPage: Signal<PageId | null>;

  constructor(private breadcrumbService: BreadcrumbService) {
    this.currentPage = this.breadcrumbService.currentPage;
  }
}
