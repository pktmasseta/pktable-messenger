require('dotenv').config();

var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();
var PORT = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/messenger_webhook', function (req, res) {
  if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge'])
  } else {
    res.send('Error, wrong token')
  }
});

app.post('/messenger_webhook', function (req, res) {
  var messaging_events = req.body.entry[0].messaging;
  for (var i = 0; i < messaging_events.length; i++) {
    var event = messaging_events[i];
    if (event.message && event.message.text) {
      messenger_receive(event);
    }
  }
  res.sendStatus(200);
});

var messenger_receive = function (event) {
  var userId = event.sender.id;
  var text = event.message.text;
  messenger_broadcast(text);
}

var messenger_send = function (userId, text) {
  var options = {
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    method: 'POST',
    qs: {
      'access_token': process.env.FB_ACCESS_TOKEN
    },
    json: {
      'recipient': {
        'id': userId
      },
      'message': {
        'text': text
      }
    }
  };
  request(options);
}

var messenger_broadcast = function (text) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/message_creatives',
    method: 'POST',
    qs: {
      'access_token': process.env.FB_ACCESS_TOKEN
    },
    json: {
      'messages': [{
        'text': text
      }]
    }
  }, function(err, response, body) {
    var creativeId = body.message_creative_id;
    request({
      uri: 'https://graph.facebook.com/v2.6/me/broadcast_messages',
      method: 'POST',
      qs: {
        'access_token': process.env.FB_ACCESS_TOKEN
      },
      json: {
        'message_creative_id': creativeId
      }
    })
  });
}

app.listen(process.env.PORT, function() {
  console.log("running at port " + process.env.PORT);
});
