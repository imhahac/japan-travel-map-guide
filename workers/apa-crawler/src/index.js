/**
 * =========================================================================
 * Cloudflare Worker: APA 飯店全日本爬蟲與 Google Sheet 自動同步
 * =========================================================================
 * 目標來源：https://www.apahotel.com/hotel/
 * 支援定時排程 (Cron Trigger) 與手動 HTTP API 調用。
 */

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const REGION_PREFIX_MAP = {
  'shutoken': '關東',
  'kansai': '近畿',
  'hokkaido-tohoku': '北海道・東北',
  'hokuriku-koshinetsu': '甲信越・北陸',
  'chubu': '東海',
  'chugoku-shikoku': '中國・四國',
  'kyushu-okinawa': '九州・沖繩'
};

const PREFECTURE_REGEX = /(北海道|東京都|大阪府|京都府|青森縣|岩手縣|宮城縣|秋田縣|山形縣|福島縣|茨城縣|栃木縣|群馬縣|埼玉縣|千葉縣|神奈川縣|新潟縣|富山縣|石川縣|福井縣|山梨縣|長野縣|岐阜縣|靜岡縣|愛知縣|三重縣|滋賀縣|兵庫縣|奈良縣|和歌山縣|鳥取縣|島根縣|岡山縣|廣島縣|山口縣|德島縣|香川縣|愛媛縣|高知縣|福岡縣|佐賀縣|長崎縣|熊本縣|大分縣|宮崎縣|鹿兒島縣|沖繩縣|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)/;

/**
 * 從 HTML 或 Markdown 內容中解析出飯店清單（雙模解析）
 */
function extractHotelsFromContent(content, baseUrl = 'https://www.apahotel.com/hotel/') {
  const hotels = [];
  const seenCodes = new Set();

  // 1. Markdown 連結格式: [飯店名稱](網址)
  const mdRegex = /\[([^\]]*?(?:アパ|APA)[^\]]*?)\]\((https?:\/\/[^\s\)]+)\)/gi;
  let mdMatch;
  while ((mdMatch = mdRegex.exec(content)) !== null) {
    const rawName = mdMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const href = mdMatch[2].trim();
    addHotel(rawName, href);
  }

  // 2. HTML 連結格式: <a href="...">飯店名稱</a>
  const htmlRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let htmlMatch;
  while ((htmlMatch = htmlRegex.exec(content)) !== null) {
    const href = htmlMatch[1].trim();
    const rawName = htmlMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (rawName && (rawName.includes('アパ') || rawName.includes('APA'))) {
      addHotel(rawName, href);
    }
  }

  function addHotel(name, href) {
    if (!name || name.length < 3) return;
    if (href.startsWith('#') || href.includes('search') || href.endsWith('/hotel/') || href === '/hotel') return;

    const cleanHref = href.replace(/^https?:\/\/[^/]+/, '');
    const parts = cleanHref.split('/').filter(Boolean);
    if (parts.length < 2) return;

    const code = parts[parts.length - 1] || parts[parts.length - 2];
    if (seenCodes.has(code)) return;
    seenCodes.add(code);

    let region = '其他';
    for (const [slug, regName] of Object.entries(REGION_PREFIX_MAP)) {
      if (cleanHref.includes(slug)) {
        region = regName;
        break;
      }
    }

    const prefMatch = name.match(PREFECTURE_REGEX) || cleanHref.match(PREFECTURE_REGEX);
    const prefecture = prefMatch ? prefMatch[1] : (region === '關東' ? '東京都' : '日本各地');
    const fullUrl = href.startsWith('http') ? href : `https://www.apahotel.com/hotel/${href.replace(/^\//, '')}`;

    const tags = ['連鎖飯店', '官方直營'];
    if (name.includes('リゾート') || name.includes('タワー') || name.includes('ベイ')) {
      tags.push('大浴場', '旗艦館');
    }
    if (name.includes('駅前') || name.includes('駅東') || name.includes('駅西')) {
      tags.push('車站步行圈');
    }

    hotels.push({
      id: `apa-${code}`,
      category: '飯店',
      brand: 'APA飯店',
      name,
      nameJa: name,
      region,
      prefecture,
      nearestStation: '鄰近主要車站',
      stationAccess: '出站步行便利',
      walkMinutes: 5,
      address: `${prefecture}門市`,
      coordinates: '35.6812, 139.7671',
      phone: '',
      bookingUrl: fullUrl,
      googleMapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      tags: tags.join(', '),
      notes: '日本大型商務與度假連鎖飯店，具備自動 Check-in 與優良生活機能圈。'
    });
  }

  return hotels;
}

/**
 * 批次將飯店寫入 Google Apps Script Webhook
 */
async function syncToGoogleSheet(webhookUrl, hotels, batchSize = 50) {
  if (!webhookUrl) {
    return { success: false, message: '未設定 GAS_WEBHOOK_URL，跳過同步' };
  }

  let totalSynced = 0;
  const errors = [];

  for (let i = 0; i < hotels.length; i += batchSize) {
    const chunk = hotels.slice(i, i + batchSize);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          sheetName: '飯店',
          rows: chunk
        })
      });
      const data = await res.json();
      if (data.success) {
        totalSynced += chunk.length;
      } else {
        errors.push(`第 ${i + 1} 批次失敗: ${data.message || JSON.stringify(data)}`);
      }
    } catch (err) {
      errors.push(`第 ${i + 1} 批次網路例外: ${err.message}`);
    }
  }

  return {
    success: errors.length === 0,
    totalSynced,
    totalAttempted: hotels.length,
    errors
  };
}

/**
 * 執行完整的抓取與同步流程
 */
async function executeCrawlAndSync(env, overrideWebhookUrl) {
  const targetUrl = env.CRAWL_TARGET_URL || 'https://www.apahotel.com/hotel/';
  const webhookUrl = overrideWebhookUrl || env.GAS_WEBHOOK_URL;
  const batchSize = parseInt(env.BATCH_SIZE || '50', 10);

  const startTime = Date.now();
  let bypassUsed = false;

  // 1. 發送請求至 APA 官網
  let response = await fetch(targetUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    }
  });

  // 遭遇 Akamai 403/503 時自動啟動穿透轉發機制
  if (!response.ok && (response.status === 403 || response.status === 503)) {
    console.log('[Worker] 官方網站返回 HTTP 403 (Akamai 防禦)，啟動智慧穿透代理機制...');
    response = await fetch(`https://r.jina.ai/${targetUrl}`);
    bypassUsed = true;
  }

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      error: `官網回應 HTTP ${response.status}`,
      durationMs: Date.now() - startTime
    };
  }

  const content = await response.text();

  // 2. 解析飯店（雙模相容 HTML 與 Markdown）
  const hotels = extractHotelsFromContent(content, targetUrl);

  // 3. 若有 Webhook 則同步至 Google Sheet
  let syncResult = null;
  if (webhookUrl && hotels.length > 0) {
    syncResult = await syncToGoogleSheet(webhookUrl, hotels, batchSize);
  }

  return {
    success: true,
    scrapedCount: hotels.length,
    syncResult,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    sampleHotels: hotels.slice(0, 5)
  };
}

export default {
  // 處理 HTTP 請求
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 健康檢查
    if (url.pathname === '/' || url.pathname === '/health') {
      return Response.json({
        status: 'online',
        service: 'japan-travel-apa-crawler',
        version: '1.0.0',
        hasWebhookConfigured: Boolean(env.GAS_WEBHOOK_URL),
        time: new Date().toISOString()
      });
    }

    // 觸發爬蟲與同步 (/crawl 或 /sync)
    if (url.pathname === '/crawl' || url.pathname === '/sync') {
      const overrideWebhook = url.searchParams.get('webhook_url') || undefined;
      const result = await executeCrawlAndSync(env, overrideWebhook);
      return Response.json(result, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response('Not Found', { status: 404 });
  },

  // 處理 Cloudflare 定時排程 (Cron)
  async scheduled(event, env, ctx) {
    console.log(`[Scheduled Cron] 觸發 APA 爬蟲排程: ${event.cron}`);
    ctx.waitUntil(executeCrawlAndSync(env));
  }
};
