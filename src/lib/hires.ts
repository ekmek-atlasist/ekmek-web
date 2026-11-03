import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * `hires` koleksiyonu — doküman id'si her zaman matchId.
 * Mobil uygulamayla aynı sözleşme: alan adları, durum değerleri ve
 * istemci saatli `Timestamp.now()` kullanımı birebir aynı tutulmalı.
 */

const COLLECTION = "hires";
const WRITE_TIMEOUT_MS = 10_000;

export type HireStatus = "pending" | "confirmed" | "declined" | "cancelled";

export type HireRecord = {
  matchId: string;
  employerId: string;
  applicantId: string;
  listingId?: string;
  status: HireStatus;
};

const HIRE_STATUSES: HireStatus[] = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
];

/** Rozet ve menü biçimi bu duruma göre belirlenir. */
export function isHireLive(status: HireStatus | null | undefined): boolean {
  return status === "pending" || status === "confirmed";
}

function parseHire(data: unknown, id: string): HireRecord | null {
  if (!data || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  const status = raw.status;
  if (typeof status !== "string") return null;
  if (!HIRE_STATUSES.includes(status as HireStatus)) return null;

  return {
    matchId: typeof raw.matchId === "string" ? raw.matchId : id,
    employerId: typeof raw.employerId === "string" ? raw.employerId : "",
    applicantId: typeof raw.applicantId === "string" ? raw.applicantId : "",
    ...(typeof raw.listingId === "string" && raw.listingId
      ? { listingId: raw.listingId }
      : {}),
    status: status as HireStatus,
  };
}

/** Kayıt yoksa null gelir; sohbet ekranı tek doküman dinler. */
export function watchHireForMatch(
  matchId: string,
  onChange: (hire: HireRecord | null) => void,
  onError?: (error: unknown) => void,
): () => void {
  return onSnapshot(
    doc(db, COLLECTION, matchId),
    (snapshot) => {
      onChange(snapshot.exists() ? parseHire(snapshot.data(), snapshot.id) : null);
    },
    (error) => onError?.(error),
  );
}

/**
 * Kullanıcının taraf olduğu kayıtlar, matchId ile anahtarlı.
 * Güvenlik kuralları tek taraf alanıyla kısıtlanmış sorgu beklediği için
 * employerId ve applicantId ayrı ayrı dinlenip birleştirilir.
 */
export function watchHiresForUser(
  userId: string,
  onChange: (hires: Record<string, HireRecord>) => void,
): () => void {
  const sides: Record<"employerId" | "applicantId", HireRecord[]> = {
    employerId: [],
    applicantId: [],
  };

  const emit = () => {
    const merged: Record<string, HireRecord> = {};
    for (const hire of [...sides.employerId, ...sides.applicantId]) {
      merged[hire.matchId] = hire;
    }
    onChange(merged);
  };

  const subscribe = (field: "employerId" | "applicantId") =>
    onSnapshot(
      query(collection(db, COLLECTION), where(field, "==", userId)),
      (snapshot) => {
        sides[field] = snapshot.docs
          .map((snap) => parseHire(snap.data(), snap.id))
          .filter((hire): hire is HireRecord => hire !== null);
        emit();
      },
      () => {
        sides[field] = [];
        emit();
      },
    );

  const unsubscribers = [subscribe("employerId"), subscribe("applicantId")];

  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe();
  };
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("hire-write-timeout")),
      WRITE_TIMEOUT_MS,
    );

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * İptal edilmiş bir kayıt varsa yeniden `pending`e dönmesi gerektiği için
 * merge yerine tam set yazılır.
 */
export function markHired(params: {
  matchId: string;
  employerId: string;
  applicantId: string;
  listingId?: string;
}): Promise<void> {
  const { matchId, employerId, applicantId, listingId } = params;

  return withTimeout(
    setDoc(doc(db, COLLECTION, matchId), {
      matchId,
      employerId,
      applicantId,
      ...(listingId ? { listingId } : {}),
      status: "pending",
      markedAt: Timestamp.now(),
      respondedAt: null,
    }),
  );
}

/** İşverenin işaretlemeyi geri alması. */
export function cancelHire(matchId: string): Promise<void> {
  return withTimeout(
    updateDoc(doc(db, COLLECTION, matchId), { status: "cancelled" }),
  );
}

/** İşçinin yanıtı; kurallar yalnızca bu iki alanın değişmesine izin verir. */
export function respondToHire(
  matchId: string,
  confirmed: boolean,
): Promise<void> {
  return withTimeout(
    updateDoc(doc(db, COLLECTION, matchId), {
      status: confirmed ? "confirmed" : "declined",
      respondedAt: Timestamp.now(),
    }),
  );
}
