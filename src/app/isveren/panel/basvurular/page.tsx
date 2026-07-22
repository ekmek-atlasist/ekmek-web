"use client";

import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  SlidersHorizontal,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { firestoreLocalIsoNow } from "@/lib/firebase-schema";
import { auth, db } from "@/lib/firebase";
import { isEmployerSigningOut } from "@/lib/auth/panel-sign-out";

type ListingStatus =
  | "pending"
  | "active"
  | "paused"
  | "closed"
  | "rejected"
  | string;

type ApplicationStatus = "pending" | "accepted" | "rejected" | string;

type JobListing = {
  id: string;
  title: string;
  city: string;
  status: ListingStatus;
  positions: string[];
  isUrgent?: boolean;
  companyName?: string | null;
  logoUrl?: string | null;
  createdAt?: unknown;
};

type Application = {
  id: string;
  ownerId: string;
  listingId: string;
  applicantId: string;
  status: ApplicationStatus;
  createdAt?: unknown;
};

type Experience = {
  title?: string;
  companyName?: string;
  startDate?: unknown;
  endDate?: unknown;
  isCurrent?: boolean;
  description?: string;
};

type IndividualProfile = {
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
  latitude?: number | null;
  longitude?: number | null;
};

type EmployerCoords = {
  lat: number;
  lng: number;
};

type ApplicationTab = "pending" | "accepted" | "rejected";
type Stage = "listings" | "applications";
type SortOption =
  | "newest"
  | "oldest"
  | "ageAsc"
  | "ageDesc"
  | "nameAsc"
  | "nearest";
type GenderFilter = "all" | "male" | "female";
type EducationFilter =
  | "all"
  | "highSchoolAndBelow"
  | "associate"
  | "bachelor"
  | "graduate";
type AgeRangeFilter = "all" | "18-25" | "26-35" | "36+";
type DistanceFilter = "all" | "10" | "25" | "50" | "100";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "En yeni" },
  { id: "oldest", label: "En eski" },
  { id: "nearest", label: "En yakın" },
  { id: "ageAsc", label: "Yaşa göre (küçükten)" },
  { id: "ageDesc", label: "Yaşa göre (büyükten)" },
  { id: "nameAsc", label: "İsme göre (A-Z)" },
];

const EDUCATION_FILTER_OPTIONS: { id: EducationFilter; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "highSchoolAndBelow", label: "Lise ve altı" },
  { id: "associate", label: "Ön Lisans" },
  { id: "bachelor", label: "Lisans" },
  { id: "graduate", label: "Lisansüstü" },
];

const AGE_RANGE_OPTIONS: { id: AgeRangeFilter; label: string }[] = [
  { id: "all", label: "Tüm yaşlar" },
  { id: "18-25", label: "18-25" },
  { id: "26-35", label: "26-35" },
  { id: "36+", label: "36+" },
];

const DISTANCE_FILTER_OPTIONS: { id: DistanceFilter; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "10", label: "10 km içinde" },
  { id: "25", label: "25 km içinde" },
  { id: "50", label: "50 km içinde" },
  { id: "100", label: "100 km içinde" },
];

const EARTH_RADIUS_KM = 6371;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
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

const APPLICATION_TABS: { id: ApplicationTab; label: string }[] = [
  { id: "pending", label: "Bekleyen" },
  { id: "accepted", label: "Kabul Edilen" },
  { id: "rejected", label: "Reddedilen" },
];

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

function getStatusBadge(status: ListingStatus) {
  return (
    STATUS_BADGE[status] ?? {
      label: status,
      className: "bg-neutral-100 text-neutral-600",
    }
  );
}

function sortByCreatedAtDesc<T extends { createdAt?: unknown }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = toDate(a.createdAt)?.getTime() ?? 0;
    const bTime = toDate(b.createdAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

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

function formatMonthYear(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(value: unknown): string {
  const date = toDate(value);
  if (!date) return "—";

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatListingCreatedDate(value: unknown): string {
  const date = toDate(value);
  if (!date) return "";

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
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

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(rLat1) * Math.cos(rLat2) * sinDLng * sinDLng;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function parseCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseEmployerCoords(data: unknown): EmployerCoords | null {
  if (!data || typeof data !== "object") return null;

  const lat = parseCoordinate((data as { latitude?: unknown }).latitude);
  const lng = parseCoordinate((data as { longitude?: unknown }).longitude);

  if (lat === null || lng === null) return null;
  return { lat, lng };
}

function getProfilePositions(
  profile: IndividualProfile | null | undefined,
): string[] {
  return (profile?.positions ?? []).filter((position) => position.trim());
}

function getApplicantDistanceKm(
  employerCoords: EmployerCoords | null,
  profile: IndividualProfile | null | undefined,
): number | null {
  if (!employerCoords || !profile) return null;

  const lat = parseCoordinate(profile.latitude);
  const lng = parseCoordinate(profile.longitude);

  if (lat === null || lng === null) return null;

  return haversineKm(employerCoords.lat, employerCoords.lng, lat, lng);
}

function formatDistanceDisplay(
  distanceKm: number | null,
  locationLabel: string,
): string {
  if (distanceKm === null) return "Konum bilinmiyor";
  if (distanceKm > 100) return locationLabel;
  if (distanceKm < 1) return "<1 km";
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;
  return `${Math.round(distanceKm)} km`;
}

function positionsIntersect(
  applicantPositions: string[],
  listingPositions: string[],
): boolean {
  if (listingPositions.length === 0) return true;
  return applicantPositions.some((position) =>
    listingPositions.includes(position),
  );
}

function matchesSelectedPositionFilters(
  profile: IndividualProfile | null | undefined,
  selectedPositions: string[],
): boolean {
  if (selectedPositions.length === 0) return true;

  const applicantPositions = getProfilePositions(profile);
  return selectedPositions.some((position) =>
    applicantPositions.includes(position),
  );
}

function matchesListingPositionFilter(
  profile: IndividualProfile | null | undefined,
  listingPositions: string[],
  enabled: boolean,
): boolean {
  if (!enabled) return true;
  return positionsIntersect(getProfilePositions(profile), listingPositions);
}

function matchesDistanceFilter(
  distanceKm: number | null,
  filter: DistanceFilter,
  employerHasCoords: boolean,
): boolean {
  if (filter === "all" || !employerHasCoords) return true;
  if (distanceKm === null) return true;

  return distanceKm <= Number(filter);
}

function getProfileLocationKey(
  profile: IndividualProfile | null | undefined,
): string {
  if (!profile) return "";
  return formatLocation(profile.city, profile.district);
}

function countAdvancedApplicationFilters(input: {
  genderFilter: GenderFilter;
  educationFilter: EducationFilter;
  ageRangeFilter: AgeRangeFilter;
  locationFilter: string;
}): number {
  let count = 0;
  if (input.genderFilter !== "all") count += 1;
  if (input.educationFilter !== "all") count += 1;
  if (input.ageRangeFilter !== "all") count += 1;
  if (input.locationFilter !== "all") count += 1;
  return count;
}

function matchesGenderFilter(
  gender: string | undefined,
  filter: GenderFilter,
): boolean {
  if (filter === "all") return true;
  return gender === filter;
}

function matchesEducationFilter(
  educationLevel: string | undefined,
  filter: EducationFilter,
): boolean {
  if (filter === "all") return true;
  if (!educationLevel) return false;

  switch (filter) {
    case "highSchoolAndBelow":
      return ["ilkokul", "ortaokul", "lise"].includes(educationLevel);
    case "associate":
      return educationLevel === "onLisans";
    case "bachelor":
      return educationLevel === "lisans";
    case "graduate":
      return ["yuksekLisans", "doktora"].includes(educationLevel);
    default:
      return true;
  }
}

function matchesAgeRange(age: number | null, filter: AgeRangeFilter): boolean {
  if (filter === "all") return true;
  if (age === null) return false;

  switch (filter) {
    case "18-25":
      return age >= 18 && age <= 25;
    case "26-35":
      return age >= 26 && age <= 35;
    case "36+":
      return age >= 36;
    default:
      return true;
  }
}

function sortApplications(
  items: Application[],
  sort: SortOption,
  profileMap: Record<string, IndividualProfile | null>,
  employerCoords: EmployerCoords | null,
): Application[] {
  const sorted = [...items];

  switch (sort) {
    case "oldest":
      return sorted.sort(
        (a, b) =>
          (toDate(a.createdAt)?.getTime() ?? 0) -
          (toDate(b.createdAt)?.getTime() ?? 0),
      );
    case "nearest":
      return sorted.sort((a, b) => {
        const distA =
          getApplicantDistanceKm(
            employerCoords,
            profileMap[a.applicantId],
          ) ?? Number.MAX_SAFE_INTEGER;
        const distB =
          getApplicantDistanceKm(
            employerCoords,
            profileMap[b.applicantId],
          ) ?? Number.MAX_SAFE_INTEGER;
        return distA - distB;
      });
    case "ageAsc":
      return sorted.sort((a, b) => {
        const ageA =
          calculateAge(profileMap[a.applicantId]?.birthDate) ?? Number.MAX_SAFE_INTEGER;
        const ageB =
          calculateAge(profileMap[b.applicantId]?.birthDate) ?? Number.MAX_SAFE_INTEGER;
        return ageA - ageB;
      });
    case "ageDesc":
      return sorted.sort((a, b) => {
        const ageA = calculateAge(profileMap[a.applicantId]?.birthDate) ?? -1;
        const ageB = calculateAge(profileMap[b.applicantId]?.birthDate) ?? -1;
        return ageB - ageA;
      });
    case "nameAsc":
      return sorted.sort((a, b) => {
        const nameA =
          profileMap[a.applicantId]?.fullName?.trim().toLocaleLowerCase("tr-TR") ??
          "";
        const nameB =
          profileMap[b.applicantId]?.fullName?.trim().toLocaleLowerCase("tr-TR") ??
          "";
        return nameA.localeCompare(nameB, "tr");
      });
    case "newest":
    default:
      return sortByCreatedAtDesc(sorted);
  }
}

function PositionChips({ positions }: { positions: string[] }) {
  const maxVisible = 3;
  const visible = positions.slice(0, maxVisible);
  const remaining = positions.length - maxVisible;

  if (positions.length === 0) {
    return (
      <span className="text-xs text-neutral-400">Pozisyon belirtilmemiş</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((position) => (
        <span
          key={position}
          className="rounded-full bg-[#036AAF]/8 px-2.5 py-0.5 text-xs font-medium text-[#036AAF]"
        >
          {position}
        </span>
      ))}
      {remaining > 0 ? (
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
          +{remaining} daha
        </span>
      ) : null}
    </div>
  );
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

function ApplicantAvatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string;
  photoUrl?: string | null;
  size?: "md" | "card" | "lg";
}) {
  const initial = (name.trim()[0] ?? "A").toUpperCase();
  const sizeClass =
    size === "lg"
      ? "size-20 text-2xl"
      : size === "card"
        ? "size-16 text-xl"
        : "size-14 text-lg";

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-2 ring-[#036AAF]/15`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-[#036AAF]/10 font-semibold text-[#036AAF]`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

export default function PanelBasvurularPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingFromUrl = searchParams.get("listing");

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profiles, setProfiles] = useState<
    Record<string, IndividualProfile | null>
  >({});
  const [stage, setStage] = useState<Stage>("listings");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<ApplicationTab>("pending");
  const [detailApplicationId, setDetailApplicationId] = useState<string | null>(
    null,
  );
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [educationFilter, setEducationFilter] =
    useState<EducationFilter>("all");
  const [ageRangeFilter, setAgeRangeFilter] = useState<AgeRangeFilter>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [selectedPositionFilters, setSelectedPositionFilters] = useState<
    string[]
  >([]);
  const [listingMatchOnly, setListingMatchOnly] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("all");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [employerCoords, setEmployerCoords] = useState<EmployerCoords | null>(
    null,
  );

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) ?? null,
    [listings, selectedListingId],
  );

  const applicationStatsByListing = useMemo(() => {
    const stats = new Map<string, { total: number; pending: number }>();

    for (const application of applications) {
      const current = stats.get(application.listingId) ?? {
        total: 0,
        pending: 0,
      };
      current.total += 1;
      if (application.status === "pending") {
        current.pending += 1;
      }
      stats.set(application.listingId, current);
    }

    return stats;
  }, [applications]);

  const totalPendingApplications = useMemo(
    () => applications.filter((application) => application.status === "pending").length,
    [applications],
  );

  const sortedListingsForSelection = useMemo(() => {
    return [...listings].sort((a, b) => {
      const aPending = applicationStatsByListing.get(a.id)?.pending ?? 0;
      const bPending = applicationStatsByListing.get(b.id)?.pending ?? 0;

      if (bPending !== aPending) {
        return bPending - aPending;
      }

      const aTime = toDate(a.createdAt)?.getTime() ?? 0;
      const bTime = toDate(b.createdAt)?.getTime() ?? 0;
      return bTime - aTime;
    });
  }, [listings, applicationStatsByListing]);

  const selectedListingApplicationCounts = useMemo(() => {
    if (!selectedListingId) {
      return { total: 0, pending: 0, accepted: 0, rejected: 0 };
    }

    const listingApplications = applications.filter(
      (application) => application.listingId === selectedListingId,
    );

    return {
      total: listingApplications.length,
      pending: listingApplications.filter(
        (application) => application.status === "pending",
      ).length,
      accepted: listingApplications.filter(
        (application) => application.status === "accepted",
      ).length,
      rejected: listingApplications.filter(
        (application) => application.status === "rejected",
      ).length,
    };
  }, [applications, selectedListingId]);

  const tabApplications = useMemo(() => {
    if (!selectedListingId) return [];
    return applications.filter(
      (application) =>
        application.listingId === selectedListingId &&
        application.status === activeTab,
    );
  }, [applications, selectedListingId, activeTab]);

  const availableLocations = useMemo(() => {
    const locations = new Set<string>();

    for (const application of tabApplications) {
      const location = getProfileLocationKey(profiles[application.applicantId]);
      if (location && location !== "—") {
        locations.add(location);
      }
    }

    return [...locations].sort((a, b) => a.localeCompare(b, "tr"));
  }, [tabApplications, profiles]);

  const availableApplicantPositions = useMemo(() => {
    const positions = new Set<string>();

    for (const application of tabApplications) {
      for (const position of getProfilePositions(
        profiles[application.applicantId],
      )) {
        positions.add(position);
      }
    }

    return [...positions].sort((a, b) => a.localeCompare(b, "tr"));
  }, [tabApplications, profiles]);

  const employerHasCoords = employerCoords !== null;

  const advancedFilterCount = useMemo(
    () =>
      countAdvancedApplicationFilters({
        genderFilter,
        educationFilter,
        ageRangeFilter,
        locationFilter,
      }),
    [genderFilter, educationFilter, ageRangeFilter, locationFilter],
  );

  const hasActiveApplicationFilters =
    sortOption !== "newest" ||
    genderFilter !== "all" ||
    educationFilter !== "all" ||
    ageRangeFilter !== "all" ||
    locationFilter !== "all" ||
    selectedPositionFilters.length > 0 ||
    listingMatchOnly ||
    distanceFilter !== "all";

  const filteredTabApplications = useMemo(() => {
    const listingPositions = selectedListing?.positions ?? [];

    return tabApplications.filter((application) => {
      const profile = profiles[application.applicantId];
      const age = calculateAge(profile?.birthDate);
      const distanceKm = getApplicantDistanceKm(employerCoords, profile);

      if (!matchesGenderFilter(profile?.gender, genderFilter)) {
        return false;
      }
      if (!matchesEducationFilter(profile?.educationLevel, educationFilter)) {
        return false;
      }
      if (!matchesAgeRange(age, ageRangeFilter)) {
        return false;
      }
      if (
        locationFilter !== "all" &&
        getProfileLocationKey(profile) !== locationFilter
      ) {
        return false;
      }
      if (
        !matchesSelectedPositionFilters(profile, selectedPositionFilters)
      ) {
        return false;
      }
      if (
        !matchesListingPositionFilter(
          profile,
          listingPositions,
          listingMatchOnly,
        )
      ) {
        return false;
      }
      if (
        !matchesDistanceFilter(distanceKm, distanceFilter, employerHasCoords)
      ) {
        return false;
      }

      return true;
    });
  }, [
    tabApplications,
    profiles,
    genderFilter,
    educationFilter,
    ageRangeFilter,
    locationFilter,
    selectedPositionFilters,
    listingMatchOnly,
    selectedListing?.positions,
    distanceFilter,
    employerCoords,
    employerHasCoords,
  ]);

  const displayedApplications = useMemo(
    () =>
      sortApplications(
        filteredTabApplications,
        sortOption,
        profiles,
        employerCoords,
      ),
    [filteredTabApplications, sortOption, profiles, employerCoords],
  );

  const detailApplication = useMemo(
    () =>
      applications.find(
        (application) => application.id === detailApplicationId,
      ) ?? null,
    [applications, detailApplicationId],
  );

  const detailProfile = detailApplication
    ? profiles[detailApplication.applicantId]
    : null;

  const loadProfiles = useCallback(async (applicantIds: string[]) => {
    const uniqueIds = [...new Set(applicantIds.filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const entries = await Promise.all(
      uniqueIds.map(async (applicantId) => {
        try {
          const snap = await getDoc(
            doc(db, "individual_profiles", applicantId),
          );
          return [
            applicantId,
            snap.exists() ? (snap.data() as IndividualProfile) : null,
          ] as const;
        } catch {
          return [applicantId, null] as const;
        }
      }),
    );

    setProfiles((prev) => {
      const next = { ...prev };
      for (const [applicantId, profile] of entries) {
        next[applicantId] = profile;
      }
      return next;
    });
  }, []);

  const loadData = useCallback(async (uid: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [listingsSnap, applicationsSnap, employerSnap] = await Promise.all([
        getDocs(
          query(collection(db, "job_listings"), where("ownerId", "==", uid)),
        ),
        getDocs(
          query(collection(db, "applications"), where("ownerId", "==", uid)),
        ),
        getDoc(doc(db, "corporate_profiles", uid)),
      ]);

      const loadedListings = sortByCreatedAtDesc(
        listingsSnap.docs.map((snapshot) => {
          const data = snapshot.data();
          return {
            id: snapshot.id,
            title: (data.title as string) ?? "",
            city: (data.city as string) ?? "",
            status: (data.status as ListingStatus) ?? "pending",
            positions: Array.isArray(data.positions)
              ? (data.positions as string[])
              : [],
            isUrgent: Boolean(data.isUrgent),
            companyName: (data.companyName as string | null) ?? null,
            logoUrl: (data.logoUrl as string | null) ?? null,
            createdAt: data.createdAt ?? null,
          };
        }),
      );

      const loadedApplications = sortByCreatedAtDesc(
        applicationsSnap.docs.map((snapshot) => {
          const data = snapshot.data();
          return {
            id: snapshot.id,
            ownerId: (data.ownerId as string) ?? "",
            listingId: (data.listingId as string) ?? "",
            applicantId: (data.applicantId as string) ?? "",
            status: (data.status as ApplicationStatus) ?? "pending",
            createdAt: data.createdAt ?? null,
          };
        }),
      );

      setListings(loadedListings);
      setApplications(loadedApplications);
      setEmployerCoords(
        employerSnap.exists()
          ? parseEmployerCoords(employerSnap.data())
          : null,
      );
      await loadProfiles(loadedApplications.map((app) => app.applicantId));
    } catch (err) {
      console.error("Applications load failed:", err);
      setError("Veriler yüklenemedi. Lütfen tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  }, [loadProfiles]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (isEmployerSigningOut()) return;
        router.replace("/isveren/giris");
        return;
      }
      setIsAuthReady(true);
      void loadData(user.uid);
    });
    return () => unsubscribe();
  }, [router, loadData]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (isLoading || !listingFromUrl || listings.length === 0) return;

    const listingExists = listings.some(
      (listing) => listing.id === listingFromUrl,
    );
    if (!listingExists) return;

    setSelectedListingId(listingFromUrl);
    setStage("applications");
    setActiveTab("pending");
    setDetailApplicationId(null);
    setRejectConfirmId(null);
  }, [isLoading, listingFromUrl, listings]);

  useEffect(() => {
    setSortOption("newest");
    setGenderFilter("all");
    setEducationFilter("all");
    setAgeRangeFilter("all");
    setLocationFilter("all");
    setSelectedPositionFilters([]);
    setListingMatchOnly(false);
    setDistanceFilter("all");
    setAdvancedFiltersOpen(false);
  }, [selectedListingId, activeTab]);

  async function hasActiveMatch(
    applicantId: string,
    employerId: string,
  ): Promise<boolean> {
    const matchesSnap = await getDocs(
      query(collection(db, "matches"), where("user2Id", "==", employerId)),
    );

    return matchesSnap.docs.some((snapshot) => {
      const data = snapshot.data();
      return data.user1Id === applicantId && data.status === "active";
    });
  }

  async function handleAccept(application: Application) {
    const user = auth.currentUser;
    if (!user || !selectedListingId) return;

    setActionLoadingId(application.id);
    setError(null);

    try {
      await updateDoc(doc(db, "applications", application.id), {
        status: "accepted",
      });

      const alreadyMatched = await hasActiveMatch(
        application.applicantId,
        user.uid,
      );

      if (!alreadyMatched) {
        const nowIso = firestoreLocalIsoNow();

        const matchRef = await addDoc(collection(db, "matches"), {
          applicationId: application.id,
          user1Id: application.applicantId,
          user2Id: user.uid,
          listingId: selectedListingId,
          status: "active",
          createdAt: nowIso,
        });

        await addDoc(collection(db, "conversations"), {
          matchId: matchRef.id,
          user1Id: application.applicantId,
          user2Id: user.uid,
          createdAt: nowIso,
          lastMessage: "",
          lastMessageAt: nowIso,
          lastMessageSenderId: user.uid,
        });
      }

      setApplications((prev) =>
        prev.map((item) =>
          item.id === application.id ? { ...item, status: "accepted" } : item,
        ),
      );
      setFeedback("Aday onaylandı, eşleşme oluşturuldu");
      setActiveTab("accepted");
      if (detailApplicationId === application.id) {
        setDetailApplicationId(null);
      }
    } catch (err) {
      console.error("Accept failed:", err);
      setError("Başvuru onaylanamadı. Lütfen tekrar dene.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(application: Application) {
    setActionLoadingId(application.id);
    setError(null);

    try {
      await updateDoc(doc(db, "applications", application.id), {
        status: "rejected",
      });

      setApplications((prev) =>
        prev.map((item) =>
          item.id === application.id ? { ...item, status: "rejected" } : item,
        ),
      );
      setFeedback("Başvuru reddedildi");
      setActiveTab("rejected");
      setRejectConfirmId(null);
      if (detailApplicationId === application.id) {
        setDetailApplicationId(null);
      }
    } catch (err) {
      console.error("Reject failed:", err);
      setError("Başvuru reddedilemedi. Lütfen tekrar dene.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function openListing(listingId: string) {
    setSelectedListingId(listingId);
    setStage("applications");
    setActiveTab("pending");
    setDetailApplicationId(null);
    setRejectConfirmId(null);
    setFeedback(null);
    setError(null);
  }

  function backToListings() {
    setStage("listings");
    setSelectedListingId(null);
    setDetailApplicationId(null);
    setRejectConfirmId(null);
    setFeedback(null);
    setSortOption("newest");
    setGenderFilter("all");
    setEducationFilter("all");
    setAgeRangeFilter("all");
    setLocationFilter("all");
    setSelectedPositionFilters([]);
    setListingMatchOnly(false);
    setDistanceFilter("all");
    setAdvancedFiltersOpen(false);
  }

  function clearApplicationFilters() {
    setSortOption("newest");
    setGenderFilter("all");
    setEducationFilter("all");
    setAgeRangeFilter("all");
    setLocationFilter("all");
    setSelectedPositionFilters([]);
    setListingMatchOnly(false);
    setDistanceFilter("all");
  }

  function togglePositionFilter(position: string) {
    setSelectedPositionFilters((current) =>
      current.includes(position)
        ? current.filter((item) => item !== position)
        : [...current, position],
    );
  }

  function getTabApplicationCount(tab: ApplicationTab): number {
    switch (tab) {
      case "pending":
        return selectedListingApplicationCounts.pending;
      case "accepted":
        return selectedListingApplicationCounts.accepted;
      case "rejected":
        return selectedListingApplicationCounts.rejected;
    }
  }

  function renderApplicationActions(application: Application) {
    const isLoadingAction = actionLoadingId === application.id;

    if (application.status === "pending") {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleAccept(application)}
            disabled={Boolean(actionLoadingId)}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {isLoadingAction ? "Onaylanıyor..." : "Onayla"}
          </button>
          <button
            type="button"
            onClick={() => setRejectConfirmId(application.id)}
            disabled={Boolean(actionLoadingId)}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            Reddet
          </button>
        </div>
      );
    }

    if (application.status === "accepted") {
      return (
        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          Kabul edildi
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
        Reddedildi
      </span>
    );
  }

  function renderApplicantCard(application: Application) {
    const profile = profiles[application.applicantId];
    const fullName = profile?.fullName?.trim() || "İsimsiz aday";
    const age = calculateAge(profile?.birthDate);
    const genderLabel = labelFromMap(GENDER_LABELS, profile?.gender);
    const educationLabel = labelFromMap(
      EDUCATION_LABELS,
      profile?.educationLevel,
    );
    const locationLabel = formatLocation(profile?.city, profile?.district);
    const positions = profile?.positions ?? [];
    const distanceKm = getApplicantDistanceKm(employerCoords, profile);
    const distanceLabel = formatDistanceDisplay(distanceKm, locationLabel);
    const isLoadingAction = actionLoadingId === application.id;

    return (
      <article
        key={application.id}
        role="button"
        tabIndex={0}
        onClick={() => setDetailApplicationId(application.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setDetailApplicationId(application.id);
          }
        }}
        className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-[#036AAF]/20 hover:shadow-md"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <ApplicantAvatar
            name={fullName}
            photoUrl={profile?.profilePhotoUrl}
            size="card"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-[#0f2540]">
                  {fullName}
                </h3>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-neutral-500">
                  <Calendar className="size-3.5 shrink-0" aria-hidden />
                  {formatDate(application.createdAt)}
                </p>
              </div>

              {application.status !== "pending" ? (
                <div className="shrink-0">
                  {application.status === "accepted" ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Kabul edildi
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                      Reddedildi
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
              <span className="inline-flex items-center gap-1">
                <User className="size-3.5 shrink-0 text-neutral-400" aria-hidden />
                {age !== null ? `${age} yaş` : "Yaş belirtilmemiş"}
              </span>
              <span aria-hidden>·</span>
              <span>{genderLabel}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0 text-neutral-400" aria-hidden />
                {locationLabel}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Navigation
                  className="size-3.5 shrink-0 text-neutral-400"
                  aria-hidden
                />
                {distanceLabel}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <GraduationCap
                  className="size-3.5 shrink-0 text-neutral-400"
                  aria-hidden
                />
                {educationLabel}
              </span>
            </div>

            {distanceKm === null ? (
              <p className="mt-1 text-xs text-neutral-400">
                konum belirtilmemiş
              </p>
            ) : null}

            <div className="mt-3">
              <PositionChips positions={positions} />
            </div>

            <div
              className="mt-4 flex flex-wrap items-center gap-2"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {application.status === "pending" ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleAccept(application)}
                    disabled={Boolean(actionLoadingId)}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isLoadingAction ? "Onaylanıyor..." : "Onayla"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectConfirmId(application.id)}
                    disabled={Boolean(actionLoadingId)}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                  >
                    Reddet
                  </button>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => setDetailApplicationId(application.id)}
                className="rounded-full border border-[#036AAF]/30 px-4 py-2 text-sm font-medium text-[#036AAF] transition-colors hover:bg-[#036AAF]/8"
              >
                Detay
              </button>
            </div>

            {rejectConfirmId === application.id ? (
              <div
                className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <p className="text-sm text-red-800">
                  Bu başvuruyu reddetmek istediğinize emin misiniz?
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleReject(application)}
                    disabled={Boolean(actionLoadingId)}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {actionLoadingId === application.id
                      ? "Reddediliyor..."
                      : "Evet, reddet"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectConfirmId(null)}
                    disabled={Boolean(actionLoadingId)}
                    className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  function renderDetailModal() {
    if (!detailApplication) return null;

    const profile = detailProfile;
    const fullName = profile?.fullName?.trim() || "İsimsiz aday";
    const age = calculateAge(profile?.birthDate);
    const genderLabel = labelFromMap(GENDER_LABELS, profile?.gender);
    const educationLabel = labelFromMap(
      EDUCATION_LABELS,
      profile?.educationLevel,
    );
    const showMilitary =
      profile?.gender === "male" && Boolean(profile?.militaryStatus);
    const specialStatuses =
      profile?.specialStatuses
        ?.map((status) => labelFromMap(SPECIAL_STATUS_LABELS, status))
        .filter(Boolean) ?? [];

    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="applicant-detail-title"
      >
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-neutral-100 bg-white px-5 py-4">
            <h2
              id="applicant-detail-title"
              className="text-lg font-semibold text-[#1a1a1a]"
            >
              Aday Detayı
            </h2>
            <button
              type="button"
              onClick={() => setDetailApplicationId(null)}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
              aria-label="Kapat"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="space-y-6 p-5">
            <div className="flex items-center gap-4">
              <ApplicantAvatar
                name={fullName}
                photoUrl={profile?.profilePhotoUrl}
                size="lg"
              />
              <div>
                <h3 className="text-xl font-bold text-[#1a1a1a]">{fullName}</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {age !== null ? `${age} yaş` : "Yaş belirtilmemiş"} ·{" "}
                  {genderLabel}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {formatLocation(profile?.city, profile?.district)}
                </p>
              </div>
            </div>

            {profile?.about ? (
              <section>
                <h4 className="mb-2 text-sm font-semibold text-[#1a1a1a]">
                  Hakkında
                </h4>
                <p className="text-sm leading-relaxed text-neutral-600">
                  {profile.about}
                </p>
              </section>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-1 text-sm font-semibold text-[#1a1a1a]">
                  Eğitim
                </h4>
                <p className="text-sm text-neutral-600">{educationLabel}</p>
              </div>
              <div>
                <h4 className="mb-1 text-sm font-semibold text-[#1a1a1a]">
                  Aradığı pozisyonlar
                </h4>
                <p className="text-sm text-neutral-600">
                  {profile?.positions?.length
                    ? profile.positions.join(", ")
                    : "—"}
                </p>
              </div>
              {showMilitary ? (
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-[#1a1a1a]">
                    Askerlik
                  </h4>
                  <p className="text-sm text-neutral-600">
                    {labelFromMap(MILITARY_LABELS, profile?.militaryStatus)}
                  </p>
                </div>
              ) : null}
              <div>
                <h4 className="mb-1 text-sm font-semibold text-[#1a1a1a]">
                  Ehliyet
                </h4>
                <p className="text-sm text-neutral-600">
                  {profile?.driverLicenses?.length
                    ? profile.driverLicenses.join(", ")
                    : "—"}
                </p>
              </div>
              <div>
                <h4 className="mb-1 text-sm font-semibold text-[#1a1a1a]">
                  Diller
                </h4>
                <p className="text-sm text-neutral-600">
                  {profile?.languages?.length
                    ? profile.languages.join(", ")
                    : "—"}
                </p>
              </div>
            </section>

            {specialStatuses.length > 0 ? (
              <section>
                <h4 className="mb-2 text-sm font-semibold text-[#1a1a1a]">
                  Özel durumlar
                </h4>
                <div className="flex flex-wrap gap-2">
                  {specialStatuses.map((status) => (
                    <span
                      key={status}
                      className="rounded-full bg-[#036AAF]/10 px-3 py-1 text-xs font-medium text-[#036AAF]"
                    >
                      {status}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {profile?.experiences &&
            profile.experiences.filter((experience) => experience.title?.trim())
              .length > 0 ? (
              <section>
                <h4 className="mb-3 text-sm font-semibold text-[#1a1a1a]">
                  Deneyimler
                </h4>
                <div className="space-y-3">
                  {profile.experiences
                    .filter((experience) => experience.title?.trim())
                    .map((experience, index) => {
                      const dateRange = formatExperienceDateRange(experience);

                      return (
                        <div
                          key={`${experience.title}-${index}`}
                          className="rounded-2xl border border-neutral-200/80 p-4"
                        >
                          <p className="font-medium text-[#1a1a1a]">
                            {experience.title}
                          </p>
                          {experience.companyName ? (
                            <p className="text-sm text-neutral-600">
                              {experience.companyName}
                            </p>
                          ) : null}
                          {dateRange ? (
                            <p className="mt-1 text-xs text-neutral-500">
                              {dateRange}
                            </p>
                          ) : null}
                          {experience.description ? (
                            <p className="mt-2 text-sm text-neutral-600">
                              {experience.description}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              </section>
            ) : null}

            <div className="border-t border-neutral-100 pt-4">
              {renderApplicationActions(detailApplication)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthReady || isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-[#036AAF]" aria-hidden />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2540]">Başvurular</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {stage === "listings"
              ? "Başvuruları görmek için bir ilan seçin"
              : selectedListing?.title}
          </p>
          {stage === "applications" && selectedListing ? (
            <p className="mt-1 text-sm font-medium text-neutral-600">
              Toplam {selectedListingApplicationCounts.total} başvuru ·{" "}
              {selectedListingApplicationCounts.pending} bekliyor
            </p>
          ) : null}
        </div>
        {stage === "applications" ? (
          <button
            type="button"
            onClick={backToListings}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#036AAF] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#025a94]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            İlanlara dön
          </button>
        ) : null}
      </div>

      {stage === "listings" && totalPendingApplications > 0 ? (
        <p className="mt-4 rounded-2xl bg-[#036AAF]/8 px-4 py-3 text-sm font-semibold text-[#036AAF]">
          Toplam {totalPendingApplications} yeni başvurun var
        </p>
      ) : null}

      {feedback ? (
        <p
          className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {feedback}
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {stage === "listings" ? (
        listings.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#036AAF]/10 text-[#036AAF]">
              <Briefcase className="size-8" strokeWidth={1.5} />
            </div>
            <p className="mt-5 text-lg font-semibold text-[#0f2540]">
              Önce ilan oluşturmalısınız
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Başvuruları görebilmek için en az bir ilan yayınlamalısınız.
            </p>
            <Link
              href="/isveren/panel/ilanlar/yeni"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#036AAF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94]"
            >
              <Plus className="size-4" aria-hidden />
              İlan Oluştur
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {sortedListingsForSelection.map((listing) => {
              const badge = getStatusBadge(listing.status);
              const stats = applicationStatsByListing.get(listing.id) ?? {
                total: 0,
                pending: 0,
              };
              const createdLabel = formatListingCreatedDate(listing.createdAt);
              const hasPending = stats.pending > 0;

              return (
                <li key={listing.id}>
                  <button
                    type="button"
                    onClick={() => openListing(listing.id)}
                    className={`group w-full cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#036AAF]/25 hover:shadow-md ${
                      hasPending
                        ? "border-[#036AAF]/20 border-l-4 border-l-[#036AAF]"
                        : "border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
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

                        {listing.positions.length > 0 ? (
                          <p className="mt-1 truncate text-sm text-neutral-600">
                            {listing.positions.join(", ")}
                          </p>
                        ) : null}

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                          {listing.city ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin
                                className="size-3.5 shrink-0 text-neutral-400"
                                aria-hidden
                              />
                              {listing.city}
                            </span>
                          ) : null}
                          {createdLabel ? (
                            <span className="text-neutral-400">
                              {createdLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                        <div className="min-w-[4.5rem] text-right">
                          {stats.total === 0 ? (
                            <p className="text-xs font-medium text-neutral-400">
                              Henüz başvuru yok
                            </p>
                          ) : (
                            <>
                              <p className="text-3xl font-bold leading-none text-[#0f2540]">
                                {stats.total}
                              </p>
                              <p className="mt-1 text-xs text-neutral-500">
                                başvuru
                              </p>
                              {stats.pending > 0 ? (
                                <span className="mt-2 inline-flex rounded-full bg-[#036AAF]/10 px-2 py-0.5 text-xs font-semibold text-[#036AAF]">
                                  {stats.pending} yeni
                                </span>
                              ) : (
                                <p className="mt-2 text-xs text-neutral-400">
                                  Yeni yok
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        <ChevronRight
                          className="size-5 shrink-0 text-neutral-300 transition-colors group-hover:text-[#036AAF]"
                          aria-hidden
                        />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            {APPLICATION_TABS.map((tab) => {
              const count = getTabApplicationCount(tab.id);
              const isActive = activeTab === tab.id;
              const pendingHighlight =
                tab.id === "pending" && count > 0 && !isActive;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#036AAF] text-white"
                      : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : pendingHighlight
                          ? "bg-[#036AAF]/10 text-[#036AAF]"
                          : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {tabApplications.length > 0 ? (
            <div
              className={`mt-6 rounded-2xl border bg-white p-4 shadow-sm ${
                hasActiveApplicationFilters
                  ? "border-[#036AAF]/30 ring-1 ring-[#036AAF]/10"
                  : "border-neutral-200"
              }`}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f2540]">
                  <SlidersHorizontal className="size-4 text-[#036AAF]" />
                  Filtrele ve sırala
                </div>
                {hasActiveApplicationFilters ? (
                  <button
                    type="button"
                    onClick={clearApplicationFilters}
                    className="inline-flex items-center gap-1 rounded-full bg-[#036AAF]/10 px-3 py-1.5 text-xs font-semibold text-[#036AAF] transition-colors hover:bg-[#036AAF]/15"
                  >
                    <X className="size-3.5" />
                    Tümünü temizle
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                    Sırala
                  </span>
                  <select
                    value={sortOption}
                    onChange={(event) =>
                      setSortOption(event.target.value as SortOption)
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none transition-colors focus:border-[#036AAF]/40 focus:ring-2 focus:ring-[#036AAF]/10"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                    Mesafe
                  </span>
                  <select
                    value={distanceFilter}
                    onChange={(event) =>
                      setDistanceFilter(event.target.value as DistanceFilter)
                    }
                    disabled={!employerHasCoords}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none transition-colors focus:border-[#036AAF]/40 focus:ring-2 focus:ring-[#036AAF]/10 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
                  >
                    {DISTANCE_FILTER_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {!employerHasCoords ? (
                    <p className="mt-1.5 text-xs text-neutral-400">
                      Konumunuz tanımlı değil, mesafe filtresi kullanılamıyor
                    </p>
                  ) : null}
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setListingMatchOnly((current) => !current)}
                    disabled={(selectedListing?.positions.length ?? 0) === 0}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      listingMatchOnly
                        ? "border-[#036AAF] bg-[#036AAF] text-white"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-[#036AAF]/30 hover:text-[#036AAF]"
                    }`}
                  >
                    İlana uygun
                  </button>
                </div>
              </div>

              {availableApplicantPositions.length > 0 ? (
                <div className="mt-4">
                  <span className="mb-2 block text-xs font-medium text-neutral-500">
                    Pozisyon
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableApplicantPositions.map((position) => {
                      const isSelected =
                        selectedPositionFilters.includes(position);

                      return (
                        <button
                          key={position}
                          type="button"
                          onClick={() => togglePositionFilter(position)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            isSelected
                              ? "bg-[#036AAF] text-white"
                              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                          }`}
                        >
                          {position}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={() => setAdvancedFiltersOpen((current) => !current)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                    advancedFilterCount > 0
                      ? "bg-[#036AAF]/10 text-[#036AAF]"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  Filtreler
                  {advancedFilterCount > 0 ? (
                    <span className="rounded-full bg-[#036AAF] px-2 py-0.5 text-xs font-bold text-white">
                      {advancedFilterCount}
                    </span>
                  ) : null}
                  <ChevronDown
                    className={`size-4 transition-transform ${
                      advancedFiltersOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {advancedFiltersOpen ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                        Cinsiyet
                      </span>
                      <select
                        value={genderFilter}
                        onChange={(event) =>
                          setGenderFilter(event.target.value as GenderFilter)
                        }
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none transition-colors focus:border-[#036AAF]/40 focus:ring-2 focus:ring-[#036AAF]/10"
                      >
                        <option value="all">Tümü</option>
                        <option value="male">Erkek</option>
                        <option value="female">Kadın</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                        Eğitim
                      </span>
                      <select
                        value={educationFilter}
                        onChange={(event) =>
                          setEducationFilter(
                            event.target.value as EducationFilter,
                          )
                        }
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none transition-colors focus:border-[#036AAF]/40 focus:ring-2 focus:ring-[#036AAF]/10"
                      >
                        {EDUCATION_FILTER_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                        Yaş aralığı
                      </span>
                      <select
                        value={ageRangeFilter}
                        onChange={(event) =>
                          setAgeRangeFilter(
                            event.target.value as AgeRangeFilter,
                          )
                        }
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none transition-colors focus:border-[#036AAF]/40 focus:ring-2 focus:ring-[#036AAF]/10"
                      >
                        {AGE_RANGE_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                        Şehir / İlçe
                      </span>
                      <select
                        value={locationFilter}
                        onChange={(event) =>
                          setLocationFilter(event.target.value)
                        }
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none transition-colors focus:border-[#036AAF]/40 focus:ring-2 focus:ring-[#036AAF]/10"
                      >
                        <option value="all">Tümü</option>
                        {availableLocations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
              </div>

              <p className="mt-4 text-sm text-neutral-500">
                {tabApplications.length} başvurudan{" "}
                {displayedApplications.length} gösteriliyor
              </p>
            </div>
          ) : null}

          {tabApplications.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
              <Users className="mx-auto size-10 text-neutral-300" aria-hidden />
              <p className="mt-4 text-base font-medium text-[#0f2540]">
                {activeTab === "pending"
                  ? "Bekleyen başvuru yok"
                  : activeTab === "accepted"
                    ? "Kabul edilen başvuru yok"
                    : "Reddedilen başvuru yok"}
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Bu sekmede görüntülenecek aday bulunmuyor.
              </p>
            </div>
          ) : displayedApplications.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
              <SlidersHorizontal
                className="mx-auto size-10 text-neutral-300"
                aria-hidden
              />
              <p className="mt-4 text-base font-medium text-[#0f2540]">
                Bu filtreye uygun aday yok
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Filtreleri gevşeterek daha fazla aday görebilirsiniz.
              </p>
              <button
                type="button"
                onClick={clearApplicationFilters}
                className="mt-4 inline-flex rounded-full bg-[#036AAF] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#025a94]"
              >
                Filtreleri temizle
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {displayedApplications.map((application) =>
                renderApplicantCard(application),
              )}
            </div>
          )}
        </div>
      )}

      {renderDetailModal()}
    </div>
  );
}
