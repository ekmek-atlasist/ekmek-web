import Image from "next/image";
import { MASCOT_IMAGES } from "@/lib/data/category-icons";

export function LandingFooterMascot() {
  return (
    <div
      className="pointer-events-none relative -mt-6 overflow-hidden bg-[#eef3f8] md:-mt-8"
      aria-hidden
    >
      <div className="mx-auto flex max-w-6xl justify-center px-6 md:px-10">
        <div className="relative h-[8.5rem] w-[min(40vw,13rem)] sm:h-[10rem] sm:w-[15rem] md:h-[12rem] md:w-[17rem]">
          <Image
            src={MASCOT_IMAGES.hero}
            alt=""
            width={480}
            height={560}
            className="absolute inset-x-0 bottom-0 mx-auto h-full w-auto max-w-none object-contain object-bottom drop-shadow-[0_8px_24px_rgba(15,37,64,0.12)]"
            sizes="(max-width: 640px) 42vw, 18rem"
            priority={false}
          />
        </div>
      </div>
    </div>
  );
}
