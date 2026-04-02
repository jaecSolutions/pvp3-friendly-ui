if (typeof memboGo === 'undefined') {
	var memboGo = {};
}
memboGo.news = {
	init: function () {
		var that = this;
		$(document)
			.off('change', 'form[data-news-filter] #category,form[data-news-filter] #keywords')
			.on('change', 'form[data-news-filter] #category,form[data-news-filter] #keywords', function (e) {
				e.preventDefault();
				that.filter($(this).closest('form[data-news-filter]'), 1);
			});
	},
	initAccordion: function () {
		var that = this;
		memboGo.news.init();
		$(document)
			.off('click', '.news-accordion-open')
			.off('click', '.news-accordion-close')
			.off('click', '.panel-news-accordion .collapsed')
			.on('click', '.news-accordion-open', function () {
				$(this).hide().next('div').show();
			})
			.on('click', '.news-accordion-close', function () {
				$(this).closest('.news-accordion-content').hide().prev('div').show();
			})
	},
	initBlog: function () {
		var that = this;
		memboGo.news.init();
		$(document)
			.off('click', '.js-news-blog-items .paginationControl a')
			.on('click', '.js-news-blog-items .paginationControl a', function (e) {
				e.preventDefault();
				that.filter($(this).closest('[data-zone-id]').find('form[data-news-filter]'), $(this).text().trim());
			});
	},
	filter: function (form, page) {
		var filter = new FormData(form[0]);
		filter.append('zoneId', form.closest('[data-zone-id]').data('zone-id'));
		filter.append('page', page);
		$.ajax({
			type: "POST",
			async: "false",
			url: form.attr('action'),
			data: filter,
			dataType: "html",
			processData: false,
			contentType: false,
			beforeSend: function () {
				HPJUtils.displayLoadingBox();
			},
			success: function (data) {
				form.siblings('div').last().replaceWith(data);
				window.location.href = '#' + form.closest('[data-zone-id]').attr('id');
			},
			complete: function () {
				HPJUtils.hideLoadingBox();
			}
		});
	}
};

memboGo.news.histoBack = function (element) {
	$(document).ready(function () {
		if ($(element).attr('href') === 'javascript:history.back()') {
			var referrer = document.referrer.split('//');
			if (typeof referrer[1] === 'undefined' || referrer[1].length < 1 || referrer[1].split('/')[0] != document.location.hostname) {
				$(element).remove();
			}
		}
	});
}

memboGo.news.zoneNewsFilter = function (url) {
	$(document)
		.on('change', '.zone-news #category_id,.zone-news #keywords', function () {
			var self = $(this).closest('[data-zone-id]');
			$('#filter_loader').show();
			$.ajax({
				type: "POST",
				global: false,
				url: url,
				data: {
					zoneId: self.data('zone-id'),
					category: self.find('#category_id').val(),
					keywords: self.find('#keywords').val()
				},
				dataType: "html",
				success: function (data) {
					self.find('#news_content').replaceWith(data);
				},
				complete: function () {
					$('#filter_loader').hide();
				}
			});
		});
}

