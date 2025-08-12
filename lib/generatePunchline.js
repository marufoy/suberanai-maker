// lib/generatePunchline.js
import { getModel } from "../lib/firebase";

export const generatePunchline = async (body) => {
  const prompt = `
以下の話に、事実を変えずに「オチがついたように面白く話す」言い回しにしてください。
・内容は創作せず、事実の範囲で書いてください。
・自然な流れでオチっぽくなるようにしてください。
・最後に笑いが生まれるようにしてください。
・回答のみを表示してください。返事は不要です。

話：
${body}

オチ風に言い換えた話：
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