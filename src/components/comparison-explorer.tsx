"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  ChartNoAxesCombined,
  CircleDollarSign,
  Monitor,
  PanelsTopLeft,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import {
  comparisonCheckedOn,
  comparisonProducts,
  comparisonRows,
  type ComparisonProductId,
} from "@/content/comparison-data";

const categories = [
  { id: "all", label: "Full picture", icon: PanelsTopLeft },
  { id: "workflow", label: "Live workflow", icon: AudioLines },
  { id: "context", label: "Context", icon: SlidersHorizontal },
  { id: "platforms", label: "Platforms", icon: Monitor },
  { id: "timing", label: "Timing", icon: ChartNoAxesCombined },
  { id: "pricing", label: "Pricing", icon: CircleDollarSign },
  { id: "capture", label: "Capture claims", icon: ShieldCheck },
] as const;

type CategoryId = (typeof categories)[number]["id"];

export function ComparisonExplorer() {
  const [selectedId, setSelectedId] = useState<ComparisonProductId>("final-round");
  const [category, setCategory] = useState<CategoryId>("all");
  const selected = comparisonProducts.find((product) => product.id === selectedId) ?? comparisonProducts[1];
  const smarty = comparisonProducts[0];
  const rows = comparisonRows.filter((row) => category === "all" || row.group === category);

  return (
    <section id="comparison" className="comparison-section border-y border-white/10 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-360">
        <div className="comparison-intro comparison-intro-arrive">
          <div>
            <p className="comparison-kicker">A sourced product comparison <span>Checked {comparisonCheckedOn}</span></p>
            <h2 className="display-type mt-5 max-w-4xl text-5xl font-semibold leading-[.92] tracking-normal md:text-7xl">Compare the product.<br /><span>Not the hype.</span></h2>
            <p className="comparison-intro-copy">Choose a product and a decision area. Each detail links to the official page it came from; claims and measurements are labeled separately.</p>
          </div>
          <div className="comparison-live-panel">
            <div className="comparison-live-eyebrow"><span>YOUR LIVE PREVIEW</span><span className="comparison-live-pulse" /> CONNECTED TEST</div>
            <div className="comparison-live-readouts">
              <div><span>FIRST TOKEN</span><strong>Measured</strong><small>Your connection</small></div>
              <div><span>FULL RESPONSE</span><strong>Measured</strong><small>Your model + prompt</small></div>
            </div>
            <p>Run the preview above to see real timings. They are not presented as a standardized competitor benchmark.</p>
            <Link href="#live-demo">Measure a response <ArrowRight size={14} /></Link>
          </div>
        </div>

        <div className="comparison-explorer comparison-explorer-arrive">
          <div className="comparison-explorer-head">
            <div>
              <p className="comparison-step-label">01 / SELECT A PRODUCT</p>
              <h3>Who are you comparing?</h3>
            </div>
            <span className="comparison-selection-count">{comparisonProducts.length - 1} alternatives · one side-by-side view</span>
          </div>

          <div className="comparison-product-select" role="tablist" aria-label="Choose a product to compare with SmartyAI">
            {comparisonProducts.slice(1).map((product) => (
              <button
                aria-selected={selectedId === product.id}
                className={selectedId === product.id ? "selected" : ""}
                key={product.id}
                onClick={() => setSelectedId(product.id)}
                role="tab"
                type="button"
              >
                <span>{product.label}</span>
                <strong>{product.name}</strong>
                <small>{product.category}</small>
              </button>
            ))}
          </div>

          <div className="comparison-active-pair">
            <div className="comparison-active-product comparison-active-smarty">
              <span>YOUR BASELINE</span>
              <strong>{smarty.name}</strong>
              <small>{smarty.category}</small>
            </div>
            <span className="comparison-versus">VS</span>
            <div className="comparison-active-product">
              <span>SELECTED PRODUCT</span>
              <strong>{selected.name}</strong>
              <small>{selected.category}</small>
            </div>
            <a className="comparison-primary-source" href={selected.sourceHref} rel="noreferrer" target="_blank">
              Official product page <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="comparison-lens-header">
            <div>
              <p className="comparison-step-label">02 / CHOOSE A DECISION AREA</p>
              <h3>What matters to you?</h3>
            </div>
            <p aria-live="polite" className="comparison-result-count">{rows.length} {rows.length === 1 ? "detail" : "details"}</p>
          </div>

          <div className="comparison-category-select" aria-label="Filter comparison by category" role="tablist">
            {categories.map(({ id, label, icon: Icon }) => (
              <button
                aria-selected={category === id}
                className={category === id ? "selected" : ""}
                key={id}
                onClick={() => setCategory(id)}
                role="tab"
                type="button"
              >
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          <div className="comparison-fact-head" aria-hidden="true">
            <span>DECISION AREA</span><span>{smarty.name}</span><span>{selected.name}</span>
          </div>
          <div className="comparison-fact-list" aria-live="polite">
            {rows.map((row, index) => (
              <article className="comparison-fact-row" key={row.id} style={{ "--row-index": index } as React.CSSProperties}>
                <h4><span>{String(index + 1).padStart(2, "0")}</span>{row.label}</h4>
                <FactCell fact={row.facts.smartyai} productName={smarty.name} featured />
                <FactCell fact={row.facts[selectedId]} productName={selected.name} />
              </article>
            ))}
          </div>

          <div className="comparison-method-note">
            <ShieldCheck size={17} />
            <p>Vendor statements are attributed, not independently verified. Timing definitions can differ, and prices remain in the currency shown by each vendor. Check the linked pages for current details.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FactCell({
  fact,
  productName,
  featured = false,
}: {
  fact: { text: string; source: string; evidence: string };
  productName: string;
  featured?: boolean;
}) {
  const isInternal = fact.source.startsWith("/") || fact.source.startsWith("#");

  return (
    <div className={`comparison-fact-cell ${featured ? "featured" : ""}`}>
      <span className="comparison-evidence-label">{fact.evidence}</span>
      <p>{fact.text}</p>
      {isInternal ? (
        <Link href={fact.source} aria-label={`Open SmartyAI source for ${productName}`}><span>Product details</span><ArrowUpRight size={12} /></Link>
      ) : (
        <a href={fact.source} aria-label={`Open official ${productName} source`} rel="noreferrer" target="_blank"><span>Official source</span><ArrowUpRight size={12} /></a>
      )}
    </div>
  );
}