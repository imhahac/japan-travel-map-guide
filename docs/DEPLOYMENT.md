# 專案部署與維運手冊 (Deployment & Operations Manual)

> **目標**：提供最詳盡、零猜測（零通靈）的部署與維運指南。任何人依照本文件之逐步引導，皆可在 10 分鐘內完成 GitHub Pages 靜態網站、GitHub Actions 自動化工作流程與 Google Apps Script (GAS) 雲端試算表同步之全套部署。

---

## 目錄
1. [系統架構與環境需求](#一系統架構與環境需求)
2. [本地開發與測試環境設置](#二本地開發與測試環境設置)
3. [GitHub Pages 部署全步驟（零通靈）](#三github-pages-部署全步驟零通靈)
4. [GitHub Repository Secrets & Variables 設定表](#四github-repository-secrets--variables-設定表)
5. [GitHub Actions 自動化工作流程總覽](#五github-actions-自動化工作流程總覽)
6. [全國門市爬蟲與試算表同步維運指令](#六全國門市爬蟲與試算表同步維運指令)
7. [疑難排解與常見問題 (FAQ)](#七疑難排解與常見問題-faq)

---

## 一、系統架構與環境需求

本系統採用現代化前端 JAMstack 與無伺服器 (Serverless) 架構：
- **前端核心框架**：React 19 + Vite 8 + Leaflet 1.9 + Leaflet.MarkerCluster
- **運行與打包環境**：Node.js >= 20.x（建議使用 Node.js 20 或 22 LTS；GitHub Actions 工作流固定使用 Node 24）
- **品質檢驗套件**：Vitest 5 + Testing Library + jsdom + Oxlint
- **靜態主機代管**：GitHub Pages（由 GitHub Actions 原生工作流自動建置與發布）
- **雲端試算表資料庫**：Google Sheets（透過 Google Apps Script Webhook 進行二維矩陣原子同步）
- **資料規模**：內建 **10,176 筆** 全國真實實體門市與景點，以及 **350 座** 日本鐵路與地下鐵車站生活圈索引

---

## 二、本地開發與測試環境設置

### 1. 複製專案與安裝相依模組
開啟您的終端機，執行以下指令：
```bash
# 複製專案儲存庫
git clone https://github.com/imhahac/japan-travel-map-guide.git
cd japan-travel-map-guide

# 安裝相依套件模組
npm install
```

### 2. 啟動本地開發伺服器
```bash
npm run dev
```
啟動成功後，終端機會顯示本地伺服器網址（例如 `http://localhost:5173/`）。使用瀏覽器開啟即可進行即時操作與預覽，程式碼修改會透過 Vite HMR (熱模組替換) 瞬間更新。

### 3. 執行全套品質測試與靜態檢查
在提交任何程式碼或發起 Pull Request 之前，請務必執行測試：
```bash
# 執行全部 14 套單元測試與端到端篩選整合測試 (95 個測資全部通過)
npm test

# 執行 Oxlint 高效能靜態分析檢查
npm run lint

# 驗證靜態資料產生器與生產環境建置
npm run build
```

---

## 三、GitHub Pages 部署全步驟（零通靈）

本專案採用 GitHub Actions 原生的 `deploy-pages` 部署機制，**完全不需要**手動建立或維護 `gh-pages` 分支！

### 步驟 1：開啟 GitHub Pages Actions 權限
1. 在瀏覽器中開啟您的 GitHub 儲存庫頁面（例如 `https://github.com/<您的GitHub帳號>/japan-travel-map-guide`）。
2. 點選儲存庫頂部選單最右側的 **「Settings」**（設定）。
3. 在左側側邊欄中找到 **「Code and automation」** 分類下的 **「Pages」**。
4. 在右側 **「Build and deployment」** 區塊：
   - **Source**（來源）：請點擊下拉選單，選取 **`GitHub Actions`**。  
     *(⚠️ 注意：千萬不要選取「Deploy from a branch」)*
5. 設定完成後，GitHub 會自動授權 GitHub Actions 部署靜態產物至 GitHub Pages。

### 步驟 2：觸發首次自動建置與部署
當您將程式碼推送至 `main` 分支時，位於 `.github/workflows/deploy.yml` 的自動化工作流程便會自動啟動：
```bash
git push origin main
```
您也可以手動在 GitHub 網頁上立即觸發：
1. 進入儲存庫頁面，點選頂部選單的 **「Actions」** 頁籤。
2. 在左側 Actions 清單中點選 **「Deploy to GitHub Pages」**。
3. 點選右側的 **「Run workflow」** 按鈕 $\rightarrow$ 選擇分支為 `main` $\rightarrow$ 點擊綠色的 **「Run workflow」**。

### 步驟 3：取得並檢視上線網址
等待約 40~60 秒，當 `deploy` 工作流程亮起綠色勾勾（Success）後：
- 您的網站即刻正式上線！
- 預設網址格式為：
  ```
  https://<您的GitHub使用者名稱>.github.io/japan-travel-map-guide/
  ```
- 您可回到 **Settings** $\rightarrow$ **Pages** 查看頂端顯示的專屬網站網址。

---

## 四、GitHub Repository Secrets & Variables 設定表

本系統具備**「雙軌備援容錯機制」**：即使您完全不設定任何 Google Sheet 金鑰或變數，系統在打包與建置時，也會自動載入內建的 8,652 筆全日本真實門市與 340 座車站離線資料庫，保證 100% 順暢運行！

若您希望在 Actions 中啟用 Google 試算表即時連動或排程同步，請至：  
**儲存庫頁面 $\rightarrow$ Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions** 進行配置：

| 變數名稱 | 存放位置 | 必要性 | 預設值 / 範例 | 說明 |
| :--- | :--- | :---: | :--- | :--- |
| `GAS_WEBHOOK_URL` | **Secrets** | 選填 | `https://script.google.com/macros/s/.../exec` | 部署後的 Google Apps Script 網頁應用程式網址，用於自動推送或讀取資料。 |
| `SHEET_ID` | **Variables** | 選填 | `1AbCdEfGhIjKlMnOpQrStUvWxYz...` | Google 試算表網址列中 `/d/` 與 `/edit` 之間的那串專屬試算表 ID。 |
| `GID_HOTEL` | **Variables** | 選填 | `0` | 試算表中「飯店」分頁網址末端的 `gid` 參數。 |
| `GID_SHOPPING` | **Variables** | 選填 | `123456789` | 試算表中「購物藥妝」分頁網址末端的 `gid` 參數。 |
| `GID_FOOD` | **Variables** | 選填 | `987654321` | 試算表中「美食餐廳」分頁網址末端的 `gid` 參數。 |
| `GID_CONVENIENCE` | **Variables** | 選填 | `556677889` | 試算表中「便利商店」分頁網址末端的 `gid` 參數。 |

---

## 五、GitHub Actions 自動化工作流程總覽

專案於 `.github/workflows/` 目錄內建有高可靠性的自動化工作流：

### 1. `ci_test.yml`（CI 品質驗證閘門）
- **觸發條件**：任何推送到 `main` 分支的提交，或針對 `main` 分支發起的 Pull Request。
- **工作內容**：
  1. 簽出程式碼並安裝 Node.js 24；
  2. 執行 `npm ci` 乾淨安裝相依模組；
  3. 執行 `npm test`（Vitest 14 個測試套件、95 個測試全數檢驗通過）；
  4. 執行 `npm run build` 檢驗靜態產物打包。
- **目的**：杜絕任何潛在語法錯誤、Schema 欄位缺失或回歸問題被併入主分支。

### 2. `deploy.yml`（GitHub Pages 自動部署）
- **觸發條件**：推送至 `main` 分支、每日台灣時間早上 08:00（UTC 00:00）定時排程、或手動觸發。
- **工作內容**：執行 `scripts/datagenerate.js` 彙整資料庫，建置 Vite 生產環境代碼，並透過 `@actions/deploy-pages` 安全發布至 Pages 伺服器。

### 3. `crawl_queue.yml`（試算表待爬佇列排程）
- **觸發條件**：每 6 小時定時執行，或在 Actions 面板手動觸發。
- **工作內容**：讀取 Google 試算表中的「待爬清單」分頁，解析使用者輸入的網址並完成門市資料正規化，隨後寫入正式分頁並標記為 `DONE`。

---

## 六、全國門市爬蟲與試算表同步維運指令

若維運人員需要在本地或伺服器端重新抓取最新門市或同步資料：

```bash
# 1. 執行特定品牌官方爬蟲
npm run crawl:syabuyo        # しゃぶ葉 (涮乃葉火鍋/壽喜燒 337 間)
npm run crawl:matsufuji      # 六厘舎 (6 間) 與 舎鈴 (77 間)
npm run crawl:saizeriya      # 薩莉亞 (1,085 間)
npm run crawl:shakeshack     # Shake Shack (19 間)
npm run crawl:sukiya        # すき家
npm run crawl:matsuya       # 松屋
npm run crawl:nationwide     # 全國連鎖總管線

# 2. 重新產生前端 spots.json (10,176 筆) 與 stations.json (350 站生活圈索引)
npm run generate

# 3. 將資料庫全量同步至 Google 試算表各分頁 (內建 200 筆批次原子寫入與自動重試)
node scripts/sync_to_sheet.js --target=all

# 4. 單獨同步美食餐廳 (8,549 筆) 至試算表
node scripts/sync_to_sheet.js --target=dining --batch-size=200

# 5. 單獨同步購物藥妝 (970 筆) 至試算表
node scripts/sync_to_sheet.js --target=shopping
```

---

## 七、疑難排解與常見問題 (FAQ)

### Q1：GitHub Actions 部署失敗，終端機顯示 `Process completed with exit code 1`？
- **排查方式**：
  1. 請前往 Actions 頁面檢視失敗的 Step 日誌；
  2. 若失敗在 `npm test`，請確認是否有新增的景點未通過 `validator.js` 的 Schema 必填欄位或經緯度邊界盒檢查；
  3. 專案的 `datagenerate.js` 設有 4 秒 Timeout 降級機制，即使 Google 外部網路異常，亦會自動平滑降級使用本地種子庫，不會中斷部署。

### Q2：GitHub Pages 部署後網頁空白或顯示 404 Not Found？
- **排查方式**：
  1. 確認 `vite.config.js` 中的 `base` 參數設為 `'./'`（相對路徑）。
  2. 若設為絕對路徑 `'/'`，在預設二級目錄的 GitHub Pages（`/<repo-name>/`）會造成 JavaScript 與 CSS 資源找不到；本專案已預設採用 `'./'`，請勿改動。

### Q3：資料量高達 8,652 筆，靜態網站建置會不會很久？
- **說明**：
  專案經過高效率最佳化，全量 8,652 筆地標與 340 座車站索引的 JSON 檔案在 Vite 打包時，利用了 Node.js Stream 記憶體快取，整個 `npm run build` 建置時間僅需約 **2.5 ~ 3.5 秒**，非常迅速輕盈。
