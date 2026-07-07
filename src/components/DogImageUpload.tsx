"use client";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  partnerId: string | null;
  value: string;
  onChange: (url: string) => void;
}

export function DogImageUpload({ partnerId, value, onChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (!partnerId) {
      setError("Partner azonosító nem található, próbáld újra később.");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Csak JPG, PNG vagy WebP kép tölthető fel.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`A kép mérete legfeljebb ${MAX_SIZE_MB} MB lehet.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${partnerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("dog-images")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setError("Feltöltési hiba: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("dog-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Kutya fotó előnézet"
          className="w-full h-48 object-cover rounded-xl border border-[#E2E8F0] mb-3"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 border-2 border-dashed border-[#CBD5E0] hover:border-[#3D7A3D] text-[#4A5568] hover:text-[#1A3D2B] font-semibold px-5 py-3 rounded-xl transition-colors text-sm disabled:opacity-60"
        >
          {uploading ? "Feltöltés..." : "📷 Fotó feltöltése"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-red-600 hover:underline text-left"
          >
            Fotó eltávolítása
          </button>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFile}
        className="hidden"
      />
      <p className="text-xs text-[#4A5568] mt-2">JPG, PNG vagy WebP, legfeljebb {MAX_SIZE_MB} MB.</p>

      <details className="mt-2">
        <summary className="text-xs text-[#4A5568] cursor-pointer hover:text-[#1A3D2B]">Vagy megadás URL-ként</summary>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="mt-2 w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent"
        />
      </details>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
