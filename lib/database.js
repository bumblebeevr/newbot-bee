process.on("uncaughtException", console.log);
module.exports = class Database{
create(value,name,expired){
if(typeof value == 'object' && !Array.isArray(this) && name){
this[name] = value
this[name].create = this.create
this[name].get = this.get
} else if (typeof value == 'object' && Array.isArray(this)){
this.push({value,create:this.create,get:this.get})
} else if(!Array.isArray(this)){
this[name] = value
} else {
this.push(value)
}
return this
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
if (data.event.sensitive  && data.text.split(" ")[0].toLowerCase() == data.command){
return {}
}
    return data
  }
