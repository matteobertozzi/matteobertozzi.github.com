import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'social-link',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-link.component.html',
  styleUrl: './social-link.component.scss'
})
export class SocialLinkComponent {
  type = input.required<string>();
  link = input.required<string>();
  icon = computed(() => {
    const type = this.type();
    const icon = SOCIAL_BOOTSTRAP_ICON[type];
    return icon ?? 'bi-' + type;
  });
  name = computed(() => {
    const type = this.type();
    return type[0].toUpperCase() + type.substring(1);
  });
}

const SOCIAL_BOOTSTRAP_ICON: Record<string, string> = {
  'rss': 'bi-rss-fill',
  'email': 'bi-envelope-fill',
  'speaker-deck': 'bi-easel-fill',
  'blogger': 'bi-newspaper',
  'gists': 'bi-braces',
};
