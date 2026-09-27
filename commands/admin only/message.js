const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { authorizeOwnerCommand } = require('../../utils/owner');

function parseRelativeDurationToMs(value) {
  const match = String(value || '').trim().toLowerCase().match(/^([0-9]+)\s*(ms|millisecond|milliseconds|s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const unitMs = {
    ms: 1,
    millisecond: 1,
    milliseconds: 1,
    s: 1000,
    sec: 1000,
    secs: 1000,
    second: 1000,
    seconds: 1000,
    m: 60 * 1000,
    min: 60 * 1000,
    mins: 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    h: 60 * 60 * 1000,
    hr: 60 * 60 * 1000,
    hrs: 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000
  }[unit];

  if (!unitMs) return null;
  return amount * unitMs;
}

function parseAbsoluteTime(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) return date.getTime();

  const timeOnly = trimmed.match(/^([0-1]?\d|2[0-3]):([0-5]\d)(?:\s*(am|pm))?$/i);
  if (timeOnly) {
    const now = new Date();
    const hours = Number(timeOnly[1]);
    const minutes = Number(timeOnly[2]);
    const isPm = /^pm$/i.test(timeOnly[3] || '');
    const resolvedHours = isPm && hours !== 12 ? hours + 12 : !isPm && hours === 12 ? 0 : hours;
    const scheduled = new Date(now);
    scheduled.setHours(resolvedHours, minutes, 0, 0);
    if (scheduled.getTime() <= now.getTime()) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    return scheduled.getTime();
  }

  return null;
}

function parseScheduledMessage(args) {
  if (!Array.isArray(args) || args.length < 3) return null;

  const first = String(args[0] || '').trim();
  const userId = first.match(/^<@!?([0-9]+)>$/)?.[1] || first.replace(/[^0-9]/g, '');
  if (!userId) return null;

  const possibleTimeCandidates = [
    String(args[args.length - 1] || '').trim(),
    args.length >= 4 ? `${String(args[args.length - 2] || '').trim()} ${String(args[args.length - 1] || '').trim()}` : ''
  ].filter(Boolean);

  let selectedTime = null;
  let content = '';

  for (const candidate of possibleTimeCandidates) {
    const relativeMs = parseRelativeDurationToMs(candidate);
    if (relativeMs !== null) {
      selectedTime = { type: 'relative', value: Date.now() + relativeMs };
      content = args.slice(1, args.length - 1).join(' ').trim();
      break;
    }

    const absoluteMs = parseAbsoluteTime(candidate);
    if (absoluteMs !== null) {
      selectedTime = { type: 'absolute', value: absoluteMs };
      content = args.length >= 4
        ? args.slice(1, args.length - 2).join(' ').trim()
        : args.slice(1, args.length - 1).join(' ').trim();
      break;
    }
  }

  if (!selectedTime || !content) return null;
  if (selectedTime.value <= Date.now()) return null;

  return { userId, content, sendAtMs: selectedTime.value };
}

module.exports = {
  name: 'message',
  aliases: ['msg'],
  description: 'Schedule a direct message to a user at a later time',
  usage: '~message <@user> <content> <time>',
  requiredPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('message')
    .setDescription('Schedule a direct message to a user at a later time')
    .addUserOption((option) => option
      .setName('user')
      .setDescription('User to receive the message')
      .setRequired(true))
    .addStringOption((option) => option
      .setName('content')
      .setDescription('Message to send privately')
      .setRequired(true))
    .addStringOption((option) => option
      .setName('time')
      .setDescription('When to send it, such as 10m or 2026-09-27 18:00')
      .setRequired(true)),

  parseScheduledMessage,

  async execute(message, args = []) {
    if (message?.isChatInputCommand?.()) {
      const user = message.options.getUser('user');
      const content = message.options.getString('content');
      const time = message.options.getString('time');
      if (!message.deferred && !message.replied) await message.deferReply({ ephemeral: true });

      if (!(await authorizeOwnerCommand(message, { commandName: 'message', requiredPermissions: [PermissionFlagsBits.ManageGuild], requireApproval: true }))) {
        return;
      }

      const parsed = parseScheduledMessage([`<@${user.id}>`, ...String(content).trim().split(/\s+/), String(time).trim()]);
      if (!parsed) {
        return message.editReply('❌ Usage: `/message user:@user content:"message" time:"10m"`\nExamples: `/message user:@User content:"hello" time:"10m"` or `/message user:@User content:"hello" time:"2026-09-27 18:00"`');
      }

      const target = user;
      const delayMs = Math.max(0, parsed.sendAtMs - Date.now());
      setTimeout(async () => {
        try {
          await target.send({ content: parsed.content });
        } catch (error) {
          console.error(`Failed to send scheduled DM to ${target.id}:`, error);
        }
      }, delayMs);

      return message.editReply(`✅ Scheduled a message to ${target} for ${new Date(parsed.sendAtMs).toLocaleString()}.`);
    }

    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }

    if (!(await authorizeOwnerCommand(message, { commandName: 'message', requiredPermissions: [PermissionFlagsBits.ManageGuild], requireApproval: true }))) {
      return;
    }

    const parsed = parseScheduledMessage(args);
    if (!parsed) {
      return message.reply('❌ Usage: `~message <@user> <content> <time>`\nExamples: `~message @User hello 10m` or `~message @User hello 2026-09-27 18:00`');
    }

    const target = message.mentions?.members?.first()?.user
      || message.guild.members.cache.get(parsed.userId)?.user
      || await message.client.users.fetch(parsed.userId).catch(() => null);

    if (!target) {
      return message.reply('❌ I could not find that user in this server or as a valid Discord user.');
    }

    const delayMs = Math.max(0, parsed.sendAtMs - Date.now());
    setTimeout(async () => {
      try {
        await target.send({ content: parsed.content });
      } catch (error) {
        console.error(`Failed to send scheduled DM to ${target.id}:`, error);
      }
    }, delayMs);

    return message.reply(`✅ Scheduled a message to ${target} for ${new Date(parsed.sendAtMs).toLocaleString()}.`);
  }
};
