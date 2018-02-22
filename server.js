require('dotenv').config();

var express = require('express');
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
      controllers.messenger_receive(event);
    }
  }
  res.sendStatus(200);
});

var messenger_receive = function (event) {
  var token = event.message.text.trim();
  var mid = event.sender.id;
  if (token.substring(
    0, process.env.TOKEN_PREFIX.length
  ) == process.env.TOKEN_PREFIX) {
    storage.get('token-to-sid', token, function (err, sid) {
      if (sid) {
        storage.set('mid-to-sid', mid, sid);
        storage.set('sid-to-mid', sid, mid);
        storage.del('token-to-sid', token);
        utils.messenger_send(mid, 'Awesome! You\'re all set up :)');
      } else {
        utils.messenger_send(mid, 'Invalid token--try a new one!');
      }
    });
  } else {
    utils.messenger_send(mid, 'Hello friend!');
  }
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

app.listen(process.env.PORT, function() {
  console.log("running at port " + process.env.PORT);
});
