import type { LegalDocument, LegalDocumentSection } from "@/lib/legal-documents";

function renderParagraphs(text: string, className: string) {
  return text
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={index} className={className}>
        {paragraph}
      </p>
    ));
}

function SectionBlock({ section }: { section: LegalDocumentSection }) {
  return (
    <section className="scroll-mt-24">
      <h2 className="text-xl font-bold tracking-tight text-[#0f2540] sm:text-2xl">
        {section.title}
      </h2>
      <div className="mt-4 space-y-4">
        {renderParagraphs(
          section.body,
          "text-base leading-8 text-[#1a1a1a]/80",
        )}
      </div>
    </section>
  );
}

export function LegalDocumentContent({ document }: { document: LegalDocument }) {
  if (document.format === "sections" && document.sections?.length) {
    return (
      <div className="space-y-10">
        {document.sections.map((section, index) => (
          <SectionBlock key={`${section.title}-${index}`} section={section} />
        ))}
      </div>
    );
  }

  if (document.body?.trim()) {
    return (
      <div className="space-y-4">
        {renderParagraphs(
          document.body,
          "text-base leading-8 text-[#1a1a1a]/80",
        )}
      </div>
    );
  }

  return (
    <p className="text-base leading-8 text-[#1a1a1a]/65">
      Bu dokümanın içeriği henüz eklenmemiş.
    </p>
  );
}
