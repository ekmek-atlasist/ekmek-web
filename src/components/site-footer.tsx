import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin, Twitter } from "lucide-react";

type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer
      className={`border-t border-white/10 bg-[#1A1A1A] text-white ${className ?? ""}`}
    >
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
            <Image
              src="/ekmek_icon.svg"
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-lg"
            />
            <div className="min-w-0">
              <p className="text-base font-bold tracking-tight">ekmek</p>
              <p className="mt-0.5 text-sm text-white/55">
                İşe giden yolun en kısası.
              </p>
              <p className="mt-1 text-sm text-white/40">
                © 2026 Ekmek. Tüm hakları saklıdır.
              </p>
            </div>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/65"
            aria-label="Yasal"
          >
            <Link
              href="/gizlilik"
              className="transition-colors hover:text-white"
            >
              Gizlilik Politikası
            </Link>
            <Link
              href="/kullanim-kosullari"
              className="transition-colors hover:text-white"
            >
              Kullanım Koşulları
            </Link>
            <Link
              href="/gizlilik"
              className="transition-colors hover:text-white"
            >
              KVKK Aydınlatma Metni
            </Link>
            <Link
              href="/destek"
              className="transition-colors hover:text-white"
            >
              Destek
            </Link>
            <Link
              href="/hesap-silme"
              className="transition-colors hover:text-white"
            >
              Hesap Silme
            </Link>
            <Link
              href="/sss"
              className="transition-colors hover:text-white"
            >
              Sık Sorulan Sorular
            </Link>
            <Link
              href="/guvenli-kullanim"
              className="transition-colors hover:text-white"
            >
              Güvenli Kullanım
            </Link>
            <Link
              href="/topluluk-kurallari"
              className="transition-colors hover:text-white"
            >
              Topluluk Kuralları
            </Link>
          </nav>

          <div className="flex items-center gap-4 md:shrink-0">
            <a
              href="https://www.instagram.com/ekmek.is/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/45 transition-colors hover:text-white"
              aria-label="Instagram — ekmek.is"
            >
              <Instagram className="size-5" strokeWidth={1.75} />
            </a>
            <a
              href="#"
              className="text-white/45 transition-colors hover:text-white"
              aria-label="Twitter"
            >
              <Twitter className="size-5" strokeWidth={1.75} />
            </a>
            <a
              href="#"
              className="text-white/45 transition-colors hover:text-white"
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
