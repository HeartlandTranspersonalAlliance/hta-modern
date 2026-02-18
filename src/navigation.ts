import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'News',
      href: getBlogPermalink(),
    },
    {
      text: 'Who We Are',
      href: getPermalink('/board'),
    },
    {
      text: 'Initiatives',
      href: getPermalink('/initiatives'),
    },
    {
      text: 'About',
      href: getPermalink('/about'),
    },
    {
      text: 'Contact',
      href: getPermalink('/contact'),
    },
  ],
  actions: [{ text: 'Apply for Board', href: getPermalink('/board-app') }],
};

export const footerData = {
  links: [
    {
      title: 'Organization',
      links: [
        { text: 'About HTA', href: getPermalink('/about') },
        { text: 'Board of Directors', href: getPermalink('/board') },
        { text: 'News', href: getBlogPermalink() },
      ],
    },
    {
      title: 'Programs',
      links: [
        { text: 'Initiatives', href: getPermalink('/initiatives') },
        { text: 'KCPIC', href: 'https://kc-psychedelic.com' },
        { text: 'PSKC', href: 'https://psychedelickc.org' },
        { text: 'Safe Journey Sanctum', href: 'https://safejourneysanctum.org' },
      ],
    },
    {
      title: 'Get Involved',
      links: [
        { text: 'Board Application', href: getPermalink('/board-app') },
        { text: 'Contact', href: getPermalink('/contact') },
        {
          text: 'Facebook',
          href: 'https://www.facebook.com/profile.php?id=61569597747801',
        },
      ],
    },
  ],
  secondaryLinks: [],
  socialLinks: [
    {
      ariaLabel: 'Facebook',
      icon: 'tabler:brand-facebook',
      href: 'https://www.facebook.com/profile.php?id=61569597747801',
    },
    {
      ariaLabel: 'GitHub',
      icon: 'tabler:brand-github',
      href: 'https://github.com/psychedelicsocietyofkansascity/hta-site',
    },
    {
      ariaLabel: 'RSS',
      icon: 'tabler:rss',
      href: getAsset('/rss.xml'),
    },
  ],
  footNote:
    'Heartland Transpersonal Alliance is a registered 501(c)(3) incorporated nonprofit in the State of Missouri.',
};
