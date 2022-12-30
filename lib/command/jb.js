let prefix = config.prefix[0]

async function cekid(id, zoneid) {
    let type = zoneid ? `voucherPricePoint.id=271312&voucherPricePoint.price=1579.0&voucherPricePoint.variablePrice=0&n=5%2F11%2F2022-2149&email=&userVariablePrice=0&order.data.profile=eyJuYW1lIjoiICIsImRhdGVvZmJpcnRoIjoiIiwiaWRfbm8iOiIifQ%3D%3D&user.userId=${id}&user.zoneId=${zoneid}&msisdn=&voucherTypeName=MOBILE_LEGENDS&voucherTypeId=5&gvtId=19&shopLang=id_ID&checkoutId=dd59df4c-2ce9-4b24-ba6f-94bf732270ff&affiliateTrackingId=&impactClickId=&anonymousId=e0d24092-a6d2-4e64-8486-33ceafbf7b87&fullUrl=https%3A%2F%2Fwww.codashop.com%2Fid-id%2Fmobile-legends&userEmailConsent=false&verifiedMsisdn=&promoId=&promoCode=` : `voucherPricePoint.id=270281&voucherPricePoint.price=1000.0&voucherPricePoint.variablePrice=0&n=17%2F5%2F2022-1736&email=&userVariablePrice=0&order.data.profile=eyJuYW1lIjoiICIsImRhdGVvZmJpcnRoIjoiIiwiaWRfbm8iOiIifQ%3D%3D&user.userId=${id}&user.zoneId=&msisdn=&voucherTypeName=FREEFIRE&shopLang=id_ID&checkoutId=ac351aa6-3e13-4955-a74d-4ce4f46d3810&affiliateTrackingId=&impactClickId=&anonymousId=e0d24092-a6d2-4e64-8486-33ceafbf7b87`
    let data = await functions.fetch(`https://order-sg.codashop.com/initPayment.action`, {
        method: "POST",
        headers: {
            "Accept": "*",
            "Accept-Language": "id-ID",
            "X-SESSION-COUNTRY2NAME": "ID"
        },
        body: new URLSearchParams(type.split("&").map(tr => tr.split("=")))
    })
    data = await data.json()
    if (!data.confirmationFields) return {
        error: true,
        message: "invalid id"
    }
    return {
        id,
        zoneid,
        name: zoneid ? data.confirmationFields.username : data.confirmationFields.roles && data.confirmationFields.roles[0].role
    }
}

cmd.on(['menu'], ['jual beli'], async(msg, {
    client
}) => {
    let list = Object.keys(database[msg.from].produk)
    if (list.length == 0) return await client.reply(msg, `Tidak Ada Produk Di Grup Ini`)
    list = list.map(tr => {
        return {
            title: `${tr}`,
            value: `${prefix}produk ${tr}`
        }
    })
    list[0].head = `berikut list kami`
    return await client.sendButton(msg, {
        buttonText: `Klik Disini`,
        text: `LIST MENU`,
        footer: `bot daengstore`
    }, list)
}, {
    group: "Hanya Bisa Di Gunakan Di Group"
});

cmd.on(["produk"], ['jual beli'], async(msg, {
    client,
    query
}) => {
    let produk = database[msg.from].produk[query]
    if (!produk) {
        await client.reply(msg, `Produk Tidak Ada Dalam List, Mohon Pilih List Di Bawah`)
        let list = Object.keys(database[msg.from].produk)
        if (list.length == 0) return await client.reply(msg, `Tidak Ada Produk Di Grup Ini`)
        list = list.map(tr => {
            return {
                title: `list dari ${tr}`,
                description: `berikut list ${tr}`,
                value: `${prefix}produk ${tr}`
            }
        })
        list[0].head = `List Jasa Topup Kami`
        return await client.sendButton(msg, {
            buttonText: `Klik Disini`,
            text: `Berikut List Topup Yang Kami Sediakan`,
            footer: `Tekan Tombol Klik Disini`
        }, list)
    }
    let str = produk;
    str = str.replace(/(\%group)/gi, msg.groupData.subject)
    str = str.replace(/(\%nomor)/gi, msg.sender.jid.split('@')[0])
    str = str.replace(/(\%tanggal)/gi, functions.parseDate('LLLL'))
    str = str.replace(/(\%jam)/gi, functions.parseDate('HH'))
    str = str.replace(/(\%menit)/gi, functions.parseDate('mm'))
    str = str.replace(/(\%detik)/gi, functions.parseDate('ss'))
    return await client.reply(msg, {
        text: str
    })
}, {
    query: `Masukan Produk Yang Akan Di Tampilkan, Contoh ${prefix}produk Mobile Legend`,
    param: "<produk>",
    group: "Hanya Bisa Di Gunakan Di Group"
})
let cmdb = ["list", 'autorespon', 'payment']
let res = [];
for (let a of cmdb) {
    res.push(a + "add")
    res.push(a + "delete")
    res.push(a + "update")
    res.push(a + "reset")
    res.push("add" + a)
    res.push("delete" + a)
    res.push("update" + a)
    res.push("reset" + a)
}
cmd.on(res, ['jual beli'], async(msg, {
    client,
    command,
    query
}) => {
    command = command.toLowerCase()
    let type = command.includes('delete') ? "delete" : command.includes('add') ? "add" : command.includes('update') ? "update" : "reset"
    let data = command.replace(type, "").trim()
    if (data.includes('list')) data = "produk";
    if (!query.includes(",") && type !== "delete" && type !== "reset") return client.reply(msg, {
        text: `Harap Masukan Data Yang Ingin Di Ubah, Contoh ${prefix}${data}add Mobile Legend, List Diamond ML`
    })
    if (!database[msg.from][data]) database[msg.from][data] = {};
    let split = query.split(',')
    let nama = split[0].trim()
    if (!nama) return client.reply(msg, {
        text: `Harap Masukan Data Yang Ingin Di Ubah, Contoh ${prefix}add Mobile Legend, List Diamond ML`
    })
    let isi = split[1] ? split.slice(1).join(',').trim() : ""
    switch (type) {
        case "reset":
            database[msg.from][data] = {}
            break
        case "add":
            if (database[msg.from][data][nama]) return await client.reply(msg, `${data[0].toUpperCase()+data.slice(1)} ${nama} Telah Ada Sebelumnya`)
            database[msg.from][data][nama] = isi
            break;
        case "delete":
            if (!database[msg.from][data][nama]) return await client.reply(msg, `${data[0].toUpperCase()+data.slice(1)} ${nama} Telah Tidak Ada Sebelumnya`)
            database[msg.from][data][nama] = undefined;
            break;
        case "update":
            if (!database[msg.from][data][nama]) return await client.reply(msg, `Gagal Mengupdate ${data[0].toUpperCase()+data.slice(1)}, Data ${nama} Tidak Ada`)
            database[msg.from][data][nama] = isi
    }
    return await client.reply(msg,
        `Sukses Meng${type} Data ${nama}`)
}, {
    param: `<nama, isi>`,
    admin: "Sewa bot aja kawan wa.me/6289602286569",
    query: `Example: ${prefix}autoresponadd
  Cek Status, *STATUS PESANAN :*
  STATUS    : PESANAN SEDANG DI PROSES
  WAKTU     : %jam:%menit:%detik%
  TANGGAL   : %tanggal
  PESANAN   : @%nomor\n\nExample: ${prefix}listadd Mobile Legend, List Diamond Ml\n19 Diamond 19k Tanggal: %tanggal`,
    group: "Hanya Bisa Di Gunakan Di Group"
})

cmd.on([''], [], async(msg, {
    string,
    quotedMsg,
    query
}) => {
    if (chatbot[msg.sender.jid]) {
        if (msg.isGroup && (!quotedMsg || !quotedMsg.key.fromMe)) return;
        chatbot[msg.sender.jid].push(`Human: ${query}`)
        chatbot[msg.sender.jid].push(`Ai:`)
        let resp = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: chatbot[msg.sender.jid].join('\n'),
            temperature: 0.9,
            max_tokens: 2400,
            top_p: 1,
            stop: ["Ai:", "Human:"],
            frequency_penalty: 0,
            presence_penalty: 0,
        })
        let text = resp.data.choices[0].text.trim()
        if (!text) text = functions.randomize(["Aku Tidak Tau", "Kurang Tau", "Nanti Saya Belajar Lagi!", "Maaf Saya Tida Tau"])
        await client.reply(msg, {
            text
        })
        chatbot[msg.sender.jid][chatbot[msg.sender.jid].length - 1] = "Ai: " + text
        return 0;
    }
    if (!msg.isGroup) return;
    var data = Object.keys(database[msg.from].autorespon).find(tr => tr.toLowerCase() == string.toLowerCase())
    var str = database[msg.from].autorespon[data];
    if (!str) {
        data = Object.keys(database[msg.from].produk).find(tr => tr.toLowerCase() == string.toLowerCase())
        str = database[msg.from].produk[data];
    }
    if (!str) return;
    str = str.replace(/(\%group)/gi,
        msg.groupData.subject)
    str = str.replace(/(\%tanggal)/gi,
        functions.parseDate("dddd, DD MMMM YYYY"))
    str = str.replace(/(\%jam)/gi,
        functions.parseDate('HH'))
    str = str.replace(/(\%menit)/gi,
        functions.parseDate('mm'))
    str = str.replace(/(\%detik)/gi,
        functions.parseDate('ss'))
    let mentions = [msg.sender.jid]
    if (msg.quotedMsg) mentions.push(msg.quotedMsg.sender.jid)
    if (database[msg.from].autorespon[data]) {
        if (['proses', 'done', 'p', 'd'].includes(data.toLowerCase())) {
            if (!msg.sender.admin) return;
            str = str.replace(/(\%nomor)/gi, (msg.quotedMsg ? msg.quotedMsg.sender.jid : msg.sender.jid).split('@')[0].trim())
            str = str.replace(/(\%teks)/gi, (msg.quotedMsg ? msg.quotedMsg.string : "Tidak Ada").trim())
            let type = data.slice(0, 1).toLowerCase() == "p" ? "diproses" : "done"
            database[msg.from][type] = database[msg.from][type] ? database[msg.from][type] + 1 : 1
        } else {
            str = str.replace(/(\%nomor)/gi, msg.sender.jid.split('@')[0].trim())
            str = str.replace(/(\%teks)/gi, (msg.quotedMsg ? msg.quotedMsg.string : "Tidak Ada").trim())
        }
        return await client.reply(msg, {
            text: str,
            mentions
        })
    }
    return await client.reply(msg, {
        text: str,
        mentions
    })
}, {
    prefix: false
})

cmd.on(['hidetag',
        'tagall'
    ], ['group'],
    async(msg, {
        client,
        query,
        command
    }) => {
        if (!query && !msg.isMedia && !msg.quotedMsg) return client.reply(msg, "Tag Pesan, Kirim Pesan Media, Atau Masukan Teks Yang Akan Di Hidetag/Tagall");
        let tagresp = command.toLowerCase() == "hidetag" ? '' : '\n' + (msg.groupData.participants.map(tr => '- @' + tr.id.split('@')[0] + '\n').join('').trim())
        let participants = msg.groupData.participants.map(tr => tr && tr.id);
        if (msg.isMedia) {
            let body = msg.message
            body[msg.type].caption = body[msg.type].caption + tagresp
            body[msg.type].contextInfo = {}
            body[msg.type].contextInfo.mentionedJid = participants;
            return await client.sendMessageFromContent(msg, body)
        } else if (query) {
            return await client.reply(msg, {
                text: query + tagresp,
                mentions: participants
            })
        } else if (msg.quotedMsg) {
            let body = msg.quotedMsg
            body = typeof body.message[msg.quotedMsg.type] == 'string' ? {
                extendedTextMessage: {
                    text: body.string + tagresp
                }
            } : body
            body.message[msg.quotedMsg.type].contextInfo = {}
            body.message[msg.quotedMsg.type].contextInfo.mentionedJid = participants;
            return await client.sendMessageFromContent(msg, body.message)
        }
    }, {
        group: "Sewa bot aja kawan wa.me/6289602286569",
        admin: "Sewa bot aja kawan wa.me/6289602286569",
        param: "<tagpesan|pesan>"
    })

cmd.on(['cekidml',
        'cekidff', 'cekid'
    ], ['jual beli'],
    async(msg, {
        client,
        command,
        query
    }) => {
        if (!query && (!msg.quotedMsg || !msg.quotedMsg.string)) return await client.reply(msg, {
            text: "Format Salah, Example: ${prefix}cekidml 12345678(2312) | ${prefix}cekidff 1234456789 Atau Tag Pesan Mengandung Id"
        })
        if (!query) query = msg.quotedMsg.string
        let isMl = command.toLowerCase().includes('ml') || query.includes('(') && !command.toLowerCase().includes('ff')
        if (!query.includes('(') && isMl) return client.reply(msg, `Example: ${prefix}cekidml 1234567(2312) ||| ${prefix}cekidff 1234456789`)
        let id = /([0-9]{7,14})/gi.exec(query)
        if (!id) return await client.reply(msg, {
            text: `Jumlah Angka Id Tidak Valid, Id Invalid`
        })
        let sid = /(\(|\( )([0-9]{3,7}(\)| \)))/gi.exec(query)
        if (isMl && !sid) return await client.reply(msg, {
            text: `Sertakan Zona id, Example: ${prefix}cekidml 1234567(2312) ||| ${prefix}cekidff 1234456789`
        })
        if (!isMl && sid) sid = undefined
        id = id[0].trim()
        let zoneid = sid ? sid[0].split('').join('').replace("(", "").replace(")", "").trim() : undefined
        let data = await cekid(id, zoneid)
        if (data.error || !data.name) return await client.reply(msg, `_*Data Tidak Di Temukan*_\nId:${id}\n${zoneid? 'Zona Id: '+zoneid: ""}`.trim())
        return await client.reply(msg, `_*Data Di Temukan*_\nId:${id}\n${zoneid? 'Zona Id: '+zoneid+'\n': ""}Username:${decodeURIComponent(data.name.replace(/(\+)/gi, ' '))}`.trim())
    }, {
        param: "<id | zoneid / tagpesan>"
    })

cmd.on(["payment"], ['jual beli'],
    async(msg, {
        client,
        prefix,
        query
    }) => {
        let data = database[msg.from].payment
        if (!data || !data.text) return await client.reply(msg, `Payment Belum Di Set Di Group Ini`);
        let v1,
            v2;
        if (query && query.includes(',')) {
            let split = query.split(',')
            v1 = split[0].trim()
            v2 = split.slice(1).join(',').trim()
        } else {
            v1 = query
            v2 = ""
        }
        let keys = Object.keys(data).filter(tr => !tr.includes("text"))
        var find = keys.find(tr => v1 && tr.toLowerCase() == v1.trim().toLowerCase())
        if (!data[find]) {
            let del = await client.sendButton(msg, {
                text: data.text
            }, keys.map(tr => {
                return {
                    reply: tr[0].toUpperCase() + tr.slice(1),
                    value: `${prefix}payment ${tr}`
                }
            }))
            await client.chatModify({
                clear: {
                    messages: [{
                        fromMe: del.key.fromMe,
                        id: del.key.id,
                        timestamp: del.messageTimestamp
                    }]
                }
            }, msg.from)
        } else {
            let data = database[msg.from].payment[find]
            if (!data || !data.text) return await client.reply(msg, `Payment ${find} Belum Di Set Di Group Ini`);
            let keys = Object.keys(data).filter(tr => !tr.includes("text"))
            find = keys.find(tr => v2 && tr.toLowerCase() == v2.trim().toLowerCase())
            if (!data[find]) {
                let del = await client.sendButton(msg, {
                    text: data.text
                }, keys.map(tr => {
                    return {
                        reply: tr[0].toUpperCase() + tr.slice(1),
                        value: `${prefix}payment ${v1},${tr}`
                    }
                }))
                await client.chatModify({
                    clear: {
                        messages: [{
                            fromMe: del.key.fromMe,
                            id: del.key.id,
                            timestamp: del.messageTimestamp
                        }]
                    }
                }, msg.from)
            } else {
                let del = await client.sendButton(msg.from, {
                    text: data[find + "text"] || data.text
                }, [{
                    url: `Salin ${find.toLowerCase()}`,
                    value: "https://www.whatsapp.com/otp/copy/" + data[find]
                }, {
                    reply: "Get Qr",
                    value: prefix + "qr"
                }])
                await client.chatModify({
                    clear: {
                        messages: [{
                            fromMe: del.key.fromMe,
                            id: del.key.id,
                            timestamp: del.messageTimestamp
                        }]
                    }
                }, msg.from)
            }
        }
    }, {
        group: "Hanya Bisa Di Gunakan Di Group"
    })

cmd.on(["qr"], ['jual beli'],
    async(msg, {
        client,
        prefix
    }) => {
        let path = './src/images/' + msg.from + ".jpg"
        if (!functions.fs.existsSync(path)) return await client.reply(msg, `Qr Di Group Ini Belum Di Seting Seting Dengan ${prefix}setqr tagfoto/foto`)
        return await client.sendButton(msg.from, {
            image: path,
            caption: "Scan Me!",
            footer: `Beli Semua Di\n${msg.groupData.subject.slice(0, 20).trim()}...`
        }, [{
            reply: `Lihat Menu`,
            value: `${prefix}menu`
        }])
    }, {
        group: "Harus Group"
    })

cmd.on(["setqr"], ['jual beli'],
    async(msg, {
        client
    }) => {
        let dl = msg.quotedMsg ? msg.quotedMsg : msg
        let sv = await dl.downloadMsg('./src/images/' + msg.from + ".jpg")
        return await client.reply(msg, `Done setting pict qris`)
    }, {
        group: "Harus Group",
        param: "<kirim foto>",
        _media: "Kirim Foto atau Tag Foto Cuy Sambil Kirim Pesan .setqr",
        admin: "Sewa bot aja kawan wa.me/6289602286569"
    })

cmd.on(["autoresetlink"], ['group'],
    async(msg, {
        query,
        command
    }) => {
        let type = query.toLowerCase().includes("on") ? 1 : query.toLowerCase().includes("off") ? 2 : 0
        database[msg.from].activated = database[msg.from].activated || {}
        let data = command.toLowerCase()
        switch (type + "") {
            case "1":
                if (database[msg.from].activated[data]) return await client.reply(msg, `Telah Aktif Sebelumnya`)
                database[msg.from].activated[data] = true
                await client.reply(msg, `Sukses Mengaktifkan`)
                break;
            case "2":
                if (!database[msg.from].activated[data]) return await client.reply(msg, `Telah Nonaktif Sebelumnya`)
                database[msg.from].activated[data] = false
                await client.reply(msg, `Sukses Mengnonaktifkan`)
                break;
            default:
                await client.reply(msg, `Example: ${prefix}autoresetlink on`)
        }
    }, {
        group: "Hanya Di Grub",
        admin: "Sewa bot aja kawan wa.me/6289602286569",
        clientAdmin: "Bot Harus Admin",
        query: `Example: ${prefix}autoresetlink on`,
        param: `<on|off>`
    })

setInterval(async function() {
    if (functions.parseDate('HH') == "23" || functions.parseDate('HH') == "11") {
        let loop = functions.fs.readdirSync("./database/").forEach(async tr => {
            tr = tr.replace(".json", "").trim()
            if (database[tr].activated && database[tr].activated.autoresetlink) {
                let checkclient = database[msg.from].participants.find(tr => client.user.id.split(':')[0] + '@s.whatsapp.net' == tr.id)
                if (!checkclient.admin) return await client.reply(tr, `Gagal Mereset Link Group Karena Bukan Admin`);
                await client.groupRevokeInvite(tr);
                await client.reply(tr, `Sukses Mengubah Link Group`)
            }
        })
    }

    let loop = functions.fs.readdirSync("./database/").forEach(async(tr) => {
        tr = tr.replace(".json", "").trim()
        if (database[tr].expiredSewa <= Date.now()) {
            await client.reply(tr, `Sewa Telah Habis, Keluar Group..`)
            await client.groupLeave(tr)
            database[tr].expiredSewa = undefined
        } else if (database[tr] && database[tr].expiredSewa && functions.parseMs(database[tr].expiredSewa - Date.now()).days == 1 && !database[tr].hasReport) {
            database[tr].hasReport = true;
            let groupAdmin = database[tr].participants.filter(tr => tr.admin)
            let teks = `Lapor grub ${database[tr].subject}\nDengan Admin:\n${groupAdmin.map(tr => "@"+tr.id.split('@')[0]).join('\n')}\n\nMasa sewa tinggal 1 hari`
            for (let a of groupAdmin) {
                await client.reply(s.id, {
                    text: teks,
                    mentions: groupAdmin.map(tr => tr.id)
                })
            }
        }
    })

}, 60 * 1000)



const {
    Configuration,
    OpenAIApi
} = require("openai");
const configuration = new Configuration({
    apiKey: "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",
});
global.openai = new OpenAIApi(configuration);
global.chatbot = {}

cmd.on(['chatbot'], ["ai", "hiburan"], async(msg, {
    client
}) => {
    if (chatbot[msg.sender.jid]) {
        chatbot[msg.sender.jid] = undefined;
        return await client.reply(msg, {
            text: `Menghapus Sesi Ai Chat Bot...`
        })
    }
    chatbot[msg.sender.jid] = ["Ai: Aku Adalah Chatbot Yang Di Ciptakan Galang Aka Gyn!"]
    await client.reply(msg, {
        text: `Halo! Sesi Chat Kamu Dimulai, Coba Perkenalkan Dirimu! ${msg.isGroup?"Jika Kamu Ingin Bot Merespon, Tag Pesan Bot!": ""}`
    })
})

cmd.on(["sticker", "stiker"], ["maker"], async(msg, {
    client,
    quotedMsg
}) => {
    let buf = msg.isMedia ? msg : quotedMsg
    return await client.reply(msg, {
        sticker: (await buf.downloadMsg()).buffer
    })
}, {
    _media: `Harus Berupa Foto Atau Video`,
    param: `<foto/video>`
})

cmd.on(["toanime"], ["maker"], async(msg, {
    client,
    quotedMsg
}) => {
    if (!msg.message.imageMessage && !quotedMsg.message.imageMessage) return await client.reply(msg, {
        text: `Pesan Harus Berupa Foto`
    })
    let down = msg.message.imageMessage ? msg : quotedMsg
    let req = (await down.downloadMsg()).buffer
    let res = await functions.fetch(
        'https://ai.tu.qq.com/trpc.shadow_cv.ai_processor_cgi.AIProcessorCgi/Process', {
            headers: {
                'Content-type': 'application/json',
                Origin: 'https://h5.tu.qq.com',
                Referer: 'https://h5.tu.qq.com',
            },
            method: 'POST',
            body: JSON.stringify({
                busiId: 'ai_painting_anime_img_entry',
                extra: JSON.stringify({
                    face_rects: [],
                    version: 2,
                    platform: 'web',
                    data_report: {
                        parent_trace_id: 'c26b66f0-caee-1a93-3713-67e585db33f7',
                        root_channel: '',
                        level: 0,
                    },
                }),
                images: [req.toString('base64')],
            }),
        }
    )
    let v = await res.json()
    if (v.code == 1) return await client.reply(msg, {
        text: `Terjadi Kesalahan, Fitur Sedang Maintenance`
    })
    return await client.reply(msg, {
        image: JSON.parse(v.extra).img_urls[0]
    })
}, {
    _media: "Harus Berupa Foto"
})

cmd.on(['setp', 'setd', 'setproses', 'setdone'], ['admin', 'jualbeli'], async(msg, {
    client,
    query,
    command
}) => {
    let type = command.toLowerCase().includes("p") ? 'proses' : 'done'
    database[msg.from].autorespon[type] = query
    database[msg.from].autorespon[type.slice(0, 1)] = query
    return await client.reply(msg, {
        text: `Sukses Menset${type} Menjadi ${query}`
    })
}, {
    query: `Masukan Teks Yang Akan Diseting`,
    param: "<teks>",
    admin: "Khusus Admin"
})