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
          sub="September 8, 2026. A mathematician put a year of unpublished work into OpenAI's Codex, asked whether they trained on it, and could not get an answer."
        />

        <div className="space-y-4 p-4 text-[14px] leading-relaxed text-[var(--text-dim)] sm:p-5">
          <p>
            NYU professor Tristan Buckmaster and Levent Alp&ouml;ge published three proofs on the
            Navier-Stokes problem, one of the biggest open problems in maths. Buckmaster then
            published a statement about what happened while they were finishing it. An OpenAI team
            started on the same narrow approach days after word of his progress reached the company,
            and released a full proof of the central problem before he could publish.
          </p>

          <p>
            He had been running the entire project through Codex. Here is what happened when he
            asked about it:
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
            He was paying OpenAI out of his own research funds, with no institutional agreement.
            That matters, because OpenAI treats personal accounts differently from business ones,
            and it publishes the rule itself:
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
              . Training is on by default on personal ChatGPT and Codex accounts, and switching it
              off in the obvious place does not cover Codex full environments.
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
            Put it together. Training is on by default. The opt-out has holes. A researcher put a
            year of unpublished work through the product, asked twice whether it was trained on, and
            got no answer. The company itself will not rule it out. You do not need anyone to be
            proven guilty for this to change how people buy AI.
          </p>

          <p>
            This is the demand the bet is built on. Venice does not keep your prompts by default,
            and on paid tiers they run inside sealed hardware Venice itself cannot read. Every
            subscription that gets bought for that reason automatically buys VVV on the open market
            and burns it. That is the link between this story and the numbers below.
          </p>
        </div>

        <div className="border-t p-4 sm:p-5">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
            What Venice actually offers, per its own docs
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
          sub="Read the originals. Where someone is accused of something, the reply sits right next to it."
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
