import Image from "next/image";

export function IskurFooterBadge() {
  return (
    <div className="mt-8 border-t border-white/10 pt-6 sm:mt-10 sm:pt-7">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-2.5 rounded-xl bg-white p-1.5 shadow-sm">
          <Image
            src="/images/iskur-logo.png"
            alt="İŞKUR Özel İstihdam Bürosu"
            width={52}
            height={52}
            className="size-[52px] object-contain"
          />
        </div>
        <p className="text-[11px] font-semibold text-white/75 sm:text-xs">
          İŞKUR Onaylı Özel İstihdam Bürosu
        </p>
        <p className="mt-1.5 max-w-sm text-[10px] leading-relaxed text-white/45 sm:text-[11px]">
          Belge No: 2021 · Tarih: 19/08/2026 · Yasal yetkiye sahip aracılık
          hizmeti
        </p>
      </div>
    </div>
  );
}
