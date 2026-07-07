import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "MyDog <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rescueconnect-nu.vercel.app";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY nincs beállítva – email küldés kihagyva.");
    return null;
  }
  return new Resend(key);
}

async function send(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) return;
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[email] Küldési hiba:", error);
  }
}

// User-supplied strings must be escaped before interpolating into email HTML
function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function layout(body: string) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1C1C1C;">
    <div style="font-size: 20px; font-weight: bold; color: #1A3D2B; margin-bottom: 24px;">🐾 MyDog</div>
    ${body}
    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0 16px;" />
    <p style="font-size: 12px; color: #6B7280;">Ezt az emailt a MyDog platform küldte. <a href="${SITE_URL}" style="color: #1A3D2B;">${SITE_URL.replace("https://", "")}</a></p>
  </div>`;
}

export async function sendApplicationReceivedToPartner(opts: {
  partnerEmail: string;
  partnerName: string;
  dogName: string;
  dogId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  message: string | null;
}) {
  const html = layout(`
    <h1 style="font-size: 18px;">Új örökbefogadási jelentkezés érkezett!</h1>
    <p>Kedves ${esc(opts.partnerName)}!</p>
    <p><strong>${esc(opts.applicantName)}</strong> jelentkezett <strong>${esc(opts.dogName)}</strong> örökbefogadására.</p>
    <table style="font-size: 14px; margin: 16px 0; border-collapse: collapse;">
      <tr><td style="padding: 4px 12px 4px 0; color: #6B7280;">Név:</td><td>${esc(opts.applicantName)}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; color: #6B7280;">Email:</td><td><a href="mailto:${esc(opts.applicantEmail)}">${esc(opts.applicantEmail)}</a></td></tr>
      ${opts.applicantPhone ? `<tr><td style="padding: 4px 12px 4px 0; color: #6B7280;">Telefon:</td><td>${esc(opts.applicantPhone)}</td></tr>` : ""}
    </table>
    ${opts.message ? `<p style="background: #F7F8F5; border-radius: 12px; padding: 16px; font-size: 14px;">${esc(opts.message)}</p>` : ""}
    <p><a href="${SITE_URL}/kutyak/${opts.dogId}" style="display: inline-block; background: #1A3D2B; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; margin-top: 8px;">Kutya adatlapja</a></p>
    <p style="font-size: 14px; color: #4A5568;">Kérjük, vedd fel a kapcsolatot a jelentkezővel a fenti elérhetőségeken.</p>
  `);
  await send(opts.partnerEmail, `Új jelentkezés: ${opts.dogName} 🐾`, html);
}

export async function sendApplicationConfirmationToApplicant(opts: {
  applicantEmail: string;
  applicantName: string;
  dogName: string;
  partnerName: string;
}) {
  const html = layout(`
    <h1 style="font-size: 18px;">Jelentkezésed megérkezett! 🎉</h1>
    <p>Kedves ${esc(opts.applicantName)}!</p>
    <p>Köszönjük, hogy jelentkeztél <strong>${esc(opts.dogName)}</strong> örökbefogadására. Jelentkezésedet továbbítottuk a(z) <strong>${esc(opts.partnerName)}</strong> részére, akik hamarosan felveszik veled a kapcsolatot.</p>
    <p style="font-size: 14px; color: #4A5568;">Addig is böngészd bátran a többi gazdikeresőt az oldalunkon!</p>
    <p><a href="${SITE_URL}/kutyak" style="display: inline-block; background: #1A3D2B; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; margin-top: 8px;">Kutyák böngészése</a></p>
  `);
  await send(opts.applicantEmail, `Jelentkezésed megérkezett – ${opts.dogName} 🐾`, html);
}
