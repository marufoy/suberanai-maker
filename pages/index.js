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
+   setPosts(fetched);
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

      
    </div>
  );
}