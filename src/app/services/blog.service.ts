import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  constructor() { }

  async fetchPost(postId: string): Promise<BlogPostData> {
    const result = await fetch(`${environment.baseUrl}/assets/blog/posts/${postId}.md`);
    if (result.status != 200) {
      throw new Error('unable to fetch post: ' + postId);
    }

    const text = await result.text();
    const startHead = text.indexOf('---') + 3;
    const endHead = text.indexOf('---', startHead);
    const head = JSON.parse(text.substring(startHead, endHead));
    const body = replaceMarkdownVariables(text.substring(endHead + 4).trimStart());
    return { ...head, body } as BlogPostData;
  }
}

function replaceMarkdownVariables(text: string): string {
  text = text.replaceAll('${blog.baseUrl}', environment.baseUrl);
  return text;
}

export interface BlogPostData {
  title: string;
  timestamp: number;
  tags: string[];
  body: string;
}
