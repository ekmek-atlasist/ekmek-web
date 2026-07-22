"use client";

import "react-easy-crop/react-easy-crop.css";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Camera, Loader2, MapPin, Upload, UserX, X, ZoomIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { getCroppedImageBlob } from "../../kayit/crop-image";
import { findNearestDistrict } from "../../kayit/find-nearest-location";
import {
  getStorageErrorMessage,
  uploadCorporateLogo,
} from "../../kayit/upload-logo";
import { resolveCityCenter } from "@/lib/data/city-centers";
import { EMPLOYEE_COUNTS, JOB_CATEGORIES } from "@/lib/data/job-categories";
import { CITY_NAMES, TURKEY_CITIES } from "@/lib/data/turkey-cities";
import { auth, db } from "@/lib/firebase";
import { isEmployerSigningOut } from "@/lib/auth/panel-sign-out";

const fieldClassName =
  "w-full rounded-2xl border border-neutral-200/80 bg-white px-5 py-3.5 text-base text-[#1a1a1a] shadow-sm outline-none transition-shadow placeholder:text-neutral-400 focus:border-[#036AAF]/40 focus:shadow-[0_0_0_3px_rgba(3,106,175,0.12)] disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "mb-1.5 block text-sm font-medium text-[#1a1a1a]/80";

type CorporateProfile = {
  companyName?: string;
  ownerFullName?: string;
  ownerTitle?: string;
  city?: string;
  district?: string;
  categoryId?: string;
  employeeCount?: string | null;
  about?: string | null;
  logoUrl?: string | null;
  email?: string | null;
};

type BlockedUserItem = {
  userId: string;
  fullName: string;
  profilePhotoUrl: string | null;
};

type FormSnapshot = {
  companyName: string;
  ownerFullName: string;
  ownerTitle: string;
  city: string;
  district: string;
  categoryId: string;
  employeeCount: string;
  about: string;
  logoUrl: string | null;
};

const cardClassName =
  "rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm";
const cardTitleClassName = "mb-4 text-base font-semibold text-[#0f2540]";

function fieldFilled(value: string): boolean {
  return value.trim().length > 0;
}

type PhotoCropModalProps = {
  imageSrc: string;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void>;
};

function PhotoCropModal({ imageSrc, onClose, onConfirm }: PhotoCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    setCropError(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      await onConfirm(blob);
    } catch {
      setCropError("Fotoğraf işlenemedi. Lütfen tekrar dene.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-title"
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-[#0f2540] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="crop-title" className="text-lg font-semibold text-white">
            Logoyu düzenle
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="relative h-[min(52vh,420px)] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <ZoomIn className="size-4 shrink-0 text-white/60" aria-hidden />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={isProcessing}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[#036AAF]"
              aria-label="Yakınlaştır"
            />
          </div>

          {cropError ? (
            <p className="text-sm text-red-300" role="alert">
              {cropError}
            </p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 rounded-full border border-white/20 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || !croppedAreaPixels}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#036AAF] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94] disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Yükleniyor...
                </>
              ) : (
                "Onayla"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PanelProfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uidRef = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [ownerFullName, setOwnerFullName] = useState("");
  const [ownerTitle, setOwnerTitle] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [about, setAbout] = useState("");

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogoBlob, setPendingLogoBlob] = useState<Blob | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);
  const [blocksFeedback, setBlocksFeedback] = useState<string | null>(null);
  const [blocksError, setBlocksError] = useState<string | null>(null);
  const [unblockTargetId, setUnblockTargetId] = useState<string | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [initialForm, setInitialForm] = useState<FormSnapshot | null>(null);

  const districts = useMemo(
    () => (city ? (TURKEY_CITIES[city] ?? []) : []),
    [city],
  );

  const requiredComplete =
    fieldFilled(companyName) &&
    fieldFilled(ownerFullName) &&
    fieldFilled(ownerTitle) &&
    fieldFilled(city) &&
    fieldFilled(district);

  const categoryLabel = useMemo(
    () => JOB_CATEGORIES.find((cat) => cat.id === categoryId)?.label ?? null,
    [categoryId],
  );

  const employeeCountLabel = useMemo(
    () => EMPLOYEE_COUNTS.find((item) => item.id === employeeCount)?.label ?? null,
    [employeeCount],
  );

  const locationSummary = useMemo(() => {
    if (city && district) return `${city}, ${district}`;
    return city || district || "Konum belirtilmemiş";
  }, [city, district]);

  const hasChanges = useMemo(() => {
    if (!initialForm) return false;
    if (pendingLogoBlob) return true;

    return (
      companyName !== initialForm.companyName ||
      ownerFullName !== initialForm.ownerFullName ||
      ownerTitle !== initialForm.ownerTitle ||
      city !== initialForm.city ||
      district !== initialForm.district ||
      categoryId !== initialForm.categoryId ||
      employeeCount !== initialForm.employeeCount ||
      about !== initialForm.about ||
      logoUrl !== initialForm.logoUrl
    );
  }, [
    about,
    categoryId,
    city,
    companyName,
    district,
    employeeCount,
    initialForm,
    logoUrl,
    ownerFullName,
    ownerTitle,
    pendingLogoBlob,
  ]);

  const saveDisabled =
    isSaving || !requiredComplete || isUploadingLogo || !hasChanges;

  const loadBlockedUsers = useCallback(async (uid: string) => {
    setIsLoadingBlocks(true);
    setBlocksError(null);

    try {
      const snap = await getDocs(
        query(collection(db, "blocks"), where("blockerId", "==", uid)),
      );

      const blockedIds = [
        ...new Set(
          snap.docs
            .map((docSnap) => String(docSnap.data().blockedUserId ?? ""))
            .filter(Boolean),
        ),
      ];

      if (blockedIds.length === 0) {
        setBlockedUsers([]);
        return;
      }

      const entries = await Promise.all(
        blockedIds.map(async (blockedUserId) => {
          try {
            const profileSnap = await getDoc(
              doc(db, "individual_profiles", blockedUserId),
            );
            const profile = profileSnap.exists() ? profileSnap.data() : {};
            return {
              userId: blockedUserId,
              fullName:
                String(profile.fullName ?? "").trim() || "Kullanıcı",
              profilePhotoUrl:
                typeof profile.profilePhotoUrl === "string"
                  ? profile.profilePhotoUrl
                  : null,
            } satisfies BlockedUserItem;
          } catch {
            return {
              userId: blockedUserId,
              fullName: "Kullanıcı",
              profilePhotoUrl: null,
            } satisfies BlockedUserItem;
          }
        }),
      );

      setBlockedUsers(entries);
    } catch (err) {
      console.error("Blocked users load failed:", err);
      setBlockedUsers([]);
      setBlocksError("Engellenen kullanıcılar yüklenemedi.");
    } finally {
      setIsLoadingBlocks(false);
    }
  }, []);

  const handleUnblockUser = useCallback(
    async (blockedUserId: string) => {
      const uid = uidRef.current ?? auth.currentUser?.uid;
      if (!uid) {
        if (isEmployerSigningOut()) return;
        router.replace("/isveren/giris");
        return;
      }

      setIsUnblocking(true);
      setBlocksError(null);
      setBlocksFeedback(null);

      try {
        const snap = await getDocs(
          query(collection(db, "blocks"), where("blockerId", "==", uid)),
        );

        const blockDocs = snap.docs.filter(
          (docSnap) => docSnap.data().blockedUserId === blockedUserId,
        );

        if (blockDocs.length === 0) {
          setBlockedUsers((prev) =>
            prev.filter((item) => item.userId !== blockedUserId),
          );
          setBlocksFeedback("Engel kaldırıldı");
          setUnblockTargetId(null);
          return;
        }

        await Promise.all(blockDocs.map((docSnap) => deleteDoc(docSnap.ref)));

        setBlockedUsers((prev) =>
          prev.filter((item) => item.userId !== blockedUserId),
        );
        setBlocksFeedback("Engel kaldırıldı");
        setUnblockTargetId(null);
      } catch (err) {
        console.error("Unblock failed:", err);
        setBlocksError("Engel kaldırılamadı. Lütfen tekrar dene.");
      } finally {
        setIsUnblocking(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isEmployerSigningOut()) return;
        router.replace("/isveren/giris");
        return;
      }

      uidRef.current = user.uid;

      try {
        const snap = await getDoc(doc(db, "corporate_profiles", user.uid));
        if (!snap.exists()) {
          router.replace("/isveren/kayit");
          return;
        }

        const data = snap.data() as CorporateProfile;
        setCompanyName(data.companyName ?? "");
        setOwnerFullName(data.ownerFullName ?? "");
        setOwnerTitle(data.ownerTitle ?? "");
        setCity(data.city ?? "");
        setDistrict(data.district ?? "");
        setCategoryId(data.categoryId ?? "");
        setEmployeeCount(data.employeeCount ?? "");
        setAbout(data.about ?? "");
        setLogoUrl(data.logoUrl ?? null);
        setLogoPreview(data.logoUrl ?? null);
        setInitialForm({
          companyName: data.companyName ?? "",
          ownerFullName: data.ownerFullName ?? "",
          ownerTitle: data.ownerTitle ?? "",
          city: data.city ?? "",
          district: data.district ?? "",
          categoryId: data.categoryId ?? "",
          employeeCount: data.employeeCount ?? "",
          about: data.about ?? "",
          logoUrl: data.logoUrl ?? null,
        });
        setIsLoading(false);
        void loadBlockedUsers(user.uid);
      } catch {
        setError("Profil yüklenemedi. Sayfayı yenileyip tekrar dene.");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadBlockedUsers, router]);

  useEffect(() => {
    if (!blocksFeedback) return;
    const timer = setTimeout(() => setBlocksFeedback(null), 3500);
    return () => clearTimeout(timer);
  }, [blocksFeedback]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (cropImageSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(cropImageSrc);
      }
    };
  }, [logoPreview, cropImageSrc]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seç.");
      return;
    }
    setError(null);
    setCropImageSrc(URL.createObjectURL(file));
  }

  async function handleCropConfirm(blob: Blob) {
    const uid = uidRef.current ?? auth.currentUser?.uid;
    if (!uid) {
      if (isEmployerSigningOut()) return;
      router.replace("/isveren/giris");
      return;
    }

    setPendingLogoBlob(blob);
    setCropImageSrc(null);

    const localPreview = URL.createObjectURL(blob);
    setLogoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return localPreview;
    });

    setIsUploadingLogo(true);
    setError(null);

    try {
      const downloadUrl = await uploadCorporateLogo(uid, blob);
      setLogoUrl(downloadUrl);
      setLogoPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return downloadUrl;
      });
      setPendingLogoBlob(null);
    } catch (err) {
      console.error("Logo upload failed:", err);
      setError(getStorageErrorMessage(err));
    } finally {
      setIsUploadingLogo(false);
    }
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setError("Tarayıcınız konum özelliğini desteklemiyor.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearest = findNearestDistrict(latitude, longitude);
        if (!nearest) {
          setError("Konumuna uygun il/ilçe bulunamadı.");
          setIsLocating(false);
          return;
        }
        setCity(nearest.city);
        setDistrict(nearest.district);
        setLocationHint(`Konumunuz: ${nearest.city} / ${nearest.district}`);
        setIsLocating(false);
      },
      () => {
        setError("Konum alınamadı. İzin verdiğinden emin ol.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!requiredComplete) {
      setError("Lütfen zorunlu alanları doldur.");
      return;
    }

    const uid = uidRef.current ?? auth.currentUser?.uid;
    if (!uid) {
      if (isEmployerSigningOut()) return;
      router.replace("/isveren/giris");
      return;
    }

    setIsSaving(true);

    try {
      let finalLogoUrl = logoUrl;

      if (!finalLogoUrl && pendingLogoBlob) {
        finalLogoUrl = await uploadCorporateLogo(uid, pendingLogoBlob);
        setLogoUrl(finalLogoUrl);
        setPendingLogoBlob(null);
      }

      const coords = resolveCityCenter(city, district);
      const trimmedAbout = about.trim();

      await updateDoc(doc(db, "corporate_profiles", uid), {
        companyName: companyName.trim(),
        ownerFullName: ownerFullName.trim(),
        ownerTitle: ownerTitle.trim(),
        city,
        district,
        categoryId: categoryId || "",
        employeeCount: employeeCount || null,
        about: trimmedAbout || null,
        logoUrl: finalLogoUrl || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });

      await updateDoc(doc(db, "users", uid), {
        updatedAt: serverTimestamp(),
      });

      setInitialForm({
        companyName: companyName.trim(),
        ownerFullName: ownerFullName.trim(),
        ownerTitle: ownerTitle.trim(),
        city,
        district,
        categoryId: categoryId || "",
        employeeCount: employeeCount || "",
        about,
        logoUrl: finalLogoUrl || null,
      });

      setSuccessMessage("Profiliniz güncellendi.");
    } catch (err) {
      console.error("Profile update failed:", err);
      setError("Kayıt güncellenemedi. Lütfen tekrar dene.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#036AAF]" aria-hidden />
          <p className="text-sm text-neutral-500">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[#0f2540]">Profilim</h1>
        <button
          type="submit"
          form="profile-form"
          disabled={saveDisabled}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#036AAF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#025a94] disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </button>
      </div>

      {successMessage ? (
        <div
          className="mt-4 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      <div className={`${cardClassName} mt-6`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center text-neutral-400">
                  <Camera className="size-6" strokeWidth={1.5} aria-hidden />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-[#0f2540]">
                {companyName.trim() || "Şirket adınız"}
              </p>
              {categoryLabel ? (
                <p className="mt-1 truncate text-sm text-neutral-600">
                  {categoryLabel}
                </p>
              ) : null}
              <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{locationSummary}</span>
              </p>
              {employeeCountLabel ? (
                <p className="mt-1 text-sm text-neutral-500">
                  {employeeCountLabel} çalışan
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileSelect}
              disabled={isUploadingLogo || isSaving}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo || isSaving}
              className="inline-flex items-center gap-2 rounded-full border border-[#036AAF]/25 bg-white px-4 py-2 text-sm font-semibold text-[#036AAF] transition-colors hover:bg-[#036AAF]/5 disabled:opacity-60"
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Upload className="size-4" aria-hidden />
                  Logoyu Değiştir
                </>
              )}
            </button>
            <p className="text-xs text-neutral-400">
              Önerilen: dikey fotoğraf
            </p>
          </div>
        </div>
      </div>

      <form
        id="profile-form"
        className="mt-6 grid gap-6 lg:grid-cols-2"
        onSubmit={handleSubmit}
        noValidate
      >
        <section className={cardClassName}>
          <h2 className={cardTitleClassName}>Şirket Bilgileri</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className={labelClassName}>
                Şirket Adı
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSaving}
                className={fieldClassName}
                autoComplete="organization"
              />
            </div>

            <div>
              <label htmlFor="categoryId" className={labelClassName}>
                Sektör Kategorisi
              </label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isSaving}
                className={fieldClassName}
              >
                <option value="">Seçiniz</option>
                {JOB_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="employeeCount" className={labelClassName}>
                Çalışan Sayısı
              </label>
              <select
                id="employeeCount"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                disabled={isSaving}
                className={fieldClassName}
              >
                <option value="">Seçiniz</option>
                {EMPLOYEE_COUNTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className={cardClassName}>
          <h2 className={cardTitleClassName}>Yetkili Bilgileri</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="ownerFullName" className={labelClassName}>
                Yetkili Ad Soyad
              </label>
              <input
                id="ownerFullName"
                type="text"
                value={ownerFullName}
                onChange={(e) => {
                  setOwnerFullName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSaving}
                className={fieldClassName}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="ownerTitle" className={labelClassName}>
                Yetkili Ünvanı
              </label>
              <input
                id="ownerTitle"
                type="text"
                value={ownerTitle}
                onChange={(e) => {
                  setOwnerTitle(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSaving}
                className={fieldClassName}
                placeholder="Örn: İnsan Kaynakları Müdürü"
              />
            </div>
          </div>
        </section>

        <section className={cardClassName}>
          <h2 className={cardTitleClassName}>Konum</h2>
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={isLocating || isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#036AAF]/25 bg-[#036AAF]/5 py-2.5 text-sm font-semibold text-[#036AAF] transition-colors hover:bg-[#036AAF]/10 disabled:opacity-60"
            >
              {isLocating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Konum alınıyor...
                </>
              ) : (
                <>
                  <MapPin className="size-4" aria-hidden />
                  Konumumu Kullan
                </>
              )}
            </button>

            {locationHint ? (
              <p className="text-sm text-[#036AAF]">{locationHint}</p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className={labelClassName}>
                  İl
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setDistrict("");
                    setLocationHint(null);
                    if (error) setError(null);
                  }}
                  disabled={isSaving}
                  className={fieldClassName}
                >
                  <option value="">İl seçin</option>
                  {CITY_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="district" className={labelClassName}>
                  İlçe
                </label>
                <select
                  id="district"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setLocationHint(null);
                    if (error) setError(null);
                  }}
                  disabled={isSaving || !city}
                  className={fieldClassName}
                >
                  <option value="">
                    {city ? "İlçe seçin" : "Önce il seçin"}
                  </option>
                  {districts.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className={`${cardClassName} lg:col-span-2`}>
          <h2 className={cardTitleClassName}>Hakkında</h2>
          <div>
            <label htmlFor="about" className="sr-only">
              Hakkında
            </label>
            <textarea
              id="about"
              rows={4}
              placeholder="Şirketinizi kısaca tanıtın"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              disabled={isSaving}
              className={`${fieldClassName} resize-none`}
            />
          </div>
        </section>

        {error ? (
          <p
            className="rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-700 lg:col-span-2"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="lg:col-span-2 lg:hidden">
          <button
            type="submit"
            disabled={saveDisabled}
            className="w-full rounded-full bg-[#036AAF] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#025a94] disabled:pointer-events-none disabled:opacity-50"
          >
            {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </form>

      <section className={`${cardClassName} mt-6`}>
        <h2 className={cardTitleClassName}>Engellenen Kullanıcılar</h2>

        <p className="mb-4 text-sm text-neutral-500">
          Engeli kaldırsanız bile eski sohbetler geri gelmez.
        </p>

        {blocksFeedback ? (
          <p
            className="mb-4 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700"
            role="status"
          >
            {blocksFeedback}
          </p>
        ) : null}

        {blocksError ? (
          <p
            className="mb-4 rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-700"
            role="alert"
          >
            {blocksError}
          </p>
        ) : null}

        {isLoadingBlocks ? (
          <div className="flex items-center gap-2 py-4 text-sm text-neutral-500">
            <Loader2 className="size-4 animate-spin text-[#036AAF]" />
            Yükleniyor...
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="rounded-xl bg-neutral-50 px-5 py-8 text-center">
            <UserX className="mx-auto size-8 text-neutral-300" />
            <p className="mt-3 text-sm text-neutral-500">
              Engellediğiniz kullanıcı yok
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {blockedUsers.map((blockedUser) => (
              <li
                key={blockedUser.userId}
                className="flex flex-col gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {blockedUser.profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={blockedUser.profilePhotoUrl}
                      alt=""
                      className="size-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#036AAF]/10 text-sm font-bold text-[#036AAF]">
                      {(blockedUser.fullName.trim()[0] ?? "K").toUpperCase()}
                    </div>
                  )}
                  <p className="truncate font-semibold text-[#0f2540]">
                    {blockedUser.fullName}
                  </p>
                </div>

                {unblockTargetId === blockedUser.userId ? (
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <p className="w-full text-xs text-neutral-500 sm:w-auto">
                      Engel kaldırılsın mı?
                    </p>
                    <button
                      type="button"
                      onClick={() => setUnblockTargetId(null)}
                      disabled={isUnblocking}
                      className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-[#0f2540] hover:bg-white disabled:opacity-60"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUnblockUser(blockedUser.userId)}
                      disabled={isUnblocking}
                      className="inline-flex items-center gap-2 rounded-full bg-[#036AAF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#025a94] disabled:opacity-60"
                    >
                      {isUnblocking ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Kaldırılıyor...
                        </>
                      ) : (
                        "Onayla"
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUnblockTargetId(blockedUser.userId)}
                    disabled={isUnblocking}
                    className="self-start rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-[#0f2540] transition-colors hover:bg-neutral-50 disabled:opacity-60 sm:self-auto"
                  >
                    Engeli Kaldır
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {cropImageSrc ? (
        <PhotoCropModal
          imageSrc={cropImageSrc}
          onClose={() => {
            if (cropImageSrc.startsWith("blob:")) {
              URL.revokeObjectURL(cropImageSrc);
            }
            setCropImageSrc(null);
          }}
          onConfirm={handleCropConfirm}
        />
      ) : null}
    </>
  );
}
