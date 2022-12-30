process.on("uncaughtException", console.log);

cmd.on(["kick", "add", "promote", "demote"], ["group"], async(msg, {
  client, mentionedJid, quotedMsg, query, command
}) => {
  let action = command.toLowerCase() == "kick"?"remove": command
  let participant = []
  let inactive = []
  if (!query && !quotedMsg && !mentionedJid) return client.reply(msg, `Kirim Pesan Nomor Telepon Contoh ${config.prefix[0]}${command} nomor|nomor Atau Tag Nomor/Pesan Terakhir Sambil Kirim Pesan ${config.prefix[0]}${command}`)
  if (mentionedJid && mentionedJid.length != 0) {
    participant = mentionedJid
  } else if (query) {
    if (query.includes('|')) {
      participant = query.split('|').map(tr => {
        let parsed = tr.split(' ').join('').replace(/(\-)/gi, '').replace(/(\+)/gi, '')
        parsed = parsed.startsWith('0')?parsed.replace('0', '62'): parsed
        return parsed+"@s.whatsapp.net"
      })
    } else {
      let parsed = query.split(' ').join('').replace(/(\-)/gi, '').replace(/(\+)/gi, '')
      parsed = parsed.startsWith('0')?parsed.replace('0', '62'): parsed
      participant = [parsed+"@s.whatsapp.net"]
    }
  } else if (quotedMsg) {
    participant = [quotedMsg.sender.jid]
  }
  if (participant.length == 0)return client.reply(msg, `Kirim Pesan Nomor Telepon Contoh ${config.prefix[0]}${command} nomor|nomor Atau Tag Nomor/Pesan Terakhir Sambil Kirim Pesan ${config.prefix[0]}${command}`)
  participant.forEach(async(tr) => {
    let onwa = await client.onWhatsApp(tr)
    if (!onwa[0]) {
      inactive.push(tr)
    } else {
      let req = await client.groupParticipantsUpdate(msg.from, [tr], action)
      if (req && req[0].status != 200) inactive.push(tr);
      await functions.delay(1000)
    }
  })
  if (inactive.length != 0) {
    client.reply(msg, {
      text: `Nomor-Nomor Yang Gagal Di Masukan/Tidak Aktif:\n${inactive.map(tr => "@" +tr.split('@')[0]).join("\n-")}`
    })
  }
  await client.reply(msg, `Sukses Men${action} Peserta`)
}, {
  group: "Harus Group",
  admin: "Sewa bot aja kawan wa.me/6289602286569",
  clientAdmin: "botnya diadminin dulu kk",
  param: "<nomor|tag>"
})

cmd.on(["linkgroup", "linkgrub", "linkgrup", "linkgc"], ['group'], async(msg, {
  client
}) => {
  let link = `https://chat.whatsapp.com/${await client.groupInviteCode(msg.from)}`
  let res = {
    nama: msg.groupData.subject,
    description: Buffer.from(msg.groupData.desc.data)+""
  }
  let parse = functions.parseResult(res, {
    body: "*- %key Group :* %value", title: "Link Group"
  })
  return await client.sendButton(msg, {
    text: parse, footer: res.nama
  }, [{
      url: "Salin Link", value: "https://www.whatsapp.com/otp/copy/"+link
    }])
}, {
  group: "Harus Group",
  admin: "Sewa bot aja kawan wa.me/6289602286569",
  clientAdmin: "botnya diadminin dulu kk",
})
const variation = ["group", "grub", "grup", "gc"]

cmd.on(variation, ['group'], async(msg, {
  client, query, prefix
}) => {
  let q = query.toLowerCase()
  if (!q || (!q.includes('buka') && !q.includes('tutup'))) return client.reply(msg, {
    text: `Pilih Buka Atau Tutup, Contoh ${prefix}group buka`
  })
  let type = !q.includes('buka') ? '': 'not_'
  let a = type+"announcement"
  await client.groupSettingUpdate(msg.from, a)
  return await client.reply(msg, `Sukses Me${type?'mbuka': 'nutup'} Group ${msg.groupData.subject}`)
}, {
  group: "Harus Group",
  admin: "Sewa bot aja kawan wa.me/6289602286569",
  clientAdmin: "botnya diadminin dulu kk",
  param: "<buka | tutup>"
})

cmd.on(variation.map(tr => tr+"name").concat(variation.map(tr => tr+"desc")), ['group'], async(msg, {
  client, query, prefix, command
}) => {
  let type = command.toLowerCase().includes('name') ? 'Subject': 'Description'
  await client["groupUpdate"+type](msg.from, query)
  return await client.reply(msg, `Sukses Mengubah ${type} Group ${msg.groupData.subject} Menjadi ${query}`)
}, {
  group: "Harus Group",
  admin: "Sewa bot aja kawan wa.me/6289602286569",
  clientAdmin: "botnya diadminin dulu kk",
  param: "<teks>",
  query: `Masukan Teks Yang Ingin Di Ubah Contoh ${config.prefix[0]}setname Anu`
})

cmd.on(variation.map(tr => tr+"pp"), ['group'], async(msg, {
  client, query, prefix, command
}) => {
  let update = await client.updateProfilePicture(msg.from, (await (msg.quotedMsg && !msg.isMedia?msg.quotedMsg: msg).downloadMsg()).buffer).catch(e => {
    return {
      err: e
    }})
    if (update && update.e) {
      console.log(update)
      return await client.reply(msg, `Gagal Mengubah Pp Group ${msg.groupData.subject}`)
    }
    return await client.reply(msg, `Sukses Mengubah Pp Group ${msg.groupData.subject}`)
  },
  {
    group: "Harus Group",
    admin: "Sewa bot aja kawan wa.me/6289602286569",
    clientAdmin: "botnya diadminin dulu kk",
    param: "<foto|tagfoto>",
    _media: "Kirim Foto Atau Tag Foto Yang Ingin Dijadikan Pp Group"
  })