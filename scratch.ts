// (Don't commit — scratch only)
import { authorityPillar } from './src/lib/score/pillars/authority';
import { concentrationPillar } from './src/lib/score/pillars/concentration';
import { liquidityPillar } from './src/lib/score/pillars/liquidity';
import { deployerPillar } from './src/lib/score/pillars/deployer';
import { marketHealthPillar } from './src/lib/score/pillars/marketHealth';
import { authenticityPillar } from './src/lib/score/pillars/authenticity';
import { scoreToBucket } from './src/lib/score/buckets';

const FOUR_YEARS_MS = 4 * 365 * 24 * 60 * 60 * 1000;

console.log(authorityPillar({
  freezeAuthority: null, mintAuthority: null, mutableMetadata: false,
  transferFeeEnable: false, transferFeeBps: 0, nonTransferable: false,
  age: FOUR_YEARS_MS,
})); // → { points: 20, max: 20, flags: [] }

console.log(concentrationPillar({
  top10UserPercent: 0.12, top10HolderPercent: null,
})); // → { points: 20, max: 20, flags: [] }

console.log(liquidityPillar({
  lockInfo: { unlockTimestamp: Date.now() + 365 * 24 * 60 * 60 * 1000 },
  liquidity: 50_000_000, numberMarkets: 12,
})); // → { points: 20, max: 20, flags: [] }

const total =
  authorityPillar({ freezeAuthority: null, mintAuthority: null, mutableMetadata: false, transferFeeEnable: false, transferFeeBps: 0, nonTransferable: false, age: FOUR_YEARS_MS }).points +
  concentrationPillar({ top10UserPercent: 0.12, top10HolderPercent: null }).points +
  liquidityPillar({ lockInfo: { unlockTimestamp: Date.now() + 365e8 }, liquidity: 50_000_000, numberMarkets: 12 }).points +
  deployerPillar({ creatorPercentage: 0, ownerPercentage: 0, lockInfo: { unlockTimestamp: Date.now() + 365e8 }, age: FOUR_YEARS_MS }).points +
  marketHealthPillar({ liquidity: 50_000_000, holder: 800_000, priceChange24hPercent: 0.2, age: FOUR_YEARS_MS }).points +
  authenticityPillar({ fakeToken: false, jupStrictList: true, age: FOUR_YEARS_MS, uniqueWallet24h: 50_000, trade24h: 200_000 }).points;

console.log(`USDC-shaped synthetic score: ${total}/100 → ${scoreToBucket(total)}`);
// Expected: 100/100 → SAFE