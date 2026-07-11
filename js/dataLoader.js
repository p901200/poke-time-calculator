// ============================================================
// dataLoader.js — 從 Google Sheets 讀取所有營養資料
// 所有營養數據皆從這裡動態載入，程式內不寫死任何數值。
// ============================================================

import { SHEET_ID, SHEET_NAMES } from './config.js';

/**
 * 將一個 Google Sheet 分頁抓下來並解析成 CSV 文字。
 */
async function fetchSheetAsCSV(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName
  )}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`無法讀取工作表「${sheetName}」（HTTP ${res.status}）`);
  }
  const text = await res.text();

  // Google 有時候在權限不足時仍回傳 200，但內容是 HTML 錯誤頁面
  if (text.trim().startsWith('<')) {
    throw new Error(
      `工作表「${sheetName}」無法存取，請確認 Google Sheet 已設定為「知道連結的人皆可檢視」`
    );
  }
  return text;
}

/**
 * 簡易但穩健的 CSV parser，支援雙引號內含逗號 / 換行 / 跳脫雙引號("")。
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\r') {
        // ignore, handled by \n
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
  }
  // last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell !== undefined && cell.trim() !== ''));
}

/**
 * 把 CSV 的第一列當作 header，回傳物件陣列 [{header1: val, header2: val, ...}]
 */
function csvToObjects(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? '').trim();
    });
    return obj;
  });
}

/**
 * 從物件中找出符合某個關鍵字（不分大小寫、部分符合）的欄位數值，轉成數字。
 * 這樣不論欄位順序或是否有額外欄位，都能穩健地取出 Protein/Carb/Fat/Fiber/Calories。
 */
function pickNumber(obj, keyword) {
  const key = Object.keys(obj).find((k) => k.toLowerCase().includes(keyword));
  if (!key) return 0;
  const val = parseFloat(String(obj[key]).replace(/,/g, ''));
  return Number.isFinite(val) ? val : 0;
}

function pickText(obj, keywords) {
  for (const kw of keywords) {
    const key = Object.keys(obj).find((k) => k.includes(kw));
    if (key && obj[key]) return obj[key];
  }
  return '';
}

function extractNutrition(row) {
  return {
    protein: pickNumber(row, 'protein'),
    carb: pickNumber(row, 'carb'),
    fat: pickNumber(row, 'fat'),
    fiber: pickNumber(row, 'fiber'),
    calories: pickNumber(row, 'calor'),
  };
}

/**
 * 解析 calculator_data 工作表
 * 欄位：Category / 中文名稱 / 英文名稱 / Protein / Carb / Fat / Fiber / Calories
 */
function parseCalculatorData(text) {
  const rows = csvToObjects(text);
  return rows
    .map((row) => ({
      category: pickText(row, ['Category']).trim(),
      nameZh: pickText(row, ['中文名稱', '中文']).trim(),
      nameEn: pickText(row, ['英文名稱', '英文']).trim(),
      ...extractNutrition(row),
    }))
    .filter((item) => item.nameZh);
}

/**
 * 解析 classic_menu 工作表
 * 欄位：品項中文 / 品項英文 / 固定蛋白質 / 固定醬料 / 配菜規則 / 額外固定配菜
 */
function parseClassicMenu(text) {
  const rows = csvToObjects(text);
  return rows
    .map((row) => ({
      nameZh: pickText(row, ['品項中文']).trim(),
      nameEn: pickText(row, ['品項英文']).trim(),
      fixedProtein: pickText(row, ['固定蛋白質']).trim(),
      fixedSauce: pickText(row, ['固定醬料']).trim(),
      toppingRule: pickText(row, ['配菜規則']).trim(),
      extraFixedTopping: pickText(row, ['額外固定配菜']).trim(),
    }))
    .filter((item) => item.nameZh);
}

/**
 * 解析 average_topping 工作表（只有一筆資料）
 */
function parseAverageTopping(text) {
  const rows = csvToObjects(text);
  if (rows.length === 0) {
    return { protein: 0, carb: 0, fat: 0, fiber: 0, calories: 0 };
  }
  return extractNutrition(rows[0]);
}

/**
 * 載入所有需要的資料表，回傳整合後的資料物件。
 */
export async function loadAllData() {
  const [calcCSV, classicCSV, avgCSV] = await Promise.all([
    fetchSheetAsCSV(SHEET_NAMES.calculatorData),
    fetchSheetAsCSV(SHEET_NAMES.classicMenu),
    fetchSheetAsCSV(SHEET_NAMES.averageTopping),
  ]);

  const calculatorData = parseCalculatorData(calcCSV);
  const classicMenu = parseClassicMenu(classicCSV);
  const averageTopping = parseAverageTopping(avgCSV);

  if (calculatorData.length === 0) {
    throw new Error('calculator_data 工作表沒有讀到任何資料，請確認欄位名稱與內容');
  }
  if (classicMenu.length === 0) {
    throw new Error('classic_menu 工作表沒有讀到任何資料，請確認欄位名稱與內容');
  }

  return { calculatorData, classicMenu, averageTopping };
}
