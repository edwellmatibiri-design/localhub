import type { Metadata } from "next";
import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { LegalUpdateGate } from "@/components/LegalUpdateGate";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/app/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "LocalHub Marketplace",
  description:
    "LocalHub Marketplace — the trusted platform for local services, vendors, and bookings.",
  openGraph: {
    title: "LocalHub Marketplace",
    description: "Discover trusted local vendors and services.",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "LocalHub Marketplace",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-lh-bg text-lh-text-primary">
        <ThemeProvider>
          <Layout>
            <LegalUpdateGate>
              {children}
              <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
            </LegalUpdateGate>
          </Layout>
        </ThemeProvider>
      </body>
    </html>
  );
}
