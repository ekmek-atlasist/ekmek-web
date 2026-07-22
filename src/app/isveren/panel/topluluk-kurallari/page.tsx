import { Users } from "lucide-react";

const RULES = [
  {
    title: "Saygılı iletişim",
    body: "Tüm kullanıcılara karşı nazik, profesyonel ve ayrımcılık içermeyen bir dil kullanın. Hakaret, tehdit ve taciz kesinlikle yasaktır.",
  },
  {
    title: "Doğru ve şeffaf ilanlar",
    body: "İlan başlığı, pozisyon, konum ve ücret bilgileri gerçeği yansıtmalıdır. Yanıltıcı veya eksik ilanlar yayından kaldırılabilir.",
  },
  {
    title: "Sahte profil ve spam yasağı",
    body: "Başkası adına hesap açmak, sahte kimlik kullanmak veya tekrarlayan istenmeyen mesaj göndermek yasaktır.",
  },
  {
    title: "Gizlilik ve veri koruma",
    body: "Adayların kişisel verilerini yalnızca işe alım süreci için kullanın. İzinsiz paylaşım KVKK ve platform kurallarına aykırıdır.",
  },
  {
    title: "Platform dışına yönlendirme",
    body: "Adayları kötü niyetli sitelere yönlendirmek, dolandırıcılık girişiminde bulunmak veya yasa dışı faaliyet teklif etmek yasaktır.",
  },
  {
    title: "İhlal durumunda yaptırımlar",
    body: "Kurallara aykırı davranışlar uyarı, ilan kısıtlaması veya hesap askıya alma ile sonuçlanabilir. Tekrarlayan ihlaller kalıcı kapatmaya gidebilir.",
  },
] as const;

export default function PanelToplulukKurallariPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#036AAF]/10 text-[#036AAF]">
          <Users className="size-6" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0f2540]">
            Topluluk Kuralları
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Ekmek topluluğunda herkes için adil ve güvenli bir ortam.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {RULES.map((rule, index) => (
          <section
            key={rule.title}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#036AAF]">
              {index + 1}. kural
            </p>
            <h2 className="mt-1 font-semibold text-[#0f2540]">{rule.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {rule.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
