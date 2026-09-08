"use client";

import Link from "next/link";
import { Languages, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay: boolean },
          elementId: string,
        ) => void;
      };
    };
  }
}

const links = [
  ["Product", "/features"],
  ["Pricing", "/pricing"],
  ["Security", "/security"],
  ["Support", "/macos"],
  ["Downloads", "/downloads"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const initializeGoogleTranslate = () => {
      const mount = document.getElementById("google_translate_element");
      if (!mount || mount.childElementCount || !window.google?.translate) return;

      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element",
      );
    };

    window.googleTranslateElementInit = initializeGoogleTranslate;
    const existingScript = document.getElementById("gt-script");
    if (existingScript) {
      initializeGoogleTranslate();
      return;
    }

    const script = document.createElement("script");
    script.id = "gt-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  function changeLanguage(language: string) {
    const translateSelect = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (!translateSelect) return;
    translateSelect.value = language;
    translateSelect.dispatchEvent(new Event("change"));
  }

  return (
    <header className="luxury-site-header border-b border-white/10 bg-[#0b0b0a]/95 text-paper backdrop-blur">
      <div className="mx-auto flex h-18 max-w-360 items-center justify-between px-5 md:px-10">
        <Link href="/" className="display-type text-2xl font-bold tracking-normal">
          Smarty<span className="text-gold">AI</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-[#b9b2a6] md:flex" aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-white">{label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <label className="site-language-control">
            <Languages size={15} aria-hidden="true" />
            <span className="sr-only">Translate website</span>
            <select defaultValue="en" onChange={(event) => changeLanguage(event.target.value)} aria-label="Translate website">
              <option value="en">EN</option>
              <option value="hi">हिन्दी</option>
              <option value="zh-CN">中文</option>
              <option value="es">ES</option>
            </select>
          </label>
          <div id="google_translate_element" className="google-translate-mount" aria-hidden="true" />
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/login" className="text-sm text-[#c9c2b4]">Log in</Link>
            <Link href="/register" className="bg-gold px-4 py-2 text-sm font-bold text-black">Create account</Link>
          </div>
        </div>
        <button type="button" className="ml-2 p-2 md:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="grid border-t border-white/10 px-5 py-4 md:hidden" aria-label="Mobile navigation">
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="border-b border-white/5 py-3 text-sm">{label}</Link>)}
          <div className="mt-4 flex gap-3"><Link href="/login" className="border border-white/20 px-4 py-2 text-sm">Log in</Link><Link href="/register" className="bg-gold px-4 py-2 text-sm font-bold text-black">Create account</Link></div>
        </nav>
      )}
    </header>
  );
}