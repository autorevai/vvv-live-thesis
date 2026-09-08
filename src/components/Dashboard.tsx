"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HistoryPayload } from "@/app/api/history/route";
import type { DailyDelta } from "@/lib/snapshots";
import type { ThesisModel } from "@/lib/thesis";
import DailyRecord from "./DailyRecord";
import DayZeroSnapshot from "./DayZeroSnapshot";
import FailureConditions from "./FailureConditions";
import Hero from "./Hero";
import Methodology from "./Methodology";
import Pillars from "./Pillars";
import Scoreboard from "./Scoreboard";
import Scorecard from "./Scorecard";
import TheThesis from "./TheThesis";
import ThesisChart from "./ThesisChart";
import TopBar from "./TopBar";

const LIVE_POLL_MS = 60_000;
const HISTORY_POLL_MS = 15 * 60_000;

export default function Dashboard({
  initialLive,
  initialHistory,
  daily,
}: {
  initialLive: ThesisModel | null;
  initialHistory: HistoryPayload | null;
  daily: DailyDelta[];
}) {
  const [live, setLive] = useState(initialLive);
  const [history, setHistory] = useState(initialHistory);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [stale, setStale] = useState(false);
  const [pulse, setPulse] = useState(0);
  const mounted = useRef(true);

  const refreshLive = useCallback(async () => {
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as ThesisModel;
      if (!mounted.current) return;
      setLive(data);
      setStale(false);
      setPulse((n) => n + 1);
    } catch {
      if (mounted.current) setStale(true);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as HistoryPayload;
      if (mounted.current) setHistory(data);
    } catch {
      /* keep the series we already have */
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    // The server render can come back empty if an upstream was down at build
    // time. Recover on the next tick rather than inside the effect body.
    const recover = setTimeout(() => {
      if (!initialLive) void refreshLive();
      if (!initialHistory) void refreshHistory();
    }, 0);

    const liveTimer = setInterval(refreshLive, LIVE_POLL_MS);
    const histTimer = setInterval(refreshHistory, HISTORY_POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && void refreshLive();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mounted.current = false;
      clearTimeout(recover);
      clearInterval(liveTimer);
      clearInterval(histTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initialLive, initialHistory, refreshLive, refreshHistory]);

  if (!live) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <div className="text-[15px] font-medium">Live data is unavailable right now</div>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[var(--text-faint)]">
            An upstream source is not responding. Nothing is estimated in its place, so the page
            waits instead.
          </p>
          <button
            onClick={() => void refreshLive()}
            className="mt-4 rounded-md border px-3 py-1.5 text-[13px] transition-colors hover:bg-[var(--bg-hover)]"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <TopBar m={live} stale={stale} pulse={pulse} onOpenSnapshot={() => setSnapshotOpen(true)} />
      <main>
        <Hero m={live} onOpenSnapshot={() => setSnapshotOpen(true)} />
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-6 sm:gap-5 sm:px-6 sm:py-8">
          <TheThesis m={live} />
          <ThesisChart history={history} freeFloat={live.freeFloat} />
          <Scoreboard m={live} />
          <Pillars m={live} />
          <Scorecard m={live} />
          <DailyRecord rows={daily} />
          <FailureConditions m={live} />
          <Methodology m={live} />
        </div>
        <Footer m={live} />
      </main>
      <DayZeroSnapshot m={live} open={snapshotOpen} onClose={() => setSnapshotOpen(false)} />
    </>
  );
}

function Footer({ m }: { m: ThesisModel }) {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
        <p className="max-w-3xl text-[12px] leading-relaxed text-[var(--text-faint)]">
          A personal investment thesis, tracked in public. Not investment advice, not a
          solicitation, not affiliated with Venice AI. Every figure carries its source and the time
          it was read. Where no live source exists, the page says so.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[var(--text-dim)]">
          <a className="hover:text-[var(--text)]" href="https://venice.ai/token" target="_blank" rel="noreferrer">
            Venice token dashboard
          </a>
          <a className="hover:text-[var(--text)]" href="https://www.coingecko.com/en/coins/venice-token" target="_blank" rel="noreferrer">
            CoinGecko
          </a>
          <a className="hover:text-[var(--text)]" href="https://coinmarketcap.com/currencies/venice-token/" target="_blank" rel="noreferrer">
            CoinMarketCap
          </a>
          <a
            className="hover:text-[var(--text)]"
            href="https://basescan.org/token/0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf?a=0x0000000000000000000000000000000000000000"
            target="_blank"
            rel="noreferrer"
          >
            Burn transactions on Basescan
          </a>
          <span className="tnum ml-auto text-[var(--text-faint)]">
            Day {m.daysLive} since launch
          </span>
        </div>
      </div>
    </footer>
  );
}
