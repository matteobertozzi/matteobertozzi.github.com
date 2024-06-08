export const environment: Environment = {
  title: 'TITLE',
  baseUrl: 'BASE_URL',
  social: {
    email: 'mailto:EMAIL',
    telegram: 'TELEGRAM',
    linkedin: 'LINKEDIN',

    github: 'GITHUB',
    gists: 'GISTS',
    speakerDeck: 'SPEAKERDECK',

    twitter: 'TWITTER',
    rss: 'RSS',
    youtube: 'YOUTUBE',
    twitch: 'TWITCH',
    blogger: 'BLOGGER',
  }
};

interface Environment {
  title: string;
  baseUrl: string;
  social: {
    email: string;
    telegram: string;
    linkedin: string;

    github: string;
    gists: string;
    speakerDeck: string;

    twitter: string;
    rss: string;
    youtube: string;
    twitch: string;
    blogger: string;
  }
}
