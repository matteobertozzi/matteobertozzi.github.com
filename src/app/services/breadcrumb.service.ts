import { Injectable, signal } from '@angular/core';
import { ActivatedRoute, ActivationEnd, ChildActivationEnd, Params, Router, createUrlTreeFromSnapshot } from '@angular/router';
import { routes } from '../app.routes';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  currentPage = signal<PageId | null>(null);

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof ActivationEnd) {
        this.resetCurrentPage();
      }
    });
  }

  private setCurrentPage(page: PageId): void {
    this.currentPage.set(page);
  }

  setCurrentPageTitle(title: string): void {
    const url = getUrlFromActiveRoute(this.route);
    const queryParams = this.route.snapshot.queryParams;
    this.setCurrentPage({ title, url, queryParams });
  }

  resetCurrentPage(): void {
    this.currentPage.set(null);
  }
}

function getUrlFromActiveRoute(active: ActivatedRoute) {
  const routes: ActivatedRoute[] = [];
  let route: ActivatedRoute | null = active;
  while (route) {
    routes.splice(0, 0, route);
    route = route.parent;
  }

  const urlSegments = [];
  for (const route of routes) {
    const partUrl = route.snapshot.url;
    for (const part of partUrl) {
      urlSegments.push(part.path);
    }
  }
  return urlSegments;
}

export interface PageId {
  title: string;
  url: string[];
  queryParams?: Params;
}