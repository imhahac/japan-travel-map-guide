# 專案部署與維運手冊 (Deployment & Operations Manual)

> **目標**：提供最詳盡、零猜測（零通靈）的部署與設定指南。任何人依照本文件之逐步圖文引導，皆可在 10 分鐘內完成 GitHub Pages 靜態網站、GitHub Actions 自動化工作流與 Google Apps Script 雲端同步之全套部署。

---

## 目錄
1. [系統架構與環境要求](#一系統架構與環境要求)
2. [本地開發與測試環境設置](#二本地開發與測試環境設置)
3. [GitHub Pages 部署全步驟（零通靈）](#三github-pages-部署全步驟零通靈)
4. [GitHub Repository Secrets & Variables 設定表](#四github-repository-secrets--variables-設定表)
5. [GitHub Actions 工作流總覽](#五github-actions-工作流總覽)
6. [疑難排解與常見問題 (FAQ)](#六疑難排解與常見問題-faq)

---

## 一、系統架構與環境要求

本系統採用現代化前端 JAMstack 架構：
- **前端運行環境**：React 19 + Vite 8 + Leaflet 1.9 + MarkerCluster
- **打包與建置**：Node.js >= 20（GitHub Actions 使用 Node 24 LTS）
- **單元與整合測試**：Vitest 5 + Testing Library + jsdom
- **靜態主機代管**：GitHub Pages（由 GitHub Actions 自動建置與發佈）
- **雲端資料庫**：Google Sheets（雙向同步，支援離線 Seed JSON 備援防護）

---

## 二、本地開發與測試環境設置

### 1. 複製專案與安裝相依套件
```bash
# 複製專案
git clone https://github.com/imhahac/japan-travel-map-guide.git
cd japan-travel-map-guide

# 安裝相依模組
npm install
```

### 2. 本地開發伺服器
```bash
npm run dev
```
啟動後於瀏覽器開啟 `http://localhost:5173/` 即可進行即時預覽，支援 Vite HMR (熱模組替換)。

### 3. 本地執行品質測試
```bash
# 執行全部單元測試與整合測試（10 套件、65 項測資）
npm test

# 執行程式碼靜態分析
npm run lint

# 執行資料產生器與生產環境建置檢查
npm run build
```

---

## 三、GitHub Pages 部署全步驟（零通靈）

本專案使用 GitHub Actions 原生 Pages 機制 (`deploy-pages`)，**完全不需要**手動切換 `gh-pages` 分支！

### 步驟 1：開啟 GitHub Pages Actions 權限
1. 進入您的 GitHub Repository 頁面（例如 `https://github.com/<您的帳號>/japan-travel-map-guide`）。
2. 點選上方頁籤 **「Settings」**。
3. 在左側選單中找到 **「Pages」**（位於 Code and automation 分類下）。
4. 在 **「Build and deployment」** 區塊：
   - **Source**：請由下拉選單選取 **`GitHub Actions`**（⚠️ 請勿選取 Deploy from a branch）。
5. 設定完成後，GitHub 即具備由 Actions 直接推送產物的權限。

### 步驟 2：觸發首次自動建置
當您將程式碼推送至 `main` 分支時，`.github/workflows/deploy.yml` 將會自動被觸發：
```bash
git push origin main
```
您亦可至 GitHub Repository 頁面：
1. 點選上方 **「Actions」** 頁籤。
2. 在左側選單點選 **「Deploy to GitHub Pages」**。
3. 點擊右側 **「Run workflow」** -> 選擇 `main` 分支 -> 點擊綠色 **「Run workflow」** 按鈕手動觸發。

### 步驟 3：取得發佈網址
當 `deploy` 工作流程顯示綠色打勾（約 40 秒），您的導覽地圖即成功上線！
網址格式為：
```
https://<您的GitHub使用者名稱>.github.io/japan-travel-map-guide/
```

---

## 四、GitHub Repository Secrets & Variables 設定表

本專案具備 **「雙軌備援容錯機制」**：即使您完全不設定任何 Google Sheet 金鑰，系統也會自動載入內建的 439 筆精選地標 Seed 資料；若您需要啟用 Google 試算表雙向同步與自訂爬蟲，請依下表設定：

前往路徑：**GitHub Repository -> Settings -> Secrets and variables -> Actions**

| 變數名稱 | 類型 | 必要性 | 預設值/範例 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| `SHEET_ID` | Secret / Variable | 選填 | `1AbCdEfGhIjKlMnOp...` | Google 試算表網址 `/d/` 與 `/edit` 之間的那串 ID |
| `GID_HOTEL` | Variable | 選填 | `0` | 試算表中「飯店」分頁的網址 `gid` 參數 |
| `GID_SHOPPING` | Variable | 選填 | `123456789` | 試算表中「購物藥妝」分頁的 `gid` 參數 |
| `GID_FOOD` | Variable | 選填 | `987654321` | 試算表中「美食餐廳」分頁的 `gid` 參數 |
| `GID_CONVENIENCE` | Variable | 選填 | `556677889` | 試算表中「便利商店」分頁的 `gid` 參數 |
| `GAS_WEBHOOK_URL`| Secret | 選填 | `https://script.google.com/macros/s/.../exec` | Google Apps Script 網頁應用程式部署網址 |

---

## 五、GitHub Actions 工作流總覽

專案於 `.github/workflows/` 下內建完整自動化管道：

1. **`ci_test.yml`（CI 品質測試閘門）**
   - **觸發時機**：每次推送 (Push) 或發起 Pull Request 至 `main` 分支。
   - **執行內容**：依序執行 `npm ci` -> `npm test` (Vitest 全測試) -> `npm run build`。
   - **功能**：確保任何程式碼變更在合併進生產環境前 100% 通過驗收，防範回歸問題。

2. **`deploy.yml`（GitHub Pages 生產部署）**
   - **觸發時機**：推送至 `main` 分支、每日午夜 (UTC 00:00) 定時執行、或手動手動觸發。
   - **執行內容**：執行 `scripts/datagenerate.js` 整合最新 Google 試算表或離線 Seed，建置 Vite 靜態產物並部署至 Pages。

3. **`sync_to_sheet.yml`（試算表雙向同步）**
   - **觸發時機**：手動或定時。
   - **執行內容**：將專案內最新地標與自訂景點批次 Upsert 寫入至 Google Sheet。

4. **`crawl_toyoko.yml` & `crawl_url.yml`（資料抓取工作流）**
   - **觸發時機**：手動或排程觸發。
   - **執行內容**：抓取官網即時門市資料，經由地理資訊模組驗證後儲存。

---

## 六、疑難排解與常見問題 (FAQ)

### Q1：GitHub Actions 部署失敗，出現 `Process completed with exit code 1`？
- **檢查點**：確認是否為外部 Google Sheet 存取受阻。專案的 `datagenerate.js` 設有 4 秒 Timeout 降級機制，若外部網路失敗會自動退回離線 Seed。若在 CI 中失敗，請檢查 `npm test` 終端機日誌，確認是否有檔案路徑大小寫不符等問題。

### Q2：GitHub Pages 顯示 404 Not Found？
- **檢查點**：確認 `vite.config.js` 中的 `base` 設為 `'./'`。若設為絕對路徑 `'/'`，在非自訂網域的 GitHub Pages (`/japan-travel-map-guide/`) 會導致 JS/CSS 載入失敗。本專案已預設配置 `base: './'`。

### Q3：為什麼 Ubuntu 24.04 是指定運行環境？
- 避免 GitHub Actions `ubuntu-latest` 標籤在 Ubuntu 26 轉換過渡期引發非預期的套件相依變更，本專案工作流全面鎖定 `runs-on: ubuntu-24.04`，確保長青穩定運行。
