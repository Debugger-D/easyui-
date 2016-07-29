/**
 * 客人支付方式管理
 */

var DEFAULT_TYPE = "default";
var SELF_TYPE = "self";
var defaultPaymentList = [];
var selfPaymentList = [];
var paymentList = [];
function initPamentConfig() {
	$("#defaultPaymentDiv").html("");
	$("#selfPaymentDiv").html("");
	$.ajax({
		url : "/yuelijiang/seller/queryPaymentConfig.action",
		data : {
			innId : innidNow
		},
		success : function(returnData) {
			paymentList = returnData.list;
			parsePaymentList(paymentList);
		}
	});
	function parsePaymentList(list) {
		for ( var i in list) {
			if (list[i].state == "0") {
				continue;
			}
			if (list[i].type == DEFAULT_TYPE) {
				defaultPaymentList.push(list[i]);
				$("#defaultPaymentDiv")
						.append(
								'<input type="text" class="form-control" style="width:120px;float:left;margin-left:10px;" id="bankName" value="'
										+ list[i].name
										+ '"readonly="readonly" />');
			} else if (list[i].type == SELF_TYPE) {
				selfPaymentList.push(list[i]);
				var paymentid = list[i].id;
				$("#selfPaymentDiv")
						.append(
								'<div class="row" style="margin-top:20px;">'
										+ '<div class="col-sm-1" style="width:150px;">'
										+ '	<input id="paymentid'
										+ paymentid
										+ '"   type="text" class="form-control"  readonly="readonly"  value="'
										+ list[i].name
										+ '"/></div>'
										+ '<div class="col-sm-1" style="width:300px;">'
										+ '	<input  id="'
										+ paymentid
										+ 'edit"   class="btn btn-default" type="button" value="修改" onclick="editPayment('
										+ paymentid
										+ ')"> <input class="btn btn-danger" type="button" value="删除" onclick="deletePayment('
										+ paymentid + ')"></div>');
			}
		}
	}
}
// 编辑支付方式
function editPayment(id) {
	if (!$.yuelj.checkModulePermission(9)) {
		return;
	}
	if ($("#paymentid" + id).attr("readonly") == "readonly") {
		$("#paymentid" + id).removeAttr("readonly");
		$("#" + id + "edit").val("确定");
	} else {
		if (!paymentValidate(id)) {
			return;
		}
		$("#paymentid" + id).attr("readonly", "readonly");
		$("#" + id + "edit").val("修改");
		if ($("#paymentid" + id).val().length != 0) {
			$.ajax({
				url : "/yuelijiang/seller/updatePaymentConfig.action",
				data : {
					id : id,
					name : $("#paymentid" + id).val()
				},
				success : function(returnData) {
					if ($.yuelj.parseReturn(returnData)) {
						//$.yuelj.alertMessage('提示', "修改成功!");
					}
				}
			});
		}
	}
}
// 删除支付方式
function deletePayment(paymentid) {
	if (!$.yuelj.checkModulePermission(9)) {
		return;
	}
	var d = dialog({
		title : '删除支付方式',
		width : 200,
		content : "确定要删除该支付方式么？",
		okValue : '确定',
		ok : function() {
			$.ajax({
				url : "/yuelijiang/seller/updatePaymentConfig.action",
				data : {
					id : paymentid,
					innId : innidNow,
					state : 0,
					name : $("#paymentid" + paymentid).val()
				},
				success : function(returnData) {
					if ($.yuelj.parseReturn(returnData)) {
						initPamentConfig();
						//$.yuelj.alertMessage('提示', "删除成功!");
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
function paymentValidate(paymentid) {
	var id = "#paymentid" + paymentid;
	if (paymentid == null || paymentid == "") {
		id = "#newPayment";
	}
	for ( var i in paymentList) {
		if (paymentList[i].id != paymentid
				&& paymentList[i].paymentName == $(id).val()) {
			$.yuelj.alertMessage('提示', "支付方式名称重复!");
			return false;
		}
	}
	return true;
}
// 新增支付方式
function addPaymentClick() {
	if (!$.yuelj.checkModulePermission(9)) {
		return;
	}
	if (!paymentValidate()) {
		return;
	}
	if ($("#addPaymentButton").val() == "+添加支付方式") {
		$("#newPayment").show();
		$("#newPayment").css("display", "inline");
		$("#addPaymentButton").val("确定");
	} else {
		if (!paymentValidate()) {
			return;
		}
		$("#newPayment").hide();
		$("#addPaymentButton").val("+添加支付方式");
		if ($("#newPayment").val().length != 0) {
			$.ajax({
				url : "/yuelijiang/seller/addPaymentConfig.action",
				data : {
					innId : innidNow,
					name : $("#newPayment").val()
				},
				success : function(returnData) {
					if ($.yuelj.parseReturn(returnData)) {
						initPamentConfig();
						 $("#newPayment").val("");
						//$.yuelj.alertMessage('提示', "添加成功!");
					}
				}
			});
		}
	}
}