"use client";

import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BENEFITS,
  formatSalaryDisplay,
  formatTry,
  SALARY_LADDER,
  salaryToStorage,
  usesSalaryRange,
  workTypeLabelFromId,
  WORK_SHIFTS,
  WORK_TYPES,
} from "@/lib/data/listing-constants";
import { getAllPositions } from "@/lib/data/positions";
import { auth, db } from "@/lib/firebase";
import { isEmployerSigningOut } from "@/lib/auth/panel-sign-out";
import { findNearestDistrict } from "@/app/isveren/kayit/find-nearest-location";

const fieldClassName =
  "w-full rounded-2xl border border-neutral-200/80 bg-white px-5 py-3.5 text-base text-[#1a1a1a] shadow-sm outline-none transition-shadow placeholder:text-neutral-400 focus:border-[#036AAF]/40 focus:shadow-[0_0_0_3px_rgba(3,106,175,0.12)] disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "mb-1.5 block text-sm font-medium text-[#1a1a1a]/80";

const sectionTitleClassName = "text-lg font-semibold text-[#1a1a1a]";

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <h2 className={`shrink-0 ${sectionTitleClassName}`}>{title}</h2>
      <div className="h-px flex-1 bg-neutral-200" aria-hidden />
    </div>
  );
}

function formatCityForStorage(city: string, district: string): string {
  return district ? `${city}, ${district}` : city;
}

function formatLocationDisplay(city: string, district: string): string {
  return district ? `${city} / ${district}` : city;
}

type LocationMode = "workplace" | "current";

export default function YeniIlanPage() {
  const router = useRouter();

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [allPositions, setAllPositions] = useState<string[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationMode, setLocationMode] = useState<LocationMode>("workplace");
  const [companyCity, setCompanyCity] = useState("");
  const [companyDistrict, setCompanyDistrict] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [currentDistrict, setCurrentDistrict] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [workType, setWorkType] = useState("");
  const [positions, setPositions] = useState<string[]>([]);
  const [positionSearch, setPositionSearch] = useState("");

  const [minSalaryIndex, setMinSalaryIndex] = useState(0);
  const [maxSalaryIndex, setMaxSalaryIndex] = useState(6);
  const [skipSalary, setSkipSalary] = useState(false);

  const [workShift, setWorkShift] = useState("");
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [prefersDisabledCandidates, setPrefersDisabledCandidates] =
    useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showSalary = usesSalaryRange(workType);

  const resolvedCityValue = useMemo(() => {
    if (locationMode === "workplace") {
      return companyCity
        ? formatCityForStorage(companyCity, companyDistrict)
        : "";
    }
    if (currentCity && currentDistrict) {
      return `${currentCity}, ${currentDistrict}`;
    }
    return "";
  }, [
    locationMode,
    companyCity,
    companyDistrict,
    currentCity,
    currentDistrict,
  ]);

  const locationComplete = resolvedCityValue.length > 0;

  const requiredComplete =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    locationComplete &&
    workType.length > 0;

  const filteredPositions = useMemo(() => {
    const query = positionSearch.trim().toLocaleLowerCase("tr");
    const available = allPositions.filter((p) => !positions.includes(p));
    if (!query) return available.slice(0, 12);
    return available
      .filter((p) => p.toLocaleLowerCase("tr").includes(query))
      .slice(0, 12);
  }, [allPositions, positionSearch, positions]);

  const salaryPreview = useMemo(() => {
    if (!showSalary || skipSalary) return null;
    const stored = salaryToStorage(minSalaryIndex, maxSalaryIndex);
    return formatSalaryDisplay(stored.min, stored.max);
  }, [showSalary, skipSalary, minSalaryIndex, maxSalaryIndex]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (isEmployerSigningOut()) return;
        router.replace("/isveren/giris");
        return;
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isAuthReady) return;

    const user = auth.currentUser;
    if (!user) return;

    let cancelled = false;

    async function loadProfile() {
      setIsLoadingProfile(true);

      try {
        const profileSnap = await getDoc(
          doc(db, "corporate_profiles", user!.uid),
        );

        if (cancelled) return;

        if (profileSnap.exists()) {
          const profile = profileSnap.data();
          setCompanyCity((profile.city as string | undefined) ?? "");
          setCompanyDistrict((profile.district as string | undefined) ?? "");
        }
      } catch (err) {
        console.error("Profile load failed:", err);
      } finally {
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady]);

  useEffect(() => {
    getAllPositions()
      .then(setAllPositions)
      .catch(() => setError("Pozisyon listesi yüklenemedi."))
      .finally(() => setIsLoadingPositions(false));
  }, []);

  useEffect(() => {
    if (!showSalary) {
      setSkipSalary(false);
    }
  }, [showSalary]);

  useEffect(() => {
    if (maxSalaryIndex < minSalaryIndex) {
      setMaxSalaryIndex(minSalaryIndex);
    }
  }, [minSalaryIndex, maxSalaryIndex]);

  function addPosition(position: string) {
    if (positions.includes(position)) return;
    setPositions((prev) => [...prev, position]);
    setPositionSearch("");
  }

  function removePosition(position: string) {
    setPositions((prev) => prev.filter((p) => p !== position));
  }

  function toggleBenefit(benefit: string) {
    setSelectedBenefits((prev) =>
      prev.includes(benefit)
        ? prev.filter((b) => b !== benefit)
        : [...prev, benefit],
    );
  }

  function handleSelectCurrentLocation() {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Konum alınamadı, iş yeri konumunu kullanabilirsiniz");
      setLocationMode("workplace");
      return;
    }

    setLocationMode("current");
    setIsLocating(true);
    setCurrentCity("");
    setCurrentDistrict("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearest = findNearestDistrict(latitude, longitude);

        if (!nearest) {
          setLocationError(
            "Konum alınamadı, iş yeri konumunu kullanabilirsiniz",
          );
          setLocationMode("workplace");
          setIsLocating(false);
          return;
        }

        setCurrentCity(nearest.city);
        setCurrentDistrict(nearest.district);
        setIsLocating(false);
      },
      () => {
        setLocationError("Konum alınamadı, iş yeri konumunu kullanabilirsiniz");
        setLocationMode("workplace");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!requiredComplete) {
      setError("Lütfen zorunlu alanları doldur.");
      return;
    }

    if (!resolvedCityValue) {
      setError(
        "Konum seçilemedi. İş yeri konumunuzu profilde tanımlayın veya anlık konumunuzu kullanın.",
      );
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      if (isEmployerSigningOut()) return;
      router.replace("/isveren/giris");
      return;
    }

    setIsSubmitting(true);

    try {
      const profileSnap = await getDoc(
        doc(db, "corporate_profiles", user.uid),
      );
      const profile = profileSnap.exists() ? profileSnap.data() : null;
      const companyName =
        (profile?.companyName as string | undefined)?.trim() ?? null;
      const logoUrl = (profile?.logoUrl as string | null | undefined) ?? null;

      let salaryMin: string | null = null;
      let salaryMax: string | null = null;

      if (showSalary && !skipSalary) {
        const stored = salaryToStorage(minSalaryIndex, maxSalaryIndex);
        salaryMin = stored.min;
        salaryMax = stored.max;
      }

      const cityValue = resolvedCityValue;

      await addDoc(collection(db, "job_listings"), {
        ownerId: user.uid,
        listingType: "corporate",
        title: title.trim(),
        description: description.trim(),
        city: cityValue,
        workType: workTypeLabelFromId(workType),
        positions,
        salaryMin,
        salaryMax,
        benefits: selectedBenefits,
        isUrgent,
        prefersDisabledCandidates,
        workShift: workShift || null,
        status: "pending",
        companyName,
        logoUrl,
        ownerName: null,
        ownerPhotoUrl: null,
        createdAt: serverTimestamp(),
      });

      router.push("/isveren/panel/ilanlar");
    } catch (err) {
      console.error("Listing create failed:", err);
      setError("İlan yayınlanamadı. Lütfen tekrar dene.");
      setIsSubmitting(false);
    }
  }

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-[#036AAF]" aria-hidden />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Yeni İlan</h1>
          <p className="mt-1 text-sm text-neutral-500">
            İş ilanını oluştur ve yayınla
          </p>
        </div>
        <Link
          href="/isveren/panel/ilanlar"
          className="text-sm font-medium text-[#036AAF] hover:underline"
        >
          ← İlanlarım
        </Link>
      </div>

      <p className="mt-4 rounded-2xl bg-[#036AAF]/8 px-4 py-3 text-sm text-[#036AAF]">
        İlanlar yayınlanmadan önce incelenir. Onaylandıktan sonra adaylara
        görünür olur.
      </p>

      <form className="mt-8 space-y-10" onSubmit={handleSubmit} noValidate>
        <section>
          <SectionHeader title="Temel Bilgiler" />
          <div className="space-y-5">
            <div>
              <label htmlFor="title" className={labelClassName}>
                Başlık
              </label>
              <input
                id="title"
                type="text"
                maxLength={80}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                className={fieldClassName}
                placeholder="Örn: Depo Sorumlusu Aranıyor"
              />
              <p className="mt-1 text-xs text-neutral-400">
                {title.length}/80 karakter
              </p>
            </div>

            <div>
              <label htmlFor="description" className={labelClassName}>
                Açıklama
              </label>
              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                className={`${fieldClassName} resize-y`}
                placeholder="İş tanımı, beklentiler ve aday profili..."
              />
            </div>

            <div>
              <p className={labelClassName}>Konum</p>
              <fieldset className="space-y-3">
                <legend className="sr-only">Konum seçimi</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                      locationMode === "workplace"
                        ? "border-[#036AAF] bg-[#036AAF]/8 ring-2 ring-[#036AAF]/20"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="locationMode"
                      value="workplace"
                      checked={locationMode === "workplace"}
                      onChange={() => {
                        setLocationMode("workplace");
                        setLocationError(null);
                        if (error) setError(null);
                      }}
                      disabled={isSubmitting || isLocating}
                      className="accent-[#036AAF]"
                    />
                    <span className="text-sm font-medium text-[#1a1a1a]">
                      İş yeri konumumu kullan
                    </span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                      locationMode === "current"
                        ? "border-[#036AAF] bg-[#036AAF]/8 ring-2 ring-[#036AAF]/20"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="locationMode"
                      value="current"
                      checked={locationMode === "current"}
                      onChange={() => {
                        if (error) setError(null);
                        handleSelectCurrentLocation();
                      }}
                      disabled={isSubmitting || isLocating}
                      className="accent-[#036AAF]"
                    />
                    <span className="text-sm font-medium text-[#1a1a1a]">
                      Şu anki konumumu kullan
                    </span>
                  </label>
                </div>
              </fieldset>

              {locationMode === "workplace" ? (
                isLoadingProfile ? (
                  <p className="mt-3 text-sm text-neutral-500">
                    İş yeri konumu yükleniyor...
                  </p>
                ) : companyCity ? (
                  <p className="mt-3 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-[#1a1a1a]">
                    İş yeri:{" "}
                    {formatLocationDisplay(companyCity, companyDistrict)}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-amber-700">
                    Profilde iş yeri konumu bulunamadı.
                  </p>
                )
              ) : isLocating ? (
                <p className="mt-3 text-sm text-neutral-500">
                  Konum alınıyor...
                </p>
              ) : currentCity && currentDistrict ? (
                <p className="mt-3 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-[#1a1a1a]">
                  Konumunuz:{" "}
                  {formatLocationDisplay(currentCity, currentDistrict)}
                </p>
              ) : null}

              {locationError ? (
                <p className="mt-3 text-sm text-amber-700" role="alert">
                  {locationError}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="Çalışma Tipi" />
          <fieldset className="space-y-3">
            <legend className="sr-only">Çalışma tipi</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {WORK_TYPES.map((type) => (
                <label
                  key={type.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                    workType === type.id
                      ? "border-[#036AAF] bg-[#036AAF]/8 ring-2 ring-[#036AAF]/20"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="workType"
                    value={type.id}
                    checked={workType === type.id}
                    onChange={(e) => {
                      setWorkType(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={isSubmitting}
                    className="accent-[#036AAF]"
                  />
                  <span className="text-sm font-medium text-[#1a1a1a]">
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section>
          <SectionHeader title="Pozisyonlar" />
          <p className="-mt-3 mb-4 text-sm text-neutral-500">
            En az bir pozisyon seçmen önerilir.
          </p>

          {positions.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {positions.map((position) => (
                <span
                  key={position}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#036AAF]/10 px-3 py-1.5 text-sm font-medium text-[#036AAF]"
                >
                  {position}
                  <button
                    type="button"
                    onClick={() => removePosition(position)}
                    disabled={isSubmitting}
                    className="rounded-full p-0.5 hover:bg-[#036AAF]/15 disabled:opacity-50"
                    aria-label={`${position} kaldır`}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              type="search"
              value={positionSearch}
              onChange={(e) => setPositionSearch(e.target.value)}
              disabled={isSubmitting || isLoadingPositions}
              placeholder="Pozisyon ara..."
              className={`${fieldClassName} pl-11`}
            />
          </div>

          {isLoadingPositions ? (
            <p className="mt-3 text-sm text-neutral-500">Pozisyonlar yükleniyor...</p>
          ) : filteredPositions.length > 0 ? (
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {filteredPositions.map((position) => (
                <li key={position}>
                  <button
                    type="button"
                    onClick={() => addPosition(position)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 text-left text-sm text-[#1a1a1a] hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {position}
                  </button>
                </li>
              ))}
            </ul>
          ) : positionSearch.trim() ? (
            <p className="mt-2 text-sm text-neutral-500">
              Eşleşen pozisyon bulunamadı.
            </p>
          ) : null}
        </section>

        {showSalary ? (
          <section>
            <SectionHeader title="Maaş" />
            <label className="mb-5 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={skipSalary}
                onChange={(e) => setSkipSalary(e.target.checked)}
                disabled={isSubmitting}
                className="size-4 rounded accent-[#036AAF]"
              />
              <span className="text-sm text-[#1a1a1a]/80">
                Maaş belirtmek istemiyorum
              </span>
            </label>

            {!skipSalary ? (
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="minSalary" className={labelClassName}>
                      Minimum
                    </label>
                    <select
                      id="minSalary"
                      value={minSalaryIndex}
                      onChange={(e) =>
                        setMinSalaryIndex(Number(e.target.value))
                      }
                      disabled={isSubmitting}
                      className={fieldClassName}
                    >
                      {SALARY_LADDER.map((value, index) => (
                        <option key={value} value={index}>
                          ₺{formatTry(value)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="maxSalary" className={labelClassName}>
                      Maksimum
                    </label>
                    <select
                      id="maxSalary"
                      value={maxSalaryIndex}
                      onChange={(e) =>
                        setMaxSalaryIndex(Number(e.target.value))
                      }
                      disabled={isSubmitting}
                      className={fieldClassName}
                    >
                      {SALARY_LADDER.map((value, index) =>
                        index >= minSalaryIndex ? (
                          <option key={value} value={index}>
                            ₺{formatTry(value)}
                          </option>
                        ) : null,
                      )}
                    </select>
                  </div>
                </div>

                {salaryPreview ? (
                  <p className="text-sm font-semibold text-[#036AAF]">
                    Seçili aralık: {salaryPreview}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <section>
          <SectionHeader title="Ek Tercihler" />
          <div className="space-y-6">
            <div>
              <label htmlFor="workShift" className={labelClassName}>
                Vardiya (isteğe bağlı)
              </label>
              <select
                id="workShift"
                value={workShift}
                onChange={(e) => setWorkShift(e.target.value)}
                disabled={isSubmitting}
                className={fieldClassName}
              >
                <option value="">Seçiniz</option>
                {WORK_SHIFTS.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className={labelClassName}>Yan Haklar</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {BENEFITS.map((benefit) => (
                  <label
                    key={benefit}
                    className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors ${
                      selectedBenefits.includes(benefit)
                        ? "border-[#036AAF] bg-[#036AAF]/8"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBenefits.includes(benefit)}
                      onChange={() => toggleBenefit(benefit)}
                      disabled={isSubmitting}
                      className="accent-[#036AAF]"
                    />
                    {benefit}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  disabled={isSubmitting}
                  className="size-4 rounded accent-[#036AAF]"
                />
                <span className="text-sm text-[#1a1a1a]/80">Acil ilan</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={prefersDisabledCandidates}
                  onChange={(e) =>
                    setPrefersDisabledCandidates(e.target.checked)
                  }
                  disabled={isSubmitting}
                  className="size-4 rounded accent-[#036AAF]"
                />
                <span className="text-sm text-[#1a1a1a]/80">
                  Engelli adaylara öncelik
                </span>
              </label>
            </div>
          </div>
        </section>

        {error ? (
          <p
            className="rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !requiredComplete}
          className="w-full rounded-full bg-[#036AAF] px-8 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#025a94] disabled:pointer-events-none disabled:opacity-60"
        >
          {isSubmitting ? "Yayınlanıyor..." : "İlanı Yayınla"}
        </button>
      </form>
    </div>
  );
}
