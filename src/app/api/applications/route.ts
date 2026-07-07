import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendApplicationConfirmationToApplicant,
  sendApplicationReceivedToPartner,
} from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: {
    dogId?: string;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Érvénytelen kérés." }, { status: 400 });
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

  const supabase = await createClient();

  // The dog row is the source of truth for the partner — don't trust client-sent partner ids
  const { data: dog, error: dogError } = await supabase
    .from("dogs")
    .select("id, name, partner_id, partner:partners(name, email)")
    .eq("id", dogId)
    .single();

  if (dogError || !dog) {
    return NextResponse.json({ error: "A kutya nem található." }, { status: 404 });
  }

  const { error: insertError } = await supabase.from("adoption_applications").insert({
    dog_id: dog.id,
    partner_id: dog.partner_id,
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
