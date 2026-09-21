# Welcome to GitHub Desktop!

This is your README. READMEs are where you can communicate what your project is and how to use it.

Write your name on line 6, save it, and then head back to GitHub Desktop.
# Simp Bot Guide

Simp is a feature-rich Discord bot with economy, fun, moderation, backup, and owner-only management tools. The default prefix is `~`, and some help menus are also available through slash commands.

## What the bot includes

### Economy and progression
- `~coins` — check your balance or another member's balance
- `~paycoin` — send coins to another user
- `~coinflip` — challenge someone to a coin gamble
- `~usecoin` — gamble coins for bait/container rewards
- `~daily` — claim a daily reward
- `~dailystreak` — view streak and passive bonus details
- `~bounty` — check bounty balance
- `~bountyleaderboard` — view bounty rankings
- `~shop` — buy items from the bounty shop
- `~baits` — view your bait inventory
- `~openbait` — open bait containers
- `~snapshot` — export economy data to a JSON file

### Fun and themed commands
- `~roast @user` — roast another user
- `~rizz @user` — send a playful rizz line
- `~rizzline` — get a random rizz line
- `~roulette` — try a roulette-style bounty duel or gamble
- `~quests` — view daily and weekly quests
- `~sail` — a sailing/progression-style feature
- `~ping @user` — watch a user and make the bot ping them on message activity
- `~execute @user` — start a dramatic execution vote
- `~entry [message]` — owner-only dramatic entrance announcement

### Moderation and server safety
- `~ban` — ban a user
- `~kick` — kick a user
- `~mute` — mute a user
- `~timeout` — timeout a member
- `~softban` — softban a member
- `~unmute` — remove a mute or timeout
- `~warn` / `~warnings` — warn and review warnings
- `~purge` — bulk-delete recent messages
- `~lockchannel` — lock a channel
- `~lockdown` — activate a temporary lockdown state
- `~setnick` — set a nickname and prevent changes
- `~setprefix` — change the bot prefix
- `~noprefix` — disable prefix use in a server context
- `~antinuke` — configure anti-nuke protection

### Owner and admin tools
- `~backup` — create a backup of server roles/channels
- `~restore` — restore a saved backup
- `~givecoin` — grant coins to a user
- `~givecontainers` — give bait containers
- `~givebounty` — give bounty to a user
- `~bot status|enable|disable|shutdown` — control the bot runtime
- `~adminusage` — review recent admin command usage
- `~kingflex` — list owner-only commands

## Quick start
1. Install dependencies with `npm install`
2. Create a `.env` file with your bot token and owner settings
3. Register slash commands with `node deploy-commands.js`
4. Start the bot with `npm start`

## Help commands
- `~cmdhelp` or `~help` — main command hub
- `~funguide` — fun and One Piece-style guide
- `/cmdhelp` and `/funguide` — slash-command versions

## Economy guide
For a deeper explanation of the economy system, snapshot export flow, and reward systems, see `ECONOMY_GUIDE.md`.

## Notes
- The bot stores economy and moderation data locally and can export snapshot files to the `data` folder.
- Some commands are restricted to owners or staff members with the required permissions.
- The prefix can be customized, but `~` is the default.
# h
#