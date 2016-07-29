/**
 * 短信模板
 */
function initMessageTemplate() {
	var row = {};
	row.innid = innidNow;
	$.ajax({
		url : "/yuelijiang/seller/messageTemplateList.action",
		data : {
			entityJson : JSON.stringify(row)
		},
		success : function(returnData) {
			for ( var i in returnData.list) {
				// 类型：1订单提醒，2入住通知，3离店问候，4自定义
				if (returnData.list[i].type == "1") {
					$("[tplcode='order']").attr("messageid",
							returnData.list[i].id);
					var orderhtml = $.yuelj
							.getPreOrderContent(returnData.list[i].content);
					$("[tplcode='order'] [tag='content']").html(orderhtml);
				}
				if (returnData.list[i].type == "2") {
					$("[tplcode='checkin']").attr("messageid",
							returnData.list[i].id);
					var orderhtml = $.yuelj
							.getCheckInContent(returnData.list[i].content);
					$("[tplcode='checkin'] [tag='content']").html(orderhtml);
				}
				if (returnData.list[i].type == "3") {
					$("[tplcode='checkout']").attr("messageid",
							returnData.list[i].id);
					var orderhtml = $.yuelj
							.getCheckOutContent(returnData.list[i].content);
					$("[tplcode='checkout'] [tag='content']").html(orderhtml);
				}
			}
		}
	});
}
function setPreOrder() {
	var d = dialog({
		title : '预定提醒',
		width : 410,
		content : $("#preOrderWin"),
		okValue : '确定',
		ok : function() {
			var row = {};
			row.innid = innidNow;
			row.name = '预定提醒';
			// 系统类型：0管理系统，1app
			row.system = 0;
			// 状态：0无效，1启用，2待审核，3审核不通过，4审核通过，5未启用
			row.state = 2;
			// 类型：1订单提醒，2入住通知，3离店问候，4自定义
			row.type = 1;
			var innName = $("[name='innName']").val();
			var address = $("[name='address']").val();
			var phone = $("[name='phone']").val();
			// var traffic = $("[name='traffic']").val();
			if ($("[tplcode='order']").attr("messageid") != "") {
				row.id = $("[tplcode='order']").attr("messageid");
			}
			var orderhtml = "您已成功预定"
					+ innName
					+ "客栈，X/X入住XXX房型X间X晚，总价¥XXX.XX，请在X月X日XX:XX前到店办理入住，逾期默认取消；本客栈提供接送机、景点门票代订、包车等服务，若需请致电联系或到店预约。客栈地址："
					+ address + "，联系电话：" + phone + "。感谢您的选择，静候光临！";
			/*
			 * 【云钥匙】您已成功预定{1}客栈,{2}晚,总价¥{3},请在{4}前到店办理入住,
			 * 逾期默认取消;本客栈提供接送机、景点门票代订、包车等服务, 若需请致电联系或到店预约。客栈地址:{5},联系电话:{6}。
			 * 感谢您的选择,静候光临!
			 */
			var parms = {};
			parms.parm1 = innName;
			parms.parm5 = address;
			parms.parm6 = phone;
			row.content = JSON.stringify(parms);
			if (!notEmpty(row)) {
				return false;
			}
			$.ajax({
				url : "/yuelijiang/seller/messageTemplate.action",
				data : {
					entityJson : JSON.stringify(row)
				},
				success : function(returnData) {
					if ($.yuelj.parseReturn(returnData)) {
						$.yuelj.alertMessage('提示', "修改成功!");
					}
					$("[tplcode='order'] [tag='content']").html(orderhtml);
				}
			});
		},
		cancelValue : '取消',
		cancel : function() {
		}
	});
	d.show();
}
function notEmpty(row) {
	for ( var i in row) {
		if ($.trim(row[i]) === "") {
			$.yuelj.alertMessage("提示", "所有输入项都不能为空！");
			return false;
		}
	}
	return true;
}
function setCheckIn() {
	var d = dialog({
		title : '入住通知',
		width : 260,
		content : $("#setCheckInWin"),
		okValue : '确定',
		ok : function() {
			var row = {};
			row.innid = innidNow;
			row.name = '入住通知';
			row.system = 0;
			row.state = 2;
			// 类型：1订单提醒，2入住通知，3离店问候，4自定义
			row.type = 2;
			var innName = $("[name='innName2']").val();
			var wifiAcc = $("[name='wifiAcc']").val();
			var wifiPwd = $("[name='wifiPwd']").val();
			var tablephone = $("[name='tablephone']").val();
			var tips = $("[name='tips']").val();
			row.tips = tips;
			row.tablephone = tablephone;
			row.wifiPwd = wifiPwd;
			row.innName = innName;
			row.wifiAcc = wifiAcc;
			if ($("[tplcode='checkin']").attr("messageid") != "") {
				row.id = $("[tplcode='checkin']").attr("messageid");
			}
			var orderhtml = "您已成功入住" + innName
					+ "客栈，入住期间您可随意取用客栈前厅的饮品和读物，请留意餐厅开放时间以免错过您的用餐时间；本店wifi账号："
					+ wifiAcc + "，密码：" + wifiPwd + "；有任何需要请致电前台：" + tablephone
					+ "。感谢您的选择，祝您在丽江有一个美满舒适的旅程！";
			/*
			 * 
			 * 【云钥匙】您已成功入住{1}客栈,入住期间您可随意取用客栈前厅的饮品和读物,
			 * 请留意餐厅开放时间以免错过您的用餐时间;本店wifi账号:{2},密码:{3};
			 * 有任何需要请致电前台:{4}。感谢您的选择,祝您在丽江有一个美满舒适的旅程!
			 */
			var parms = {};
			parms.parm1 = innName;
			parms.parm2 = wifiAcc;
			parms.parm3 = wifiPwd;
			parms.parm4 = tablephone;
			row.content = JSON.stringify(parms);

			if (!notEmpty(row)) {
				return false;
			}
			$.ajax({
				url : "/yuelijiang/seller/messageTemplate.action",
				data : {
					entityJson : JSON.stringify(row)
				},
				success : function(returnData) {
					if ($.yuelj.parseReturn(returnData)) {
						$.yuelj.alertMessage('提示', "修改成功!");
					}
					$("[tplcode='checkin'] [tag='content']").html(orderhtml);
				}
			});
		},
		cancelValue : '取消',
		cancel : function() {
		}
	});
	d.show();
}
function setCheckOut() {
	var d = dialog({
		title : '离店问候',
		width : 260,
		content : $("#setCheckOutWin"),
		okValue : '确定',
		ok : function() {
			var row = {};
			row.innid = innidNow;
			row.name = '离店问候';
			row.system = 0;
			row.state = 2;
			// 类型：1订单提醒，2入住通知，3离店问候，4自定义
			row.type = 3;
			var innName = $("[name='innName3']").val();
			if ($("[tplcode='checkout']").attr("messageid") != "") {
				row.id = $("[tplcode='checkout']").attr("messageid");
			}
			var orderhtml = "我是如此依依不舍，感谢您选择"
					+ innName
					+ "客栈，希望这次行程能让您满意，打开丰登街APP为我们评分吧，期待您珍贵的意见与建议【点击下载丰登街APP：http://wap.baidu.com】";
			/*
			 * 【云钥匙】我是如此依依不舍,感谢您选择{1}客栈, 希望这次行程能让您满意,打开丰登街APP为我们评分吧,
			 * 期待您珍贵的意见与建议[点击下载丰登街APP:{2}]
			 */
			var parms = {};
			parms.parm1 = innName;
			row.content = JSON.stringify(parms);
			if (!notEmpty(row)) {
				return false;
			}
			$.ajax({
				url : "/yuelijiang/seller/messageTemplate.action",
				data : {
					entityJson : JSON.stringify(row)
				},
				success : function(returnData) {
					if ($.yuelj.parseReturn(returnData)) {
						$.yuelj.alertMessage('提示', "修改成功!");
					}
					$("[tplcode='checkout'] [tag='content']").html(orderhtml);
				}
			});
		},
		cancelValue : '取消',
		cancel : function() {
		}
	});
	d.show();
}

function openLaws() {
	var d = dialog({
		title : '短信内容条款',
		width : 400,
		content : $("#messageLaws"),
		okValue : '确定',
		ok : function() {
		},
		cancelValue : '取消',
		cancel : function() {
		}
	});
	d.show();
}