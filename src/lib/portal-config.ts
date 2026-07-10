/**
 * The one thing that makes the portal "hidden": this route segment name.
 * Change it (rename the src/app/<slug> folder) if it's ever shared by accident —
 * that's a code change + deploy, tracked as a developer operation.
 *
 * Real access control is Firebase Auth + Firestore security rules, not this —
 * treat the obscure URL as a courtesy, not the lock.
 */
export const PORTAL_PATH = "nest-4x7q";

export const AUTHOR_EMAIL = process.env.NEXT_PUBLIC_AUTHOR_EMAIL ?? "";
