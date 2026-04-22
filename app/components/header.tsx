import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="shrink-0 border-b border-white/15 bg-[rgb(2,94,158)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <Image
            src="/ekmek_icon.png"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.08] sm:size-11"
            priority
          />
          <span className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            ekmek
          </span>
        </Link>
      </div>
    </header>
  );
}
