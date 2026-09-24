const ATLAS_URL = "https://www.atlasistanbulteknoloji.com/";

export function AtlasFooterCredit() {
  return (
    <p className="mt-5 text-center text-[10px] leading-relaxed text-white/35 sm:mt-6 sm:text-[11px]">
      Bu uygulama{" "}
      <a
        href={ATLAS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/50 underline-offset-2 transition-colors hover:text-white/70 hover:underline"
      >
        Atlas İstanbul Teknoloji
      </a>{" "}
      ürünüdür.
    </p>
  );
}
