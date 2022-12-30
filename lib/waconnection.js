const baileys = require('@adiwajshing/baileys')
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const fetch = require('node-fetch');
const util = require('util');
const fakeUa = require('fake-useragent');
const FileType = require('file-type')
const {
  exec,
  spawn,
  execSync
} = require('child_process');
process.on("uncaughtException", console.log);
module.exports = class WAConnection {
  constructor(client) {
    for (let a in baileys) {
      this[a] = baileys[a]
    }
    for (let a in client) {
      this[a] = client[a]
    }
    this.client = client
    this.MessageType = Object.fromEntries(Object.keys(this.proto.Message.prototype).filter(tr => tr.endsWith('Message')).map(tr => {
      let type = tr[0].toLowerCase()+tr.slice(1)
      return [type.replace('Message', ''), type]}))
    this.MessageType.text = 'conversation'
  }

  async reply(mess, property = {}) {
    property = typeof property == 'string' ? {
      text: property
    }: property.text ? {
      ...property,
      text: util.format(property.text)}: property
    property.force = true
    return await this.sendFile(mess, property);
  }
  async sendAdReply(msg, message = {}, additional = {}, opt = {}) {
    additional = {
      title: "",
      body: "",
      url: "",
      thumb: Buffer.alloc(0),
      ... additional
    }
    additional.sourceUrl = additional.url
    additional.thumbnail = (await this.getBuffer(additional.thumb)).buffer
    return await client.reply(msg, {
      ...message, contextInfo: {
        externalAdReply: {
          renderLargerThumbnail: true,
          mediaType: 1,
          ...additional
        }}, ...opt
    }, {
      contextInfo: {
        externalAdReply: {
          renderLargerThumbnail: true,
          mediaType: 1,
          ...additional
        }}, ...opt
    })
  }
  //   async sendAdReply(jid, mess, body, opt = {}) {
  //     let prep = await this.prepareMessage(jid, mess, mess)
  //     body.thumbnail = (await this.getBuffer(body.thumbnail)).buffer
  //     let type = Object.keys(prep.message)[0]
  //  prep.message[type].contextInfo = { ...prep.message[type].contextInfo,externalAdReply: body, ...opt }
  //     return await this.sendMessageFromContent(jid, prep.message, opt)
  //   }

  async downloadMessage(message, save) {
    let values = Object.values(this.MessageType)
    let type = Object.keys(message).find(tr => values.includes(tr) && !tr.includes("senderKey") && !tr.includes('context'))
    return this.getBuffer(await this.downloadContentFromMessage(message[type], type.replace('Message', '').trim()), save)
  }

  async getBuffer(path, save) {
    if (path.buffer && path.ext && path.mime) return path
    let buffer = path.message ? (this.downloadMessage(path.message)).buffer: Buffer.isBuffer(path) ? path: /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64'): /^https?:\/\//.test(path) ? await (await fetch(path, {
      headers: {
        'User-Agent': fakeUa()}})).buffer(): fs.existsSync(path) ? fs.readFileSync(path): path._readableState ?await this.toBuffer(path): typeof path === 'string' ? path: Buffer.alloc(0);
    let anu = await FileType.fromBuffer(buffer) || {
      ext: 'bin',
      mime: 'application/octet-stream'
    }
    if (save) {
      save = typeof save == 'boolean'?Date.now()+``: save
      let filename = save.includes(".") ? save: `${save}.${anu.ext}`
      fs.writeFileSync(save, buffer)
      return {
        filename,
        buffer,
        ...anu
      }
    } else {
      return {
        buffer,
        ...anu
      }
    }
  }

  async sendMessageFromContent(mess, obj = {}) {
    let type = Object.keys(obj)[0]
    let prepQ = !obj.quoted && typeof mess == 'object'?mess: obj.quoted;
    obj[type].contextInfo = {
      ...(prepQ ? {
        quotedMessage: prepQ.message, remoteJid: prepQ.key.remoteJid, participant: prepQ.key.participant, stanzaId: prepQ.key.id
      }: {}),
      ...obj[type].contextInfo
    }
    obj.upload = this.waUploadToServer
    let prepare = await require("@adiwajshing/baileys").generateWAMessageFromContent(typeof mess == 'object'?mess.key.remoteJid: mess, obj, obj)
    await this.relayMessage(prepare.key.remoteJid, prepare.message, {
      messageId: prepare.key.id
    })
    return prepare
  }

  parseMention(text) {
    try {
      return text.match(/@(\d*)/g).map(x => x.replace('@', '')+'@s.whatsapp.net') || [];
    } catch(e) {
      return []
    }
  }

  async prepareMessage(mess, property = {}) {
    let type = Object.keys(property).find(tr => this.MessageType[tr]);
    let medias = ["image",
      "document",
      "video",
      "audio",
      "sticker"]
    let jidData = typeof mess == 'object'? {
      quoted: mess,
      jid: mess.key.remoteJid
    }: {
      quoted: null,
      jid: mess
    }
    property.upload = this.waUploadToServer
    property.quoted = property.quoted ? property.quoted: jidData.quoted
    if (medias.includes(type)) {
      let data = type == 'sticker' ? {
        buffer: await this.prepareSticker(property[type]),
        ext: 'webp',
        mime: 'image/webp'
      }: await this.getBuffer(property[type]);
      property.fileName = property.filename || property.fileName || Date.now()+``
      property = {
        mimetype: data.mime,
        fileName: property.fileName.includes(".") ? property.fileName: `${property.fileName}.${data.ext}`,
        ...property,
        [type]: data.buffer,
      }
    }
    return await this.generateWAMessage(jidData.jid, property, property);
  }

  async prepareSticker(path, exifFile) {
    return new Promise(async(resolve, reject) => {
      let {
        ext,
        mime,
        buffer
      } = await this.getBuffer(path)
      let input = `./tmp/${Date.now()}.${ext}`
      let output = input.replace(ext, 'webp')
      if (!fs.existsSync("./tmp")) fs.mkdirSync('tmp')
      fs.writeFileSync(input, buffer)
      if (ext == 'webp') {
        if (exifFile) {
          return exec(`webpmux -set exif ${exifFile} ${output} -o ${output}`, (err) => {
            if (err) throw err
            resolve(fs.readFileSync(output))
            fs.unlinkSync(output)
          })
        } else {
          resolve(fs.readFileSync(output))
          fs.unlinkSync(output)
        }
      }
      ffmpeg(input).input(input).on('error', function (err) {
        fs.unlinkSync(input)
        reject(err)
      }).on('end', function () {
        if (exifFile) {
          exec(`webpmux -set exif ${exifFile} ${output} -o ${output}`, (err) => {
            if (err) return reject(err)
            resolve(fs.readFileSync(output))
            fs.unlinkSync(input)
            fs.unlinkSync(output)
          })
        } else {
          resolve(fs.readFileSync(output))
          fs.unlinkSync(input)
          fs.unlinkSync(output)
        }
      }).addOutputOptions([`-vcodec`,
        `libwebp`,
        `-vf`,
        `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`]).toFormat('webp').save(output)
    })
  }

  async sendFile(mess, property = {}) {
    let type = Object.keys(property).find(tr => this.MessageType[tr]);
    let medias = ["image", "document", "video", "audio", "sticker"]
    let jidData = typeof mess == 'object'? {
      quoted: mess, jid: mess.key.remoteJid
    }: {
      quoted: null, jid: mess
    }
    property.quoted = property.quoted ? property.quoted: jidData.quoted
    if (!medias.includes(type) && !property.force) throw new Error("The Property Must Be Includes Media Like Image Or Video")
    if (medias.includes(type)) {
      let data = type == 'sticker' ? {
        buffer: await this.prepareSticker(property[type], property.exif),
        ext: 'webp',
        mime: 'image/webp'
      }: await this.getBuffer(property[type]);
      property.fileName = property.filename || property.fileName || Date.now()+``
      property = {
        mimetype: data.mime,
        fileName: property.fileName.includes(".") ? property.fileName: `${property.fileName}.${data.ext}`,
        ...property,
        [type]: data.buffer,
      }
    }
    return await this.sendMessage(jidData.jid, property, property)

  }

  async groupQuery(jid, type, content) {
    return (this.query({
      tag: 'iq',
      attrs: {
        type,
        xmlns: 'w:g2',
        to: jid,
      },
      content
    }));
  }

  async groupParticipants(jid, participants = []) {
    let participantsAffected = []
    for (let a of participants) {
      let result = await this.groupQuery(jid, 'set', [{
        tag: a.action,
        attrs: {},
        content: [{
          tag: 'participant', attrs: {
            jid: a.jid
          }
        }]
      }]);
      let node = (0, this.getBinaryNodeChild)(result, a.action);
      participantsAffected = participantsAffected.push((0, this.getBinaryNodeChildren)(node, 'participant'))
    }
    return participantsAffected
  }
  async reSize(image, width, height) {
    let jimp = require('jimp')
    var oyy = await jimp.read(image);
    var kiyomasa = await oyy.resize(width, height).getBufferAsync(jimp.MIME_JPEG)
    return kiyomasa
  }
  async toImage(jid, path, caption, quoted, opt) {
    let buff = (await this.getBuffer(path)).buffer;
    return await this.sendMessage(jid, {
      image: buff,
      quoted,
      caption,
      thumbnail: buff,
      ...opt,
    });
  }

  async sendPoll(jid, name, opts, opt = {}) {
    let optss = opts.split("|").map(tr => {
      return {
        optionName: tr.trim()}})
    return await this.sendMessageFromContent(
      jid,
      {
        pollCreationMessage: {
          name,
          options: optss,
          selectableOptionsCount: optss.length
        }
      },
      opt
    )
  }

  async sendButton(mes, property, ...buttons) {
    property = property || {}
    function parseButton(type, obj) {
      return obj.title? {
        ...obj,
        rowId: obj.rowId || obj.value
      }: {[type.includes('reply') ? 'quickReplyButton': type+'Button']: {
          displayText: obj[type],
          [type.includes('reply') ? 'id': type.includes('call') ? 'phoneNumber': type]: obj.value || ''
        }}
    }
    let hasList = false
    let result_buttons = []
    let mess = await this.prepareMessage(`0@s.whatsapp.net`, property)
    mess.type = Object.keys(mess.message)[0]
    mess.data = Object.keys(mess.message[mess.type])
    let teks = (mess.type === 'conversation') ? mess.message.conversation: (mess.data.includes('caption')) ? mess.message[mess.type].caption: (mess.type == 'extendedTextMessage') ? mess.message[mess.type].text: property.content || ''
    buttons.forEach(rt => {
      if (Array.isArray(rt)) {
        let parse_button = rt.map(tr => {
          let type = Object.keys(tr).find(r => r != 'value').toLowerCase()
          return parseButton(type, tr)
        })
        if (rt && rt[0] && rt[0].title || hasList) {
          hasList = true
          result_buttons.push({
            rows: parse_button, title: rt[0].head
          })
        } else {
          result_buttons = result_buttons.concat(parse_button)
        }
      } else {
        if (rt.title || hasList) {
          hasList = true
          let findIndex = result_buttons.findIndex(tr => tr.title == rt.head)
          findIndex = findIndex != -1?findIndex: rt.head ? result_buttons.length: result_buttons.length-1
          result_buttons[findIndex] = result_buttons[findIndex] || {}
          result_buttons[findIndex].title = result_buttons[findIndex].title || rt.head
          result_buttons[findIndex].rows = result_buttons[findIndex].rows || []
          result_buttons[findIndex].rows.push(parseButton('ok', rt))
        } else {
          result_buttons.push(parseButton(Object.keys(rt).find(r => r != 'value').toLowerCase(), rt))
        }}})
    let parse;
    if (!hasList) {
      parse = {
        templateMessage: {
          hydratedTemplate: {
            templateId: Date.now()+``,
            hydratedContentText: teks,
            hydratedFooterText: property.footer || '',
            ...property,
            ...mess.message,
            hydratedButtons: result_buttons
          }}}
    } else {
      parse = {
        listMessage: {
          sections: result_buttons,
          title: '',
          description: teks,
          buttonText: '',
          listType: 1,
          footerText: property.footer || '',
          ...property
        }
      }
    }
    return await this.sendMessageFromContent(mes,
      {
        viewOnceMessage: {
          message: parse
        }
      }, property)
  }

  async sendSticker(mess, path, opt, exifFile) {
    let prepare;
    if (exifFile) {
      prepare = await this.prepareSticker(path, exifFile)
    } else {
      prepare = await this.prepareSticker(path)
    }
    return await this.sendMessage(typeof mess == 'object'? mess.key.remoteJid: mess, {
      sticker: prepare, ...opt
    })
  }

  async resizeImage(path, size) {
    if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');
    let buffer = await this.getBuffer(path, './tmp/'+Date.now().toString())
    if (!buffer.mime.includes('image')) return
    return new Promise((resolve, reject) => {
      exec(`mogrify -resize ${size} ${buffer.filename}`, (e, o) => {
        if (e) return reject(e)
        resolve(fs.readFileSync(buffer.filename))
        fs.unlinkSync(buffer.filename)
        return
      })
    })
  }
}