import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "@/components/ContactForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: dog } = await supabase
    .from("dogs")
    .select("name")
    .eq("id", id)
    .single();
  if (!dog) return { title: "Kutya nem található – MyDog" };
  return { title: `Kapcsolatfelvétel – ${dog.name} | MyDog` };
}

export default async function KapcsolatPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: dog } = await supabase
    .from("dogs")
    .select("id, name, breed, primary_image_url, partner:partners(id, name, email, phone)")
    .eq("id", id)
    .single();

  if (!dog) notFound();

  const partner = Array.isArray(dog.partner) ? dog.partner[0] : dog.partner;

  return (
    <div className="min-h-screen bg-[#F7F8F5] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/kutyak/${id}`}
          className="text-sm text-[#4A5568] hover:text-[#1A3D2B] mb-6 inline-block"
        >
          ← Vissza {dog.name} profiljához
        </Link>
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8">
          <h1 className="text-2xl font-bold text-[#1C1C1C] mb-1">Kapcsolatfelvétel</h1>
          <p className="text-[#4A5568] text-sm mb-6">
            {dog.name} ({dog.breed ?? "Keverék"}){partner ? ` – ${partner.name}` : ""}
          </p>
          <ContactForm
            dogId={dog.id}
            partnerId={partner?.id}
            dogName={dog.name}
          />
        </div>
      </div>
    </div>
  );
}
