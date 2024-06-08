import { AfterViewInit, Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[codeHighlight]',
  standalone: true
})
export class CodeHighlightDirective implements AfterViewInit {

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      (window as any).hljs.highlightAll();
    }, 1);
  }
}
