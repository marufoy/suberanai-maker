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
    <form onSubmit={handleSubmit} className="form">
      <input
        className="input"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        placeholder="タイトル（任意）"
      />
      <textarea
        className="textarea"
        value={body}
        onChange={(e)=>setBody(e.target.value)}
        placeholder="本文"
        rows={6}
      />
      <div className="actions">
        <button type="submit" disabled={loading} className="submit">
          {loading ? "投稿中..." : "投稿する"}
        </button>
      </div>

      <style jsx>{`
        .form { display: grid; gap: 14px; }
        .input, .textarea {
          width: 100%;
          border: 1px solid #cfd4dc;
          border-radius: 10px;
          padding: 10px 12px;
          background: #fff;
          outline: none;
        }
        .input::placeholder, .textarea::placeholder { color: #9aa3ad; }
        .textarea { min-height: 180px; resize: vertical; }
        .input:focus, .textarea:focus {
          border-color: #4c82f7;
          box-shadow: 0 0 0 3px rgba(76,130,247,0.2);
        }
        .actions { display: flex; justify-content: flex-end; margin-top: 6px; }
        .submit {
          border: none;
          border-radius: 10px;
          padding: 10px 16px;
          font-weight: 700;
          background: #111;
          color: #fff;
          cursor: pointer;
        }
        .submit[disabled] { opacity: .6; cursor: not-allowed; }
      `}</style>
    </form>
  );
}