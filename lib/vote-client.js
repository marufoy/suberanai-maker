// lib/vote-client.js
import { auth, db } from "../lib/firebase";
import {
  doc, getDoc, setDoc, deleteDoc,
  collection, query, getCountFromServer
} from "firebase/firestore";
import { ensureAnonAuth } from "./auth";

const OPP = { funny: "notFunny", notFunny: "funny" };

/** 自分の現在の投票状態を取得 */
export async function getMyVote(postId, uid) {
  const [f, n] = await Promise.all([
    getDoc(doc(db, `posts/${postId}/votes_funny/${uid}`)),
    getDoc(doc(db, `posts/${postId}/votes_notFunny/${uid}`)),
  ]);
  if (f.exists()) return "funny";
  if (n.exists()) return "notFunny";
  return null;
}

/** 片方だけ押せる排他トグル（バッチ不使用：順次書き込み） */
export async function toggleExclusive(postId, field /* "funny" | "notFunny" */) {
  await ensureAnonAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("未ログインです");

  const meRef  = doc(db, `posts/${postId}/votes_${field}/${uid}`);
  const oppRef = doc(db, `posts/${postId}/votes_${OPP[field]}/${uid}`);

  const current = await getMyVote(postId, uid);

  // 同じボタン → 取り消し
  if (current === field) {
    await deleteDoc(meRef);
    return { state: null, changed: field, delta: { funny: field==="funny" ? -1 : 0, notFunny: field==="notFunny" ? -1 : 0 } };
  }

  // 反対側が付いていたら、先に“個別リクエスト”で外す（ここがポイント）
  if (current === OPP[field]) {
    await deleteDoc(oppRef);
  }
  // その後に自分の票を付ける（別リクエスト）
  await setDoc(meRef, { uid, createdAt: new Date() });

  return {
    state: field,
    changed: field,
    delta: {
      funny: field === "funny" ? +1 : (current === "funny" ? -1 : 0),
      notFunny: field === "notFunny" ? +1 : (current === "notFunny" ? -1 : 0),
    },
  };
}

/** 正確な件数を取り直したい時用（任意） */
export async function getVoteCount(postId, field) {
  const snap = await getCountFromServer(query(collection(db, `posts/${postId}/votes_${field}`)));
  return snap.data().count;
}