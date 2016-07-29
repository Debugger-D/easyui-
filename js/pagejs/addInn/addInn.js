var innidNow;
//获取当前客栈ID
innidNow = window.parent.innidNow;
var ExtDataJson = {};
//设施初始化状态码
var initFaciOK = false;
var initPicsOK = false;
//房型设施关联表
var roomtypeFaci = [];
//选中状态的房型的roomtypeid
var currentRoomtypeid = "";
var currentCover = "";

$(function() {
  
  //省市区级联菜单 初始化
  initCitySelect();

  //初始化页面
  initPage();
  
  //图片上传控件
  picUpload('inn','#uploadify','#sceneryUlBox');
  picUpload('room','#uploadifyRoom','#roomTypeImgUlBox');
  picUpload('boss','#upBossPic','#bossPic');
  
  //百度地图引用
  var map;
  baiduMap();
  
  $('#innInfo').click(function() {
	  //进入基本页面加载查询
	  $('#queryBaseInfoBtn').click();
  });
	  
  $('#roomTypeExt').click(function() {
	  //进入房型页面加载查询
	  initExt();
  });
  
  //绑定点击事件--基本信息页面
  baseInfoClickEvent();

  //进入基本信息页面加载查询
  if(initFaciOK && initPicsOK){$('#queryBaseInfoBtn').click();}
  else{
	  var t = setTimeout("$('#queryBaseInfoBtn').click()",200);
  };
  
  //绑定点击事件--房型信息页面
  roomTypeClickEvent();
  
  //初始化优惠券页面
  initQueryDate();
  couponClickEvent();
	
});

function initCitySelect(){
	  
	  $("#city").citySelect({
	    url: "/yuelijiang/js/city.min.js",
	    //可设置默认地址
	    prov:"云南", //省份 
	    city:"丽江", //城市 
	    //dist:"", //区县 
	    nodata: "none" //当子集无数据时，隐藏select 
	  });	
}

function picUpload(type,id1,id2) {
  
  //上传图片控件初始化
  $(id1).uploadify({
    swf: '../../flash/uploadify.swf',
    height: 30,
    uploader: 'uploadImg.action',
    width: 120,
    fileObjName: 'uploadify',
    queueID: 'fileQueue', //与下面的id对应  
    queueSizeLimit: 10,
    fileSizeLimit: '10000KB',
    fileTypeDesc: '图片',
    fileTypeExts: '*.jpg; *.png;*.jpeg',
    buttonText: '浏览',
    buttonImage:'../../icons/uploadpic.png',
    removeCompleted: true,
    removeTimeout: 0,
    multi: true,
    onSelect: function() {$('span.loading').show();$('span.loadComplete').hide();},
    'onUploadSuccess': uploadSuccess
  });
  //上传成功响应事件
  function uploadSuccess(file, data, response) {
	$('span.loading').hide();
	$('span.loadComplete').show();
    data = eval("(" + data + ")");
    if (data.state == 1) {
      var text = '<li class="innImg">'
    	  + '<input type="hidden" name="id" value="">'
    	  + '<input type="hidden" name="pic" value="' 
    	  + data.message
    	  + '">' 
    	  + '<input type="hidden" name="rank" value="">'
    	  + '<div class="dragMask" style="display: none;"></div>' 
    	  + '<div class="imgBox">' 
    	  + '<em></em>' 
    	  + '<img src="' 
    	  + $.yuelj.imageurlPre + data.message + "_small" 
    	  + '" alt="">' 
    	  + '<div class="updatePicBox">' 
    	  + '<p class="updatePic"><span class="setCover"><em></em>设为封面</span><span class="deletePic"><em></em>删除</span></p>' 
    	  + '</div>' 
    	  + '</div>' 
    	  + '<p class="picIntro">' 
    	  + '<span>照片名称</span>' 
    	  + '<em></em></p>' 
    	  + '<p class="setPicIntro"><input type="text" name="imgName" value="照片名称" placeholder="填写照片名称"><span class="savePicIntro">保存</span></p>' 
    	  + '</li>';
      
      //调用新增批量图片接口
      var insertData ={};
      if(type == "inn"){
    	$(id2).append(text);
    	  
    	insertData.type = "inn";
        insertData.productid = innidNow;
        insertData.pic = data.message;
        insertData.name = "客栈照片";
        
	  	$.ajax({
	  		url : "/yuelijiang/seller/insertPictureProduct.action",
	  		data: {
	  	        entityJson: JSON.stringify(insertData)
	  	      },
	  		success : function(returnData) {

	  			$(id2+' li.innImg:last').find('input[name="id"]').val(returnData.id);
	  		}
	  	});
	  	
      }
      else if(type == "room" && currentRoomtypeid != ""){
    	  $(id2).append(text);
    	  
    	  insertData.type = "room";
          insertData.productid = currentRoomtypeid;
          insertData.pic = data.message;
          insertData.name = "房型照片";
          
  	  	$.ajax({
  	  		url : "/yuelijiang/seller/insertPictureProduct.action",
  	  		data: {
  	  	        entityJson: JSON.stringify(insertData)
  	  	      },
  	  		success : function(returnData) {
  	  			
  	  			$(id2+' li.innImg:last').find('input[name="id"]').val(returnData.id);
  	  		}
  	  	});
      }
      else if(type == "boss"){
    	  var imgSrc = $.yuelj.imageurlPre + data.message + "_small";
    	  $(id2).find('img').attr("src",imgSrc);
    	  $(id2).find('input[name="boss-pic"]').val(data.message);
      };
    }
  }
  
};

function initPage(){
	
	//设施列表初始化
	initFaci();
	
	//批量图片初始化
	initPics("inn",innidNow);
	
	//掌柜说初始化
	initPics("boss",innidNow);
};

function initFaci(){
	$.ajax({
		url : "/yuelijiang/seller/selectInnFacility.action",
		
		success : function(returnData) {
			$('.checkList').empty();
			$('#RoomFaciCheck').empty();
			for (var i in returnData.list){
				if(returnData.list[i].type == "inn"){
					$('.checkList').append('<label><input type="checkbox" name="facilities" value='+returnData.list[i].id+'>'+returnData.list[i].name+'</label>');
				}
				else if(returnData.list[i].type == "room"){
					var faci = {};
					faci.name = returnData.list[i].name;
					faci.id = returnData.list[i].id;
					roomtypeFaci.push(faci);
					$('#RoomFaciCheck').append('<label><input type="checkbox" name="facilities" value='+returnData.list[i].id+'>'+returnData.list[i].name+'</label>');
				}
			};
			initFaciOK = true; //设施列表初始化状态码，完成
		}
	});
}

function initPics(picType,picProductid){
	if(picType=="inn"){$('#sceneryUlBox').empty();}
	else if(picType=="room"){$('#roomTypeImgUlBox').empty();}
	
	 var reqdata = {
		      type: picType,
		      productid: picProductid
		    };
	
	$.ajax({
		url : "/yuelijiang/selectPictureProduct.action",
		data: {
	        entityJson: JSON.stringify(reqdata)
	      },
		success : function(returnData) {

			for (var i in returnData.list){
				var text = '<li class="innImg">'
					  + '<input type="hidden" name="id" value="'
					  + returnData.list[i].id
					  +'">'
			    	  + '<input type="hidden" name="pic" value="' 
			    	  + returnData.list[i].pic 
			    	  + '">' 
			    	  +'<input type="hidden" name="rank" value="'
			    	  + returnData.list[i].rank
			    	  +'">'
			    	  + '<div class="dragMask" style="display: none;"></div>' 
			    	  + '<div class="imgBox">' 
			    	  + '<em></em>' 
			    	  + '<img src="' 
			    	  + $.yuelj.imageurlPre + returnData.list[i].pic + "_small" 
			    	  + '" alt="">' 
			    	  + '<div class="updatePicBox">' 
			    	  + '<p class="updatePic"><span class="setCover"><em></em>设为封面</span><span class="deletePic"><em></em>删除</span></p>' 
			    	  + '</div>' 
			    	  + '</div>' 
			    	  + '<p class="picIntro">' 
			    	  + '<span>'
			    	  + returnData.list[i].name
			    	  + '</span><em></em></p>' 
			    	  + '<p class="setPicIntro"><input type="text" name="imgName" value="'
			    	  + returnData.list[i].name
			    	  +'" placeholder="照片名称"><span class="savePicIntro" >保存</span></p>' 
			    	  + '</li>';
				if(returnData.list[i].type == "inn"){
				      $('#sceneryUlBox').append(text);
				}
				else if(returnData.list[i].type == "room"){
					$('#roomTypeImgUlBox').append(text);
					//匹配并标注封面
			        $('#roomTypeImgUlBox li').each(function(){
			        	if($(this).find('input[name="pic"]').val() == currentCover){
			        		$(this).find(".imgBox em:first").addClass("coverIcon").text("封面");
			        	}
			        });
				}
				else if(returnData.list[i].type == "boss"){
					var text =  '<input type="hidden" name="boss-id" value="'
					  			+ returnData.list[i].id
					  			+'">'
					  			+ '<img src="' 
			    	  			+ $.yuelj.imageurlPre + returnData.list[i].pic + "_small" 
			    	  			+ '" alt="掌柜头像">'
			    	  			+ '<input type="text" id="boss-name" name="boss-name" placeholder="掌柜称呼" maxlength="8" value="'
					  			+ returnData.list[i].name
					  			+ '">'
			    	  			+ '<input type="hidden" name="boss-pic" value="'
			    	  			+ returnData.list[i].pic
			    	  			+ '">'
					  			+ '<textarea id="boss-desc" name="boss-desc" placeholder="掌柜推荐语,内容不超过100字" maxlength="100">'
					  			+ returnData.list[i].description
					  			+ '</textarea>';
			    	$('#bossPic').empty();
				    $('#bossPic').append(text);
				}
			};
			initPicsOK = true; //批量初始化状态码，完成
		}
	});
}

function baseInfoClickEvent() {
  //切换选项卡--基本信息--房型信息--优惠券
  $('ul.naviList li').click(function() {
    $(this).addClass('current').siblings().removeClass('current');
    $('ul.contentList>li').eq($(this).index()).show().siblings().hide();
  });
  
  //ul li模拟select 下拉列表效果
  $('span.selectShow').click(function() { //鼠标点击函数
    $(this).parent().find('ul').slideDown(); //找到ul.son_ul显示
    $(this).parent().find('li').hover(function() {
      $(this).addClass('hover')
    }, function() {
      $(this).removeClass('hover')
    }); 
    //li的hover效果
    $(this).parent().hover(function(){},
      function() {
        $(this).parent().find("ul").slideUp();
      }
    );
  });
  //通用点击列表事件
  $('.formList ul li').click(function() {
    $(this).parent().parent().find('span.selectShow').html($(this).html());
    $(this).parent().slideUp();
  });
  //客栈类型点击事件
  $('ul#innTypeList li').click(function() {
    $(this).parent().parent().find('input').val($(this).attr("data-value"));
  });

  //地址change
  $('#city select.prov').change(function() {
    $('.location input').val("");
    $('.location input[name="province"]').val($('#city select.prov').val());
  });
  $('#city select.prov').blur(function() {
    setProv();
  });  

  $('#city select.city').change(function() {
    $('.location input').val("");
    $('.location input[name="province"]').val($('#city select.prov').val());
    $('.location input[name="city"]').val($('#city select.city').val());

    if($('#city select.city').val() ==="丽江"){
    	$('#town').show();
    }else{$('#town').hide();
    $('#town input[name="town"]').val("0");
    $('#town select').val("")
    }    
  });
  $('#city select.city').blur(function() {
    setCity();
  });

  $('#city select.dist').change(function() {
    $('.location input').val("");
    $('.location input[name="province"]').val($('#city select.prov').val());
    $('.location input[name="city"]').val($('#city select.city').val());
    $('.location input[name="area"]').val($('#city select.dist').val());
  });
  $('#city select.dist').blur(function() {
    setArea();
  });

  $('#searchMap').click(function() {
    setLoc();
  });
  
  //所属古镇
  $('#town select').change(function(){
	  $('#town input[name="town"]').val($('#town select').val());
  })

  //地图
  function setProv() {
    map.clearOverlays();
    map.setCurrentCity($('#city select.prov').val());
    map.centerAndZoom($('#city select.prov').val(), 11);
  }

  function setCity() {
    map.clearOverlays();
    map.setCurrentCity($('#city select.city').val());
    map.centerAndZoom($('#city select.city').val(), 12);
  }

  function setArea() {
    map.centerAndZoom($('#city select.city').val() + $('#city select.dist').val(), 13);
  }

  //定位详细地址
  function setLoc() {
    map.clearOverlays();
    // 创建地址解析器实例
    var newGeo = new BMap.Geocoder();
    // 将地址解析结果显示在地图上,并调整地图视野
    newGeo.getPoint($('#city select.dist').val() + $('#location').val(), function(point) {
      if (point) {
        map.centerAndZoom(point, 16);
        $('#mapLng').val(point.lng);
        $('#mapLat').val(point.lat);
        var newMarker = new BMap.Marker(point);
        map.addOverlay(newMarker);
        newMarker.enableDragging(); // 可拖拽
        newMarker.addEventListener("dragend", function(e) {
          $('#mapLng').val(e.point.lng);
          $('#mapLat').val(e.point.lat);
        });

        map.centerAndZoom(point, 15);

      } else {
        alert("您选择地址没有解析到结果!");
      }
    }, $('#city select.city').val());
  }

  //根据经纬度定位 并添加标注
  function setLay(x, y) {
    map.clearOverlays();
    var point = new BMap.Point(x, y);
    var newMarker = new BMap.Marker(point);
    map.addOverlay(newMarker);
    newMarker.enableDragging(); // 可拖拽
    newMarker.addEventListener("dragend", function(e) {
      $('#mapLng').val(e.point.lng);
      $('#mapLat').val(e.point.lat);
    });
    map.centerAndZoom(point, 15);
  };

  //客服信息弹窗
  $('span#toService').click(function() {
    $('#dialogSercive').show();
  });
  $('#saveServiceBtn, em.close').click(function() {
    $('#dialogSercive').hide();
  });

  //上传图片弹窗
  $('#picShow').click(function() {
    $('#showAllPic').show();
  });
  $('#showAllPic em.close').click(function() {
    $('#showAllPic').hide();
  });

  //设置封面
  $(document).on('click','#sceneryUlBox li span.setCover',function() {
	$('#picShow img').attr("src", $.yuelj.imageurlPre+$(this).closest('li').find('input[name="pic"]').val());
	$('#picShow input').val($(this).closest('li').find('input[name="pic"]').val());
    $("#sceneryUlBox li em.coverIcon").removeClass("coverIcon").text("");
    $(this).closest('.imgBox').find("em:first").addClass("coverIcon").text("封面");
    
    //发送请求到服务器
    var reqdata = {
    	id: $('.formDiv input[name="id"]').val(),
    	innid: innidNow,
    	pic: $(this).closest('li').find('input[name="pic"]').val()
    };
    saveInnInfoExt(reqdata);
    
  });
  
  //设置删除效果
  $(document).on('click','#sceneryUlBox .deletePic',function() {
	    $(this).closest('li').remove();
	  //调用删除接口
	    var picDataid = "";
	    picDataid = $(this).closest('li').find('input[name="id"]').val();
	    deletePic(picDataid);
  });
  
  //修改图片描述 setPicIntro
  $(document).on('click','#sceneryUlBox .picIntro em',function() {
	    $(this).parent().hide().siblings('.setPicIntro').show();
  });
  $(document).on('click','#sceneryUlBox .savePicIntro',function() {
	    $(this).parent().hide().siblings('.picIntro').show();
	    $(this).parent().parent().find('.picIntro span').text($(this).parent().find('input[name="imgName"]').val());
	    
	    //调用更新接口
	    var picData ={};
	    picData.name = $(this).parent().find('input[name="imgName"]').val();
	    picData.id = $(this).closest('li').find('input[name="id"]').val();
	    updatePic(picData);
  });
  
  //查询客栈基本信息
  $('#queryBaseInfoBtn').click(function() {

    var reqdata = {
      id: innidNow
    };
    $.ajax({
      //url: "/yuelijiang/selectInnInfoExt.action",
      url: "/yuelijiang/selectInnInfo.action",
      data: {
        entityJson: JSON.stringify(reqdata)
      },
      success: function(returnData) {  
    	if(returnData.list.length){
    	$('#innName').text(returnData.list[0].name);
    	if(returnData.list[0].inninfoExt != null){
        $('.formDiv input[name="id"]').val(returnData.list[0].inninfoExt.id);
        
        $('.formDiv input[name="inntype"]').val(returnData.list[0].inninfoExt.inntype);
        $('.formDiv input[name="phone"]').val(returnData.list[0].inninfoExt.phone);
        $('.formDiv input[name="roomcount"]').val(returnData.list[0].inninfoExt.roomcount);
        $('.formDiv input[name="peoplecount"]').val(returnData.list[0].inninfoExt.peoplecount);
        $('.formDiv textarea[name="description"]').val(returnData.list[0].inninfoExt.description);
        $('.formDiv input[name="pic"]').val(returnData.list[0].inninfoExt.pic);
        $('#picShow img').attr("src",$.yuelj.imageurlPre+returnData.list[0].inninfoExt.pic);
        //匹配并标注封面
        $('#sceneryUlBox li').each(function(){
        	if($(this).find('input[name="pic"]').val() == returnData.list[0].inninfoExt.pic){
        		$(this).find(".imgBox em:first").addClass("coverIcon").text("封面");
        	}
        });
        $('.formrow input[name="servicename"]').val(returnData.list[0].inninfoExt.servicename);
        $('.formrow input[name="servicephone"]').val(returnData.list[0].inninfoExt.servicephone);
        $('.formrow input[name="serviceqq"]').val(returnData.list[0].inninfoExt.serviceqq);
        $('.formrow input[name="servicewechart"]').val(returnData.list[0].inninfoExt.servicewechart);
        $('.formrow input[name="commonwechart"]').val(returnData.list[0].inninfoExt.commonwechart);
        $('.formrow input[name="weibo"]').val(returnData.list[0].inninfoExt.weibo);

        var typeNum = returnData.list[0].inninfoExt.inntype - 1;
        $('#innTypeShow').html($('#innTypeList li').eq(typeNum).text());
        
        $('.formDiv input[name="province"]').val(returnData.list[0].inninfoExt.province);
        $('.formDiv input[name="city"]').val(returnData.list[0].inninfoExt.city);
        $('.formDiv input[name="area"]').val(returnData.list[0].inninfoExt.area);
        $('.formDiv input[name="longitude"]').val(returnData.list[0].inninfoExt.longitude);
        $('.formDiv input[name="latitude"]').val(returnData.list[0].inninfoExt.latitude);

        $('#city select.prov').val(returnData.list[0].inninfoExt.province).change();
        $('#city select.city').val(returnData.list[0].inninfoExt.city).change();
        $('#city select.dist').val(returnData.list[0].inninfoExt.area).change();
        $('.formDiv input[name="location"]').val(returnData.list[0].inninfoExt.location);
        setLay(returnData.list[0].inninfoExt.longitude, returnData.list[0].inninfoExt.latitude);
        
        //若有town属性 初始化古镇select
        if(returnData.list[0].inninfoExt.town != ""){
        	$('.formDiv input[name="town"]').val(returnData.list[0].inninfoExt.town);
        	$('#town select').val(returnData.list[0].inninfoExt.town);
        }

        var facilities = [];
        if(returnData.list[0].inninfoExt.facilities.length >0){
        	facilities = returnData.list[0].inninfoExt.facilities.split(",");
        };
        
        for (var i = 0; i < facilities.length; i++) {
          $('.checkList input[name="facilities"]').eq(facilities[i] - 1).prop("checked", true);
        };
        
        var keywords = [];
        keywords = returnData.list[0].inninfoExt.keyword.split("|");
        for (var i = 0; i < keywords.length; i++) {
          $('.keyword input[name="keyword"]').eq(i).prop("value", keywords[i]);
        };
        
    	}}
      }
    })
  });

  
  $('#saveBaseInfoBtn').click(function() {
	  
	//验证必填项
	$('#roomInfoForm').validationEngine();
	if($('#roomInfoForm').validationEngine('validate')){
			
		//保存客栈基本信息
	    var reqdata = {
	      innid: innidNow
	    };
	    $('#roomInfoForm .formDiv input').each(function() {
	      var name = $(this).attr("name");
	      reqdata[name] = $(this).val();
	    });
	    $('#roomInfoForm .formrow input').each(function() {
	      var name = $(this).attr("name");
	      reqdata[name] = $(this).val();
	    });
	    reqdata.description = $('#innIntro').val();
	    //标签
	    var keywords = [];
	    $('.formDiv input[name="keyword"]').each(function() {
	      if ($(this).val() != "") {
	    	  keywords.push($(this).val());
	      }
	    });
	    reqdata.keyword = keywords.join("|");
	    //设施
	    var facilities = [];
	    $('.checkList input[name="facilities"]').each(function() {
	      if ($(this).prop("checked")) {
	        facilities.push($(this).val());
	      }
	    });
	    reqdata.facilities = facilities.toString();
	    
	    ///保存客栈基本信息
	    saveInnInfoExt(reqdata);
	    
	    //保存掌柜说信息
	    saveBoss();
	  }
	});
};

function saveInnInfoExt(reqdata){
	//从客栈基本信息表取name
	reqdata.name = $('#innName').text();
	
    //根据id值判断是更新还是创建基本一条基本信息
    if(reqdata.id !=""){
    	for(var i in reqdata){
    		if(reqdata[i] == ""){
    			delete reqdata[i];
    		}else{
    			reqdata[i] = $.yuelj.trimStr(reqdata[i]);
    		}
    	}
    	$.ajax({
  	      url: "/yuelijiang/seller/updateInnInfoExt.action",
  	      data: {
  	        entityJson: JSON.stringify(reqdata)
  	      },
  	      success: function(returnData) {
  	        if (returnData != null && returnData.message != null) {
  	          if (returnData.state != 1) {
  	            $.yuelj.alertMessage("提示", returnData.message);
  	          } else {
  	            $.yuelj.alertMessage("提示", "更新成功！");
  	          }
  	          
  	        }
  	      }
  	    })
    }else{
    	for(var i in reqdata){
    		if(reqdata[i] == ""){
    			delete reqdata[i];
    		}else{
    			reqdata[i] = $.yuelj.trimStr(reqdata[i]);
    		}
    	}
    	
    	$.ajax({
    	      url: "/yuelijiang/seller/insertInnInfoExt.action",
    	      data: {
    	        entityJson: JSON.stringify(reqdata)
    	      },
    	      success: function(returnData) {
    	        if (returnData != null && returnData.message != null) {
    	          if (returnData.state != 1) {
    	            $.yuelj.alertMessage("提示", returnData.message);
    	          } else {
    	        	$('.formDiv input[name="id"]').val(returnData.id);
    	            $.yuelj.alertMessage("提示", "保存成功！");
    	          }
    	          
    	        }
    	      }
    	    })
    }
}

function saveBoss(){
	var reqdata ={};
	reqdata.type = "boss";
	reqdata.productid = innidNow;
	reqdata.id = $('#bossPic').find('input[name="boss-id"]').val();
	reqdata.name = $('#bossPic').find('input[name="boss-name"]').val();
	reqdata.pic = $('#bossPic').find('input[name="boss-pic"]').val();
	reqdata.description = $('#bossPic').find('textarea').val();
	
	var url = "";
	var bossdata = reqdata;
	if(bossdata.id != ""){
		url = "/yuelijiang/seller/updatePictureProduct.action";
	}else{
		url = "/yuelijiang/seller/insertPictureProduct.action";
		for(var i in bossdata){
			if(bossdata[i] == ""){
				delete bossdata[i];
			}
		}
	}
	
	$.ajax({
	  		url : url,
	  		data: {
	  	        entityJson: JSON.stringify(bossdata)
	  	      },
	  		success : function(returnData) {
	  		}
	  	});
}

//初始化百度地图
function baiduMap() {
  map = new BMap.Map("allmap"); // 创建Map实例

  if ($('#mapLng').val() == "" || $('#mapLat').val() == "") {
    map.centerAndZoom("丽江", 12);
    map.setCurrentCity("丽江"); //由于有3D图，需要设置城市哦
  } else {
    var point = new BMap.Point($('#mapLng').val(), $('#mapLat').val());
    map.centerAndZoom(point, 15);
    var marker = new BMap.Marker(point);
    map.addOverlay(marker);
    marker.disableDragging();
    var mycity = $('#city select.city').val()
    map.setCurrentCity(mycity);
  };

  var top_left_control = new BMap.ScaleControl({
    anchor: BMAP_ANCHOR_TOP_LEFT
  }); // 左上角，添加比例尺
  var top_left_navigation = new BMap.NavigationControl(); //左上角，添加默认缩放平移控件
  var mapType = new BMap.MapTypeControl({
    anchor: BMAP_ANCHOR_TOP_RIGHT
  });

  map.enableScrollWheelZoom(); //启用滚轮放大缩小
  map.addControl(top_left_control);
  map.addControl(top_left_navigation);
  map.addControl(mapType); //右上角，默认地图控件
};

function roomTypeClickEvent() {
	
  //给动态添加元素绑定事件 $(document).on('click',selector, function(){})
  //房型编辑
  $(document).on('click','p.roomEdit .editBtn', function() {
	  $('#updateRoomTypeForm input[name="id"]').val($(this).closest('.roomInfoBox').children('input[name="id"]').val());
	  $('#updateRoomTypeForm input[name="roomextid"]').val($(this).closest('.roomInfoBox').children('input[name="roomextid"]').val());
	  $('#updateRoomTypeForm input[name="roomtypeid"]').val($(this).closest('.roomInfoBox').children('input[name="id"]').val());
	  $('#updateRoomTypeForm input[name="name"]').val($(this).parent().children('.name').text()).attr('readonly','readonly');
	  $('#updateRoomTypeForm input[name="floor"]').val($(this).closest('.toEdit').find('em.floor').text());
	  $('#updateRoomTypeForm input[name="roomarea"]').val($(this).closest('.toEdit').find('em.roomarea').text());
	  $('#updateRoomTypeForm input[name="bedcount"]').val($(this).closest('.toEdit').find('em.bedcount').text());
	  $('#updateRoomTypeForm input[name="bedlength"]').val($(this).closest('.toEdit').find('em.bedlength').text());
	  $('#updateRoomTypeForm input[name="bedwidth"]').val($(this).closest('.toEdit').find('em.bedwidth').text());
	  $('#updateRoomTypeForm textarea[name="description"]').val($(this).closest('.toEdit').find('span.roomIntro').text());
	  var facilities = [];
	  $(this).parents('.toEdit').find('input[name="facilities"]').each(function() {
	     facilities.push($(this).val());
	  });
	  //清空设施列表勾选项
	  $('#updateRoomTypeForm input[name="facilities"]').prop("checked", false);
	  //添加设施勾选项
	  for (var i = 0; i < facilities.length; i++) {
          $('#updateRoomTypeForm input[name="facilities"]').each(function(){
        	  if($(this).val() == facilities[i]){
        		  $(this).prop("checked", true)
        	  }
          });
        };
    $('#dialoAddRoomType').show();
    $(document).on('click','#dialoAddRoomType em.close',function() {
	    $('#dialoAddRoomType').hide();
	});
    
  });
  
  //点击修改图片 弹出图片上传弹窗
  $(document).on('click','.roomInfoBox p.roomCoverFont',function() {
	   
	    currentRoomtypeid = "";
	    currentRoomtypeid = $(this).closest('li.roomInfoBox').find('input[name="id"]').val();
	    currentCover = "";
	    currentCover = $(this).closest('li.roomInfoBox').find('img.coverImg0').attr('picid');
	    initPics("room",currentRoomtypeid);
	    $('#roomTypeImg input[name="rank"]').val($(this).closest('li.roomInfoBox').attr('rank'));
	    $('#roomTypeImg').show();
	});
  $(document).on('click','#roomTypeImg em.close',function() {
	    $('#roomTypeImg').hide();
	});
  //设置封面
  $(document).on('click','#roomTypeImgUlBox li span.setCover',function() {
	var imgboxRank = "";
	var coverId = "";
	imgboxRank = $(this).closest('.ui-popups-body').find('input[name="rank"]').val();
	coverId = $(this).closest('li').find('input[name="pic"]').val();
	$('li.roomInfoBox img.coverImg0').eq(imgboxRank).attr("src", $.yuelj.imageurlPre+coverId);
    $("#roomTypeImgUlBox li em.coverIcon").removeClass("coverIcon").text("");
    $(this).closest('.imgBox').find("em:first").addClass("coverIcon").text("封面");
    $('li.roomInfoBox .noCover').eq(imgboxRank).hide();
    $('li.roomInfoBox .imgCoverShow').eq(imgboxRank).show();
    
    //向服务器发送修改封面pic请求
    var reqdata ={};
    reqdata.id = $('li.roomInfoBox input[name="roomextid"]').eq(imgboxRank).val();
    reqdata.innid = innidNow;
    reqdata.roomtypeid = $('li.roomInfoBox input[name="id"]').eq(imgboxRank).val();
	reqdata.pic = coverId;
	var roomTypeExt = {};
	roomTypeExt.id = $('li.roomInfoBox input[name="id"]').eq(imgboxRank).val();
	    
	if(reqdata.id != ""){
	    	
	    roomTypeExt.roomext = reqdata;
	    $.ajax({
	        url: "/yuelijiang/seller/updateInnRoomExt.action",
	        data: {
	            entityJson: JSON.stringify(roomTypeExt)
	        },
	        success: function(returnData) {
	            if (returnData != null && returnData.message != null) {
	                if (returnData.state != 1) {
	                    $.yuelj.alertMessage("提示", returnData.message);
	                } else {
	                    $.yuelj.alertMessage("提示", "封面修改成功！");
	                }
	            }
	        }
	    })
	  }else{
		delete reqdata.id;
		$.ajax({
	        url: "/yuelijiang/seller/insertInnRoomExt.action",
	        data: {
	            entityJson: JSON.stringify(reqdata)
	        },
	        success: function(returnData) {
	            if (returnData != null && returnData.message != null) {
	                if (returnData.state != 1) {
	                    $.yuelj.alertMessage("提示", returnData.message);
	                } else {
	                    $.yuelj.alertMessage("提示", "封面添加成功！");
	                }
	            }
	        }
	    })
	  }
  });
  
  //设置删除效果
  $(document).on('click','#roomTypeImgUlBox .deletePic',function() {
	    $(this).closest('li').remove();
	  //调用删除接口
	    var picDataid = "";
	    picDataid = $(this).closest('li').find('input[name="id"]').val();
	    deletePic(picDataid);
  });
  
  //修改图片描述 setPicIntro
  $(document).on('click','#roomTypeImgUlBox .picIntro em',function() {
	    $(this).parent().hide().siblings('.setPicIntro').show();
  });
  $(document).on('click','#roomTypeImgUlBox .savePicIntro',function() {
	    $(this).parent().hide().siblings('.picIntro').show();
	    $(this).parent().parent().find('.picIntro span').text($(this).parent().find('input[name="imgName"]').val());
	    
	    //调用更新接口
	    var picData ={};
	    picData.name = $(this).parent().find('input[name="imgName"]').val();
	    picData.id = $(this).closest('li').find('input[name="id"]').val();
	    console.log("picData : "+JSON.stringify(picData));
	    updatePic(picData);
  });

  //点击上传房型图片弹出上传弹窗
  $(document).on('click','.roomInfoBox .noCover',function() {
	    $('#roomTypeImg').show();
	    currentRoomtypeid = "";
	    currentRoomtypeid = $(this).closest('li.roomInfoBox').find('input[name="id"]').val();
	    initPics("room",currentRoomtypeid);
	    $('#roomTypeImg input[name="rank"]').val($(this).closest('li.roomInfoBox').attr('rank'));
	});
  
  //限制字符个数 代码有问题
//  $(document).on('each','span.roomIntro',function(){
//  var maxwidth=23;
//  if($(this).text().length > maxwidth){
//  $(this).text($(this).text().substring(0,maxwidth));
//  $(this).html($(this).html()+'...');
//  }
//  });
  
//更新房型
  $('#saveNewRoomBtn').click(function() {
	  
	//验证必填项
		$('#updateRoomTypeForm').validationEngine();
		if($('#updateRoomTypeForm').validationEngine('validate')){
  	//发给服务器
      var reqdata = {
      		innid: innidNow,
      		roomtypeid: $('#updateRoomTypeForm .idList input[name="roomtypeid"]').val()
      };

      $('#updateRoomTypeForm .formrow input').each(function() {
          var name = $(this).attr("name");
          reqdata[name] = $(this).val();
      });
      
      reqdata.description = $('#RoomTypeIntro').val();
      
      var facilities = [];
      $('#RoomFaciCheck input[name="facilities"]').each(function() {
          if ($(this).prop("checked")) {
              facilities.push($(this).val());
          }
      });
      reqdata.facilities = facilities.toString();
      
      for(var i in reqdata){
	  		if(reqdata[i] == ""){
	    	delete reqdata[i];
	  		}else{
	  			reqdata[i] = $.yuelj.trimStr(reqdata[i]);
  		}
	  	}
      
      var roomTypeExt = {};
	  roomTypeExt.id = $('#updateRoomTypeForm .idList input[name="id"]').val();
      
      //根据房型信息编辑表单中的 input[name="roomextid"] 判断是否要新增一条房型拓展信息
	  	if($('#updateRoomTypeForm .idList input[name="roomextid"]').val() != ""){
	  		reqdata.id = $('#updateRoomTypeForm .idList input[name="roomextid"]').val();
	  		roomTypeExt.roomext = reqdata;
		  	
	  	    $.ajax({
	  	        url: "/yuelijiang/seller/updateInnRoomExt.action",
	  	        data: {
	  	            entityJson: JSON.stringify(roomTypeExt)
	  	        },
	  	        success: function(returnData) {
	  	            if (returnData != null && returnData.message != null) {
	  	                if (returnData.state != 1) {
	  	                    $.yuelj.alertMessage("提示", returnData.message);
	  	                } else {
	  	                    $.yuelj.alertMessage("提示", "修改成功！");
	  	                    //更新房型展示信息
	  	                    $('#dialoAddRoomType').hide();
		                    initExt();
	  	                }
	  	            }
	  	        }
	  	    })
	  	}
	  	else {
	  		
	  	    $.ajax({
	  	        url: "/yuelijiang/seller/insertInnRoomExt.action",
	  	        data: {
	  	            entityJson: JSON.stringify(reqdata)
	  	        },
	  	        success: function(returnData) {
	  	            if (returnData != null && returnData.message != null) {
	  	                if (returnData.state != 1) {
	  	                    $.yuelj.alertMessage("提示", returnData.message);
	  	                } else {
	  	                    $.yuelj.alertMessage("提示", "保存成功！");
	  	                    //更新房型展示信息
	  	                    $('#dialoAddRoomType').hide();
	  	                    initExt();
	  	                }
	  	            }
	  	        }
	  	    })
	  	}
	}
  });
};

function initExt(){
	
	queryExt();

}
//查询房型信息
function queryExt(){
	$('ul.roomInfoList li').remove();
	var reqdata ={
			innid : innidNow
	};
	$.ajax({
		url : "/yuelijiang/selectInnRoomExtWeb.action",
		data : {
			entityJson: JSON.stringify(reqdata)
		},
		success : function(returnData) {

			$('ul.roomInfoList li').remove();
			for (var i in returnData.list){
				ExtDataJson =returnData.list[i];
				if(ExtDataJson.state="1"){
					appendTypeList(i,ExtDataJson);
				}
	        	
			};
		}
	});
}

function appendTypeList(rank,json){
	if(json.roomext != null){
		var faciText ="";
		var faciArry =[];
		faciArry = json.roomext.facilities.split(',');
		for(var i in faciArry){
			for(var j in roomtypeFaci){
				if(roomtypeFaci[j].id == faciArry[i]){
					faciText += '<em>'
						+ roomtypeFaci[j].name +'&nbsp;'
						+'<input type="hidden" name="facilities" value="'
						+ roomtypeFaci[j].id
						+ '"></em>';
				}
			}
		};
		var coverText ="";
		if(json.roomext.pic != ""){
			coverText = '<div class="imgCoverShow">'
			+'<img class="coverImg0" src="'
			+$.yuelj.imageurlPre+json.roomext.pic
			+'" picid="'+json.roomext.pic+'">'
			+'<p class="roomCoverFont">修改图片</p>'
			+'</div>'
			+'<div class="noCover" style="display: none;">'
			+'<em>+</em>'
			+'<p>上传房型图片</p>'
			+'</div>'
			+'</div>';
		}else{
			coverText = '<div class="imgCoverShow">'
				+'<img class="coverImg0" src="" picid="">'
				+'<p class="roomCoverFont">修改图片</p>'
				+'</div>'
				+'<div class="noCover">'
				+'<em>+</em>'
				+'<p>上传房型图片</p>'
				+'</div>'
				+'</div>';
		};
		var text =
			'<li class="roomInfoBox" rank="'
			+rank
			+'">'
			+'<input type="hidden" name="id" value="'
			+json.id
			+'">'
			+'<input type="hidden" name="roomextid" value="'
			+json.roomext.id
			+'">'
			+'<input type="hidden" name="roomtypeid" value="'
			+json.roomext.roomtypeid
			+'">'
			+'<div class="roomInfo">'
			+'<div class="roomCover">'
			+coverText
			+'<div class="toEdit">'
			+'<p class="roomEdit">'
			+'<span class="name">'
			+json.name
			+'</span>'
			+'<span class="editBtn"></span>'
			+'</p>'
			+'<div class="roomInfoShow">'
			+'<p><span>楼层：</span><span><em class="floor">'
			+json.roomext.floor
			+'</em>层</span></p>'
			+'<p><span>房间面积：</span><span><em class="roomarea">'
			+json.roomext.roomarea
			+'</em>m²</span></p>'
			+'<p><span>床数量：</span><span><em class="bedcount">'
			+json.roomext.bedcount
			+'</em>张床</span></p>'
			+'<p><span>床规格：</span><span><em class="bedlength">'
			+json.roomext.bedlength
			+'</em>cm x <em class="bedwidth">'
			+json.roomext.bedwidth
			+'</em>cm</span></p>'
			+'<p><span>房型设施：</span><span class="roomFacilities">'
			+faciText
			+'</span></p>'
			+'<p><span>房型简介：</span><span class="roomIntro">'
			+json.roomext.description
			+'</span></p>'
			+'</div>'
			+'</div>'
			+'</div>'
			+'</li>';

		$('ul.roomInfoList').append(text);
	}else{
	var text =
		'<li class="roomInfoBox" rank="'
		+rank
		+'">'
		+'<input type="hidden" name="id" value="'
		+json.id
		+'">'
		+'<input type="hidden" name="roomextid" value="">'
		+'<input type="hidden" name="roomtypeid" value="">'
		+'<div class="roomInfo">'
		+'<div class="roomCover">'
		+'<div class="imgCoverShow">'
		+'<img class="coverImg0" src="" picid=""　style="display: none;">'
		+'<p class="roomCoverFont">修改图片</p>'
		+'</div>'
		+'<div class="noCover">'
		+'<em>+</em>'
		+'<p>上传房型图片</p>'
		+'</div>'
		+'</div>'
		+'<div class="toEdit">'
		+'<p class="roomEdit">'
		+'<span class="name">'
		+json.name
		+'</span>'
		+'<span class="editBtn"></span>'
		+'</p>'
		+'<div class="roomInfoShow">'
		+'<p><span>楼层：</span><span><em class="floor">'
		+'</em>层</span></p>'
		+'<p><span>房间面积：</span><span><em class="roomarea">'
		+'</em>m²</span></p>'
		+'<p><span>床数量：</span><span><em class="bedcount">'
		+'</em>张床</span></p>'
		+'<p><span>床规格：</span><span><em class="bedlength">'
		+'</em>cm x <em class="bedwidth">'
		+'</em>cm</span></p>'
		+'<p><span>房型设施：</span><span class="roomFacilities">'
		+'</span></p>'
		+'<p><span>房型简介：</span><span class="roomIntro">'
		+'</span></p>'
		+'</div>'
		+'</div>'
		+'</div>'
		+'</li>';

	$('ul.roomInfoList').append(text);
	};
};

//批量图片接口 --删除
function deletePic(reqdata){
	$.ajax({
		url : "/yuelijiang/seller/deletePictureProduct.action",
		data: {
	        id: reqdata
	      },
		success : function(returnData) {
		}
	});	  
}
//批量图片接口 --修改
function updatePic(reqdata){

	$.ajax({
		url : "/yuelijiang/seller/updatePictureProduct.action",
		data: {
	        entityJson: JSON.stringify(reqdata)
	      },
		success : function(returnData) {

		}
	});	  
}

//图片排序
function changeOrder(obj,type){
		
	  var ulid;
	  if(type == 'inn'){ulid = "#sceneryUlBox"}
	  else if(type == 'roomtype'){ulid = "#roomTypeImgUlBox"};
	 
	  $(ulid).dragsort();
	  $(obj).parent().find('span:first').show();
	  $(obj).parent().find('.saveOrder').show();
	  $(obj).hide();
};
//退出排序
function saveOrder(obj,type){
	  
	  var ulid;
	  if(type == 'inn'){ulid = "#sceneryUlBox"}
	  else if(type == 'roomtype'){ulid = "#roomTypeImgUlBox"};
	  
	  $(ulid).dragsort("destroy");
	  $(obj).parent().find('.changeOrder').show();
	  $(obj).parent().find('span:first').hide();
	  $(obj).hide();
	  
	  var arrdata =[];
	  $(ulid+" li").each(function(){
		  $(this).find('input[name="rank"]').val($(this).index()+1);
		  var data ={};
		  data.id = $(this).find('input[name="id"]').val();
		  data.rank = $(this).find('input[name="rank"]').val();
		  arrdata.push(data);
		  
	  });
	  
	  $.ajax({
	  		url : "/yuelijiang/seller/batchUpdatePictureProduct.action",
	  		data: {
	  			piclist: JSON.stringify(arrdata)
	  	      },
	  		success : function(returnData) {}
	  	});
};

function couponClickEvent(){
	//新增优惠券弹窗
	$('#newCoupon').click(function() {
	    $('#dialogCoupon').show();
	});
	$('#dialogCoupon em.close').click(function() {
	    $('#dialogCoupon').hide();
	});
}

function initQueryDate() {
	$('#starttime').datebox({
		width : 80,
		value : $.yuelj.getDateStr(new Date()),
		hasDownArrow : false,
		editable : false
	});
	$('#endtime').datebox({
		width : 80,
		value : $.yuelj.getDateStr(new Date()),
		hasDownArrow : false,
		editable : false
	});
}