import {
  ArrowRight,
  Briefcase,
  Heart,
  MessageCircle,
  Monitor,
  Smartphone,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { FadeInSection } from "./fade-in-section";

const jobSeekerSteps = [
  {
    title: "Profilini dakikalar içinde tamamla",
    description:
      "Deneyimini, hedef pozisyonunu ve konumunu ekle. Gerisini Ekmek senin için düzenler.",
    icon: UserCheck,
  },
  {
    title: "Sana uygun ilanları keşfet",
    description:
      "Beğendiğin işleri kaydır, ilgini çekmeyeni geç — karmaşık formlar yok, sadece hız.",
    icon: Heart,
  },
  {
    title: "Eşleş, anında konuşmaya başla",
    description:
      "İşveren de seni beğendiğinde eşleşirsin; mesajlaş ve süreci birlikte ilerlet.",
    icon: MessageCircle,
  },
];

const employerSteps = [
  {
    title: "İlanını birkaç adımda yayınla",
    description:
      "Pozisyonu, maaşı ve konumu belirle. İlanın onaylandığında adaylara görünür.",
    icon: Briefcase,
  },
  {
    title: "Başvuruları akıllıca değerlendir",
    description:
      "Gelen adayları filtrele, profilleri incele; sana en uygun eşleşmeleri öne çıkar.",
    icon: Monitor,
  },
  {
    title: "Beğen, eşleş, iletişime geç",
    description:
      "Doğru adayı onayla ve anında mesajlaş — telefon ve e-posta aramaya gerek kalmadan.",
    icon: MessageCircle,
  },
];

type Step = (typeof jobSeekerSteps)[number];

function StepItem({
  index,
  title,
  description,
  icon: Icon,
  accent,
  isLast,
}: Step & {
  index: number;
  accent: "seeker" | "employer";
  isLast: boolean;
}) {
  const accentStyles =
    accent === "seeker"
      ? {
          badge: "bg-[#036AAF] shadow-[0_8px_24px_rgba(3,106,175,0.35)]",
          icon: "bg-[#036AAF]/10 text-[#036AAF] ring-[#036AAF]/15",
          line: "from-[#036AAF]/30",
        }
      : {
          badge: "bg-[#0f2540] shadow-[0_8px_24px_rgba(15,37,64,0.25)]",
          icon: "bg-[#0f2540]/8 text-[#0f2540] ring-[#0f2540]/10",
          line: "from-[#0f2540]/20",
        };

  return (
    <div className="relative flex gap-5 pb-8 last:pb-0">
      {!isLast ? (
        <div
          className={`absolute left-[1.375rem] top-12 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b ${accentStyles.line} to-transparent`}
          aria-hidden
        />
      ) : null}

      <div className="relative z-[1] flex shrink-0 flex-col items-center">
        <span
          className={`flex size-11 items-center justify-center rounded-2xl text-sm font-bold text-white ${accentStyles.badge}`}
        >
          {index}
        </span>
      </div>

      <div className="group min-w-0 flex-1 rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_4px_24px_rgba(15,37,64,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,37,64,0.1)] sm:p-6">
        <div className="flex items-start gap-4">
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${accentStyles.icon}`}
          >
            <Icon className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <h4 className="text-base font-bold leading-snug text-[#0f2540] sm:text-[1.05rem]">
              {title}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-[#1a1a1a]/60 sm:text-[0.9375rem]">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AudiencePanel({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  steps,
  accent,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: typeof Smartphone;
  steps: Step[];
  accent: "seeker" | "employer";
}) {
  const panelStyles =
    accent === "seeker"
      ? "from-[#036AAF]/[0.07] via-white to-[#eef6fc]"
      : "from-[#0f2540]/[0.04] via-white to-[#f4f6f9]";

  const headerIconStyles =
    accent === "seeker"
      ? "bg-[#036AAF] text-white shadow-[0_10px_30px_rgba(3,106,175,0.3)]"
      : "bg-[#0f2540] text-white shadow-[0_10px_30px_rgba(15,37,64,0.2)]";

  return (
    <article
      className={`relative overflow-hidden rounded-[2rem] border border-neutral-200/60 bg-gradient-to-br ${panelStyles} p-6 sm:p-8 lg:p-10`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#036AAF]/5 blur-3xl"
        aria-hidden
      />

      <header className="relative mb-8 sm:mb-10">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex size-12 items-center justify-center rounded-2xl ${headerIconStyles}`}
          >
            <Icon className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#036AAF] ring-1 ring-[#036AAF]/10">
            {eyebrow}
          </span>
        </div>
        <h3 className="mt-5 text-2xl font-black tracking-tight text-[#0f2540] sm:text-3xl">
          {title}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#1a1a1a]/55 sm:text-base">
          {subtitle}
        </p>
      </header>

      <div className="relative">
        {steps.map((step, index) => (
          <StepItem
            key={step.title}
            index={index + 1}
            accent={accent}
            isLast={index === steps.length - 1}
            {...step}
          />
        ))}
      </div>
    </article>
  );
}

export function LandingHowItWorks() {
  return (
    <section
      id="nasil-calisir"
      className="relative scroll-mt-[72px] overflow-hidden bg-[#fafbfc] px-6 py-20 md:px-10 md:py-28"
      aria-labelledby="nasil-calisir-baslik"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(3,106,175,0.08),transparent)]"
        aria-hidden
      />

      <FadeInSection className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#036AAF] shadow-sm ring-1 ring-[#036AAF]/10">
            <Sparkles className="size-3.5" aria-hidden />
            Basit ve hızlı
          </span>
          <h2
            id="nasil-calisir-baslik"
            className="mt-5 text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
          >
            Nasıl çalışır?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#1a1a1a]/55 sm:text-lg">
            İster iş arıyor ol, ister eleman — Ekmek&apos;te süreç aynı derecede
            net: profil, eşleşme, mesaj. Hepsi birkaç adımda.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:mt-16 lg:grid-cols-2 lg:gap-10">
          <AudiencePanel
            eyebrow="Mobil uygulama"
            title="İş arayanlar için"
            subtitle="Telefonundan kayıt ol, profilini oluştur ve sana uygun ilanları keşfet."
            icon={Smartphone}
            steps={jobSeekerSteps}
            accent="seeker"
          />
          <AudiencePanel
            eyebrow="Web panel"
            title="İşverenler için"
            subtitle="Bilgisayarından ilanını yayınla, adayları değerlendir ve doğru kişiyle hemen konuş."
            icon={Monitor}
            steps={employerSteps}
            accent="employer"
          />
        </div>

        <p className="mx-auto mt-12 flex max-w-lg items-center justify-center gap-2 text-center text-sm text-[#1a1a1a]/45">
          <ArrowRight className="size-4 shrink-0 text-[#036AAF]/60" aria-hidden />
          Kayıt ücretsiz · Dakikalar içinde başla
        </p>
      </FadeInSection>
    </section>
  );
}
