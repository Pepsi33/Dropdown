;(function(factory) {
    if (typeof define === "function" && define.amd) {
        // AMD模式
        define(["jquery"], factory);
    } else {
        // 全局模式
        factory(jQuery);
    }
}(function($) {

	function Dropdown(setting,el){
		this.$el = $(el);
		this.init(setting,el);
	}

	Dropdown.prototype.init = function(setting){

		var defaultSettings = {
			data:[],
			key:"id",
			text:"text",
			multiple:false||this.$el.attr("multiple"),
			searchable:true,
			limitCount:null,
			placeholder:"请选择",
			callback:noop,
			choice:noop
		}

		this.setting = $.extend(true,defaultSettings, setting);
		this.render();

		console.log(this);
	}

	//渲染
	Dropdown.prototype.render = function(){
		var _this = this,

			warp_class = this.setting.multiple?"dropdown-multiple":"dropdown-single";

		this.$el.wrap('<div class="dropdown-warp '+warp_class+'"></div>').addClass('hide');
		this.$warp = $(this.$el.parent(".dropdown-warp"));

		var arr = [];
		arr.push('<a href="javascript:;" class="dropdown-clear hide">×</a>');
		arr.push('<div class="dropdown-display"><input type="text" placeholder="'+this.setting.placeholder+'" readonly/></div>');
		arr.push('<div class="dropdown-main hide">');
		arr.push('<div class="dropdown-search"><input type="text" placeholder="请输入搜索" /></div>');
		arr.push('<div class="dropdown-list"><ul></ul><p class="dropdown-nodata-tips hide">查无数据</p></div>');
		arr.push('</div>');
		this.$warp.append(arr.join(""));

		this.$displayBox = this.$warp.find('.dropdown-display');
		this.$displayInput = this.$warp.find('.dropdown-display input');
		this.$clearbtn = this.$warp.find('.dropdown-clear');
		this.$searchInput = this.$warp.find('.dropdown-search input');
		this.$listBox = this.$warp.find('.dropdown-main');
		this.$listWarp = this.$warp.find('.dropdown-list ul');
		this.$tips = this.$warp.find('.dropdown-nodata-tips');


		this.renderOption();
		this.bind();

	}

	//选项渲染
	Dropdown.prototype.renderOption = function(){
		var len = this.setting.data.length,
			data = len == 0?this._getData():this.setting.data,
			li_tpl = '<li class="dropdown-option {{std_class}}" data-tag={{text}} data-index={{index}} data-value={{key}} {{disabled}}>{{text}}</li>',
			sl_tpl = '<option value={{key}} {{selected}}>{{text}}</option>',
			li_html = "",sl_html = "",
			k = this.setting.key,t = this.setting.text;
			
			console.log(data)

			$.each(data, function(i, v) {
				v.stdClass = v.selected?"dropdown-selected":"";
				v.disabled = v.disabled?"disabled":"";
				v.sl_std = v.selected?"selected":"";

				li_html += li_tpl.replace(/{{std_class}}/ig,v.stdClass)
								 .replace(/{{index}}/ig,i)
								 .replace(/{{disabled}}/ig,v.disabled||"")
								 .replace(/{{key}}/ig,v[k])
								 .replace(/{{text}}/ig,v[t]);
				
				if(len)  sl_html += sl_tpl.replace(/{{key}}/ig,v[k])
									 	  .replace(/{{text}}/ig,v[t])
									 	  .replace(/{{selected}}/ig,v.sl_std);
			});

			this.$listWarp.empty().append(li_html);
			if(len) this.$el.empty().append(sl_html);

			this._setDisplayText();

	};

	Dropdown.prototype.bind = function(){
		var _this = this;

		//点击显示
		this.$displayBox.on("click",function(){
			_this.$listBox.toggleClass('hide');
			_this.$clearbtn.show();

			if(_this.$listBox.hasClass('hide')){
				_this.$clearbtn.hide();
				_this._cb();
			}
			return false;
		});

		//清除
		this.$clearbtn.on("click",function(e){
			_this._clear();
			return false; 
		});


		this.$listBox.on("click",function(e){
			return false; 
		});

		//选择项点击事件
		this.$listWarp.on("click","li",function(){
			var oLi = $(this),
				oLis = _this.$listWarp.children();

			if(oLi.attr("disabled")) return false;

			if(_this.setting.multiple){
				oLi.toggleClass('dropdown-selected');
			}else{
				oLi.siblings().removeClass('dropdown-selected')
				oLi.toggleClass('dropdown-selected');
			}
			
			//执行选择选项的回调
			if(_this.setting.choice&&(typeof _this.setting.choice == "function")) _this.setting.choice();

			_this._setDisplayText();
			return false;

		});

		//其他地方点击隐藏list
		$(document).on("click",function(event) {
			if(_this.$listBox.hasClass('hide')) return;
			_this.$listBox.addClass('hide');
			_this.$clearbtn.hide();
			_this._cb();
		});

		//搜索输入
		this.$searchInput.on('input propertychange keyup change', function () {
			throttle(_this._search,_this)
            //_this._search();
        });

	}

	//搜索
	Dropdown.prototype._search = function(){
		var _this = this;
		var keyword = this.$searchInput.val();
		var reg = new RegExp(keyword);
		var selecterArr = [];
		var oLis = this.$listWarp.children();

		if(keyword&&keyword != ""){
			this.$listBox.addClass('search');
		}else if(keyword == ""){
			this.$listBox.removeClass('search');
			this.$tips.hide();
		}

		$.each(oLis,function(index,oLi){
			var item = $(oLi),
				value = item.data("tag");
			if(value.match(reg)){
				item.show();
				selecterArr.push(item);
			}else {
				if(selecterArr.length == 0){
					_this.$tips.show();
				}else{
					_this.$tips.hide();
				}
				item.hide();
			}
		});

		if(selecterArr.length == 0){
			this.$tips.show();
		}
	}

	//若无传入数据，则取元素数据
	Dropdown.prototype._getData = function(){
		var options = this.$el.children();
		var data = [];

		$.each(options, function(index, el) {
			data.push({
				id:$(el).val(),
				text:$(el).text()
			});
		});

		return data;
	}

	//若无传入数据，则取元素数据
	Dropdown.prototype._setDisplayText = function(){
		var _this = this,
			oLis = this.$listWarp.children(),
			arr = [];
		$.each(oLis, function(i, el) {
			if($(el).hasClass('dropdown-selected')){
				var index = $(el).data("index"),
					text = $(el).text();
				$("option",_this.$el).eq(index).prop('selected',true);
				arr.push(text);
			}else{
				var index = $(el).data("index");
				$("option",_this.$el).eq(index).prop('selected',false);
			}
		});

		this.$displayInput.val(arr.join(",")).attr("title",arr.join(","));

	}

	//清空
	Dropdown.prototype._clear = function(){

		var oLis = this.$listWarp.children();
			this.$el.val("");
			this.$displayInput.val("");

			$.each(oLis, function(i, el) {
				$(el).removeClass('dropdown-selected');
			});

	}

	//获取选中数据
	Dropdown.prototype.getSelected = function(){
		return this.$el.val();
	}

	//执行回调行数
	Dropdown.prototype._cb = function(){
		var selected = this.getSelected();
		var i = 1
		if(this.setting.callback&&(typeof this.setting.callback == "function")) this.setting.callback(selected);
		console.log("~~触发了回调~~",++i)
	}

	$.fn.dropdown = function(setting){
		$(this).each(function(index,el){
			new Dropdown(setting,el);
		});

		return this;
	}


	function noop(){}

	function throttle(method,context){
        if(method.tId)  clearTimeout(method.tId);
        method.tId = setTimeout(function(){
            method.call(context);
        },200);
    }

}))