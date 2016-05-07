var express = require('express')
var bodyParser = require('body-parser')

var app = express()

app.set('views', './views')
app.set('view engine','jade')

app.use(express.static('public'))
// 解析post的数据
app.use(bodyParser.urlencoded({
  extended: true
}))


// 路由Route
var sharePlanRouter = require('./route/sharePlan'),
    labRouter = require('./route/lab'),
    testRouter = require('./route/test');

app.use('/shareplan', sharePlanRouter)
app.use('/lab', labRouter)
app.use('/test', testRouter)


// 端口port
app.listen(3000, function() {
	console.log('app is listen to 3000!');
})