"use client";

import type { ThesisModel } from "@/lib/thesis";
import { Card, GradePill, SectionHead } from "./ui";

export default function Pillars({ m }: { m: ThesisModel }) {
  return (
    <Card>
      <SectionHead
        eyebrow="Pillar grades"
        title="Five things that have to be true"
        sub="Each pillar is graded on its own inputs. The headline grade is a count, not a weighted score: four or five strengthening pillars reads strongly strengthening, three reads strengthening, three or more weakening reads weakening."
        right={<GradePill grade={m.overall.grade} size="lg">{m.overall.label}</GradePill>}
      />
      <div className="grid grid-cols-1 gap-px bg-[var(--border)] md:grid-cols-2 xl:grid-cols-3">
        {m.pillars.map((p) => (
          <article key={p.key} className="flex flex-col bg-[var(--bg-raised)] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[14px] font-semibold tracking-tight">{p.name}</h3>
              <GradePill grade={p.grade}>{p.pending ? "Pending data" : undefined}</GradePill>
            </div>
            <div className="mt-2 text-[13px] font-medium text-[var(--text-dim)]">{p.headline}</div>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-faint)]">{p.detail}</p>
            <dl className="mt-4 space-y-1.5 border-t pt-3 text-[12px]">
              {p.inputs.map((i) => (
                <div key={i.label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[var(--text-faint)]">{i.label}</dt>
                  <dd className="tnum text-right font-medium">{i.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
        <article className="flex flex-col justify-center bg-[var(--bg-raised)] p-4 sm:p-5">
          <h3 className="text-[14px] font-semibold tracking-tight">How the grade is built</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-faint)]">
            No composite score and no weights picked after the fact. Each pillar compares against
            its own Day 0 value using a rule fixed at launch. Business growth sits out of the count
            until Venice publishes something new, so the headline currently rests on{" "}
            {m.overall.scored} pillars rather than five.
          </p>
        </article>
      </div>
    </Card>
  );
}
