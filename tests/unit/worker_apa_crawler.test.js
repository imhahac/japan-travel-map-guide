import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Cloudflare Worker APA Crawler Configuration & Parser', () => {
  it('wrangler.toml 應具備正確的名稱、Account ID 與相容性設定', () => {
    const wranglerContent = fs.readFileSync(path.resolve('workers/apa-crawler/wrangler.toml'), 'utf8');
    expect(wranglerContent).toContain('name = "japan-travel-apa-crawler"');
    expect(wranglerContent).toContain('account_id = "02671fd27d5ae23ed6316cc9f43cf113"');
    expect(wranglerContent).toContain('crons =');
    expect(wranglerContent).toContain('https://www.apahotel.com/hotel/');
  });

  it('Worker 模組應正確匯出 fetch 與 scheduled 處理器', async () => {
    const workerModule = await import('../../workers/apa-crawler/src/index.js');
    expect(workerModule.default).toBeDefined();
    expect(typeof workerModule.default.fetch).toBe('function');
    expect(typeof workerModule.default.scheduled).toBe('function');
  });

  it('Worker /health 端點應回傳 online 狀態', async () => {
    const workerModule = await import('../../workers/apa-crawler/src/index.js');
    const mockRequest = new Request('https://worker.test/health');
    const mockEnv = { GAS_WEBHOOK_URL: 'https://mock.script.google.com/test' };

    const res = await workerModule.default.fetch(mockRequest, mockEnv, {});
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('online');
    expect(body.service).toBe('japan-travel-apa-crawler');
    expect(body.hasWebhookConfigured).toBe(true);
  });
});
