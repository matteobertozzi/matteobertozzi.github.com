import { Component, OnInit, effect, signal } from '@angular/core';
import { PageContentComponent, PageContentState } from '../../../components/page-content/page-content.component';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BreadcrumbService } from '../../../services/breadcrumb.service';
import { BlogPostData, BlogService } from '../../../services/blog.service';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';
import { CodeHighlightDirective } from '../../../directives/code-highlight.directive';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterModule, PageContentComponent, CodeHighlightDirective],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
})
export class BlogPostComponent implements OnInit {
  state = signal<PageContentState>(PageContentState.LOADING);

  postId?: string | null;
  blogPost = signal<BlogPostData | null>(null);
  body = signal<string | Promise<string>>('');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly blogService: BlogService,
  ) {
  }

  ngOnInit(): void {
    this.reloadContent();
  }

  reloadContent(): void {
    this.state.set(PageContentState.LOADING);

    const postId = this.route.snapshot.paramMap.get('postId')!;
    console.log(this.postId, this.route.snapshot.params);

    this.postId = postId;
    this.loadPostMarkdown(postId).then(result => {
      this.body.set(result.content);
      this.blogPost.set(result.post);
      this.breadcrumbService.setCurrentPageTitle(result.post.title);
      this.state.set(PageContentState.LOADED);
    }).catch(error => {
      this.breadcrumbService.setCurrentPageTitle('Not Found');
      this.state.set(PageContentState.FAILED);
    });
  }

  async loadPostMarkdown(postId: string): Promise<{ post: BlogPostData, content: string }> {
    const post = await this.blogService.fetchPost(postId);
    const content = await marked.parse(post.body);
    return {post, content};
  }
}
