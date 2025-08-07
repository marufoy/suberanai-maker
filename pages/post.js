import { useState } from "react";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generatePunchline } from '../lib/generatePunchline';

export default function PostPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const { executeRecaptcha } = useGoogleReCaptcha(); // 追加

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!body) return alert("本文を入力してください");
    if (!executeRecaptcha) return alert("reCAPTCHAがまだ初期化されていません");

    setLoading(true);

    try {
      // トークン取得
      const token = await executeRecaptcha('submit');
      console.log("reCAPTCHA token:", token);

      // サーバーで検証
      const res = await fetch('/api/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await res.json();

      if (!result.success || result.score < 0.5) {
        alert("スパム判定されました。");
        setLoading(false);
        return;
      }

      // オチ生成 → 投稿保存
      const punchline = await generatePunchline(body);
      await addDoc(collection(db, "posts"), {
        title,
        body,
        punchline,
        createdAt: serverTimestamp(),
        funny: 0,
        notFunny: 0
      });

      alert("投稿が完了しました！");
      setTitle("");
      setBody("");

    } catch (err) {
      console.error("投稿エラー:", err);
      alert("投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>話を投稿する</h1>

      {loading && <p>オチを考えています...</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="タイトル（任意）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
          disabled={loading}
        />
        <textarea
          placeholder="本文（必須）"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ width: '100%', height: '100px', marginBottom: '1rem' }}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? '送信中...' : '投稿する'}
        </button>
      </form>
    </div>
  );
}