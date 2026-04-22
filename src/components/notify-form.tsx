"use client";

export function NotifyForm() {
  return (
    <form
      className="mt-6 flex w-full max-w-2xl flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-center md:mt-10"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <label htmlFor="notify-email" className="sr-only">
        E-posta
      </label>
      <input
        id="notify-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="ornek@email.com"
        className="w-full max-w-md min-w-0 rounded-full border-0 bg-white px-5 py-3 text-base text-[#1A1A1A] shadow-sm outline-none ring-2 ring-transparent placeholder:text-neutral-400 focus:ring-white/40 sm:flex-1 md:px-6 md:py-3.5"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-black px-6 py-3 text-base font-semibold text-white shadow-sm transition-transform duration-200 hover:scale-[1.03] active:scale-[0.99] md:px-8 md:py-3.5"
      >
        Haberdar Et
      </button>
    </form>
  );
}
