import type { Metadata } from "next";
import { Tenor_Sans, Golos_Text, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import { AuthProvider } from "@/contexts/AuthContext";


const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const tenorSans = Tenor_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-tenor",
  display: "swap",
});

const golosText = Golos_Text({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-golos",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alignment Retreats",
  description: "A cooperative marketplace connecting retreat hosts, co-hosts, venues, and seekers.",
  icons: {
    icon: "/images/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(tenorSans.variable, golosText.variable, "font-sans", geist.variable)}>
      <body>
        <AuthProvider>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
