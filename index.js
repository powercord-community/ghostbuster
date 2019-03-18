const Plugin = require('powercord/Plugin');

const { getModule, getModuleByDisplayName } = require('powercord/webpack');
const { create: createMessage } = getModule(m => m.prototype && m.prototype.updateMessage);

const { inject, uninject } = require('powercord/injector');

const { isMentioned } = getModule([ 'isMentioned' ]);
const { getCurrentUser } = getModule([ 'getCurrentUser' ]);

module.exports = class GhostBuster extends Plugin {
  async start () {
    this.messages = [];

    // Thanks Joakim!
    const mdl = await getModule([ 'shouldNotify' ]);
    inject('ghostbuster-shouldNotify', mdl, 'shouldNotify', (args, res) => {
      const self = getCurrentUser();
      const message = args[0];

      if (self.id !== message.author.id && isMentioned(message, self.id, true)) {
        this.messages.push(createMessage(message));
      }

      return res;
    });

    const _this = this;
    const MessagesPopout = await getModuleByDisplayName('MessagesPopout');
    inject('ghostbuster-render', MessagesPopout.prototype, 'render', function (args) {
      if (this.props.analyticsName === 'Recent Mentions') {
        if (this.props.messages) {
          this.props.messages = this.props.messages
            .concat(_this.messages)
            .filter((value, index, self) => self.findIndex(v => v.id === value.id) === index)
            .sort((msg, prev) => prev.timestamp._d - msg.timestamp._d);
        } else {
          this.props.messages = _this.messages;
        }
      }

      return args;
    }, true);
  }

  unload () {
    uninject('ghostbuster-shouldNotify');
    uninject('ghostbuster-render');
  }
};
