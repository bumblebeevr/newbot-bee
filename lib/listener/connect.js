var alreadyConnected = false;
process.on("uncaughtException", console.error);

client.ev.on('connection.update', async(update) => {
  if (update.connection == 'open') {
    alreadyConnected = true;
  } else if (update.connection == 'close') {
    if (global.shutoff) return process.send('close');
    return process.send('reset');
  }
});

client.ev.on ('creds.update', session.saveCreds);