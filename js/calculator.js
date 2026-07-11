// ============================================================
// calculator.js — 營養計算邏輯
// ============================================================

import { MEAT_MULTIPLIER, KIMCHI_NAME } from './config.js';

const EMPTY = { protein: 0, carb: 0, fat: 0, fiber: 0, calories: 0 };

export function itemsByCategory(calculatorData, category) {
  return calculatorData.filter((item) => item.category === category);
}

export function findByNameZh(calculatorData, nameZh) {
  return calculatorData.find((item) => item.nameZh === nameZh) || null;
}

function addNutrition(a, b, multiplier = 1) {
  return {
    protein: a.protein + b.protein * multiplier,
    carb: a.carb + b.carb * multiplier,
    fat: a.fat + b.fat * multiplier,
    fiber: a.fiber + b.fiber * multiplier,
    calories: a.calories + b.calories * multiplier,
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function roundAll(n) {
  return {
    protein: round1(n.protein),
    carb: round1(n.carb),
    fat: round1(n.fat),
    fiber: round1(n.fiber),
    calories: round1(n.calories),
  };
}

/**
 * 計算「加購項目」清單（蛋白質或配菜）的總營養
 * extras: [{ nameZh, qty }]
 */
function sumExtras(calculatorData, extras) {
  let total = { ...EMPTY };
  for (const extra of extras) {
    if (!extra.qty || extra.qty <= 0) continue;
    const item = findByNameZh(calculatorData, extra.nameZh);
    if (!item) continue;
    total = addNutrition(total, item, extra.qty);
  }
  return total;
}

/**
 * 經典波奇營養計算
 *
 * 總營養 = 基底 + 固定蛋白質(x1 或 x1.5) + 固定醬料 + average_topping
 *          + 韓式泡菜(若有) + 加購蛋白質 + 加購配菜
 */
export function calculateClassic({
  calculatorData,
  classicMenu,
  averageTopping,
  classicItemName,
  baseName,
  meatPortion, // 'normal' | 'extra'
  extraProteins = [], // [{nameZh, qty}]
  extraToppings = [], // [{nameZh, qty}]
}) {
  const classicItem = classicMenu.find((c) => c.nameZh === classicItemName);
  if (!classicItem) return null;

  const base = findByNameZh(calculatorData, baseName);
  const fixedProtein = findByNameZh(calculatorData, classicItem.fixedProtein);
  const fixedSauce = findByNameZh(calculatorData, classicItem.fixedSauce);

  if (!base || !fixedProtein || !fixedSauce) return null;

  const meatMultiplier =
    meatPortion === 'extra' ? MEAT_MULTIPLIER.extra : MEAT_MULTIPLIER.normal;

  let total = { ...EMPTY };
  total = addNutrition(total, base, 1);
  total = addNutrition(total, fixedProtein, meatMultiplier);
  total = addNutrition(total, fixedSauce, 1);
  total = addNutrition(total, averageTopping, 1);

  // 額外固定配菜（目前只有韓式泡菜辣雞波奇會用到）
  if (classicItem.extraFixedTopping && classicItem.extraFixedTopping !== '無') {
    const kimchi = findByNameZh(calculatorData, classicItem.extraFixedTopping || KIMCHI_NAME);
    if (kimchi) {
      total = addNutrition(total, kimchi, 1);
    }
  }

  total = addNutrition(total, sumExtras(calculatorData, extraProteins), 1);
  total = addNutrition(total, sumExtras(calculatorData, extraToppings), 1);

  return roundAll(total);
}

/**
 * 客製波奇營養計算
 *
 * 總營養 = 基底 + 五種配菜 + 醬料 + 加購蛋白質 + 加購配菜
 * 客製波奇沒有預設蛋白質、沒有肉量。
 */
export function calculateCustom({
  calculatorData,
  baseName,
  toppings = [], // 五種配菜名稱陣列，可重複 e.g. ['玉米粒','玉米粒','毛豆仁','洋蔥絲','海帶絲']
  sauceName,
  extraProteins = [],
  extraToppings = [],
}) {
  const base = findByNameZh(calculatorData, baseName);
  const sauce = findByNameZh(calculatorData, sauceName);
  if (!base || !sauce) return null;

  let total = { ...EMPTY };
  total = addNutrition(total, base, 1);
  total = addNutrition(total, sauce, 1);

  for (const toppingName of toppings) {
    const topping = findByNameZh(calculatorData, toppingName);
    if (topping) total = addNutrition(total, topping, 1);
  }

  total = addNutrition(total, sumExtras(calculatorData, extraProteins), 1);
  total = addNutrition(total, sumExtras(calculatorData, extraToppings), 1);

  return roundAll(total);
}
