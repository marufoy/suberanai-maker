import { useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { generatePunchline } from "../lib/generatePunchline";

export default function PostForm({ onDone }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
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
        funny: 0,
        notFunny: 0,
        createdAt: serverTimestamp(),
        recaptchaToken: token,
      });

      onDone?.();
    } catch (err) {
      console.error(err);
      alert("投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2 className="title">新規投稿</h2>

      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タイトル（任意）"
      />

      <textarea
        className="textarea"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="本文"
        rows={8}
      />

      <div className="actions">
        <button type="submit" disabled={loading} className="submit">
          {loading ? "投稿中..." : "投稿する"}
        </button>
      </div>

      <style jsx>{`
        .form {
          display: grid;
          gap: 16px;
          color: #222;
        }
        .title {
          margin: 0 0 4px;
          font-size: 22px;
          font-weight: 800;
          color: #b41367;
        }

        /* ▼ 初期状態：薄いピンクのボーダーのみ（黒は出さない） */
        .input,
        .textarea {
          width: 100%;
          border: 2px solid #ffd7e9; /* カラフル枠 */
          border-radius: 14px;
          padding: 12px 14px;
          background: #fff;
          outline: none;
          box-shadow: none; /* ★ 黒い枠を消す */
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .textarea {
          min-height: 220px;
          resize: vertical;
        }
        .input::placeholder,
        .textarea::placeholder {
          color: #9aa3ad;
        }

        /* ▼ フォーカス時：カラフル枠の“外側”に黒い枠を出す */
        .input:focus,
        .textarea:focus {
          border-color: #ff4da6; /* カラフル枠を少し濃く */
          /* 1枚目→黒い外周、2枚目→淡いピンクの外側グロー（お好みで） */
          box-shadow: 0 0 0 2px #111,
            /* ★ 外側の黒い枠（border の外） */ 0 0 0 6px
              rgba(255, 77, 166, 0.22); /* ふわっとしたピンクのリング（任意） */
        }

      
        .actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 6px;
        }
       
        .submit{
        position: relative;
        overflow: hidden;
        appearance: none;
        border: none;
        padding: 12px 18px;
        font-weight: 800;
        color: #fff;
        border-radius: 12px;
        background: linear-gradient(135deg, #ff4da6, #7b61ff);
        background-size: 320% 100%;
        background-position: 0% 50%;
        box-shadow: 0 10px 25px rgba(0,0,0,.12);
        cursor: pointer;
        transform: translateZ(0) scale(1); /* 初期transformでアニメ不発回避 */
        transition:
            transform .22s cubic-bezier(.2,.8,.2,1),
            background-position .6s ease,
            box-shadow .25s ease,
            filter .25s ease;
        will-change: transform, background-position, filter;
        }

        /* 斜めに“きらっ”と走る光 */
        .submit::after{
        content:"";
        position:absolute; inset:-25%;
        background: linear-gradient(120deg, transparent 40%, rgba(255,255,255,.55) 50%, transparent 60%);
        transform: translateX(-130%);
        transition: transform .7s ease;
        }

        .submit:hover{
        transform: translateY(-1px) scale(1.08);
        background-position: 100% 50%;
        box-shadow: 0 16px 36px rgba(0,0,0,.18);
        filter: saturate(1.12) brightness(1.05);
        }
        .submit:hover::after{ transform: translateX(130%); }

        .submit:active{
        transform: translateY(0) scale(0.96);
        }

        .submit:focus-visible{
        outline: 3px solid rgba(123,97,255,.35);
        outline-offset: 3px;
        }

        /* 無効化中はアニメ無効＆見た目控えめ */
        .submit[disabled]{
        opacity: .65;
        cursor: not-allowed;
        transform: none;
        filter: none;
        background-position: 0% 50%;
        }

      `}</style>
    </form>
  );
}
