# 🗾 日本在地商店、旅館導覽地圖 (Japan Travel Map Guide)

> **專為赴日旅人打造的「車站生活圈導覽地圖」**。解決自由行規劃時「想在地圖上透過車站距離快速尋找飯店與周邊商店」的痛點。

第一期完整收錄**全日本 347 間東橫 INN（Toyoko Inn）官方飯店資料**，提供精準經緯度、外觀照片、官方預約連結、電話以及最鄰近車站步行時間。同時具備**通用爬蟲與 Google Sheet 多分頁資料庫串接機制**，讓您隨時加入私房美食餐廳、便利商店與藥妝購物點！

![Vue / React 靜態網頁](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%2019-blue)
![Map Engine](https://img.shields.io/badge/Map-Leaflet%20%2B%20OpenStreetMap-green)
![Data Source](https://img.shields.io/badge/Database-Google%20Sheets%20%2B%20GAS-amber)
![Automation](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-purple)

---

## 🌟 核心特色與功能亮點

### 1. 🚉 車站智慧搜尋與 500m / 1km 步行半徑光圈
- **即時自動完成**：輸入站名（如：`新宿`、`東京`、`博多`、`札幌`、`京都`），系統自動從全日本 277 座車站快速配對。
- **步行光圈聚焦**：選定車站後，地圖以平滑動畫聚焦，並繪製 **500m（步行約 6 分鐘）** 與 **1000m（步行約 12 分鐘）** 的半透明光圈。
- **即時距離動態排序**：左側卡片清單會根據與選定車站的實際公尺數，由近到遠精準排序，並顯示「距 OO 站 X 公尺 / 步行約 X 分鐘」。

### 2. 🗺️ 沉浸式 Leaflet 地圖與地標聚合 (Marker Cluster)
- **多層級地標聚合**：縮小全日本視角時將各縣市標記聚合為數量徽章，放大時展開為飯店、餐廳、便利商店專屬色彩圖標。
- **雙向互動卡片**：點擊卡片地圖自動滾動至對應標記並展開彈窗；點擊地圖標記，側邊欄自動定位至該卡片。
- **一鍵導航與預約**：
  - 🚶 **Google 地圖步行導航**：一鍵開啟 Google Maps 步行路線導航。
  - 🏨 **官方預訂**：直達東橫 INN 官方中文預訂詳情頁。
  - 📞 **直撥電話**：提供分店聯絡電話。

### 3. 🌲 樹狀地區與都道府縣層級篩選
- 支援從「北海道、東北、關東、東海/甲信越、近畿、中國/四國、九州/沖繩」7 大區域快速挑選。
- 二級聯動篩選 47 都道府縣（東京都、大阪府、京都府等）。
- 支援「步行 3 分內 / 5 分內 / 10 分內」快速距離過濾。

### 4. 📊 Google Sheet 多分頁分類管理資料庫 (免資料庫、免 GCP 憑證)
採用**多分頁結構**，徹底分流管理：
- `飯店` (Hotels)
- `美食餐廳` (Restaurants)
- `便利商店` (Convenience)
- `購物藥妝` (Shopping)
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

### 2. 爬取任意新飯店、餐廳或便利商店網址
當您在網路上看到推薦的日本美食或飯店，執行下列指令即可自動解析標題、地址、經緯度與鄰近車站：
```bash
# 爬取餐廳範例
npm run crawl:url -- --url "https://example.com/ramen-shop" --category "美食餐廳"

# 爬取飯店範例
npm run crawl:url -- --url "https://example.com/hotel" --category "飯店"
```
若有設定環境變數 `GAS_WEBHOOK_URL`，解析結果會自動透過 Webhook 直接寫入您的 Google Sheet 對應分頁！

### 3. 處理 Google Sheet「待爬清單」佇列
```bash
npm run crawl:url -- --from-queue
```

---

## 📑 Google Sheet 串接與 Apps Script (GAS) 設定教學

本專案完全不需申請複雜的 Google Cloud Console 服務帳號或信用卡，只需 3 步驟：

### 第一步：建立 Google 試算表
在您的 Google 雲端硬碟建立一份空白 Google Sheet。

### 第二步：貼上 Webhook 程式碼
1. 在試算表中點選上方選單：「**擴充功能 (Extensions)**」 → 「**Apps Script**」。
2. 將本專案中的 [`gas/Code.gs`](gas/Code.gs) 內容完整複製貼上。
3. 點選右上角「**部署 (Deploy)**」 → 「**新部署 (New deployment)**」。
4. 齒輪選擇「**網頁應用程式 (Web app)**」：
   - 說明：`Japan Map Webhook`
   - 執行身分：`我 (Me)`
   - 誰可以存取：`任何人 (Anyone)`
5. 點擊「部署」，並複製產生的 **網頁應用程式網址 (Web App URL)**。

### 第三步：一鍵將東橫 INN 種子資料同步至試算表
在終端機輸入：
```bash
node scripts/sync_to_sheet.js <YOUR_WEB_APP_URL>
```
系統會自動在您的試算表中建立「飯店」分頁，並將 347 間飯店完整寫入！

---

## ☁️ GitHub Actions 自動化部署至 GitHub Pages

本專案已配置完整的 CI/CD 工作流：

1. **前往您的 GitHub Repo 設定**：
   - **Settings** → **Pages** → 將 **Source** 改為 **`GitHub Actions`**。
   - **Settings** → **Actions** → **General** → **Workflow permissions** 改為 **`Read and write permissions`**。
2. **（選填）綁定 Google Sheet 變數**：
   - 到 **Settings** → **Secrets and variables** → **Actions** → **Variables**：
     - `SHEET_ID`：您的 Google 試算表 ID。
     - `GID`：飯店分頁 GID（通常為 0）。
     - `GID_FOOD`：美食餐廳分頁 GID。
   - 若未設定 `SHEET_ID`，GitHub Actions 會自動採用專案內建的 347 間飯店種子資料進行打包發布。
3. **自動更新排程**：
   - 每天 UTC 00:00 自動同步最新資料並發布至 GitHub Pages。
   - 也可在 **Actions** 頁籤隨時點擊 **Run workflow** 手動觸發部署。

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
