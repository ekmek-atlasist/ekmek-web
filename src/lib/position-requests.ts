import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { firestoreIsoNow } from "@/lib/firebase-schema";

const MIN_LENGTH = 2;
const MAX_LENGTH = 60;

export function validatePositionRequestText(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length < MIN_LENGTH) {
    return "Lütfen en az 2 karakter yazın.";
  }
  if (trimmed.length > MAX_LENGTH) {
    return `En fazla ${MAX_LENGTH} karakter yazabilirsiniz.`;
  }
  return null;
}

export async function createPositionRequest({
  userId,
  requestedText,
  userDisplayName,
}: {
  userId: string;
  requestedText: string;
  userDisplayName?: string | null;
}) {
  const trimmed = requestedText.trim();
  const validationError = validatePositionRequestText(trimmed);
  if (validationError) {
    throw new Error(validationError);
  }

  const docRef = await addDoc(collection(db, "position_requests"), {
    userId,
    requestedText: trimmed,
    userDisplayName: userDisplayName?.trim() || null,
    status: "pending",
    createdAt: firestoreIsoNow(),
  });

  return docRef.id;
}
