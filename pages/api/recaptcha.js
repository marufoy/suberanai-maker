export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const token = req.body.token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is missing' });
    }

    // サーバー秘密鍵とトークンでreCAPTCHAにPOST
    const serverSecretKey = `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`;
    const response_recaptcha = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: serverSecretKey,
      }
    );

    const result = await response_recaptcha.json();
    console.log("reCAPTCHA応答:", result);

    // チェック
    if (!result.success || result.score < 0.5) {
      return res.status(403).json({
        success: false,
        message: 'Failed reCAPTCHA check',
        score: result.score,
        action: result.action,
      });
    }

    // reCAPTCHA OK → 成功として返す
    return res.status(200).json({
      success: true,
      score: result.score,
      action: result.action,
    });

  } catch (error) {
    console.error("reCAPTCHA 検証失敗:", error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}