// ============================================================
// state.js — 應用程式狀態
// ============================================================

import { CUSTOM_TOPPING_COUNT } from './config.js';

export function createInitialState() {
  return {
    mode: null, // 'classic' | 'custom'
    step: 0,
    showResult: false,
    showShareMenu: false,

    classic: {
      classicItemName: null,
      baseName: null,
      meatPortion: 'normal', // 'normal' | 'extra'
      extraProteins: {}, // { nameZh: qty }
      extraToppings: {}, // { nameZh: qty }
    },

    custom: {
      baseName: null,
      toppings: [], // 最多 5 個，可重複
      sauceName: null,
      extraProteins: {},
      extraToppings: {},
    },
  };
}

export const CLASSIC_STEPS = [
  { key: 'item', title: '選擇經典波奇' },
  { key: 'base', title: '選擇基底' },
  { key: 'meat', title: '選擇肉量' },
  { key: 'extraProtein', title: '加購蛋白質' },
  { key: 'extraTopping', title: '加購配菜' },
];

export const CUSTOM_STEPS = [
  { key: 'base', title: '選擇基底' },
  { key: 'toppings', title: `選擇配菜（滿 ${CUSTOM_TOPPING_COUNT} 種）` },
  { key: 'sauce', title: '選擇醬料' },
  { key: 'extraProtein', title: '加購蛋白質' },
  { key: 'extraTopping', title: '加購配菜' },
];

export function extrasToList(extrasObj) {
  return Object.entries(extrasObj)
    .filter(([, qty]) => qty > 0)
    .map(([nameZh, qty]) => ({ nameZh, qty }));
}
