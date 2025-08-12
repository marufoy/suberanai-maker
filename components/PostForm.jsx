import { useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { generatePunchline } from "../lib/generatePunchline";

export default function PostForm({ onDone }) {
  const [title, setTitle] = useState("");
  const [body, setBody]   = useState("");
  const [loading, setLoading] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body) return alert("本文を入力してください");
    if (!executeRecaptcha) return alert("reCAPTCHAが初期化されていません");

    setLoading(true);
    try {
      const token = await executeRecaptcha("submit");
      const punchline = await generatePunchline(body);

      await addDoc(collection(db, "posts"), {
        title: title || "",
        body,
        punchline,
        createdAt: serverTimestamp(),
        recaptchaToken: token,
      });

      onDone?.(); // 投稿後の処理（モーダルを閉じる等）
    } catch (err) {
      console.error(err);
      alert("投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <input
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        placeholder="タイトル（任意）"
        className="border rounded px-3 py-2"
      />
      <textarea
        value={body}
        onChange={(e)=>setBody(e.target.value)}
        placeholder="本文"
        rows={6}
        className="border rounded px-3 py-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-60"
      >
        {loading ? "投稿中..." : "投稿する"}
      </button>
    </form>
  );
}