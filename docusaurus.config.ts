// Built by Epicmetry FZCO · Dubai · https://epicmetry.com

import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Al Rais Platform',
  tagline: 'How Al Rais thinks about travel',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // For custom domain, set url to 'https://docs.alrais.com' and baseUrl to '/'
  url: 'https://hadyem26.github.io',
  baseUrl: '/alrais-docs/',

  organizationName: 'HadyEM26',
  projectName: 'alrais-docs',
  trailingSlash: false,
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Al Rais Platform',
      logo: {
        alt: 'Al Rais Platform Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/Epicmetry',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Al Rais Holidays & Tours',
          items: [
            {
              label: 'Documentation',
              to: '/',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/Epicmetry',
            },
            {
              label: 'Status Page',
              href: '#',
            },
            {
              label: 'Contact',
              href: '#',
            },
          ],
        },
        {
          title: 'Epicmetry',
          items: [
            {
              label: 'Built and maintained by Epicmetry FZCO',
              href: 'https://epicmetry.com',
            },
          ],
        },
      ],
      copyright: `© Al Rais Holidays & Tours. Platform powered by Epicmetry.`,
    },
    prism: {
      theme: prismThemes.github,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
