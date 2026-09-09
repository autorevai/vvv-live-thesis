"use client";

import { OPENAI_POLICY, OPENAI_QUOTE, PRESS, PRIVACY_MODES } from "@/lib/press";
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
          title="Your prompts are training data by default"
          sub="This bet needs companies to start paying for AI that does not keep their work. This week showed exactly why they might."
        />

        <div className="space-y-4 p-4 text-[14px] leading-relaxed text-[var(--text-dim)] sm:p-5">
          <p>
            OpenAI trains on what you type. On personal ChatGPT and Codex accounts it is on unless
            you go and turn it off, and turning it off in the obvious place does not cover
            everything. Both of these are from OpenAI&apos;s own help pages.
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
              . Business and API accounts are not trained on by default. Personal accounts are.
            </figcaption>
          </figure>

          <p>
            On September 8, 2026, a mathematician found out what that means in practice. NYU
            professor Tristan Buckmaster published three proofs on the Navier-Stokes problem, one of
            the biggest open problems in maths, along with a statement saying an OpenAI team started
            working on the same narrow approach after word of his progress reached the company. He
            had been using Codex heavily throughout.
          </p>

          <p>
            OpenAI published its own full proof the same day. It says it never saw his work and that
            the proofs differ. It also wrote this:
          </p>

          <figure>
            <blockquote className="rounded-lg border-l-2 border-l-[var(--neg)] bg-[var(--bg)] p-3.5 text-[13px] leading-relaxed text-[var(--text)]">
              &ldquo;{OPENAI_QUOTE}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-[11px] text-[var(--text-faint)]">
              OpenAI, in its own post on the result.
            </figcaption>
          </figure>

          <p>
            A company that spent $22.5M of compute in a week cannot say for certain that its models
            did not learn from a user&apos;s private work. For a mathematician that is a fight over
            credit. For anyone putting source code, unreleased research or deal documents into a
            model, it is a straight business risk.
          </p>

          <p className="text-[var(--text-dim)]">
            That is what Venice sells. It does not keep your prompts by default, and on paid tiers
            they run inside sealed hardware that Venice itself cannot read. The whole bet is that
            more people start caring about that. The burn and staking numbers below are where you
            find out whether they do.
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
