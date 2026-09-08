import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingPage } from "@/components/marketing-page";
import { seoPages } from "@/content/pages";

export function generateStaticParams() { return Object.keys(seoPages).map((path) => { const [section, slug] = path.split("/"); return { section, slug }; }); }

export async function generateMetadata({ params }: { params: Promise<{ section: string; slug: string }> }): Promise<Metadata> {
  const { section, slug } = await params;
  const page = seoPages[`${section}/${slug}`];
  if (!page) return {};
  return { title: page.eyebrow, description: page.description, alternates: { canonical: `/${section}/${slug}` } };
}

export default async function SeoPage({ params }: { params: Promise<{ section: string; slug: string }> }) {
  const { section, slug } = await params;
  const page = seoPages[`${section}/${slug}`];
  if (!page) notFound();
  return <MarketingPage page={page} />;
}