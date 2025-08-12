import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import PostForm from "../components/PostForm";

import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { getMyVote, toggleExclusive } from "../lib/vote-client";

export default function HomePage() {
  const router = useRouter();
  const isPostOpen = router.query.post === "new";
  const [posts, setPosts] = useState([]);
  const [myVotes, setMyVotes] = useState({}); // { [postId]: "funny" | "notFunny" | null }

  // 開く/閉じる（URLだけ変える）
  const openPost = () => router.push("/?post=new", undefined, { shallow: true });
  const closePost = () => router.push("/", undefined, { shallow: true });

  // 一覧取得
  const fetchPosts = useCallback(async () => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setPosts(fetched);
    // 自分の投票状態をまとめて取得（簡単版：逐次）
    const states = {};
    for (const p of fetched) {
      states[p.id] = await getMyVote(p.id);
    }
    setMyVotes(states);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // モーダル中の背景スクロールを止める
  useEffect(() => {
    document.body.style.overflow = isPostOpen ? "hidden" : "";
  }, [isPostOpen]);

  // 投稿完了後
  const handlePostDone = async () => {
    closePost();
    await fetchPosts();
  };

  // 投票
  const handleVote = async (postId, field /* "funny" | "notFunny" */) => {
    try {
      const { state, delta } = await toggleExclusive(postId, field);
      // カウントの楽観更新（両方に影響する可能性があるので2フィールド反映）
      setPosts(prev =>
        prev.map(p => p.id !== postId ? p : {
          ...p,
          funny: Math.max(0, (p.funny || 0) + (delta.funny || 0)),
          notFunny: Math.max(0, (p.notFunny || 0) + (delta.notFunny || 0)),
        })
      );
      // 自分の投票状態を更新
      setMyVotes(prev => ({ ...prev, [postId]: state }));
    } catch (err) {
      console.error("投票失敗:", err);
    }
  };

  return (
    <div className="page">
      {/* ▼ ヘッダー */}
      <header className="header">
        <h1 className="brand">すべらない話一覧</h1>
        <button className="headerBtn" onClick={openPost} aria-label="新しい話を投稿">
          <span className="plus">＋</span> 新しい話を投稿
        </button>
      </header>

      {/* ▼ 投稿一覧 */}
      {posts.map((post) => (
        <article key={post.id} className="card">
          <h2 className="cardTitle">{post.title || "（タイトルなし）"}</h2>
          <p className="body">{post.body}</p>
          <p className="punch"><strong>オチ：</strong>{post.punchline || "（オチなし）"}</p>

          <div className="actionsRow">
            <button
              className={`pill pink ${myVotes[post.id] === "funny" ? "active" : ""}`}
              onClick={() => handleVote(post.id, "funny")}
            >
              <span className="icon">♡</span> 面白い <span className="count">{post.funny || 0}</span>
            </button>
            <button
              className={`pill orange ${myVotes[post.id] === "notFunny" ? "active" : ""}`}
              onClick={() => handleVote(post.id, "notFunny")}
            >
              <span className="icon">⚡</span> イマイチ <span className="count">{post.notFunny || 0}</span>
            </button>
          </div>
        </article>
      ))}

      {/* ▼ モーダル */}
      {isPostOpen && (
        <Modal onClose={closePost}>
          <PostForm onDone={handlePostDone} />
        </Modal>
      )}

      {/* ▼ スタイル（色は前と揃えてます） */}
      <style jsx>{`
  .page {
    --pink: #ff4da6;
    --purple: #7b61ff;
    --ink: #222;
    --card: #fff;
    --line: #f5cfe0;
    --shadow: 0 12px 30px rgba(0,0,0,0.12);
    padding: 2rem;
  }

  /* === Header === */
  .header {
    position: sticky; top: 0; z-index: 20;
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0 18px;
    background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75));
    backdrop-filter: blur(6px);
    border-bottom: 2px solid var(--line);
  }
  .brand {
    margin: 0;
    font-size: 32px; font-weight: 900;
    background: linear-gradient(90deg, #ff4da6, #7b61ff);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }

  /* ★ 右上ボタン：はっきり分かるアニメ */
  .headerBtn{
    position: relative; overflow: hidden;
    border: none; color: #fff; font-weight: 800;
    padding: 12px 18px; border-radius: 12px;
    background: linear-gradient(135deg, var(--pink), var(--purple));
    background-size: 320% 100%;
    background-position: 0% 50%;
    box-shadow: 0 10px 25px rgba(0,0,0,.12);
    display: inline-flex; align-items: center; gap: 8px;
    cursor: pointer;
    transform: translateZ(0) scale(1);
    transition:
      transform .22s cubic-bezier(.2,.8,.2,1),
      background-position .6s ease,
      box-shadow .25s ease,
      filter .25s ease !important;
    will-change: transform, background-position, filter;
  }
  .headerBtn::after{
    content:"";
    position:absolute; inset:-25%;
    background: linear-gradient(120deg, transparent 40%, rgba(255,255,255,.55) 50%, transparent 60%);
    transform: translateX(-130%);
    transition: transform .7s ease;
  }
  .headerBtn:hover{
    transform: translateY(-2px) scale(1.10);
    background-position: 100% 50%;
    box-shadow: 0 16px 36px rgba(0,0,0,.18);
    filter: saturate(1.15) brightness(1.05);
  }
  .headerBtn:hover::after{ transform: translateX(130%); }
  .headerBtn:active{ transform: translateY(0) scale(0.96); }
  .headerBtn:focus-visible{ outline: 3px solid rgba(123,97,255,.35); outline-offset: 3px; }
  .headerBtn .plus{ font-size: 18px; line-height: 1; transition: transform .25s ease; }
  .headerBtn:hover .plus{ transform: rotate(45deg) scale(1.12); }

  /* === Cards（必要なら残してOK） === */
  .card {
    background: var(--card);
    border: 2px solid var(--line);
    border-radius: 16px;
    padding: 20px;
    margin: 18px 0;
    box-shadow: var(--shadow);
  }
  .cardTitle { margin: 0 0 6px; font-size: 20px; font-weight: 800; color: #e91e63; }
  .body { margin: 8px 0 10px; line-height: 1.8; color: var(--ink); }
  .punch { margin: 0 0 12px; color: var(--ink); }

  /* === 評価ボタン（中央寄せ＋アニメ） === */
  .actionsRow{
    display: flex; gap: 12px; align-items: center; justify-content: center;
    margin-top: 8px;
  }
  .pill{
    appearance: none; border: 2px solid currentColor; border-radius: 999px;
    padding: 10px 16px; font-weight: 800;
    display: inline-flex; align-items: center; gap: 6px;
    background: #fff; cursor: pointer;
    box-shadow: 0 4px 14px rgba(0,0,0,0.06);
    transform: translateZ(0) scale(1);
    transition:
      transform .18s cubic-bezier(.2,.8,.2,1),
      background-color .18s ease,
      box-shadow .18s ease !important;
    will-change: transform, background-color;
  }
  .pill .count{ margin-left: 6px; font-weight: 800; }
  .pill.pink{   color: #d73c8a; }
  .pill.orange{ color: #d3782b; }
  .pill:hover{ transform: scale(1.08); }
  .pill:active{ transform: scale(0.97); }
  .pill.pink:hover{   background: #ffeaf3; }
  .pill.orange:hover{ background: #fff2e5; }
  .pill.active{
  background: currentColor;
  color: #fff;
  box-shadow: 0 8px 22px rgba(0,0,0,.12) inset, 0 4px 10px rgba(0,0,0,.08);
}
  .pill:focus-visible{ outline: 3px solid rgba(123,97,255,.35); outline-offset: 2px; }

  @media (max-width: 560px) {
    .page { padding: 1.25rem; }
    .brand { font-size: 26px; }
    .headerBtn { padding: 10px 14px; }
  }
`}</style>

    </div>
  );
}

/* ---- Modal（局所スタイル付き） ---- */
function Modal({ children, onClose }) {
  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        <button className="close" onClick={onClose} aria-label="閉じる">×</button>
        {children}
      </div>

      <style jsx>{`
        .modal {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: grid;
          place-items: center;
        }
        .backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.42);
          backdrop-filter: blur(1px);
        }
        .panel {
          position: relative;
          width: min(720px, 92vw);
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow:
            0 10px 20px rgba(0,0,0,0.15),
            0 2px 6px rgba(0,0,0,0.08);
        }
        .panel, .panel * { box-sizing: border-box; font: inherit; color: #222; }
        .close {
          position: absolute;
          right: 12px;
          top: 10px;
          font-size: 22px;
          line-height: 1;
          background: transparent;
          border: none;
          cursor: pointer;
          opacity: .6;
        }
        .close:hover { opacity: 1; }

        @media (max-width: 480px) {
          .panel { padding: 18px; width: min(640px, 94vw); }
          .close { right: 8px; top: 8px; }
        }
      `}</style>
    </div>
  );
}

