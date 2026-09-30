const { PermissionFlagsBits } = require('discord.js');

function normalizeChannelName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || null;
}

module.exports = {
  name: 'channel',
  aliases: ['cr'],
  description: 'Rename the current channel',
  usage: '~channel rename <new-name> | ~cr <new-name>',
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  normalizeChannelName,

  async execute(message, args = []) {
    if (!message.guild || !message.channel) {
      return message.reply('❌ This command can only be used in a server channel.');
    }

    const invokedAsAlias = String(message.commandName || '').toLowerCase() === 'cr';
    const action = String(args[0] || '').toLowerCase();
    if (!invokedAsAlias && action !== 'rename') {
      return message.reply('❌ Usage: `~channel rename <new-name>`.');
    }

    const nameArgs = invokedAsAlias
      ? action === 'rename' ? args.slice(1) : args
      : args.slice(1);
    const newName = normalizeChannelName(nameArgs.join(' '));
    if (!newName) {
      return message.reply('❌ Provide a valid new channel name.');
    }

    if (!message.member?.permissions?.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('❌ You need the Manage Channels permission to rename this channel.');
    }

    if (!message.guild.members.me?.permissions?.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('❌ I need the Manage Channels permission to rename this channel.');
    }

    if (typeof message.channel.setName !== 'function') {
      return message.reply('❌ This channel cannot be renamed.');
    }

    try {
      await message.channel.setName(newName, `Channel renamed by ${message.author?.tag || message.author?.id || 'user'}`);
      return message.reply(`✅ Channel renamed to \`${newName}\`.`);
    } catch (error) {
      console.error('Failed to rename channel:', error);
      return message.reply('❌ Failed to rename this channel. Check my permissions and try again.');
    }
  }
};