import type { Metadata } from "next";
import { Fraunces, Work_Sans, Noto_Serif_Tamil, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const notoSerifTamil = Noto_Serif_Tamil({
  variable: "--font-noto-serif-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
});

const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-noto-sans-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://yuvrajsampath.com";
const SITE_TITLE = "யுவராஜ் சம்பத் — Yuvraj Sampath";
const SITE_DESCRIPTION =
  "Daily writing, stories, poetry and essays from Yuvraj Sampath — in Tamil and English.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s — Yuvraj Sampath" },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Yuvraj Sampath",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${workSans.variable} ${notoSerifTamil.variable} ${notoSansTamil.variable} h-full antialiased`}
    >
      <head>
        <script
          // Runs before paint to avoid a flash of the wrong theme; the
          // CSS media query already handles the no-preference-stored case.
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
