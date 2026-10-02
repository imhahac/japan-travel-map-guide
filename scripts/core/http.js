/**
 * =========================================================================
 * 網路請求核心模組 (HTTP Client Module)
 * =========================================================================
 * 提供瀏覽器級 User-Agent 偽裝、Exponential Backoff 指數退避重試與超時保護。
 */

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/**
 * 具備重試機制與超時控制的 fetch 函式
 * @param {string} url 請求目標網址
 * @param {object} [options={}] fetch 選項
 * @param {number} [options.maxRetries=3] 最大重試次數
 * @param {number} [options.timeoutMs=15000] 超時毫秒數
 * @param {number} [options.retryDelayMs=1000] 初始重試延遲（毫秒）
 * @returns {Promise<Response>}
 */
export async function safeFetch(url, options = {}) {
  const {
    maxRetries = 3,
    timeoutMs = 15000,
    retryDelayMs = 1000,
    headers = {},
    ...restOptions
  } = options;

  const requestHeaders = {
    'User-Agent': DEFAULT_USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
    'Accept-Language': 'ja,zh-TW;q=0.9,en;q=0.8',
    ...headers
  };

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
        signal: controller.signal
      });

      clearTimeout(timer);

      if (response.ok) {
        return response;
      }

      // 若遇到 429 Too Many Requests 或 5xx Server Error 則進行重試
      if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
        const delay = retryDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[HTTP] 請求 ${url} 回應狀態 ${response.status}，第 ${attempt}/${maxRetries} 次重試於 ${delay}ms 後...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      return response; // 404 或其他非重試錯誤直接返回
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const delay = retryDelayMs * Math.pow(2, attempt - 1);
      console.warn(`[HTTP] 請求 ${url} 發生錯誤 (${err.message})，第 ${attempt}/${maxRetries} 次重試於 ${delay}ms 後...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw new Error(`[HTTP] 請求 ${url} 在重試 ${maxRetries} 次後失敗: ${lastError ? lastError.message : '未知錯誤'}`);
}
