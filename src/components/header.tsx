"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 flex h-[72px] w-full items-center justify-between border-b border-white/10 px-6 backdrop-blur-xl transition-[background-color] duration-300 ease-out md:px-12 ${
        scrolled ? "bg-[#0f2540]/82" : "bg-[#0f2540]/52"
      }`}
    >
      <div className="flex items-center gap-2">
        <Image
          src="/ekmek_icon.svg"
          alt="ekmek"
          width={56}
          height={56}
          className="size-14 rounded-xl"
          priority
        />
        <span className="text-xl font-bold text-white">ekmek</span>
      </div>

      <a
        href="#notify"
        onClick={(e) => {
          e.preventDefault();
          const hero = document.getElementById("hero");
          const headerH = 72;
          if (hero) {
            const top = hero.offsetTop + hero.offsetHeight - headerH;
            window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
          } else {
            document.getElementById("notify")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }}
        className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0f2540] transition-colors duration-200 hover:bg-neutral-200"
      >
        Haberdar Et
      </a>
    </header>
  );
}
