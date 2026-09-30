const LOVE_BAIT_USER_ID = '1364628748695240847';
const OWNER_BAIT_DROP_CHANCE = 0.001;
const LOVE_BAIT_DROP_CHANCE = 0.0005;
const COIN_DROP_CHANCE = 0.001;

function isLoveBaitEligible(userId, trueOwnerId) {
  const normalizedUserId = String(userId || '');
  return normalizedUserId === LOVE_BAIT_USER_ID || Boolean(trueOwnerId && normalizedUserId === String(trueOwnerId));
}

function getRareBaitDrops(userId, trueOwnerId, random = Math.random) {
  const drops = [];
  if (random() < OWNER_BAIT_DROP_CHANCE) {
    drops.push({ type: 'owner_bait', chance: OWNER_BAIT_DROP_CHANCE });
  }
  if (isLoveBaitEligible(userId, trueOwnerId) && random() < LOVE_BAIT_DROP_CHANCE) {
    drops.push({ type: 'love_bait', chance: LOVE_BAIT_DROP_CHANCE });
  }
  return drops;
}

module.exports = {
  LOVE_BAIT_USER_ID,
  OWNER_BAIT_DROP_CHANCE,
  LOVE_BAIT_DROP_CHANCE,
  COIN_DROP_CHANCE,
  isLoveBaitEligible,
  getRareBaitDrops
};