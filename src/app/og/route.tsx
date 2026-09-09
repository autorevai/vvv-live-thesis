import { ImageResponse } from "next/og";
import { getQuotes } from "@/lib/sources/coingecko";
import { getChainState } from "@/lib/sources/chain";
import { getVeniceStats } from "@/lib/sources/venice";
import { buildThesis } from "@/lib/thesis";
import { DAY_ZERO_LABEL } from "@/lib/constants";

export const runtime = "nodejs";
export const revalidate = 300;

const BG = "#08090a";
const FG = "#ececed";
const DIM = "#9ba1a6";
const LINE = "#1e2225";
const POS = "#2ecc82";
const NEG = "#f4585c";
const ACCENT = "#5b9dff";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "vvv-live-thesis.vercel.app")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

export async function GET() {
  let stats: {
    price: string;
    cap: string;
    tao: string;
    grade: string;
    good: boolean;
    ret: string;
    float: string;
  };

  try {
    const [chain, venice] = await Promise.all([getChainState(300), getVeniceStats(300)]);
    const quotes = await getQuotes(venice, 300);
    const m = buildThesis(quotes, chain, venice);
    stats = {
      price: "$" + m.price.toFixed(2),
      cap: "$" + (m.freeFloatCap / 1e6).toFixed(0) + "M",
      tao: m.taoMultiple.toFixed(1) + "x",
      grade: m.overall.label,
      good: m.overall.grade !== "weakening",
      ret: (m.vvvReturn > 0 ? "+" : "") + m.vvvReturn.toFixed(0) + "%",
      float: (m.freeFloat / 1e6).toFixed(2) + "M",
    };
  } catch {
    stats = {
      price: "—",
      cap: "—",
      tao: "—",
      grade: "Live data unavailable",
      good: true,
      ret: "—",
      float: "—",
    };
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          color: FG,
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: POS }} />
          <div style={{ fontSize: 22, letterSpacing: 3, color: DIM, fontWeight: 600 }}>
            VVV LIVE THESIS
          </div>
          <div style={{ fontSize: 20, color: "#6b7176", marginLeft: 8 }}>
            {`Day 0 · ${DAY_ZERO_LABEL}`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
          <div style={{ fontSize: 108, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
            {stats.price}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 16 }}>
            <div
              style={{
                fontSize: 34,
                fontWeight: 600,
                color: stats.ret.startsWith("-") ? NEG : POS,
              }}
            >
              {`${stats.ret} since Day 0`}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 26,
                fontWeight: 600,
                color: stats.good ? POS : NEG,
                background: stats.good ? "rgba(46,204,130,0.12)" : "rgba(244,88,92,0.12)",
                padding: "8px 16px",
                borderRadius: 10,
              }}
            >
              {stats.grade}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 1, marginTop: "auto", background: LINE, borderRadius: 14 }}>
          {[
            { k: "FREE-FLOAT CAP", v: stats.cap },
            { k: "FREE FLOAT", v: stats.float + " VVV" },
            { k: "TO TAO PARITY", v: stats.tao },
          ].map((t, i) => (
            <div
              key={t.k}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                background: "#0d0f11",
                padding: "24px 28px",
                borderTopLeftRadius: i === 0 ? 14 : 0,
                borderBottomLeftRadius: i === 0 ? 14 : 0,
                borderTopRightRadius: i === 2 ? 14 : 0,
                borderBottomRightRadius: i === 2 ? 14 : 0,
              }}
            >
              <div style={{ fontSize: 19, color: "#6b7176", letterSpacing: 1 }}>{t.k}</div>
              <div style={{ fontSize: 40, fontWeight: 650, marginTop: 8 }}>{t.v}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 22,
            fontSize: 20,
          }}
        >
          <div style={{ display: "flex", color: DIM }}>
            {"Tracked live vs TAO · ZEC · NEAR · OpenRouter · Baseten · Fireworks"}
          </div>
          <div style={{ display: "flex", color: ACCENT }}>{SITE}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
