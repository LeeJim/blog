var myComponnent = Vue.extend({
  template:'<p>it is component</p>'
})

Vue.component('lj', myComponnent)

new Vue({
  el:'#example',
  data: {
    collection:[],
    web:''
  },
  methods: {
    addWeb: function() {
      this.$http.get('/shot').then(function(res){
        console.log(res.data);
      })
    }
  }
})