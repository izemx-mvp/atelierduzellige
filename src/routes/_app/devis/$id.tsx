import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Printer, Download, Copy, Send, ShoppingCart, ChevronDown, FileText, Loader2, Trash2 } from "lucide-react";
import { useStore, useHydrated, fmtDate } from "@/lib/store";
import { QUOTE_STATUSES, type QuoteStatus } from "@/lib/types";
import { LoadingBlock, StatusBadge, ConfirmDialog, EmptyState } from "@/components/shared";
import { QuoteDialog } from "@/components/quotes/QuoteDialog";
import { QuoteDocument } from "@/components/quotes/QuoteDocument";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_app/devis/$id")({
  head: () => ({ meta: [{ title: "Détail du devis — Atelier du Zellige" }, { name: "description", content: "Aperçu professionnel du devis, impression et téléchargement PDF." }, { property: "og:title", content: "Détail du devis — Atelier du Zellige" }, { property: "og:description", content: "Document commercial prêt à être envoyé." }] }),
  component: QuoteDetail,
});

function QuoteDetail() {
  const { id } = Route.useParams();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const s = useStore();
  const quote = s.quotes.find((q) => q.id === id);
  const client = s.clients.find((c) => c.id === quote?.clientId);
  const docRef = useRef<HTMLDivElement>(null);
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [orderPrompt, setOrderPrompt] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  if (!hydrated) return <LoadingBlock />;
  if (!quote) return <EmptyState icon={FileText} title="Devis introuvable" description="Ce devis n'existe pas ou a été supprimé." action={<Button asChild variant="outline"><Link to="/devis"><ArrowLeft className="h-4 w-4" /> Retour aux devis</Link></Button>} />;

  const setSt = (st: QuoteStatus) => { s.setQuoteStatus(quote.id, st); toast.success(`Statut : ${st}.`); if (st === "Validé" && !quote.orderId) setOrderPrompt(true); };
  const send = () => { s.setQuoteStatus(quote.id, "Envoyé"); s.addMessage({ direction: "out", channel: "Email", contactType: "client", contactId: quote.clientId, fromName: s.settings.profile.name, fromEmail: s.settings.profile.email, subject: `Devis ${quote.number} — ${quote.projectName}`, body: `Bonjour ${client?.name ?? ""},\n\nVeuillez trouver ci-joint notre devis ${quote.number} pour le projet « ${quote.projectName} », valable jusqu'au ${fmtDate(quote.expiresAt)}.\n\nBien cordialement,\n${s.settings.profile.name}` }); toast.success(`Devis envoyé (simulé) à ${client?.email ?? "client"}.`); };
  const dup = () => { const n = s.duplicateQuote(quote.id); if (n) { toast.success(`Devis dupliqué : ${n.number}.`); navigate({ to: "/devis/$id", params: { id: n.id } }); } };
  const createOrder = () => { const o = s.createOrderFromQuote(quote.id); setOrderPrompt(false); if (o) toast.success(`Commande ${o.number} créée.`, { action: { label: "Ouvrir", onClick: () => navigate({ to: "/commandes/$id", params: { id: o.id } }) } }); };
  const print = () => { s.log({ agent: "Utilisateur", action: "Impression devis", target: quote.number, result: "Ouverture de l'impression", status: "Succès", link: `/devis/${quote.id}` }); window.print(); };
  const downloadPdf = async () => {
    if (!docRef.current) return;
    setPdfLoading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
      const el = docRef.current;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", windowWidth: el.scrollWidth });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pw = 210, ph = 297;
      const imgW = pw; const imgH = (canvas.height * imgW) / canvas.width;
      const pageCanvasH = Math.floor((ph / imgH) * canvas.height);
      let y = 0; let first = true;
      while (y < canvas.height) {
        const slice = document.createElement("canvas"); slice.width = canvas.width; slice.height = Math.min(pageCanvasH, canvas.height - y);
        const ctx = slice.getContext("2d")!; ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, y, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        if (!first) pdf.addPage(); first = false;
        pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, imgW, (slice.height * imgW) / canvas.width);
        y += pageCanvasH;
      }
      pdf.save(`Devis-${quote.number}.pdf`);
      s.log({ agent: "Utilisateur", action: "Téléchargement PDF", target: quote.number, result: `Devis-${quote.number}.pdf`, status: "Succès", link: `/devis/${quote.id}` });
      toast.success("PDF téléchargé avec succès.");
    } catch (e) {
      console.error(e);
      toast.error("Impossible de générer le PDF. Veuillez réessayer.");
    } finally { setPdfLoading(false); }
  };

  return (
    <div>
      <div className="print-hidden sticky top-16 z-20 -mx-4 mb-6 border-b bg-background/85 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild><Link to="/devis"><ArrowLeft className="h-4 w-4" /> Retour à la liste des devis</Link></Button>
          <div className="ml-2 flex items-center gap-2"><span className="font-semibold">{quote.number}</span><StatusBadge status={quote.status} />{quote.orderId && <Link to="/commandes/$id" params={{ id: quote.orderId }} className="text-xs text-gold hover:underline">Commande associée →</Link>}</div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Modifier</Button>
          <Button variant="outline" size="sm" onClick={dup}><Copy className="h-4 w-4" /> Dupliquer</Button>
          <Button variant="outline" size="sm" onClick={send} disabled={["Validé", "Refusé"].includes(quote.status)}><Send className="h-4 w-4" /> Envoyer</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Statut <ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">{QUOTE_STATUSES.map((st) => <DropdownMenuItem key={st} disabled={st === quote.status} onClick={() => setSt(st)}>{st}</DropdownMenuItem>)}</DropdownMenuContent>
          </DropdownMenu>
          {quote.status === "Validé" && !quote.orderId && <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setOrderPrompt(true)}><ShoppingCart className="h-4 w-4" /> Créer la commande</Button>}
          <Button variant="outline" size="sm" onClick={print}><Printer className="h-4 w-4" /> Imprimer</Button>
          <Button size="sm" className="bg-charcoal text-charcoal-foreground hover:bg-charcoal/90" onClick={downloadPdf} disabled={pdfLoading}>{pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Télécharger le PDF</Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDel(true)} aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {quote.status === "Validé" && !quote.orderId && (
        <div className="print-hidden mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 rounded-md border border-gold/40 bg-gold-soft px-4 py-3 text-sm">
          <span>Ce devis a été validé. Voulez-vous créer une commande à partir de ce devis ?</span>
          <div className="flex gap-2"><Button size="sm" variant="ghost">Plus tard</Button><Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={createOrder}>Créer la commande</Button></div>
        </div>
      )}

      <div className="mx-auto max-w-[210mm] shadow-elevated print:shadow-none"><QuoteDocument ref={docRef} quote={quote} client={client} /></div>

      <QuoteDialog open={edit} onOpenChange={setEdit} quote={quote} />
      <ConfirmDialog open={del} onOpenChange={setDel} title={`Supprimer le devis ${quote.number} ?`} onConfirm={() => { s.deleteQuote(quote.id); toast.success("Élément supprimé."); navigate({ to: "/devis" }); }} />
      <ConfirmDialog open={orderPrompt} onOpenChange={setOrderPrompt} destructive={false} confirmLabel="Créer la commande" title="Ce devis a été validé." description="Voulez-vous créer une commande à partir de ce devis ? Client, projet, produits, quantités, prix, montants et informations de livraison seront repris." onConfirm={createOrder} />
    </div>
  );
}
