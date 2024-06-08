import { Component, input, output } from '@angular/core';

@Component({
  selector: 'page-content',
  standalone: true,
  imports: [],
  templateUrl: './page-content.component.html',
  styleUrl: './page-content.component.scss'
})
export class PageContentComponent {
  ContentState = PageContentState;

  state = input<PageContentState>(PageContentState.LOADING);
  reloadContent = output<void>();

  reloadPage() {
    this.reloadContent.emit();
  }
}

export enum PageContentState {
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  FAILED = 'FAILED'
}
