"use client";

import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  Ban,
  Flag,
  Headphones,
  HelpCircle,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  MoreVertical,
  Send,
  Shield,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { firestoreIsoNow, firestoreLocalIsoNow } from "@/lib/firebase-schema";
import { auth, db } from "@/lib/firebase";
import { isEmployerSigningOut } from "@/lib/auth/panel-sign-out";

type MatchRecord = {
  id: string;
  user1Id: string;
  user2Id: string;
  listingId: string;
  applicationId?: string;
  status: string;
  createdAt?: unknown;
};

type ConversationRecord = {
  id: string;
  matchId: string;
  user1Id: string;
  user2Id: string;
  lastMessage: string | null;
  lastMessageSenderId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
};

type MessageRecord = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

type Experience = {
  title?: string;
  companyName?: string;
  startDate?: unknown;
  endDate?: unknown;
  isCurrent?: boolean;
  description?: string;
};

type ApplicantProfile = {
  fullName?: string;
  profilePhotoUrl?: string | null;
  birthDate?: unknown;
  gender?: string;
  city?: string;
  district?: string;
  about?: string;
  educationLevel?: string;
  positions?: string[];
  militaryStatus?: string;
  driverLicenses?: string[];
  languages?: string[];
  experiences?: Experience[];
  specialStatuses?: string[];
};

const GENDER_LABELS: Record<string, string> = {
  male: "Erkek",
  female: "Kadın",
  unspecified: "Belirtilmemiş",
};

const EDUCATION_LABELS: Record<string, string> = {
  ilkokul: "İlkokul",
  ortaokul: "Ortaokul",
  lise: "Lise",
  onLisans: "Ön Lisans",
  lisans: "Lisans",
  yuksekLisans: "Yüksek Lisans",
  doktora: "Doktora",
};

const MILITARY_LABELS: Record<string, string> = {
  exempt: "Muaf",
  completed: "Yapıldı",
  notCompleted: "Yapılmadı",
  deferred: "Tecilli",
};

const SPECIAL_STATUS_LABELS: Record<string, string> = {
  disabled: "Engelli",
  veteran: "Şehit/Gazi yakını",
  disasterVolunteer: "Afet gönüllüsü",
};

type SelectedChat = {
  matchId: string;
  conversationId: string | null;
  applicantId: string;
};

const REPORT_REASONS = [
  "Spam",
  "Uygunsuz içerik",
  "Sahte profil / ilan",
  "Taciz veya hakaret",
  "Dolandırıcılık",
  "Diğer",
] as const;

const EKMEK_TEAM_WELCOME_MESSAGE = `Merhaba! Ekmek'e hoş geldin.

Bu kanal yalnızca bilgilendirme amaçlıdır; buradan mesaj gönderemezsin. Soruların, önerilerin veya teknik destek taleplerin için aşağıdaki bağlantılardan bize ulaşabilirsin. Ekibimiz en kısa sürede dönüş yapar.`;

const EKMEK_TEAM_LINKS = [
  {
    icon: Headphones,
    label: "Destek Talebi Gönder",
    href: "/isveren/panel/destek",
    useRouter: true,
  },
  {
    icon: HelpCircle,
    label: "Sık Sorulan Sorular",
    href: "/yasal/sss",
    useRouter: false,
  },
  {
    icon: Shield,
    label: "Güvenli Kullanım İpuçları",
    href: "/yasal/guvenli-kullanim",
    useRouter: false,
  },
  {
    icon: Users,
    label: "Topluluk Kuralları",
    href: "/yasal/topluluk-kurallari",
    useRouter: false,
  },
] as const;

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

function sortByIsoDesc(
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

function sortMessagesAsc(items: MessageRecord[]): MessageRecord[] {
  return [...items].sort((a, b) => {
    const aTime = toDate(a.createdAt)?.getTime() ?? 0;
    const bTime = toDate(b.createdAt)?.getTime() ?? 0;
    return aTime - bTime;
  });
}

function formatMessageTime(value: unknown): string {
  const date = toDate(value);
  if (!date) return "";

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

function formatBubbleTime(value: unknown): string {
  const date = toDate(value);
  if (!date) return "";

  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDayKey(value: unknown): string {
  const date = toDate(value);
  if (!date) return "";

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDateSeparator(value: unknown): string {
  const date = toDate(value);
  if (!date) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (messageDay.getTime() === today.getTime()) return "Bugün";
  if (messageDay.getTime() === yesterday.getTime()) return "Dün";

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type MessageListItem =
  | { kind: "separator"; key: string; label: string }
  | { kind: "message"; key: string; message: MessageRecord; compactTop: boolean };

function buildMessageListItems(messages: MessageRecord[]): MessageListItem[] {
  const items: MessageListItem[] = [];
  let lastDayKey = "";

  for (const message of messages) {
    const dayKey = getDayKey(message.createdAt);

    if (dayKey && dayKey !== lastDayKey) {
      items.push({
        kind: "separator",
        key: `sep-${dayKey}`,
        label: formatDateSeparator(message.createdAt),
      });
      lastDayKey = dayKey;
    }

    const previous = items[items.length - 1];
    const compactTop =
      previous?.kind === "message" &&
      previous.message.senderId === message.senderId;

    items.push({
      kind: "message",
      key: message.id,
      message,
      compactTop,
    });
  }

  return items;
}

function formatMonthYear(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}

function formatExperienceDateRange(experience: Experience): string {
  const start = formatMonthYear(toDate(experience.startDate));
  if (!start) return "";

  if (experience.isCurrent) {
    return `${start} – Halen`;
  }

  const end = formatMonthYear(toDate(experience.endDate));
  if (end) {
    return `${start} – ${end}`;
  }

  return start;
}

function calculateAge(birthDate: unknown): number | null {
  const date = toDate(birthDate);
  if (!date) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

function labelFromMap(map: Record<string, string>, value?: string): string {
  if (!value) return "—";
  return map[value] ?? value;
}

function formatLocation(city?: string, district?: string): string {
  if (city && district) return `${city} / ${district}`;
  return city ?? district ?? "—";
}

function getApplicantId(match: MatchRecord, employerId: string): string {
  if (match.user2Id === employerId) return match.user1Id;
  if (match.user1Id === employerId) return match.user2Id;
  return match.user1Id;
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
    lastMessageSenderId:
      typeof data.lastMessageSenderId === "string"
        ? data.lastMessageSenderId
        : null,
    lastMessageAt:
      typeof data.lastMessageAt === "string" ? data.lastMessageAt : null,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : "",
  };
}

function EkmekTeamAvatar({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "lg"
      ? "size-14"
      : size === "sm"
        ? "size-10"
        : "size-12";
  const iconSize =
    size === "lg" ? 28 : size === "sm" ? 20 : 24;

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-[#036AAF] ring-2 ring-white ${className}`}
    >
      <Image
        src="/ekmek_icon.svg"
        alt=""
        width={iconSize}
        height={iconSize}
        className="rounded-md"
      />
    </div>
  );
}

function ApplicantAvatar({
  name,
  photoUrl,
  size = "md",
  className = "",
}: {
  name: string;
  photoUrl: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initial = (name.trim()[0] ?? "A").toUpperCase();
  const sizeClass =
    size === "xl"
      ? "size-20 text-2xl"
      : size === "lg"
        ? "size-11"
        : size === "sm"
          ? "size-10"
          : "size-12";

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-2 ring-white ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-[#036AAF]/10 font-bold text-[#036AAF] ring-2 ring-white ${className}`}
    >
      {initial}
    </div>
  );
}

export default function PanelMesajlarPage() {
  const router = useRouter();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const employerIdRef = useRef<string | null>(null);

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const [employerId, setEmployerId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ApplicantProfile>>(
    {},
  );
  const [listingTitles, setListingTitles] = useState<Record<string, string>>(
    {},
  );
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [isEkmekTeamSelected, setIsEkmekTeamSelected] = useState(false);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [draft, setDraft] = useState("");
  const [profileApplicantId, setProfileApplicantId] = useState<string | null>(
    null,
  );
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<
    (typeof REPORT_REASONS)[number]
  >(REPORT_REASONS[0]);
  const [reportOtherText, setReportOtherText] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [deleteChatError, setDeleteChatError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const blockedUserIdSet = useMemo(
    () => new Set(blockedUserIds),
    [blockedUserIds],
  );

  const visibleMatches = useMemo(() => {
    if (!employerId) return matches;
    return matches.filter(
      (match) => !blockedUserIdSet.has(getApplicantId(match, employerId)),
    );
  }, [blockedUserIdSet, employerId, matches]);

  const visibleConversations = useMemo(() => {
    if (!employerId) return conversations;
    return conversations.filter((conversation) => {
      const match = matches.find((item) => item.id === conversation.matchId);
      if (!match) return false;
      return !blockedUserIdSet.has(getApplicantId(match, employerId));
    });
  }, [blockedUserIdSet, conversations, employerId, matches]);

  const conversationByMatchId = useMemo(() => {
    const map = new Map<string, ConversationRecord>();
    for (const conversation of visibleConversations) {
      if (conversation.matchId) {
        map.set(conversation.matchId, conversation);
      }
    }
    return map;
  }, [visibleConversations]);

  const sortedConversations = useMemo(
    () => sortByIsoDesc(visibleConversations),
    [visibleConversations],
  );

  const newMatches = useMemo(
    () =>
      visibleMatches.filter((match) => !conversationByMatchId.has(match.id)),
    [visibleMatches, conversationByMatchId],
  );

  const loadProfiles = useCallback(async (applicantIds: string[]) => {
    const uniqueIds = [...new Set(applicantIds.filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const entries = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, "individual_profiles", id));
          return [id, snap.exists() ? (snap.data() as ApplicantProfile) : {}] as const;
        } catch {
          return [id, {}] as const;
        }
      }),
    );

    setProfiles((prev) => {
      const next = { ...prev };
      for (const [id, profile] of entries) {
        next[id] = profile;
      }
      return next;
    });
  }, []);

  const loadListingTitles = useCallback(async (listingIds: string[]) => {
    const uniqueIds = [...new Set(listingIds.filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const entries = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, "job_listings", id));
          const title = snap.exists()
            ? String(snap.data()?.title ?? "İlan")
            : "İlan";
          return [id, title] as const;
        } catch {
          return [id, "İlan"] as const;
        }
      }),
    );

    setListingTitles((prev) => {
      const next = { ...prev };
      for (const [id, title] of entries) {
        next[id] = title;
      }
      return next;
    });
  }, []);

  const refreshUnreadCounts = useCallback(
    async (items: ConversationRecord[], uid: string) => {
      const counts = await Promise.all(
        items.map(async (conversation) => {
          try {
            const snap = await getDocs(
              query(
                collection(db, "messages"),
                where("conversationId", "==", conversation.id),
                where("isRead", "==", false),
              ),
            );

            const unread = snap.docs.filter(
              (docSnap) => docSnap.data().senderId !== uid,
            ).length;

            return [conversation.id, unread] as const;
          } catch {
            return [conversation.id, 0] as const;
          }
        }),
      );

      setUnreadCounts(Object.fromEntries(counts));
    },
    [],
  );

  const loadBlockedUsers = useCallback(async (uid: string) => {
    try {
      const snap = await getDocs(
        query(collection(db, "blocks"), where("blockerId", "==", uid)),
      );
      setBlockedUserIds(
        snap.docs
          .map((docSnap) => String(docSnap.data().blockedUserId ?? ""))
          .filter(Boolean),
      );
    } catch (err) {
      console.error("Blocks load failed:", err);
      setBlockedUserIds([]);
    }
  }, []);

  const loadMatches = useCallback(
    async (uid: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const [asEmployerSnap, asUser1Snap] = await Promise.all([
          getDocs(
            query(
              collection(db, "matches"),
              where("user2Id", "==", uid),
              where("status", "==", "active"),
            ),
          ),
          getDocs(
            query(
              collection(db, "matches"),
              where("user1Id", "==", uid),
              where("status", "==", "active"),
            ),
          ),
        ]);

        const matchMap = new Map<string, MatchRecord>();

        for (const snapshot of [...asEmployerSnap.docs, ...asUser1Snap.docs]) {
          const data = snapshot.data();
          matchMap.set(snapshot.id, {
            id: snapshot.id,
            user1Id: String(data.user1Id ?? ""),
            user2Id: String(data.user2Id ?? ""),
            listingId: String(data.listingId ?? ""),
            applicationId: data.applicationId
              ? String(data.applicationId)
              : undefined,
            status: String(data.status ?? ""),
            createdAt: data.createdAt,
          });
        }

        const loadedMatches = [...matchMap.values()];
        setMatches(loadedMatches);

        const applicantIds = loadedMatches.map((match) =>
          getApplicantId(match, uid),
        );
        const listingIds = loadedMatches.map((match) => match.listingId);

        await Promise.all([
          loadProfiles(applicantIds),
          loadListingTitles(listingIds),
        ]);
      } catch (err) {
        console.error("Matches load failed:", err);
        setError("Eşleşmeler yüklenemedi. Lütfen tekrar dene.");
      } finally {
        setIsLoading(false);
      }
    },
    [loadListingTitles, loadProfiles],
  );

  const markConversationAsRead = useCallback(
    async (conversationId: string, applicantId: string) => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "messages"),
            where("conversationId", "==", conversationId),
            where("isRead", "==", false),
          ),
        );

        const unreadDocs = snap.docs.filter(
          (docSnap) => docSnap.data().senderId === applicantId,
        );

        await Promise.all(
          unreadDocs.map((docSnap) =>
            updateDoc(docSnap.ref, { isRead: true }),
          ),
        );

        if (unreadDocs.length > 0) {
          setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
        }
      } catch (err) {
        console.error("Mark as read failed:", err);
      }
    },
    [],
  );

  const openConversation = useCallback(
    (conversation: ConversationRecord, uid: string) => {
      const match = matches.find((item) => item.id === conversation.matchId);
      if (!match) return;

      const applicantId = getApplicantId(match, uid);
      setIsEkmekTeamSelected(false);
      setSelectedChat({
        matchId: match.id,
        conversationId: conversation.id,
        applicantId,
      });
      setSendError(null);
      void markConversationAsRead(conversation.id, applicantId);
    },
    [markConversationAsRead, matches],
  );

  const openNewMatch = useCallback((match: MatchRecord, uid: string) => {
    setIsEkmekTeamSelected(false);
    setSelectedChat({
      matchId: match.id,
      conversationId: null,
      applicantId: getApplicantId(match, uid),
    });
    setMessages([]);
    setSendError(null);
  }, []);

  const openEkmekTeam = useCallback(() => {
    setIsEkmekTeamSelected(true);
    setSelectedChat(null);
    setMessages([]);
    setDraft("");
    setSendError(null);
    setChatMenuOpen(false);
  }, []);

  const closeActivePanel = useCallback(() => {
    setIsEkmekTeamSelected(false);
    setSelectedChat(null);
  }, []);

  const hasActivePanel = isEkmekTeamSelected || selectedChat !== null;

  const handleSend = useCallback(async () => {
    const uid = employerIdRef.current;
    if (!uid || !selectedChat) return;

    const trimmed = draft.trim();
    if (!trimmed) return;

    setIsSending(true);
    setSendError(null);

    try {
      let conversationId =
        selectedChat.conversationId ??
        conversationByMatchId.get(selectedChat.matchId)?.id ??
        null;

      if (!conversationId) {
        const conversationRef = await addDoc(collection(db, "conversations"), {
          matchId: selectedChat.matchId,
          user1Id: uid,
          user2Id: selectedChat.applicantId,
          lastMessage: null,
          lastMessageSenderId: null,
          lastMessageAt: null,
          createdAt: firestoreLocalIsoNow(),
        });

        conversationId = conversationRef.id;
      }

      setSelectedChat((prev) =>
        prev ? { ...prev, conversationId } : prev,
      );

      const nowIso = firestoreLocalIsoNow();

      await addDoc(collection(db, "messages"), {
        conversationId,
        senderId: uid,
        content: trimmed,
        isRead: false,
        createdAt: nowIso,
      });

      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: trimmed,
        lastMessageSenderId: uid,
        lastMessageAt: nowIso,
      });

      setDraft("");
    } catch (err) {
      console.error("Send message failed:", err);
      setSendError("Mesaj gönderilemedi. Lütfen tekrar dene.");
    } finally {
      setIsSending(false);
    }
  }, [conversationByMatchId, draft, selectedChat]);

  const handleOpenReport = useCallback(() => {
    setChatMenuOpen(false);
    setReportError(null);
    setReportSuccess(null);
    setSelectedReportReason(REPORT_REASONS[0]);
    setReportOtherText("");
    setReportModalOpen(true);
  }, []);

  const handleSubmitReport = useCallback(async () => {
    const uid = employerIdRef.current;
    if (!uid || !selectedChat) return;

    setIsReporting(true);
    setReportError(null);
    setReportSuccess(null);

    try {
      const pendingSnap = await getDocs(
        query(
          collection(db, "reports"),
          where("reporterId", "==", uid),
          where("status", "==", "pending"),
        ),
      );

      const hasPending = pendingSnap.docs.some(
        (docSnap) => docSnap.data().reportedId === selectedChat.applicantId,
      );

      if (hasPending) {
        setReportError("Bu kullanıcıyı zaten şikayet ettiniz");
        return;
      }

      await addDoc(collection(db, "reports"), {
        reporterId: uid,
        reportedId: selectedChat.applicantId,
        reportedType: "user",
        reportedOwnerId: null,
        reason: selectedReportReason,
        status: "pending",
        createdAt: firestoreIsoNow(),
      });

      setReportSuccess("Şikayetiniz alındı, teşekkürler");
      window.setTimeout(() => {
        setReportModalOpen(false);
        setReportSuccess(null);
      }, 1400);
    } catch (err) {
      console.error("Report failed:", err);
      setReportError("Şikayet gönderilemedi. Lütfen tekrar dene.");
    } finally {
      setIsReporting(false);
    }
  }, [selectedChat, selectedReportReason]);

  const handleBlockUser = useCallback(async () => {
    const uid = employerIdRef.current;
    if (!uid || !selectedChat) return;

    setIsBlocking(true);
    setBlockError(null);

    const { applicantId, matchId, conversationId } = selectedChat;

    try {
      await addDoc(collection(db, "blocks"), {
        blockerId: uid,
        blockedUserId: applicantId,
        createdAt: firestoreIsoNow(),
      });

      const activeMatch =
        matches.find(
          (match) =>
            match.id === matchId &&
            match.status === "active" &&
            getApplicantId(match, uid) === applicantId,
        ) ??
        matches.find(
          (match) =>
            match.status === "active" &&
            getApplicantId(match, uid) === applicantId,
        );

      const resolvedMatchId = activeMatch?.id ?? matchId;

      if (activeMatch) {
        try {
          await deleteDoc(doc(db, "matches", activeMatch.id));
        } catch (err) {
          console.error("Delete match failed:", err);
          throw new Error("match-delete");
        }
      }

      const convId =
        conversationId ??
        conversations.find((conv) => conv.matchId === resolvedMatchId)?.id ??
        null;

      if (convId) {
        try {
          const messagesSnap = await getDocs(
            query(
              collection(db, "messages"),
              where("conversationId", "==", convId),
            ),
          );
          await Promise.all(
            messagesSnap.docs.map((docSnap) => deleteDoc(docSnap.ref)),
          );
        } catch (err) {
          console.error("Delete messages failed:", err);
        }

        try {
          await deleteDoc(doc(db, "conversations", convId));
        } catch (err) {
          console.error("Delete conversation failed:", err);
        }
      }

      setBlockedUserIds((prev) =>
        prev.includes(applicantId) ? prev : [...prev, applicantId],
      );
      setMatches((prev) =>
        prev.filter((match) => match.id !== resolvedMatchId),
      );
      setConversations((prev) => prev.filter((conv) => conv.id !== convId));
      setUnreadCounts((prev) => {
        if (!convId) return prev;
        const next = { ...prev };
        delete next[convId];
        return next;
      });
      setSelectedChat(null);
      setMessages([]);
      setBlockConfirmOpen(false);
      setChatMenuOpen(false);
      setFeedback("Aday engellendi");
    } catch (err) {
      console.error("Block failed:", err);
      setBlockError("Engelleme işlemi tamamlanamadı. Lütfen tekrar dene.");
    } finally {
      setIsBlocking(false);
    }
  }, [conversations, matches, selectedChat]);

  const handleDeleteConversation = useCallback(async () => {
    const uid = employerIdRef.current;
    if (!uid || !selectedChat?.conversationId) return;

    const convId = selectedChat.conversationId;

    setIsDeletingChat(true);
    setDeleteChatError(null);

    try {
      const messagesSnap = await getDocs(
        query(
          collection(db, "messages"),
          where("conversationId", "==", convId),
        ),
      );

      await Promise.all(
        messagesSnap.docs.map((docSnap) => deleteDoc(docSnap.ref)),
      );

      await deleteDoc(doc(db, "conversations", convId));

      setConversations((prev) => prev.filter((conv) => conv.id !== convId));
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[convId];
        return next;
      });
      setSelectedChat(null);
      setMessages([]);
      setDeleteConfirmOpen(false);
      setChatMenuOpen(false);
      setFeedback("Sohbet silindi");
    } catch (err) {
      console.error("Delete conversation failed:", err);
      setDeleteChatError("Sohbet silinemedi. Lütfen tekrar dene.");
    } finally {
      setIsDeletingChat(false);
    }
  }, [selectedChat]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (isEmployerSigningOut()) return;
        router.replace("/isveren/giris");
        return;
      }

      employerIdRef.current = user.uid;
      setEmployerId(user.uid);
      setIsAuthReady(true);
      void Promise.all([loadMatches(user.uid), loadBlockedUsers(user.uid)]);
    });

    return () => unsubscribe();
  }, [loadBlockedUsers, loadMatches, router]);

  useEffect(() => {
    if (!chatMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatMenuRef.current &&
        !chatMenuRef.current.contains(event.target as Node)
      ) {
        setChatMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chatMenuOpen]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!employerId || !selectedChat) return;
    if (blockedUserIdSet.has(selectedChat.applicantId)) {
      setSelectedChat(null);
      setMessages([]);
    }
  }, [blockedUserIdSet, employerId, selectedChat]);

  useEffect(() => {
    if (!employerId) return;

    const conversationsAsUser1 = new Map<string, ConversationRecord>();
    const conversationsAsUser2 = new Map<string, ConversationRecord>();

    const syncConversations = () => {
      const merged = new Map<string, ConversationRecord>();
      for (const [id, conversation] of conversationsAsUser1) {
        merged.set(id, conversation);
      }
      for (const [id, conversation] of conversationsAsUser2) {
        merged.set(id, conversation);
      }

      const list = sortByIsoDesc([...merged.values()]);
      setConversations(list);
      void refreshUnreadCounts(list, employerId);

      const applicantIds = list
        .map((conversation) => {
          const match = matches.find((item) => item.id === conversation.matchId);
          return match ? getApplicantId(match, employerId) : null;
        })
        .filter(Boolean) as string[];

      if (applicantIds.length > 0) {
        void loadProfiles(applicantIds);
      }
    };

    const unsub1 = onSnapshot(
      query(collection(db, "conversations"), where("user1Id", "==", employerId)),
      (snapshot) => {
        conversationsAsUser1.clear();
        for (const docSnap of snapshot.docs) {
          conversationsAsUser1.set(
            docSnap.id,
            parseConversation(docSnap.id, docSnap.data()),
          );
        }
        syncConversations();
      },
      (err) => console.error("Conversations stream (user1) failed:", err),
    );

    const unsub2 = onSnapshot(
      query(collection(db, "conversations"), where("user2Id", "==", employerId)),
      (snapshot) => {
        conversationsAsUser2.clear();
        for (const docSnap of snapshot.docs) {
          conversationsAsUser2.set(
            docSnap.id,
            parseConversation(docSnap.id, docSnap.data()),
          );
        }
        syncConversations();
      },
      (err) => console.error("Conversations stream (user2) failed:", err),
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [employerId, loadProfiles, matches, refreshUnreadCounts]);

  useEffect(() => {
    if (!selectedChat?.conversationId) {
      setMessages([]);
      return;
    }

    const conversationId = selectedChat.conversationId;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
      ),
      (snapshot) => {
        const loaded = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            conversationId: String(data.conversationId ?? ""),
            senderId: String(data.senderId ?? ""),
            content: String(data.content ?? ""),
            isRead: Boolean(data.isRead),
            createdAt: String(data.createdAt ?? ""),
          } satisfies MessageRecord;
        });

        setMessages(sortMessagesAsc(loaded));
      },
      (err) => {
        console.error("Messages stream failed:", err);
        setSendError("Mesajlar yüklenemedi.");
      },
    );

    return () => unsubscribe();
  }, [selectedChat?.conversationId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, selectedChat?.conversationId]);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedChat?.matchId) ?? null,
    [matches, selectedChat?.matchId],
  );

  const selectedApplicantName = useMemo(() => {
    if (!selectedChat) return "Aday";
    return (
      profiles[selectedChat.applicantId]?.fullName?.trim() || "Aday"
    );
  }, [profiles, selectedChat]);

  const selectedApplicantPhoto = selectedChat
    ? profiles[selectedChat.applicantId]?.profilePhotoUrl ?? null
    : null;

  const selectedListingTitle = selectedMatch
    ? listingTitles[selectedMatch.listingId] ?? null
    : null;

  const messageListItems = useMemo(
    () => buildMessageListItems(messages),
    [messages],
  );

  const profileApplicant = profileApplicantId
    ? profiles[profileApplicantId]
    : null;

  const profileMatch = useMemo(() => {
    if (!profileApplicantId || !employerId) return null;
    return (
      matches.find(
        (match) => getApplicantId(match, employerId) === profileApplicantId,
      ) ?? null
    );
  }, [employerId, matches, profileApplicantId]);

  const profileListingTitle = profileMatch
    ? listingTitles[profileMatch.listingId] ?? null
    : null;

  const openApplicantProfile = useCallback((applicantId: string) => {
    setProfileApplicantId(applicantId);
    void loadProfiles([applicantId]);
  }, [loadProfiles]);

  if (!isAuthReady || isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-[#036AAF]" aria-hidden />
      </div>
    );
  }

  return (
    <div className="-mx-6 -mb-6 flex h-[calc(100dvh-10.5rem)] min-h-[480px] flex-col overflow-hidden sm:-mx-8 sm:-mb-8 lg:h-[calc(100dvh-9.5rem)]">
      {feedback ? (
        <p className="mb-3 shrink-0 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200/60" role="status">
          {feedback}
        </p>
      ) : null}

      {error ? (
        <p className="mb-3 shrink-0 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm ring-1 ring-neutral-200/40">
        <aside
          className={`flex w-full shrink-0 flex-col bg-[#f8fafc] lg:w-[320px] xl:w-[340px] lg:border-r lg:border-neutral-200/80 ${
            hasActivePanel ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="shrink-0 bg-[#0f2540] px-4 py-4">
            <h1 className="text-lg font-bold tracking-tight text-white">
              Mesajlar
            </h1>
            <p className="mt-0.5 text-xs text-white/55">
              {sortedConversations.length} sohbet
              {newMatches.length > 0
                ? ` · ${newMatches.length} yeni eşleşme`
                : ""}
            </p>
          </div>

          {newMatches.length > 0 ? (
            <div className="shrink-0 border-b border-neutral-200/80 bg-white px-3 py-3">
              <p className="mb-2.5 px-1 text-[10px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
                Yeni Eşleşmeler
              </p>
              <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {newMatches.map((match) => {
                  const applicantId = employerId
                    ? getApplicantId(match, employerId)
                    : match.user1Id;
                  const name =
                    profiles[applicantId]?.fullName?.trim() || "Aday";
                  const photo =
                    profiles[applicantId]?.profilePhotoUrl ?? null;
                  const isSelected =
                    !isEkmekTeamSelected && selectedChat?.matchId === match.id;

                  return (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => employerId && openNewMatch(match, employerId)}
                      className={`flex min-w-[72px] flex-col items-center gap-1.5 rounded-2xl px-2 py-2 transition-all ${
                        isSelected
                          ? "bg-[#036AAF]/12 ring-2 ring-[#036AAF]/50"
                          : "hover:bg-neutral-50"
                      }`}
                    >
                      <ApplicantAvatar
                        name={name}
                        photoUrl={photo}
                        size="sm"
                        className="ring-[#036AAF]/20"
                      />
                      <span className="max-w-[68px] truncate text-[10px] font-semibold text-[#0f2540]">
                        {name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-2 pt-2">
              <button
                type="button"
                onClick={openEkmekTeam}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                  isEkmekTeamSelected
                    ? "bg-white shadow-sm ring-1 ring-[#036AAF]/25"
                    : "hover:bg-white/70"
                }`}
              >
                <EkmekTeamAvatar size="md" />
                <div className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm font-bold ${
                      isEkmekTeamSelected
                        ? "text-[#036AAF]"
                        : "text-[#0f2540]"
                    }`}
                  >
                    Ekmek Ekibi
                  </span>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">
                    Merhaba! Ekmek&apos;e hoş geldin.
                  </p>
                </div>
              </button>
              <div className="mx-2 mb-1 border-b border-neutral-200/80" />
            </div>

            <p className="shrink-0 px-4 py-2.5 text-[10px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
              Sohbetler
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {sortedConversations.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-neutral-400">Henüz sohbet yok.</p>
                  {matches.length === 0 ? (
                    <>
                      <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                        Başvuruları onaylayınca adaylarla mesajlaşabilirsiniz.
                      </p>
                      <Link
                        href="/isveren/panel/basvurular"
                        className="mt-4 inline-flex rounded-full bg-[#036AAF] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#025a94]"
                      >
                        Başvurulara Git
                      </Link>
                    </>
                  ) : null}
                </div>
              ) : (
                sortedConversations.map((conversation) => {
                  const match = visibleMatches.find(
                    (item) => item.id === conversation.matchId,
                  );
                  if (!match || !employerId) return null;

                  const applicantId = getApplicantId(match, employerId);
                  const name =
                    profiles[applicantId]?.fullName?.trim() || "Aday";
                  const photo =
                    profiles[applicantId]?.profilePhotoUrl ?? null;
                  const listingTitle =
                    listingTitles[match.listingId] ?? null;
                  const isSelected =
                    !isEkmekTeamSelected &&
                    selectedChat?.conversationId === conversation.id;
                  const unread = unreadCounts[conversation.id] ?? 0;
                  const preview =
                    conversation.lastMessage?.trim() || "Sohbet başlatıldı";

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => openConversation(conversation, employerId)}
                      className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                        isSelected
                          ? "bg-white shadow-sm ring-1 ring-[#036AAF]/25"
                          : "hover:bg-white/70"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <ApplicantAvatar
                          name={name}
                          photoUrl={photo}
                          size="md"
                          className={isSelected ? "ring-[#036AAF]/30" : "ring-neutral-200/80"}
                        />
                        {unread > 0 ? (
                          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-[#036AAF] ring-2 ring-[#f8fafc]" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`truncate text-sm font-bold ${
                              isSelected ? "text-[#036AAF]" : "text-[#0f2540]"
                            }`}
                          >
                            {name}
                          </span>
                          <span className="shrink-0 text-[10px] text-neutral-400">
                            {formatMessageTime(
                              conversation.lastMessageAt ??
                                conversation.createdAt,
                            )}
                          </span>
                        </div>
                        {listingTitle ? (
                          <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                            {listingTitle}
                          </p>
                        ) : null}
                        <p
                          className={`mt-0.5 truncate text-xs ${
                            unread > 0
                              ? "font-semibold text-[#1a1a1a]"
                              : "text-neutral-400"
                          }`}
                        >
                          {preview}
                        </p>
                      </div>
                      {unread > 0 ? (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#036AAF] px-1.5 text-[10px] font-bold text-white">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <section
          className={`min-w-0 flex-1 flex-col bg-white ${
            hasActivePanel ? "flex" : "hidden lg:flex"
          }`}
        >
          {!hasActivePanel ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[#f0f4f8] text-neutral-400">
                <MessageSquare className="size-8 stroke-[1.5]" />
              </div>
              <p className="mt-4 text-base font-semibold text-[#0f2540]">
                Bir sohbet seçin
              </p>
              <p className="mt-2 max-w-sm text-sm text-neutral-500">
                Soldan bir aday seçerek mesajlaşmaya başlayın.
              </p>
            </div>
          ) : isEkmekTeamSelected ? (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200/80 bg-white px-3 py-2.5 shadow-sm sm:px-4">
                <button
                  type="button"
                  onClick={closeActivePanel}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#0f2540] hover:bg-neutral-100 lg:hidden"
                  aria-label="Listeye dön"
                >
                  <ArrowLeft className="size-5" />
                </button>
                <div className="flex min-w-0 flex-1 items-center gap-3 px-1 py-1">
                  <EkmekTeamAvatar size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#0f2540]">
                      Ekmek Ekibi
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      Bilgilendirme kanalı
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4"
                  style={{
                    backgroundColor: "#f0f4f8",
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(15,37,64,0.035) 1px, transparent 0)",
                    backgroundSize: "22px 22px",
                  }}
                >
                  <div className="flex flex-col pb-1">
                    <div className="mt-2 flex justify-start">
                      <div className="inline-block max-w-[85%] rounded-2xl rounded-bl-md border border-[#e5e7eb] bg-white px-3 py-2 text-[13px] leading-snug text-[#1a1a1a] shadow-sm sm:max-w-[75%]">
                        <p className="whitespace-pre-wrap break-words">
                          {EKMEK_TEAM_WELCOME_MESSAGE}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-start">
                      <div className="inline-block max-w-[85%] rounded-2xl rounded-bl-md border border-[#e5e7eb] bg-white px-3 py-2.5 text-[13px] shadow-sm sm:max-w-[75%]">
                        <p className="font-medium text-[#0f2540]">
                          Sana yardımcı olabileceğimiz bağlantılar:
                        </p>
                        <ul className="mt-2 space-y-2">
                          {EKMEK_TEAM_LINKS.map((link) => {
                            const Icon = link.icon;

                            return (
                              <li key={link.label}>
                                {link.useRouter ? (
                                  <button
                                    type="button"
                                    onClick={() => router.push(link.href)}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#036AAF] transition-colors hover:underline"
                                  >
                                    <Icon className="size-4 shrink-0" />
                                    {link.label}
                                  </button>
                                ) : (
                                  <Link
                                    href={link.href}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#036AAF] transition-colors hover:underline"
                                  >
                                    <Icon className="size-4 shrink-0" />
                                    {link.label}
                                  </Link>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 border-t border-neutral-200/80 bg-white px-3 py-2.5 sm:px-4">
                  <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Lock
                        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-neutral-400"
                        aria-hidden
                      />
                      <input
                        type="text"
                        disabled
                        readOnly
                        placeholder="Bu kanaldan mesaj gönderilemez."
                        className="w-full cursor-not-allowed rounded-full border border-neutral-200 bg-neutral-50 py-2.5 pr-4 pl-10 text-sm text-neutral-400"
                      />
                    </div>
                    <button
                      type="button"
                      disabled
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-400"
                      aria-label="Gönder"
                    >
                      <Send className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : selectedChat ? (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200/80 bg-white px-3 py-2.5 shadow-sm sm:px-4">
                <button
                  type="button"
                  onClick={closeActivePanel}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#0f2540] hover:bg-neutral-100 lg:hidden"
                  aria-label="Listeye dön"
                >
                  <ArrowLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => openApplicantProfile(selectedChat.applicantId)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:bg-neutral-50"
                >
                  <ApplicantAvatar
                    name={selectedApplicantName}
                    photoUrl={selectedApplicantPhoto}
                    size="lg"
                    className="ring-[#036AAF]/20"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#0f2540]">
                      {selectedApplicantName}
                    </p>
                    {selectedListingTitle ? (
                      <p className="truncate text-xs text-neutral-500">
                        {selectedListingTitle}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] font-medium text-[#036AAF]">
                      Profili incele
                    </p>
                  </div>
                  <User className="size-4 shrink-0 text-neutral-400" />
                </button>

                <div className="relative shrink-0" ref={chatMenuRef}>
                  <button
                    type="button"
                    onClick={() => setChatMenuOpen((open) => !open)}
                    className="inline-flex size-9 items-center justify-center rounded-full text-[#0f2540] transition-colors hover:bg-neutral-100"
                    aria-label="Sohbet seçenekleri"
                    aria-expanded={chatMenuOpen}
                  >
                    <MoreVertical className="size-5" />
                  </button>

                  {chatMenuOpen ? (
                    <div className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-xl border border-neutral-200/80 bg-white py-1 shadow-lg ring-1 ring-black/5">
                      <button
                        type="button"
                        onClick={handleOpenReport}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-[#0f2540] transition-colors hover:bg-neutral-50"
                      >
                        <Flag className="size-4 text-[#036AAF]" />
                        Şikayet Et
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChatMenuOpen(false);
                          setBlockError(null);
                          setBlockConfirmOpen(true);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Ban className="size-4" />
                        Engelle
                      </button>
                      {selectedChat.conversationId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setChatMenuOpen(false);
                            setDeleteChatError(null);
                            setDeleteConfirmOpen(true);
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-[#0f2540] transition-colors hover:bg-neutral-50"
                        >
                          <Trash2 className="size-4 text-neutral-500" />
                          Sohbeti Sil
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div
                  ref={messagesContainerRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4"
                  style={{
                    backgroundColor: "#f0f4f8",
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(15,37,64,0.035) 1px, transparent 0)",
                    backgroundSize: "22px 22px",
                  }}
                >
                  {messages.length === 0 ? (
                    <p className="py-6 text-center text-sm text-neutral-500">
                      Henüz mesaj yok. İlk mesajı siz gönderin.
                    </p>
                  ) : (
                    <div className="flex flex-col pb-1">
                      {messageListItems.map((item) => {
                        if (item.kind === "separator") {
                          return (
                            <div
                              key={item.key}
                              className="my-2 flex justify-center first:mt-0"
                            >
                              <span className="rounded-full bg-black/5 px-3 py-0.5 text-[11px] text-neutral-500">
                                {item.label}
                              </span>
                            </div>
                          );
                        }

                        const message = item.message;
                        const isMine = message.senderId === employerId;

                        return (
                          <div
                            key={item.key}
                            className={`flex ${item.compactTop ? "mt-0.5" : "mt-2"} ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`inline-block max-w-[72%] rounded-2xl px-3 py-1.5 text-[13px] leading-snug shadow-sm sm:max-w-[68%] ${
                                isMine
                                  ? "rounded-br-md bg-[#036AAF] text-white shadow-[#036AAF]/20"
                                  : "rounded-bl-md border border-[#e5e7eb] bg-white text-[#1a1a1a] shadow-black/5"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <p
                                className={`mt-0.5 text-right text-[10px] opacity-60 ${
                                  isMine ? "text-white/80" : "text-neutral-500"
                                }`}
                              >
                                {formatBubbleTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t border-neutral-200/80 bg-white px-3 py-2.5 sm:px-4">
                  {sendError ? (
                    <p className="mb-2 text-sm text-red-600" role="alert">
                      {sendError}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          if (!isSending && draft.trim()) {
                            void handleSend();
                          }
                        }
                      }}
                      disabled={isSending}
                      rows={1}
                      placeholder="Mesajınızı yazın..."
                      className="max-h-28 min-h-[42px] flex-1 resize-none rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-[#1a1a1a] outline-none transition-shadow focus:border-[#036AAF] focus:ring-2 focus:ring-[#036AAF]/20 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={isSending || !draft.trim()}
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#036AAF] text-white shadow-sm transition-all hover:bg-[#025a94] disabled:opacity-50"
                      aria-label="Gönder"
                    >
                      {isSending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </div>

      {reportModalOpen && selectedChat ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          onClick={() => !isReporting && setReportModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <h2
                id="report-modal-title"
                className="text-lg font-semibold text-[#0f2540]"
              >
                Şikayet Et
              </h2>
              <button
                type="button"
                onClick={() => !isReporting && setReportModalOpen(false)}
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm text-neutral-600">
                <span className="font-semibold text-[#0f2540]">
                  {selectedApplicantName}
                </span>{" "}
                hakkında şikayet sebebini seçin.
              </p>

              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                      selectedReportReason === reason
                        ? "border-[#036AAF] bg-[#036AAF]/8"
                        : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason}
                      checked={selectedReportReason === reason}
                      onChange={() => setSelectedReportReason(reason)}
                      className="accent-[#036AAF]"
                    />
                    <span className="text-sm text-[#0f2540]">{reason}</span>
                  </label>
                ))}
              </div>

              {selectedReportReason === "Diğer" ? (
                <textarea
                  value={reportOtherText}
                  onChange={(event) => setReportOtherText(event.target.value)}
                  rows={3}
                  placeholder="İsterseniz kısaca açıklayın (opsiyonel)"
                  className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-[#0f2540] outline-none focus:border-[#036AAF] focus:ring-2 focus:ring-[#036AAF]/20"
                />
              ) : null}

              {reportError ? (
                <p className="text-sm text-red-600" role="alert">
                  {reportError}
                </p>
              ) : null}
              {reportSuccess ? (
                <p className="text-sm font-medium text-emerald-700" role="status">
                  {reportSuccess}
                </p>
              ) : null}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => !isReporting && setReportModalOpen(false)}
                  disabled={isReporting}
                  className="flex-1 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-[#0f2540] hover:bg-neutral-50 disabled:opacity-60"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitReport()}
                  disabled={isReporting || Boolean(reportSuccess)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#036AAF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#025a94] disabled:opacity-60"
                >
                  {isReporting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    "Şikayet Et"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {blockConfirmOpen && selectedChat ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-modal-title"
          onClick={() => !isBlocking && setBlockConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <h2
                id="block-modal-title"
                className="text-lg font-semibold text-[#0f2540]"
              >
                Adayı Engelle
              </h2>
              <button
                type="button"
                onClick={() => !isBlocking && setBlockConfirmOpen(false)}
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm leading-relaxed text-neutral-600">
                Bu adayı engellemek istediğinize emin misiniz? Eşleşmeniz ve
                tüm mesajlarınız silinecek, bu işlem geri alınamaz.
              </p>

              {blockError ? (
                <p className="text-sm text-red-600" role="alert">
                  {blockError}
                </p>
              ) : null}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => !isBlocking && setBlockConfirmOpen(false)}
                  disabled={isBlocking}
                  className="flex-1 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-[#0f2540] hover:bg-neutral-50 disabled:opacity-60"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => void handleBlockUser()}
                  disabled={isBlocking}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {isBlocking ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Engelleniyor...
                    </>
                  ) : (
                    <>
                      <Ban className="size-4" />
                      Engelle
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmOpen && selectedChat?.conversationId ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-chat-modal-title"
          onClick={() => !isDeletingChat && setDeleteConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <h2
                id="delete-chat-modal-title"
                className="text-lg font-semibold text-[#0f2540]"
              >
                Sohbeti Sil
              </h2>
              <button
                type="button"
                onClick={() => !isDeletingChat && setDeleteConfirmOpen(false)}
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm leading-relaxed text-neutral-600">
                Bu sohbeti silmek istediğinize emin misiniz? Tüm mesajlar
                silinecek ancak eşleşmeniz korunacak. Yeni mesaj göndererek
                sohbeti tekrar başlatabilirsiniz.
              </p>

              {deleteChatError ? (
                <p className="text-sm text-red-600" role="alert">
                  {deleteChatError}
                </p>
              ) : null}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => !isDeletingChat && setDeleteConfirmOpen(false)}
                  disabled={isDeletingChat}
                  className="flex-1 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-[#0f2540] hover:bg-neutral-50 disabled:opacity-60"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteConversation()}
                  disabled={isDeletingChat}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#036AAF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#025a94] disabled:opacity-60"
                >
                  {isDeletingChat ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" />
                      Sohbeti Sil
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {profileApplicantId && profileApplicant ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="applicant-profile-title"
          onClick={() => setProfileApplicantId(null)}
        >
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-neutral-100 bg-white px-5 py-4">
              <h2
                id="applicant-profile-title"
                className="text-lg font-semibold text-[#0f2540]"
              >
                Aday Profili
              </h2>
              <button
                type="button"
                onClick={() => setProfileApplicantId(null)}
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex items-start gap-4">
                <ApplicantAvatar
                  name={profileApplicant.fullName?.trim() || "Aday"}
                  photoUrl={profileApplicant.profilePhotoUrl ?? null}
                  size="xl"
                  className="ring-[#036AAF]/20"
                />
                <div className="min-w-0 pt-1">
                  <h3 className="text-xl font-bold text-[#0f2540]">
                    {profileApplicant.fullName?.trim() || "İsimsiz aday"}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {calculateAge(profileApplicant.birthDate) !== null
                      ? `${calculateAge(profileApplicant.birthDate)} yaş`
                      : "Yaş belirtilmemiş"}{" "}
                    · {labelFromMap(GENDER_LABELS, profileApplicant.gender)}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
                    <MapPin className="size-3.5 shrink-0" />
                    {formatLocation(
                      profileApplicant.city,
                      profileApplicant.district,
                    )}
                  </p>
                  {profileListingTitle ? (
                    <p className="mt-2 inline-flex rounded-full bg-[#036AAF]/10 px-3 py-1 text-xs font-medium text-[#036AAF]">
                      {profileListingTitle}
                    </p>
                  ) : null}
                </div>
              </div>

              {profileApplicant.about ? (
                <section>
                  <h4 className="mb-1.5 text-sm font-semibold text-[#0f2540]">
                    Hakkında
                  </h4>
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {profileApplicant.about}
                  </p>
                </section>
              ) : null}

              <section className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="mb-1 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                    Eğitim
                  </h4>
                  <p className="text-sm text-neutral-700">
                    {labelFromMap(
                      EDUCATION_LABELS,
                      profileApplicant.educationLevel,
                    )}
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                    Pozisyonlar
                  </h4>
                  <p className="text-sm text-neutral-700">
                    {profileApplicant.positions?.length
                      ? profileApplicant.positions.join(", ")
                      : "—"}
                  </p>
                </div>
                {profileApplicant.gender === "male" &&
                profileApplicant.militaryStatus ? (
                  <div>
                    <h4 className="mb-1 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                      Askerlik
                    </h4>
                    <p className="text-sm text-neutral-700">
                      {labelFromMap(
                        MILITARY_LABELS,
                        profileApplicant.militaryStatus,
                      )}
                    </p>
                  </div>
                ) : null}
                <div>
                  <h4 className="mb-1 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                    Ehliyet
                  </h4>
                  <p className="text-sm text-neutral-700">
                    {profileApplicant.driverLicenses?.length
                      ? profileApplicant.driverLicenses.join(", ")
                      : "—"}
                  </p>
                </div>
              </section>

              {profileApplicant.experiences &&
              profileApplicant.experiences.filter((item) =>
                item.title?.trim(),
              ).length > 0 ? (
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-[#0f2540]">
                    Deneyimler
                  </h4>
                  <div className="space-y-2">
                    {profileApplicant.experiences
                      .filter((item) => item.title?.trim())
                      .map((experience, index) => (
                        <div
                          key={`${experience.title}-${index}`}
                          className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-4 py-3"
                        >
                          <p className="font-medium text-[#0f2540]">
                            {experience.title}
                          </p>
                          {experience.companyName ? (
                            <p className="text-sm text-neutral-600">
                              {experience.companyName}
                            </p>
                          ) : null}
                          {formatExperienceDateRange(experience) ? (
                            <p className="mt-0.5 text-xs text-neutral-400">
                              {formatExperienceDateRange(experience)}
                            </p>
                          ) : null}
                        </div>
                      ))}
                  </div>
                </section>
              ) : null}

              {profileMatch?.applicationId ? (
                <Link
                  href="/isveren/panel/basvurular"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-[#036AAF] transition-colors hover:bg-[#036AAF]/5"
                  onClick={() => setProfileApplicantId(null)}
                >
                  Başvurulara git
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
