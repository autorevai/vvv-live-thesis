"use client";

import { BUSINESS_METRICS, CRYPTO_COMPARATORS, PRIVATE_BENCHMARKS } from "@/lib/constants";
import { compactNumber, longDate, relativeTime } from "@/lib/format";
import type { ThesisModel } from "@/lib/thesis";
import { Card, SectionHead } from "./ui";

export default function Methodology({ m }: { m: ThesisModel }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <SectionHead
          eyebrow="Methodology"
          title="What every number on this page means"
          sub="You can rebuild every number on this page from the formulas below and the sources next to them."
        />
        <div className="space-y-5 p-4 text-[13px] leading-relaxed text-[var(--text-dim)] sm:p-5">
          <Block title="Free-float cap">
            <p>
              VVV spot price multiplied by the immediately circulating float. Free float is
              Venice-reported circulating supply less every VVV committed to the staking contract,
              which covers plain staking and DIEM locking together.
            </p>
            <Formula>free_float = venice_circulating_supply - sVVV_total_supply</Formula>
            <Formula>free_float_cap = vvv_price * free_float</Formula>
            <p className="text-[var(--text-faint)]">
              This is not the conventional crypto market capitalization, which currently reads{" "}
              <span className="tnum">${compactNumber(m.conventionalMarketCap, 2)}</span>. It is not
              enterprise value and it is not equity value.
            </p>
          </Block>

          <Block title="Comparator levels">
            <Formula>implied_vvv_price = comparator_valuation / free_float</Formula>
            <Formula>multiple_to_comparator = comparator_valuation / free_float_cap</Formula>
            <p className="text-[var(--text-faint)]">
              This only compares what the market values each one at. Holding VVV does not give you
              any ownership of, profit from, or legal claim on the companies it is compared to.
            </p>
          </Block>

          <Block title="What a large number does not mean">
            <p className="text-[var(--text-faint)]">
              A $10B valuation does not mean $10B has to be spent on VVV. A valuation is just the
              last traded price multiplied by the supply. It takes far less money than the headline
              number to move it.
            </p>
          </Block>

          <Block title="Burns">
            <p>
              Venice buys VVV on the open market and sends it to the zero address. The tokens are
              not destroyed at the ERC-20 level, so on-chain{" "}
              <code className="rounded bg-[var(--bg-hover)] px-1 py-0.5 text-[11px]">
                totalSupply
              </code>{" "}
              still counts them. Venice&apos;s reported total supply nets them out, and this page
              follows Venice.
            </p>
            <Formula>burned = balanceOf(0x0) on the VVV contract</Formula>
            <p className="text-[var(--text-faint)]">
              The 30-day pace takes what has burned since Day 0 and scales it to 30 days. The
              dollar figure uses today&apos;s price, not the price paid at the time of each burn.
            </p>
          </Block>

          <Block title="Business metrics">
            <p className="text-[var(--text-faint)]">
              Revenue, users and usage have no live feed. Each one is recorded on the day Venice
              published it, with the date shown. Nothing is guessed for the days in between.
            </p>
          </Block>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <SectionHead eyebrow="Data freshness" title="Where each number comes from" />
          <ul className="divide-y">
            <Source
              name="VVV, TAO, ZEC, NEAR price and market cap"
              detail="CoinGecko public API, revalidated every 60 seconds"
              stamp={relativeTime(m.freshness.market)}
              url="https://www.coingecko.com/en/coins/venice-token"
            />
            <Source
              name="VVV circulating, total supply, total staked"
              detail="api.venice.ai/api/v1/vvv/stats, the feed behind venice.ai/token"
              stamp={relativeTime(m.freshness.venice)}
              url="https://venice.ai/token"
            />
            <Source
              name="Burned VVV, sVVV supply, DIEM supply"
              detail="Base mainnet, read directly from the contracts every 5 minutes"
              stamp={relativeTime(m.freshness.chain)}
              url="https://basescan.org/token/0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf?a=0x0000000000000000000000000000000000000000"
            />
            <Source
              name="DIEM-locked VVV"
              detail={`Venice token dashboard. There is no API for it, so it is checked by hand.`}
              stamp={`Verified ${longDate(m.diemLocked.verifiedAt)}`}
              stale
              url={m.diemLocked.sourceUrl}
            />
            {BUSINESS_METRICS.map((b) => (
              <Source
                key={b.key}
                name={b.label}
                detail={b.sourceName}
                stamp={`Verified ${longDate(b.verifiedAt)}`}
                stale
                url={b.sourceUrl}
              />
            ))}
            {PRIVATE_BENCHMARKS.map((b) => (
              <Source
                key={b.key}
                name={`${b.company} valuation`}
                detail={`${b.valuationType}, effective ${longDate(b.effectiveDate)}`}
                stamp={b.sourceName}
                stale
                url={b.sourceUrl}
              />
            ))}
          </ul>
        </Card>

        <Card>
          <SectionHead
            eyebrow="Comparators"
            title="Why these three tokens"
            sub="Picked at launch and left alone. Swapping in a friendlier comparison later would defeat the point."
          />
          <ul className="divide-y">
            {CRYPTO_COMPARATORS.map((c) => (
              <li key={c.key} className="flex gap-3 p-4 sm:p-5">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: c.color }}
                  aria-hidden
                />
                <div>
                  <div className="text-[13px] font-medium">
                    {c.label}
                    <span className="ml-2 text-[12px] font-normal text-[var(--text-faint)]">
                      {c.name}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-faint)]">
                    {c.why}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[13px] font-semibold text-[var(--text)]">{title}</h3>
      {children}
    </div>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-[var(--bg)] p-2.5 font-mono text-[11px] leading-relaxed text-[var(--text-dim)]">
      {children}
    </pre>
  );
}

function Source({
  name,
  detail,
  stamp,
  url,
  stale,
}: {
  name: string;
  detail: string;
  stamp: string;
  url?: string;
  stale?: boolean;
}) {
  return (
    <li className="flex items-start justify-between gap-4 p-4 sm:px-5">
      <div className="min-w-0">
        <div className="text-[13px] font-medium">{name}</div>
        <div className="mt-0.5 text-[11px] leading-snug text-[var(--text-faint)]">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2 hover:text-[var(--text-dim)]"
            >
              {detail}
            </a>
          ) : (
            detail
          )}
        </div>
      </div>
      <span
        className="tnum shrink-0 whitespace-nowrap text-[11px]"
        style={{ color: stale ? "var(--warn)" : "var(--text-dim)" }}
      >
        {stamp}
      </span>
    </li>
  );
}
