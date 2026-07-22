"use client";

import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { firestoreIsoNow } from "@/lib/firebase-schema";
import { auth, db, storage } from "@/lib/firebase";
import { isEmployerSigningOut } from "@/lib/auth/panel-sign-out";

const SUBJECT_OPTIONS = [
  { id: "accountIssue", label: "Hesap ve giriş sorunları" },
  { id: "bugReport", label: "Uygulama hatası / teknik sorun" },
  { id: "matchOrApplication", label: "Eşleşme veya başvuru" },
  { id: "profileOrListing", label: "Profil veya ilan" },
  { id: "privacySecurity", label: "Gizlilik ve güvenlik" },
  { id: "featureRequest", label: "Öneri ve geri bildirim" },
  { id: "other", label: "Diğer" },
] as const;

type SubjectId = (typeof SUBJECT_OPTIONS)[number]["id"];

type TicketStatus = "pending" | "inProgress" | "resolved" | string;

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
  adminNote?: string | null;
  imageUrl?: string | null;
};

type UserContext = {
  userType: string;
  userEmail: string | null;
  userPhone: string | null;
  userDisplayName: string | null;
};

const fieldClassName =
  "w-full rounded-2xl border border-neutral-200/80 bg-white px-5 py-3.5 text-base text-[#1a1a1a] shadow-sm outline-none transition-shadow placeholder:text-neutral-400 focus:border-[#036AAF]/40 focus:shadow-[0_0_0_3px_rgba(3,106,175,0.12)] disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "mb-1.5 block text-sm font-medium text-[#1a1a1a]/80";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function formatTicketDate(value: unknown): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSubjectLabel(subjectId: string): string {
  return (
    SUBJECT_OPTIONS.find((option) => option.id === subjectId)?.label ??
    subjectId
  );
}

function getStatusBadge(status: TicketStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "inProgress":
      return {
        label: "İşleniyor",
        className: "bg-[#036AAF]/10 text-[#036AAF]",
      };
    case "resolved":
      return {
        label: "Çözüldü",
        className: "bg-emerald-100 text-emerald-800",
      };
    default:
      return {
        label: "Beklemede",
        className: "bg-amber-100 text-amber-800",
      };
  }
}

async function uploadSupportImage(uid: string, file: File): Promise<string> {
  const storageRef = ref(
    storage,
    `support_images/${uid}/${Date.now()}.jpg`,
  );
  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });
  return getDownloadURL(storageRef);
}

export default function PanelDestekPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uidRef = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const [subject, setSubject] = useState<SubjectId>("accountIssue");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedTickets = useMemo(
    () =>
      [...tickets].sort((a, b) => {
        const aTime = toDate(a.createdAt)?.getTime() ?? 0;
        const bTime = toDate(b.createdAt)?.getTime() ?? 0;
        return bTime - aTime;
      }),
    [tickets],
  );

  const loadTickets = useCallback(async (uid: string) => {
    try {
      const snap = await getDocs(
        query(collection(db, "support_tickets"), where("userId", "==", uid)),
      );

      setTickets(
        snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            subject: String(data.subject ?? ""),
            message: String(data.message ?? ""),
            status: String(data.status ?? "pending"),
            createdAt: String(data.createdAt ?? ""),
            adminNote:
              typeof data.adminNote === "string" ? data.adminNote : null,
            imageUrl:
              typeof data.imageUrl === "string" ? data.imageUrl : null,
          };
        }),
      );
    } catch (err) {
      console.error("Tickets load failed:", err);
      setTickets([]);
    }
  }, []);

  const loadPageData = useCallback(
    async (uid: string, phoneNumber: string | null) => {
      setIsLoading(true);
      setError(null);

      try {
        const [userSnap, corporateSnap] = await Promise.all([
          getDoc(doc(db, "users", uid)),
          getDoc(doc(db, "corporate_profiles", uid)),
        ]);

        const userData = userSnap.exists() ? userSnap.data() : {};
        const corporateData = corporateSnap.exists() ? corporateSnap.data() : {};

        setUserContext({
          userType: String(userData.userType ?? "kurumsal"),
          userEmail:
            typeof corporateData.email === "string" && corporateData.email.trim()
              ? corporateData.email.trim()
              : null,
          userPhone: phoneNumber,
          userDisplayName:
            typeof corporateData.companyName === "string" &&
            corporateData.companyName.trim()
              ? corporateData.companyName.trim()
              : null,
        });

        await loadTickets(uid);
      } catch (err) {
        console.error("Support page load failed:", err);
        setError("Sayfa yüklenemedi. Lütfen tekrar dene.");
      } finally {
        setIsLoading(false);
      }
    },
    [loadTickets],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (isEmployerSigningOut()) return;
        router.replace("/isveren/giris");
        return;
      }

      uidRef.current = user.uid;
      void loadPageData(user.uid, user.phoneNumber ?? null);
    });

    return () => unsubscribe();
  }, [loadPageData, router]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seçin.");
      return;
    }

    setError(null);
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError("Lütfen mesajınızı yazın.");
      return;
    }

    const uid = uidRef.current ?? auth.currentUser?.uid;
    if (!uid || !userContext) {
      if (isEmployerSigningOut()) return;
      router.replace("/isveren/giris");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadSupportImage(uid, imageFile);
      }

      await addDoc(collection(db, "support_tickets"), {
        userId: uid,
        userType: userContext.userType,
        userEmail: userContext.userEmail,
        userPhone: userContext.userPhone,
        userDisplayName: userContext.userDisplayName,
        subject,
        message: trimmedMessage,
        imageUrl,
        status: "pending",
        createdAt: firestoreIsoNow(),
      });

      setMessage("");
      clearImage();
      setSubject("accountIssue");
      setSuccessMessage(
        "Talebiniz alındı, en kısa sürede size dönüş yapılacak",
      );
      await loadTickets(uid);
    } catch (err) {
      console.error("Support ticket submit failed:", err);
      setError("Talep gönderilemedi. Lütfen tekrar dene.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-[#036AAF]" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2540]">Ekmek Destek</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sorun veya önerilerinizi bize iletin; ekibimiz en kısa sürede dönüş
          yapar.
        </p>
      </div>

      <section className="rounded-2xl bg-[#f8fafc] p-5 ring-1 ring-neutral-200/60">
        <p className="mb-3 text-sm font-semibold text-[#0f2540]">
          Hesap Bilgileriniz
        </p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Şirket</dt>
            <dd className="font-medium text-[#0f2540]">
              {userContext?.userDisplayName ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Telefon</dt>
            <dd className="font-medium text-[#0f2540]">
              {userContext?.userPhone ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">E-posta</dt>
            <dd className="font-medium text-[#0f2540]">
              {userContext?.userEmail ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Hesap türü</dt>
            <dd className="font-medium capitalize text-[#0f2540]">
              {userContext?.userType ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      <form
        className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200/60"
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        <div>
          <label htmlFor="support-subject" className={labelClassName}>
            Konu
          </label>
          <select
            id="support-subject"
            value={subject}
            onChange={(event) =>
              setSubject(event.target.value as SubjectId)
            }
            disabled={isSubmitting}
            className={fieldClassName}
          >
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="support-message" className={labelClassName}>
            Mesaj
          </label>
          <textarea
            id="support-message"
            rows={5}
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
            placeholder="Sorununuzu veya önerinizi detaylıca yazın"
            className={`${fieldClassName} resize-none`}
          />
        </div>

        <div>
          <p className={labelClassName}>Görsel (opsiyonel)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageSelect}
            disabled={isSubmitting}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full border border-[#036AAF]/25 bg-[#036AAF]/5 px-4 py-2.5 text-sm font-semibold text-[#036AAF] hover:bg-[#036AAF]/10 disabled:opacity-60"
            >
              <ImagePlus className="size-4" />
              Görsel Ekle
            </button>
            {imagePreview ? (
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt=""
                  className="size-12 rounded-lg object-cover ring-1 ring-neutral-200"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={isSubmitting}
                  className="text-sm font-medium text-neutral-500 hover:text-[#0f2540]"
                >
                  Kaldır
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p
            className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#036AAF] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#025a94] disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Gönder
            </>
          )}
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0f2540]">
          Geçmiş Talepleriniz
        </h2>

        {sortedTickets.length === 0 ? (
          <p className="rounded-2xl bg-neutral-50 px-5 py-8 text-center text-sm text-neutral-500 ring-1 ring-neutral-200/60">
            Henüz destek talebiniz yok.
          </p>
        ) : (
          <ul className="space-y-3">
            {sortedTickets.map((ticket) => {
              const badge = getStatusBadge(ticket.status);

              return (
                <li
                  key={ticket.id}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/60"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#0f2540]">
                        {getSubjectLabel(ticket.subject)}
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {formatTicketDate(ticket.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-neutral-600">
                    {ticket.message}
                  </p>
                  {ticket.adminNote ? (
                    <p className="mt-3 rounded-xl bg-[#036AAF]/8 px-3 py-2 text-sm text-[#0f2540]">
                      <span className="font-semibold">Ekip notu: </span>
                      {ticket.adminNote}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
