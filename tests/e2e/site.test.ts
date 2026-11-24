import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const prefix = (process.env.BASE_PATH || '/hta-modern').replace(/\/$/, '');
const origin = 'http://127.0.0.1:4341';
function htmlRoutes(dir = 'dist'): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) return htmlRoutes(file);
    if (!entry.name.endsWith('.html')) return [];
    const path = relative('dist', file).replaceAll('\\', '/');
    return [`${prefix}/${path === 'index.html' ? '' : path.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`];
  });
}
const routes = htmlRoutes().filter((path) => path !== `${prefix}/decapcms`);

const test = base.extend<{ health: void }>({
  health: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.url().startsWith(origin) && response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });
      page.on('requestfailed', (request) => {
        if (
          request.url().startsWith(origin) &&
          !(
            request.failure()?.errorText.includes('ERR_ABORTED') &&
            (request.isNavigationRequest() || request.headers()['sec-purpose']?.includes('prefetch'))
          )
        )
          errors.push(`Failed ${request.url()}`);
      });
      // No third-party traffic or real submissions. The Google form is a deterministic fixture.
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === origin) return route.continue();
        if (url.hostname === 'docs.google.com')
          return route.fulfill({
            contentType: 'text/html',
            body: '<!doctype html><html lang="en"><head><title>Application fixture</title></head><body><main><h1>Application fixture</h1><label>Name<input name="name"></label></main></body></html>',
          });
        return route.abort();
      });
      await use();
      expect(errors, 'Uncaught errors or failed first-party requests').toEqual([]);
    },
    { auto: true },
  ],
});

for (const path of routes) {
  test(`built route and internal destinations: ${path}`, async ({ page, request }) => {
    await page.goto(path);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const assets = await page
      .locator('img[src], script[src], link[rel=stylesheet]')
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('src') || node.getAttribute('href')).filter(Boolean)
      );
    for (const asset of assets) {
      const url = new URL(asset!, page.url());
      if (url.origin === origin)
        expect((await request.get(url.href)).ok(), `Missing first-party asset ${url.href}`).toBe(true);
    }
    const links = await page
      .locator('a[href]')
      .evaluateAll((anchors) => anchors.map((a) => (a as HTMLAnchorElement).href));
    for (const href of [...new Set(links)]) {
      const url = new URL(href);
      const local = [origin, 'https://heartlandtranspersonalalliance.github.io'].includes(url.origin);
      if (!local) continue;
      expect(url.pathname === prefix || url.pathname.startsWith(prefix + '/'), `Base path escaped by ${href}`).toBe(
        true
      );
      const response = await request.get(`${origin}${url.pathname}${url.search}`);
      expect(response.ok(), `${path} links to ${href}: ${response.status()}`).toBe(true);
      if (url.hash) {
        const html = await response.text();
        // Parse target HTML without executing scripts or requesting external resources.
        const found = await page.evaluate(
          ({ html, fragment }) => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            return (
              !!doc.getElementById(fragment) ||
              [...doc.querySelectorAll('a[name]')].some((a) => a.getAttribute('name') === fragment)
            );
          },
          { html, fragment: decodeURIComponent(url.hash.slice(1)) }
        );
        expect(found, `Missing fragment ${href}`).toBe(true);
      }
    }
  });
}

for (const path of [
  '',
  '/about',
  '/initiatives',
  '/board',
  '/board-app',
  '/contact',
  '/pricing',
  '/services',
  '/war-on-drugs',
  '/bylaws',
  '/code-of-conduct',
]) {
  test(`accessibility: ${path || '/'}`, async ({ page }) => {
    await page.goto(`${prefix}/${path.replace(/^\//, '')}`);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('main journey and contact destinations', async ({ page }) => {
  await page.goto(`${prefix}/`);
  await page.getByRole('link', { name: 'Explore initiatives', exact: true }).click();
  await expect(page).toHaveURL(/\/initiatives$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Our work');
  await expect(page.getByRole('link', { name: 'Visit KCPIC', exact: true })).toHaveAttribute(
    'href',
    'https://kc-psychedelic.com'
  );
  await page.getByRole('link', { name: 'Board of Directors', exact: true }).click();
  await expect(page.getByRole('img', { name: /^Portrait of/ }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Apply Now', exact: true }).click();
  await expect(page).toHaveURL(/\/board-app$/);
  await expect(page.getByRole('link', { name: 'Open application in Google Forms' })).toHaveAttribute(
    'href',
    /^https:\/\/docs.google.com\/forms\//
  );
  await page.getByRole('link', { name: 'Contact', exact: true }).last().click();
  await expect(page.getByRole('link', { name: 'Open your email app' })).toHaveAttribute(
    'href',
    'mailto:info@psychedelickc.org'
  );
  await page.getByRole('link', { name: 'Heartland Transpersonal Alliance', exact: true }).first().click();
  await expect(page).toHaveURL(`${origin}${prefix}/`);
});

test('application loads once and survives client navigation', async ({ page }) => {
  await page.goto(`${prefix}/board-app`);
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByText('Application questions and email option', { exact: true }).click();
  await expect(page.locator('details ol')).toBeVisible();
  await expect(page.locator('details').getByRole('link', { name: 'info@psychedelickc.org' })).toHaveAttribute(
    'href',
    /^mailto:info@psychedelickc.org\?subject=/
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Load Google Form' }).click();
  await expect(page.frameLocator('iframe').getByRole('heading', { name: 'Application fixture' })).toBeVisible();
  await page.getByRole('button', { name: 'Google Form loaded' }).click();
  await expect(page.locator('iframe')).toHaveCount(1);
  await page.getByRole('link', { name: 'Contact', exact: true }).last().click();
  await expect(page).toHaveURL(`${origin}${prefix}/contact`);
  await page.getByRole('link', { name: 'Board Application', exact: true }).click();
  await expect(page).toHaveURL(`${origin}${prefix}/board-app`);
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('button', { name: 'Load Google Form' }).click();
  await expect(page.frameLocator('iframe').getByRole('heading', { name: 'Application fixture' })).toBeVisible();
});

for (const viewport of [
  { width: 320, height: 760 },
  { width: 844, height: 390 },
]) {
  test(`menu and focus at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${prefix}/`);
    const toggle = page.getByRole('button', { name: 'Toggle Menu' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    const apply = page.locator('#mobile-navigation').getByRole('link', { name: 'Apply for Board' });
    await apply.scrollIntoViewIfNeeded();
    const box = await apply.boundingBox();
    expect(box && box.y >= 0 && box.y + box.height <= viewport.height + 1).toBeTruthy();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    // Count visible controls, not links inside closed submenus.
    const controls = await page
      .locator('#mobile-navigation a[href]:visible, #mobile-navigation summary:visible')
      .count();
    for (let i = 0; i <= controls; i++) await page.keyboard.press('Tab');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('body')).not.toHaveClass(/overflow-hidden/);
    await toggle.click();
    await apply.click();
    await expect(page).toHaveURL(/\/board-app$/);
    await expect(page.getByRole('button', { name: 'Toggle Menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('governance pages are reachable and cross-linked', async ({ page }, testInfo) => {
  await page.goto(`${prefix}/`);
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Toggle Menu' }).click();
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' });
    await nav.getByText('Governance', { exact: true }).click();
    await nav.getByRole('link', { name: 'Bylaws', exact: true }).click();
  } else {
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await nav.getByRole('button', { name: 'Governance' }).focus();
    await nav.getByRole('link', { name: 'Bylaws', exact: true }).click();
  }
  await expect(page).toHaveURL(/\/bylaws$/);
  const main = page.getByRole('main');
  await main.getByRole('link', { name: 'Ethical Code of Conduct', exact: true }).click();
  await expect(page).toHaveURL(/\/code-of-conduct$/);
  await main
    .getByRole('navigation', { name: 'On this page' })
    .getByRole('link', { name: 'Independent review and recusal' })
    .click();
  await expect(page).toHaveURL(/#independent-review$/);
  await main.getByRole('link', { name: 'War on Drugs & Restorative Justice', exact: true }).last().click();
  await expect(page).toHaveURL(/\/war-on-drugs$/);
});

// This shipped admin shell requires third-party identity; CI does not authenticate.
test('legacy CMS shell and local configuration', async ({ page, request }) => {
  await page.goto(`${prefix}/decapcms`);
  await expect(page).toHaveTitle('Content Manager');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
  const config = await request.get(`${prefix}/decapcms/config.yml`);
  expect(config.ok()).toBe(true);
  expect(await config.text()).toContain('branch: main');
});

test('dark reading surfaces and primary actions keep contrast', async ({ page, isMobile }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  if (isMobile) await page.setViewportSize({ width: 320, height: 760 });

  const renderedContrast = (element: Element) => {
    const luminance = (value: string) => {
      const [r, g, b] = value
        .match(/\d+(?:\.\d+)?/g)!
        .slice(0, 3)
        .map((channel) => {
          const c = Number(channel) / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const foreground = luminance(getComputedStyle(element).color);
    let surface = element;
    while (surface.parentElement && getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') {
      surface = surface.parentElement;
    }
    const background = luminance(getComputedStyle(surface).backgroundColor);
    return {
      background,
      contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
    };
  };

  await page.goto(`${prefix}/`);
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  const home = await page.locator('body').evaluate(renderedContrast);
  expect(home.background).toBeLessThan(0.12);
  expect(home.contrast).toBeGreaterThanOrEqual(4.5);
  await expect(page.locator('.hta-brand-mark svg')).not.toHaveCSS('fill', 'rgb(0, 0, 0)');
  const action = page.getByRole('link', { name: 'Explore initiatives', exact: true });
  expect((await action.evaluate(renderedContrast)).contrast).toBeGreaterThanOrEqual(4.5);
  if (!isMobile) {
    await action.hover();
    await expect(action).toHaveCSS('background-color', 'rgb(182, 238, 220)');
    expect((await action.evaluate(renderedContrast)).contrast).toBeGreaterThanOrEqual(4.5);
  }
  await page.getByRole('link', { name: 'Privacy', exact: true }).click();
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  const markdown = await page.locator('main .prose p').first().evaluate(renderedContrast);
  expect(markdown.background).toBeLessThan(0.12);
  expect(markdown.contrast).toBeGreaterThanOrEqual(4.5);

  await page.goto(`${prefix}/bylaws`);
  const governance = await page.locator('main .document-body p').first().evaluate(renderedContrast);
  expect(governance.background).toBeLessThan(0.12);
  expect(governance.contrast).toBeGreaterThanOrEqual(4.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
