/**
 * 有限会社橋村運送 公式サイト — メインJavaScript
 * 制作: ソルエイト株式会社
 *
 * 機能:
 *   - スクロールアニメーション
 *   - ヘッダースクロール制御
 *   - モバイルドロワーメニュー
 *   - お問い合わせフォーム送信（GAS連携）
 *   - スムーズスクロール
 */

'use strict';

/* ============================================================
   設定（GASデプロイ後にURLを差し替える）
   ============================================================ */
const CONFIG = {
  // Google Apps Script デプロイURL
  // GASを公開後、ここに貼り付けてください（未設定の間はメール送信にフォールバックします）
  GAS_ENDPOINT: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

  // メール送信先（GAS未設定時のフォールバック送信先も兼ねる）
  CONTACT_EMAIL: 'hashimura@dolphin.ocn.ne.jp',

  // 電話番号（送信失敗時の案内用）
  CONTACT_TEL: '096-355-0361',
};

/**
 * GASエンドポイントが正しく設定済みかを判定する。
 * 未設定のまま「送信できたフリ」をしないための安全弁。
 */
function isGasConfigured() {
  return typeof CONFIG.GAS_ENDPOINT === 'string'
    && CONFIG.GAS_ENDPOINT.startsWith('https://script.google.com/macros/s/')
    && !CONFIG.GAS_ENDPOINT.includes('YOUR_DEPLOYMENT_ID');
}

/* ============================================================
   スクロールアニメーション（IntersectionObserver）
   ============================================================ */
function initScrollAnimation() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ============================================================
   ヘッダー制御（スクロール時のシャドウ）
   ============================================================ */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;

    // シャドウ制御
    if (current > 40) {
      header.style.boxShadow = '0 4px 24px rgba(11,92,173,0.12)';
    } else {
      header.style.boxShadow = '0 2px 8px rgba(11,92,173,0.08)';
    }

    lastScroll = current;
  }, { passive: true });
}

/* ============================================================
   モバイルドロワーメニュー
   ============================================================ */
function initDrawerMenu() {
  const hamburger = document.querySelector('.hamburger');
  const drawer    = document.querySelector('.nav-drawer');
  if (!hamburger || !drawer) return;

  hamburger.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', isOpen);
    // ハンバーガーアニメーション
    hamburger.classList.toggle('is-active');
  });

  // ドロワー内リンクをクリックで閉じる
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('is-active');
    });
  });

  // 外側クリックで閉じる
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !drawer.contains(e.target)) {
      drawer.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('is-active');
    }
  });
}

/* ============================================================
   スムーズスクロール（ヘッダー高さ分オフセット）
   ============================================================ */
function initSmoothScroll() {
  const OFFSET = 80; // px

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href   = this.getAttribute('href');
      const target = document.querySelector(href);
      if (!target || href === '#') return;
      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   お問い合わせフォーム送信（GAS連携）
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn        = form.querySelector('.btn-submit');
    const statusBox  = form.querySelector('.form-status');

    // データ収集
    const formData = {
      company:      form.querySelector('#company').value.trim(),
      name:         form.querySelector('#name').value.trim(),
      tel:          form.querySelector('#tel').value.trim(),
      email:        form.querySelector('#email').value.trim(),
      inquiryType:  form.querySelector('#inquiry-type').value,
      message:      form.querySelector('#message').value.trim(),
      timestamp:    new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    };

    // バリデーション
    const errors = validateForm(formData);
    if (errors.length > 0) {
      showStatus(statusBox, 'error', errors.join('<br>'));
      return;
    }

    // 送信中UI
    btn.disabled    = true;
    btn.textContent = '送信中...';

    try {
      if (!isGasConfigured()) {
        // GAS未設定：送信できたフリはせず、メールソフトでの送信に切り替える
        openMailFallback(formData);
        showStatus(statusBox, 'info',
          'ご入力内容をメールでお送りいただけるよう、メールソフトを起動しました。<br>' +
          'そのまま送信ボタンを押してください。<br>' +
          '<small>メールソフトが開かない場合は、お電話（<a href="tel:0963550361"><strong>' +
          CONFIG.CONTACT_TEL + '</strong></a>）または ' +
          '<a href="mailto:' + CONFIG.CONTACT_EMAIL + '">' + CONFIG.CONTACT_EMAIL + '</a> ' +
          'まで直接ご連絡ください。</small>'
        );
      } else {
        // 本番：GASへPOST送信
        await fetch(CONFIG.GAS_ENDPOINT, {
          method: 'POST',
          mode:   'no-cors', // GASのCORS制約のため
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // no-corsで許可される型のみ
          body: JSON.stringify(formData),
        });

        // no-corsのため応答確認はできないが、通信エラーがなければ受付扱い
        showStatus(statusBox, 'success',
          '✓ お問い合わせを受け付けました。<br>2営業日以内にご連絡いたします。'
        );
        form.reset();
      }
    } catch (err) {
      console.error('フォーム送信エラー:', err);
      showStatus(statusBox, 'error',
        '送信に失敗しました。お手数ですが、お電話またはメールにてご連絡ください。<br>' +
        '<strong>' + CONFIG.CONTACT_TEL + '</strong>'
      );
    } finally {
      btn.disabled    = false;
      btn.textContent = '送信する';
    }
  });
}

/**
 * フォームバリデーション
 * @param {Object} data - フォームデータ
 * @returns {string[]} - エラーメッセージ配列
 */
function validateForm(data) {
  const errors = [];
  if (!data.company) errors.push('会社名を入力してください。');
  if (!data.name)    errors.push('ご担当者名を入力してください。');
  if (!data.tel)     errors.push('電話番号を入力してください。');
  if (!data.message) errors.push('お問い合わせ内容を入力してください。');

  // 電話番号形式チェック
  if (data.tel && !/^[\d\-\+\(\)]{10,15}$/.test(data.tel.replace(/[^0-9\-+()]/g, ''))) {
    errors.push('電話番号の形式を確認してください。');
  }

  // メールアドレス形式チェック（任意項目）
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('メールアドレスの形式を確認してください。');
  }

  return errors;
}

/**
 * ステータスメッセージ表示
 */
function showStatus(box, type, html) {
  box.innerHTML  = html;
  box.className  = `form-status form-status--${type}`;
  box.style.display = 'block';
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * 入力内容からmailtoリンクを組み立てる（副作用なし・テスト可能）。
 * @param {Object} data - フォームデータ
 * @returns {string} mailto URL
 */
function buildMailtoHref(data) {
  const subject = `【ホームページお問い合わせ】${data.inquiryType || 'お問い合わせ'}／${data.company}`;
  const body = [
    '有限会社橋村運送 御中',
    '',
    'ホームページのお問い合わせフォームより送信いたします。',
    '',
    '───────────────',
    `会社名　　：${data.company}`,
    `ご担当者名：${data.name}`,
    `電話番号　：${data.tel}`,
    `メール　　：${data.email || '（未入力）'}`,
    `お問い合わせ種別：${data.inquiryType || '（未選択）'}`,
    '───────────────',
    '',
    'お問い合わせ内容：',
    data.message,
    '',
    `（送信日時：${data.timestamp}）`,
  ].join('\r\n');

  return `mailto:${CONFIG.CONTACT_EMAIL}`
    + `?subject=${encodeURIComponent(subject)}`
    + `&body=${encodeURIComponent(body)}`;
}

/**
 * GAS未設定時のフォールバック：
 * 入力内容を本文に差し込んだメール作成画面を開く。
 * サーバー不要で問い合わせが必ず担当者に届くようにするための経路。
 * @param {Object} data - フォームデータ
 */
function openMailFallback(data) {
  window.location.href = buildMailtoHref(data);
}

/* ============================================================
   統計カウントアップアニメーション
   ============================================================ */
function initCounters() {
  const statNums = document.querySelectorAll('.stat__num[data-count]');
  if (!statNums.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        const el       = entry.target;
        const target   = parseInt(el.dataset.count, 10);
        const suffix   = el.querySelector('span');
        const suffixText = suffix ? suffix.outerHTML : '';
        const duration = 1200; // ms
        const start    = performance.now();

        function step(now) {
          const elapsed  = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // イーズアウト
          const eased    = 1 - Math.pow(1 - progress, 3);
          const current  = Math.round(eased * target);
          el.innerHTML   = current + suffixText;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    },
    { threshold: 0.5 }
  );

  statNums.forEach(el => observer.observe(el));
}

/* ============================================================
   トップへ戻るボタン
   ============================================================ */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  // 400px以上スクロールしたらボタン表示
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('is-visible');
      btn.tabIndex = 0;
    } else {
      btn.classList.remove('is-visible');
      btn.tabIndex = -1;
    }
  }, { passive: true });

  // クリックでスムーズスクロール
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   保有車両セクション — 特別な処理なし
   スクロールフェードは initScrollAnimation() が担当
   ============================================================ */

/* ============================================================
   初期化
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimation();
  initHeader();
  initDrawerMenu();
  initSmoothScroll();
  initContactForm();
  initCounters();
  initBackToTop();

  console.log(
    '%c有限会社橋村運送 公式サイト',
    'color:#0B5CAD; font-size:14px; font-weight:bold;'
  );
  console.log('制作: ソルエイト株式会社');
  console.log('お問い合わせフォーム:', isGasConfigured()
    ? '✅ GAS送信（設定済み）'
    : '⚠️ GAS未設定のためメール送信にフォールバックします'
  );
});
