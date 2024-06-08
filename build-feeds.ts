const BLOG_URL = 'https://matteobertozzi.github.io';
const ASSETS_DIR = 'public/assets';

interface PostId {
  id: string;
  title: string;
  timestamp: number;
  tags: string[];
}

async function scanPosts(posts: PostId[], path: string) {
  for await (const dirEntry of Deno.readDir(path)) {
    if (dirEntry.name[0] == '.') continue;

    const itemPath = path + '/' + dirEntry.name;
    if (dirEntry.isFile) {
      console.log('processing', itemPath);
      const text = await Deno.readTextFile(itemPath);
      const startHead = text.indexOf('---') + 3;
      const endHead = text.indexOf('---', startHead);
      const head = JSON.parse(text.substring(startHead, endHead));

      posts.push({id: dirEntry.name.substring(0, dirEntry.name.length - 3), ...head });
    } else if (dirEntry.isDir) {
      scanPosts(posts, itemPath);
    }
  }
}

function buildSiteMap(feedPosts: {string: PostId[]}): string {
  const sitemap = [];
  sitemap.push('<?xml version="1.0" encoding="UTF-8"?>');
  sitemap.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  let lastTimestamp = 0;
  for (const [feedName, posts] of Object.entries(feedPosts)) {
    for (const post of posts) {
      lastTimestamp = Math.max(lastTimestamp, post.timestamp);
      sitemap.push(`
      <url>
        <loc>${BLOG_URL}/#/${feedName}/${post.id}</loc>
        <lastmod>${new Date(post.timestamp).toISOString()}</lastmod>
      </url>`);
    }
  }
  sitemap.push(`
  <url>
		<loc>${BLOG_URL}</loc>
		<lastmod>${new Date(lastTimestamp).toISOString()}</lastmod>
	</url>`)
  sitemap.push('</urlset>');
  return sitemap.join('');
}

function buildRssFeed(posts: PostId[]): string {
  const rss = [];
  rss.push('<rss xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">');
  rss.push(`
<channel>
  <title>Th30z (Matteo Bertozzi Code)</title>
  <link>${BLOG_URL}/</link>
  <description>Th30z blog posts and code</description>
  <language>en-us</language>
  <copyright>© 2012 - 2024 Matteo Bertozzi</copyright>
  <lastBuildDate>${new Date(posts[0].timestamp).toUTCString()}</lastBuildDate>
  <atom:link href="${BLOG_URL}/#/posts.xml" rel="self" type="application/rss+xml"/>
`);
  for (const post of posts) {
    rss.push(`
  <item>
    <title>${post.title}</title>
    <link>${BLOG_URL}/#/blog/post/${post.id}</link>
    <pubDate>${new Date(post.timestamp).toUTCString()}</pubDate>
    <guid>${BLOG_URL}/#/blog/post/${post.id}</guid>
  </item>
  `);
  }
  rss.push('</channel>');
  rss.push('</rss>');
  return rss.join('\n');
}

function buildTagIndex(posts: PostId[]): string {
  const tagIndex = new Map<string, PostId[]>();
  for (const post of posts) {
    console.log('post', post);
    for (const tag of (post.tags ?? [])) {
      let items = tagIndex.get(tag);
      if (!items) {
        items = [];
        tagIndex.set(tag, items);
      }
      items.push(post);
    }
  }
  return Object.fromEntries(tagIndex);
}

const feedNames = ['blog'];
for (const feedName of feedNames) {
  const feed: PostId = [];
  await scanPosts(feed, `${ASSETS_DIR}/${feedName}/posts`);
  feed.sort((a, b) => b.timestamp - a.timestamp);
  Deno.writeTextFile(`${ASSETS_DIR}/${feedName}/${feedName}.feed.json`, JSON.stringify(feed, null, 2));
  Deno.writeTextFile(`${ASSETS_DIR}/${feedName}/${feedName}.tags.json`, JSON.stringify(buildTagIndex(feed), null, 2));

  Deno.writeTextFile(`./${feedName}.xml`, buildRssFeed(feed));
}

const feedPosts = {};
for (const feedName of feedNames) {
  const feed: PostId = [];
  await scanPosts(feed, `${ASSETS_DIR}/${feedName}/posts`);
  feed.sort((a, b) => b.timestamp - a.timestamp);
  feedPosts[feedName] = feed;
}

Deno.writeTextFile(`./sitemap.xml`, buildSiteMap(feedPosts));