var imaps = require('imap-simple');
require("dotenv").config()
const { inspect } = require("util")
const fs = require("fs")
const path = require("path")

var config = {
  imap: {
    user: process.env["EMAIL"],
    password: process.env["PASSWORD"],
    host: process.env["HOST"],
    port: 993,
    tls: true,
    authTimeout: 3000
  }
};
console.log(config)

imaps.connect(config).then(function (connection) {

  connection.openBox('INBOX').then(function () {

    // Fetch emails from the last 24h
    var delay = 24 * 3600 * 1000;
    var yesterday = new Date();
    yesterday.setTime(Date.now() - delay);
    yesterday = yesterday.toISOString();
    var searchCriteria = [porcess.env["SEARCH_CRITERIA"],];
    var fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], struct: true };

    // retrieve only the headers of the messages
    return connection.search(searchCriteria, fetchOptions);
  }).then(function (messages) {

    var attachments = [];
    var i = 0
    messages.forEach(function (message) {
      // i++
      // if (i > 10) {
      //   console.log(message.parts[0].body.from)
      //   process.exit(0)
      // }
      var parts = imaps.getParts(message.attributes.struct);
      attachments = attachments.concat(parts.filter(function (part) {
        return part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT';
      }).map(function (part) {
        // retrieve the attachments only of the messages with attachments
        return connection.getPartData(message, part)
          .then(function (partData) {
            return {
              filename: part.disposition.params.filename,
              data: partData,
              email:message.parts[0].body.from[0]
            };
          });
      }));
    });

    return Promise.all(attachments);
  }).then(function (attachments) {
    // console.log(attachments);
    for (let i of attachments){
      fs.writeFileSync(path.join(__dirname,"emails",i.email+i.filename), i.data)
    }
    // =>
    //    [ { filename: 'cats.jpg', data: Buffer() },
    //      { filename: 'pay-stub.pdf', data: Buffer() } ]
  });
});