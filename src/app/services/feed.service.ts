import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  constructor() { }

  async fetchFeedGroups(type: string): Promise<FeedGroup[]> {
    const response = await fetch(`${environment.baseUrl}/assets/${type}/${type}.feed.json`);
    if (response.status !== 200) {
      throw new Error('unable to fetch feed data');
    }

    const items = await response.json() as FeedItem[];
    return groupFeedItems(items);
  }

  async fetchFeedTaggedItems(type: string, tag: string): Promise<FeedGroup[]> {
    const response = await fetch(`${environment.baseUrl}/assets/${type}/${type}.tags.json`);
    if (response.status !== 200) {
      throw new Error('unable to fetch tags data');
    }

    const feed = await response.json() as TaggedFeedItems;
    return groupFeedItems(feed[tag] ?? []);
  }
}


function groupFeedItems(feed: FeedItem[]): FeedGroup[] {
  feed.sort((a, b) => b.timestamp - a.timestamp);

  const groups: FeedGroup[] = [];
  let lastGroup: FeedGroup | null = null;
  for (let i = 0; i < feed.length; ++i) {
    const date = new Date(feed[i].timestamp);

    if (!lastGroup || (lastGroup.date.getFullYear() != date.getFullYear() || lastGroup.date.getMonth() != date.getMonth())) {
      lastGroup = { date: date, items: [] };
      groups.push(lastGroup);
    }

    lastGroup.items.push(feed[i]);
  }

  return groups;
}

export type TaggedFeedItems = Record<string, FeedItem[]>;

export interface FeedGroup {
  date: Date;
  items: FeedItem[];
}

export interface FeedItem {
  timestamp: number;
  id: string;
  title: string;
  tags: string[];
}
