# 🗾 日本在地商店、旅館導覽地圖 (Japan Travel Map Guide)

> **專為赴日旅人打造的「車站生活圈導覽地圖」**。解決自由行規劃時「想在地圖上透過車站距離快速尋找飯店、生活採買與在地美食」的痛點。
> 完整收錄 **439 處全日本精選地標**：包含 372 間連鎖商旅（東橫INN + APA飯店）、30 間購物藥妝（唐吉訶德 + 松本清）、14 間平價美食（三大牛丼 + 客美多 + 一蘭）以及 23 間出站 500m 站前便利商店（7-Eleven + 全家 + 羅森）。

![Vue / React 靜態網頁](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%2019-blue)
![Map Engine](https://img.shields.io/badge/Map-Leaflet%20%2B%20OpenStreetMap-green)
![Data Source](https://img.shields.io/badge/Database-Google%20Sheets%20%2B%20GAS-amber)
![Tests](https://img.shields.io/badge/Vitest-10%20Suites%20%7C%2065%20Passed-brightgreen)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-purple)

---

## 📚 專案完整技術與維運文檔 (零通靈手冊)

- 📖 **[部署與維運手冊 (docs/DEPLOYMENT.md)](docs/DEPLOYMENT.md)**：GitHub Pages 10 分鐘部屬、Repository Secrets 變數清單與 Actions 工作流。
- 🏛️ **[系統架構與演算法規格 (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md)**：分層解耦架構、1.25x 街廓係數、500m 車站半徑過濾與資料模型 Schema。
- 📊 **[Google 試算表對齊指南 (docs/GOOGLE_SHEETS_GUIDE.md)](docs/GOOGLE_SHEETS_GUIDE.md)**：Apps Script 部署、動態標頭對齊、批次寫入防逾時與自訂筆記保護。

---

## 🌟 核心特色與功能亮點

### 1. 🗂️ 雙層分類與連鎖品牌過濾 (Two-tier Category & Brand System)
- **第一層大分類**：`全部`、`飯店旅館`、`購物藥妝`、`在地美食`、`便利商店`。
- **第二層品牌晶片**：
  - 🏨 **飯店旅館**：`東橫INN`、`APA飯店`
  - 🛍️ **購物藥妝**：`唐吉訶德 (Donki)`、`松本清 (Matsukiyo)`
  - 🍜 **在地美食**：`吉野家`、`松屋`、`すき家`、`一蘭拉麵`、`客美多咖啡`
  - 🏪 **便利商店**：`7-Eleven`、`全家 FamilyMart`、`羅森 Lawson`
- **專屬品牌配色圖釘與彈窗捷徑**：依品牌呈現專屬色彩圖釘，並提供 `🚶 步行導航` 與官方預約/菜單/門市直達按鈕。

### 2. ⚡ 出站步行距離快速拉桿 (Walk Distance Quick Slider)
- 一鍵切換出站步行時間範圍：
  - `不限距離`：檢視所有地標
  - `⚡ 3分內`：出站即達（約 240 公尺內）
  - `⏱️ 5分內`：站前核心生活圈（約 400 公尺內）
  - `🚶 10分內`：周邊延伸商圈（約 800 公尺內）

### 3. 🚉 車站智慧搜尋與 500m / 1km 步行半徑光圈
- **即時自動完成**：輸入站名（如：`新宿`、`東京`、`博多`、`札幌`、`京都`），系統自動從全日本 277 座車站快速配對。
- **步行光圈聚焦**：選定車站後，地圖以平滑動畫聚焦，並繪製 **500m（步行約 6 分鐘）** 與 **1000m（步行約 12 分鐘）** 的半透明光圈。
- **即時距離動態排序**：左側卡片清單會根據與選定車站的實際公尺數，由近到遠精準排序。

### 4. 🗺️ 沉浸式 Leaflet 地圖與地標聚合 (Marker Cluster)
- **多層級地標聚合**：縮小全日本視角時自動聚合為數量徽章，放大時展開為專屬品牌色彩圖標。
- **雙向互動卡片**：點擊卡片地圖自動滾動至對應標記並展開彈窗；點擊地圖標記，側邊欄自動定位至該卡片。

### 5. 📊 Google Sheet 多分頁分類管理資料庫 (免資料庫、免 GCP 憑證)
採用**多分頁結構**，徹底分流管理：
- `飯店` (Hotels)
- `購物藥妝` (Shopping)
- `美食餐廳` (Restaurants)
- `便利商店` (Convenience)
- `待爬清單` (Queue)：只需貼上網址，自動排程爬取後寫入正式分頁。

---

## 🚀 快速開始 (Local Development)

### 1. 下載專案並安裝依賴
```bash
git clone https://github.com/imhahac/japan-travel-map-guide.git
cd japan-travel-map-guide
npm install
```

### 2. 啟動本地開發伺服器
```bash
npm run dev
```
開啟瀏覽器前往 `http://localhost:5173/` 即可檢視！

### 3. 打包正式版
```bash
npm run build
```

---

## 🤖 爬蟲與資料維護指南

### 1. 爬取東橫 INN 官方最新資料
專案內建 `scripts/crawl_toyoko.js`，可直接從官方 API 爬取全日本 347+ 間分店，自動正規化經緯度、車站與照片：
```bash
npm run crawl:toyoko
```
爬取結果會儲存至 `src/data/toyoko_seed.json` 與 `src/data/spots.json`。

## ☁️ 100% 全雲端自動化架構 (Zero-Local, Cloud-Native)

本專案所有的爬蟲、同步、資料庫寫入與網站建置**全部由 GitHub Actions 雲端自動處理**，完全不需要在本地電腦執行任何指令！

### 1. 雲端一鍵同步東橫 INN 至 Google Sheet
- 前往 GitHub 倉庫的 **`Actions`** 頁籤。
- 點選左側 **`Cloud Sync Seed to Google Sheet`** → 點擊 **`Run workflow`**。
- GitHub 雲端伺服器會自動將 347 筆飯店資料分批推送至您的 Google Sheet「飯店」分頁！

### 2. 雲端輸入網址，自動爬取寫入試算表
- 當您在網路上看到值得推薦的日本飯店、拉麵店或超商：
- 前往 **`Actions`** 頁籤 → 點選 **`Cloud Crawl URL to Google Sheet`** → 點擊 **`Run workflow`**：
  - 輸入 **網址 (URL)**
  - 選擇 **類別 (飯店 / 美食餐廳 / 便利商店 / 購物藥妝)**
- GitHub Actions 雲端機器人會立即造訪該網址、解析店家名稱、地址、電話、經緯度與最近車站，並直接寫入您的 Google Sheet 對應分頁！

### 3. 試算表「待爬清單」排程全自動處理
- 自由行途中，您只需在 Google Sheet 的「**待爬清單**」工作表中貼上網址。
- GitHub Actions **每 6 小時**（或手動觸發 `Process Crawl Queue`）會自動讀取該佇列，爬取完成後自動將店家轉移至「美食餐廳」等正式分頁，並將狀態標記為 `DONE`！

### 4. 網站自動同步與發布 (GitHub Pages)
- **`Deploy to GitHub Pages`**：每天 UTC 00:00 自動從 Google Sheet 抓取最新分頁資料，打包成靜態網站並發布至 GitHub Pages。
- 您在 Google Sheet 上新增或修改的任何店名、推薦筆記，都會自動反映到地圖上！

---

## 📑 Google Sheet 串接與 Apps Script (GAS) 3 分鐘設定

完全不需申請複雜的 Google Cloud Console 服務帳號或信用卡：

1. **建立 Google 試算表**：在 Google 雲端硬碟建立一份空白 Google Sheet。
2. **貼上 Webhook 程式碼**：
   - 點選上方選單：「**擴充功能 (Extensions)**」 → 「**Apps Script**」。
   - 將本專案中的 [`gas/Code.gs`](gas/Code.gs) 內容完整複製貼上。
   - 點選右上角「**部署 (Deploy)**」 → 「**新部署 (New deployment)**」。
   - 齒輪選擇「**網頁應用程式 (Web app)**」，將「誰可以存取」設為 **任何人 (Anyone)**。
   - 點擊「部署」，並複製產生的 **網頁應用程式網址 (Web App URL)**。
3. **設定 GitHub Secret (一次性設定)**：
   - 前往您的 GitHub 倉庫 → **Settings** → **Secrets and variables** → **Actions**。
   - 點擊 **New repository secret**：
     - Name: `GAS_WEBHOOK_URL`
     - Secret: 貼上您的 Web App 網址。
4. **（選填）綁定讀取變數**：
   - 在相同頁面切換至 **Variables** 頁籤，新增 `SHEET_ID`（網址列 `/d/` 後的一串亂碼）。
   - 若未設定 `SHEET_ID`，網站會自動採用內建的 347 間東橫 INN 種子資料打包發布。

---

## 📁 專案目錄結構

```text
japan-travel-map-guide/
├── .github/workflows/
│   ├── deploy.yml            # GitHub Pages 自動建置部署工作流
│   └── crawl_queue.yml       # 待爬佇列自動排程工作流
├── gas/
│   └── Code.gs               # Google Apps Script Webhook 原始碼
├── scripts/
│   ├── crawl_toyoko.js       # 東橫 INN 官方全日本爬蟲腳本
│   ├── crawl_url.js          # 通用網址店家/飯店解析爬蟲
│   ├── datagenerate.js       # 前端資料打包與車站索引生成腳本
│   └── sync_to_sheet.js      # 一鍵推送種子資料至 Google Sheet
├── src/
│   ├── components/
│   │   ├── CategoryFilter.jsx        # 類別切換標籤 (飯店/美食/超商)
│   │   ├── InteractiveMap.jsx        # Leaflet 聚合地圖與半徑圈組件
│   │   ├── Navbar.jsx                # 頂部導覽列與主題切換
│   │   ├── RegionHierarchyFilter.jsx # 地區與都道府縣層級選單
│   │   ├── SpotCard.jsx              # 店家卡片 (即時距離/導航/預約)
│   │   ├── StationSearchBar.jsx      # 車站智慧搜尋與自動完成
│   │   └── SyncModal.jsx             # Google Sheet 設定導覽彈窗
│   ├── data/
│   │   ├── spots.json                # 目前有效景點資料庫
│   │   ├── stations.json             # 277 座車站座標與索引資料庫
│   │   └── toyoko_seed.json          # 347 間東橫 INN 內建完整種子資料
│   ├── App.jsx                       # 應用程式主畫面
│   ├── index.css                     # 現代日式旅人視覺設計樣式
│   └── main.jsx                      # React 入口點
├── index.html                        # SEO 優化入口 HTML
├── package.json
└── vite.config.js
```

---

## 📄 License
MIT License
