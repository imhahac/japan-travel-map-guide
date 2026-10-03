# 系統架構與演算法規格手冊 (Architecture & Algorithm Specification)

> **版本**：v3.2 (全國 10,176 筆門市、三層分類階層、323 站生活圈與零預設渲染架構)  
> **更新日期**：2026-10-03  
> **維護人員**：`imhahac`

---

## 一、系統整體架構圖

本專案採現代化分層解耦架構，資料來源層、核心計算檢驗層、索引彙整層與前端展現層完全獨立，支援離線種子庫、官方即時爬蟲與 Google Sheets 雲端三向資料管線。

```mermaid
graph TD
    subgraph Data Sources [資料來源層 Data Sources]
        A1[Google Sheets 雲端試算表 5 大分頁]
        A2[18+ 大指標品牌官方爬蟲 REST / GOGA / Nuxt3 / Navitime / Canly / LBS API]
        A3[離線種子資料庫 Seed JSONs: 10,176 筆真實地標]
    end

    subgraph Core Processing [核心計算與品質檢驗 scripts/core]
        B1["geo.js: Haversine 球面距離 & 1.25x 日本都市街廓係數"]
        B2["station_anchors.js: 323 座權威實體車站 300m / 500m / 1000m 生活圈配對"]
        B3["validator.js: 日本國土邊界盒 (24.0°N~46.0°N, 122.0°E~154.0°E) 檢驗"]
        B4["dedupe.js: 空間鄰近座標 (50m) 與店名標準化去重"]
    end

    subgraph Data Aggregator [資料彙整與靜態索引 scripts/datagenerate.js]
        C1[("src/data/spots.json: 10,176 筆全域生活與旅遊地標")]
        C2[("src/data/stations.json: 323 座日本樞紐車站生活圈索引")]
        C3[("src/data/station_master.json: 車站實體坐標權威母檔")]
    end

    subgraph Presentation Layer [前端互動展現層 React 19 + Leaflet 1.9]
        D1["零預設渲染控制器 (Zero-Default Render Controller)"]
        D2["CategoryFilter.jsx: 三層分類階層與品牌專屬晶片"]
        D3["StationSearchBar.jsx: 車站生活圈搜尋與多環半徑聚焦"]
        D4["RegionHierarchyFilter.jsx: 8 大地區與 47 都道府縣切換"]
        D5["InteractiveMap.jsx: Leaflet + MarkerCluster + 品牌專屬色圖釘"]
        D6["SelectedSpotPanel: 左側獨立地圖選取商家看板 (防遮蔽)"]
        D7["SpotCard.jsx: 單頁上限 100 筆卡片清單 (防記憶體暴增)"]
    end

    A1 -->|雙向同步 / 備援| C1
    A2 --> B1
    A3 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> C1
    B4 --> C3
    C1 --> D1
    C2 --> D3
    D1 --> D2
    D1 --> D3
    D1 --> D4
    D2 --> D5
    D3 --> D5
    D4 --> D5
    D5 -->|選取事件| D6
    D1 -->|篩選結果動態加載| D7
```

---

## 二、核心地理演算法規範 (`scripts/core/geo.js`)

### 1. Haversine 大圓球面距離公式
精確計算地表兩點經緯度間之最短大圓弧長距離（公尺）：
$$\Delta\sigma = 2 \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$
$$d = R \cdot \Delta\sigma \quad (\text{其中地球平均半徑 } R = 6,371,000 \text{ 公尺})$$

### 2. 街廓繞行係數 (Street Detour Factor) 與步行常數
- **日本都市街廓特性**：旅客無法直穿高樓建築群與封閉街區，日本國土交通省都市計畫標準與各級自治體實務通常採 **1.20 ~ 1.30** 之街廓迂迴常數。
- **計算公式**：
  $$\text{實際步行距離} = \text{直線距離} \times 1.25$$
- **步行速度規範**：依據日本不動產標示公正競爭規約（不動産公正競争規約施行規則），公眾標示之標準步行速度訂為 **80 公尺／分鐘**（不滿 1 分鐘以 1 分鐘計算）：
  $$\text{步行時間（分鐘）} = \left\lceil \frac{\text{實際步行距離}}{80} \right\rceil$$

### 3. 車站生活圈多環半徑模型 (Multi-Ring Station Proximity Model)
系統內建全日本 **323 座權威實體樞紐車站**（涵蓋 JR 新幹線、在來線、各主要私鐵與地下鐵系統），並建立三層步行生活圈環形模型：
- **核心出站環（300 公尺）**：步行約 3~4 分鐘內，涵蓋站前商店街、飯店大廳及地下街直通門市。
- **生活圈環（500 公尺）**：步行約 6~7 分鐘內，為一般自由行旅客最理想的採買與住宿半徑。
- **延伸商圈環（1,000 公尺）**：步行約 12~15 分鐘內，涵蓋主要市區延伸商圈與大型量販購物中心。

---

## 三、三層分類與品牌晶片架構 (Three-Tier Hierarchy)

為有效管理多達 10,176 間實體門市，系統建立三層次由寬至窄的篩選模型：

```mermaid
stateDiagram-v2
    [*] --> 零預設渲染模式 (首屏乾淨、不盲加載DOM)

    state "第一層：核心大分類 (L1 Categories)" as L1 {
        全部
        住宿飯店 (634間)
        購物藥妝 (970間)
        美食餐廳 (8549間)
        便利商店 (23間精選)
    }

    state "第二層：品牌與料理次分類晶片 (L2 Subcategories & Brands)" as L2 {
        住宿: 商務飯店 (東橫INN / APA飯店)
        購物: 藥妝量販 (唐吉訶德 / 松本清) / 3C家電 (Bic Camera / 友都八喜)
        拉麵: 六厘舎 / 舎鈴 / 一蘭 / 一風堂
        鍋物: しゃぶ葉 (涮乃葉日式涮涮鍋/壽喜燒)
        洋食家庭: 薩莉亞 (Saizeriya) / Shake Shack 漢堡
        牛丼定食: すき家 / 松屋 / 吉野家 / 大戶屋 / やよい軒
        壽司咖啡: 壽司郎 / 藏壽司 / はま寿司 / 客美多咖啡
        超商: 7-Eleven / 全家 FamilyMart / 羅森 Lawson
    }

    state "第三層：空間與生活圈維度 (L3 Spatial Filters)" as L3 {
        8大地理分區 (關東、近畿、中部、北海道、九州等)
        47都道府縣
        323座權威車站生活圈 (300m / 500m / 1000m)
    }

    state "前端展示與防禦機制" as Output {
        左側地圖選取看板 (即時呈現點選門市資訊)
        左側卡片清單 (嚴格限制單頁最大100筆)
        地圖 MarkerCluster 智慧聚合 (避免圖標堆疊)
    }

    [*] --> L1
    L1 --> L2
    L2 --> L3
    L3 --> Output
```

---

## 四、前端效能與記憶體防護規範

收錄規模達萬筆門市時，若直接在瀏覽器掛載上萬個 DOM 節點，將導致低階行動裝置或瀏覽器記憶體崩潰。本系統實施下列核心防禦機制：

### 1. 零預設渲染策略 (Zero-Default Render)
- 進入首頁時，預設保持清爽的生活圈地圖全貌與車站搜尋引導，**不盲目在側邊欄渲染 10,176 個 DOM 卡片**。
- 當使用者點選特定分類（如「美食餐廳」）、選取品牌（如「しゃぶ葉」）或搜尋車站（如「新宿」）時，系統才進行精準匹配與動態渲染。

### 2. 左側商家列表分頁截斷 (Chunking Cap: Max 100)
- 不論篩選結果有多少筆（例如「美食餐廳」全國 8,549 筆），側邊欄列表**單次最大載入 100 筆最相關卡片**。
- 若已選定車站，100 筆卡片嚴格依離站步行公尺數由近至遠排序；若未選定車站，則依推薦優先級排序，徹底防止記憶體耗盡。

### 3. 左側獨立「地圖選取商家資訊」看板 (Selected Spot Inspector)
- 傳統地圖點擊 Marker 僅能仰賴地圖彈窗 (Popup)，經常發生被螢幕邊界遮擋、手機縮放時難以閱讀之問題。
- 本專案特別設計：點擊地圖上任一圖釘時，左側側邊欄頂部立即升起醒目的高對比度資訊面板，呈現完整地址、電話、即時步行距離與導航按鈕，實現地圖與左側卡片無死角雙向連動。

### 4. Leaflet 向量圖釘與 MarkerCluster Canvas 最佳化
- 地圖標記全面採用 Leaflet MarkerCluster 進行視角動態聚類；
- 在全國高空視野時以圓形數量徽章呈現，縮放至街廓等級時平滑綻放為各品牌專屬色系與圖標，保持 60 FPS 順暢縮放。

---

## 五、資料模型規格 (Data Schema Specification)

### 1. 景點與門市模型 (`Spot`)

| 欄位名稱 | 型別 | 必填 | 範例 | 說明 |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `string` | 是 | `dining-sukiya-tokyo-0012` | 全域唯一識別碼，格式：`{類別}-{品牌}-{識別碼}` |
| `category` | `string` | 是 | `美食餐廳` / `購物藥妝` / `飯店` / `便利商店` | 第一層大分類，符合系統規範 |
| `brand` | `string` | 是 | `すき家` / `Bic Camera` / `東橫INN` | 品牌名稱，驅動品牌晶片與專屬色圖釘 |
| `name` | `string` | 是 | `すき家 新宿南口店` | 繁體中文或通用店名 |
| `nameJa` | `string` | 否 | `すき家 新宿南口店` | 日文官方登記店名 |
| `region` | `string` | 是 | `關東` / `近畿` / `北海道` 等 | 日本 8 大地理分區 |
| `prefecture` | `string` | 是 | `東京都` / `大阪府` / `京都府` | 都道府縣 |
| `nearestStation` | `string` | 是 | `新宿站` | 經演算法配對之最近樞紐車站 |
| `stationLine` | `string` | 否 | `JR山手線` | 該車站主要途經鐵道路線 |
| `stationAccess` | `string` | 否 | `JR 新宿站 南口步行約 3 分鐘` | 交通指引文字描述 |
| `walkMinutes` | `number` | 是 | `3` | 出站實際步行時間（整數，$\ge 0$） |
| `address` | `string` | 是 | `東京都新宿区西新宿1-18-5` | 完整日本地址 |
| `lat` | `number` | 是 | `35.6885` | 緯度（必須介於 24.0 至 46.0 日本國土內） |
| `lng` | `number` | 是 | `139.6991` | 經度（必須介於 122.0 至 154.0 日本國土內） |
| `phone` | `string` | 否 | `0120-498-007` | 聯絡電話 |
| `bookingUrl` | `string` | 否 | `https://maps.sukiya.jp/...` | 官方門市介紹、菜單或預約網址 |
| `googleMapUrl` | `string` | 否 | `https://maps.google.com/?q=...` | Google 地圖定位導航連結 |
| `imageUrl` | `string` | 否 | `https://images.unsplash.com/...` | 門市或商品代表性照片 |
| `tags` | `string` | 否 | `24小時營業, 外帶服務, 電子支付` | 以逗號分隔之特性標籤字串 |
| `notes` | `string` | 否 | `平價牛丼首選，早餐時段提供日式定食。` | 使用者備註（同步時永久保護不抹除） |

### 2. 車站生活圈索引模型 (`Station`)

| 欄位名稱 | 型別 | 範例 | 說明 |
| :--- | :--- | :--- | :--- |
| `name` | `string` | `新宿站` | 車站中文通用名稱 |
| `nameJa` | `string` | `新宿駅` | 車站日文官方名稱 |
| `lat` | `number` | `35.6896` | 車站中心點緯度 |
| `lng` | `number` | `139.7006` | 車站中心點經度 |
| `lines` | `string[]` | `["JR山手線", "JR中央線", "東京地鐵丸之內線"]` | 途經路線陣列 |
| `region` | `string` | `關東` | 車站所屬地區 |
| `prefecture` | `string` | `東京都` | 車站所屬都道府縣 |
| `count` | `number` | `185` | 該車站周邊 1km 內所收錄之地標與門市總數 |

---

## 六、全國爬蟲管線與反爬蟲防禦機制

專案於 `scripts/scrapers/` 建立了各核心指標品牌專屬官方爬蟲，統籌於 `crawl_all_nationwide.js`：

1. **しゃぶ葉 (Syabuyo / 涮乃葉)**：對接雲雀集團 GOGA Store Locator REST 端點，以 45 個日本生活圈 Geohash 3 碼並行採集全日本 337 間火鍋/壽喜燒吃到飽門市，直接回傳高精度經緯度與營業細節。
2. **六厘舎 (Rokurinsha) & 舎鈴 (Sharin)**：解析松富士食品官網 Nuxt 3 SSR Hydration Payload，抽取 Google Maps 嵌入座標與電話，取得 6 間東京沾麵王者門市與 77 間特製魚介沾麵門市。
3. **薩莉亞 (Saizeriya)**：對接 Navitime Citrus API 官方圖資，擷取全日本 1,085 間義式平價家庭餐廳之經緯度與地址。
4. **Shake Shack**：解析官方網站門市清單與嵌入圖資，收錄 19 間日本官方美式漢堡輕食門市。
5. **すき家 (Sukiya) & はま寿司 (Hama Sushi)**：對接 Zensho Holdings 官方分店查詢 API，批次擷取各都道府縣經緯度與營業標籤。
6. **松屋 (Matsuya)**：對接 Navitime Citrus API 實時分店圖資，取得精確地址與車站距離。
7. **壽司郎 (Sushiro)**：解析 Akindo Sushiro 官方門市清單與分店詳情。
8. **藏壽司 (Kura Sushi)**：對接官方地理空間資料庫，抓取營業時間與經緯度。
9. **客美多咖啡 (Komeda's Coffee)**：對接官方分店 REST API，擷取全日本逾千間門市與禁菸/插座標籤。
10. **大戶屋 (Ootoya)**：對接 Canly 官方 API，擷取定食門市精確座標。
11. **やよい軒 (Yayoiken)**：對接 Mapion LBS API，完整解析各分店設施。
12. **Bic Camera**：解析官方店鋪指南頁面，建立全日本 45 間大型旗艦家電量販店資料。

**防禦與品質控制規範**：
- **User-Agent 與禮貌延遲**：模擬正規瀏覽器 Header，每次請求間隔 300~500ms，杜絕伺服器負載風險。
- **經緯度有效性與國土邊界盒驗證**：若爬取到的經緯度為空、為 0 或超出日本國土邊界（24°N~46°N, 122°E~154°E），一律自動剔除。
- **鄰近車站智慧配對**：自動比對 323 座權威實體樞紐車站，計算離站距離與 1.25x 步行時間，補齊 `nearestStation` 與 `walkMinutes`。
- **離線基準數據雙模備援**：每支爬蟲皆內建代表性 Benchmark 離線門市清單，若外部網路遭遇震盪或逾時，自動無縫切換，確保 100% 高可用性。
