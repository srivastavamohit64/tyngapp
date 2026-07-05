import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'qa-screenshots');

const coachUser = JSON.stringify({
  id: 'qa_coach',
  role: 'coach',
  name: 'Coach Arvind',
  isOnboarded: true,
});

const screens = [
  { name: '01-dashboard', path: '/app/coach/dashboard' },
  { name: '02-students', path: '/app/coach/students' },
  { name: '03-schedule', path: '/app/coach/schedule' },
  { name: '04-chat', path: '/app/coach/chat' },
  { name: '05-profile', path: '/app/coach/profile' },
  { name: '06-notifications', path: '/app/coach/notifications' },
  { name: '07-settings', path: '/app/coach/settings' },
  { name: '08-earnings', path: '/app/coach/earnings' },
  { name: '09-insights', path: '/app/coach/insights' },
  { name: '10-book-venue', path: '/app/coach/book-venue' },
  { name: '11-student-detail', path: '/app/coach/student/1' },
  { name: '12-session-detail', path: '/app/coach/session/1' },
  { name: '13-teams', path: '/app/coach/teams' },
  { name: '14-complete-profile', path: '/app/coach/complete-profile' },
];

async function captureApp(baseUrl, prefix) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate((user) => {
    localStorage.setItem('tyng_user', user);
  }, coachUser);

  for (const screen of screens) {
    const url = `${baseUrl.replace(/\/$/, '')}${screen.path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: join(outDir, `${prefix}-${screen.name}.png`),
        fullPage: true,
      });
      console.log(`OK ${prefix} ${screen.name}`);
    } catch (err) {
      console.error(`FAIL ${prefix} ${screen.name}:`, err.message);
    }
  }

  await browser.close();
}

mkdirSync(outDir, { recursive: true });
await captureApp('http://localhost:5173', 'figma');
await captureApp('http://localhost:8100', 'ionic');
console.log('Done. Screenshots in', outDir);
