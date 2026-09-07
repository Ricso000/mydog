import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendApplicationConfirmationToApplicant,
  sendApplicationReceivedToPartner,
} from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 2000;
// Applications for the same dog by the same identity within this window are
// treated as duplicates unless the earlier one was rejected/withdrawn (a
// person should be able to re-apply after either of those, just not
// spam-resubmit the same pending request) — see docs/implementation/phase-0-1-plan.md Task 1.6.
const DUPLICATE_WINDOW_HOURS = 24;

export async function POST(request: Request) {
  let body: {
    dogId?: string;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    // Honeypot: a real visitor never fills this hidden field in; a scripted
    // submission that fills every field blindly will. Anything but empty
    // here is treated as a bot, and the request is accepted (200) without
    // creating a real row, so the caller gets no signal it was detected.
    website?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Érvénytelen kérés." }, { status: 400 });
  }

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const dogId = body.dogId?.trim();
  const name = body.name?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim() || null;
  const message = body.message?.trim() || null;

  if (!dogId || !name || !email) {
    return NextResponse.json({ error: "Hiányzó kötelező mezők." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Érvénytelen email cím." }, { status: 400 });
  }
  if (message && message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Az üzenet legfeljebb ${MAX_MESSAGE_LENGTH} karakter lehet.` },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The dog row is the source of truth for the partner — don't trust client-sent partner ids
  const { data: dog, error: dogError } = await supabase
    .from("dogs")
    .select("id, name, partner_id, partner:partners(name, email)")
    .eq("id", dogId)
    .single();

  if (dogError || !dog) {
    return NextResponse.json({ error: "A kutya nem található." }, { status: 404 });
  }

  // RLS correctly prevents a plain SELECT here from seeing other applicants'
  // rows (see docs/implementation/phase-0-1-plan.md Task 1.6 for the bug this
  // caused when first implemented as a direct table query) — this narrow
  // security-definer function answers only the boolean the route needs.
  const { data: isDuplicate, error: duplicateError } = await supabase.rpc("has_recent_pending_application", {
    p_dog_id: dogId,
    p_email: email,
    p_window_hours: DUPLICATE_WINDOW_HOURS,
  });

  if (duplicateError) {
    console.error("[applications] duplicate-check error:", duplicateError);
    return NextResponse.json({ error: "Hiba történt a mentés során." }, { status: 500 });
  }
  if (isDuplicate) {
    return NextResponse.json(
      { error: "Már beküldtél egy jelentkezést erre a kutyára, hamarosan jelentkezik a menhely." },
      { status: 409 }
    );
  }

  const { error: insertError } = await supabase.from("adoption_applications").insert({
    dog_id: dog.id,
    partner_id: dog.partner_id,
    applicant_id: user?.id ?? null,
    contact_name: name,
    contact_email: email,
    contact_phone: phone,
    message,
    status: "submitted",
  });

  if (insertError) {
    console.error("[applications] insert error:", insertError);
    return NextResponse.json({ error: "Hiba történt a mentés során." }, { status: 500 });
  }

  const partner = Array.isArray(dog.partner) ? dog.partner[0] : dog.partner;

  // Email sending must not fail the submission — errors are logged inside the helpers
  const emailJobs: Promise<void>[] = [
    sendApplicationConfirmationToApplicant({
      applicantEmail: email,
      applicantName: name,
      dogName: dog.name,
      partnerName: partner?.name ?? "menhely",
    }),
  ];
  if (partner?.email) {
    emailJobs.push(
      sendApplicationReceivedToPartner({
        partnerEmail: partner.email,
        partnerName: partner.name,
        dogName: dog.name,
        dogId: dog.id,
        applicantName: name,
        applicantEmail: email,
        applicantPhone: phone,
        message,
      })
    );
  }
  await Promise.allSettled(emailJobs);

  return NextResponse.json({ ok: true });
}
