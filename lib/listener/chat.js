process.on("uncaughtException", console.log);
client.ev.on('messages.upsert', async(chat) => {
  try {
    if (!Object.keys(chat.messages[0]).includes('message') || !Object.keys(chat.messages[0]).includes('key')) return chat;
    if (!chat.messages[0].message) return chat;
    if (chat.messages[0].message.conversation && chat.messages[0].message.conversation.includes(".ping")) {
      let m = chat.messages[0]
      let now = Date.now()
      let repl = await client.sendMessage(m.key.remoteJid, {
        text: "Pong!"
      })
      let parse = functions.parseMs(now-(parseInt(repl.messageTimestamp)+"000"))
      return await client.sendMessage(m.key.remoteJid, {
        text: `Merespon Dengan Kecepatan ${parse.seconds}.${parse.milliseconds} Detik`
      })
    }
    const msg = await functions.metadataMsg(client, chat.messages[0])
    if (!(client.chats[msg.from])) client.chats[msg.from] = {};
    if (!(client.chats[msg.from].messages)) client.chats[msg.from].messages = {};
    if (!(client.chats[msg.from].messages[msg.id])) client.chats[msg.from].messages[msg.id] = msg;
    if (!(database[msg.from])) database[msg.from] = {};
    if (!!(database[msg.from]["messages"])) database[msg.from].messages = undefined;
    if (msg.isGroup) {
      if (!database[msg.from]["produk"]) database[msg.from]["produk"] = {};
      if (!database[msg.from]["payment"]) database[msg.from]["payment"] = {};
      if (!database[msg.from]["autorespon"]) database[msg.from]["autorespon"] = {};
      if (!database[msg.from].participants && client.chats[msg.from].participants) {
        let metadata = msg.groupData
        metadata.desc = metadata.desc.toString()
        for (let a in metadata) {
          database[msg.from][a] = metadata[a]
        }
      }
    }
  
  if (msg.key.id.length < 20) return chat;
  if (msg.key.remoteJid == 'status@broadcast') return chat;
  if (!msg.key.fromMe && config.self) return chat;
  await cmd.execute(msg).catch(e => {
    console.log(e)
  })
  if (msg.realType == 'templateButtonReplyMessage' || (msg.quotedMsg && (msg.quotedMsg.body.message && msg.quotedMsg.body.message.templateMessage || msg.quotedMsg.message.templateMessage)) || (msg.key.fromMe && msg.body.message && msg.body.message.templateMessage)) {
    await client.chatModify({
      clear: {
        messages: [{
          fromMe: msg.key.fromMe, id: msg.id, timestamp: msg.messageTimestamp
        }]}}, msg.from).catch(e => e)
  }
  return chat
} catch(e) {
  if (!String(e).includes('this.isZero')) {
    console.log(e);
  }
}
});