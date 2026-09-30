const test = require('node:test');
const assert = require('node:assert/strict');
const {
  LOVE_BAIT_USER_ID,
  OWNER_BAIT_DROP_CHANCE,
  LOVE_BAIT_DROP_CHANCE,
  COIN_DROP_CHANCE,
  isLoveBaitEligible,
  getRareBaitDrops
} = require('../utils/baitDrops');
const { openBait } = require('../commands/onepiece fun/openbait');
const { getFishingRewards } = require('../commands/onepiece fun/fish');
const { getSuccessRate } = require('../commands/onepiece fun/catch');

test('Love Bait is limited to the configured recipient and true owner', () => {
  assert.equal(isLoveBaitEligible(LOVE_BAIT_USER_ID, 'true-owner-id'), true);
  assert.equal(isLoveBaitEligible('true-owner-id', 'true-owner-id'), true);
  assert.equal(isLoveBaitEligible('another-user-id', 'true-owner-id'), false);
});

test('rare bait drop chances put Love Bait below the 0.1% Owner Bait chance', () => {
  assert.equal(OWNER_BAIT_DROP_CHANCE, 0.001);
  assert.equal(LOVE_BAIT_DROP_CHANCE, 0.0005);
  assert.equal(COIN_DROP_CHANCE, 0.001);

  const rareDrops = getRareBaitDrops(LOVE_BAIT_USER_ID, 'true-owner-id', () => 0.0004);
  assert.deepEqual(rareDrops.map((drop) => drop.type), ['owner_bait', 'love_bait']);

  const commonUserDrops = getRareBaitDrops('another-user-id', 'true-owner-id', () => 0.0004);
  assert.deepEqual(commonUserDrops.map((drop) => drop.type), ['owner_bait']);
});

test('rare bait drops respect the exact probability boundaries', () => {
  const rolls = [OWNER_BAIT_DROP_CHANCE, LOVE_BAIT_DROP_CHANCE];
  const drops = getRareBaitDrops(LOVE_BAIT_USER_ID, null, () => rolls.shift());
  assert.deepEqual(drops, []);
});

test('Love Bait can drop from containers and successful fishing rewards for eligible users only', () => {
  const containerRewards = openBait(LOVE_BAIT_USER_ID, 'true-owner-id', () => 0);
  assert.ok(containerRewards.some((reward) => reward.type === 'owner_bait'));
  assert.ok(containerRewards.some((reward) => reward.type === 'love_bait'));

  const fishingRewards = getFishingRewards('true-owner-id', 'true-owner-id', () => 0);
  assert.ok(fishingRewards.some((reward) => reward.type === 'love_bait'));

  const otherUserRewards = getFishingRewards('another-user-id', 'true-owner-id', () => 0);
  assert.ok(!otherUserRewards.some((reward) => reward.type === 'love_bait'));
});

test('Love Bait is an optional high-tier catch bait', () => {
  assert.equal(getSuccessRate('love_bait'), 0.25);
});