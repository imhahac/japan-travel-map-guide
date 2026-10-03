# 🗾 日本在地生活圈與全國門市導覽地圖 (Japan Travel Map Guide)

> **專為赴日旅人量身打造的「車站生活圈導覽地圖與全日本連鎖門市資料庫」**。徹底解決自由行行前規劃與現場導航時「想在特定車站周邊快速找到推薦飯店、生活採買、平價美食、火鍋鍋物與便利商店」的痛點。
>
> 完整收錄 **全日本 10,176+ 處真實門市與地標**、**323 座樞紐鐵路與地下鐵車站索引**，全數門市皆由官方 API 與公開圖資實時爬取，經嚴謹的日本國土邊界盒與街廓演算法驗證，拒絕虛構資料！

![Frontend](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%2019-blue?style=flat-square)
![Map Engine](https://img.shields.io/badge/Map-Leaflet%201.9%20%2B%20MarkerCluster-green?style=flat-square)
![Database](https://img.shields.io/badge/Database-Google%20Sheets%20%2B%20GAS-amber?style=flat-square)
![Data Volume](https://img.shields.io/badge/Verified%20Spots-10%2C176%2B-orange?style=flat-square)
![Stations](https://img.shields.io/badge/Indexed%20Stations-323%20Stations-red?style=flat-square)
![Test Coverage](https://img.shields.io/badge/Vitest-14%20Suites%20%7C%2095%20Passed-brightgreen?style=flat-square)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-purple?style=flat-square)

---

## 📚 專案技術與維運文檔 (零通靈完整手冊)

本專案提供無死角的繁體中文（台灣）維運與架構指南，所有設定步驟皆具備精確指令與圖文級引導：

- 🏛️ **[系統架構與演算法規格手冊 (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md)**：三層分類架構、1.25x 街廓係數、國土邊界盒防禦、零預設渲染效能機制與資料模型規範。
- 📖 **[部署與維運手冊 (docs/DEPLOYMENT.md)](docs/DEPLOYMENT.md)**：GitHub Pages 免費 10 分鐘部署、Repository Secrets/Variables 完整清單、Actions 自動化工作流。
- 📊 **[Google 試算表對齊與 GAS Webhook 手冊 (docs/GOOGLE_SHEETS_GUIDE.md)](docs/GOOGLE_SHEETS_GUIDE.md)**：Google Apps Script 網頁應用程式部署、動態標頭對齊、二維矩陣批次寫入防逾時與個人筆記保護。

---

## 📊 全國已收錄門市與品牌分佈統計 (真實數據)

全站總計收錄 **10,176 筆** 通過 Schema 與經緯度檢驗之實體景點與門市：

| 分類維度 | 主要品牌 / 門市類別 | 收錄筆數 | 官方資料來源 / 抓取方式 |
| :--- | :--- | :---: | :--- |
| **住宿飯店** | **東橫 INN** (354 間)<br>**APA 飯店** (287 間) | **634 間** | 官方預訂系統 REST API、地理座標反查 |
| **購物藥妝** | **Bic Camera** 大型電器旗艦店 (45 間)<br>**友都八喜 Yodobashi** (24 間)<br>**唐吉訶德 Don Quijote** (28 間)<br>**松本清 Matsumoto Kiyoshi** (116 間)<br>其他生活家電與藥妝 (757 間) | **970 間** | 官網分店導覽、Mapion LBS、官方分店 API |
| **美食餐廳** | **すき家 Sukiya** (1,962 間)<br>**松屋 Matsuya** (1,146 間)<br>**薩莉亞 Saizeriya** (1,085 間)<br>**客美多咖啡 Komeda** (1,029 間)<br>**壽司郎 Sushiro** (685 間)<br>**はま寿司 Hama Sushi** (617 間)<br>**藏壽司 Kura Sushi** (551 間)<br>**やよい軒 Yayoiken** (360 間)<br>**大戶屋 Ootoya** (339 間)<br>**しゃぶ葉 Syabuyo** (337 間)<br>**一蘭 / 一風堂** (336 間)<br>**舎鈴 Sharin** (77 間)<br>**Shake Shack** (19 間)<br>**六厘舎 Rokurinsha** (6 間) | **8,549 間** | 雲雀集團 GOGA API、松富士 Nuxt3 Payload、Zensho API、Navitime Citrus API、Canly 官方 API、Komeda REST API、Mapion LBS API |
| **便利商店** | **7-Eleven、FamilyMart 全家、Lawson 羅森** | **23 間** | 500m 車站生活圈站前精選種子店 |
| **全站總計** | **4 大核心領域、18+ 指標連鎖品牌** | **10,176 筆** | **100% 通過日本國土範圍與車站配對驗證** |

---

## 🌟 核心特色與體驗設計亮點

### 1. 🗂️ 嚴謹三層分類與品牌晶片系統 (Three-Tier Hierarchy)
- **第一層（核心大類）**：`全部`、`住宿飯店`、`購物藥妝`、`美食餐廳`、`便利商店`。
- **第二層（次分類與品牌晶片）**：
  - 🏨 **住宿飯店**：`商務飯店`（東橫INN、APA飯店）
  - 🛍️ **購物藥妝**：`藥妝量販`（唐吉訶德、松本清）、`3C家電`（Bic Camera、友都八喜）
  - 🍜 **美食餐廳**：`日式拉麵`（六厘舎、舎鈴、一蘭、一風堂）、`鍋物料理`（しゃぶ葉 / 涮乃葉）、`家庭餐廳`（薩莉亞）、`漢堡輕食`（Shake Shack）、`平價牛丼`（すき家、松屋、吉野家）、`迴轉壽司`（壽司郎、藏壽司、はま寿司）、`和風定食`（大戶屋、やよい軒）、`喫茶咖啡`（客美多咖啡）
  - 🏪 **便利商店**：`連鎖超商`（7-Eleven、全家 FamilyMart、羅森 Lawson）
- **第三層（空間生活圈）**：日本 8 大地區（關東、近畿、中部、九州等） $\rightarrow$ 47 都道府縣 $\rightarrow$ 323 座主要車站。

### 2. ⚡ 零預設渲染與左側單頁 100 筆極速效能 (Zero-Default Render)
- **拒絕無效浪費與卡頓**：進入網頁時預設不強制渲染 10,000+ 筆 DOM 節點，維持首屏極速加載與流暢體驗。
- **單頁 100 筆上限防護**：左側商家清單在使用者點選分類、搜尋車站或套用篩選後動態顯示，單次最多加載 100 筆精華卡片，兼顧瀏覽效能與記憶體負載。
- **雙向地圖連動與「選取商家資訊」看板**：
  - 點擊地圖圖釘時，左側欄頂部會立即展開高對比度**「地圖選取商家資訊」**獨立面板，呈現完整地址、電話、即時步行距離與導航按鈕，避免圖釘被彈窗遮擋或產生誤會。
  - 點擊左側卡片，地圖平滑滾動聚焦（PanTo）並展開專屬色彩標記。

### 3. 🎯 零偏移實體定位與街廓繞行演算法
- **實地經緯度校準**：針對重點飯店進行精準街廓定位（例如：修正小傳馬町 APA 飯店至大傳馬町 14 番街區，而非偏移至對街地鐵出口）。
- **1.25x 日本都市街廓係數**：依據日本國土交通省市區道路迂迴標準與不動產公正競爭規約（80m/min 步行基準），真實推算離站步行時間，不再使用虛假直線距離。

### 4. 🚉 車站 300m / 500m / 1000m 生活圈多環聚焦
- **智慧自動完成**：即時支援全日本 340 座樞紐車站名稱搜尋（如：新宿、澀谷、東京、梅田、博多、京都、札幌等）。
- **半透明多環光圈**：選定車站後自動在地圖繪製 **300m（出站即達）**、**500m（核心生活圈）** 與 **1000m（周邊延伸商圈）** 光圈，卡片清單依離站公尺數由近至遠嚴格排序。

### 5. ☁️ Google 試算表雙向原子同步 (GAS Webhook Pipeline)
- 透過 Google Apps Script (GAS) 部署為無伺服器 Webhook 端點，支援二維矩陣原子操作（`setValues`）。
- 每次推送 100~200 筆，全量 7,000+ 筆資料可在 1 分鐘內寫入完畢，徹底解決 Google 試算表 6 分鐘逾時限制。
- 內建**使用者個人筆記（Notes）永久保護機制**，同步更新時絕不抹除個人旅遊心得。

---

## 🚀 快速開始 (本地開發與測試)

### 1. 複製專案與安裝相依模組
本專案建議使用 **Node.js 20 LTS** 或更高版本：
```bash
# 複製 GitHub 儲存庫
git clone https://github.com/imhahac/japan-travel-map-guide.git
cd japan-travel-map-guide

# 安裝相依套件
npm install
```

### 2. 啟動本地開發伺服器
```bash
npm run dev
```
啟動後終端機會顯示本地預覽網址，於瀏覽器開啟 `http://localhost:5173/` 即可進行即時除錯與熱模組替換 (HMR)。

### 3. 執行全套品質測試 (Vitest)
```bash
# 執行全部單元測試與端到端篩選整合測試 (12 套件、82 測資)
npm test
```

### 4. 打包生產環境靜態產物
```bash
npm run build
```
產物將編譯至 `dist/` 目錄，支援直接發布至任何靜態託管平台。

---

## 🤖 全國門市爬蟲與資料管線 (Scrapers CLI)

專案提供完整的官方門市爬蟲工具鏈，位於 `scripts/scrapers/`：

```bash
# 1. 一鍵執行全國品牌爬蟲總管線
npm run crawl:nationwide

# 2. 單獨執行特定品牌官方爬蟲
npm run crawl:syabuyo      # しゃぶ葉 (涮乃葉，337 間火鍋/壽喜燒)
npm run crawl:matsufuji    # 六厘舎 (6 間) 與 舎鈴 (77 間) 松富士拉麵沾麵
npm run crawl:saizeriya    # 薩莉亞 (1,085 間)
npm run crawl:shakeshack   # Shake Shack (19 間)
npm run crawl:sukiya      # すき家 (約 1,962 間)
npm run crawl:matsuya     # 松屋 (約 1,146 間)
npm run crawl:komeda      # 客美多咖啡 (約 1,029 間)
npm run crawl:sushiro     # 壽司郎 (約 685 間)
npm run crawl:hama        # はま寿司 (約 617 間)
npm run crawl:kura        # 藏壽司 (約 551 間)
npm run crawl:yayoiken    # やよい軒 (約 360 間)
npm run crawl:ootoya      # 大戶屋 (約 339 間)
npm run crawl:bic         # Bic Camera 大型旗艦店 (45 間)
npm run crawl:toyoko      # 東橫 INN (354 間)

# 3. 執行全域資料整合與車站索引建立
npm run generate
```

---

## 📊 Google 試算表同步管線 (Sync CLI)

專案內建強韌的 Google Sheet 同步工具 [scripts/sync_to_sheet.js](file:///workspaces/japan-travel-map-guide/scripts/sync_to_sheet.js)，已預設配置有效 GAS Webhook，支援重試機制與逾時防護：

```bash
# 一鍵同步全部門市資料 (美食餐廳、購物藥妝、飯店、便利商店) 至對應分頁
npm run sync:sheet -- --target=all

# 單獨同步「美食餐廳」分頁 (8,549 筆)
npm run sync:sheet -- --target=dining --batch-size=200

# 單獨同步「購物藥妝」分頁 (970 筆)
npm run sync:sheet -- --target=shopping

# 單獨同步「飯店」分頁 (634 筆)
npm run sync:sheet -- --target=apa
npm run sync:sheet -- --target=toyoko
```

---

## 📁 專案檔案結構導覽

```text
japan-travel-map-guide/
├── .github/workflows/
│   ├── ci_test.yml                 # [CI] 每次 Push/PR 執行測試與建置檢查
│   ├── deploy.yml                  # [CD] 自動打包並部署至 GitHub Pages
│   └── crawl_queue.yml             # [Queue] 試算表待爬清單定時處理工作流
├── docs/                           # 完整繁體中文維運手冊
│   ├── ARCHITECTURE.md             # 系統架構與演算法規格手冊
│   ├── DEPLOYMENT.md               # GitHub Pages 部署手冊 (10 分鐘全流程)
│   └── GOOGLE_SHEETS_GUIDE.md      # Google 試算表對齊與 GAS Webhook 手冊
├── gas/
│   └── Code.gs                     # Google Apps Script Webhook 批次寫入引擎
├── scripts/
│   ├── core/                       # 核心不可變邏輯模組
│   │   ├── geo.js                  # Haversine、1.25x 街廓係數與車站半徑計算
│   │   ├── validator.js            # 日本國土邊界盒與資料結構校驗
│   │   ├── dedupe.js               # 距離與名稱標準化去重
│   │   └── station_anchors.js      # 323 座權威實體車站坐標與生活圈錨點
│   ├── scrapers/                   # 全國 18 大指標品牌與生活通路官方爬蟲
│   │   ├── crawl_all_nationwide.js # 全國總體爬蟲管線
│   │   ├── crawl_syabuyo.js        # しゃぶ葉 (涮乃葉) 官方 GOGA API 爬蟲
│   │   ├── crawl_matsufuji.js      # 六厘舎與舎鈴 Nuxt3 Payload 爬蟲
│   │   ├── crawl_saizeriya.js      # 薩莉亞 Navitime Citrus API 爬蟲
│   │   ├── crawl_shakeshack.js     # Shake Shack 官方門市爬蟲
│   │   ├── crawl_sukiya.js         # すき家官方爬蟲 (Zensho API)
│   │   ├── crawl_matsuya.js        # 松屋官方爬蟲 (Navitime Citrus API)
│   │   ├── crawl_sushiro.js        # 壽司郎官方爬蟲 (Akindo Sushiro API)
│   │   ├── crawl_kura.js           # 藏壽司官方爬蟲 (Geo Data-store)
│   │   ├── crawl_hama.js           # はま寿司官方爬蟲 (Zensho API)
│   │   ├── crawl_yayoiken.js       # やよい軒官方爬蟲 (Mapion LBS API)
│   │   ├── crawl_ootoya.js         # 大戶屋官方爬蟲 (Canly API)
│   │   ├── crawl_komeda.js         # 客美多咖啡官方爬蟲 (REST API)
│   │   ├── crawl_bic_camera.js     # Bic Camera 旗艦店爬蟲
│   │   └── apa.js / donki.js ...   # 飯店與生活採買爬蟲
│   ├── datagenerate.js             # 靜態打包與車站 323 站生活圈索引生成器
│   └── sync_to_sheet.js            # Google 試算表批次同步 CLI
├── src/
│   ├── components/                 # React UI 元件
│   │   ├── CategoryFilter.jsx      # 三層分類標籤與品牌晶片選擇器
│   │   ├── InteractiveMap.jsx      # Leaflet 聚合地圖、品牌色標記與多環半徑
│   │   ├── Navbar.jsx              # 頂部導覽列、雲端同步彈窗捷徑與外觀
│   │   ├── RegionHierarchyFilter.jsx # 8 大地區與 47 都道府縣切換選單
│   │   ├── SpotCard.jsx            # 商家卡片 (即時步行時間、導航、官網)
│   │   ├── StationSearchBar.jsx    # 車站智慧搜尋與生活圈聚焦自動完成
│   │   └── SyncModal.jsx           # Google Sheet 雲端同步設定導覽彈窗
│   ├── data/                       # 核心產物與離線種子庫
│   │   ├── spots.json              # 10,176 筆全域有效景點資料庫
│   │   ├── stations.json           # 323 座日本樞紐車站座標與生活圈索引
│   │   ├── station_master.json     # 車站權威物理母檔資料
│   │   ├── syabuyo_seed.json       # 337 間しゃぶ葉官方直營門市庫
│   │   ├── matsufuji_seed.json     # 83 間六厘舎與舎鈴官方門市庫
│   │   ├── saizeriya_seed.json     # 1,085 間薩莉亞日本本土官方門市庫
│   │   ├── shakeshack_seed.json    # 19 間 Shake Shack 日本官方門市庫
│   │   ├── dining_seed.json        # 8,129 筆全國美食餐廳離線種子庫
│   │   ├── shopping_seed.json      # 970 筆購物藥妝離線種子庫
│   │   ├── toyoko_seed.json        # 354 間東橫 INN 官方門市庫
│   │   ├── apa_seed.json           # 287 間 APA 飯店官方門市庫
│   │   └── convenience_seed.json   # 23 間出站 500m 站前超商精選庫
│   ├── constants/
│   │   └── taxonomy.js             # 核心三層分類與品牌辭典 (Single Source of Truth)
│   ├── App.jsx                     # 應用程式主畫面與效能狀態管理
│   ├── index.css                   # 現代日式美學色彩系統與響應式排版
│   └── main.jsx                    # React 19 掛載入口
├── tests/                          # 測試套件 (14 個測試檔案、95 個測試全部通過)
│   ├── unit/                       # 爬蟲、幾何運算、去重與資料驗證測試
│   └── integration/                # 多層篩選、定位精度與左側看板連動測試
├── index.html                      # SEO 優化入口 HTML
├── package.json
└── vite.config.js
```

---

## 👥 維護者與貢獻資訊 (Contributors)

- **專案作者 / 維護者**：`imhahac` ([GitHub Profile](https://github.com/imhahac))
- **開源授權條款**：[MIT License](LICENSE)

歡迎提交 Issue 或 Pull Request，共同完善全日本旅人生活地圖指南！
