process.on("uncaughtException", console.log);
 module.exports = class Command {
  constructor(client, config, functions) {
    this.command = [];
    this.schedule = [];
    this.global = [];
    this.tags = {};
    this.client = client;
    this.functions = functions;
    this.config = config;
  }

  on(command,
    tags,
    callback,
    opt = {}) {
    let _command = command.map(tr => tr instanceof RegExp? tr: new RegExp(`^(${functions.parseRegex(tr)})`, 'i'))
    let ev = {
      command: command.map(tr => tr.toString()),
      enable: true,
      _command,
      callback,
      tags,
      info: 'Tidak Ada Info',
      prefix: true,
      name: command[0].toString(),
      type: 'command',
      ...opt
    }

    for (let a of tags) {
      this.tags[a] = this.tags[a] ? this.tags[a]: [];
      this.tags[a].push(ev)
    }
    ev.index = this[ev.type].length
    this[ev.type].push(ev);
    this.functions.logLoading(`Loading Event|Command ${ev.type} ${ev.name}`);
  }

  get(method) {
    let data = {};
    const commands = []
    this.prefix = this.config.prefix.map(tr => tr instanceof RegExp? tr: new RegExp(`^(${functions.parseRegex(tr)})`, 'i'))
    for (let event of this.command) {
      let prefix;
      if (!event.enable) continue;
      if (event.prefix) {
        prefix = typeof event.prefix == 'boolean' ? this.prefix.filter(tr => tr.test(method)).sort((a, b) => b.toString().length - a.toString().length)[0]: event.prefix.filter(tr => (new RegExp(functions.parseRegex(tr), 'i')).test(method)).sort((a, b) => b.toString().length - a.toString().length)[0]
      } else {
        prefix = /^()/i;
      }
      if (!prefix) continue;
      let noprefix_ori = method.replace(prefix, '')
let noprefix = noprefix_ori.toLowerCase()
      let command = event._command.filter(tr => tr.test(noprefix)).sort((a, b) => b.toString().length - a.toString().length)[0]
      if (!command) continue;
      commands.push({
        ...event, noprefix_ori, noprefix, prefix, length: command.toString().length, matched: command
      })
    }
    if (commands.length == 0) return {}
    data.event = commands.sort((tr, rt) => rt.length - tr.length)[0]
    data.query = data.event.noprefix_ori.replace(data.event.matched, '').trim()
    data.command = data.event.noprefix.replace(data.query.toLowerCase(), '').trim().toLowerCase()
    data.urls = functions.isUrl(method)
    data.text = method
    data.prefix = method.toLowerCase().split(data.command)[0]
    data.modify = (obj) => {
      this.command[data.index] = {
        ...this.command[data.event.index],
        ...obj
      }
      return this.command[data.index]
    }
if (data.event.sensitive  && data.text.split(" ")[0].toLowerCase() !== data.prefix + data.command.toLowerCase()){
return {}
}
    return data
  }

  async action(method, response, msg = {}) {
    if (typeof method !== 'function') {
      let resultResponse = typeof method == 'boolean'?this.config.response[response]: method
      if (resultResponse == '--noresp') return 403
      await this.client.reply(msg, resultResponse);
      return 403
    } else {
      return await method(this.client, msg) || 403
    }
  }
  async forbidden(msg, event) {
    let ev = event.event
    if (!msg.isGroup && ev.group) return this.action(ev.group, 'group', msg)
    if (ev._media && !msg.isMedia && (!msg.quotedMsg && !msg.quotedMsg.isMedia)) return cmd.action(ev._media,'_media',msg)
    if (ev.media && !msg.isMedia) return cmd.action(ev.media,'media',msg)
    if (msg.isGroup && ev.private) return this.action(ev.private, 'private', msg)
    if (!msg.quotedMsg && ev.quoted) return this.action(ev.quoted, 'quoted', msg)
    if (event.query == '' && ev.query) return this.action(ev.query, 'query', msg)
    if (ev.admin && !msg.sender.admin) return this.action(ev.admin, 'admin', msg)
    if (ev.clientAdmin && !msg.client.admin) return this.action(ev.clientAdmin, 'clientAdmin', msg)
    if (ev.owner && (!msg.key.fromMe && !this.config.ownerNumber.find((a) => msg.sender.jid.includes(a)))) return this.action(ev.owner, 'owner', msg)
    if (ev.wait) await this.action(ev.wait, 'wait', msg);
    return 200;
  }
  async execute(msg) {
    const ev = this.get(msg.string);
    try {
      this.global.forEach(tr => tr.callback(msg, {
        ...msg, client: this.client
      }))
      if (!ev.event) return 0;
      let access = await this.forbidden(msg, ev)
      if (access == 200) {
        ev.event.callback(msg, {
          ...ev, ...msg, client: this.client
        })
      }
      ev.event.before && ev.event.before(msg, {
        ...ev, ...msg, client: this.client
      })
    } catch (e) {
      if (!this.functions.util.format(e).includes('this.isZero')) {
        let data = {
          // error: this.functions.util.format(e),
          event: ev
        }
        console.log(data)
await this.action(ev.event.error || true, 'Error', msg)
      }}}
}