"use client";

import "react-easy-crop/react-easy-crop.css";
import { Camera, Loader2, MapPin, Upload, X, ZoomIn } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { getCroppedImageBlob } from "./crop-image";
import { findNearestDistrict } from "./find-nearest-location";
import { resolveCityCenter } from "@/lib/data/city-centers";
import { EMPLOYEE_COUNTS, JOB_CATEGORIES } from "@/lib/data/job-categories";
import { CITY_NAMES, TURKEY_CITIES } from "@/lib/data/turkey-cities";
import { firestoreIsoNow } from "@/lib/firebase-schema";
import { auth, db, storage } from "@/lib/firebase";

const TOTAL_FIELDS = 8;

const fieldClassName =
  "w-full rounded-2xl border border-neutral-200/80 bg-white/90 px-5 py-3.5 text-base text-[#1a1a1a] shadow-sm outline-none transition-shadow placeholder:text-neutral-400 focus:border-[#036AAF]/40 focus:shadow-[0_0_0_3px_rgba(3,106,175,0.12)] disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "mb-1.5 block text-sm font-medium text-[#1a1a1a]/80";

function fieldFilled(value: string): boolean {
  return value.trim().length > 0;
}

function countFilledFields(form: {
  companyName: string;
  ownerFullName: string;
  ownerTitle: string;
  city: string;
  district: string;
  categoryId: string;
  employeeCount: string;
  about: string;
}): number {
  let count = 0;
  if (fieldFilled(form.companyName)) count++;
  if (fieldFilled(form.ownerFullName)) count++;
  if (fieldFilled(form.ownerTitle)) count++;
  if (fieldFilled(form.city)) count++;
  if (fieldFilled(form.district)) count++;
  if (fieldFilled(form.categoryId)) count++;
  if (fieldFilled(form.employeeCount)) count++;
  if (fieldFilled(form.about)) count++;
  return count;
}

type ProfilePreviewProps = {
  logoPreview: string | null;
  companyName: string;
  city: string;
  district: string;
  categoryLabel: string | null;
};

function ProfilePreviewCard({
  logoPreview,
  companyName,
  city,
  district,
  categoryLabel,
}: ProfilePreviewProps) {
  const locationText =
    city && district ? `${city}, ${district}` : city || "Konum";
  const displayName = companyName.trim() || "Şirket Adı";

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <p className="mb-3 text-center text-xs font-medium tracking-wide text-white/70 uppercase">
        Mobil önizleme
      </p>
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-neutral-300 shadow-[0_24px_48px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
        {logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoPreview}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-200 text-neutral-500">
            <Camera className="size-10" strokeWidth={1.5} aria-hidden />
            <span className="text-sm font-medium">İşletme fotoğrafı</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-5 pt-16 pb-5">
          <p className="text-xl font-bold text-white drop-shadow-sm">
            {displayName}
          </p>
          <p className="mt-1 text-sm text-white/85">{locationText}</p>
          {categoryLabel ? (
            <p className="mt-2 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
              {categoryLabel}
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-4 text-center text-sm leading-relaxed text-white/60">
        Adaylar mobil uygulamada profilini böyle görür.
      </p>
    </div>
  );
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
            Fotoğrafı kırp (3:4)
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

export default function IsverenKayitPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/isveren/giris");
        return;
      }
      setAuthUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

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

  const districts = useMemo(
    () => (city ? (TURKEY_CITIES[city] ?? []) : []),
    [city],
  );

  const categoryLabel = useMemo(() => {
    if (!categoryId) return null;
    return JOB_CATEGORIES.find((c) => c.id === categoryId)?.label ?? null;
  }, [categoryId]);

  const formState = {
    companyName,
    ownerFullName,
    ownerTitle,
    city,
    district,
    categoryId,
    employeeCount,
    about,
  };

  const progressPercent = Math.round(
    (countFilledFields(formState) / TOTAL_FIELDS) * 100,
  );

  const requiredComplete =
    fieldFilled(companyName) &&
    fieldFilled(ownerFullName) &&
    fieldFilled(ownerTitle) &&
    fieldFilled(city) &&
    fieldFilled(district);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seç.");
      return;
    }
    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
  }

  async function handleCropConfirm(blob: Blob) {
    const user = auth.currentUser ?? authUser;
    if (!user) {
      router.replace("/isveren/giris");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const previewUrl = URL.createObjectURL(blob);
      setLogoPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return previewUrl;
      });

      const storageRef = ref(storage, `corporate_logos/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      const downloadUrl = await getDownloadURL(storageRef);
      setLogoUrl(downloadUrl);
      setLogoPreview(downloadUrl);
      setCropImageSrc(null);
    } catch {
      setError("Fotoğraf yüklenemedi. Lütfen tekrar dene.");
      throw new Error("upload failed");
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
        setLocationHint(
          `Konumunuz: ${nearest.city} / ${nearest.district}`,
        );
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

    if (!requiredComplete) {
      setError("Lütfen zorunlu alanları doldur.");
      return;
    }

    const user = auth.currentUser ?? authUser;
    if (!user) {
      router.replace("/isveren/giris");
      return;
    }

    setIsSaving(true);

    try {
      const uid = user.uid;
      const coords = resolveCityCenter(city, district);
      const trimmedAbout = about.trim();
      const nowIso = firestoreIsoNow();

      await setDoc(doc(db, "users", uid), {
        id: uid,
        phoneNumber: user.phoneNumber ?? null,
        userType: "kurumsal",
        subscriptionPlan: "free",
        isActive: true,
        isDeleted: false,
        phoneVisibleToMatches: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: nowIso,
      });

      await setDoc(doc(db, "corporate_profiles", uid), {
        userId: uid,
        companyName: companyName.trim(),
        ownerFullName: ownerFullName.trim(),
        ownerTitle: ownerTitle.trim(),
        city,
        district,
        categoryId: categoryId || "",
        employeeCount: employeeCount || null,
        about: trimmedAbout || null,
        logoUrl: logoUrl || null,
        isCompleted: true,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        createdAt: nowIso,
      });

      const phone = user.phoneNumber;
      if (phone) {
        await setDoc(doc(db, "phoneLookup", phone), {
          uid,
          createdAt: serverTimestamp(),
        });
      }

      router.push("/isveren/panel");
    } catch {
      setError("Kayıt sırasında bir hata oluştu. Lütfen tekrar dene.");
      setIsSaving(false);
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center bg-gradient-to-b from-[#0f2540] via-[#1e4468] to-[#eef2f7] px-6">
        <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-8 py-6 shadow-xl">
          <Loader2 className="size-5 animate-spin text-[#036AAF]" aria-hidden />
          <p className="font-medium text-[#1a1a1a]">Oturum kontrol ediliyor...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-0 flex-1 bg-gradient-to-b from-[#0f2540] via-[#2a5580] to-[#eef2f7] pb-16">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
          <div className="mb-10 lg:mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Şirket Kaydı
            </h1>
            <p className="mt-2 max-w-xl text-base text-white/75">
              Profilini tamamla; adaylar seni mobil uygulamada böyle görecek.
            </p>
          </div>

          <div className="flex flex-col gap-10 lg:grid lg:grid-cols-5 lg:gap-14">
            {/* Önizleme — mobilde üstte */}
            <aside className="order-1 lg:order-2 lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                <ProfilePreviewCard
                  logoPreview={logoPreview}
                  companyName={companyName}
                  city={city}
                  district={district}
                  categoryLabel={categoryLabel}
                />
              </div>
            </aside>

            {/* Form */}
            <div className="order-2 lg:order-1 lg:col-span-3">
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-white/90">
                    Profil tamamlama
                  </span>
                  <span className="font-semibold text-white">
                    %{progressPercent}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-[#036AAF] transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <form className="space-y-10" onSubmit={handleSubmit} noValidate>
                {/* Fotoğraf */}
                <section className="rounded-3xl border border-white/20 bg-white/95 p-6 shadow-lg backdrop-blur-sm lg:p-8">
                  <h2 className="text-lg font-semibold text-[#1a1a1a]">
                    İşletme Fotoğrafı
                  </h2>
                  <p className="mt-1 text-sm text-[#1a1a1a]/60">
                    3:4 dikey oran — mobil kartta tam ekran görünür.
                  </p>

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
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#036AAF]/30 bg-[#036AAF]/5 px-5 py-4 text-sm font-semibold text-[#036AAF] transition-colors hover:border-[#036AAF]/50 hover:bg-[#036AAF]/10 disabled:opacity-60"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Upload className="size-4" aria-hidden />
                        Fotoğraf Ekle
                      </>
                    )}
                  </button>
                </section>

                {/* Zorunlu */}
                <section>
                  <div className="mb-6 flex items-center gap-4">
                    <h2 className="shrink-0 text-lg font-semibold text-white">
                      Zorunlu Bilgiler
                    </h2>
                    <div className="h-px flex-1 bg-white/20" aria-hidden />
                  </div>

                  <div className="space-y-5 rounded-3xl border border-white/20 bg-white/95 p-6 shadow-lg backdrop-blur-sm lg:p-8">
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
                        placeholder="Örn: Ekmek A.Ş."
                      />
                    </div>

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
                        placeholder="Ad Soyad"
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

                    <div className="border-t border-neutral-100 pt-5">
                      <p className={labelClassName}>Konum</p>

                      <button
                        type="button"
                        onClick={handleUseLocation}
                        disabled={isLocating || isSaving}
                        className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#036AAF]/25 bg-[#036AAF]/8 py-3 text-sm font-semibold text-[#036AAF] transition-colors hover:bg-[#036AAF]/12 disabled:opacity-60"
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
                        <p className="mb-4 text-sm text-[#036AAF]">
                          {locationHint}
                        </p>
                      ) : null}

                      <div className="grid gap-5 sm:grid-cols-2">
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
                  </div>
                </section>

                {/* Opsiyonel */}
                <section>
                  <div className="mb-6 flex items-center gap-4">
                    <h2 className="shrink-0 text-lg font-semibold text-white">
                      İsteğe Bağlı
                    </h2>
                    <div className="h-px flex-1 bg-white/20" aria-hidden />
                  </div>
                  <p className="-mt-4 mb-5 text-sm text-white/65">
                    Profilini güçlendirir
                  </p>

                  <div className="space-y-5 rounded-3xl border border-white/20 bg-white/95 p-6 shadow-lg backdrop-blur-sm lg:p-8">
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
                        <option value="">Seçiniz (isteğe bağlı)</option>
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
                        <option value="">Seçiniz (isteğe bağlı)</option>
                        {EMPLOYEE_COUNTS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="about" className={labelClassName}>
                        Hakkında
                      </label>
                      <textarea
                        id="about"
                        rows={4}
                        placeholder="Şirketiniz hakkında kısa bilgi"
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        disabled={isSaving}
                        className={`${fieldClassName} resize-none`}
                      />
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
                  disabled={isSaving || !requiredComplete || isUploadingLogo}
                  className="w-full rounded-full bg-[#036AAF] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#036AAF]/25 transition-all hover:bg-[#025a94] hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
                >
                  {isSaving ? "Kaydediliyor..." : "Kaydı Tamamla"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

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
