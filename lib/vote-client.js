import { auth, db } from "../lib/firebase";
import {
  doc, getDoc, setDoc, deleteDoc, collection, query, getCountFromServer
} from "firebase/firestore";
import { ensureAnonAuth } from "./auth";

const opp = { funny: "notFunny", notFunny: "funny" };

/** 現在の自分の投票状態を取得 */
export async function getMyVote(postId) {
  await ensureAnonAuth();
  const uid = auth.currentUser.uid;
  const f = await getDoc(doc(db, `posts/${postId}/votes_funny/${uid}`));
  const n = await getDoc(doc(db, `posts/${postId}/votes_notFunny/${uid}`));
  if (f.exists()) return "funny";
  if (n.exists()) return "notFunny";
  return null;
}

/** 片方だけ押せる排他トグル */
export async function toggleExclusive(postId, field /* "funny" | "notFunny" */) {
  await ensureAnonAuth();
  const uid = auth.currentUser.uid;

  const my = await getMyVote(postId);
  const meRef = doc(db, `posts/${postId}/votes_${field}/${uid}`);
  const oppRef = doc(db, `posts/${postId}/votes_${opp[field]}/${uid}`);

  if (my === field) {
    // 同じボタンを再クリック → 取り消し
    await deleteDoc(meRef);
    return { state: null, changed: field, delta: { funny: field==="funny" ? -1 : 0, notFunny: field==="notFunny" ? -1 : 0 } };
  }

  // 逆側が付いていたら外す
  if (my === opp[field]) {
    await deleteDoc(oppRef);
  }
  // 自分の票を付ける
  await setDoc(meRef, { uid, createdAt: new Date() });

  return {
    state: field,
    changed: field,
    delta: {
      funny: field === "funny" ? +1 : (my === "funny" ? -1 : 0),
      notFunny: field === "notFunny" ? +1 : (my === "notFunny" ? -1 : 0),
    },
  };
}

/** カウントを正確に取り直したい時用（任意） */
export async function getVoteCount(postId, field) {
  const snap = await getCountFromServer(query(collection(db, `posts/${postId}/votes_${field}`)));
  return snap.data().count;
}