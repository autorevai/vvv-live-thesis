"use client";

import { OPENAI_QUOTE, PRESS, PRIVACY_MODES } from "@/lib/press";
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
          title="Private inference stopped being a preference"
          sub="The thesis needs demand for private, uncensored AI to keep growing. This week gave that argument its clearest public test."
        />

        <div className="space-y-4 p-4 text-[14px] leading-relaxed text-[var(--text-dim)] sm:p-5">
          <p>
            On September 8, 2026, NYU mathematician Tristan Buckmaster published three proofs on the
            Navier-Stokes problem along with a statement alleging that a parallel OpenAI effort built
            on his work after word of it reached the company. He had used OpenAI&apos;s Codex heavily
            while assembling the project. OpenAI published a full proof the same day and disputes the
            account.
          </p>

          <figure className="rounded-lg border-l-2 border-l-[var(--warn)] bg-[var(--bg)] p-3.5">
            <blockquote className="text-[13px] leading-relaxed text-[var(--text)]">
              &ldquo;{OPENAI_QUOTE}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-[11px] text-[var(--text-faint)]">
              OpenAI, in its own post on the result. It also says no specific user data was accessed
              and that the proofs differ.
            </figcaption>
          </figure>

          <p>
            Take the denial at face value and the sentence still stands on its own. A lab cannot
            fully account for what its models absorbed from customer usage. For a mathematician that
            is a credit dispute. For a company putting unreleased research, source code or deal
            documents into a model, it is a procurement question.
          </p>

          <p className="text-[var(--text-faint)]">
            That is the demand Venice sells into. Not privacy as a principle, privacy as a property
            of the infrastructure, with a default of zero retention and hardware attestation
            available above it. Whether that demand actually shows up is what the burn and staking
            numbers below measure. Nothing on this page treats a news story as evidence that the
            thesis is working.
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
          title="The record, with dates"
          sub="Primary sources first. Allegations stay attributed to whoever made them, and the responses sit next to them."
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
