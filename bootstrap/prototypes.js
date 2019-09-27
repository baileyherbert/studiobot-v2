const { Message, Guild, GuildMember } = require('discord.js');

// String
String.prototype.equalsIgnoreCase = function(o) { return o.toLowerCase() == this.toLowerCase(); }
String.prototype.equals = function(o) { return o == this; }
String.prototype.capitalize = function() { return this.charAt(0).toUpperCase() + this.slice(1); }

// Messages (discord.js)
Message.prototype.deleteAfter = function(ms) { setTimeout(() => this.delete().catch(err => {}), ms); }
Message.prototype.reactCustom = (async function(emoji) {
    let client = require('@core/framework').Framework.getClient();
    let matches = /<:.+:(\d+)>/.exec(emoji);

    if (matches) {
        let id = matches[1];
        let emoji = client.emojis.get(id);

        return await this.react(emoji);
    }

    throw new Error('No known custom emoji "' + emoji + '".');
});

// Guilds (discord.js)
Guild.prototype.getDefaultChannel = (function() {
    let channels = this.channels.array();
    let user = require('@core/framework').Framework.getClient().user;

    if (this.systemChannel && this.systemChannel.permissionsFor(user).has('SEND_MESSAGES') && this.systemChannel.permissionsFor(user).has('READ_MESSAGES')) {
        return this.systemChannel;
    }

    for (let i = 0; i < channels.length; i++) {
        let channel = channels[i];

        if (channel.type == 'text' && channel.permissionsFor(user).has('SEND_MESSAGES') && channel.permissionsFor(user).has('READ_MESSAGES')) {
            return channel;
        }
    }

    return undefined;
});

Guild.prototype.load = (async function() {
    if (!this.settings) {
        let { GuildBucket } = require('@libraries/database/guild');
        this.settings = new GuildBucket(this.id);
        await this.settings.load();
    }

    await this.settings.wait();
});

GuildMember.prototype.load = (async function() {
    if (!this.settings) {
        let { MemberBucket } = require('@libraries/database/member');
        this.settings = new MemberBucket(this.id, this.guild.id);
        await this.settings.load();
    }

    await this.settings.wait();
    await this.guild.load();
});
