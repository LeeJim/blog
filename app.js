const express = require('express')
const app = express()
const webshot = require('webshot')

app.listen(2015, () => {
  console.log('express start on 2015');
})

app.use( express.static('dist') )

app.get('/', (req, res)=> {
  res.sendFile('index.html');
})

app.get('/shot', (req, res) => {
  var options = {
    screenSize: {
      width: 320
    , height: 480
    }
  , shotSize: {
      width: 320
    , height: 'all'
    }
  , userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us)'
      + ' AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g'
  };

  webshot('flickr.com', 'flickr.jpeg', options, function(err) {
    // screenshot now saved to flickr.jpeg
  });
})