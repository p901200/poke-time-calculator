// ============================================================
// ui.js — 畫面渲染
// ============================================================

import { h, mount, clear } from './dom.js';
import { BRAND, CUSTOM_TOPPING_COUNT } from './config.js';
import { itemsByCategory, findByNameZh } from './calculator.js';
import { CLASSIC_STEPS, CUSTOM_STEPS } from './state.js';

// ---------- 共用小元件 ----------

function brandHeader() {
  return h('header', { class: 'brand-header' }, [
    h('h1', { class: 'brand-name' }, `${BRAND.nameZh} ${BRAND.nameEn} 營養計算器`),
  ]);
}

export function renderLoading(root) {
  mount(
    root,
    h('div', { class: 'state-screen' }, [
      h('div', { class: 'spinner' }),
      h('p', { class: 'state-screen__text' }, '正在從菜單資料庫讀取最新食材...'),
    ])
  );
}

export function renderError(root, message, onRetry) {
  mount(
    root,
    h('div', { class: 'state-screen state-screen--error' }, [
      h('p', { class: 'state-screen__icon' }, '⚠'),
      h('p', { class: 'state-screen__text' }, message || '資料讀取失敗，請稍後再試'),
      h(
        'button',
        { class: 'btn btn--primary', onClick: onRetry },
        '重新讀取'
      ),
    ])
  );
}

// ---------- 模式選擇 ----------

function modeSelectScreen(actions) {
  return h('section', { class: 'mode-select' }, [
    h('p', { class: 'mode-select__hint' }, '請選擇你的波奇組合方式'),
    h('div', { class: 'mode-cards' }, [
      h(
        'button',
        {
          class: 'mode-card mode-card--classic',
          onClick: () => actions.setMode('classic'),
        },
        [
          h('span', { class: 'mode-card__label' }, '經典波奇'),
          h('span', { class: 'mode-card__sub' }, 'Classic Poke'),
          h('span', { class: 'mode-card__desc' }, '招牌固定配方，選基底、選肉量即完成'),
        ]
      ),
      h(
        'button',
        {
          class: 'mode-card mode-card--custom',
          onClick: () => actions.setMode('custom'),
        },
        [
          h('span', { class: 'mode-card__label' }, '客製波奇'),
          h('span', { class: 'mode-card__sub' }, 'Custom Poke'),
          h('span', { class: 'mode-card__desc' }, '自由挑選五種配菜與醬料，打造專屬碗'),
        ]
      ),
    ]),
  ]);
}

// ---------- 步驟指示器 ----------

function stepper(steps, currentStep) {
  return h(
    'ol',
    { class: 'stepper' },
    steps.map((s, idx) => {
      const stepNum = idx + 1;
      const status =
        stepNum === currentStep ? 'active' : stepNum < currentStep ? 'done' : 'todo';
      return h('li', { class: `stepper__item stepper__item--${status}` }, [
        h('span', { class: 'stepper__num' }, status === 'done' ? '✓' : String(stepNum)),
        h('span', { class: 'stepper__title' }, s.title),
      ]);
    })
  );
}

// ---------- 選項卡片（單選） ----------

function selectCard({ label, sublabel, selected, onClick }) {
  return h(
    'button',
    {
      class: `option-card${selected ? ' option-card--selected' : ''}`,
      onClick,
      type: 'button',
    },
    [
      h('span', { class: 'option-card__check' }, selected ? '✓' : ''),
      h('span', { class: 'option-card__label' }, [
        label,
        sublabel ? h('span', { class: 'option-card__sub' }, sublabel) : null,
      ]),
    ]
  );
}

// ---------- 數量調整器（加購用，0～99） ----------

function qtyStepper({ label, sublabel, qty, onChange, min = 0, max = 99 }) {
  const clamp = (n) => Math.max(min, Math.min(max, Math.round(n) || 0));

  const dec = h(
    'button',
    {
      class: 'qty-btn',
      type: 'button',
      disabled: qty <= min,
      onClick: () => onChange(clamp(qty - 1)),
    },
    '−'
  );

  const input = h('input', {
    class: 'qty-input',
    type: 'number',
    inputmode: 'numeric',
    min: String(min),
    max: String(max),
    step: '1',
    value: String(qty),
    onInput: (e) => {
      const val = e.target.value;
      if (val === '') return;
      const num = clamp(parseInt(val, 10));
      onChange(num);
    },
    onBlur: (e) => {
      e.target.value = String(qty);
    },
  });

  const inc = h(
    'button',
    {
      class: 'qty-btn',
      type: 'button',
      disabled: qty >= max,
      onClick: () => onChange(clamp(qty + 1)),
    },
    '+'
  );

  return h('div', { class: `qty-row${qty > 0 ? ' qty-row--active' : ''}` }, [
    h('span', { class: 'qty-row__label' }, [
      label,
      sublabel ? h('span', { class: 'qty-row__sub' }, sublabel) : null,
    ]),
    h('div', { class: 'qty-row__controls' }, [dec, input, inc]),
  ]);
}

// ---------- 經典波奇：各步驟內容 ----------

function classicStepContent(data, state, actions) {
  const { calculatorData, classicMenu } = data;
  const s = state.classic;
  const stepKey = CLASSIC_STEPS[state.step - 1].key;

  if (stepKey === 'item') {
    return h(
      'div',
      { class: 'option-grid' },
      classicMenu.map((item) =>
        selectCard({
          label: item.nameZh,
          sublabel: item.nameEn,
          selected: s.classicItemName === item.nameZh,
          onClick: () => actions.setClassicItem(item.nameZh),
        })
      )
    );
  }

  if (stepKey === 'base') {
    const bases = itemsByCategory(calculatorData, 'Base');
    return h(
      'div',
      { class: 'option-grid' },
      bases.map((b) =>
        selectCard({
          label: b.nameZh,
          sublabel: b.nameEn,
          selected: s.baseName === b.nameZh,
          onClick: () => actions.setClassicBase(b.nameZh),
        })
      )
    );
  }

  if (stepKey === 'meat') {
    const classicItem = classicMenu.find((c) => c.nameZh === s.classicItemName);
    const proteinLabel = classicItem ? classicItem.fixedProtein : '';
    return h('div', { class: 'option-grid option-grid--meat' }, [
      selectCard({
        label: '正常肉',
        sublabel: proteinLabel ? `固定 ${proteinLabel} × 1` : null,
        selected: s.meatPortion === 'normal',
        onClick: () => actions.setMeatPortion('normal'),
      }),
      selectCard({
        label: '1.5 倍肉',
        sublabel: proteinLabel ? `固定 ${proteinLabel} × 1.5` : null,
        selected: s.meatPortion === 'extra',
        onClick: () => actions.setMeatPortion('extra'),
      }),
    ]);
  }

  if (stepKey === 'extraProtein') {
    const proteins = itemsByCategory(calculatorData, 'Protein');
    return h(
      'div',
      { class: 'qty-list' },
      proteins.map((p) =>
        qtyStepper({
          label: p.nameZh,
          sublabel: p.nameEn,
          qty: s.extraProteins[p.nameZh] || 0,
          onChange: (qty) => actions.setClassicExtra('extraProteins', p.nameZh, qty),
        })
      )
    );
  }

  if (stepKey === 'extraTopping') {
    const toppings = itemsByCategory(calculatorData, 'Topping');
    return h(
      'div',
      { class: 'qty-list' },
      toppings.map((t) =>
        qtyStepper({
          label: t.nameZh,
          sublabel: t.nameEn,
          qty: s.extraToppings[t.nameZh] || 0,
          onChange: (qty) => actions.setClassicExtra('extraToppings', t.nameZh, qty),
        })
      )
    );
  }

  return null;
}

// ---------- 客製波奇：各步驟內容 ----------

function customStepContent(data, state, actions) {
  const { calculatorData } = data;
  const s = state.custom;
  const stepKey = CUSTOM_STEPS[state.step - 1].key;

  if (stepKey === 'base') {
    const bases = itemsByCategory(calculatorData, 'Base');
    return h(
      'div',
      { class: 'option-grid' },
      bases.map((b) =>
        selectCard({
          label: b.nameZh,
          sublabel: b.nameEn,
          selected: s.baseName === b.nameZh,
          onClick: () => actions.setCustomBase(b.nameZh),
        })
      )
    );
  }

  if (stepKey === 'toppings') {
    const toppings = itemsByCategory(calculatorData, 'Topping');
    const total = s.toppings.length;
    const countOf = (name) => s.toppings.filter((n) => n === name).length;

    const list = h(
      'div',
      { class: 'qty-list' },
      toppings.map((t) => {
        const qty = countOf(t.nameZh);
        return qtyStepper({
          label: t.nameZh,
          sublabel: t.nameEn,
          qty,
          max: CUSTOM_TOPPING_COUNT,
          onChange: (newQty) => {
            const otherTotal = total - qty;
            const clamped = Math.min(newQty, CUSTOM_TOPPING_COUNT - otherTotal);
            actions.setCustomToppingQty(t.nameZh, Math.max(0, clamped));
          },
        });
      })
    );

    return h('div', {}, [
      h('div', { class: `topping-counter${total === CUSTOM_TOPPING_COUNT ? ' topping-counter--full' : ''}` }, [
        h('span', {}, '已選'),
        h('strong', {}, ` ${total} `),
        h('span', {}, `/ ${CUSTOM_TOPPING_COUNT}`),
      ]),
      list,
    ]);
  }

  if (stepKey === 'sauce') {
    const sauces = itemsByCategory(calculatorData, 'Sauce');
    return h(
      'div',
      { class: 'option-grid' },
      sauces.map((sauce) =>
        selectCard({
          label: sauce.nameZh,
          sublabel: sauce.nameEn,
          selected: s.sauceName === sauce.nameZh,
          onClick: () => actions.setCustomSauce(sauce.nameZh),
        })
      )
    );
  }

  if (stepKey === 'extraProtein') {
    const proteins = itemsByCategory(calculatorData, 'Protein');
    return h(
      'div',
      { class: 'qty-list' },
      proteins.map((p) =>
        qtyStepper({
          label: p.nameZh,
          sublabel: p.nameEn,
          qty: s.extraProteins[p.nameZh] || 0,
          onChange: (qty) => actions.setCustomExtra('extraProteins', p.nameZh, qty),
        })
      )
    );
  }

  if (stepKey === 'extraTopping') {
    const toppings = itemsByCategory(calculatorData, 'Topping');
    return h(
      'div',
      { class: 'qty-list' },
      toppings.map((t) =>
        qtyStepper({
          label: t.nameZh,
          sublabel: t.nameEn,
          qty: s.extraToppings[t.nameZh] || 0,
          onChange: (qty) => actions.setCustomExtra('extraToppings', t.nameZh, qty),
        })
      )
    );
  }

  return null;
}

// ---------- 是否可以進入下一步 ----------

export function canGoNext(data, state) {
  if (state.mode === 'classic') {
    const key = CLASSIC_STEPS[state.step - 1].key;
    const s = state.classic;
    if (key === 'item') return !!s.classicItemName;
    if (key === 'base') return !!s.baseName;
    if (key === 'meat') return !!s.meatPortion;
    return true;
  }
  if (state.mode === 'custom') {
    const key = CUSTOM_STEPS[state.step - 1].key;
    const s = state.custom;
    if (key === 'base') return !!s.baseName;
    if (key === 'toppings') return s.toppings.length === CUSTOM_TOPPING_COUNT;
    if (key === 'sauce') return !!s.sauceName;
    return true;
  }
  return false;
}

// ---------- 營養總覽（含甜甜圈圖） ----------

function macroRingSVG(nutrition) {
  const r = 50;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * r;

  const proteinCal = Math.max(0, nutrition.protein) * 4;
  const carbCal = Math.max(0, nutrition.carb) * 4;
  const fatCal = Math.max(0, nutrition.fat) * 9;
  const macroTotal = proteinCal + carbCal + fatCal;

  let circlesMarkup;

  if (macroTotal <= 0) {
    circlesMarkup = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="#e9dccb" stroke-width="${strokeWidth}" />`;
  } else {
    const segments = [
      { color: '#f2542d', value: proteinCal }, // 蛋白質 = coral
      { color: '#f3b23e', value: carbCal }, // 碳水 = mango
      { color: '#5ec2dd', value: fatCal }, // 脂肪 = ocean
    ];
    let offsetAcc = 0;
    circlesMarkup = segments
      .filter((seg) => seg.value > 0)
      .map((seg) => {
        const length = (seg.value / macroTotal) * circumference;
        const dasharray = `${length} ${circumference - length}`;
        const dashoffset = -offsetAcc;
        offsetAcc += length;
        return `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${strokeWidth}" stroke-dasharray="${dasharray}" stroke-dashoffset="${dashoffset}" />`;
      })
      .join('');
  }

  return `<svg viewBox="0 0 120 120" width="100%" height="100%"><g transform="rotate(-90 60 60)">${circlesMarkup}</g></svg>`;
}

function macroRing(nutrition) {
  return h('div', { class: 'ring' }, [
    h('div', { class: 'ring__svg-wrap', html: macroRingSVG(nutrition) }),
    h('div', { class: 'ring__hole' }, [
      h('span', { class: 'ring__value' }, String(nutrition.calories)),
      h('span', { class: 'ring__unit' }, '大卡'),
    ]),
  ]);
}

function macroLegendRow(color, label, value, unit) {
  return h('div', { class: 'legend-row' }, [
    h('span', { class: 'legend-dot', style: `background:${color}` }),
    h('span', { class: 'legend-label' }, label),
    h('span', { class: 'legend-value' }, `${value} ${unit}`),
  ]);
}

export function nutritionSummary(nutrition, summaryText) {
  if (!nutrition) {
    return h('section', { class: 'summary summary--empty' }, [
      h('p', { class: 'summary__placeholder' }, '完成選擇後，這裡會即時顯示營養資訊'),
    ]);
  }

  return h('section', { class: 'summary' }, [
    summaryText ? h('p', { class: 'summary__text' }, summaryText) : null,
    h('div', { class: 'summary__body' }, [
      macroRing(nutrition),
      h('div', { class: 'legend' }, [
        macroLegendRow('var(--coral)', '蛋白質', nutrition.protein, 'g'),
        macroLegendRow('var(--mango)', '碳水化合物', nutrition.carb, 'g'),
        macroLegendRow('var(--ocean)', '脂肪', nutrition.fat, 'g'),
        macroLegendRow('var(--avocado)', '膳食纖維', nutrition.fiber, 'g'),
      ]),
    ]),
  ]);
}

// ---------- 整體流程畫面 ----------

export function renderFlow(root, data, state, actions, nutrition, summaryText) {
  const steps = state.mode === 'classic' ? CLASSIC_STEPS : CUSTOM_STEPS;
  const content =
    state.mode === 'classic'
      ? classicStepContent(data, state, actions)
      : customStepContent(data, state, actions);

  const isFirst = state.step === 1;
  const isLast = state.step === steps.length;
  const nextEnabled = canGoNext(data, state);

  const nav = h('div', { class: 'step-nav' }, [
    h(
      'button',
      {
        class: 'btn btn--ghost',
        type: 'button',
        onClick: isFirst ? actions.backToModeSelect : actions.prevStep,
      },
      isFirst ? '← 重新選擇模式' : '← 上一步'
    ),
    isLast
      ? h(
          'button',
          { class: 'btn btn--primary', type: 'button', onClick: actions.finishFlow },
          '完成 ✓'
        )
      : h(
          'button',
          {
            class: 'btn btn--primary',
            type: 'button',
            disabled: !nextEnabled,
            onClick: actions.nextStep,
          },
          '下一步 →'
        ),
  ]);

  const currentStepKey = steps[state.step - 1].key;
  const showOptionalHint = currentStepKey === 'extraProtein' || currentStepKey === 'extraTopping';

  mount(
    root,
    h('div', { class: 'flow' }, [
      h('div', { class: 'flow__mode-tag' }, state.mode === 'classic' ? '經典波奇 Classic' : '客製波奇 Custom'),
      stepper(steps, state.step),
      nutritionSummary(nutrition, summaryText),
      nav,
      h('div', { class: 'step-panel' }, [
        h('h2', { class: 'step-panel__title' }, [
          steps[state.step - 1].title,
          showOptionalHint ? h('span', { class: 'step-panel__hint' }, ' (無加購可略過)') : null,
        ]),
        content,
      ]),
    ])
  );
}

// ---------- 最終結果畫面 ----------

function shareMenu(actions) {
  return h('div', { class: 'share-menu' }, [
    h(
      'button',
      { class: 'share-menu__item', type: 'button', onClick: actions.downloadImage },
      '下載結果圖片'
    ),
    h(
      'button',
      { class: 'share-menu__item', type: 'button', onClick: actions.shareToLine },
      '分享文字到 LINE'
    ),
    h(
      'button',
      { class: 'share-menu__item', type: 'button', onClick: actions.copyResultText },
      '複製文字（貼到 IG）'
    ),
  ]);
}

export function renderResult(root, state, nutrition, summaryText, actions) {
  const modeLabel = state.mode === 'classic' ? '經典波奇 Classic' : '客製波奇 Custom';

  mount(
    root,
    h('div', { class: 'result' }, [
      h('div', { class: 'result-card', id: 'result-card' }, [
        h('p', { class: 'result-card__brand' }, `${BRAND.nameZh} ${BRAND.nameEn}`),
        h('div', { class: 'flow__mode-tag' }, modeLabel),
        h('h2', { class: 'result__title' }, '完成！這是你的波奇營養成果'),
        nutritionSummary(nutrition, summaryText),
      ]),
      h('div', { class: 'result-actions' }, [
        h(
          'button',
          { class: 'btn btn--ghost', type: 'button', onClick: actions.resetAll },
          '重新計算'
        ),
        h('div', { class: 'result-actions__share-wrap' }, [
          h(
            'button',
            {
              class: 'btn btn--share',
              type: 'button',
              disabled: state.isCapturing,
              onClick: actions.share,
            },
            state.isCapturing ? '圖片產生中…' : '分享畫面 ↗'
          ),
          state.showShareMenu ? shareMenu(actions) : null,
        ]),
      ]),
    ])
  );
}

export function renderModeSelect(root, actions) {
  mount(root, modeSelectScreen(actions));
}

export function renderShell(root) {
  const header = brandHeader();
  const main = h('main', { class: 'app-main', id: 'app-main' });
  mount(root, h('div', { class: 'app' }, [header, main]));
  return document.getElementById('app-main');
}
