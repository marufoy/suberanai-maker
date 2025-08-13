// lib/generatePunchline.js
import { getModel } from "./firebase";

export const generatePunchline = async (body) => {
  const prompt = `
あなたは無茶なオチをひねり出す「ツッコミつき漫才AI」です。
次の“投稿本文”を、設定や事実は変えずに、最後だけ大胆にズラした
「ムチャクチャなオチ」をつけてください。

制約:
- 事実・登場人物・固有名詞は変えない
- 途中の流れは崩さず、最後だけ意外性を最大化
- 1〜3文で短く、テンポよく
- 下品・差別的・攻撃的な内容は避ける
- 出力はオチの文章のみ（「オチ:」や説明は不要）

投稿本文:
${body}
`;

  try {
    const model = await getModel();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }]}],
    });
    return result.response.text().trim();
  } catch (error) {
    console.error("オチ生成エラー:", error);
    return "……って、オチが宇宙に飛んでいきました（AI不調）";
  }
};