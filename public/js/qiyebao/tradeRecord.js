$(document).ready(function() {

  $('.selector-list').on('click', 'dd', function() {
    var $this = $(this);
    if( $this.hasClass('trade-type') ) {
      setValue('type', $this.data('type'))
    }
    else if( $this.hasClass('trade-period') ) {
      setValue('period', $this.data('period'));
    }

    $('#tradeDetailForm').attr("action", "/qiyebao/tradeRecord").submit();
  });

  function setValue(type, val) {
    switch(type) {
      case 'type':
        $('#tradeType').val(val);
        break;
      case 'period':
        // $('#startDate').val((new Date()).format('yyyyMMdd'));
        // $('#endDate').val( getStartDate(val) );
        $('#period').val(val);
        break;
    }
    $('#currPage').val(1);
  }

  Date.prototype.format = function(fmt) {
    var o = {
      "M+" : this.getMonth() + 1, // 月份
      "d+" : this.getDate(), // 日
      "h+" : this.getHours(), // 小时
      "m+" : this.getMinutes(), // 分
      "s+" : this.getSeconds(), // 秒
      "q+" : Math.floor((this.getMonth() + 3) / 3), // 季度
      "S" : this.getMilliseconds()
    // 毫秒
    };
    if (/(y+)/.test(fmt))
      fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "")
          .substr(4 - RegExp.$1.length));
    for ( var k in o)
      if (new RegExp("(" + k + ")").test(fmt))
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k])
            : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
  };

  function getStartDate(period) {
    var today=new Date();
    var startDate="";
    if('0'==period){ //当天
      startDate=today.format("yyyyMMdd");
    } else if('1'==period){ //最近一周
      startDate=new Date(today.setDate(today.getDate()-7)).format("yyyyMMdd");
    } else if('2'==period){ //最近一个月
      startDate=new Date(today.setMonth(today.getMonth()-1)).format("yyyyMMdd");
    } else if('3'==period){ //最近三个月
      startDate=new Date(today.setMonth(today.getMonth()-3)).format("yyyyMMdd");
    } else if('4'==period){ //最近半年
      startDate=new Date(today.setMonth(today.getMonth()-6)).format("yyyyMMdd");
    } else if('5'==period){ //最近一年
      startDate=new Date(today.setYear(today.getFullYear()-1)).format("yyyyMMdd");
    }
    return startDate;
  }

})