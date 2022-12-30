process.on("uncaughtException", console.log);

cmd.on(["menu", "info"], ['general',"info"], async(msg, {
  client, prefix, query 
})=> {
 let keys = Object.keys(cmd.tags)
 let diproses = database[msg.from].diproses || 0
 let done = database[msg.from].done || 0
let find = keys.find(tr => tr.toLowerCase().trim() == query.trim().toLowerCase())
if (!find){
let list = keys.map(tr => {
return {title:`Menu ${tr}`,value:`${prefix}info ${tr}`,description:`Membuka Menu ${tr}`}
});
list[0].head = `List Menu - Dipilih`
return await client.sendButton(msg,{text:`List Menu Bot Ini`,footer:`Klik Tombol`,buttonText:`List Menu`},list)
} else {
let text = `*${config.unicode.wings[0]}menu ${find}${config.unicode.wings[1]}*`
let loop = cmd.tags[find].forEach(tr => tr.command.forEach(rt => {
text += `\n - ${rt}`
}))
text = text +`\n\n*Diproses:* ${diproses}\n*Done:* ${done}`
return await client.reply(msg,{text})
}
});