const { EmbedBuilder } = require('discord.js');
const { ensureUser, ensureBaits, getBaits, addBait, addCoins, deductCoins, getUser } = require('../../database');

const DEFAULT_STAKE = 1;
const REWARD_TABLE = [
  { type: 'double', chance: 45 },
  { type: 'container', chance: 30 },
  { type: 'triple', chance: 20 },
  { type: 'nothing', chance: 5 }
];

function parseSpendAmount(input, currentCoins) {
  if (!input || typeof input !== 'string') return DEFAULT_STAKE;

  const normalized = input.replace(/,/g, '').trim().toLowerCase();
  if (!normalized) return DEFAULT_STAKE;
  if (normalized === 'all') return Math.max(1, currentCoins || 1);

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

function pickReward() {
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const entry of REWARD_TABLE) {
    cumulative += entry.chance;
    if (roll < cumulative) {
      return entry.type;
    }
  }

  return 'double';
}

function summarizeRewards(rewardTotals) {
  const lines = [];
  const rewardOrder = ['owner_bait', 'bait_containers', 'common_bait', 'uncommon_bait', 'rare_bait', 'epic_bait', 'legendary_bait', 'mythical_bait'];

  for (const rewardType of rewardOrder) {
    const amount = rewardTotals[rewardType] || 0;
    if (amount > 0) {
      lines.push(`• ${rewardType.replace('_', ' ').toUpperCase()} x${amount}`);
    }
  }

  return lines.length ? lines.join('\n') : '• No rewards';
}

module.exports = {
  name: 'usecoin',
  aliases: ['usecoins', 'coinbet'],
  description: 'Spend coins to gamble for random bait rewards with owner bait as the rarest prize and 30% bait container chance',
  usage: '~usecoin [amount|all]',

  async execute(message, args) {
    try {
      await ensureUser(message.author.id);
      const user = await getUser(message.author.id);
      const currentCoins = user?.coins || 0;
      const totalCost = parseSpendAmount(args[0], currentCoins);

      if (totalCost === null) {
        return message.reply('❌ Please provide a valid amount of coins to gamble, or use `all`.');
      }

      if (currentCoins < totalCost) {
        return message.reply(`❌ You only have ${currentCoins.toLocaleString()} coins, but this would cost ${totalCost.toLocaleString()} coins.`);
      }

      await deductCoins(message.author.id, totalCost, 'usecoin_gamble');

      const outcome = pickReward();
      let rewardText = 'No reward';
      let rewardCoins = 0;
      let containerReward = 0;

      if (outcome === 'double') {
        rewardCoins = totalCost * 2;
        await addCoins(message.author.id, rewardCoins, 'usecoin_double');
        rewardText = `💰 Double! You won ${rewardCoins.toLocaleString()} coins.`;
      } else if (outcome === 'triple') {
        rewardCoins = totalCost * 3;
        await addCoins(message.author.id, rewardCoins, 'usecoin_triple');
        rewardText = `💰 Triple! You won ${rewardCoins.toLocaleString()} coins.`;
      } else if (outcome === 'container') {
        await ensureBaits(message.author.id);
        await addBait(message.author.id, 'bait_containers', 1);
        containerReward = 1;
        rewardText = '🎣 Container! You won 1 bait container.';
      }

      const updatedUser = await getUser(message.author.id);
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎲 Coin Gamble Result')
        .setDescription(`You spent ${totalCost.toLocaleString()} coins and got: ${rewardText}`)
        .addFields(
          { name: 'Coins Left', value: `${(updatedUser?.coins || 0).toLocaleString()}`, inline: true },
          { name: 'Stake', value: `${totalCost.toLocaleString()} coins`, inline: true },
          { name: 'Odds', value: 'Double 45% • Container 30% • Triple 20% • Nothing 5%', inline: false }
        )
        .setFooter({ text: 'Use ~usecoin [amount|all] to gamble more coins.' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await message.reply('❌ An error occurred while gambling your coins.');
    }
  }
};

module.exports.REWARD_TABLE = REWARD_TABLE;
module.exports.parseRollCount = parseSpendAmount;
module.exports.parseSpendAmount = parseSpendAmount;
module.exports.pickReward = pickReward;
module.exports.DEFAULT_STAKE = DEFAULT_STAKE;
