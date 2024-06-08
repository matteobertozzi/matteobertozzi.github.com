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
      const html = await marked.parse(this.markdown());
      this.el.nativeElement.innerHTML = html;
    });
  }
}
