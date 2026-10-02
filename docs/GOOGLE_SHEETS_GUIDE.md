# Google 試算表對齊與 GAS Webhook 設定手冊 (Google Sheets Integration Guide)

> **目標**：提供最直覺、詳細的 Google Sheets 與 Google Apps Script (GAS) 部署指南。本專案已升級為 **「動態標頭對齊」** 與 **「二維矩陣批次寫入」**，徹底消除欄位錯位與 Google 6 分鐘執行逾時問題。

---

## 目錄
1. [Google 試算表結構與分頁設置](#一google-試算表結構與分頁設置)
2. [標準欄位標頭定義 (18 項標籤)](#二標準欄位標頭定義-18-項標籤)
3. [Google Apps Script 部署四步驟（零通靈）](#三google-apps-script-部署四步驟零通靈)
4. [核心防禦機制：動態對齊與筆記保留](#四核心防禦機制動態對齊與筆記保留)
5. [前端一鍵雙向同步操作方式](#五前端一鍵雙向同步操作方式)
6. [常見問題排解](#六常見問題排解)

---

## 一、Google 試算表結構與分頁設置

請在您的 Google Drive 中建立一份全新的 Google 試算表（或使用現有試算表），建議命名為：
`日本在地生活導覽地圖資料庫`

### 建議建立的 5 個工作表（Tabs）：
1. **`飯店`**（儲存東橫 INN、APA 飯店等住宿資料）
2. **`購物藥妝`**（儲存唐吉訶德、松本清等生活採買門市）
3. **`美食餐廳`**（儲存吉野家、松屋、すき家、一蘭拉麵、客美多咖啡等）
4. **`便利商店`**（儲存 7-Eleven、FamilyMart、Lawson 等 500m 站前門市）
5. **`待爬清單`**（選填，用於存放待爬取的特定官網 URL 佇列）

> 💡 **小秘訣**：若您一開始只有一個分頁也無妨！當 GAS Webhook 收到新分類的資料時，若該分頁不存在，程式會**自動建立分頁並寫入標準標頭**！

---

## 二、標準欄位標頭定義 (18 項標籤)

每個資料分頁的第一列（Row 1）請維持以下標準欄位名稱：

```
ID | Category | Brand | Name | NameJa | Region | Prefecture | NearestStation | StationAccess | WalkMinutes | Address | Coordinates | Phone | BookingUrl | GoogleMapUrl | ImageUrl | Tags | Notes
```

### 各欄位定義一覽：
1. **ID**：全域唯一識別碼（如 `hotel-toyoko-shinjuku-kabuki`）
2. **Category**：大分類（`飯店`、`購物藥妝`、`美食餐廳`、`便利商店`）
3. **Brand**：品牌（`東橫INN`、`APA飯店`、`唐吉訶德`、`吉野家`、`7-Eleven` 等）
4. **Name**：中文名稱（如 `東橫INN 新宿歌舞伎町`）
5. **NameJa**：日文店名（如 `東横INN 新宿歌舞伎町`）
6. **Region**：地理大區（`關東`、`近畿`、`九州・沖繩` 等）
7. **Prefecture**：都道府縣（`東京都`、`大阪府` 等）
8. **NearestStation**：最近車站（如 `新宿站`）
9. **StationAccess**：交通描述（如 `JR 新宿站 東口步行約 5 分鐘`）
10. **WalkMinutes**：步行分鐘數（整數，如 `5`）
11. **Address**：門市地址（如 `東京都新宿区歌舞伎町2-20-15`）
12. **Coordinates**：經緯度字串（如 `35.6961, 139.7042`）
13. **Phone**：聯絡電話（如 `03-5155-1045`）
14. **BookingUrl**：官方網站或預訂連結
15. **GoogleMapUrl**：Google 地圖導航連結
16. **ImageUrl**：門市照片或外觀圖網址
17. **Tags**：特色標籤（以逗號分隔，如 `24小時營業, 大浴場, 免稅退稅`）
18. **Notes**：說明備註（**支援使用者手動填寫個人旅遊筆記，同步時絕不抹除**）

---

## 三、Google Apps Script 部署四步驟（零通靈）

### 步驟 1：開啟 Apps Script 編輯器
1. 在您剛剛建立的 Google 試算表上方選單列，點選 **「擴充功能 (Extensions)」**。
2. 點擊 **「Apps Script」**，瀏覽器將會開啟 Apps Script 專屬程式碼編輯分頁。

### 步驟 2：貼上專案 Webhook 程式碼
1. 將專案中的檔案 [`gas/Code.gs`](file:///workspaces/japan-travel-map-guide/gas/Code.gs) 內容完整複製。
2. 回到 Apps Script 編輯器，刪除原有的預設內容，將複製的程式碼**全部覆蓋貼上**。
3. 點選上方的磁碟圖示 **「儲存專案 (Save project)」**。

### 步驟 3：建立網頁應用程式部署 (Web App)
1. 點選右上角藍色按鈕 **「部署 (Deploy)」** -> 選擇 **「新部署 (New deployment)」**。
2. 點選左側齒輪圖示，選取 **「網頁應用程式 (Web app)」**。
3. 填寫以下設定（⚠️ **極為重要，請務必核對**）：
   - **說明 (Description)**：`Japan Map Guide Webhook`
   - **執行身分 (Execute as)**：選取 **`我 (Me / 您的 Google 帳號)`**
   - **誰可以存取 (Who has access)**：選取 **`任何人 (Anyone)`**  
     *(⚠️ 必須選「任何人」，GitHub Actions 與前端網頁才能在無需 OAuth 繁瑣登入下寫入資料)*
4. 點擊右下角 **「部署 (Deploy)」**。
5. 若跳出授權視窗，點擊「審查權限」-> 選擇您的帳號 -> 點擊左下角「進階 (Advanced)」-> 點擊「前往 Japan Map Guide Webhook（不安全）」-> 點擊「允許 (Allow)」。

### 步驟 4：複製 Web App URL
部署完成後，畫面上會顯示一段「網頁應用程式網址」：
```
https://script.google.com/macros/s/AKfycbx.../exec
```
請將這串網址複製下來，此即為 `GAS_WEBHOOK_URL`！

---

## 四、核心防禦機制：動態對齊與筆記保留

### 1. 動態標頭對齊 (Dynamic Header Mapping)
傳統爬蟲常使用死板的陣列索引（例如 `row[3] = name`），一旦使用者在試算表中間插了一欄或調整欄位順序，資料就會完全錯位。
本系統實作：
- 自動掃描第一列的所有標頭文字；
- 建立欄位名稱至索引的動態映射字典 (`headerMap[colName] = index`)；
- 即便您將 `Phone` 移到最前面，或是把 `Notes` 放在第二欄，系統都能**精準對齊欄位寫入**！

### 2. 批次二維矩陣寫入 (Batch SetValues)
- 淘汰逐行呼叫 `appendRow`（每寫一筆耗費 300ms，寫 300 筆即耗時 90 秒）；
- 改為在記憶體中一次組裝完整的二維陣列 (`2D Array`)；
- 透過 `sheet.getRange(startRow, 1, rows.length, cols).setValues(rows)` 一次性提交；
- 處理 500 筆資料僅需不到 2 秒，徹底告別 Google 6 分鐘逾時！

### 3. 使用者自訂筆記（Notes）永久保護
- 當系統重新爬取或同步門市資訊時，會先檢查該門市既有資料中是否已有使用者手動填寫的個人備註；
- 若使用者寫了「這間房間有大浴場，早餐可頌好吃」，在同步更新座標或電話時，**該筆記會完整保留**，不會被官方預設說明蓋過。

---

## 五、前端一鍵雙向同步操作方式

在導覽地圖網頁的頂部導航列中，點選 **「雲端同步」** 按鈕：
1. 彈出同步視窗後，貼入您的 `GAS_WEBHOOK_URL`；
2. 點擊 **「立即同步至 Google 試算表」**；
3. 系統即會將目前地圖上的 439 處生活地標批次推送到您的 Google Sheet 中！

---

## 六、常見問題排解

### Q1：點擊同步時出現 CORS 錯誤或「存取被拒 (Access Denied)」？
- **原因**：在步驟 3 部署 Apps Script 時，「誰可以存取 (Who has access)」未選擇「任何人 (Anyone)」。
- **解法**：回到 Apps Script，點選「管理部署 (Manage deployments)」-> 編輯現有部署 -> 將存取權限改為「任何人」並重新發布。

### Q2：修改了 `Code.gs` 後同步結果沒變化？
- **原因**：Google Apps Script 每次修改程式碼後，**必須點選「新部署」或更新現有部署的版本**，舊的 Web App URL 才會生效。
