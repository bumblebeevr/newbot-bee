client.ev.on('groups.update', async (msg) => {
  if (!database[msg.id]) database[msg.id] = {};
  if (!client.chats[msg.id]) client.chats[msg.id] = {};
  let metadata = await client.groupMetadata(msg.id)
  metadata.desc = metadata.desc.toString()
  for (let a in metadata) {
    database[msg.id][a] = metadata[a]
    client.chats[msg.id] = metadata[a]
  }
})

client.ev.on('group-participants.update', async (msg) => {
  if (!database[msg.id]) database[msg.id] = {};
  if (!client.chats[msg.id]) client.chats[msg.id] = {};
  let metadata = await client.groupMetadata(msg.id)
  metadata.desc = metadata.desc.toString()
  for (let a in metadata) {
    database[msg.id][a] = metadata[a]
    client.chats[msg.id] = metadata[a]
  }
})