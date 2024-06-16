import { Directive, ElementRef, OnChanges, SimpleChanges, effect, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Directive({
  selector: '[markdown]',
  standalone: true
})
export class MarkdownDirective {
  markdown = input.required<string>();

  constructor(private el: ElementRef) {
    effect(async () => {
      console.log('effect markdown');
      let html = await marked.parse(this.markdown());

      // Regex to match <a> tags and add target="_blank" if not present
      const regex = /<a\s+([^>]*?)\s*(?<!target\s*=\s*['"][^'"]*['"])\s*(\/?)>/gi;
      html = html.replace(regex, '<a $1 target="_blank" $2>');

      this.el.nativeElement.innerHTML = html;
    });
  }
}
