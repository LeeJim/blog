var express = require('express');
var router = express.Router();

router.get('/model', function(req, res, next) {
  res.render('backbone/model');
});

router.get('/collection', function(req, res, next) {
  res.render('backbone/collection');
});

router.get('/router', function(req, res, next) {
  res.render('backbone/router');
});

router.get('/view', function(req, res, next) {
  res.render('backbone/view');
});


// api
router.get('/man', function(req, res){
	res.send({name: 'leejim', type: 'get'});
})

router.post('/man', function(req, res){
	res.send({name: 'leejim', type:'post'});
})

module.exports = router;
