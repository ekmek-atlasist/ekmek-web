"use client";

import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  Briefcase,
  Loader2,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatSalaryDisplay,
  WORK_TYPES,
} from "@/lib/data/listing-constants";
import { auth, db } from "@/lib/firebase";
import { isEmployerSigningOut } from "@/lib/auth/panel-sign-out";

type ListingStatus =
  | "pending"
  | "active"
  | "paused"
  | "closed"
  | "rejected"
  | string;

type JobListing = {
  id: string;
  title: string;
  city: string;
  workType: string;
  positions: string[];
  salaryMin: string | null;
  salaryMax: string | null;
  status: ListingStatus;
  isUrgent?: boolean;
  companyName?: string | null;
  logoUrl?: string | null;
  createdAt?: Timestamp | null;
};

type FilterTab = "all" | "active" | "pending" | "inactive";

type CardAction = "pause" | "activate" | "delete";

type ApplicationStats = {
  total: number;
  pending: number;
};

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "active", label: "Yayında" },
  { id: "pending", label: "Onay Bekleyen" },
  { id: "inactive", label: "Durduruldu/Kapatıldı" },
];

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Onay Bekliyor",
    className: "bg-amber-100 text-amber-800",
  },
  active: {
    label: "Yayında",
    className: "bg-emerald-100 text-emerald-800",
  },
  paused: {
    label: "Durduruldu",
    className: "bg-neutral-100 text-neutral-600",
  },
  closed: {
    label: "Kapatıldı",
    className: "bg-red-50 text-red-700",
  },
  rejected: {
    label: "Reddedildi",
    className: "bg-red-100 text-red-800",
  },
};

function getWorkTypeLabel(workTypeId: string): string {
  return WORK_TYPES.find((t) => t.id === workTypeId)?.label ?? workTypeId;
}

function formatListingDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "";
  }
  return timestamp.toDate().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeListingAge(
  timestamp: Timestamp | null | undefined,
): string {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "";
  }

  const date = timestamp.toDate();
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "bugün";
  if (diffDays === 1) return "dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  return "";
}

function getStatusBadge(status: ListingStatus) {
  return (
    STATUS_BADGE[status] ?? {
      label: status,
      className: "bg-neutral-100 text-neutral-600",
    }
  );
}

function matchesFilter(listing: JobListing, filter: FilterTab): boolean {
  switch (filter) {
    case "active":
      return listing.status === "active";
    case "pending":
      return listing.status === "pending";
    case "inactive":
      return (
        listing.status === "paused" ||
        listing.status === "closed" ||
        listing.status === "rejected"
      );
    default:
      return true;
  }
}

function ListingAvatar({
  companyName,
  logoUrl,
}: {
  companyName: string | null;
  logoUrl: string | null;
}) {
  const initial = (companyName?.trim()[0] ?? "Ş").toUpperCase();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className="size-12 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#036AAF]/10 text-sm font-bold text-[#036AAF] ring-2 ring-white">
      {initial}
    </div>
  );
}

export default function PanelIlanlarPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [listings, setListings] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [cardAction, setCardAction] = useState<{
    id: string;
    type: CardAction;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobListing | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [applicationStatsByListing, setApplicationStatsByListing] = useState<
    Record<string, ApplicationStats>
  >({});
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (isEmployerSigningOut()) return;
        router.replace("/isveren/giris");
        return;
      }
      setUid(user.uid);
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "job_listings"),
      where("ownerId", "==", uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: JobListing[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: (data.title as string) ?? "",
            city: (data.city as string) ?? "",
            workType: (data.workType as string) ?? "",
            positions: Array.isArray(data.positions)
              ? (data.positions as string[])
              : [],
            salaryMin: (data.salaryMin as string | null) ?? null,
            salaryMax: (data.salaryMax as string | null) ?? null,
            status: (data.status as ListingStatus) ?? "pending",
            isUrgent: Boolean(data.isUrgent),
            companyName: (data.companyName as string | null) ?? null,
            logoUrl: (data.logoUrl as string | null) ?? null,
            createdAt: (data.createdAt as Timestamp | null) ?? null,
          };
        });

        items.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });

        setListings(items);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Listings snapshot failed:", err);
        setError("İlanlar yüklenemedi.");
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;

    void (async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "applications"),
            where("ownerId", "==", uid),
          ),
        );

        const stats = new Map<string, ApplicationStats>();

        for (const docSnap of snap.docs) {
          const listingId = String(docSnap.data().listingId ?? "");
          if (!listingId) continue;

          const current = stats.get(listingId) ?? { total: 0, pending: 0 };
          current.total += 1;
          if (docSnap.data().status === "pending") {
            current.pending += 1;
          }
          stats.set(listingId, current);
        }

        if (!cancelled) {
          setApplicationStatsByListing(Object.fromEntries(stats));
        }
      } catch (err) {
        console.error("Applications load failed:", err);
        if (!cancelled) {
          setApplicationStatsByListing({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const filteredListings = useMemo(
    () => listings.filter((listing) => matchesFilter(listing, activeFilter)),
    [listings, activeFilter],
  );

  async function handlePause(listingId: string) {
    setCardAction({ id: listingId, type: "pause" });
    setError(null);
    try {
      await updateDoc(doc(db, "job_listings", listingId), {
        status: "paused",
      });
    } catch {
      setError("İlan durdurulamadı.");
    } finally {
      setCardAction(null);
    }
  }

  async function handleActivate(listingId: string) {
    setCardAction({ id: listingId, type: "activate" });
    setError(null);
    try {
      await updateDoc(doc(db, "job_listings", listingId), {
        status: "active",
      });
    } catch {
      setError("İlan yayına alınamadı.");
    } finally {
      setCardAction(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setCardAction({ id: deleteTarget.id, type: "delete" });
    setError(null);

    try {
      await deleteDoc(doc(db, "job_listings", deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("İlan silinemedi.");
    } finally {
      setCardAction(null);
    }
  }

  function isCardBusy(listingId: string): boolean {
    return cardAction?.id === listingId;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">İlanlarım</h1>
          <p className="mt-1 text-sm text-neutral-500">
            İlanlarını görüntüle ve yönet
          </p>
        </div>
        <Link
          href="/isveren/panel/ilanlar/yeni"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#036AAF] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#025a94]"
        >
          <Plus className="size-4" aria-hidden />
          Yeni İlan
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === tab.id
                ? "bg-[#036AAF] text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <p
          className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="mt-10 flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-[#036AAF]" aria-hidden />
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#036AAF]/10 text-[#036AAF]">
            <Briefcase className="size-8" strokeWidth={1.5} />
          </div>
          <p className="mt-5 text-lg font-semibold text-[#0f2540]">
            Henüz ilan oluşturmadınız
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            İlk ilanını oluşturarak adaylara ulaşmaya başlayın.
          </p>
          <Link
            href="/isveren/panel/ilanlar/yeni"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#036AAF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94]"
          >
            <Plus className="size-4" aria-hidden />
            İlk İlanını Oluştur
          </Link>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-neutral-600">
            Bu kategoride ilan yok
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {filteredListings.map((listing) => {
            const badge = getStatusBadge(listing.status);
            const salaryText =
              formatSalaryDisplay(listing.salaryMin, listing.salaryMax) ??
              "Maaş belirtilmemiş";
            const busy = isCardBusy(listing.id);
            const stats = applicationStatsByListing[listing.id] ?? {
              total: 0,
              pending: 0,
            };
            const createdLabel = formatListingDate(listing.createdAt);
            const relativeLabel = formatRelativeListingAge(listing.createdAt);
            const dateLine = [createdLabel, relativeLabel]
              .filter(Boolean)
              .join(" · ");

            return (
              <li
                key={listing.id}
                className={`rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all ${
                  busy ? "opacity-70" : "hover:border-[#036AAF]/20 hover:shadow-md"
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    router.push(
                      `/isveren/panel/ilanlar/duzenle/${listing.id}`,
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(
                        `/isveren/panel/ilanlar/duzenle/${listing.id}`,
                      );
                    }
                  }}
                  className="cursor-pointer p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-3.5">
                      <ListingAvatar
                        companyName={listing.companyName ?? null}
                        logoUrl={listing.logoUrl ?? null}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-[#0f2540]">
                            {listing.title}
                          </h2>
                          {listing.isUrgent ? (
                            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                              Acil
                            </span>
                          ) : null}
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {listing.status === "pending" ? (
                          <p className="mt-1.5 text-xs text-neutral-400">
                            İlanınız inceleniyor, onaylanınca yayınlanacak.
                          </p>
                        ) : null}

                        {listing.positions.length > 0 ? (
                          <p className="mt-1 truncate text-sm text-neutral-600">
                            {listing.positions.join(", ")}
                          </p>
                        ) : null}

                        <p className="mt-1 text-sm text-neutral-500">
                          {listing.city}
                          {dateLine ? ` · ${dateLine}` : ""}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                            {getWorkTypeLabel(listing.workType)}
                          </span>
                          <span className="rounded-full bg-[#036AAF]/8 px-2.5 py-1 text-xs font-medium text-[#036AAF]">
                            {salaryText}
                          </span>
                          <Link
                            href={`/isveren/panel/basvurular?listing=${listing.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                              stats.pending > 0
                                ? "bg-[#036AAF]/10 text-[#036AAF] hover:bg-[#036AAF]/15"
                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                            }`}
                          >
                            <Users className="size-3" />
                            {stats.pending > 0
                              ? `${stats.pending} yeni başvuru`
                              : `${stats.total} başvuru`}
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/isveren/panel/ilanlar/duzenle/${listing.id}`,
                          )
                        }
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-[#036AAF]/30 hover:text-[#036AAF] disabled:opacity-50"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Düzenle
                      </button>

                      {listing.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => handlePause(listing.id)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-amber-300 hover:text-amber-700 disabled:opacity-50"
                        >
                          {busy && cardAction?.type === "pause" ? (
                            <Loader2
                              className="size-3.5 animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <Pause className="size-3.5" aria-hidden />
                          )}
                          Durdur
                        </button>
                      ) : null}

                      {listing.status === "paused" ? (
                        <button
                          type="button"
                          onClick={() => handleActivate(listing.id)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50"
                        >
                          {busy && cardAction?.type === "activate" ? (
                            <Loader2
                              className="size-3.5 animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <Play className="size-3.5" aria-hidden />
                          )}
                          Yayına Al
                        </button>
                      ) : null}

                      <div
                        className="relative"
                        ref={openMenuId === listing.id ? menuRef : null}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((current) =>
                              current === listing.id ? null : listing.id,
                            )
                          }
                          disabled={busy}
                          className="inline-flex size-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                          aria-label="Diğer işlemler"
                        >
                          <MoreVertical className="size-4" />
                        </button>

                        {openMenuId === listing.id ? (
                          <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg ring-1 ring-black/5">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleteTarget(listing);
                              }}
                              disabled={busy}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="size-4" />
                              Sil
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2
              id="delete-title"
              className="text-lg font-semibold text-[#1a1a1a]"
            >
              İlanı sil
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              &ldquo;{deleteTarget.title}&rdquo; ilanını silmek istediğinize
              emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={cardAction?.type === "delete"}
                className="flex-1 rounded-full border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={cardAction?.type === "delete"}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cardAction?.type === "delete" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Sil
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
