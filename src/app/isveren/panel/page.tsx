"use client";

import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageSquare,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { isEmployerSigningOut } from "@/lib/auth/panel-sign-out";

type JobListing = {
  id: string;
  status: string;
};

type ApplicationRecord = {
  id: string;
  applicantId: string;
  listingId: string;
  status: string;
  createdAt?: unknown;
};

type MatchRecord = {
  id: string;
  user1Id: string;
  user2Id: string;
  status: string;
};

type ConversationRecord = {
  id: string;
  matchId: string;
  user1Id: string;
  user2Id: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
};

type ApplicantProfile = {
  fullName?: string;
  profilePhotoUrl?: string | null;
};

type RecentApplication = {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantPhoto: string | null;
  listingTitle: string;
  createdAt?: unknown;
};

type RecentChat = {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantPhoto: string | null;
  lastMessage: string;
  lastMessageAt: string | null;
};

type DashboardData = {
  companyName: string;
  stats: {
    totalListings: number;
    activeListings: number;
    pendingListings: number;
    pendingApplications: number;
    activeMatches: number;
    unreadMessages: number;
  };
  recentApplications: RecentApplication[];
  recentChats: RecentChat[];
};

function toDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "object" && value !== null) {
    if (
      "toDate" in value &&
      typeof (value as { toDate: () => Date }).toDate === "function"
    ) {
      const date = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (
      "seconds" in value &&
      typeof (value as { seconds: number }).seconds === "number"
    ) {
      const date = new Date((value as { seconds: number }).seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function sortByDateDesc<T extends { createdAt?: unknown }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = toDate(a.createdAt)?.getTime() ?? 0;
    const bTime = toDate(b.createdAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

function sortConversationsDesc(
  items: ConversationRecord[],
): ConversationRecord[] {
  return [...items].sort((a, b) => {
    const aTime =
      toDate(a.lastMessageAt)?.getTime() ??
      toDate(a.createdAt)?.getTime() ??
      0;
    const bTime =
      toDate(b.lastMessageAt)?.getTime() ??
      toDate(b.createdAt)?.getTime() ??
      0;
    return bTime - aTime;
  });
}

function formatActivityTime(value: unknown): string {
  const date = toDate(value);
  if (!date) return "—";

  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

function getApplicantId(
  conversation: ConversationRecord,
  employerId: string,
): string {
  if (conversation.user2Id === employerId) return conversation.user1Id;
  if (conversation.user1Id === employerId) return conversation.user2Id;
  return conversation.user1Id;
}

function parseConversation(
  id: string,
  data: Record<string, unknown>,
): ConversationRecord {
  return {
    id,
    matchId: String(data.matchId ?? ""),
    user1Id: String(data.user1Id ?? ""),
    user2Id: String(data.user2Id ?? ""),
    lastMessage:
      typeof data.lastMessage === "string" ? data.lastMessage : null,
    lastMessageAt:
      typeof data.lastMessageAt === "string" ? data.lastMessageAt : null,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : "",
  };
}

function ApplicantAvatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string | null;
}) {
  const initial = (name.trim()[0] ?? "A").toUpperCase();

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className="size-10 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#036AAF]/10 text-sm font-bold text-[#036AAF] ring-2 ring-white">
      {initial}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200/60">
      <div className="size-10 rounded-xl bg-neutral-100" />
      <div className="mt-4 h-8 w-12 rounded-lg bg-neutral-100" />
      <div className="mt-2 h-4 w-24 rounded bg-neutral-100" />
    </div>
  );
}

function StatCard({
  href,
  icon: Icon,
  value,
  label,
  highlight = false,
  badge = false,
}: {
  href: string;
  icon: typeof Briefcase;
  value: number;
  label: string;
  highlight?: boolean;
  badge?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        highlight
          ? "ring-[#036AAF]/30"
          : "ring-neutral-200/60 hover:ring-[#036AAF]/20"
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex size-11 items-center justify-center rounded-xl ${
            highlight
              ? "bg-[#036AAF]/12 text-[#036AAF]"
              : "bg-[#0f2540]/5 text-[#0f2540]"
          }`}
        >
          <Icon className="size-5" />
        </div>
        {badge && value > 0 ? (
          <span className="rounded-full bg-[#036AAF] px-2 py-0.5 text-[10px] font-bold text-white">
            Yeni
          </span>
        ) : null}
      </div>
      <p
        className={`mt-4 text-3xl font-bold tracking-tight ${
          highlight && value > 0 ? "text-[#036AAF]" : "text-[#0f2540]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-neutral-500">{label}</p>
      <ChevronRight className="absolute right-4 bottom-4 size-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#036AAF]" />
    </Link>
  );
}

function getWelcomeSubtitle(stats: DashboardData["stats"]): string {
  if (stats.pendingApplications > 0 && stats.unreadMessages > 0) {
    return `${stats.pendingApplications} başvuru ve ${stats.unreadMessages} mesaj seni bekliyor.`;
  }

  if (stats.pendingApplications > 0) {
    return `${stats.pendingApplications} yeni başvuru değerlendirmeni bekliyor.`;
  }

  if (stats.unreadMessages > 0) {
    return `${stats.unreadMessages} okunmamış mesajın var — adaylarınla iletişimde kal.`;
  }

  if (stats.totalListings === 0) {
    return "İlk ilanını oluştur, doğru adaylara ulaşmaya başla.";
  }

  if (stats.pendingListings > 0) {
    return `${stats.pendingListings} ilanın onay sürecinde; geri kalan her şey yolunda.`;
  }

  return "İlanların yayında. Yeni hareket olduğunda burada göreceksin.";
}

export default function PanelOzetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadDashboard = useCallback(async (uid: string) => {
    setIsLoading(true);

    try {
      const [
        listingsSnap,
        applicationsSnap,
        matchesAsEmployerSnap,
        matchesAsUser1Snap,
        conversationsAsUser1Snap,
        conversationsAsUser2Snap,
        corporateSnap,
      ] = await Promise.all([
        getDocs(
          query(collection(db, "job_listings"), where("ownerId", "==", uid)),
        ),
        getDocs(
          query(collection(db, "applications"), where("ownerId", "==", uid)),
        ),
        getDocs(
          query(collection(db, "matches"), where("user2Id", "==", uid)),
        ),
        getDocs(
          query(collection(db, "matches"), where("user1Id", "==", uid)),
        ),
        getDocs(
          query(collection(db, "conversations"), where("user1Id", "==", uid)),
        ),
        getDocs(
          query(collection(db, "conversations"), where("user2Id", "==", uid)),
        ),
        getDoc(doc(db, "corporate_profiles", uid)),
      ]);

      const listings: JobListing[] = listingsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        status: String(docSnap.data().status ?? ""),
      }));

      const applications: ApplicationRecord[] = applicationsSnap.docs.map(
        (docSnap) => {
          const item = docSnap.data();
          return {
            id: docSnap.id,
            applicantId: String(item.applicantId ?? ""),
            listingId: String(item.listingId ?? ""),
            status: String(item.status ?? ""),
            createdAt: item.createdAt,
          };
        },
      );

      const matchMap = new Map<string, MatchRecord>();
      for (const docSnap of [
        ...matchesAsEmployerSnap.docs,
        ...matchesAsUser1Snap.docs,
      ]) {
        const item = docSnap.data();
        matchMap.set(docSnap.id, {
          id: docSnap.id,
          user1Id: String(item.user1Id ?? ""),
          user2Id: String(item.user2Id ?? ""),
          status: String(item.status ?? ""),
        });
      }

      const conversationMap = new Map<string, ConversationRecord>();
      for (const docSnap of [
        ...conversationsAsUser1Snap.docs,
        ...conversationsAsUser2Snap.docs,
      ]) {
        conversationMap.set(
          docSnap.id,
          parseConversation(docSnap.id, docSnap.data()),
        );
      }

      const conversations = sortConversationsDesc([...conversationMap.values()]);
      const recentConversations = conversations.slice(0, 3);
      const recentApplicationRecords = sortByDateDesc(applications).slice(0, 5);

      const applicantIds = [
        ...new Set([
          ...recentApplicationRecords.map((item) => item.applicantId),
          ...recentConversations.map((item) => getApplicantId(item, uid)),
        ]),
      ].filter(Boolean);

      const listingIds = [
        ...new Set(recentApplicationRecords.map((item) => item.listingId)),
      ].filter(Boolean);

      const [profileEntries, listingEntries, unreadCounts] = await Promise.all([
        Promise.all(
          applicantIds.map(async (applicantId) => {
            try {
              const snap = await getDoc(
                doc(db, "individual_profiles", applicantId),
              );
              return [
                applicantId,
                snap.exists() ? (snap.data() as ApplicantProfile) : {},
              ] as const;
            } catch {
              return [applicantId, {}] as const;
            }
          }),
        ),
        Promise.all(
          listingIds.map(async (listingId) => {
            try {
              const snap = await getDoc(doc(db, "job_listings", listingId));
              const title = snap.exists()
                ? String(snap.data()?.title ?? "İlan")
                : "İlan";
              return [listingId, title] as const;
            } catch {
              return [listingId, "İlan"] as const;
            }
          }),
        ),
        Promise.all(
          conversations.map(async (conversation) => {
            try {
              const snap = await getDocs(
                query(
                  collection(db, "messages"),
                  where("conversationId", "==", conversation.id),
                  where("isRead", "==", false),
                ),
              );
              return snap.docs.filter(
                (docSnap) => docSnap.data().senderId !== uid,
              ).length;
            } catch {
              return 0;
            }
          }),
        ),
      ]);

      const profiles = Object.fromEntries(profileEntries) as Record<
        string,
        ApplicantProfile
      >;
      const listingTitles = Object.fromEntries(listingEntries) as Record<
        string,
        string
      >;

      const recentApplications: RecentApplication[] =
        recentApplicationRecords.map((application) => {
          const profile = profiles[application.applicantId];
          return {
            id: application.id,
            applicantId: application.applicantId,
            applicantName: profile?.fullName?.trim() || "Aday",
            applicantPhoto: profile?.profilePhotoUrl ?? null,
            listingTitle: listingTitles[application.listingId] ?? "İlan",
            createdAt: application.createdAt,
          };
        });

      const recentChats: RecentChat[] = recentConversations.map(
        (conversation) => {
          const applicantId = getApplicantId(conversation, uid);
          const profile = profiles[applicantId];
          return {
            id: conversation.id,
            applicantId,
            applicantName: profile?.fullName?.trim() || "Aday",
            applicantPhoto: profile?.profilePhotoUrl ?? null,
            lastMessage:
              conversation.lastMessage?.trim() || "Sohbet başlatıldı",
            lastMessageAt: conversation.lastMessageAt,
          };
        },
      );

      const companyName = corporateSnap.exists()
        ? String(corporateSnap.data()?.companyName ?? "").trim() || "Şirket"
        : "Şirket";

      setData({
        companyName,
        stats: {
          totalListings: listings.length,
          activeListings: listings.filter((item) => item.status === "active")
            .length,
          pendingListings: listings.filter((item) => item.status === "pending")
            .length,
          pendingApplications: applications.filter(
            (item) => item.status === "pending",
          ).length,
          activeMatches: [...matchMap.values()].filter(
            (item) => item.status === "active",
          ).length,
          unreadMessages: unreadCounts.reduce(
            (total, count) => total + count,
            0,
          ),
        },
        recentApplications,
        recentChats,
      });
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setData({
        companyName: "Şirket",
        stats: {
          totalListings: 0,
          activeListings: 0,
          pendingListings: 0,
          pendingApplications: 0,
          activeMatches: 0,
          unreadMessages: 0,
        },
        recentApplications: [],
        recentChats: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (isEmployerSigningOut()) return;
        router.replace("/isveren/giris");
        return;
      }

      void loadDashboard(user.uid);
    });

    return () => unsubscribe();
  }, [loadDashboard, router]);

  const todayLabel = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const stats = data?.stats ?? {
    totalListings: 0,
    activeListings: 0,
    pendingListings: 0,
    pendingApplications: 0,
    activeMatches: 0,
    unreadMessages: 0,
  };

  const actionItems: Array<{
    key: string;
    tone: "blue" | "amber";
    icon: typeof Users;
    title: string;
    description: string;
    href: string;
    action: string;
  }> = [];

  if (stats.pendingApplications > 0) {
    actionItems.push({
      key: "applications",
      tone: "blue",
      icon: Users,
      title:
        stats.pendingApplications === 1
          ? "1 yeni başvuru var"
          : `${stats.pendingApplications} yeni başvuru var`,
      description: "Adayları inceleyip hızlıca karar verebilirsin.",
      href: "/isveren/panel/basvurular",
      action: "Başvurulara git",
    });
  }

  if (stats.unreadMessages > 0) {
    actionItems.push({
      key: "messages",
      tone: "blue",
      icon: MessageSquare,
      title:
        stats.unreadMessages === 1
          ? "1 okunmamış mesajın var"
          : `${stats.unreadMessages} okunmamış mesajın var`,
      description: "Eşleştiğin adaylar sana yazmış olabilir.",
      href: "/isveren/panel/mesajlar",
      action: "Mesajları aç",
    });
  }

  if (stats.totalListings === 0) {
    actionItems.push({
      key: "no-listings",
      tone: "amber",
      icon: Briefcase,
      title: "Henüz ilan vermedin",
      description: "İlan açarak adayların seni bulmasını sağla.",
      href: "/isveren/panel/ilanlar/yeni",
      action: "İlan oluştur",
    });
  }

  if (stats.pendingListings > 0) {
    actionItems.push({
      key: "pending-listings",
      tone: "amber",
      icon: Clock,
      title:
        stats.pendingListings === 1
          ? "1 ilanın onay bekliyor"
          : `${stats.pendingListings} ilanın onay bekliyor`,
      description: "Yayına alındığında adaylar başvurmaya başlayacak.",
      href: "/isveren/panel/ilanlar",
      action: "İlanları gör",
    });
  }

  const welcomeSubtitle = getWelcomeSubtitle(stats);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f2540] via-[#0f2540] to-[#036AAF] px-6 py-7 shadow-md sm:px-8">
        <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 size-24 rounded-full bg-white/5" />

        <p className="text-sm font-medium capitalize text-white/65">
          {todayLabel}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Hoş geldin, {isLoading ? "..." : data?.companyName ?? "Şirket"}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
          {isLoading ? "Panelin yükleniyor..." : welcomeSubtitle}
        </p>

        {!isLoading ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {stats.activeListings > 0 ? (
              <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/10">
                {stats.activeListings} aktif ilan
              </span>
            ) : null}
            {stats.activeMatches > 0 ? (
              <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/10">
                {stats.activeMatches} eşleşme
              </span>
            ) : null}
            {stats.pendingApplications === 0 && stats.unreadMessages === 0 ? (
              <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-300/20">
                Bekleyen işlem yok
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-[#0f2540]">
          Genel Bakış
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              href="/isveren/panel/ilanlar"
              icon={Briefcase}
              value={stats.activeListings}
              label="Aktif İlan"
            />
            <StatCard
              href="/isveren/panel/basvurular"
              icon={Users}
              value={stats.pendingApplications}
              label="Bekleyen Başvuru"
              highlight
              badge
            />
            <StatCard
              href="/isveren/panel/mesajlar"
              icon={Sparkles}
              value={stats.activeMatches}
              label="Toplam Eşleşme"
            />
            <StatCard
              href="/isveren/panel/mesajlar"
              icon={MessageSquare}
              value={stats.unreadMessages}
              label="Okunmamış Mesaj"
              highlight={stats.unreadMessages > 0}
              badge={stats.unreadMessages > 0}
            />
          </>
        )}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0f2540]">
            Sıradaki Adımlar
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Öncelikli işlemlerin burada listelenir.
          </p>
        </div>
        {isLoading ? (
          <div className="animate-pulse rounded-2xl bg-neutral-100 p-5">
            <div className="h-4 w-48 rounded bg-neutral-200" />
          </div>
        ) : actionItems.length > 0 ? (
          actionItems.map((item) => {
            const ActionIcon = item.icon;

            return (
              <div
                key={item.key}
                className={`flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between ${
                  item.tone === "blue"
                    ? "bg-[#036AAF]/8 ring-1 ring-[#036AAF]/15"
                    : "bg-amber-50 ring-1 ring-amber-200/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      item.tone === "blue"
                        ? "bg-[#036AAF]/15 text-[#036AAF]"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <ActionIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f2540]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-600">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Link
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-1 self-start rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors sm:self-center ${
                    item.tone === "blue"
                      ? "bg-[#036AAF] hover:bg-[#025a94]"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {item.action}
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            );
          })
        ) : (
          <div className="flex items-start gap-4 rounded-2xl bg-emerald-50/90 p-5 ring-1 ring-emerald-200/50">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Her şey kontrol altında
              </p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-800/85">
                Bekleyen başvuru veya mesajın yok. Aktif ilanların aday
                toplamaya devam ediyor — yeni hareket olduğunda burada
                göreceksin.
              </p>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-[#0f2540]">
          Son Hareketler
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200/60">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#036AAF]/10 text-[#036AAF]">
                <Users className="size-4" />
              </div>
              <h3 className="text-base font-bold text-[#0f2540]">Son Başvurular</h3>
            </div>
            <Link
              href="/isveren/panel/basvurular"
              className="text-xs font-semibold text-[#036AAF] hover:underline"
            >
              Tümünü gör
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex animate-pulse gap-3">
                  <div className="size-10 rounded-full bg-neutral-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-neutral-100" />
                    <div className="h-3 w-24 rounded bg-neutral-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.recentApplications.length ? (
            <div className="space-y-1">
              {data.recentApplications.map((application) => (
                <Link
                  key={application.id}
                  href="/isveren/panel/basvurular"
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-neutral-50"
                >
                  <ApplicantAvatar
                    name={application.applicantName}
                    photoUrl={application.applicantPhoto}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0f2540]">
                      {application.applicantName}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {application.listingTitle}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] text-neutral-400">
                    <Clock className="size-3" />
                    {formatActivityTime(application.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-neutral-500">
                Henüz başvuru yok
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                İlanların yayına girdiğinde başvurular burada görünür.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200/60">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#036AAF]/10 text-[#036AAF]">
                <MessageSquare className="size-4" />
              </div>
              <h3 className="text-base font-bold text-[#0f2540]">Son Mesajlar</h3>
            </div>
            <Link
              href="/isveren/panel/mesajlar"
              className="text-xs font-semibold text-[#036AAF] hover:underline"
            >
              Tümünü gör
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex animate-pulse gap-3">
                  <div className="size-10 rounded-full bg-neutral-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-neutral-100" />
                    <div className="h-3 w-40 rounded bg-neutral-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.recentChats.length ? (
            <div className="space-y-1">
              {data.recentChats.map((chat) => (
                <Link
                  key={chat.id}
                  href="/isveren/panel/mesajlar"
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-neutral-50"
                >
                  <ApplicantAvatar
                    name={chat.applicantName}
                    photoUrl={chat.applicantPhoto}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0f2540]">
                      {chat.applicantName}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {chat.lastMessage}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-neutral-400">
                    {formatActivityTime(chat.lastMessageAt)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-neutral-500">
                Henüz mesaj yok
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Adaylarla eşleştiğinde sohbetler burada listelenir.
              </p>
            </div>
          )}
        </div>
        </div>
      </section>

      <section className="rounded-2xl bg-[#f8fafc] p-5 ring-1 ring-neutral-200/60">
        <p className="mb-4 text-sm font-semibold text-[#0f2540]">
          Hızlı Erişim
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/isveren/panel/ilanlar/yeni"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#036AAF] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#025a94]"
          >
            <Plus className="size-4" />
            Yeni İlan Oluştur
          </Link>
          <Link
            href="/isveren/panel/ilanlar"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-[#0f2540] transition-colors hover:bg-neutral-50"
          >
            İlanlarım
          </Link>
          <Link
            href="/isveren/panel/basvurular"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-[#0f2540] transition-colors hover:bg-neutral-50"
          >
            Başvurular
          </Link>
          <Link
            href="/isveren/panel/mesajlar"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-[#0f2540] transition-colors hover:bg-neutral-50"
          >
            Mesajlar
          </Link>
        </div>
      </section>
    </div>
  );
}
