import Image from "next/image";
import { Instagram, Linkedin, Twitter } from "lucide-react";

const linkClass =
  "block text-sm text-white/60 transition-colors hover:text-white";

type SiteFooterProps = {
  compact?: boolean;
  className?: string;
};

export function SiteFooter({ compact, className }: SiteFooterProps) {
  const innerPad = compact ? "py-6 px-6 md:px-8" : "py-[60px] px-10";
  const gridGap = compact ? "gap-6 lg:gap-8" : "gap-10 lg:gap-12";
  const headingMb = compact ? "mb-2" : "mb-4";
  const navGap = compact ? "gap-2" : "gap-3";
  const bottomWrap = compact
    ? "mt-6 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"
    : "mt-12 flex flex-col gap-6 border-t border-white/10 pt-10 sm:flex-row sm:items-center sm:justify-between";

  return (
    <footer className={`bg-[#1A1A1A] text-white ${className ?? ""}`}>
      <div className={`mx-auto max-w-7xl ${innerPad}`}>
        <div className={`grid grid-cols-1 lg:grid-cols-4 ${gridGap}`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Image
                src="/ekmek_icon.png"
                alt=""
                width={compact ? 40 : 48}
                height={compact ? 40 : 48}
                className={compact ? "size-10 rounded-lg" : "size-12 rounded-lg"}
              />
              <span
                className={
                  compact
                    ? "text-xl font-bold tracking-tight"
                    : "text-2xl font-bold tracking-tight"
                }
              >
                ekmek
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
            İşe giden yolun en kısası. <br/> Ekmek, iş arayanlarla işverenleri <br/> saniyeler içinde buluşturur.
            </p>
          </div>

          <div>
            <h3 className={`text-sm font-semibold text-white ${headingMb}`}>
              Ürün
            </h3>
            <nav className={`flex flex-col ${navGap}`} aria-label="Ürün">
              <a href="#" className={linkClass}>
                Özellikler
              </a>
              <a href="#" className={linkClass}>
                Nasıl Çalışır
              </a>
              <a href="#" className={linkClass}>
                Sık Sorulan Sorular
              </a>
            </nav>
          </div>

          <div>
            <h3 className={`text-sm font-semibold text-white ${headingMb}`}>
              Şirket
            </h3>
            <nav className={`flex flex-col ${navGap}`} aria-label="Şirket">
              <a href="#" className={linkClass}>
                Hakkımızda
              </a>
              <a href="#" className={linkClass}>
                İletişim
              </a>
              <a href="#" className={linkClass}>
                Kariyer
              </a>
            </nav>
          </div>

          <div>
            <h3 className={`text-sm font-semibold text-white ${headingMb}`}>
              Yasal
            </h3>
            <nav className={`flex flex-col ${navGap}`} aria-label="Yasal">
              <a href="#" className={linkClass}>
                Gizlilik Politikası
              </a>
              <a href="#" className={linkClass}>
                Kullanım Koşulları
              </a>
              <a href="#" className={linkClass}>
                KVKK Aydınlatma Metni
              </a>
            </nav>
          </div>
        </div>

        <div className={bottomWrap}>
          <p className="text-sm text-white/50">
            © 2026 Ekmek. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="text-white/60 transition-colors hover:text-white"
              aria-label="Instagram"
            >
              <Instagram className="size-5" strokeWidth={1.75} />
            </a>
            <a
              href="#"
              className="text-white/60 transition-colors hover:text-white"
              aria-label="Twitter"
            >
              <Twitter className="size-5" strokeWidth={1.75} />
            </a>
            <a
              href="#"
              className="text-white/60 transition-colors hover:text-white"
              aria-label="LinkedIn"
            >
              <Linkedin className="size-5" strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
