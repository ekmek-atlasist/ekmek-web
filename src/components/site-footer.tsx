import Image from "next/image";
import { Instagram, Linkedin, Twitter } from "lucide-react";

const legalLinkClass =
  "block text-sm text-white/70 transition-colors hover:text-white";

type SiteFooterProps = {
  compact?: boolean;
  className?: string;
};

export function SiteFooter({ compact, className }: SiteFooterProps) {
  const outerPad = compact
    ? "px-6 py-10 md:px-10 md:py-12"
    : "px-6 py-16 md:px-12";

  return (
    <footer className={`bg-[#1A1A1A] text-white ${className ?? ""}`}>
      <div className={`mx-auto max-w-7xl ${outerPad}`}>
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between md:gap-16 lg:gap-20">
          <div className="flex min-w-0 flex-col items-start gap-3">
            <div className="flex items-center gap-3">
              <Image
                src="/ekmek_icon.svg"
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
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              İşe giden yolun en kısası.
              <br />
              Yakında Sizlerle...
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start md:items-end">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
              YASAL
            </h3>
            <nav
              className="mt-3 flex w-full flex-col space-y-3 md:items-end"
              aria-label="Yasal"
            >
              <a href="#" className={`${legalLinkClass} text-left md:text-right`}>
                Gizlilik Politikası
              </a>
              <a href="#" className={`${legalLinkClass} text-left md:text-right`}>
                Kullanım Koşulları
              </a>
              <a href="#" className={`${legalLinkClass} text-left md:text-right`}>
                KVKK Aydınlatma Metni
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 md:mt-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-white/40">
              © 2026 Ekmek. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/ekmek.is/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 transition-colors hover:text-white"
                aria-label="Instagram — ekmek.is"
              >
                <Instagram className="size-5" strokeWidth={1.75} />
              </a>
              <a
                href="#"
                className="text-white/40 transition-colors hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="size-5" strokeWidth={1.75} />
              </a>
              <a
                href="#"
                className="text-white/40 transition-colors hover:text-white"
                aria-label="LinkedIn"
              >
                <Linkedin className="size-5" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
