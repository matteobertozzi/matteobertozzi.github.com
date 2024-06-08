import { Routes } from '@angular/router';
import { BlogComponent } from './pages/blog/blog.component';
import { BlogPostComponent } from './pages/blog/blog-post/blog-post.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { BlogFeedComponent } from './pages/blog/blog-feed/blog-feed.component';

export const routes: Routes = [
  {
    path: 'blog', component: BlogComponent, children: [
      { path: 'post/:postId', component: BlogPostComponent },
      { path: '', pathMatch: 'full', component: BlogFeedComponent },
      { path: '**', component: NotFoundComponent },
    ]
  },

  { path: '**', redirectTo: 'blog' },
];
