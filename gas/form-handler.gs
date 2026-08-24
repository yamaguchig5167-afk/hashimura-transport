/**
 * 有限会社橋村運送 公式サイト
 * お問い合わせフォーム — Google Apps Script
 *
 * ============================================================
 * セットアップ手順
 * ============================================================
 * 1. Google Apps Script (script.google.com) を開く
 * 2. 新しいプロジェクトを作成（プロジェクト名：「橋村運送_フォーム」等）
 * 3. このファイルの内容をすべてコード.gsに貼り付ける
 * 4. SETTINGS の定数を確認・変更する
 * 5. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
 * 6. 実行者：「自分」/ アクセスできるユーザー：「全員」に設定
 * 7. デプロイURLをコピーして js/main.js の GAS_ENDPOINT に貼り付ける
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
};

/* ===== POSTリクエスト受信 ===== */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // スプレッドシートに記録
    if (SETTINGS.SPREADSHEET_ID) {
      recordToSheet(data);
    }

    // 担当者へ通知メール送信
    sendNotifyEmail(data);

    // 送信者に自動返信メール送信（メールアドレスがある場合）
    if (data.email) {
      sendAutoReplyEmail(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: '送信完了' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('GASエラー:', err);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
      data.timestamp || new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      data.company    || '',
      data.name       || '',
      data.tel        || '',
      data.email      || '',
      data.inquiryType || '',
      data.message    || '',
    ]);
  } catch (err) {
    console.error('スプレッドシート記録エラー:', err);
  }
}

/* ===== 担当者への通知メール ===== */
function sendNotifyEmail(data) {
  const subject = `${SETTINGS.SUBJECT_PREFIX}お問い合わせが届きました（${data.company || '不明'}）`;

  const body = `
有限会社橋村運送 公式ホームページより
お問い合わせが届きました。

━━━━━━━━━━━━━━━━━━━━
受信日時    : ${data.timestamp || '不明'}
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
  `.trim();

  GmailApp.sendEmail(SETTINGS.NOTIFY_EMAIL, subject, body, {
    name: `${SETTINGS.FROM_NAME} フォーム通知`,
  });
}

/* ===== 送信者への自動返信メール ===== */
function sendAutoReplyEmail(data) {
  const subject = `${SETTINGS.SUBJECT_PREFIX}お問い合わせを受け付けました`;

  const body = `
${data.name} 様

このたびは有限会社橋村運送へのお問い合わせをいただき、
誠にありがとうございます。

以下の内容でお問い合わせを受け付けました。
担当者より2営業日以内にご連絡いたします。

━━━━━━━━━━━━━━━━━━━━
【お問い合わせ内容】
${data.message || '（内容なし）'}
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
  `.trim();

  GmailApp.sendEmail(data.email, subject, body, {
    name: SETTINGS.FROM_NAME,
    replyTo: SETTINGS.NOTIFY_EMAIL,
  });
}

/* ===== GETリクエスト（動作確認用） ===== */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status:  'ok',
      message: '橋村運送フォームGAS 稼働中',
      time:    new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
