const Plugin = require('powercord/Plugin');

const { getModule, getModuleByDisplayName } = require('powercord/webpack');
const { create: createMessage } = getModule(m => m.prototype && m.prototype.updateMessage);

const MessagesPopout = getModuleByDisplayName('MessagesPopout');

const { inject, uninject } = require('powercord/injector');

const { isMentioned } = getModule([ 'isMentioned' ]);
const { getCurrentUser } = getModule([ 'getCurrentUser' ]);

module.exports = class GhostBuster extends Plugin {
  async start () {
    this.messages = [];

    // Thanks Joakim!
    const mdl = getModule([ 'shouldNotify' ]);
    inject('ghostbuster-shouldNotify', mdl, 'shouldNotify', (args, res) => {
      const current = getCurrentUser();
      const message = args[0];

      if (current.id !== message.author.id && isMentioned(message, current.id, true)) {
        this.messages.push(createMessage(message));
      }

      return res;
    });

    const _this = this;
    MessagesPopout.prototype.render = (_render => function (...args) { // eslint-disable-line func-names
      if (this.props.analyticsName === 'Recent Mentions') {
        if (this.props.messages) {
          this.props.messages = this.props.messages
            .concat(_this.messages)
            .filter((value, index, array) => array.findIndex(v => v.id === value.id) === index)
            .sort((msg, prev) => prev.timestamp._d - msg.timestamp._d);
        } else {
          this.props.messages = _this.messages;
        }
      }

      return _render.call(this, ...args);
    })(MessagesPopout.prototype.render);
  }

  unload () {
    uninject('ghostbuster-shouldNotify');
  }
};
