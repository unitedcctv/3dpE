$(function(){
    $(".moveControl").click( function() {
    	var caller = $(this)[0].id;
    	var jqId = caller.substring(caller.length - 1, caller.length);
		var sliderId = '#slider' + jqId;
		var amount = $(sliderId)[0].value;
    	
    	$.get('/' + caller, {amount:amount}).done(function(data) {		
			alert(data.message);
			$('#home' + jqId).removeAttr('disabled');
		});
	});

	$(".homeControl").click( function() {
    	var caller = $(this)[0].id;
    	
    	var jqId = caller.substring(caller.length - 1, caller.length);
		var sliderId = '#slider' + jqId;

    	$.get('/' + caller).done(function(data) {		
			$('#' + caller).attr('disabled','disabled');
			$(sliderId).val(0);
			$(sliderId).slider('refresh');
		});
	});
});