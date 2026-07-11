# 波奇一下 Poké Time — 營養計算器

手機優先的響應式網站，讓客人掃 QR Code 後自選餐點，即時算出熱量／蛋白質／碳水化合物／脂肪／膳食纖維。所有營養數據都從 Google Sheets 動態讀取，程式碼中沒有寫死任何一筆營養資料。

## 檔案結構

```
index.html          頁面骨架
css/style.css        所有樣式（未寫在 HTML 內）
js/config.js          設定：Google Sheet ID、分頁名稱
js/dataLoader.js       讀取並解析 Google Sheets CSV
js/calculator.js       經典 / 客製波奇的營養加總邏輯
js/state.js            應用程式狀態與步驟定義
js/ui.js               畫面渲染（以 createElement 組裝，不用 innerHTML 拼字串）
js/dom.js               小型 DOM 建構工具
js/app.js               進入點，串接資料、狀態與畫面
```

## 上線前必做：連接你的 Google Sheet

1. 打開你的 Google Sheet，確認有 4 個分頁，名稱需與程式碼完全一致：
   `calculator_data`、`classic_menu`、`average_topping`、`custom_menu`
2. 右上角「共用」→ 設成「知道連結的任何人」皆可「檢視者」。
3. 複製網址中 `/d/` 與 `/edit` 之間的那一段（Sheet ID）。
4. 打開 `js/config.js`，把：
   ```js
   export const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
   ```
   換成你的 Sheet ID。
5. 之後只要更新 Google Sheets 內容，使用者重新整理網頁即可看到最新資料，**不需要重新部署**。

## 欄位要求（務必對齊，程式以欄位名稱比對，不看欄位順序）

- `calculator_data`：Category（Base/Protein/Sauce/Topping）、中文名稱、英文名稱、Protein、Carb、Fat、Fiber、Calories
- `classic_menu`：品項中文、品項英文、固定蛋白質、固定醬料、配菜規則、額外固定配菜（沒有就填「無」）
- `average_topping`：只需一列資料，包含 Protein、Carb、Fat、Fiber、Calories（代表經典波奇固定五樣配菜的平均總營養）

## 本機預覽

因為是用 `fetch` 讀取 Google Sheets，直接用瀏覽器打開 `index.html`（`file://`）會被瀏覽器擋下，請用簡單的本機伺服器：

```bash
cd poke-calculator
python3 -m http.server 8080
# 打開 http://localhost:8080
```

## 已實作的重點需求

- 經典波奇／客製波奇兩種模式，各自獨立的五步驟流程
- 經典波奇：1.5 倍肉只影響固定蛋白質，其餘不受影響；韓式泡菜辣雞波奇自動加上韓式泡菜營養
- 客製波奇：必須選滿 5 種配菜（可重複），無預設蛋白質、無肉量選項
- 加購蛋白質／配菜：0～99 整數驗證，非法輸入會自動修正
- 所有結果四捨五入到小數點一位
- 讀取中顯示 Loading，讀取失敗顯示錯誤訊息＋重試按鈕，不會讓整頁掛掉
- 餐點摘要文字即時顯示目前組合（例如「柚子嫩雞波奇／紅藜飯／1.5 倍肉／加購嫩雞 ×2」）
- Mobile First＋RWD，卡片式介面，鍵盤可視焦點，尊重「減少動態效果」系統設定
