// ============================================================
// app.js — 應用程式進入點
// ============================================================

import { loadAllData } from './dataLoader.js';
import { calculateClassic, calculateCustom } from './calculator.js';
import {
  createInitialState,
  CLASSIC_STEPS,
  CUSTOM_STEPS,
  extrasToList,
} from './state.js';
import {
  renderLoading,
  renderError,
  renderModeSelect,
  renderFlow,
  renderShell,
} from './ui.js';

const rootEl = document.getElementById('root');
let appMain = null;
let data = null;
let state = createInitialState();

function buildSummaryText() {
  if (state.mode === 'classic') {
    const s = state.classic;
    if (!s.classicItemName) return '';
    const parts = [s.classicItemName];
    if (s.baseName) parts.push(s.baseName);
    parts.push(s.meatPortion === 'extra' ? '1.5 倍肉' : '正常肉');

    for (const [name, qty] of Object.entries(s.extraProteins)) {
      if (qty > 0) parts.push(`加購${name} ×${qty}`);
    }
    for (const [name, qty] of Object.entries(s.extraToppings)) {
      if (qty > 0) parts.push(`加購${name} ×${qty}`);
    }
    return parts.join('／');
  }

  if (state.mode === 'custom') {
    const s = state.custom;
    const parts = [];
    if (s.baseName) parts.push(s.baseName);
    if (s.toppings.length > 0) {
      const counts = {};
      s.toppings.forEach((n) => (counts[n] = (counts[n] || 0) + 1));
      const toppingStr = Object.entries(counts)
        .map(([n, q]) => (q > 1 ? `${n} ×${q}` : n))
        .join('、');
      parts.push(`配菜：${toppingStr}`);
    }
    if (s.sauceName) parts.push(s.sauceName);
    for (const [name, qty] of Object.entries(s.extraProteins)) {
      if (qty > 0) parts.push(`加購${name} ×${qty}`);
    }
    for (const [name, qty] of Object.entries(s.extraToppings)) {
      if (qty > 0) parts.push(`加購${name} ×${qty}`);
    }
    return parts.join('／');
  }

  return '';
}

function computeNutrition() {
  if (!data) return null;

  if (state.mode === 'classic') {
    const s = state.classic;
    if (!s.classicItemName || !s.baseName) return null;
    return calculateClassic({
      calculatorData: data.calculatorData,
      classicMenu: data.classicMenu,
      averageTopping: data.averageTopping,
      classicItemName: s.classicItemName,
      baseName: s.baseName,
      meatPortion: s.meatPortion,
      extraProteins: extrasToList(s.extraProteins),
      extraToppings: extrasToList(s.extraToppings),
    });
  }

  if (state.mode === 'custom') {
    const s = state.custom;
    if (!s.baseName || !s.sauceName) return null;
    return calculateCustom({
      calculatorData: data.calculatorData,
      baseName: s.baseName,
      toppings: s.toppings,
      sauceName: s.sauceName,
      extraProteins: extrasToList(s.extraProteins),
      extraToppings: extrasToList(s.extraToppings),
    });
  }

  return null;
}

function render() {
  if (!state.mode) {
    renderModeSelect(appMain, actions);
    return;
  }
  const nutrition = computeNutrition();
  renderFlow(appMain, data, state, actions, nutrition, buildSummaryText());
}

const actions = {
  setMode(mode) {
    state.mode = mode;
    state.step = 1;
    render();
  },

  backToModeSelect() {
    if (state.step > 1) {
      state.step = 1;
      render();
      return;
    }
    state.mode = null;
    render();
  },

  nextStep() {
    const steps = state.mode === 'classic' ? CLASSIC_STEPS : CUSTOM_STEPS;
    if (state.step < steps.length) {
      state.step += 1;
      render();
    }
  },

  prevStep() {
    if (state.step > 1) {
      state.step -= 1;
      render();
    }
  },

  // ---- classic ----
  setClassicItem(nameZh) {
    state.classic.classicItemName = nameZh;
    render();
  },
  setClassicBase(nameZh) {
    state.classic.baseName = nameZh;
    render();
  },
  setMeatPortion(portion) {
    state.classic.meatPortion = portion;
    render();
  },
  setClassicExtra(group, nameZh, qty) {
    state.classic[group][nameZh] = qty;
    render();
  },

  // ---- custom ----
  setCustomBase(nameZh) {
    state.custom.baseName = nameZh;
    render();
  },
  setCustomToppingQty(nameZh, qty) {
    const s = state.custom;
    const current = s.toppings.filter((n) => n !== nameZh);
    const additions = Array(qty).fill(nameZh);
    s.toppings = [...current, ...additions];
    render();
  },
  setCustomSauce(nameZh) {
    state.custom.sauceName = nameZh;
    render();
  },
  setCustomExtra(group, nameZh, qty) {
    state.custom[group][nameZh] = qty;
    render();
  },
};

async function init() {
  appMain = renderShell(rootEl);
  renderLoading(appMain);

  try {
    data = await loadAllData();
    render();
  } catch (err) {
    console.error(err);
    renderError(appMain, err.message, init);
  }
}

init();
