import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import ScrollButtons from "@/components/ScrollButtons";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ememora",
  description: "Plataforma de estudos com flashcards e quizzes",
  icons: { icon: "/icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-[#121212] min-h-screen`}>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <ScrollButtons />
        </Providers>
      </body>
    </html>
  );
}
