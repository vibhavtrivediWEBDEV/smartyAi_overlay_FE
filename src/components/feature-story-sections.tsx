import {
  ArrowRight,
  AudioLines,
  Check,
  Circle,
  Code2,
  Mic,
  MonitorUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { MarketingPage } from "@/content/pages";

type FeatureSection = MarketingPage["sections"][number];

const storyTypes = ["studio", "recording", "overlay", "workflow"] as const;

export function FeatureStorySections({
  sections,
  home = false,
}: {
  sections: FeatureSection[];
  home?: boolean;
}) {
  return (
    <section className={`feature-stories ${home ? "feature-stories-home" : ""}`}>
      <div className="feature-stories-inner">
        {sections.map((section, index) => (
          <article id={index === 0 ? "response-studio" : undefined} className={`feature-story feature-story-${storyTypes[index % storyTypes.length]}`} key={section.title} data-reveal>
            <div className="feature-story-copy">
              <p className="feature-story-kicker">PRODUCT / 0{index + 1}</p>
              <h2 className="display-type">{section.title}</h2>
              <p className="feature-story-description">{section.body}</p>
              {section.bullets && (
                <ul className="feature-story-points">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}><Check size={15} />{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="feature-story-visual" aria-label={`${section.title} product preview`}>
              <StoryVisual type={storyTypes[index % storyTypes.length]} />
            </div>
          </article>
        ))}
      </div>
      {!home && (
        <div className="feature-stories-cta luxury-marketing-cta mx-auto mt-8 flex max-w-300 flex-col justify-between gap-6 border-t border-gold/30 px-5 pt-8 sm:flex-row sm:items-center md:px-0">
          <p className="display-type text-3xl font-semibold">See SmartyAI on your desktop.</p>
          <Link href="/downloads" className="flex w-fit items-center gap-2 bg-gold px-5 py-3 text-sm font-bold text-black">View downloads <ArrowRight size={16} /></Link>
        </div>
      )}
    </section>
  );
}

function StoryVisual({ type }: { type: (typeof storyTypes)[number] }) {
  if (type === "studio") {
    return (
      <div className="story-window story-studio-window">
        <div className="story-window-bar"><Brand /><span>RESPONSE STUDIO</span><span className="story-window-status"><Circle size={7} fill="currentColor" /> SAVED</span></div>
        <div className="story-studio-tabs"><span>Configure</span><span>Ask & compare</span><b>Teach AI</b><span>Library</span></div>
        <div className="story-answer-card">
          <p className="story-micro-label"><Sparkles size={12} /> APPROVED ANSWER · BEHAVIORAL</p>
          <h3>Tell me about a difficult stakeholder.</h3>
          <p>“I aligned the team around a shared success measure, clarified the trade-offs, and kept the project moving without losing trust.”</p>
          <div className="story-answer-foot"><span><Check size={12} /> Your words, approved by you</span><span>Open from Library</span></div>
        </div>
        <div className="story-studio-note"><span>INSTANT REFERENCE</span><strong>No generation request to open a saved answer</strong></div>
      </div>
    );
  }

  if (type === "recording") {
    return (
      <div className="story-window story-recording-window">
        <div className="story-window-bar"><Brand /><span>SESSION RECORDING</span><span className="story-recording-live"><i /> RECORDING</span></div>
        <div className="story-source-row">
          <div><span className="story-source-icon"><Mic size={16} /></span><span><b>Your microphone</b><small>Candidate · separate track</small></span><Check size={14} /></div>
          <div><span className="story-source-icon story-source-system"><AudioLines size={17} /></span><span><b>System audio</b><small>Interviewer · separate track</small></span><Check size={14} /></div>
        </div>
        <div className="story-waveform" aria-hidden="true">{Array.from({ length: 44 }, (_, index) => <i key={index} style={{ "--bar": `${12 + ((index * 17 + index * index * 3) % 47)}%` } as React.CSSProperties} />)}</div>
        <div className="story-transcript"><span>INTERVIEWER · 10:42:16</span><p>How did you decide what to prioritize when the deadline changed?</p></div>
        <div className="story-recording-foot"><ShieldCheck size={13} /> Consent confirmed · audio sources shown</div>
      </div>
    );
  }

  if (type === "overlay") {
    return (
      <div className="story-desktop-scene">
        <div className="story-desktop-title"><span>YOUR DESKTOP</span><span>SMARTYAI · CLEARLY IDENTIFIED</span></div>
        <div className="story-meeting-window">
          <div className="story-meeting-bar"><i /><i /><i /><span>Interview workspace</span></div>
          <div className="story-meeting-content"><span>QUESTION</span><strong>Walk me through a project you owned end to end.</strong><div className="story-meeting-lines"><i /><i /><i /></div></div>
        </div>
        <div className="story-overlay-window">
          <div className="story-overlay-bar"><Brand /><span>SMARTYAI</span><span className="story-overlay-dot" /></div>
          <div className="story-overlay-status"><ShieldCheck size={13} /> Capture protection varies by OS and app</div>
          <div className="story-overlay-answer"><span>ANSWER DRAFT</span><p>“I owned the release from planning through rollout. When our deadline moved up, I...”</p></div>
          <div className="story-overlay-controls"><span><Mic size={13} /> Mic</span><span><AudioLines size={13} /> Audio</span><span><MonitorUp size={13} /> Screen</span></div>
        </div>
        <div className="story-desktop-foot">Best-effort capture exclusion. Verify in your meeting setup.</div>
      </div>
    );
  }

  return (
    <div className="story-workflow-window">
      <div className="story-workflow-heading"><Brand /><span>ONE DESKTOP WORKSPACE</span></div>
      <div className="story-workflow-platforms" aria-label="Examples of meeting and coding tools">
        <span><b className="platform-zoom">Z</b>Zoom</span>
        <span><b className="platform-teams">T</b>Teams</span>
        <span><b className="platform-meet">M</b>Meet</span>
        <span><b className="platform-code"><Code2 size={15} /></b>Coding screens</span>
      </div>
      <div className="story-workflow-rule" />
      <div className="story-workflow-sequence">
        <span><i>01</i> Prepare context</span><b>→</b>
        <span><i>02</i> Listen with consent</span><b>→</b>
        <span><i>03</i> Use your answer</span>
      </div>
      <p className="story-workflow-note">A desktop companion for your existing workflow, not a meeting-platform integration. Availability depends on your OS and permissions.</p>
    </div>
  );
}

function Brand() {
  return <span className="story-brand-mark" aria-label="SmartyAI"><span>S</span></span>;
}