// lib/funny.js
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../lib/firebase";
import { ensureAnonAuth } from "./auth";

const functions = getFunctions(app, "asia-northeast1"); // ← Functionsのリージョン
const toggleFunny = httpsCallable(functions, "toggleFunny");

/** 投稿に対して“面白い”をトグル（投票/取消） */
export async function toggleFunnyVote(postId) {
  await ensureAnonAuth();                 // UIDを必ず付けてから
  const { data } = await toggleFunny({ postId });
  return data.toggled;                    // "voted" | "unvoted"
}