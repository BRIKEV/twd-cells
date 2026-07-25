import { defineConfig } from 'vite';
import { twd } from 'twd-js/vite-plugin';
import istanbul from 'vite-plugin-istanbul';

// Coverage is opt-in: `npm run dev:ci` sets COVERAGE=true, which adds Istanbul
// instrumentation so the app exposes `window.__coverage__`. `npm run dev` is the
// normal, un-instrumented server. twd-cli collects `window.__coverage__` as it
// already does (no TWD/twd-cli changes) and `npx nyc report` turns it into a
// coverage report.
const withCoverage = process.env.COVERAGE === 'true';

export default defineConfig({
  plugins: [
    // TWD sidebar + request mocking, discovered in dev. Replaces the manual
    // initTWD() snippet in index.html.
    twd({
      testFilePattern: '/**/*.twd.test.{js,ts}',
      open: true,
      position: 'left',
      search: true,
      serviceWorker: true,
      serviceWorkerUrl: '/mock-sw.js',
      rootSelector: '#app-content',
    }),
    withCoverage &&
      istanbul({
        include: 'src/**/*',
        exclude: ['node_modules', 'src/twd-tests/**'],
        extension: ['.ts', '.js'],
      }),
  ],
});
