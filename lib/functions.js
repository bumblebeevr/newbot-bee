const fs = require('fs')
const fetch = require('node-fetch');
const util = require('util');
const cheerio = require('cheerio');
const googleSearch = require('google-it')
const FileType = require('file-type');
const spin = require('spinnies');
const axios = require('axios');
const moment = require('moment-timezone');
const chalk = require('chalk');
const googleImage = require('g-i-s');
const Crypto = require('crypto');
const fakeUa = require('fake-useragent');
const baileys = require('@adiwajshing/baileys');
const qrcode = require('qrcode');
const FormData = require('form-data')
require('events').EventEmitter.defaultMaxListeners = 15;

const {
    exec,
    spawn,
    execSync
} = require('child_process');
process.on("uncaughtException", console.log);
module.exports = class Functions {
    constructor() {
        this.qrcode = qrcode;
        this.fakeUa = fakeUa;
        this.exec = exec;
        this.spins = spin;
        this.spawn = spawn;
        this.baileys = baileys;
        this.cheerio = cheerio;
        this.moment = moment;
        this.util = util;
        this.fs = fs;
        this.fetch = fetch;
        this.axios = axios;
        this.util = util;
        this.FileType = FileType;
        this.chalk = chalk;
        this.animate = new spin();
    }

    readmore(length) {
        return String.fromCharCode(8206).repeat(length)
    }

    needed(str) {
        return config.unicode.needed[0] + str + config.unicode.needed[1]
    }

    optional(str) {
        return config.unicode.optional[0] + str + config.unicode.optional[1]
    }

    logLoading(teks) {
        if (!Object.keys(this.animate.spinners).includes("Loading")) {
            this.animate.add('Loading', {
                text: teks
            });
        } else {
            this.animate.update('Loading', {
                text: teks
            });
        }
        return;
    }

    logColor(text, color) {
        return chalk.keyword(color)(text);
    }

    createExif(packname, authorname, filename) {
        if (!filename) filename = 'data';
        let json = {
            'sticker-pack-id': 'CreateByAqul-RemasteredByZbin',
            'sticker-pack-name': packname,
            'sticker-pack-publisher': authorname,
        };
        let stringify = JSON.stringify(json).length;
        let f = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]);
        let code = [0x00,
            0x00,
            0x16,
            0x00,
            0x00,
            0x00
        ];
        if (stringify > 256) {
            stringify = stringify - 256;
            code.unshift(0x01);
        } else {
            code.unshift(0x00);
        }
        let fff = Buffer.from(code);
        const ffff = Buffer.from(JSON.stringify(json));
        if (stringify < 16) {
            stringify = stringify.toString(16);
            stringify = '0' + stringify;
        } else {
            stringify = stringify.toString(16);
        }
        const ff = Buffer.from(stringify, 'hex');
        const buffer = Buffer.concat([f, ff, fff, ffff]);
        if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');
        fs.writeFileSync(`./tmp/${filename}.exif`, buffer);
        return `./tmp/${filename}.exif`;
    }

    pickRandom(obj) {
        if (obj instanceof Array) return obj[Math.floor(Math.random() * obj.length)]
        if (typeof obj == 'number') return Math.floor(Math.random() * obj)
    }

    randomize(data = []) {
        let result = []
        while (data.length !== result.length) {
            let id = Math.floor(Math.random() * data.length)
            if (!data[id]) continue;
            result.push(data[id])
            delete data[id]
        }
        return result
    }

    parseResult(json, options = {}) {
        let {
            list,
            head,
            upper,
            down,
            line
        } = config.unicode
        let opts = {
            unicode: true,
            ignoreVal: [null,
                undefined
            ],
            ignoreKey: [],
            title: config.botname2,
            headers: `----- _*%title*_ -----`,
            body: `- *%key*: _%value_`,
            footer: "-------",
            ...options,
        };
        let {
            unicode,
            ignoreKey,
            title,
            headers,
            ignoreVal,
            body,
            footer
        } = opts;

        let obj = Object.entries(json);
        let tmp = [];
        for (let [_key, val] of obj) {
            if (ignoreVal.indexOf(val) !== -1) continue;
            let key = _key[0].toUpperCase() + _key.slice(1);
            let type = typeof val;
            if (ignoreKey && ignoreKey.includes(_key)) continue;
            switch (type) {
                case 'boolean':
                    tmp.push([key, val ? 'Ya' : 'Tidak']);
                    break;
                case 'object':
                    if (Array.isArray(val)) {
                        tmp.push([key, val.join(', ')]);
                    } else {
                        tmp.push([
                            key,
                            this.parseResult(val, {
                                ignoreKey,
                                unicode: false
                            }),
                        ]);
                    }
                    break;
                default:
                    tmp.push([key, val]);
                    break;
            }
        }
        if (unicode) {
            let text = [
                headers.replace(/%title/g, title),
                tmp
                .map((v) => {
                    return body.replace(/%key/g, v[0]).replace(/%value/g, v[1]);
                })
                .join('\n'),
                footer,
            ];
            return text.join('\n').trim();
        }
        return tmp;
    }


    parseDate(format, date) {
        if (date) {
            return moment(date).locale('id').format(format);
        } else {
            return moment.tz('Asia/Jakarta').locale('id').format(format);
        }
    }

    parseByteName(number) {
        let tags = ["",
            "K",
            "M",
            "G",
            "T",
            "P",
            "E"
        ];
        let tier = Math.log10(Math.abs(number)) / 3 | 0;
        if (tier == 0) return number;
        let tag = tags[tier];
        let scale = Math.pow(10, tier * 3);
        let scaled = number / scale;
        let formatted = scaled.toFixed(1);
        if (/\.0$/.test(formatted))
            formatted = formatted.substr(0, formatted.length - 2);
        return formatted + tag + 'b';
    }

    parseRegex(string) {
        return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    }

    parseMs(milliseconds) {
        if (typeof milliseconds !== 'number') {
            throw new TypeError('Expected a number');
        }
        const roundTowardsZero = milliseconds > 0 ? Math.floor : Math.ceil;
        return {
            days: roundTowardsZero(milliseconds / 86400000),
            hours: roundTowardsZero(milliseconds / 3600000) % 24,
            minutes: roundTowardsZero(milliseconds / 60000) % 60,
            seconds: roundTowardsZero(milliseconds / 1000) % 60,
            milliseconds: roundTowardsZero(milliseconds) % 1000,
            microseconds: roundTowardsZero(milliseconds * 1000) % 1000,
            nanoseconds: roundTowardsZero(milliseconds * 1e6) % 1000
        };
    }

    isUrl(url) {
        return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'));
    }
    async metadataMsg(client, msg) {
        let chatMeta = async(mess) => {
            mess.sender = {}
            mess.realType = Object.keys(mess.message)[0]
            mess.message = mess.realType == 'ephemeralMessage' ? mess.message.ephemeralMessage.message : mess.message
            mess.message = mess.realType == 'viewOnceMessage' ? mess.message[mess.realType].message : mess.message
            mess.type = Object.keys(mess.message).find(tr => {
                let v = tr.toString().toLowerCase()
                return !v.includes("senderkey") && !v.includes('context')
            })
            mess.data = typeof mess.message[mess.type] == "object" ? Object.keys(mess.message[mess.type]).includes("contextInfo") ? Object.keys(mess.message[mess.type]).concat(Object.keys(mess.message[mess.type].contextInfo)) : Object.keys(mess.message[mess.type]) : Object.keys(mess.message)
            mess.string = (mess.type === 'conversation') ? mess.message.conversation : (mess.data.includes('caption')) ? mess.message[mess.type].caption : (mess.type == 'extendedTextMessage') ? mess.message[mess.type].text : (mess.type == 'templateButtonReplyMessage') ? mess.message[mess.type].selectedId : (mess.type == 'listResponseMessage') ? mess.message[mess.type].singleSelectReply.selectedRowId : ''
            mess.body = mess.message[mess.type]
            mess.from = mess.key.remoteJid
            mess.isGroup = mess.from.endsWith('g.us')
            mess.sender.jid = mess.isGroup ? mess.key.participant ? mess.key.participant : client.user.jid : mess.key.remoteJid
            mess.sender.name = mess.pushName
            mess.client = {};
            mess.client.name = client.user.name;
            mess.client.jid = client.user.id.split(':')[0] + '@s.whatsapp.net';
            mess.mentionedJid = mess.data.includes('contextInfo') && mess.data.includes('mentionedJid') ? mess.message[mess.type].contextInfo.mentionedJid : false;
            mess.isText = mess.type == 'conversation' || mess.type == 'extendedTextMessage'
            mess.isMedia = !mess.isText
            mess.id = mess.key.id
            mess.fromMe = mess.key.fromMe
            mess.quotedMsg = mess.data.includes('contextInfo') && mess.data.includes('quotedMessage') ? {
                key: {
                    remoteJid: mess.from,
                    fromMe: mess.message[mess.type].contextInfo.participant == client.user.jid,
                    id: mess.message[mess.type].contextInfo.stanzaId,
                    participant: mess.message[mess.type].contextInfo.participant
                },
                message: mess.message[mess.type].contextInfo.quotedMessage
            } : false
            mess.isOwner = mess.key.fromMe
            mess.groupData = false
            if (!(client.chats[mess.from])) client.chats[mess.from] = {};
            if (!(database[mess.from])) database[mess.from] = {};
            if (mess.isGroup) {
                mess.groupData = {};
                if (!(client.chats[mess.from].participants)) {
                    mess.groupData = await client.groupMetadata(mess.from)
                    client.chats[mess.from] = mess.groupData
                } else {
                    mess.groupData = {
                        ...client.chats[mess.from]
                    }
                }
                mess.groupData.desc = mess.groupData.desc ? mess.groupData.desc.toString() : ""
                delete mess.groupData.messages;
                mess.sender = {
                    ...mess.sender,
                    ...mess.groupData.participants.find(tr => tr.id == mess.sender.jid)
                }
                mess.client = {
                    ...mess.client,
                    ...mess.groupData.participants.find(tr => tr.id == mess.client.jid)
                }
            }
            //function
            mess.downloadMsg = async(save) => {
                return await client.downloadMessage(mess.message, save)
            };
            mess.deleteMsg = async(forAll) => {
                return client.sendMessage(msg.from, {
                    delete: msg.key
                })
            };
            mess.resendMsg = async(mes, opt) => {
                return await client.sendMessageFromContent(mes, mess.message, opt);
            };
            mess.quotedMsg = mess.quotedMsg ? (client.chats[mess.key.remoteJid] && client.chats[mess.key.remoteJid].messages && client.chats[mess.key.remoteJid].messages[mess.quotedMsg.key.id]) || await chatMeta(mess.quotedMsg) : false
            return mess;
        };
        return await chatMeta(msg)
    }

    async resizeImage(path, size) {
        if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');
        let buffer = await this.getBuffer(path, './tmp/' + Date.now().toString())
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

    async getBuffer(path, save, auto_ext = true) {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split `,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await fetch(path, {
            headers: {
                'User-Agent': fakeUa()
            }
        })).buffer() : fs.existsSync(path) ? fs.readFileSync(path) : typeof path === 'string' ? path : Buffer.alloc(0);
        let anu = await FileType.fromBuffer(buffer) || {
            ext: 'bin',
            mime: 'application/octet-stream'
        }
        if (save) {
            save = auto_ext ? save + '.' + anu.ext : save
            fs.writeFileSync(save, buffer)
            return {
                filename: save,
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
    async searchImage(query) {
        return new Promise(async(resolve, reject) => {
            await googleImage(query, resultImage)

            function resultImage(error, result) {
                if (error) reject(error)
                if (result) resolve(result)
            }
        })
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    async run() {
        try {
            await this.start();

            function generateGet(path) {
                return function(thisvalue,
                    key,
                    value) {
                    if (!fs.existsSync("./database/" + (path ? path.split("/")[0] : key) + ".json")) return;
                    let filevalue = require("../database/" + (path ? path.split("/")[0] : key) + ".json")
                    for (let tr of(path ? path + "/" + key : key).split('/')) {
                        filevalue = filevalue[tr]
                    }
                    if (!filevalue) return;
                    return (typeof filevalue == 'object' ? new Proxy(filevalue, {
                        set: generateSet(path ? path + "/" + key : key),
                        get: generateGet(path ? path + "/" + key : key)
                    }) : filevalue)
                }
            }

            function generateSet(path) {
                return function(thisvalue,
                    key,
                    value) {
                    if (!fs.existsSync("./database/" + (path ? path.split("/")[0] : key) + ".json")) fs.writeFileSync("./database/" + (path ? path.split("/")[0] : key) + ".json", "{}")
                    let filevalue = require("../database/" + (path ? path.split("/")[0] : key) + ".json")
                    let args = (path ? path + "/" + key : key).split("/").map(tr => `["${tr}"]`).join("").trim()
                    eval(`filevalue${args} = value`)
                    fs.writeFileSync("./database/" + (path ? path.split("/")[0] : key) + ".json",
                        JSON.stringify(filevalue, null, 2))
                    return filevalue
                }
            }
            if (!fs.existsSync("./database")) fs.mkdirSync("./database");
            global.config = require('../config.json');
            global.database = new Proxy({}, {
                set: generateSet(),
                get: generateGet()
            })
            global.baileys = baileys;
            global.functions = this;
            global.session = await baileys.useMultiFileAuthState('session');
            global.client = new(require('./waconnection.js'))(baileys.default({
                auth: session.state,
                printQRInTerminal: true,
                browser: ['sosmed manager',
                    'Desktop',
                    '3.0'
                ],
                syncFullHistory: false,
                logger: require('pino')({
                    level: 'silent'
                })
            }));
            client.chats = {};
            global.cmd = new(require('./command.js'))(client,
                config,
                functions);
            for (let a of fs.readdirSync('./lib/command')) require(`./command/${a}`);
            for (let b of fs.readdirSync('./lib/listener')) require(`./listener/${b}`);
            await this.delay(1000);
            this.animate.succeed('Loading', {
                text: 'Checking And Adding New Command Succeed'
            });
        } catch (e) {
            if (String(e).includes("spinner")) {
                console.log("Reconnecting...")
            } else {
                console.log({
                    Error: e,
                    path: __dirname
                });
            }
        }
    }
    async start() {
        console.clear()
        let kali = fs.readFileSync('./src/kali.cat').toString()
        let figlet = fs.readFileSync('./src/figlet.cat').toString()
        console.log(this.logColor(kali, 'silver'))
        console.log(this.logColor(`Starting Running Bot......`, 'silver'))
        await this.delay(3000)
        console.clear()
        console.log(this.logColor(figlet, 'silver'))
        await this.delay(100)
    }


    async googleSearch(query) {
        return googleSearch({
            query
        })
    }
}