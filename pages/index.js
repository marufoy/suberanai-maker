import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PostForm from '../components/PostForm'
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, increment, query, orderBy } from 'firebase/firestore';
export default function HomePage() {
  const router = useRouter();
  const isPostOpen = router.query.post === "new";
  const [posts, setPosts] = useState([]);

  // モーダル開閉（シャロー遷移）
  const openPost = () => router.push('/?post=new', undefined, { shallow: true });
  const closePost = () => router.push('/', undefined, { shallow: true });

  // 投稿完了：モーダルを閉じてから一覧を再取得
  const handlePostDone = async () => {
    closePost();
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setPosts(fetched);
  }

  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedPosts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setPosts(fetchedPosts);
    };

    fetchPosts();
  }, []);

  // 👇 投票関数（+1する処理）
  const handleVote = async (postId, field) => {
    const postRef = doc(db, 'posts', postId);

    try {
      await updateDoc(postRef, {
        [field]: increment(1),
      });

      // ローカルでも即時反映（再フェッチなし）
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, [field]: (post[field] || 0) + 1 }
            : post
        )
      );
    } catch (err) {
      console.error('投票失敗:', err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>すべらない話一覧</h1>
      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            border: '1px solid #ccc',
            padding: '1rem',
            marginBottom: '1rem',
          }}
        >
          <h2>{post.title || '（タイトルなし）'}</h2>
          <p>{post.body}</p>
          <p><strong>オチ：</strong> {post.punchline || "（オチなし）"}</p>
          <p>👏：{post.funny || 0}　💤：{post.notFunny || 0}</p>

          {/* 👇 投票ボタン */}
          <button onClick={() => handleVote(post.id, 'funny')}>👏</button>
          <button onClick={() => handleVote(post.id, 'notFunny')}>💤</button>
        </div>
      ))}

      {/* ＋投稿（固定ボタン） */}
      <button
        onClick={openPost}
        aria-label="投稿を作成"
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '96px',
          borderRadius: '9999px',
          padding: '12px 18px',
          color: '#fff',
          background: '#000',
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
          fontWeight: 700,
        }}
      >
        ＋ 投稿
      </button>

      {/* モーダル */}
      {isPostOpen && (
        <Modal onClose={closePost}>
          <div style={{ marginBottom: '12px', fontSize: '18px', fontWeight: 600 }}>
            新規投稿
          </div>
          <PostForm onDone={handlePostDone} />
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
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
        /* 局所リセット & タイポ */
        .panel, .panel * {
          box-sizing: border-box;
          font: inherit;
          color: #222;
        }
        .panel :global(h1), .panel :global(h2), .panel :global(h3) { margin: 0 0 12px; line-height: 1.3; }
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