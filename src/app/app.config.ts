import { ApplicationConfig, Injectable, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy, provideRouter, withHashLocation } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { routes } from './app.routes';

@Injectable()
export class AppTitlePrefix extends TitleStrategy {
  updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot); // build the current route title
    if (title) {
      this.title.setTitle(`App - ${title}`); // set the app prefix with the current title.
    }
  }
  constructor(private title: Title) { // inject the title service
    super();
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    //provideRouter(routes),
  ]
};
