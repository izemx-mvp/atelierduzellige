import { forwardRef } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { fmtDate, fmtMoney2, quoteTotals } from "@/lib/store";
import type { Client, Quote } from "@/lib/types";

export const COMPANY = {
  name: "Atelier du Zellige",
  tagline: "Zellige artisanal · Fès, Maroc",
  address: "Quartier des Potiers, Aïn Nokbi — 30000 Fès, Maroc",
  phone: "+212 5 35 00 00 00",
  email: "contact@atelierduzellige.ma",
  web: "www.atelierduzellige.ma",
  legal: "SARL au capital de 500 000 MAD · RC Fès 12345 · ICE 001234567000089 · IF 12345678",
  bank: "IBAN MA64 0111 0000 0000 0012 3456 789 · SWIFT BCMAMAMC",
};

export const QuoteDocument = forwardRef<HTMLDivElement, { quote: Quote; client?: Client }>(function QuoteDocument({ quote, client }, ref) {
  const t = quoteTotals(quote);
  return (
    <div ref={ref} className="mx-auto w-full max-w-[210mm] bg-paper text-ink" style={{ minHeight: "297mm", padding: "16mm 16mm 14mm" }}>
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-ink pb-6">
        <div className="flex items-center gap-4">
          <LogoMark size={56} className="text-gold-print" />
          <div>
            <div className="text-lg font-semibold uppercase tracking-[0.2em]">{COMPANY.name}</div>
            <div className="text-xs text-ink-muted">{COMPANY.tagline}</div>
            <div className="mt-2 text-[11px] leading-relaxed text-ink-muted">{COMPANY.address}<br />{COMPANY.phone} · {COMPANY.email}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.25em] text-gold-print">Devis</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{quote.number}</div>
          <table className="mt-3 ml-auto text-[11px]"><tbody>
            <tr><td className="pr-3 text-ink-muted">Date d'émission</td><td className="font-medium">{fmtDate(quote.createdAt)}</td></tr>
            <tr><td className="pr-3 text-ink-muted">Valable jusqu'au</td><td className="font-medium">{fmtDate(quote.expiresAt)}</td></tr>
            <tr><td className="pr-3 text-ink-muted">Statut</td><td className="font-medium">{quote.status}</td></tr>
          </tbody></table>
        </div>
      </div>

      {/* Client & project */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-print">Client</div>
          <div className="text-sm font-semibold">{client?.company || client?.name}</div>
          <div className="text-xs">{client?.name}</div>
          <div className="mt-2 text-[11px] leading-relaxed text-ink-muted">{client?.address}<br />{client?.city} {client?.country}<br />{client?.email}<br />{client?.phone}</div>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-print">Projet</div>
          <div className="text-sm font-semibold">{quote.projectName}</div>
          <div className="mt-1 text-[11px] leading-relaxed text-ink-muted">{quote.projectDescription || "—"}</div>
          <table className="mt-2 text-[11px]"><tbody>
            <tr><td className="pr-3 text-ink-muted">Type</td><td>{quote.projectType}</td></tr>
            <tr><td className="pr-3 text-ink-muted">Localisation</td><td>{quote.projectLocation || "—"}</td></tr>
          </tbody></table>
        </div>
      </div>

      {/* Lines */}
      <table className="mt-8 w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-ink text-left text-[10px] uppercase tracking-wider text-ink-muted">
            <th className="py-2 pr-2 font-medium">Réf.</th><th className="py-2 pr-2 font-medium">Désignation</th><th className="py-2 pr-2 font-medium">Collection</th><th className="py-2 pr-2 font-medium">Dimensions</th><th className="py-2 pr-2 font-medium">Couleur</th>
            <th className="py-2 pr-2 text-right font-medium">Qté</th><th className="py-2 pr-2 text-right font-medium">P.U. HT</th><th className="py-2 pr-2 text-right font-medium">Remise</th><th className="py-2 text-right font-medium">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.map((l) => (
            <tr key={l.id} className="border-b border-paper-border print-break-avoid">
              <td className="py-2.5 pr-2 font-mono text-[10px]">{l.reference || "—"}</td><td className="py-2.5 pr-2 font-medium">{l.description}</td><td className="py-2.5 pr-2 text-ink-muted">{l.collection || "—"}</td>
              <td className="py-2.5 pr-2 text-ink-muted">{l.dimensions || "—"}</td><td className="py-2.5 pr-2 text-ink-muted">{l.color || "—"}</td>
              <td className="py-2.5 pr-2 text-right">{l.quantity}</td><td className="py-2.5 pr-2 text-right">{fmtMoney2(l.unitPrice)}</td><td className="py-2.5 pr-2 text-right">{l.discount ? `${l.discount} %` : "—"}</td>
              <td className="py-2.5 text-right font-medium">{fmtMoney2(l.quantity * l.unitPrice * (1 - l.discount / 100))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-6 flex justify-end print-break-avoid">
        <table className="w-72 text-[11px]"><tbody>
          <tr><td className="py-1 text-ink-muted">Sous-total HT</td><td className="py-1 text-right">{fmtMoney2(t.subtotal)}</td></tr>
          {t.discount > 0 && <tr><td className="py-1 text-ink-muted">Remise</td><td className="py-1 text-right">- {fmtMoney2(t.discount)}</td></tr>}
          {t.fees > 0 && <tr><td className="py-1 text-ink-muted">Frais (emballage / transport)</td><td className="py-1 text-right">{fmtMoney2(t.fees)}</td></tr>}
          <tr className="border-t border-paper-border"><td className="py-1 font-medium">Total HT</td><td className="py-1 text-right font-medium">{fmtMoney2(t.ht)}</td></tr>
          <tr><td className="py-1 text-ink-muted">TVA ({quote.vatRate} %)</td><td className="py-1 text-right">{fmtMoney2(t.vat)}</td></tr>
          <tr className="border-t-2 border-ink"><td className="py-2 text-sm font-semibold">Total TTC</td><td className="py-2 text-right text-sm font-semibold">{fmtMoney2(t.ttc)}</td></tr>
        </tbody></table>
      </div>

      {/* Terms */}
      <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 text-[11px] print-break-avoid">
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-print">Conditions de paiement</div><p className="mt-1 text-ink-muted">{quote.paymentTerms}</p></div>
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-print">Délais estimatifs</div><p className="mt-1 text-ink-muted">{quote.leadTime}</p></div>
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-print">Conditions de livraison</div><p className="mt-1 text-ink-muted">{quote.deliveryTerms}</p></div>
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-print">Validité</div><p className="mt-1 text-ink-muted">Devis valable jusqu'au {fmtDate(quote.expiresAt)}. Au-delà, les prix et délais sont susceptibles d'être révisés. Produit artisanal : variations de teinte et de dimensions inhérentes au zellige fait main.</p></div>
        {quote.notes && <div className="col-span-2"><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-print">Notes & observations</div><p className="mt-1 whitespace-pre-wrap text-ink-muted">{quote.notes}</p></div>}
      </div>

      {/* Signature */}
      <div className="mt-10 grid grid-cols-2 gap-8 text-[11px] print-break-avoid">
        <div className="rounded-md border border-paper-border p-4"><div className="text-ink-muted">Pour {COMPANY.name}</div><div className="mt-1 font-medium">Houda Bennani — Directrice commerciale</div><div className="mt-8 h-px bg-paper-border" /><div className="mt-1 text-[10px] text-ink-muted">Signature</div></div>
        <div className="rounded-md border border-paper-border p-4"><div className="text-ink-muted">Bon pour accord — le client</div><div className="mt-1 font-medium">{client?.company || client?.name}</div><div className="mt-8 h-px bg-paper-border" /><div className="mt-1 text-[10px] text-ink-muted">Date, cachet et signature précédés de « Bon pour accord »</div></div>
      </div>

      {/* Footer */}
      <div className="mt-10 border-t border-paper-border pt-4 text-center text-[9.5px] leading-relaxed text-ink-muted">
        <div className="font-medium text-ink">{COMPANY.name} · {COMPANY.address}</div>
        <div>{COMPANY.phone} · {COMPANY.email} · {COMPANY.web}</div>
        <div>{COMPANY.legal}</div>
        <div>{COMPANY.bank}</div>
      </div>
    </div>
  );
});
