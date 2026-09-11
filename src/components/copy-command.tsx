"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CopyCommandProps = {
  command: string;
};

export function CopyCommand({ command }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 flex min-w-0 items-center gap-3 border border-white/10 bg-black/30 p-3">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xs text-[#e7decf]">{command}</code>
      <button
        type="button"
        onClick={copyCommand}
        aria-label={`Copy command: ${command}`}
        title="Copy command"
        className="flex size-9 shrink-0 items-center justify-center border border-white/10 text-gold transition hover:border-gold/50 hover:bg-white/5"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  );
}