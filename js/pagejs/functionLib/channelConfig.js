/**
 * 以下客人来源渠道管理
 */

var DEFAULT_TYPE = "default";
var SELF_TYPE = "self";
var defaultChannelList = [];
var selfChannelList = [];
var channelList = [];
function initChannelConfig() {
	$("#defaultChannelDiv").html("");
	$("#selfChannelDiv").html("");
	$.ajax({
		url : "/yuelijiang/seller/queryGuestSource.action",
		data : {
			innId : innidNow
		},
		success : function(returnData) {
			channelList = returnData.list;
			parseChannelList(channelList);
		}
	});
	function parseChannelList(list) {
		for ( var i in list) {
			if (list[i].state == "0") {
				continue;
			}
			if (list[i].type == DEFAULT_TYPE) {
				defaultChannelList.push(list[i]);
				$("#defaultChannelDiv")
						.append(
								'<div class="col-sm-1">'
										+ '<input type="text" class="form-control" style="width:120px;" id="bankName" value="'
										+ list[i].channelName
										+ '"readonly="readonly" />' + '</div>');
			} else if (list[i].type == SELF_TYPE) {
				selfChannelList.push(list[i]);
				var channelid = list[i].id;
				$("#selfChannelDiv")
						.append(
								'<div class="row" style="margin-top:20px;">'
										+ '<div class="col-sm-2">'
										+ '	<input id="channelid'
										+ channelid
										+ '"   type="text" class="form-control"  readonly="readonly"  value="'
										+ list[i].channelName
										+ '"/></div>'
										+ '<div class="col-sm-2">'
										+ '	<input  id="'
										+ channelid
										+ 'edit"   class="btn btn-default" type="button" value="修改" onclick="editChannel('
										+ channelid
										+ ')"> <input class="btn btn-danger" type="button" value="删除" onclick="deleteChannel('
										+ channelid + ')"></div>');
			}
		}
	}
}
// 编辑渠道
function editChannel(id) {
	if (!$.yuelj.checkModulePermission(9)) {
		return;
	}
	if ($("#channelid" + id).attr("readonly") == "readonly") {
		$("#channelid" + id).removeAttr("readonly");
		$("#" + id + "edit").val("确定");
	} else {
		if (!channelValidate(id)) {
			return;
		}
		$("#channelid" + id).attr("readonly", "readonly");
		$("#" + id + "edit").val("修改");
		if ($("#channelid" + id).val().length != 0) {
			$.ajax({
				url : "/yuelijiang/seller/updateGuestSource.action",
				data : {
					id : id,
					name : $("#channelid" + id).val()
				},
				success : function(returnData) {
					if ($.yuelj.parseReturn(returnData)) {
						// $.yuelj.alertMessage('提示', "修改成功!");
					}
				}
			});
		}
	}
}
// 删除渠道
function deleteChannel(channelid) {
	if (!$.yuelj.checkModulePermission(9)) {
		return;
	}
	var d = dialog({
		title : '删除渠道',
		width : 200,
		content : "确定要删除该渠道么？",
		okValue : '确定',
		ok : function() {
			$.ajax({
				url : "/yuelijiang/seller/updateGuestSource.action",
				data : {
					id : channelid,
					innId : innidNow,
					state : 0,
					name : $("#channelid" + channelid).val()
				},
				success : function(returnData) {
					if ($.yuelj.parseReturn(returnData)) {
						initChannelConfig();
						// $.yuelj.alertMessage('提示', "删除成功!");
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
function channelValidate(channelid) {
	var id = "#channelid" + channelid;
	if (channelid == null || channelid == "") {
		id = "#newChannel";
	}
	for ( var i in channelList) {
		if (channelList[i].id != channelid
				&& channelList[i].channelName == $(id).val()) {
			$.yuelj.alertMessage('提示', "渠道名称重复!");
			return false;
		}
	}
	return true;
}
// 新增渠道
function addChannelClick() {
	if (!$.yuelj.checkModulePermission(9)) {
		return;
	}
	if ($("#addChannelButton").val() == "+添加渠道") {
		$("#newChannel").show();
		$("#newChannel").css("display", "inline");
		$("#addChannelButton").val("确定");
	} else {
		if (!channelValidate()) {
			return;
		}
		$("#newChannel").hide();
		$("#addChannelButton").val("+添加渠道");
		if ($("#newChannel").val().length != 0) {
			$.ajax({
				url : "/yuelijiang/seller/addGuestSource.action",
				data : {
					innId : innidNow,
					name : $("#newChannel").val()
				},
				success : function(returnData) {
					if ($.yuelj.parseReturn(returnData)) {
						initChannelConfig();
						$("#newChannel").val("");
						// $.yuelj.alertMessage('提示', "添加成功!");
					}
				}
			});
		}
	}
}