var countryStates = {};

$(document).ready(function () {
	afterFormLoad();
	setActiveMenu();
	setProgressStepsCount();
	$("button.previous-button").click(function (e) {
		e.preventDefault();
		window.location = $(this).attr('data-ref');
	});
	$(".switch-language").on('click', function (e) {
		var rel = this.getAttribute('rel') || '';
		if (rel.length > 0) {
			e.preventDefault();
			var pathname = window.location.pathname.split('/');
			pathname[1] = rel;
			window.location.pathname = pathname.join('/');
		}
	});
	$('.select-country').each(function () {
		var stateElement = $(this).closest('form').find('[name="' + $(this).find('.form-control').attr('name').replace(/country(?!.*country)/, 'state') + '"]');
		if (stateElement.length) {
			var countryVal = $(this).find('.form-control').val();
			manageSelectState(countryVal, stateElement);
		}
	});
	HPJForm.datePicker();
	$(document).find('form[dynamic]').each(function () {
		try {
			$(this).find('.has-error:eq(0)').each(function () {
				window.scrollTo(0, $(this).offset().top - 50);
			});
		} catch (e) {
			console.log(e);
		}
	});
	setTimeout(function () {
		$('.site_line__item.hide').remove();
	}, 1000);
}).on('change', '.select-country', function () {
	var stateElement = $(this).closest('form')
		.find('[name="' + $(this).find('.form-control').attr('name').replace(/country(?!.*country)/, 'state') + '"]');
	if (stateElement.length) {
		var countryVal = $(this).find('.form-control').val();
		manageSelectState(countryVal, stateElement);
	}
});

/**
 * Set Class active on the correct menu element
 */
function setActiveMenu() {
	var li = $("li[rel='data-menu-" + pageId + "']");
	if (li.length !== 0) {
		li.addClass('active');
	} else {
		li = $("li[rel='data-children-" + pageId + "']");
		li.parent().parent().addClass('active');
	}
}

/**
 * Set count of steps for progress steps nav
 */
function setProgressStepsCount() {
	var nav_progress_steps = $('.nav-progress-steps');
	if (nav_progress_steps.length) {
		nav_progress_steps.addClass('nav-steps-' + $('> li:visible', nav_progress_steps).length);
	}
}

function manageSelectState(countryVal, stateElement) {
	let stateElementId = stateElement.attr('id');
	let stateElementName = stateElement.attr('name');
	let newStateElement = null;
	if (['CA', 'US', 'IT'].includes(countryVal)) {
		newStateElement = $('<select name="' + stateElementName + '" id="' + stateElementId + '" class="form-control">');
		let defaultState = stateElement.get(0).closest('.form-group').dataset.default;
		if (stateElement.val() != null) {
			defaultState = stateElement.val();
		}
		stateElement.closest('.form-group').show();
		stateElement.replaceWith(newStateElement);
		getStatesV2(countryVal, newStateElement, defaultState);
	} else {
		newStateElement = $('<input name="' + stateElementName + '" id="' + stateElementId + '" type="hidden" class="form-control input-md">');
		if (typeof stateElementDefault != 'undefined') {
			newStateElement.attr('refDefault', stateElementDefault);
		}
		stateElement.closest('.form-group').hide();
		stateElement.replaceWith(newStateElement);
	}
}

function getStatesV2(country, stateElement, defaultValue, callback) {
	if (!['CA', 'US', 'IT'].includes(country)) {
		stateElement.empty();
		if (stateElement.next('.chosen-container').length) {
			stateElement.trigger('chosen:updated');
		}
		return;
	}
	if (typeof countryStates[country] === 'undefined') {
		countryStates[country] = {ajax: 1, data: {}};
		var url = '/form/' + language + '/form/getstates/';
		if ($('body > #site-wrapper').length) {
			url = '/' + language + '/method/ajax-get-states/name/module/';
		}
		$.ajax({
			url: url,
			type: "GET",
			async: "false",
			global: false,
			dataType: "json",
			data: {country: country},
			success: function (data) {
				countryStates[country].data = data;
			},
			complete: function () {
				countryStates[country].ajax = 0;
			}
		});
	}

	if (countryStates[country].ajax === 1) {
		setTimeout(function () {
			getStatesV2(country, stateElement, defaultValue, callback)
		}, 500);
	} else {
		const jsSelect = stateElement.get(0);

		stateElement.empty();

		const selectText = jsSelect.closest('.form-group').dataset.selectText;

		if (selectText) {
			stateElement.append($('<option value="">' + selectText + '</option>'));
		}

		$.each(countryStates[country].data, function (key, value) {
			stateElement.append(
				$('<option value="' + key + '">' + value + '</option>')
			);
		});

		if (!defaultValue) {
			defaultValue = jsSelect.closest('.form-group').dataset.default;
		}

		if (defaultValue) {
			const optionToSelect = Array.from(jsSelect.options).find(option => option.value === defaultValue);
			if (optionToSelect) {
				optionToSelect.selected = true;
			}
		}

		if (typeof callback === 'function') {
			callback(stateElement);
		}
	}
}

window.addEventListener('message', function (e) {
	try {
		if (e.data == 'previewZone') {
			$(".site_line__item").show();
			$('[data-line-id="system"]').remove();
			$(".site-inner div[data-zone-alias]").each(function () {
				if (!$(this).find('.zone-selectable-name').length) {
					$(this).addClass("web__zone__selected")
						.prepend(
							$('<div />', {
								class: "zone-selectable-name",
								style: "position:absolute;bottom:0;top:0;left:0;right:0;z-index:99999;"
							})
								.append(
									$(this).data("zone-alias"),
									$('<span />', {class: "zone-selectable-name__btn-edit"}).append($('<i />', {class: "icon icon-pencil"}), text_edit)
								)
						);
				}
			});
			$(document).off('click', '.site-inner div[data-zone-alias]')
				.on('click', '.site-inner div[data-zone-alias]', function () {
					parent.postMessage({zoneid: $(this).attr('id')}, "*");
				})
		}
	} catch (e) {
	}
}, false);

function afterFormLoad(form) {
	$(form || document)
		.find("label.required,label>span.required").each(function (index) {
		if ($(this).text().indexOf("*") == -1) {
			var html = $(this).html();
			if (html.indexOf("<") !== -1) {
				html = html.slice(0, html.indexOf("<")) + '<span class="control-label--required">&nbsp;*</span>' + html.slice(html.indexOf("<"));
				$(this).html(html);
			} else {
				$(this).append('<span class="control-label--required">&nbsp;*</span>');
			}
		}
	});

    $('[data-conditional-field],[data-display-conditions]').trigger('change');

	try {
		memboGo.Field.Autocomplete.init();
	} catch (e) {
		memboGo.core.dispatchException(e);
	}
}