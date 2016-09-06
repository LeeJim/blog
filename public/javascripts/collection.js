// 定义模型
var Book = Backbone.Model.extend({

    defaults : {
        title:'default'
    },

    initialize: function(){
        //alert('Hey, you create me!');
    }

});

// 定义收集器
var BookShelf = Backbone.Collection.extend({
    model : Book
});

// 实例化对象
var book1 = new Book({title : 'book1'});
var book2 = new Book({title : 'book2'});
var book3 = new Book({title : 'book3'});

// 收集对象 方式1
//var bookShelf = new BookShelf([book1, book2, book3]);

// 收集对象 方式2
var bookShelf = new BookShelf;
bookShelf.add(book1);
bookShelf.add(book2);
bookShelf.add(book3);

// 调用收集器方法 移除其中一个对象实例
bookShelf.remove(book3);


// 基于underscore 遍历收集器
bookShelf.each(function(book){
    alert(book.get('title'));
});

// GET请求
bookShelf.url = '/man';

bookShelf.fetch({
	success: function(collection, res, options){
		console.log(data);
	}
})

// POST请求
// var NewBooks = Backbone.Collection.extend({
//     model: Book,
//     url: '/books/'
// });

// var books = new NewBooks;

// var onebook = books.create({
//     title: "I'm coming",
// });