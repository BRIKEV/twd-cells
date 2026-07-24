import { twd, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { visit } from './support.js';

describe('Not found page', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    localStorage.clear();
  });

  it('renders the "Page not found" message', async () => {
    await visit('/not-found');

    twd.should(await screenDom.findByRole('heading', { name: 'Page not found' }), 'be.visible');
  });
});
