const { Plugin } = require('powercord/entities');
const { getModule, getModuleByDisplayName } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

module.exports = class GhostBuster extends Plugin {
  async startPlugin () {
    this.messages = [];

    const { isMentioned } = await getModule([ 'isMentioned' ]);
    const { getCurrentUser } = await getModule([ 'getCurrentUser' ]);
    const Message = await getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM);
   	const Author = await getModule(m => m.prototype && m.prototype.getAvatarURL && m.prototype.isStaff);
		const Timestamp = await getModule(m => m.prototype && m.prototype.add && m.prototype.toDate);

    // Thanks Joakim!
    const mdl = await getModule([ 'shouldNotify' ]);
    inject('ghostbuster-shouldNotify', mdl, 'shouldNotify', (args, res) => {
      const self = getCurrentUser();
      const message = args[0];

      if (self.id !== message.author.id && isMentioned(self.id, message.channel_id, null, message.content, null, true)) {
				message.timestamp = new Timestamp(message.timestamp);
				message.author = new Author(message.author);
				this.messages.push(new Message(message));
			}

      return res;
    });

		const _this = this;
		const MessagesPopout = getModule(m => m.default?.displayName === 'MessagesPopout', false);
		inject('ghostbuster-render', MessagesPopout, 'default', function (args) {
				if (args[0].analyticsName === 'Recent Mentions') {
					if (args[0].messages) {
						args[0].messages = args[0].messages
							.concat(_this.messages)
							.filter((value, index, self) => self.findIndex(v => v.id === value.id) === index)
							.sort((msg, prev) => prev.timestamp._d - msg.timestamp._d);
					} else {
						args[0].messages = _this.messages;
					}
				}

      return args;
    }, true);
  }

  pluginWillUnload () {
    uninject('ghostbuster-shouldNotify');
    uninject('ghostbuster-render');
  }
};
