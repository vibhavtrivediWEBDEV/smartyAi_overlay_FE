import Link from "next/link";
import { ArrowRight, Apple, Monitor, ShieldAlert } from "lucide-react";
import { CopyCommand } from "@/components/copy-command";
import { PageHeading } from "@/components/dashboard-ui";

const macFileName = "SmartyAI-1.0.9-mac-arm64-interna-091026.dmg";
const macDownloadUrl = "https://smartyai-downloads-807857683817.s3.ap-southeast-2.amazonaws.com/SmartyAI-1.0.9-mac-arm64-interna-091026.dmg";
const windowsFileName = "SmartyAI-Setup-1.0.9-x64.exe";
const windowsDownloadUrl = "https://smartyai-downloads-807857683817.s3.ap-southeast-2.amazonaws.com/SmartyAI-Setup-1.0.9-x64.exe";

export default function DashboardDownloadsPage() {
  return (
    <>
      <PageHeading eyebrow="Desktop app" title="Downloads" description="Install SmartyAI 1.0.9, your real-time interview assistant for macOS or Windows." />
      <div className="grid max-w-4xl gap-px border border-white/10 bg-white/10 md:grid-cols-2">
        <a href={macDownloadUrl} download={macFileName} className="bg-[#12120f] p-7">
          <Apple className="text-gold" size={22} />
          <h2 className="display-type mt-7 text-3xl font-semibold">SmartyAI 1.0.9</h2>
          <p className="mt-2 text-xs text-[#777066]">macOS 13+ · Apple Silicon · Internal, ad-hoc signed</p>
          <span className="mt-6 flex items-center gap-2 text-xs font-bold text-gold">Download DMG <ArrowRight size={14} /></span>
        </a>
        <a href={windowsDownloadUrl} download={windowsFileName} className="bg-[#12120f] p-7">
          <Monitor className="text-[#7ed5d7]" size={22} />
          <h2 className="display-type mt-7 text-3xl font-semibold">SmartyAI 1.0.9</h2>
          <p className="mt-2 text-xs text-[#777066]">Windows 10/11 · x64 · Unsigned internal installer</p>
          <span className="mt-6 flex items-center gap-2 text-xs font-bold text-[#7ed5d7]">Download EXE <ArrowRight size={14} /></span>
        </a>
      </div>
      <div className="grid max-w-4xl gap-px border-x border-b border-white/10 bg-white/10 md:grid-cols-2">
        <div className="bg-[#0d0d0b] p-7">
          <div className="flex gap-3">
            <ShieldAlert className="shrink-0 text-gold" size={19} />
            <div>
              <h2 className="text-sm font-bold">macOS approval</h2>
              <p className="mt-2 text-xs leading-5 text-[#777066]">This internal build is not Apple notarized. First try Control-clicking SmartyAI in Finder and choosing Open. If macOS still blocks it, approve it in Privacy &amp; Security. Only for a verified download from this official page, the fallback commands remove quarantine from the installed app and open it.</p>
            </div>
          </div>
          <CopyCommand command="xattr -dr com.apple.quarantine /Applications/SmartyAI.app" />
          <CopyCommand command="open /Applications/SmartyAI.app" />
        </div>
        <div className="bg-[#0d0d0b] p-7">
          <div className="flex gap-3">
            <ShieldAlert className="shrink-0 text-[#7ed5d7]" size={19} />
            <div>
              <h2 className="text-sm font-bold">Windows SmartScreen</h2>
              <p className="mt-2 text-xs leading-5 text-[#777066]">The internal installer is unsigned, so Windows may show a SmartScreen warning. Confirm the filename and official download source before choosing More info, then Run anyway. Never disable Windows Security.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 max-w-4xl border border-white/10 p-5">
        <p className="text-sm font-bold">Platform support</p>
        <p className="mt-2 text-xs leading-5 text-[#777066]">Windows includes the overlay, AI chat, and offline system-audio transcription. Windows microphone transcription and screenshot OCR are not available in this release.</p>
        <Link href="/windows" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-gold">Read Windows support details <ArrowRight size={14} /></Link>
      </div>
    </>
  );
}