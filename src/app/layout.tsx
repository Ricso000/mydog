import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyDog – Együtt egy jobb életért minden kutyának",
  description:
    "Nemzetközi platform örökbefogadáshoz, menhelyekhez, fajtamentőkhöz, állatorvosokhoz és kutyás szolgáltatókhoz. Európa szerte. Egy közösség. Egy küldetés.",
  keywords: [
    "kutya örökbefogadás",
    "menhely",
    "fajtamentő",
    "állatorvos",
    "kutyabarát helyek",
    "kutya mentés",
    "mydog",
  ],
  openGraph: {
    type: "website",
    locale: "hu_HU",
    url: "https://mydog.vercel.app",
    siteName: "MyDog",
    title: "MyDog – Együtt egy jobb életért minden kutyának",
    description:
      "Örökbefogadás · Menhelyek · Állatorvosok · Kutyabarát helyek. Európa szerte. Egy közösség. Egy küldetés.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyDog – Együtt egy jobb életért minden kutyának",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyDog – Együtt egy jobb életért minden kutyának",
    description:
      "Örökbefogadás · Menhelyek · Állatorvosok · Kutyabarát helyek. Európa szerte. Egy közösség. Egy küldetés.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hu"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#1C1C1C]">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
