const Plugin = require('powercord/Plugin');
const { getModule, instance } = require('powercord/webpack');
const { create: createMessage } = getModule(m => m.prototype && m.prototype.updateMessage);
const { exports: MessagesPopout } = instance.cache[6356];

module.exports = class GhostBuster extends Plugin {
  async start () {
    this.messages = [];

    const mdl = getModule(['makeTextChatNotification']);
    mdl.shouldNotify = (_shouldNotify => (...args) => {
      const wasMentioned = _shouldNotify(...args);
      if (wasMentioned) {
        this.messages.push(createMessage(args[0]));
      } 
      return wasMentioned;
    })(mdl.shouldNotify);

    const _this = this;
    MessagesPopout.prototype.render = (_render => function(...args) {
      if (this.props.analyticsName === 'Recent Mentions') {
        if (this.props.messages) {
          this.props.messages = this.props.messages
            .concat(_this.messages)
            .sort((msg, prev) => prev.timestamp._d - msg.timestamp._d)
            .reduce((prev, curr) => prev.find(a => a.id === curr.id) ? prev : prev.push(curr) && prev, [])
        } else {
          this.props.messages = _this.messages;
        }
      }
      return _render.call(this, ...args);
    })(MessagesPopout.prototype.render);
  }
};
