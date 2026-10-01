/**
 * =========================================================================
 * 日本在地商店、旅館導覽地圖 - Google Sheet 雙向橋接程式 (GAS Webhook)
 * =========================================================================
 * 
 * 部署說明：
 * 1. 在您的 Google Sheet 中點選上方選單：「擴充功能 (Extensions)」 -> 「Apps Script」
 * 2. 清除原有程式碼，將本檔案全部內容複製貼上。
 * 3. 點選右上角「部署 (Deploy)」 -> 「新部署 (New deployment)」
 * 4. 點選左側齒輪選「網頁應用程式 (Web app)」：
 *    - 說明：Japan Map Webhook
 *    - 執行身分：我 (Me)
 *    - 誰可以存取：任何人 (Anyone)  <- 重要！這樣 GitHub Actions / 爬蟲才能免金鑰直接寫入
 * 5. 點擊「部署」，並複製產生的「網頁應用程式網址 (Web App URL)」。
 * 6. 將此網址設定至專案的環境變數 `GAS_WEBHOOK_URL` 即可！
 */

const HEADERS = [
  'ID',
  'Category',
  'Brand',
  'Name',
  'NameJa',
  'Region',
  'Prefecture',
  'NearestStation',
  'StationAccess',
  'WalkMinutes',
  'Address',
  'Coordinates',
  'Phone',
  'BookingUrl',
  'GoogleMapUrl',
  'ImageUrl',
  'Tags',
  'Notes'
];

const QUEUE_HEADERS = [
  'URL',
  'Category',
  'Status',
  'CreatedAt',
  'ProcessedAt',
  'Notes'
];

function doGet(e) {
  const params = e ? e.parameter : {};
  const action = params.action || 'status';
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'getQueue') {
    const queueSheet = ss.getSheetByName('待爬清單');
    if (!queueSheet) {
      return jsonResponse({ success: true, queue: [] });
    }
    const data = queueSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse({ success: true, queue: [] });
    }
    const queue = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[2] === 'PENDING' || !row[2]) {
        queue.push({
          rowNumber: i + 1,
          url: row[0],
          category: row[1] || '飯店',
          status: row[2] || 'PENDING'
        });
      }
    }
    return jsonResponse({ success: true, queue: queue });
  }

  // Default: Return sheet status and summary
  const sheets = ss.getSheets();
  const summary = {};
  sheets.forEach(s => {
    summary[s.getName()] = Math.max(0, s.getLastRow() - 1);
  });

  return jsonResponse({
    success: true,
    message: 'Japan Travel Map Guide Webhook is ready!',
    sheetSummary: summary
  });
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = postData.action || 'upsert';

    if (action === 'upsert') {
      const targetSheetName = postData.sheetName || postData.category || '飯店';
      let sheet = ss.getSheetByName(targetSheetName);
      if (!sheet) {
        sheet = ss.insertSheet(targetSheetName);
        sheet.appendRow(HEADERS);
        sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#f3f4f6');
      }

      const rows = Array.isArray(postData.rows) ? postData.rows : [postData.row || postData];
      const existingData = sheet.getDataRange().getValues();
      const idMap = new Map();

      for (let r = 1; r < existingData.length; r++) {
        const id = String(existingData[r][0]);
        if (id) idMap.set(id, r + 1); // 1-indexed row number
      }

      let inserted = 0;
      let updated = 0;

      rows.forEach(item => {
        const rowValues = [
          item.id || item.ID || '',
          item.category || item.Category || targetSheetName,
          item.brand || item.Brand || '',
          item.name || item.Name || '',
          item.nameJa || item.NameJa || '',
          item.region || item.Region || '',
          item.prefecture || item.Prefecture || '',
          item.nearestStation || item.NearestStation || '',
          item.stationAccess || item.StationAccess || '',
          item.walkMinutes !== undefined ? item.walkMinutes : (item.WalkMinutes || ''),
          item.address || item.Address || '',
          item.coordinates || item.Coordinates || '',
          item.phone || item.Phone || '',
          item.bookingUrl || item.BookingUrl || '',
          item.googleMapUrl || item.GoogleMapUrl || '',
          item.imageUrl || item.ImageUrl || '',
          item.tags || item.Tags || '',
          item.notes || item.Notes || ''
        ];

        const id = String(rowValues[0]);
        if (id && idMap.has(id)) {
          const rowNum = idMap.get(id);
          sheet.getRange(rowNum, 1, 1, HEADERS.length).setValues([rowValues]);
          updated++;
        } else {
          sheet.appendRow(rowValues);
          inserted++;
          if (id) idMap.set(id, sheet.getLastRow());
        }
      });

      return jsonResponse({
        success: true,
        sheet: targetSheetName,
        inserted: inserted,
        updated: updated,
        total: rows.length
      });
    }

    if (action === 'addQueue') {
      let queueSheet = ss.getSheetByName('待爬清單');
      if (!queueSheet) {
        queueSheet = ss.insertSheet('待爬清單');
        queueSheet.appendRow(QUEUE_HEADERS);
        queueSheet.getRange(1, 1, 1, QUEUE_HEADERS.length).setFontWeight('bold').setBackground('#fef3c7');
      }
      const url = postData.url;
      const category = postData.category || '飯店';
      queueSheet.appendRow([url, category, 'PENDING', new Date().toISOString(), '', postData.notes || '']);
      return jsonResponse({ success: true, message: 'Added to queue' });
    }

    if (action === 'markQueueDone') {
      const queueSheet = ss.getSheetByName('待爬清單');
      if (queueSheet) {
        const data = queueSheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] === postData.url) {
            queueSheet.getRange(i + 1, 3).setValue('DONE');
            queueSheet.getRange(i + 1, 5).setValue(new Date().toISOString());
          }
        }
      }
      return jsonResponse({ success: true, message: 'Marked as DONE' });
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
