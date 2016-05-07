var express = require('express');
var router = express.Router();

router.use( (req, res, next) => {
  console.log('first use');
  next();
});

router.get('/', (req, res, next) => {
	// res.send('home page');
  console.log('action');
  next();
});

router.get('/pagination', (req, res) => {
	var page = {
		curPage: req.query.page || 1,
		totalPage: 10,
	};

	res.render('pagination', {
		pageInfo:page
	});
});

router.use( (req, res) => {
  console.log('last');
  res.end('home page');
})
module.exports = router;