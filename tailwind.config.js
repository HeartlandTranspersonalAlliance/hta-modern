import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';
import typographyPlugin from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,json,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--aw-color-primary)',
        secondary: 'var(--aw-color-secondary)',
        accent: 'var(--aw-color-accent)',
        default: 'var(--aw-color-text-default)',
        muted: 'var(--aw-color-text-muted)',
        hta: {
          cyan: 'var(--hta-logo-cyan)',
          blue: 'var(--hta-logo-blue)',
          blueDark: 'var(--hta-logo-navy)',
          yellow: 'var(--hta-logo-yellow)',
          ink: 'var(--hta-ink)',
          institutional: 'var(--hta-institutional)',
          research: 'var(--hta-research)',
          education: 'var(--hta-education)',
          harmReduction: 'var(--hta-harm-reduction)',
          community: 'var(--hta-community)',
          integration: 'var(--hta-integration)',
          gold: 'var(--hta-logo-yellow)',
          coral: '#FF7A59',
          text: 'var(--hta-text)',
          muted: 'var(--hta-text-muted)',
        },
      },
      fontFamily: {
        sans: ['var(--aw-font-sans, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
        serif: ['var(--aw-font-serif, ui-serif)', ...defaultTheme.fontFamily.serif],
        heading: ['var(--aw-font-heading, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
      },

      animation: {
        fade: 'fadeInUp 1s both',
      },

      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(2rem)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    typographyPlugin,
    plugin(({ addVariant }) => {
      addVariant('intersect', '&:not([no-intersect])');
    }),
  ],
  darkMode: 'class',
};
