$(function(){
	// 定义模型
	var Man = Backbone.Model.extend({

		url: '/man',

		// 初始化函数
		initialize: function(){

			console.log('initialize: create a man');
			console.log('initialize: you name is ' + this.get('name'));
			
			// 监听属性值变化
			this.bind('change:name', function(){
				console.log('your new name is ' + this.get('name'))
			})

			// 添加验证
			this.bind('invalid', function(model, error){
				console.log(error)
			})
		},

		// 初始化值
		defaults: {
			name: 'default name',
			age: 20
		},

		// 定义方式
		sayHi: function(){
			console.log('hello! my name is ' + this.get('name'))
		},

		// 验证方法
		validate: function(attributes){
			if(attributes.name == '') {
         return "name不能为空！";
      }
		}
	})

	// 初始化实例对象
	window.man = new Man();

	// 修改属性 -> 触发change事件
	man.set({name: 'leejim'});

	// 手动触发验证 方式1
	// man.set({name: ''}, {'validate':true});

	// 手动触发验证 方式2
	// man.save();

	// 执行方法
	man.sayHi();

	// 发GET请求到指定的url
	// man.fetch();

	// 发POST请求到指定的url
	// man.save();
})