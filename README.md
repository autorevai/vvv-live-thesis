# VVV Live Thesis

A public, falsifiable investment thesis on Venice AI's VVV token, tracked live
against a frozen Day 0 baseline of **August 29, 2026**.

## The question

Can Venice's growth, its programmatic buy-and-burn, and staking that locks
supply away carry a ~13.9M VVV free float toward the valuations of TAO, ZEC,
NEAR, and the private AI infrastructure companies?

## What is live

| Metric | Source | Refresh |
|---|---|---|
| VVV, TAO, ZEC, NEAR price and market cap | CoinGecko | 60s |
| VVV circulating, total supply, total staked | `api.venice.ai/api/v1/vvv/stats` | 60s |
| Burned VVV, sVVV supply, DIEM supply | Base mainnet contracts | 5 min |
| Daily history since July 1, 2026 | CoinGecko market chart range | 15 min |

Business metrics (ARR, users, API calls, tokens processed) have no live feed.
They are stored as point-in-time disclosures with a verification date and are
never interpolated.

## Key definitions

```
free_float      = venice_circulating_supply - sVVV_total_supply
free_float_cap  = vvv_price * free_float
implied_price   = comparator_valuation / free_float
multiple        = comparator_valuation / free_float_cap
```

Free float is not conventional market cap. Venice's `totalStaked` covers both
plain staking and DIEM locking, so subtracting it leaves the supply that can
actually be sold today.

Burned VVV is `balanceOf(0x0)` on the VVV contract. Venice sends bought-back
tokens there rather than destroying them, so the ERC-20 `totalSupply` still
counts them while Venice's reported total supply nets them out.

## Daily snapshots

`.github/workflows/snapshot.yml` runs `scripts/snapshot.mjs` twice a day (the
second run is a no-op once the day is recorded) and commits one file to
`data/snapshots/`. Existing files are never overwritten, so the commit history
is the audit trail. Pushes to `main` deploy automatically, which is how a new
snapshot reaches the site.

There is no database. The chart's daily history comes from CoinGecko, and the
Venice-specific series is these committed files.

```sh
npm run snapshot   # record today locally and rebundle
```

## Day 0 is immutable

The baseline lives in `src/lib/constants.ts`. It is never edited after launch,
and its history is public:

```sh
git log --follow -p src/lib/constants.ts
```

`DAY_ZERO_ONCHAIN` records Base block 50,586,127, the first block at or after
2026-08-29T00:00:00Z. Anyone with an archive node can reproduce the burned and
sVVV figures from it.

## Contracts (Base mainnet)

| Asset | Address |
|---|---|
| VVV | `0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf` |
| DIEM | `0xF4d97F2da56e8c3098f3a8D538DB630A2606a024` |
| Staking (sVVV) | `0x321b7ff75154472B18EDb199033fF4D116F340Ff` |

## Local development

```sh
npm install
cp .env.example .env.local   # add a CoinGecko key
npm run dev -- -H 127.0.0.1 -p 3000
```

## Disclaimer

Not investment advice. Not affiliated with Venice AI. Comparator levels are
valuation equivalence exercises and imply no ownership, cash-flow, or legal
claim on the compared companies or protocols.
