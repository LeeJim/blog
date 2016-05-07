var express = require('express');
var router = express.Router();
var webshot = require('webshot');



router.get('/', (req, res) => {
  console.log(111);

  res.render('sharePlan/index');
  // var options = {
  //   userAgent: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.75 Safari/537.36"
  // };

  // webshot('www.smzdm.com', 'smzdm1.png', options, function(err) {
  //   // screenshot now saved to google.png
  //   if(err) {
  //     console.log(err);
  //   }
  //   else {
  //     res.end('test page');
  //   }
  // });

});

module.exports = router;