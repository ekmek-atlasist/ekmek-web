import { Shield } from "lucide-react";
import Link from "next/link";

const TIPS = [
  {
    title: "Kişisel bilgileri koruyun",
    body: "Telefon, e-posta veya banka bilgilerinizi ilk mesajda paylaşmaktan kaçının. Resmi süreçleri platform üzerinden yürütün.",
  },
  {
    title: "Şüpheli davranışları bildirin",
    body: "Sahte profil, taciz veya dolandırıcılık şüphesi gördüğünüzde sohbet menüsünden şikayet edin veya Destek sayfasından bize ulaşın.",
  },
  {
    title: "Güvenli iletişim kurun",
    body: "Saygılı ve profesyonel bir dil kullanın. Baskı, tehdit veya ayrımcı ifadeler platform kurallarına aykırıdır.",
  },
  {
    title: "İlan bilgilerini doğru tutun",
    body: "Yanıltıcı maaş, pozisyon veya konum bilgisi vermeyin. Güncel ve şeffaf ilanlar daha kaliteli başvuru getirir.",
  },
  {
    title: "Engelleme ve gizlilik",
    body: "Rahatsız edici bir kullanıcıyı engelleyebilirsiniz. Engelleme sonrası o kişiyle eşleşme ve sohbet kaldırılır.",
  },
  {
    title: "Hesap güvenliği",
    body: "Oturumunuzu paylaşılmış cihazlarda açık bırakmayın. Şüpheli giriş fark ederseniz şifrenizi değiştirin ve destek ekibine yazın.",
  },
] as const;

export default function PanelGuvenliKullanimPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#036AAF]/10 text-[#036AAF]">
          <Shield className="size-6" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0f2540]">
            Güvenli Kullanım İpuçları
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Ekmek&apos;te güvenli ve verimli işe alım için öneriler.
          </p>
        </div>
      </div>

      <ul className="mt-8 space-y-4">
        {TIPS.map((tip) => (
          <li
            key={tip.title}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold text-[#0f2540]">{tip.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {tip.body}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-neutral-500">
        Sorun yaşarsanız{" "}
        <Link
          href="/isveren/panel/destek"
          className="font-medium text-[#036AAF] hover:underline"
        >
          Destek
        </Link>{" "}
        sayfasından bize ulaşabilirsiniz.
      </p>
    </div>
  );
}
