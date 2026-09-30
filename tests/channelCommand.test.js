const test = require('node:test');
const assert = require('node:assert/strict');
const { PermissionFlagsBits } = require('discord.js');
const channelCommand = require('../commands/channel');
const slashSchemas = require('../utils/slashCommandSchemas');
const { buildApplicationCommand } = require('../utils/applicationCommands');

test('channel command exposes rename usage and cr alias', () => {
  assert.equal(channelCommand.name, 'channel');
  assert.deepEqual(channelCommand.aliases, ['cr']);
  assert.equal(channelCommand.usage, '~channel rename <new-name> | ~cr <new-name>');
  assert.equal(slashSchemas.channel[0].choices[0], 'rename');
  assert.equal(buildApplicationCommand({ ...channelCommand }).data.toJSON().name, 'channel');
});

test('channel names are normalized and limited to Discord channel-name length', () => {
  assert.equal(channelCommand.normalizeChannelName('  My New Channel  '), 'my-new-channel');
  assert.equal(channelCommand.normalizeChannelName('---'), null);
  assert.equal(channelCommand.normalizeChannelName('a'.repeat(101)), 'a'.repeat(100));
});

test('channel rename calls setName when both user and bot have Manage Channels', async () => {
  const replies = [];
  const renamed = [];
  const message = {
    guild: { members: { me: { permissions: { has: (permission) => permission === PermissionFlagsBits.ManageChannels } } } },
    member: { permissions: { has: (permission) => permission === PermissionFlagsBits.ManageChannels } },
    author: { id: 'user-id' },
    channel: {
      setName: async (name) => renamed.push(name)
    },
    reply: async (content) => replies.push(content)
  };

  await channelCommand.execute(message, ['rename', 'New', 'Channel']);

  assert.deepEqual(renamed, ['new-channel']);
  assert.match(replies[0], /Channel renamed to `new-channel`/);
});

test('channel rename rejects users without Manage Channels', async () => {
  let renamed = false;
  let reply;
  const message = {
    guild: { members: { me: { permissions: { has: () => true } } } },
    member: { permissions: { has: () => false } },
    channel: { setName: async () => { renamed = true; } },
    reply: async (content) => { reply = content; }
  };

  await channelCommand.execute(message, ['rename', 'new-name']);

  assert.equal(renamed, false);
  assert.match(reply, /Manage Channels/);
});

test('cr alias renames directly without a rename subcommand', async () => {
  const renamed = [];
  const message = {
    commandName: 'cr',
    guild: { members: { me: { permissions: { has: () => true } } } },
    member: { permissions: { has: () => true } },
    channel: { setName: async (name) => renamed.push(name) },
    reply: async () => {}
  };

  await channelCommand.execute(message, ['New', 'Name']);

  assert.deepEqual(renamed, ['new-name']);
});