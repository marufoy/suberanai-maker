import { getAuth } from "firebase/auth";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, collection, query, getCountFromServer } from "firebase/firestore";
import { ensureAnonAuth } from "./auth"; // まだ作ってなければ前のメッセで作成

// "funny" または "notFunny" を受け取り、票をトグルする
export async function toggleVoteClient(postId, field) {
  await ensureAnonAuth();
  const uid = getAuth().currentUser.uid;
  const voteRef = doc(db, `posts/${postId}/votes_${field}/${uid}`);

  const snap = await getDoc(voteRef);
  if (snap.exists()) {
    await deleteDoc(voteRef);   // 取り消し
    return { toggled: "unvoted", delta: -1 };
  } else {
    await setDoc(voteRef, { uid, createdAt: new Date() }); // 新規投票
    return { toggled: "voted",   delta: +1 };
  }
}

// 正確な件数を取り直したいとき用
export async function getVoteCount(postId, field) {
  const q = query(collection(db, `posts/${postId}/votes_${field}`));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}