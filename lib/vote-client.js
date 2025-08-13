// lib/vote-client.js
import { db, auth } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  getCountFromServer,
} from "firebase/firestore";

/**
 * 自分の投票状態を取得
 * @param {string} postId
 * @returns {"funny"|"notFunny"|null}
 */
export async function getMyVote(postId) {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const funnyRef = doc(db, "posts", postId, "votes_funny", uid);
  const notRef   = doc(db, "posts", postId, "votes_notFunny", uid);

  const [funnySnap, notSnap] = await Promise.all([
    getDoc(funnyRef),
    getDoc(notRef),
  ]);

  if (funnySnap.exists()) return "funny";
  if (notSnap.exists())   return "notFunny";
  return null;
}

/**
 * 投票トグル（順次 delete→set でルール整合・UIは楽観更新前提）
 * @param {string} postId
 * @param {"funny"|"notFunny"} field
 * @param {"funny"|"notFunny"|null} current
 * @returns {{ state: "funny"|"notFunny"|null, delta: {funny?: number, notFunny?: number} }}
 */
export async function toggleExclusiveFast(postId, field, current) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("ログインが必要です");

  const isFunny = field === "funny";
  const myRef  = doc(db, "posts", postId, isFunny ? "votes_funny"   : "votes_notFunny", uid);
  const oppRef = doc(db, "posts", postId, isFunny ? "votes_notFunny": "votes_funny",    uid);

  const delta = {};

  // 同じボタンをもう一度 → 取り消し
  if (current === field) {
    await deleteDoc(myRef);
    delta[field] = -1;
    return { state: null, delta };
  }

  // 付け替え：反対側が付いていれば先に削除
  if (current && current !== field) {
    await deleteDoc(oppRef);
    delta[current] = -1;
  }

  // 目的の側を付与
  await setDoc(myRef, { createdAt: Date.now(), uid });
  delta[field] = (delta[field] || 0) + 1;

  return { state: field, delta };
}

/**
 * サブコレクションの件数を count() で取得
 * @param {string} postId
 * @param {"funny"|"notFunny"} which
 * @returns {Promise<number>}
 */
export async function getVoteCount(postId, which) {
  const q = query(collection(db, "posts", postId, `votes_${which}`));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}