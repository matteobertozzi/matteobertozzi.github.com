import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { PageContentComponent, PageContentState } from "../../../components/page-content/page-content.component";
import { FeedGroup, FeedService } from '../../../services/feed.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BreadcrumbService } from '../../../services/breadcrumb.service';

@Component({
  selector: 'app-blog-feed',
  standalone: true,
  templateUrl: './blog-feed.component.html',
  styleUrl: './blog-feed.component.scss',
  imports: [CommonModule, RouterModule, PageContentComponent]
})
export class BlogFeedComponent implements OnInit, OnDestroy {
  state = signal<PageContentState>(PageContentState.LOADING);
  feed = signal<FeedGroup[]>([]);

  private routerSub?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly feedService: FeedService
  ) { }

  ngOnInit(): void {
    this.routerSub = this.route.queryParams.subscribe(data => {
      this.reloadContent();
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  reloadContent(): void {
    this.state.set(PageContentState.LOADING);

    const tag = this.route.snapshot.queryParamMap.get('tag');
    let fetchFeed;
    if (tag) {
      fetchFeed = this.feedService.fetchFeedTaggedItems('blog', tag);
      this.breadcrumbService.setCurrentPageTitle('Feed: #' + tag);
    } else {
      fetchFeed = this.feedService.fetchFeedGroups('blog');
    }

    fetchFeed.then(feed => {
      this.feed.set(feed);
      this.state.set(PageContentState.LOADED);
    }).catch(error => {
      this.state.set(PageContentState.FAILED);
    });
  }
}
