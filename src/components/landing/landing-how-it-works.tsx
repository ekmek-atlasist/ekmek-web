import {
  Briefcase,
  Heart,
  MessageCircle,
  Monitor,
  Smartphone,
  UserCheck,
} from "lucide-react";
import { FadeInSection } from "./fade-in-section";

const jobSeekerSteps = [
  {
    title: "Profilini oluştur",
    description: "Deneyimini, pozisyonunu ve konumunu ekle.",
    icon: UserCheck,
  },
  {
    title: "Kaydır, beğen",
    description: "Sana uygun ilanları saniyeler içinde incele.",
    icon: Heart,
  },
  {
    title: "Eşleş ve konuş",
    description: "İşveren seni beğendiğinde doğrudan mesajlaş.",
    icon: MessageCircle,
  },
];

const employerSteps = [
  {
    title: "İlanını yayınla",
    description: "Pozisyonu, maaşı ve konumu belirle.",
    icon: Briefcase,
  },
  {
    title: "Adayları değerlendir",
    description: "Gelen başvuruları filtrele, profilleri incele.",
    icon: Monitor,
  },
  {
    title: "Onayla ve mesajlaş",
    description: "Beğendiğin adayla anında iletişime geç.",
    icon: MessageCircle,
  },
];

function StepCard({
  index,
  title,
  description,
  icon: Icon,
}: {
  index: number;
  title: string;
  description: string;
  icon: typeof UserCheck;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#036AAF] text-xs font-bold text-white">
          {index}
        </span>
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#036AAF]/10 text-[#036AAF]">
          <Icon className="size-5" strokeWidth={2} aria-hidden />
        </span>
      </div>
      <div className="min-w-0 pt-0.5">
        <h4 className="text-base font-bold text-[#0f2540]">{title}</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-[#1a1a1a]/65">
          {description}
        </p>
      </div>
    </div>
  );
}

function AudienceColumn({
  title,
  icon: Icon,
  steps,
}: {
  title: string;
  icon: typeof Smartphone;
  steps: typeof jobSeekerSteps;
}) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-[#f8f9fb] p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-[#036AAF] text-white">
          <Icon className="size-5" strokeWidth={2} aria-hidden />
        </span>
        <h3 className="text-xl font-bold text-[#0f2540] sm:text-2xl">{title}</h3>
      </div>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <StepCard key={step.title} index={index + 1} {...step} />
        ))}
      </div>
    </div>
  );
}

export function LandingHowItWorks() {
  return (
    <section
      id="nasil-calisir"
      className="scroll-mt-[72px] bg-white px-6 py-20 md:px-10 md:py-28"
      aria-labelledby="nasil-calisir-baslik"
    >
      <FadeInSection className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="nasil-calisir-baslik"
            className="text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl lg:text-5xl"
          >
            Nasıl çalışır?
          </h2>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-10">
          <AudienceColumn
            title="İş Arayanlar İçin"
            icon={Smartphone}
            steps={jobSeekerSteps}
          />
          <AudienceColumn
            title="İşverenler İçin"
            icon={Monitor}
            steps={employerSteps}
          />
        </div>
      </FadeInSection>
    </section>
  );
}
