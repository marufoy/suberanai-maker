// functions/index.js
const functions = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

const ALLOWED_FIELDS = ["funny", "notFunny"]; // ← ここに許可する評価軸を列挙

exports.toggleVote = functions.onCall(
  { enforceAppCheck: true, region: "asia-northeast1" },
  async (req) => {
    const uid = req.auth?.uid;
    const postId = req.data?.postId;
    const field = req.data?.field;

    if (!uid) throw new functions.HttpsError("unauthenticated", "Sign in required");
    if (!postId) throw new functions.HttpsError("invalid-argument", "postId is required");
    if (!ALLOWED_FIELDS.includes(field)) {
      throw new functions.HttpsError("invalid-argument", "field must be one of " + ALLOWED_FIELDS.join(","));
    }

    const db = admin.firestore();
    const postRef = db.doc(`posts/${postId}`);
    const voteRef = postRef.collection(`votes_${field}`).doc(uid); // 例: votes_funny / votes_notFunny

    const res = await db.runTransaction(async (tx) => {
      const voted = (await tx.get(voteRef)).exists;
      const delta = voted ? -1 : +1;

      if (voted) tx.delete(voteRef);
      else tx.set(voteRef, { uid, field, createdAt: admin.firestore.FieldValue.serverTimestamp() });

      tx.update(postRef, { [field]: admin.firestore.FieldValue.increment(delta) });

      return { toggled: voted ? "unvoted" : "voted", field, delta };
    });

    return res;
  }
);