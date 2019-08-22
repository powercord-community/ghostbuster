const { Plugin } = require('powercord/entities');
const { getModule, getModuleByDisplayName } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

module.exports = class GhostBuster extends Plugin {
  async startPlugin () {
    this.messages = [];

    const { isMentioned } = await getModule([ 'isMentioned' ]);
    const { getCurrentUser } = await getModule([ 'getCurrentUser' ]);
    const { create: createMessage } = await getModule(m => m.prototype && m.prototype.updateMessage);

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
    const MessagesPopout = (await getModuleByDisplayName('FluxContainer(MessagesPopout)'));
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

  pluginWillUnload () {
    uninject('ghostbuster-shouldNotify');
    uninject('ghostbuster-render');
  }
};
