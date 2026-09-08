import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingPage } from "@/components/marketing-page";
import { marketingPages } from "@/content/pages";

export function generateStaticParams() {
  return Object.keys(marketingPages).map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const page = marketingPages[section];
  if (!page) return {};
  return {
    title: page.eyebrow,
    description: page.description,
    alternates: { canonical: `/${section}` },
  };
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const page = marketingPages[section];
  if (!page) notFound();
  return <MarketingPage page={page} />;
}