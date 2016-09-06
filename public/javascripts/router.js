// 定义路由
var Router = Backbone.Router.extend({
	
	// 设置路由对应的方法
	routes: {
      "posts/:id/:name" : "getPost",
      "*actions" : "defaultRoute"
  },

  // 定义方法
  getPost: function(id, id2) {
      console.log(id);
  },

  // 定义方法
	defaultRoute: function(){
		console.log('defaultRoute');
	}
})

// 初始化路由实例
var approuter = new Router();

// 开始历史纪录 无下面这样代码 路由不起作用
Backbone.history.start();