const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig } = require('../../database');
const { authorizeOwnerCommand } = require('../../utils/owner');

function getTargetCommand(message, name) {
  const targetName = String(name || '').toLowerCase();
  const command = message.client?.commands?.get(targetName);
  return command && command.name ? command : null;
}

module.exports = {
  name: 'disable',
  aliases: ['enable'],
  description: 'Enable or disable a command globally',
  ownerOnly: true,
  usage: '~disable <command> | ~enable <command>',
  requiredPermissions: [PermissionFlagsBits.ManageGuild],

  async execute(message, args) {
    if (!(await authorizeOwnerCommand(message, { commandName: args[0] === 'enable' ? 'enable' : 'disable', requiredPermissions: [PermissionFlagsBits.ManageGuild], requireApproval: true }))) {
      return;
    }

    const action = message.commandName?.toLowerCase()
      || message.content?.trim().split(/\s+/)[0]?.slice((message.client?.prefix || '~').length).toLowerCase();
    const target = getTargetCommand(message, args[0]);
    const targetName = String(args[0] || '').toLowerCase();
    const enabled = action === 'enable';

    if (!target || ['disable', 'enable'].includes(targetName)) {
      return message.reply('❌ Usage: `~disable <command>` or `~enable <command>`');
    }

    const key = `command_disabled:${target.name}`;
    const isDisabled = (await getConfig(key)) === 'true';
    if (enabled === !isDisabled) {
      return message.reply(`❌ The \\`${target.name}\\` command is already ${enabled ? 'enabled' : 'disabled'}.`);
    }

    await setConfig(key, enabled ? 'false' : 'true');
    const embed = new EmbedBuilder()
      .setColor(enabled ? '#00FF00' : '#FF4500')
      .setTitle(enabled ? '✅ Command Enabled' : '⛔ Command Disabled')
      .setDescription(`The \\`${target.name}\\` command is now **${enabled ? 'enabled' : 'disabled'}**.`)
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  }
};