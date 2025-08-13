// lib/generatePunchline.js
import { getModel } from "../lib/firebase";

/**
 * 「AIがムチャクチャなオチをつけてくれる掲示板」用の一発オチ生成
 * - 関西弁の軽快なツッコミ/逆転
 * - 事実は変えない
 * - 攻撃的/差別的/下品すぎる表現は避ける
 * - 出力は1行のみ（前置きや説明なし）
 */
export const generatePunchline = async (body) => {
  const prompt = `
あなたは「関西AI漫才師」です。以下の「話」に対して、事実は変えずに
“ムチャクチャなオチ（強めのツッコミ or 逆転のひと言）”を1行で返してください。

必須ルール：
- 口調はやわらかめの関西弁（キツすぎない）
- 誇張／比喩／逆転のいずれかを1つ入れる
- 固有名詞の断定、個人攻撃、差別表現、下品すぎる表現は避ける
- 40〜80文字目安。句点「。」は最後に1つまで
- 出力はオチの1行だけ。前置き、解説、ヘッダー、記号は不要

話：
${body}

出力（1行だけ）：
`;

  try {
    const model = await getModel();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }]}],
    });
    return result.response.text().trim();
  } catch (error) {
    console.error("オチ生成エラー:", error);
    return "オチの生成に失敗しました…";
  }
};