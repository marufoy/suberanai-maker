import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import PostForm from "../components/PostForm";

import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { getMyVote, toggleExclusiveFast, getVoteCount } from "../lib/vote-client";

export default function HomePage() {
  const router = useRouter();
  const isPostOpen = router.query.post === "new";
  const [posts, setPosts] = useState([]);
  const [myVotes, setMyVotes] = useState({}); // { [postId]: "funny" | "notFunny" | null }

  const openPost = () => router.push("/?post=new", undefined, { shallow: true });
  const closePost = () => router.push("/", undefined, { shallow: true });

  // 一覧＋合計カウント＋自分の投票状態をまとめて取得
  const fetchPosts = useCallback(async () => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 初期は全て null で埋めて“選択済みに見える”チラつきを防止
    setMyVotes(Object.fromEntries(fetched.map((p) => [p.id, null])));

    // ★ 各投稿の votes を count() で集計（他ユーザー分も含む）
    const counts = await Promise.all(
      fetched.map(async (p) => {
        const [f, n] = await Promise.all([
          getVoteCount(p.id, "funny"),
          getVoteCount(p.id, "notFunny"),
        ]);
        return { id: p.id, funny: f, notFunny: n };
      })
    );
    const byId = Object.fromEntries(counts.map((c) => [c.id, c]));
    setPosts(
      fetched.map((p) => ({
        ...p,
        funny: byId[p.id]?.funny ?? 0,
        notFunny: byId[p.id]?.notFunny ?? 0,
      }))
    );

    // 自分の投票状態を並列取得
    const statesArr = await Promise.all(fetched.map((p) => getMyVote(p.id)));
    setMyVotes(Object.fromEntries(fetched.map((p, i) => [p.id, statesArr[i]])));
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // モーダル中の背景スクロールを止める
  useEffect(() => {
    document.body.style.overflow = isPostOpen ? "hidden" : "";
  }, [isPostOpen]);

  // 投稿完了後
  const handlePostDone = async () => {
    closePost();
    await fetchPosts();
  };

  // 投票（順次 delete→set、UIは即時反映＋楽観更新）
  const handleVote = async (postId, field) => {
    const current = myVotes[postId] ?? null;
    // UI先行
    setMyVotes((prev) => ({ ...prev, [postId]: current === field ? null : field }));

    try {
      const { state, delta } = await toggleExclusiveFast(postId, field, current);

      // 合計の楽観更新（0未満ガード）
      setPosts((prev) =>
        prev.map((p) =>
          p.id !== postId
            ? p
            : {
              ...p,
              funny: Math.max(0, (p.funny || 0) + (delta.funny || 0)),
              notFunny: Math.max(0, (p.notFunny || 0) + (delta.notFunny || 0)),
            }
        )
      );

      setMyVotes((prev) => ({ ...prev, [postId]: state }));

      // （任意の厳密補正）押下後に最新カウントで補正したい場合は有効化
      // setTimeout(async () => {
      //   try {
      //     const [f, n] = await Promise.all([
      //       getVoteCount(postId, "funny"),
      //       getVoteCount(postId, "notFunny"),
      //     ]);
      //     setPosts((prev) =>
      //       prev.map((p) => (p.id !== postId ? p : { ...p, funny: f, notFunny: n }))
      //     );
      //   } catch {}
      // }, 700);
    } catch (err) {
      console.error("投票失敗:", err);
      // ロールバック
      setMyVotes((prev) => ({ ...prev, [postId]: current }));
    }
  };

  return (
    <div className="page">
      {/* ▼ ヘッダー */}
      <header className="header">
        <h1 className="brand">AIがムチャクチャなオチをつけてくれる掲示板</h1>
        <button className="headerBtn" onClick={openPost} aria-label="新しい話を投稿">
          <span className="plus">＋</span> 新しい話を投稿
        </button>
      </header>

      {/* ▼ 投稿一覧 */}
      {posts.map((post) => (
        <article key={post.id} className="card">
          <h2 className="cardTitle">{post.title || "（タイトルなし）"}</h2>
          <p className="body">{post.body}</p>
          <p className="punch">
            <strong>オチ：</strong>
            {post.punchline || "（オチなし）"}
          </p>

          <div className="actionsRow">
            <button
              className={`pill pink ${myVotes[post.id] === "funny" ? "active" : ""}`}
              onClick={() => handleVote(post.id, "funny")}
            >
              <span className="icon">♡</span> 面白い{" "}
              <span className="count">{post.funny ?? 0}</span>
            </button>
            <button
              className={`pill orange ${myVotes[post.id] === "notFunny" ? "active" : ""}`}
              onClick={() => handleVote(post.id, "notFunny")}
            >
              <span className="icon">⚡</span> イマイチ{" "}
              <span className="count">{post.notFunny ?? 0}</span>
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

      {/* ▼ スタイル */}
      <style jsx>{`
        .page {
          --pink: #ff4da6;
          --purple: #7b61ff;
          --ink: #222;
          --card: #fff;
          --line: #f5cfe0;
          --shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
          padding: 2rem;
        }

        /* Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 18px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.9),
            rgba(255, 255, 255, 0.75)
          );
          backdrop-filter: blur(6px);
          border-bottom: 2px solid var(--line);
        }
        .brand {
          margin: 0;
          font-size: 32px;
          font-weight: 900;
          background: linear-gradient(90deg, #ff4da6, #7b61ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .headerBtn {
          position: relative;
          overflow: hidden;
          border: none;
          color: #fff;
          font-weight: 800;
          padding: 12px 18px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--pink), var(--purple));
          background-size: 320% 100%;
          background-position: 0% 50%;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transform: translateZ(0) scale(1);
          transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1),
            background-position 0.6s ease, box-shadow 0.25s ease,
            filter 0.25s ease !important;
        }
        .headerBtn::after {
          content: "";
          position: absolute;
          inset: -25%;
          background: linear-gradient(
            120deg,
            transparent 40%,
            rgba(255, 255, 255, 0.55) 50%,
            transparent 60%
          );
          transform: translateX(-130%);
          transition: transform 0.7s ease;
        }
        .headerBtn:hover {
          transform: translateY(-2px) scale(1.1);
          background-position: 100% 50%;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
          filter: saturate(1.15) brightness(1.05);
        }
        .headerBtn:hover::after {
          transform: translateX(130%);
        }
        .headerBtn:active {
          transform: translateY(0) scale(0.96);
        }
        .headerBtn:focus-visible {
          outline: 3px solid rgba(123, 97, 255, 0.35);
          outline-offset: 3px;
        }
        .headerBtn .plus {
          font-size: 18px;
          line-height: 1;
          transition: transform 0.25s ease;
        }
        .headerBtn:hover .plus {
          transform: rotate(45deg) scale(1.12);
        }

        /* Cards */
        .card {
          background: var(--card);
          border: 2px solid var(--line);
          border-radius: 16px;
          padding: 20px;
          margin: 18px 0;
          box-shadow: var(--shadow);
        }
        .cardTitle {
          margin: 0 0 6px;
          font-size: 20px;
          font-weight: 800;
          color: #e91e63;
        }
        .body {
          margin: 8px 0 10px;
          line-height: 1.8;
          color: var(--ink);
        }
        .punch {
          margin: 0 0 12px;
          color: var(--ink);
        }

        /* Vote Buttons */
        .actionsRow {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: center;
          margin-top: 8px;
        }
        .pill {
          --fg: #555;
          --bg: #fff;
          --fg-active: #fff;
          appearance: none;
          border: 2px solid var(--fg);
          border-radius: 999px;
          padding: 10px 16px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg);
          color: var(--fg);
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
          transform: scale(1);
          transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
            background-color 0.18s ease, color 0.18s ease,
            box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .pill .count {
          margin-left: 6px;
          font-weight: 800;
        }
        .pill:hover {
          transform: scale(1.06);
        }
        .pill:active {
          transform: scale(0.97);
        }
        .pill:focus-visible {
          outline: 3px solid rgba(123, 97, 255, 0.35);
          outline-offset: 2px;
        }

        /* 面白い（ピンク） */
        .pill.pink {
          --fg: #d73c8a;
        }
        .pill.pink:hover {
          background: #ffeaf3;
        }
        .pill.pink.active {
          background: linear-gradient(180deg, #ff5bb5, #d73c8a);
          border-color: #d73c8a;
        }
        .pill.pink.active .icon {
          color: #fff;
        }

        /* イマイチ（オレンジ） */
        .pill.orange {
          --fg: #d3782b;
        }
        .pill.orange:hover {
          background: #fff2e5;
        }
        .pill.orange.active {
          background: linear-gradient(180deg, #ffb464, #d3782b);
          border-color: #d3782b;
          text-shadow: 0 0 6px rgba(255, 255, 255, 0.9);
        }
        .pill.orange.active .icon {
          color: #fffacd;
          filter: drop-shadow(0 0 4px gold);
        }

        /* 選択済み共通 */
        .pill.active {
          color: var(--fg-active);
          box-shadow: inset 0 8px 22px rgba(0, 0, 0, 0.12),
            0 6px 18px rgba(0, 0, 0, 0.12);
        }
        @media (max-width: 480px) {
    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    .headerBtn {
      font-size: 14px;
      padding: 8px 12px;
      border-radius: 8px;
      background-size: 200% 100%;
    }
    .brand {
      font-size: 24px;
      line-height: 1.2;
    }
  }
      `}</style>
    </div>
  );
}

/* ---- Modal ---- */
function Modal({ children, onClose }) {
  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        <button className="close" onClick={onClose} aria-label="閉じる">
          ×
        </button>
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
          background: rgba(0, 0, 0, 0.42);
          backdrop-filter: blur(1px);
        }
        .panel {
          position: relative;
          width: min(720px, 92vw);
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15),
            0 2px 6px rgba(0, 0, 0, 0.08);
        }
        .close {
          position: absolute;
          right: 12px;
          top: 10px;
          font-size: 22px;
          line-height: 1;
          background: transparent;
          border: none;
          cursor: pointer;
          opacity: 0.6;
        }
        .close:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}