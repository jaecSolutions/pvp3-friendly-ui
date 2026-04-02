if (typeof memboGo === 'undefined') {
	var memboGo = {};
}

memboGo.ContactXRM = {
	currentURL: '',
	module: 'contact_xrm',
	init: function (url, module) {
		if (!this.currentURL) {
			this.currentURL = url;
		}
		if (typeof module !== 'undefined' && module) {
			this.module = module;
		}
		var self = this;
		$(document)
			.off('submit', '.contactxrm-container form')
			.on('submit', '.contactxrm-container form', function (e) {
				e.preventDefault();
				e.stopPropagation();
				self.sendContact(this);
			})
			.ready(function () {})
	},

	sendContact: function (form) {
		var data = new FormData($(form)[0]);
		$.ajax({
			url: this.currentURL + 'ajax-save/module/' + this.module + '/',
			type: 'POST',
			cache: false,
			data: data,
			dataType: 'json',
			processData: false,
			contentType: false,
			beforeSend: function () {
				displayLoadingBox();
			},
			success: function (data) {
				if (data.success) {
					$(form).closest('.contactxrm-container').html(data.content);
					return;
				}
				
				$(form).find('.section').remove();
				var section = $(form).find('.crm-footer-frame');
				if (section.length) {
					$(data.content).find('.section').each(function (i, element) {
						section.before(element);
					});
				}
				
				var error = $(data.content).find('div.alert-container');
				if (error.length) {
					$(form).closest('.contactxrm-container').find('div.alert-container').html(error.html());
				}
				
				if ($(form).find('.g-recaptcha').length) {
					grecaptcha.reset();
				}
				HPJForm.afterLoad();
			},
			complete: function (data) {
				HPJUtils.hideLoadingBox();
			}
		});
	}
};