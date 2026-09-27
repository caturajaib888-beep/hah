const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig } = require('../../database');
const { authorizeOwnerCommand } = require('../../utils/owner');

function normalizeCommandName(name) {
  return String(name || '')
    .trim()
    .replace(/^[/~\\]+/, '')
    .replace(/^[^a-z0-9_-]+/i, '')
    .toLowerCase();
}

function getTargetCommand(clientOrMessage, name) {
  const source = clientOrMessage?.client || clientOrMessage;
  const rawName = String(name || '');
  if (!rawName.trim()) return null;

  const candidates = new Set();
  const normalized = normalizeCommandName(rawName);
  candidates.add(normalized);
  candidates.add(rawName.trim().toLowerCase());
  candidates.add(rawName.trim().replace(/^[/~\\]+/, '').toLowerCase());

  for (const candidate of candidates) {
    if (!candidate) continue;
    const command = source?.commands?.get(candidate)
      || source?.slashCommands?.get(candidate)
      || [...(source?.commands?.values?.() || [])].find((entry) => entry?.name && entry.name.toLowerCase() === candidate)
      || [...(source?.slashCommands?.values?.() || [])].find((entry) => entry?.name && entry.name.toLowerCase() === candidate);
    if (command && command.name) return command;
  }

  return null;
}

module.exports = {
  name: 'disable',
  aliases: ['enable'],
  description: 'Enable or disable a command globally',
  ownerOnly: true,
  usage: '~disable <command> | ~enable <command>',
  requiredPermissions: [PermissionFlagsBits.ManageGuild],

  getTargetCommand,

  async execute(message, args) {
    if (!(await authorizeOwnerCommand(message, { commandName: args[0] === 'enable' ? 'enable' : 'disable', requiredPermissions: [PermissionFlagsBits.ManageGuild], requireApproval: true }))) {
      return;
    }

    const action = message.commandName?.toLowerCase()
      || message.content?.trim().split(/\s+/)[0]?.slice((message.client?.prefix || '~').length).toLowerCase();
    const target = getTargetCommand(message.client, args[0]);
    const targetName = normalizeCommandName(args[0]);
    const enabled = action === 'enable';

    if (!target || ['disable', 'enable'].includes(targetName)) {
      return message.reply('❌ Usage: `~disable <command>` or `~enable <command>`');
    }

    const key = `command_disabled:${target.name}`;
    const isDisabled = (await getConfig(key)) === 'true';
    if (enabled === !isDisabled) {
      return message.reply(`❌ The \`${target.name}\` command is already ${enabled ? 'enabled' : 'disabled'}.`);
    }

    await setConfig(key, enabled ? 'false' : 'true');
    const embed = new EmbedBuilder()
      .setColor(enabled ? '#00FF00' : '#FF4500')
      .setTitle(enabled ? '✅ Command Enabled' : '⛔ Command Disabled')
      .setDescription(`The \`${target.name}\` command is now **${enabled ? 'enabled' : 'disabled'}**.`)
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  }
};