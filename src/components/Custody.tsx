"use client";

import type { CustodyDay } from "@/lib/custody";
import { entityName, exchangeTrend, kindLabel } from "@/lib/custody";
import type { FlowWindow } from "@/lib/flows";
import { compactNumber, longDate, usd } from "@/lib/format";
import { Card, SectionHead, TableScroll } from "./ui";

/**
 * Where VVV actually sits, and what moved on chain.
 *
 * Everything here is a balance or a pool-level flow, never a guess about who
 * owns an unlabelled wallet. Exchanges issue a deposit address per customer
 * and sweep it later, so ranking wallets by what they gained in a day measures
 * exchange plumbing, not conviction. Balances do not have that problem.
 */
export default function Custody({ c, w }: { c: CustodyDay | null; w: FlowWindow | null }) {
  if (!c) return null;

  const trend = exchangeTrend();
  const rows = c.entities.filter((e) => e.kind !== "issuer");
  const venice = c.entities.find((e) => e.kind === "issuer");

  return (
    <Card>
      <SectionHead
        eyebrow="Custody and flows"
        title="Where the VVV actually sits"
        sub="Balances read from Base for every address Arkham names. Flows read from the token's own transfer log."
        right={
          <span className="tnum shrink-0 rounded-md border px-2 py-1 text-[11px] text-[var(--text-dim)]">
            {longDate(c.date)}
          </span>
        }
      />

      <div className="grid grid-cols-1 divide-y border-b sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat
          label="In exchange custody"
          value={`${compactNumber(c.exchange_vvv, 1)} VVV`}
          sub={usd(c.exchange_usd, { compact: true })}
          note={
            trend
              ? `${trend.change >= 0 ? "+" : ""}${compactNumber(trend.change, 0)} VVV over ${trend.days} days on record.`
              : "Sell-ready supply sitting on centralised venues. One reading so far, so there is no trend yet."
          }
        />
        <Stat
          label="Bought out of pools"
          value={w ? `${w.poolAbsorptionVvv >= 0 ? "+" : ""}${compactNumber(w.poolAbsorptionVvv, 0)} VVV` : "—"}
          sub={w ? usd(w.poolAbsorptionUsd, { compact: true }) : "—"}
          note="Net VVV taken out of the DEX pools. Negative means holders sold into them."
          tone={w ? (w.poolAbsorptionVvv > 0 ? "pos" : "neg") : undefined}
        />
        <Stat
          label="Net into staking"
          value={w ? `${w.stakingNetVvv >= 0 ? "+" : ""}${compactNumber(w.stakingNetVvv, 0)} VVV` : "—"}
          sub={w ? usd(w.stakingNetUsd, { compact: true }) : "—"}
          note="VVV locked in the staking vault. It leaves the float and earns inference credit."
          tone={w ? (w.stakingNetVvv > 0 ? "pos" : "neg") : undefined}
        />
      </div>

      <TableScroll>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
              <th className="px-4 py-2.5 text-left font-medium sm:px-5">Holder</th>
              <th className="px-4 py-2.5 text-left font-medium">Type</th>
              <th className="px-4 py-2.5 text-right font-medium">VVV</th>
              <th className="px-4 py-2.5 text-right font-medium">Value</th>
              <th className="px-4 py-2.5 text-right font-medium sm:px-5">Addresses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.entity} className="border-b transition-colors last:border-0 hover:bg-[var(--bg-hover)]">
                <td className="px-4 py-3 font-medium sm:px-5">{entityName(e.entity)}</td>
                <td className="px-4 py-3 text-[var(--text-dim)]">{kindLabel(e.kind)}</td>
                <td className="tnum px-4 py-3 text-right">{compactNumber(e.vvv, 0)}</td>
                <td className="tnum px-4 py-3 text-right">
                  {usd(c.vvv_price_usd ? e.vvv * c.vvv_price_usd : null, { compact: true })}
                </td>
                <td className="tnum px-4 py-3 text-right text-[var(--text-dim)] sm:px-5">{e.addresses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>

      <div className="border-t px-4 py-4 text-[12px] leading-relaxed text-[var(--text-faint)] sm:px-5">
        <p>
          <span className="font-medium text-[var(--text-dim)]">How to read it.</span> Every balance
          here was read from the VVV contract on Base at{" "}
          {new Date(c.recorded_at).toISOString().slice(0, 16).replace("T", " ")} UTC, across{" "}
          {c.addresses_checked} labelled addresses
          {c.addresses_unread > 0 ? `, ${c.addresses_unread} of which the node would not answer for` : ""}
          . Entity names come from{" "}
          <a
            className="underline decoration-dotted underline-offset-4 hover:text-[var(--text)]"
            href={c.label_source}
            target="_blank"
            rel="noreferrer"
          >
            Arkham&rsquo;s public page for VVV
          </a>
          , snapshotted {longDate(c.labels_retrieved_at.slice(0, 10))}. The numbers are verified on
          chain every run, so a wrong label shows up as an entity holding nothing.
          {venice ? ` Venice AI's own contracts and treasury hold ${compactNumber(venice.vvv, 1)} VVV and are listed separately from the table above.` : ""}
        </p>
        <p className="mt-2">
          <span className="font-medium text-[var(--text-dim)]">What this cannot see.</span> A fund
          buying on Coinbase and leaving the VVV in Prime custody never touches the chain, and an
          OTC block traded off exchange does not either. Coinbase also issues a fresh deposit
          address per customer, so its labelled wallets understate what passes through it. These
          figures are a floor, never a ceiling. No wallet is named as a buyer here: an unlabelled
          address gaining VVV in a day is usually an exchange sweeping its own deposit addresses,
          not somebody building a position.
        </p>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  note,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  note: string;
  tone?: "pos" | "neg";
}) {
  const color = tone === "pos" ? "var(--pos)" : tone === "neg" ? "var(--neg)" : "var(--text)";
  return (
    <div className="p-4 sm:p-5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-faint)]">
        {label}
      </div>
      <div className="tnum mt-1.5 text-[22px] font-semibold tracking-tight" style={{ color }}>
        {value}
      </div>
      <div className="tnum mt-0.5 text-[12px] text-[var(--text-dim)]">{sub}</div>
      <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-faint)]">{note}</p>
    </div>
  );
}
