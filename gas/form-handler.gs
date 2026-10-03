/**
 * 有限会社橋村運送 公式サイト
 * お問い合わせフォーム — Google Apps Script
 *
 * ============================================================
 * セットアップ手順（詳細は docs/フォーム設定手順.md）
 * ============================================================
 * 1. script.google.com を開く
 * 2. 新しいプロジェクトを作成（プロジェクト名：橋村運送_お問い合わせフォーム）
 * 3. このファイルの内容をすべて「コード.gs」に貼り付ける
 * 4. 「デプロイ」→「新しいデプロイ」→種類「ウェブアプリ」
 * 5. 実行するユーザー：自分 ／ アクセスできるユーザー：全員
 * 6. 表示されたURLを js/main.js の GAS_ENDPOINT に貼り付ける
 *
 * 【重要】メールの差出人は、このスクリプトを置いたGoogleアカウントになる。
 * お客様に届く自動返信にもそのアドレスが表示されるため、
 * 社外に出して問題のないアカウントで作成すること。
 * ============================================================
 */

/* ===== 設定 ===== */
const SETTINGS = {
  // 通知メール送信先（担当者メールアドレス）
  NOTIFY_EMAIL: 'hashimura@dolphin.ocn.ne.jp',

  // 通知メール件名プレフィックス
  SUBJECT_PREFIX: '【橋村運送 HP】',

  // 自動返信メール送信元名
  FROM_NAME: '有限会社橋村運送',

  // スプレッドシートID（記録用。空文字の場合はスキップ）
  // スプレッドシートURLから取得: /spreadsheets/d/{SPREADSHEET_ID}/
  SPREADSHEET_ID: '',

  // スプレッドシート シート名
  SHEET_NAME: 'お問い合わせ記録',

  // 自動返信の1日あたり上限（踏み台にされたときの被害とGmailの送信上限を抑える）
  AUTO_REPLY_DAILY_LIMIT: 50,

  // 同一内容の連続送信を無視する秒数
  DEDUPE_SECONDS: 120,
};

/* 入力欄ごとの文字数上限。超過分は切り捨てる */
const MAX_LEN = { company: 100, name: 60, tel: 30, email: 120, inquiryType: 40, message: 2000 };

/* ===== POSTリクエスト受信 ===== */
function doPost(e) {
  try {
    const raw = JSON.parse(e.postData.contents);

    // 入力欄に見せかけた罠（人には見えない欄）が埋まっていれば機械的な送信とみなす。
    // 攻撃者に気づかれないよう、正常終了を返して何もしない。
    if (raw.website) return jsonOut({ status: 'success' });

    const data = clean(raw);
    const problem = validate(data);
    if (problem) return jsonOut({ status: 'error', message: problem });

    // 同じ内容の連投は1件だけ扱う（二重送信・連打対策）
    if (isDuplicate(data)) return jsonOut({ status: 'success' });

    if (SETTINGS.SPREADSHEET_ID) recordToSheet(data);

    sendNotifyEmail(data);

    // 自動返信は「宛先を自由に指定できるメール送信」になり得るため、
    // 1日の上限を設けたうえで、本文に入力内容を書き戻さない。
    if (data.email && consumeAutoReplyQuota()) sendAutoReplyEmail(data);

    return jsonOut({ status: 'success', message: '送信完了' });

  } catch (err) {
    // 内部のエラー内容はブラウザに返さない（実装の手がかりを与えないため）
    console.error('GASエラー:', err);
    return jsonOut({ status: 'error', message: '送信処理でエラーが発生しました。' });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ===== 入力の整形 ===== */
function clean(raw) {
  const out = {};
  Object.keys(MAX_LEN).forEach(function (k) {
    // 改行は件名に混ぜられると不正なヘッダーを作られるため、全角スペースに置き換える
    const v = String(raw[k] == null ? '' : raw[k]).replace(/[\r\n]+/g, ' ').trim();
    out[k] = v.slice(0, MAX_LEN[k]);
  });
  // 本文だけは改行を残す
  out.message = String(raw.message == null ? '' : raw.message).trim().slice(0, MAX_LEN.message);
  // 受信時刻はブラウザ側の値を信用せず、サーバー側で打つ
  out.timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
  return out;
}

/* ===== 入力の検査 ===== */
function validate(d) {
  if (!d.name) return 'お名前を入力してください。';
  if (!d.message) return 'お問い合わせ内容を入力してください。';
  if (!d.tel && !d.email) return '電話番号またはメールアドレスを入力してください。';
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'メールアドレスの形式が正しくありません。';
  if (d.tel && !/^[0-9+\-() 　]{8,}$/.test(d.tel)) return '電話番号の形式が正しくありません。';
  return '';
}

/* ===== 同一内容の連投を弾く ===== */
function isDuplicate(d) {
  const cache = CacheService.getScriptCache();
  const key = 'dup_' + Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, d.name + '|' + d.email + '|' + d.tel + '|' + d.message)
  );
  if (cache.get(key)) return true;
  cache.put(key, '1', SETTINGS.DEDUPE_SECONDS);
  return false;
}

/* ===== 自動返信の1日あたり上限 ===== */
function consumeAutoReplyQuota() {
  const props = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
  const stored = props.getProperty('autoReplyCount') || '';
  const parts = stored.split(':');
  const count = (parts[0] === today) ? parseInt(parts[1], 10) : 0;
  if (count >= SETTINGS.AUTO_REPLY_DAILY_LIMIT) {
    console.warn('自動返信の1日上限に達したため送信しません');
    return false;
  }
  props.setProperty('autoReplyCount', today + ':' + (count + 1));
  return true;
}

/* ===== スプレッドシート記録 ===== */
function recordToSheet(data) {
  try {
    const ss    = SpreadsheetApp.openById(SETTINGS.SPREADSHEET_ID);
    let   sheet = ss.getSheetByName(SETTINGS.SHEET_NAME);

    // シートがなければ作成
    if (!sheet) {
      sheet = ss.insertSheet(SETTINGS.SHEET_NAME);
      sheet.appendRow([
        '受信日時', '会社名', '担当者名', '電話番号',
        'メールアドレス', '種別', 'お問い合わせ内容',
      ]);
      // ヘッダー書式
      const header = sheet.getRange(1, 1, 1, 7);
      header.setBackground('#0B5CAD');
      header.setFontColor('#FFFFFF');
      header.setFontWeight('bold');
    }

    sheet.appendRow([
      data.timestamp,
      data.company     || '',
      data.name        || '',
      data.tel         || '',
      data.email       || '',
      data.inquiryType || '',
      data.message     || '',
    ]);
  } catch (err) {
    // 記録に失敗してもメール通知は止めない
    console.error('スプレッドシート記録エラー:', err);
  }
}

/* ===== 担当者への通知メール ===== */
function sendNotifyEmail(data) {
  const subject = `${SETTINGS.SUBJECT_PREFIX}お問い合わせが届きました（${data.company || '会社名なし'}）`;

  const body = `
有限会社橋村運送 公式ホームページより
お問い合わせが届きました。

━━━━━━━━━━━━━━━━━━━━
受信日時    : ${data.timestamp}
━━━━━━━━━━━━━━━━━━━━

【会社名】
${data.company || '（未入力）'}

【ご担当者名】
${data.name || '（未入力）'}

【電話番号】
${data.tel || '（未入力）'}

【メールアドレス】
${data.email || '（未入力）'}

【お問い合わせ種別】
${data.inquiryType || '（未選択）'}

【お問い合わせ内容】
${data.message || '（未入力）'}

━━━━━━━━━━━━━━━━━━━━
このメールは有限会社橋村運送公式サイトの
お問い合わせフォームから自動送信されています。
そのまま返信すると、お客様宛のメールになります。
  `.trim();

  // 返信先をお客様のアドレスにしておくと、このメールにそのまま返信できる
  const options = { name: `${SETTINGS.FROM_NAME} フォーム通知` };
  if (data.email) options.replyTo = data.email;

  GmailApp.sendEmail(SETTINGS.NOTIFY_EMAIL, subject, body, options);
}

/* ===== 送信者への自動返信メール ===== */
function sendAutoReplyEmail(data) {
  const subject = `${SETTINGS.SUBJECT_PREFIX}お問い合わせを受け付けました`;

  // 本文にお問い合わせ内容そのものは書き戻さない。
  // 第三者のアドレスを入力して任意の文章を送りつける使われ方を防ぐため。
  const body = `
${data.name} 様

このたびは有限会社橋村運送へのお問い合わせをいただき、
誠にありがとうございます。

下記の内容で受け付けました。
担当者より2営業日以内にご連絡いたします。

━━━━━━━━━━━━━━━━━━━━
受付日時    : ${data.timestamp}
お問い合わせ種別 : ${data.inquiryType || '（未選択）'}
━━━━━━━━━━━━━━━━━━━━

お急ぎの場合は、下記へ直接お電話ください。

─────────────────────────────
有限会社 橋村運送
代表取締役社長　橋村 直樹

〔本社〕
〒860-0047 熊本県熊本市西区春日7-13-7
TEL: 096-355-0361 / FAX: 096-355-0363

〔大津営業所〕
〒869-1236 熊本県菊池郡大津町杉水3533
TEL: 096-284-5007 / FAX: 096-284-5008

E-MAIL: hashimura@dolphin.ocn.ne.jp
─────────────────────────────

※ このメールは送信専用です。ご返信いただいても担当者へ届きます。
  `.trim();

  GmailApp.sendEmail(data.email, subject, body, {
    name: SETTINGS.FROM_NAME,
    replyTo: SETTINGS.NOTIFY_EMAIL,
  });
}

/* ===== GETリクエスト（動作確認用） ===== */
function doGet(e) {
  return jsonOut({
    status:  'ok',
    message: '橋村運送フォームGAS 稼働中',
    time:    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss'),
  });
}
