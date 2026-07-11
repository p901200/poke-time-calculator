// ============================================================
// 波奇一下 Poké Time — 設定檔
// ============================================================
// 請將下方 SHEET_ID 換成你的 Google Sheets ID。
// Google Sheets 網址通常長這樣：
// https://docs.google.com/spreadsheets/d/【這一段就是 SHEET_ID】/edit
//
// 注意事項：
// 1. 這份 Google Sheet 必須設定為「知道連結的人皆可檢視」。
// 2. 工作表分頁名稱必須完全對應：calculator_data / classic_menu /
//    average_topping / custom_menu（大小寫需一致）。
// 3. 不需要重新部署網站，Google Sheets 內容更新後，使用者重新整理
//    網頁即可讀到最新資料。
// ============================================================

export const SHEET_ID = '1x6GTKkR_el0q2ALPnqEDNVO_UVuGLL8g3-WooK7XSZM';

export const SHEET_NAMES = {
  calculatorData: 'calculator_data',
  classicMenu: 'classic_menu',
  averageTopping: 'average_topping',
  customMenu: 'custom_menu',
};

// 客製波奇規定必須選滿五種配菜
export const CUSTOM_TOPPING_COUNT = 5;

// 經典波奇「1.5 倍肉」的固定蛋白質倍率
export const MEAT_MULTIPLIER = {
  normal: 1,
  extra: 1.5,
};

// 韓式泡菜辣雞波奇的額外固定配菜名稱（用來比對 classic_menu 的「額外固定配菜」欄位）
export const KIMCHI_NAME = '韓式泡菜';

// 品牌文字
export const BRAND = {
  nameZh: '波奇一下',
  nameEn: 'Poké Time',
  tagline: '自選食材，秒算營養',
};
