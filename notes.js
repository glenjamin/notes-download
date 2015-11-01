var Imap = require('imap');
var repeat = require('repeat-string');
var html2text = require('html-to-text').fromString;

var imap = new Imap({
  user: process.env.EMAIL,
  password: process.env.PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true
});

var closing = false;

imap.once('ready', function() {

  imap.openBox('Notes', true, function(err, box) {
    if (err) throw err;
    var f = imap.seq.fetch('1:*', {
      bodies: ['HEADER.FIELDS (SUBJECT)', 'TEXT']
    });
    f.on('message', function(msg, seqno) {
      var message = { subject: '', text: '' };
      msg.on('body', function(stream, info) {
        var buffer = '';
        stream.on('data', function(chunk) {
          buffer += chunk.toString('utf8');
        });
        stream.once('end', function() {
          if (info.which == 'TEXT') {
            message.text = buffer;
          } else {
            var data = Imap.parseHeader(buffer);
            message.subject = data.subject[0];
          }
        });
      });
      msg.once('end', function() {
        console.log(message.subject);
        console.log(repeat('-', message.subject.length));
        var text = message.text.replace(/<\/div>/g, '<br></div>');
        console.log(html2text(text));
        console.log("============\n\n")
      });
    });
    f.once('error', function(err) {
      throw err;
    });
    f.once('end', function() {
      closing = true;
      imap.end();
    });
  });
});

imap.once('error', function(err) {
  if (!closing) throw err;
});

imap.once('end', function() {
  console.log('Connection ended');
});

imap.connect();
