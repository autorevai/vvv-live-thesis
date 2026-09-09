"use client";

import { BUCKMASTER, OPENAI_POLICY, OPENAI_QUOTE, PRESS, PRIVACY_MODES } from "@/lib/press";
import { longDate } from "@/lib/format";
import { Card, SectionHead } from "./ui";

const KIND_LABEL: Record<string, string> = {
  category: "Category",
  venice: "Venice",
  comparator: "Comparator",
};

const KIND_COLOR: Record<string, string> = {
  category: "var(--warn)",
  venice: "var(--accent)",
  comparator: "var(--text-faint)",
};

export default function WhyNow() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
      <Card>
        <SectionHead
          eyebrow="Why now"
          title="This is the whole bet, and it just hit the front page"
          sub="Sep 8, 2026. A mathematician ran a year of unpublished work through OpenAI's Codex, asked if they trained on it, and got no answer."
        />

        <div className="space-y-4 p-4 text-[14px] leading-relaxed text-[var(--text-dim)] sm:p-5">
          <p>
            NYU professor Tristan Buckmaster and Levent Alp&ouml;ge published three proofs on
            Navier-Stokes, one of the biggest open problems in maths. Word of their progress reached
            OpenAI. Days later an OpenAI team took the same narrow approach and published a full
            proof first.
          </p>

          <p>
            He ran the whole project through Codex. He asked about it:
          </p>

          <figure>
            <blockquote className="rounded-lg border-l-2 border-l-[var(--neg)] bg-[var(--bg)] p-3.5 text-[13px] leading-relaxed text-[var(--text)]">
              &ldquo;{BUCKMASTER.drafts}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-[11px] text-[var(--text-faint)]">
              Tristan Buckmaster, NYU, September 8, 2026.{" "}
              <a
                href={BUCKMASTER.url}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted underline-offset-2 hover:text-[var(--text-dim)]"
              >
                Full statement
              </a>
            </figcaption>
          </figure>

          <p>
            He paid out of his own research funds. Personal account, and OpenAI publishes what
            that means:
          </p>

          <figure className="space-y-2.5">
            <blockquote className="rounded-lg border-l-2 border-l-[var(--warn)] bg-[var(--bg)] p-3.5 text-[13px] leading-relaxed text-[var(--text)]">
              &ldquo;{OPENAI_POLICY.training}&rdquo;
            </blockquote>
            <blockquote className="rounded-lg border-l-2 border-l-[var(--warn)] bg-[var(--bg)] p-3.5 text-[13px] leading-relaxed text-[var(--text)]">
              &ldquo;{OPENAI_POLICY.optOutGap}&rdquo;
            </blockquote>
            <figcaption className="text-[11px] text-[var(--text-faint)]">
              OpenAI Help Center, updated August 2026.{" "}
              <a
                href={OPENAI_POLICY.url}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted underline-offset-2 hover:text-[var(--text-dim)]"
              >
                Read it
              </a>
              . Training is on by default for personal accounts. The obvious opt-out misses Codex
              full environments.
            </figcaption>
          </figure>

          <p>And OpenAI, in its own post announcing the proof:</p>

          <figure>
            <blockquote className="rounded-lg border-l-2 border-l-[var(--neg)] bg-[var(--bg)] p-3.5 text-[13px] leading-relaxed text-[var(--text)]">
              &ldquo;{OPENAI_QUOTE}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-[11px] text-[var(--text-faint)]">
              OpenAI. It says it never accessed his work and that the proofs differ.
            </figcaption>
          </figure>

          <p className="text-[var(--text)]">
            Training is on by default. The opt-out has holes. A researcher ran a year of
            unpublished work through it, asked twice, and got no answer. OpenAI leaves the door
            open itself. That alone changes how people buy AI.
          </p>

          <p>
            Venice deletes prompts by default. Paid tiers run them in sealed hardware, hidden
            even from Venice. Every subscription sold on that basis buys VVV on the open market and
            burns it. That is the link to the numbers below.
          </p>
        </div>

        <div className="border-t p-4 sm:p-5">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
            What Venice offers
          </h3>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {PRIVACY_MODES.map((m) => (
              <div key={m.name}>
                <dt className="flex items-baseline gap-2">
                  <span className="text-[13px] font-semibold">{m.name}</span>
                  <span className="rounded border px-1.5 py-0.5 text-[10px] text-[var(--text-faint)]">
                    {m.tier}
                  </span>
                </dt>
                <dd className="mt-1 text-[12px] leading-relaxed text-[var(--text-faint)]">
                  {m.detail}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href="https://venice.ai/privacy"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-[11px] text-[var(--text-faint)] underline decoration-dotted underline-offset-2 hover:text-[var(--text-dim)]"
          >
            venice.ai/privacy
          </a>
        </div>
      </Card>

      <Card>
        <SectionHead
          eyebrow="Press"
          title="Sources and coverage"
          sub="Primary sources, with both sides."
        />
        <ol className="divide-y">
          {PRESS.map((p) => (
            <li key={p.url} className="p-4 sm:px-5">
              <div className="flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    color: KIND_COLOR[p.kind],
                    background: `color-mix(in srgb, ${KIND_COLOR[p.kind]} 12%, transparent)`,
                  }}
                >
                  {KIND_LABEL[p.kind]}
                </span>
                <span className="tnum text-[11px] text-[var(--text-faint)]">
                  {longDate(p.date)}
                </span>
                <span className="text-[11px] text-[var(--text-faint)]">· {p.publisher}</span>
              </div>
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 block text-[13px] font-medium leading-snug hover:underline"
              >
                {p.title}
              </a>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-faint)]">{p.note}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
