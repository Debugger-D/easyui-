/**
 * 房态页面js
 */
// 客栈id
var innidNow;
// 用户权限
var permissionList = null;
// 房型列表
var roomTypeList;
// 房间列表，作为房态表的左侧
var roomList = [];
// 房态表数据
var roomtableData = [];
// 房态查询开始时间距离今日天数
var beginDateFrom = -3;
// 房态查询结束时间距离今日天数
var endDateTo = 30;
// 主订单列表,及其下属的其他所有信息
var returnOrderList = [];
// 订单视图的前一个状态
var preState = 0;
// 入住人的数量
var customeri = 0;
var columns = [];
// 特殊价格
var specialPriceList = {};
// 锁房列表
var lockRoomList = {};
$(function() {
	$.yuelj.checkPermission("inn_seller");
	innidNow = window.parent.innidNow;
	initColumns();
	initTable();
	// 加载房态
	loadRoomState();
	// 屏幕大小变化自适应
	resizeTable();
	// 初始化提醒时间
	initRemindTime();
	// 初始客人来源渠道下拉
	initChannel();
	// 初始支付方式下拉
	initPayment();
});

function addDay(i) {
	return $.yuelj.addDay(new Date(), i);
}
function initColumns() {
	columns = [];
	for (var i = beginDateFrom; i <= endDateTo; i++) {
		var field = $.yuelj.getDateStr(addDay(i));
		var monthday = '<span style="font-weight: bold;">'
				+ $.yuelj.getMonthDay(addDay(i)) + '</span>';

		var day = $.yuelj.getDateStr(addDay(i))
		var holiday = M.Holiday();
		var value = holiday.getholiday(day);
		if (value != null && value.length != 0) {
			monthday = '<span style="color:red;font-weight: bold;">' + value
					+ '</span>';
		}
		if (i == 0) {
			monthday = '<span style="color:red;font-weight: bold;">今天</span>';
		}
		if (i == -1) {
			monthday = '<span style="font-weight: bold;">昨天</span>';
		}
		columns.push({
			field : field,
			title : '<div  style="margin-top:10px;">' + monthday
					+ "&nbsp;&nbsp;" + $.yuelj.getWeekDay(addDay(i))
					+ '</br><span id="leftRoom' + field + '">剩7间</span></div>',
			align : "center",
			width : 80
		});
	}
}
function initTable() {
	var titlehtml = '<div style="float:left;margin-top:5px;"><a href="javascript:void(0);" onclick="selectPrevMonth();">'
			+ '<img src="/yuelijiang/icons/btn-prev-new.png" alt="<"></a>'
			+ '</div><div style="margin-top:5px;float:left;"><span id="queryDateText">'
			+ '<a href="javascript:void(0);" onclick="selectDate();" style=" text-decoration:none;font-size:14px;" >'
			+ $.yuelj.getMonthDay(addDay(beginDateFrom))
			+ "~"
			+ $.yuelj.getMonthDay(addDay(endDateTo))
			+ '</a></span><div id="queryDateDiv">'
			+ '<input id="queryDate" type="text" class="easyui-datebox" style="display:none;" /></div><div>'
			+ new Date().getFullYear()
			+ '</div></div>'
			+ '<div style="float:right;margin-top:5px;"><a href="javascript:void(0);" onclick="selectNextMonth();">'
			+ '<img src="/yuelijiang/icons/btn-next-new.png" alt="<"></a>'
			+ '</div>';
	$("#roomStateTable").datagrid({
		loadMsg : '数据加载中,请稍后...',
		singleSelect : true,
		columns : [ columns ],
		frozenColumns : [ [ {
			field : 'roomsColumn',
			title : titlehtml,
			align : "center",
			sortable : false,
			resizable : false
		} ] ],
		// 在单击房态表某个单元格时触发
		onClickCell : function(index, field, value) {
			clickCellFun(index, field, value);
		},
		// 取消行选中的样式
		onBeforeSelect : function() {
			return false;
		},
		autoRowHeight : false,
		// 设置每一行高度
		rowStyler : function(index, row) {
			return 'height:60px;';
		},
		onLoadSuccess : function() {
			$(this).prev().find('div.datagrid-body').unbind('mouseover')
		}
	});
	initQueryDate();
}
function selectPrevMonth() {
	beginDateFrom = beginDateFrom - 30;
	endDateTo = endDateTo - 30;
	initColumns();
	initTable();
	loadRoomState();
}
function selectNextMonth() {
	beginDateFrom = beginDateFrom + 30;
	endDateTo = endDateTo + 30;
	initColumns();
	initTable();
	loadRoomState();
}
function selectDate() {
	$("#queryDate").datebox("showPanel");
}
function initRemindTime() {
	$('#remindTime').datetimebox({
		width : 150,
		height : 30,
		hasDownArrow : false,
		onSelect : function(date) {
		},
		editable : false
	});
}
// 初始支付方式下拉
var paymentList;
function initPayment() {
	$.ajax({
		url : "/yuelijiang/seller/queryPaymentConfig.action",
		data : {
			innId : innidNow,
			state : 1
		},
		success : function(returnData) {
			paymentList = returnData.list;
			for ( var i in paymentList) {
				$("[name='paymentid']").append(
						'<option value="' + paymentList[i].id + '">'
								+ paymentList[i].name + '</option>');
			}
		}
	});
}

// 初始客人来源渠道下拉
function initChannel() {
	$.ajax({
		url : "/yuelijiang/seller/queryGuestSource.action",
		data : {
			innId : innidNow,
			state : 1
		},
		success : function(returnData) {
			var channelList = returnData.list;
			for ( var i in channelList) {
				$("#channel").append(
						'<option value="' + channelList[i].id + '">'
								+ channelList[i].channelName + '</option>');
			}
		}
	});
}
var selectedCell = {};
// 根据roomtableData的数据刷新房态表及其css样式
function refreshRoomStateTable() {
	// 将特殊价格加载到单元格中
	loadSpecialPriceToTable();
	loadleftRoom();
	$('#roomStateTable').datagrid("loadData", {
		"rows" : roomtableData
	});
	// 初始化tooltip
	initToolTip();
	$("[name='unselect']").parent().parent().removeClass("selectedCell");
	$("[name='selected']").parent().parent().addClass("selectedCell");
	$("[name='locked']").parent().parent().addClass("lockedCell");
	// 根据订单状态，单元格背景颜色不同
	$("[name='ordered']").each(function() {
		var state = $(this).attr("state");
		if (state == "1") {
			$(this).parent().parent().addClass("orderedCell");
		} else if (state == "2" || state == "3") {
			$(this).parent().parent().addClass("checkinCell");
		} else if (state == "4") {
			$(this).parent().parent().addClass("checkoutCell");
		}
	});
	if (mainorderid != null) {
		// 红色边框高亮，主订单id相同的所有单元格
		$("[mainorderid='" + mainorderid + "']").attr("selected", "selected");
		$("[mainorderid='" + mainorderid + "']").parent().parent().css(
				"border", "1px solid red");
	}
}
// 初始化tooltip
var tooltipArr = [];
function initToolTip() {
	function showTooltip(obj) {
		if ($(obj) == null || $(obj).tooltip == null
				|| $(obj).tooltip('tip') == null) {
			return;
		}
		$(".tooltip").hide();
		tooltipArr.push(obj);
		$(obj).tooltip('tip').css({
			backgroundColor : '#fff',
			borderColor : 'rgb(241,241,241)'
		});
		$(obj).tooltip('tip').show();
	}
	$("[name='ordered']")
			.each(
					function() {
						var mainoid = $(this).attr("mainorderid");
						var totalprice = parseFloat(returnOrderList[mainoid].orderMain.totalprice);
						var payedprice = parseFloat(returnOrderList[mainoid].orderMain.payedprice);
						var needpay = totalprice - payedprice;
						var needPayhtml = "";
						if (needpay > 0) {
							needPayhtml = "需补房费：<span  style='color:red;'>￥"
									+ needpay + "</span>";
						} else {
							needPayhtml = "需退房费：<span  style='color:red;'>￥"
									+ (-needpay) + "</span>";
						}
						var content = '<span style="color:#000">'
								+ returnOrderList[mainoid].orderMain.channelname
								+ '</span></br>'
								+ '<span style="color:#000">'
								+ returnOrderList[mainoid].guestList[0].name
								+ '('
								+ returnOrderList[mainoid].guestList[0].phone
								+ ')</span></br>'
								+ '<span style="color:green">'
								+ returnOrderList[mainoid].orderMain.firstcheckin
										.substr(5, 9)
								+ '</span>入住~<span style="color:green">'
								+ returnOrderList[mainoid].orderMain.lastcheckout
										.substr(5, 9)
								+ '</span>退房</br>'
								+ '<div style="border-top:1px solid gray;margin-top:3px;"><div style="margin-top:3px;"><span style="color:#000;">订单金额：￥'
								+ (returnOrderList[mainoid].orderMain.totalprice + "")
										.replace(".00", "")
								+ '</span><span style="color:#000;margin-left:10px;">'
								+ needPayhtml + '</span></div></div>';
						$(this).parent().parent().tooltip({
							position : 'right',
							content : content,
							onShow : function() {
								showTooltip(this);
							}
						});
					});
	$("[name='selected'],[name='unselect']").each(
			function() {
				var index = $(this).attr("index");
				var field = $(this).attr("field");
				var price = roomtableData[index].price;
				var typeid = roomtableData[index].typeid;
				var name = roomtableData[index].name;
				if (specialPriceList[typeid][field] != null) {
					price = specialPriceList[typeid][field].price;
				}
				$(this).parent().parent().tooltip(
						{
							position : 'right',
							content : '<span style="color:#000">房型：' + name
									+ '</br>日期：' + field.substr(5, 9)
									+ '</br>价格：￥' + price + '</span>',
							onShow : function() {
								showTooltip(this);
							}
						});
			});
	$("[name='locked']").each(function() {
		$(this).parent().parent().tooltip({
			position : 'right',
			content : '<span style="color:#000">已被预定</span>',
			onShow : function(e) {
				showTooltip(e);
			}
		});
	});
}
// 加载剩余房间数
function loadleftRoom() {
	var totalroom = roomtableData.length;
	for (var i = beginDateFrom; i <= endDateTo; i++) {
		var field = $.yuelj.getDateStr(addDay(i));
		var fieldleft = totalroom + 0;
		for ( var j in roomtableData) {
			var coValue = roomtableData[j][field];
			if (coValue != null) {
				coValue = coValue + "";
				if (coValue.indexOf("ordered") != -1
						|| coValue.indexOf("locked") != -1) {
					fieldleft--;
				}
			}
		}
		$("#leftRoom" + field).html("剩" + fieldleft + "间");
	}
}
// 更新订单为true，新增预订或入住为false
var editing = false;
var mainorderid = null;
// 单击选择房态中的某天某房间
function clickCellFun(index, field, value) {
	// 已锁房
	if (value != null && value.indexOf("locked") != -1) {
		return;
	}
	// 1预定，2预定转入住，3直接入住，4退房
	var state = 1;
	// 若该房间该天已经存在订单,则为查看订单数据
	if (value != null && value.indexOf("ordered") != -1) {
		// 若订单处于编辑中，可以删除入住房间
		if (editingOrder) {
			// 不是当前订单
			if ($($.parseHTML(value)[0]).attr("mainorderid") != mainorderid) {
				return;
			}
			// 该房间该天已经被选中，删除该房间
			var detailid = $($.parseHTML(value)[0]).attr("detailid");
			roomtableData[index][field] = '<div name="unselect" index="'
					+ index + '" field="' + field + '"></div>';
			deleteDetailList.push(detailid);
			refreshRoomStateTable();
			// 根据选中的单元格，加载相关数据到订单视图
			loadOrderView(mainorderid);
			return;
		}
		mainorderid = null;
		editing = true;
		// 先清除所有选中的样式
		$("[name='ordered']").parent().parent().css("border-color", "#ccc");
		$("[name='selected']")
				.each(
						function() {
							$(this).attr("name", "unselect");
							var index = $(this).attr("index");
							var field = $(this).attr("field");
							roomtableData[index][field] = '<div name="unselect" index="'
									+ index + '" field="' + field + '"></div>';
						});
		$("[name='unselect']").parent().parent().removeClass("selectedCell");
		// 获取选中的主订单orderid
		mainorderid = $($.parseHTML(value)[0]).attr("mainorderid");
		var selectAttr = $("[mainorderid='" + mainorderid + "']").attr(
				"selected");
		if (selectAttr != null && selectAttr == "selected") {
			// 已经选中,则取消选中
			$("[mainorderid='" + mainorderid + "']").removeAttr("selected");
			closeOrderView();
			$("[name='ordered']").removeAttr("selected");
			return;
		}
		var orderstate = $("[mainorderid='" + mainorderid + "']").attr("state");
		if (orderstate == 1) {
			// 已预订，办理入住
			state = 3;
		} else if (orderstate == 2 || orderstate == 3) {
			// 已入住，办理退房
			state = 4;
		} else {
			// 查看订单信息
			state = 6;
		}
	} else
	// 若该房间该天不存在订单
	{
		// 若订单处于编辑中，可以添加入住房间
		if (editingOrder) {
			// 若该房间该天未被选中
			if (value == null || value.indexOf("unselect") != -1) {
				roomtableData[index][field] = '<div name="selected" index="'
						+ index + '" field="' + field + '"></div>';
				// 若该房间该天已被选中
			} else if (roomtableData[index][field].indexOf("selected") != -1) {
				roomtableData[index][field] = '<div name="unselect" index="'
						+ index + '" field="' + field + '"></div>';
			}
			refreshRoomStateTable();
			// 根据选中的单元格，加载相关数据到订单视图
			loadOrderView(mainorderid);
			// 若没有选中的单元格，关闭视图
			var j = 0;
			for ( var i in selectedCell) {
				j++;
			}
			if (j == 0) {
				closeOrderView();
			}
			return;
		}
		mainorderid = null;
		editing = false;
		// 清空客人记录
		$("#customerList").html("");
		// 增加一个客人记录
		addCustomerClick();
		$("[name=clearCustomer]").hide();
		// 若该房间该天未被选中
		if (value == null || value.indexOf("unselect") != -1) {
			roomtableData[index][field] = '<div name="selected" index="'
					+ index + '" field="' + field + '"></div>';
			// 若该房间该天已被选中
		} else if (value.indexOf("selected") != -1) {
			roomtableData[index][field] = '<div name="unselect" index="'
					+ index + '" field="' + field + '"></div>';
		}
		// 刷新房态样式，及数据
		refreshRoomStateTable();
		// 根据是否选中房态中的一格，展现或隐藏订单视图
		if ($("[name='selected']").length == 0) {
			closeOrderView();
			return;
		}
		$("#financeList").html("");
		addFinanceClick();
		state = 0;

	}
	// 刷新房态样式，及数据
	refreshRoomStateTable();
	// 根据选中的单元格，加载相关数据到订单视图
	loadOrderView(mainorderid);

	showOrderInfoDiv(state);
	// 判断已选择几间房
	$("#selectedCountTxt").html("(" + $("[name='selected']").length + "间)");
	// 打开订单视图
	showOrderView();

}
// 根据selectedCell中的数据，加载订单视图数据
function loadOrderView(mainorderid) {
	var html = "";
	// 修改时传入主订单id
	if (mainorderid != null) {
		// 加载第三方订单号
		$("[name='thirdorderid']").val(
				returnOrderList[mainorderid].orderMain['thirdorderid']);
		if (returnOrderList[mainorderid].orderMain['thirdorderid'] == "") {
			$("#thirdorderidDiv").hide();
		}
		$("#channel option").each(function() {
			var value = $(this).val();
			if (value == returnOrderList[mainorderid].orderMain['channelid']) {
				$(this).attr("selected", true);

			}
		});
		$("#channelspan").text(
				returnOrderList[mainorderid].orderMain['channelname']);
		// 加载提醒
		var orderRemind = returnOrderList[mainorderid].orderRemind;
		// $("#remindType").attr("value", orderRemind.type);
		if (orderRemind.datetime.length != 0) {
			$('#remindTime').datetimebox("setValue",
					orderRemind.datetime.substr(0, 19));
			$("#remarkDiv").show();
		} else if (orderRemind.content == "") {
			$("#remarkDiv").hide();
		} else {
			$("#remarkDiv").show();
		}
		$("#remarkId").val(orderRemind.id);
		$("#remarkTxt").val(orderRemind.content);
		// 加载入住人信息列表
		var guestList = returnOrderList[mainorderid].guestList;
		$("#customerList").html("");
		for ( var i in guestList) {
			if (guestList[i].state == "0") {
				continue;
			}
			var sendMessageHtml = "";
			if (i == 0 && guestList[i].phone != "") {
				sendMessageHtml = '<a	id="sendMessageA" class="btn btn-default btn-xs" style="margin-left:3px;"'
						+ '	href="javascript:void(0);" onclick="sendMessageWin('
						+ mainorderid + ');">发短信</a>'
			}

			var customerListhtml = '<div id="customerDiv'
					+ customeri
					+ '" class="form-group" style="margin-top:5px;">'
					+ '<div>'
					+ '<input name="id" type="text" value="'
					+ guestList[i].id
					+ '"  style="display:none;">'
					+ '<input name="name" type="text" maxlength="15" class="form-control"'
					+ 'value="'
					+ guestList[i].name
					+ '" required style="width: 100px; margin-left: 5px;">'
					+ '<input name="phone" type="text" maxlength="20" class="form-control"'
					+ '		value="'
					+ guestList[i].phone
					+ '" onkeyup="value=value.replace(/[^\\d]/g,\'\')"'
					+ '		style="width: 140px; margin-left: 5px;"> '
					+ sendMessageHtml
					+ '<a		href="javascript:void()" onclick="removeCustomerClick('
					+ i
					+ ');"	style="display: none;" name="clearCustomer"><img alt=""'
					+ '		src="/yuelijiang/icons/clear.png"></a>'
					+ '</div><div id="cardtandid'
					+ customeri
					+ '"  style="margin-top:5px;" name="cardtandid">'
					+ '<select name="cardtype" class="form-control"'
					+ '	style="width: 100px; margin-left: 5px;" value="'
					+ guestList[i].cardtype
					+ '" >'
					+ '	<option value=1>身份证</option>'
					+ '	<option value=2>军官证</option>'
					+ '	<option value=3>通行证</option>'
					+ '		<option value=4>护照</option>'
					+ '		<option value=5>其他</option></select><span name="cardtypespan" style="display:none;margin-left:15px;">'
					+ $.yuelj.constant.cardType[guestList[i].cardtype]
					+ '：</span>'
					+ '	<input name="cardid" type="text" maxlength="22"'
					+ '	class="form-control" value="' + guestList[i].cardid
					+ '"' + '	style="width: 170px; margin-left: 0px;">'
					+ '	</div></div>';
			$("#customerList").append(customerListhtml);
			if (guestList[i].cardid === "") {
				$("#cardtandid" + customeri).hide();
			}

			customeri++;
		}
		if (guestList.length <= 1) {
			$("[name=clearCustomer]").hide();
		}
		// 加载财务信息
		$("#financeList").html("");
		// 加载该订单对应入住人信息列表
		var financeList = returnOrderList[mainorderid].financeList;
		for ( var financei in financeList) {
			if (financeList[financei].state == "0") {
				continue;
			}
			$("#financeList")
					.append(
							'<div class="form-group" style="margin-left: 10px;margin-top:5px;" name="financeDivEdit" mainid="'
									+ mainorderid
									+ '">'
									+ '<input name="id" type="text" value="'
									+ financeList[financei].id
									+ '"  style="display:none;"> <input name="type" type="text" value="'
									+ financeList[financei].type
									+ '"  style="display:none;"><span name="type" '
									+ '	style="width: 120px; display: inline;margin-left:10px;" >'
									+ $.yuelj.constant.finance[financeList[financei].type]
									+ "："
									+ '</span> <input name="price" type="text" value="'
									+ financeList[financei].price
									+ '"  style="display:none;"><span  name="price" style="display:-moz-inline-box;display:inline-block;width:70px; " >'
									+ (financeList[financei].price + "")
									// .replace(".00", "")
									+ '元</span><span style="margin-left:10px;">支付方式：</span><span id="paymentConfigSpan'
									+ financei
									+ '"></span><select id="paymentConfig'
									+ financei
									+ '" name="paymentid" style="width: 80px; display: none;margin-left:5px;" value="'
									+ financeList[financei].paymentid
									+ '">'
									+ '</select> <a href="javascript:void(0)" onclick="removeFinanceClick(this);"'
									+ '	style="display: none;" name="clearFinance"><img alt=""'
									+ '	src="/yuelijiang/icons/clear.png"></a>'
									+ '</div>');
			for ( var i in paymentList) {
				if (financeList[financei].paymentid != paymentList[i].id) {
					$("#paymentConfig" + financei).append(
							'<option value="' + paymentList[i].id + '">'
									+ paymentList[i].name + '</option>');
				} else {
					$("#paymentConfig" + financei).append(
							'<option selected="selected" value="'
									+ paymentList[i].id + '">'
									+ paymentList[i].name + '</option>');
					$("#paymentConfigSpan" + financei)
							.text(paymentList[i].name);
				}
			}
		}

		$("[name=clearFinance]").show();
	}

	// 在订单视图中展现消费项目
	loadSelectedCells(mainorderid);
}
// 在订单视图中展现消费项目
function loadSelectedCells(mainorderid) {
	selectedCell = {};
	if (mainorderid != null) {
		// 将选中的单元格存入selectedCell
		$("[selected='selected']").each(function() {
			if ($(this).attr("name") != "ordered") {
				return;
			}
			var index = $(this).attr("index");
			var field = $(this).attr("field");
			var detailid = $(this).attr("detailid");
			var cellKey = index + field;
			selectedCell[cellKey] = {};
			selectedCell[cellKey].index = index;
			selectedCell[cellKey].field = field;
			// 订单详情id
			selectedCell[cellKey].detailid = detailid;
			// 加载价格，特殊价，周末价
			loadCellPrice(index, field, selectedCell);

		});
	}
	// 将选中的单元格存入selectedCell
	$("[name='selected']").each(function() {
		var index = $(this).attr("index");
		var field = $(this).attr("field");
		var cellKey = index + field;
		selectedCell[cellKey] = {};
		selectedCell[cellKey].index = index;
		selectedCell[cellKey].field = field;
		// 加载价格，特殊价，周末价
		loadCellPrice(index, field, selectedCell);
	});
	// 加载价格，特殊价，周末价
	function loadCellPrice(index, field, selectedCell) {
		var cellKey = index + field;
		// 房型id
		selectedCell[cellKey].roomType = roomtableData[index].typeid;
		// 普通价格
		selectedCell[cellKey].price = roomtableData[index].price;
		var specialPriceObj = specialPriceList[selectedCell[cellKey].roomType][field];
		if (specialPriceObj != null && specialPriceObj.price != 0) {
			selectedCell[cellKey].price = specialPriceObj.price;
		}
	}
	var times = 1;
	// 在订单视图中展现消费项目
	$("#consumeList").html("");
	var totalprice = 0;
	var checkIndate = null;
	for ( var i in selectedCell) {
		var index = selectedCell[i].index;
		var field = selectedCell[i].field;
		totalprice = totalprice + Number(selectedCell[i].price);
		// var checkIndateTime = $.yuelj.getDate(checkIndate).getTime();
		// var fieldTime = $.yuelj.getDate(field).getTime();
		// if (checkIndateTime > fieldTime) {
		// checkIndate = field;
		// }

		if (selectedCell[index + $.yuelj.addDayStr(field, 1)] != null) {
			if (times == 1) {
				checkIndate = field;
			}
			times++;
		} else {

			if (checkIndate == null) {
				checkIndate = field;
			}
			var price = selectedCell[i].price;
			html = '<div style="margin-left:15px;margin-bottom:5px;">'
					+ roomtableData[index].roomNum
					+ "("
					+ roomtableData[index].name
					+ ')'
					+ '	<span name="spanCheckIn" style="margin-left:10px;margin-right:15px;">'
					+ checkIndate.substr(5, 9)
					+ '入住</span>'
					+ times
					+ "晚 "
					+ "￥"
					+ '<span name="spanRoomPrice" style="margin-left:0px;margin-right:0px;">'
					+ totalprice
					+ '</span><input name="inputRoomPrice" indexfield=\"'
					+ index
					+ field
					+ '" type="text" value="'
					+ totalprice
					+ '"  style="width:50px;display:none;" onkeyup="editRoomDayPrice(\''
					+ index + '\',\'' + field + '\',\'' + times + '\')"/>'
					+ "</div>";
			$("#consumeList").append(html);
			checkIndate = null;
			times = 1;
			totalprice = 0;
		}
	}
	// 计算总金额
	calculateTotalPrice(mainorderid);
	$("#roomListDiv").html("");
	$("#roomListDiv").append($("#consumeList").html());
	$("#consumeList [name='inputRoomPrice']").show();
	$("#consumeList [name='spanRoomPrice']").hide();
}
var orderDivWidth = '340px';
function showOrderView() {
	if ($("#orderDiv").css("width") == "1px") {
		// 展现订单视图
		$("#orderDiv").animate({
			width : '+=' + orderDivWidth
		}, 300, function() {
		});
		$("#orderDiv").show();
		// 清空手动修改后的房间价格
		roomEditPrice = {};
	}

}
// 隐藏订单视图
function closeOrderView() {
	$("#orderSelectDiv").hide();
	$("#orderDiv").animate({
		width : '-=' + orderDivWidth
	}, 300, function() {
		$("#orderDiv").hide();
	});
	// 清空手动修改后的房间价格
	roomEditPrice = {};
	// 清空要删除的入住人列表
	deleteCustomerList = [];
	// 取消编辑订单状态
	editingOrder = false;
	mainorderid = null;
}
// 手动修改后的房间价格
var roomEditPrice = {};
// 修改价格时传入
function editRoomDayPrice(index, field, times) {
	var indexfield = index + field;
	roomEditPrice[indexfield] = {};
	var price = $("#consumeList [indexfield='" + indexfield + "']").val();

	roomEditPrice[indexfield].price = price;
	for (var i = 1 - times; i < 0; i++) {
		var preday = $.yuelj.addDayStr(field, i);
		roomEditPrice[index + preday].price = price;
	}
}
// 计算总金额
function calculateTotalPrice(mainorderid) {
	$("#totalPrice").html("￥0");
	$("#payedMoney").html("￥0");
	$("#needPay").html("￥0");
	var totalPrice = 0;
	for ( var i in selectedCell) {
		totalPrice = selectedCell[i].price + totalPrice;
	}
	postData.orderMainObj.totalprice = totalPrice;
	editData.orderMainObj.totalprice = totalPrice;
	$("#totalPrice").html("￥" + totalPrice);
	if (mainorderid != null) {
		var orderMain = returnOrderList[mainorderid].orderMain
		var payedMoney = parseFloat(orderMain.payedprice);
		if (payedMoney != null) {
			$("#payedMoney").html("￥" + payedMoney);
		}
		if (payedMoney != null) {
			returnOrderList[mainorderid].orderMain.needPay = totalPrice
					- payedMoney;
			if (totalPrice - payedMoney > 0) {
				$("#needPayLabel").text("需补房费：");
				$("#needPay").text("￥" + (totalPrice - payedMoney));
			} else {
				$("#needPayLabel").text("需退房费：");
				$("#needPay").text("￥" + (payedMoney - totalPrice));
			}
		} else {
			$("#needPay").text("￥" + totalPrice);
		}
	}
}
// 加载房态列表
function loadRoomState() {
	// 获取房型列表
	$
			.ajax({
				url : "/yuelijiang/seller/queryRoomTypes.action",
				data : {
					innId : innidNow,
					state : 1
				},
				success : function(returnData) {
					roomtableData = [];
					roomList = [];
					if (returnData == null || returnData.types == null) {
						$.yuelj.alertMessage('提示', '房型获取失败!');
					} else {
						roomTypeList = returnData.types;
						for ( var i in returnData.rooms) {
							if (returnData.rooms[i].state != 0) {
								roomList.push(returnData.rooms[i]);
							}
						}
						for ( var i in roomTypeList) {
							if (roomTypeList[i].roomList.length != 0) {
								specialPriceList[roomTypeList[i].id] = roomTypeList[i];
								specialPriceList[roomTypeList[i].id].price = roomTypeList[i].price;
							}
						}
						for ( var i in specialPriceList) {
							for (var j = beginDateFrom; j <= endDateTo; j++) {
								var field = $.yuelj.getDateStr(addDay(j));
								// 获取特殊价格
								// initSpecialPriceList(i, field);
							}
							// 获取特殊价格
							initSpecialPriceListPeriod(i,
									specialPriceList[i].price);
						}

						// 将房型房间信息放入左侧房间列
						for ( var i in roomList) {
							// 获取锁房
							initLockRoomList(roomList[i].id);
							roomtableData[i] = {};
							var roomType;
							for ( var j in roomTypeList) {
								if (roomTypeList[j].id == roomList[i].roomType) {
									roomType = roomTypeList[j];
								}
							}
							roomtableData[i].roomsColumn = "<div>"
									+ roomType.name
									+ ' <span style="color: #999;margin-left:5px;">￥'
									+ roomType.price + "</span></div><div>"
									+ roomList[i].roomNum + "</div>";
							// 价格
							roomtableData[i].price = roomType.price;
							// 房型id
							roomtableData[i].typeid = roomType.id;
							// 房型名称
							roomtableData[i].name = roomType.name;
							// 房间名称（房间号）
							roomtableData[i].roomNum = roomList[i].roomNum;
							// 房间主键
							roomtableData[i].id = roomList[i].id;
							// 房型简称
							roomtableData[i].shortName = roomType.shortName;
						}
						loadRoomDetailPost();
					}
				}
			});
}
// 获取锁房
function initLockRoomList(roomid) {
	$
			.ajax({
				url : "/yuelijiang/seller/queryInnRoomLock.action",
				data : {
					innId : innidNow,
					roomid : roomid,
					startday : $.yuelj.getDateStr(addDay(beginDateFrom)),
					endday : $.yuelj.getDateStr(addDay(endDateTo))
				},
				success : function(returnData) {
					if (returnData != null && returnData.list != null) {
						var lockList = returnData.list;
						for ( var i in lockList) {
							var startday = $.yuelj
									.getDate(lockList[i].startday).getTime();
							var endday = $.yuelj.getDate(lockList[i].endday)
									.getTime();
							var roomid = lockList[i].roomid;
							for ( var j in roomtableData) {
								if (roomtableData[j].id == roomid) {
									for (var date = startday; date <= endday; date = date + 1000 * 3600 * 24) {
										var field = $.yuelj
												.getDateStrFromTime(date);
										roomtableData[j][field] = '<div name="locked" ></div>';
										refreshRoomStateTable();
									}
									break;
								}
							}
						}
					}
				}
			});
}
// 批量获取特殊价格
function initSpecialPriceListPeriod(i, price) {
	var startdate = $.yuelj.getDateStr(addDay(beginDateFrom));
	var enddate = $.yuelj.getDateStr(addDay(endDateTo));
	$.ajax({
		url : "/yuelijiang/seller/queryRoomTypePriceByPeriod.action",
		data : {
			tid : i,
			state : 1,
			startdate : startdate,
			enddate : enddate,
			price : price
		},
		success : function(returnData) {
			if (returnData != null && returnData.list != null) {
				for ( var j in returnData.list) {
					var price = returnData.list[j].price;
					var roomtype = returnData.list[j].roomTypeId;
					var startday = returnData.list[j].startDay;
					specialPriceList[roomtype][startday] = {};
					specialPriceList[roomtype][startday].price = price;

				}
				if (returnData.list.length != 0) {
					refreshRoomStateTable();
				}

			}
		}
	});
}
function loadRoomDetailPost() {
	// 根据订单信息加载每个日期房态信息列
	$.ajax({
		url : "/yuelijiang/seller/showRoomDetail.action",
		data : {
			innId : innidNow,
			begindate : getBeginDateFrom(),
			enddate : getEndDateTo()
		},
		success : function(returnData) {
			if (returnData == null) {
				$.yuelj.alertMessage('提示', '房态明细获取失败!');
			} else {
				loadRoomDetailData(returnData);
			}
		}
	});
}
function getBeginDateFrom() {
	return $.yuelj.getDateStr($.yuelj.addDay(new Date(), beginDateFrom));
}
function getEndDateTo() {
	return $.yuelj.getDateStr($.yuelj.addDay(new Date(), endDateTo));
}
function loadRoomDetailData(returnData) {
	returnOrderList = returnData;
	for ( var mainid in returnData) {
		// 主订单信息
		var mainOrder = returnData[mainid].orderMain;
		// 详细订单列表
		var detailList = returnData[mainid].detailList;
		// 主订单人
		var mainGuset = returnData[mainid].orderMainGuest;
		for ( var i in detailList) {
			// 日期格式2015-07-17
			var field = detailList[i].begindate;
			var roomid = detailList[i].productid;
			// 将详细订单显示到房态表中
			for ( var index in roomtableData) {
				// 房间主键id相等
				if (roomtableData[index].id == roomid) {
					roomtableData[index][field] = '<div name="ordered" detailid="'
							+ detailList[i].id
							+ '"mainorderid="'
							+ mainOrder.id
							+ '" index="'
							+ index
							+ '" field="'
							+ field
							+ '" state="'
							+ mainOrder.state
							+ '">'
							+ mainOrder.channelname
							+ '</div><div >'
							+ mainGuset.name.substr(0, 8) + '</div>';
				}
			}
		}
	}
	/**
	 * 将为空的默认为未选中样式，用于tooltip
	 */
	for ( var index in roomtableData) {
		for (var i = beginDateFrom; i <= endDateTo; i++) {
			var field = $.yuelj.getDateStr(addDay(i));
			if (roomtableData[index][field] == null
					|| roomtableData[index][field].length == 0) {
				roomtableData[index][field] = '<span name="unselect" index="'
						+ index + '" field="' + field + '"></span>';
			}
		}
	}
	// table数据载入
	refreshRoomStateTable();
}
function loadSpecialPriceToTable() {
	// 将特殊价格加载到单元格中
	for ( var i in roomtableData) {
		var typeid = roomtableData[i].typeid;
		for ( var j in specialPriceList) {
			if (j == typeid) {
				for ( var day in specialPriceList[j]) {
					if (day.length != 10) {
						continue;
					}
					// 该房型该天存在特殊价
					if (specialPriceList[j][day] != null
							&& specialPriceList[j][day].price != 0) {
						// 该单元格不存订单
						if (roomtableData[i][day] == null
								|| (roomtableData[i][day].indexOf("ordered") == -1 && roomtableData[i][day]
										.indexOf("selected") == -1)) {
							// 特殊价和正常相等不显示
							if (specialPriceList[j][day].price == roomtableData[i].price) {
								continue;
							}
							roomtableData[i][day] = "<span index='"
									+ i
									+ "' field='"
									+ day
									+ "' name='unselect' style='color: #999;'>￥"
									+ specialPriceList[j][day].price
									+ "</span>";
						}
					}
				}
			}
		}
	}
}
/**
 * 根据订单状态不同，显示或隐藏不同的按钮或视图 state的值对应 1办理预定，2办理入住，3办理退房，4撤销退房
 * 
 * @param state
 */
function showOrderInfoDiv(state, type) {
	if (type == "back") {
		// $("[name='customerDiv']").each(function() {
		// $(this).remove();
		// });
		// $("[name='financeDiv']").each(function() {
		// $(this).remove();
		// });
	}
	// 开始办理预定
	$("#orderSelectDiv").hide();
	$("#orderInfoDiv").hide();
	$(".orderBottomButtons div").hide();
	if (state == 0) {
		$("#orderSelectDiv").show();
	} else if (state == 1) {
		// 预定
		$("#orderInfoDiv").show();
		$("#preOrderButtons").show();
	} else if (state == 2) {
		// 未预定，开始办理入住
		$("#orderInfoDiv").show();
		$("#checkInButtons").show();
	} else if (state == 3) {
		// 已预订，开始办理入住
		$("#orderInfoDiv").show();
		$("#orderedButtons").show();
		orderInfoDivReadonly();
	} else if (state == 4) {
		// 已入住，开始办理退房
		$("#orderInfoDiv").show();
		$("#checkedButtons").show();
		orderInfoDivReadonly();
	} else if (state == 5) {
		// 确认退房
		$("#orderInfoDiv").show();
		$("#confirmOutButtons").show();
	} else if (state == 6) {
		orderInfoDivReadonly();
		// 已退房， 查看信息
		$("#orderInfoDiv").show();
		$("#cancelOutButtons").show();
	}
}
// 订单视图只读状态
function orderInfoDivReadonly() {
	$("#orderInfoDiv input,#orderInfoDiv textarea")
			.attr("readonly", "readonly");
	$("#orderInfoDiv input,#orderInfoDiv textarea,#orderInfoDiv select").css(
			"border", "1px solid #fff");
	$("#orderInfoDiv input,#orderInfoDiv textarea,#orderInfoDiv select").css(
			"background-color", "#fff");
	$("#basicInfoDiv input,#basicInfoDiv select,#basicInfoDiv textarea").css(
			"background-color", "#eeeeee");
	$("#orderInfoDiv select").attr("disabled", "disabled");
	$('#remindTime').datetimebox("readonly", true);
	$("#addFinanceBtn").hide();
	$("#addCustomerBtn").hide();
	$("[name='clearFinance']").hide();
	editingOrder = false;
	$("#sendMessageA").show();
	if ($("#remarkTxt").val() == "") {
		$("#remarkDiv").hide();
	}
	// 显示span，隐藏select
	$("#channelspan").show();
	$("#channel").hide();
	$("[name='cardtype']").hide();
	$("[name='cardtypespan']").show();
	$("[name='cardtandid']").each(function() {
		if ($(this).children()[2].value === "") {
			$(this).hide();
		}
	});
	if ($("[name='thirdorderid']").val() == "") {
		$("#thirdorderidDiv").hide();
	}
	$("[name='clearCustomer']").hide();
	loadRoomDetailData(returnOrderList);
	deleteFinanceiList = [];
	deleteCustomerList = [];
	deleteDetailList = [];
}
// 订单视图可编辑状态
var editingOrder = false;
function editOrderInfoDiv(state) {
	if (!$.yuelj.checkModulePermission(6)) {
		orderInfoDivReadonly();
		return;
	}
	$("#orderInfoDiv input,#orderInfoDiv textarea,#orderInfoDiv select").css(
			"border", "");
	$("#orderInfoDiv input,#orderInfoDiv textarea,#orderInfoDiv select").css(
			"background-color", "");
	$("#remarkDiv").show();
	$("#sendMessageA").hide();
	editingOrder = true;
	preState = state;
	$("#orderInfoDiv input,#orderInfoDiv textarea").removeAttr("readonly");
	$('#remindTime').datetimebox("readonly", false);
	$("#orderInfoDiv select").removeAttr("disabled");
	$("#addFinanceBtn").show();
	$("#addCustomerBtn").show();
	$("[name='clearFinance']").show();
	$("[name='clearCustomer']").show();
	// 显示select，隐藏span
	$("#channelspan").hide();
	$("#channel").show();
	$("[name='cardtype']").show();
	$("[name='cardtypespan']").hide();
	$("[name='cardtandid']").show();
	$("#thirdorderidDiv").show();
}

window.onresize = function() {
	resizeTable();
}
// 屏幕大小变化自适应
function resizeTable() {
	$('#roomStateTable').datagrid({
		height : $("#totalHeight").height()
	});
	initQueryDate();
	// 房态table数据载入
	refreshRoomStateTable();
}
// 房态查询时间
var queryDate = new Date();
function initQueryDate() {
	$('#queryDate').datebox({
		width : 80,
		value : $.yuelj.getDateStr(queryDate),
		hasDownArrow : false,
		onSelect : function(date) {
			queryDate = date;
			var dayMin = $.yuelj.getDayMinus(new Date(), date);
			beginDateFrom = -dayMin;
			endDateTo = 30 - dayMin;
			initColumns();
			initTable();
			loadRoomState();
		},
		editable : false
	});
}
function addCustomerClick() {
	$("#customerList")
			.append(
					'<div id="customerDiv'
							+ customeri
							+ '" class="form-group" style="margin-top:10px;" name="customerDiv">'
							+ '<div><input name="name" type="text" maxlength="15" class="form-control"'
							+ 'placeholder="姓名" required style="width: 100px; margin-left: 5px;">'
							+ '<input name="phone" type="text" maxlength="20" class="form-control"'
							+ '		placeholder="手机号" onkeyup="value=value.replace(/[^\\d]/g,\'\')"'
							+ '		style="width: 140px; margin-left: 5px;" onblur=checkCustomerBlack('
							+ customeri
							+ ')> <span id="isblack'
							+ customeri
							+ '" style="color:red;"></span><a'
							+ '		href="javascript:void('
							+ customeri
							+ ')" onclick="removeCustomerClick('
							+ customeri
							+ ');"'
							+ '		style="display: none;" name="clearCustomer"><img alt=""'
							+ '		src="/yuelijiang/icons/clear.png"></a>'
							+ '</div><div style="margin-top:5px;">'
							+ '<select name="cardtype" class="form-control"'
							+ '	style="width: 100px; margin-left: 5px;" placeholder="证件类型">'
							+ '	<option value=1>身份证</option>'
							+ '	<option value=2>军官证</option>'
							+ '	<option value=3>通行证</option>'
							+ '		<option value=4>护照</option>'
							+ '		<option value=5>其他</option></select>'
							+ '	<input name="cardid" type="text" maxlength="22"'
							+ '	class="form-control" placeholder="证件号"'
							+ '	style="width: 170px; margin-left: 0px;">'
							+ '	</div></div>');
	customeri++;
	$("[name=clearCustomer]").show();
}
/**
 * 检查用户是否在黑名单内
 * 
 * @param i
 */
function checkCustomerBlack(i) {
	var phone = $("#customerDiv" + i + " [name=phone]").val();
	$.ajax({
		url : "/yuelijiang/seller/isBlackCustomer.action",
		data : {
			phone : phone
		},
		success : function(returnData) {
			if ($.yuelj.parseReturn(returnData)) {
				if (returnData.data == "true") {
					$("#isblack" + i).text("(黑名单)");
				}
			}
		}
	});
}
// 将要删除的入住人列表
var deleteCustomerList = [];
function removeCustomerClick(i) {
	var row = {};
	$("#customerDiv" + i + " input").each(function() {
		var name = $(this).attr("name");
		var value = $(this).val();
		if (name == null || name.length == 0) {
			return;
		}
		row[name] = value;
	});
	if (row.id != null) {
		deleteCustomerList.push(row.id);
	}
	$("#customerDiv" + i).remove();
	if ($("[name=clearCustomer]").length == 1) {
		$("[name=clearCustomer]").hide();
	}
}
var financei = 0;
function addFinanceClick() {
	$("#financeList")
			.append(
					'<div class="form-group" style="margin-left: 10px;margin-top:10px;" id="financeDiv'
							+ financei
							+ '" name="financeDiv">'
							+ '<select name="type" class="form-control"'
							+ '	style="width: 105px; display: inline;" placeholder="财务记录">'
							+ '	<option value=1>支付房费</option>'
							+ '	<option value=2>支付订金</option>'
							+ '	<option value=3>支付押金</option>'
							+ '	<option value=4>退还房费</option>'
							+ '	<option value=5>退还订金</option>'
							+ '	<option value=6>退还押金</option>'
							+ '	<option value=7>退房补费</option>'
							+ '	<option value=8>退房退费</option>'
							+ '	<option value=9>其他收入</option>'
							+ '	<option value=10>其他支出</option>'
							+ '</select> <input  name="price" type="text" maxlength="15"'
							+ '	class="form-control" placeholder="金额"'
							+ '	onkeyup="value=value.replace(/[^\\d]/g,\'\')" style="width: 55px;">'
							+ '<select id="paymentConfigNew'
							+ financei
							+ '" name="paymentid" class="form-control"'
							+ '	style="width: 105px; display: inline;margin-left:5px;" placeholder="付费方式">'
							+ '</select> <a href="javascript:void(0)" onclick="removeFinanceClick(this);"'
							+ '	style="display: none;" name="clearFinance"><img alt=""'
							+ '	src="/yuelijiang/icons/clear.png"></a>'
							+ '</div>');
	for ( var i in paymentList) {
		$("#paymentConfigNew" + financei).append(
				'<option value="' + paymentList[i].id + '">'
						+ paymentList[i].name + '</option>');
	}
	financei++;
	$("[name=clearFinance]").show();
}
var deleteFinanceiList = [];
function removeFinanceClick(obj) {
	var row = {};
	$(obj).parent().children().each(function() {
		var name = $(this).attr("name");
		var value = $(this).val();
		if (name == null || name.length == 0) {
			return;
		}
		row[name] = value;
	});
	if (row.id != null) {
		deleteFinanceiList.push(row.id);
		$(obj).parent().remove();
	} else {
		$("#financeDiv" + i).remove();
	}
	if ($("[name=clearFinance]").length == 1) {
		$("[name=clearFinance]").hide();
	}

}
var postData = {};
postData.orderMainObj = {};
postData.orderMainObj.totalprice = 0;
function newOrder(state) {
	postData.orderMainObj.state = state;
	// 优惠码
	postData.orderMainObj.discountid = 0;
	// 渠道
	postData.orderMainObj.channelid = $("#channel").val();
	postData.orderMainObj.channelname = $("#channel option:selected").text();
	// thirdorderid第三方订单号
	postData.orderMainObj.thirdorderid = $("[name='thirdorderid']").val();
	postData.innId = innidNow;
	// 入住客人列表
	postData.customerList = [];
	for (var i = 0; i < customeri; i++) {
		var row = {};
		$("#customerDiv" + i + " input,#customerDiv" + i + " select").each(
				function() {
					var name = $(this).attr("name");
					var value = $(this).val();
					if (name == null || name.length == 0) {
						return;
					}
					row[name] = value;
				});
		// 客人名不能为空
		if (row["name"] == null || row["name"].length == 0) {
			continue;
		}
		row.innid = innidNow;
		postData.customerList.push(row);
	}
	if (postData.customerList.length == 0) {
		$.yuelj.alertMessage("提示", "入住人不可为空!");
		// 回到预定状态
		showOrderInfoDiv(1);
		editOrderInfoDiv(1);
		return;
	}
	// 1主订单人，2其他
	for ( var i in postData.customerList) {
		postData.customerList[i].type = 2;
	}
	if (postData.customerList[0] != null) {
		postData.customerList[0].type = 1;
	}
	postData.orderGuestList = JSON.stringify(postData.customerList);
	// 已付金额
	var payedprice = 0;
	// 财务信息列表
	postData.financeiList = [];
	for (var i = 0; i < financei; i++) {
		var row = {};
		$("#financeDiv" + i + " input,#financeDiv" + i + " select").each(
				function() {
					var name = $(this).attr("name");
					var value = $(this).val();
					row[name] = value;
				});
		var hasNull = false;
		// 价格不能为空
		if (row["price"] == null || row["price"].length == 0) {
			continue;
		}
		// 计算已付金额
		var type = Number(row.type);
		if (type == 1 || type == 2 || type == 3 || type == 7 || type == 9) {
			payedprice = payedprice + Number(row.price);
		}
		postData.financeiList.push(row);
	}

	postData.orderMainObj.payedprice = payedprice;
	postData.orderFinanceList = JSON.stringify(postData.financeiList);
	var orderDetailList = [];
	for ( var i in selectedCell) {
		if (roomEditPrice[i] != null) {
			var price = roomEditPrice[i].price;
		} else {
			for ( var j in roomTypeList) {
				if (roomList[selectedCell[i].index].roomType == roomTypeList[j].id) {
					price = roomTypeList[j].price;
				}
			}
		}
		orderDetailList.push({
			type : 2,// 1产品，2房间
			productid : roomList[selectedCell[i].index].id,
			begindate : selectedCell[i].field,
			enddate : selectedCell[i].field,
			price : price
		});

	}
	// 已选房间列表
	postData.orderDetailList = JSON.stringify(orderDetailList);
	// 备注和提醒
	var remark = {};
	$("#remark input,#remark select,#remark textarea").each(function() {
		var name = $(this).attr("name");
		var value = $(this).val();
		remark[name] = value;
	});
	postData.orderRemind = JSON.stringify(remark);

	for ( var i in orderDetailList) {
		orderDetailList[i].datetime = $.yuelj.getDate(
				orderDetailList[i].begindate).getTime();
	}
	var array = $.yuelj.bubbleSort(orderDetailList, "datetime");
	postData.orderMainObj.firstcheckin = array[0].begindate;
	postData.orderMainObj.lastcheckout = array[array.length - 1].enddate;
	postData.orderMain = JSON.stringify(postData.orderMainObj);
	$.ajax({
		url : "/yuelijiang/seller/booking.action",
		data : postData,
		success : function(returnData) {
			if ($.yuelj.parseReturn(returnData)) {
				$.yuelj.alertMessage('提示', "预定成功!");
				// 重新加载房态表
				loadRoomState();
			}
			// 关闭订单视图
			orderInfoDivReadonly();
			closeOrderView();
		}
	});
}
// 修改传入后台的数据
var editData = {};
editData.orderMainObj = {};
editData.orderMainObj.totalprice = 0;
// 房间订购明细删除
var deleteDetailList = [];
/**
 * 修改订单状态，修改订单
 */
function updateOrder(state) {
	editData.orderMainObj.id = mainorderid;
	// 1预定，2入住，3已退房
	editData.orderMainObj.state = state;
	// 优惠码
	editData.orderMainObj.discountid = 0;
	// 渠道
	editData.orderMainObj.channelid = $("#channel").val();
	editData.orderMainObj.channelname = $("#channel option:selected").text();
	// thirdorderid第三方订单号
	editData.orderMainObj.thirdorderid = $("[name='thirdorderid']").val();
	editData.innId = innidNow;
	// 入住客人列表
	editData.customerList = {
		add : [],
		update : [],
		del : deleteCustomerList
	};
	var customerListAll = [];
	for (var i = 0; i < customeri; i++) {
		var row = {};
		$("#customerDiv" + i + " input,#customerDiv" + i + " select").each(
				function() {
					var name = $(this).attr("name");
					var value = $(this).val();
					if (name == null || name.length == 0) {
						return;
					}
					row[name] = value;
				});
		// 客人名不能为空
		if (row["name"] == null || row["name"].length == 0) {
			continue;
		}
		row.innid = innidNow;
		if (row["id"] == null || row["id"].length == 0) {
			editData.customerList.add.push(row);
		} else {
			editData.customerList.update.push(row);
		}
		customerListAll.push(row);
	}
	if (customerListAll.length == 0) {
		$.yuelj.alertMessage("提示", "入住人不可为空!");
		return;
	}
	// 1主订单人，2其他
	for ( var i in customerListAll) {
		customerListAll[i].type = 2;
	}
	if (customerListAll[0] != null) {
		customerListAll[0].type = 1;
	}
	editData.guest = JSON.stringify(editData.customerList);
	// 财务信息列表
	editData.financeiList = {
		add : [],
		update : [],
		del : deleteFinanceiList
	};
	var payedprice = 0;
	for (var i = 0; i < financei; i++) {
		var row = {};
		$("#financeDiv" + i + " input,#financeDiv" + i + " select").each(
				function() {
					var name = $(this).attr("name");
					var value = $(this).val();
					row[name] = value;
				});
		var hasNull = false;
		// 价格不能为空
		if (row["price"] == null || row["price"].length == 0) {
			continue;
		}
		if (row["id"] == null) {
			editData.financeiList.add.push(row);
		} else {
			editData.financeiList.update.push(row);
		}
		// 计算已付金额
		var type = Number(row.type);
		if (type == 1 || type == 2 || type == 3 || type == 7 || type == 9) {
			payedprice = payedprice + Number(row.price);
		}
	}
	var rows = $("[name='financeDivEdit']");
	for (var i = 0; i < rows.length; i++) {
		var financeRow = {};
		$(rows[i]).children().each(function() {
			var name = $(this).attr("name");
			var value = $(this).val();
			if (value != "") {
				financeRow[name] = value;
			}
		});
		var type = financeRow.type;
		if (type == 1 || type == 2 || type == 3 || type == 7 || type == 9) {
			payedprice = payedprice + Number(financeRow.price);
		}
	}

	editData.orderMainObj.payedprice = payedprice;
	editData.finance = JSON.stringify(editData.financeiList);
	var orderDetailList = {
		add : [],
		update : [],
		del : deleteDetailList
	};
	// 根据selectedCell计算对客栈房间的修改和新增
	var orderDetailListAll = [];
	for ( var i in selectedCell) {
		if (roomEditPrice[i] != null) {
			var price = roomEditPrice[i].price;
		} else {
			for ( var j in roomTypeList) {
				if (roomList[selectedCell[i].index].roomType == roomTypeList[j].id) {
					price = roomTypeList[j].price;
				}
			}
		}
		var obj = {
			type : 2,// 1产品，2房间
			productid : roomList[selectedCell[i].index].id,
			begindate : selectedCell[i].field,
			enddate : selectedCell[i].field,
			price : price
		};
		if (selectedCell[i].detailid != null) {
			obj.id = selectedCell[i].detailid;
			orderDetailList.update.push(obj);
		} else {
			orderDetailList.add.push(obj);
		}
		orderDetailListAll.push(obj);
	}
	// 已选房间列表
	editData.detail = JSON.stringify(orderDetailList);
	// 备注和提醒
	var remark = {};
	$("#remark input,#remark select,#remark textarea").each(function() {
		var name = $(this).attr("name");
		var value = $(this).val();
		remark[name] = value;
	});
	editData.remind = JSON.stringify(remark);
	// 计算出订单明细中最早入住和最晚离开的时间
	for ( var i in orderDetailListAll) {
		orderDetailListAll[i].datetime = $.yuelj.getDate(
				orderDetailListAll[i].begindate).getTime();
	}
	var array = $.yuelj.bubbleSort(orderDetailListAll, "datetime");
	editData.orderMainObj.firstcheckin = array[0].begindate;
	editData.orderMainObj.lastcheckout = array[array.length - 1].enddate;
	editData.main = JSON.stringify(editData.orderMainObj);
	// 清空删除列表
	deleteDetailList = [];
	$.ajax({
		url : "/yuelijiang/seller/editOrder.action",
		data : editData,
		success : function(returnData) {
			if ($.yuelj.parseReturn(returnData)) {
				$.yuelj.alertMessage('提示', "修改成功!");
				// 重新加载房态表
				loadRoomState();
				// 关闭订单视图
				orderInfoDivReadonly();
				closeOrderView();
			}
		}
	});
}

/**
 * 确认预定按钮
 */
function confirmPreOrderClick() {
	if (!$.yuelj.checkModulePermission(6)) {
		return;
	}
	// 1预定，2入住，3已退房
	var state = 1;
	if (editing) {
		updateOrder(state);
		return;
	}
	showOrderInfoDiv(3);
	newOrder(state);
}
/**
 * 取消预订
 */
function cancleOrder() {
	if (!$.yuelj.checkModulePermission(6)) {
		return;
	}
	var d = dialog({
		title : '取消预定',
		width : 300,
		content : $("#cancleOrderDiv"),
		okValue : '确定',
		ok : function() {
			var cancleData = {};
			cancleData.mId = mainorderid;
			var finance = {
				price : $("#cancleOrderDiv [name='price']").val(),
				type : $("#cancleOrderDiv [name='type']").val(),
				paymentid : $("#cancleOrderDiv [name='paymentid']").val()
			};
			if (finance.price == null || finance.price.length == 0) {
				finance.price = 0;
			}
			cancleData.finance = JSON.stringify(finance);
			cancleData.mark = $("#cancleOrderDiv [name='content']").val();
			$.ajax({
				url : "/yuelijiang/seller/cancelBooking.action",
				data : cancleData,
				success : function(returnData) {
					if ($.yuelj.parseReturn(returnData)) {
						$.yuelj.alertMessage('提示', "修改成功!");
						// 重新加载房态表
						loadRoomState();
						// 关闭订单视图
						closeOrderView();
					}
				}
			});
		},
		cancelValue : '取消',
		cancel : function() {
		}
	});
	d.show();
}

/**
 * 确认入住按钮
 */
function confirmCheckInOrderClick() {
	if (!$.yuelj.checkModulePermission(6)) {
		return;
	}
	// 修改订单信息及订单状态
	// 1预定，2预定转入住，3直接入住，4退房
	var state = 2;
	if (editing) {
		updateOrder(state);
		return;
	}
	state = 3;
	newOrder(state);
	showOrderInfoDiv(4);
	// 订单时间在当前日期之前，可以退房,否则隐藏退房按钮

}
/**
 * 确认退房
 */
function confirmCheckoutClick() {
	if (!$.yuelj.checkModulePermission(6)) {
		return;
	}
	// 修改订单信息及订单状态
	// 1预定，2预定转入住，3直接入住，4退房
	updateOrder(4);
	showOrderInfoDiv(6);
	orderInfoDivReadonly();
}
/**
 * 发送短信窗体
 */
var messageList = [];
var messageOrderid;
function sendMessageWin(orderid) {
	messageOrderid = orderid;
	var guest = returnOrderList[orderid].guestList[0];
	$("#nameAndPhone").text(guest.name + "(" + guest.phone + ")");
	$("#messagePhone").val(guest.phone);
	var row = {};
	row.innid = innidNow;
	$.ajax({
		url : "/yuelijiang/seller/messageTemplateList.action",
		data : {
			entityJson : JSON.stringify(row)
		},
		success : function(returnData) {
			messageList = returnData.list;
			$("[name='messageTemplate']").html("");
			for ( var i in returnData.list) {
				// if (returnData.list[i].type == "1") {
				$("[name='messageTemplate']").append(
						'<option value=' + returnData.list[i].id + '>'
								+ returnData.list[i].name + '</option>');
				// }
				var countentHtml = "";
				// 预定
				var type = returnData.list[i].type;
				var orderstate = returnOrderList[orderid].orderMain.state;
				if (type == "1" && orderstate == "1") {
					// 预定
					countentHtml = $.yuelj.getPreOrderContent(
							returnData.list[i].content,
							returnOrderList[orderid]);
					$("#messageContent").val(countentHtml);
					$("#messageArr").val(returnData.list[i].content);
					templateid = returnData.list[i].id;
				} else if (type == "2"
						&& (orderstate == "2" || orderstate == "3")) {
					// 入住
					templateid = returnData.list[i].id;
					countentHtml = $.yuelj
							.getCheckInContent(returnData.list[i].content);
					$("#messageContent").val(countentHtml);
					$("#messageArr").val(returnData.list[i].content);
				} else if (type = "3" && orderstate == "4") {
					// 离店
					templateid = returnData.list[i].id;
					countentHtml = $.yuelj
							.getCheckOutContent(returnData.list[i].content);
					$("#messageContent").val(countentHtml);
					$("#messageArr").val(returnData.list[i].content);
				}
			}
			row.orderid = orderid;
			initMessageWin(guest.phone, row);
		}
	});
	function initMessageWin(phone, row) {
		var entityJson = {};
		entityJson.message = $("#messageArr").val();
		entityJson.phone = $("#messagePhone").val();
		var d = dialog({
			title : '发送短信',
			width : 300,
			content : $("#sendMessageDiv"),
			okValue : '确定',
			ok : function() {
				$.ajax({
					url : "/yuelijiang/seller/sendMessageToCustomer.action",
					data : {
						entityJson : JSON.stringify(row),
						templateid : templateid,
						phone : phone
					},
					success : function(returnData) {
						if ($.yuelj.parseReturn(returnData)) {
							$.yuelj.alertMessage('提示', "发送成功!");
						}
					}
				});
			},
			cancelValue : '取消',
			cancel : function() {
			}
		});
		d.show();
	}
}
var templateid = "";
function selectMessage() {
	var selectid = $("[name='messageTemplate'] option:selected").val();
	for ( var i in messageList) {
		if (selectid == messageList[i].id) {

			var countentHtml = "";
			if (messageList[i].type == "1") {
				countentHtml = $.yuelj
						.getPreOrderContent(messageList[i].content,
								returnOrderList[messageOrderid]);
			} else if (messageList[i].type == "2") {
				countentHtml = $.yuelj
						.getCheckInContent(messageList[i].content);
			} else if (messageList[i].type == "3") {
				countentHtml = $.yuelj
						.getCheckOutContent(messageList[i].content);
			}
			$("#messageContent").val(countentHtml);
		}
	}
}
