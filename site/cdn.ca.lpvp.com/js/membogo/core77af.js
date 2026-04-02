if (typeof memboGo === 'undefined') {
    var memboGo = {};
}

memboGo.core = {
    _lng: '',
    _module: '',
    _controller: ''
};

/**
 * @TODO
 * - Use only one Modal with a div.confirm-wrapper and a div.result-wrapper
 * - parameter 'modalId' ? ('#modal-' + actionName by default)
 */
memboGo.core.export = function (searchAdvanced) {
    searchAdvanced = searchAdvanced || false;
    var modal, modalR;
    this.init = function () {
        $(document)
            .off('click', '.btn-export')
            .on('click', '.btn-export', function (e) {
                e.preventDefault();

                var a = (typeof $(this).data('action') !== 'undefined')
                    ? $(this).data('action')
                    : 'export';
                var preexportUrl = (typeof $(this).data('preexporturl') !== 'undefined')
                    ? $(this).data('preexporturl')
                    : '/' + memboGo.core._module + '/' + memboGo.core._lng + '/' + memboGo.core._controller + '/pre' + a + '/';
                var exportUrl = (typeof $(this).data('exporturl') !== 'undefined')
                    ? $(this).data('exporturl')
                    : '/' + memboGo.core._module + '/' + memboGo.core._lng + '/' + memboGo.core._controller + '/' + a + '/';

                //@NOTE modal name based on action name
                if (!modal) {
                    modal = new HPJUtils.modal('#modal-' + a);
                }
                var fData = [],
                    formId,
                    advancedSearchParams;

                if ($('.tab-content > div:visible form').length) {
                    formId = $('.tab-content > div:visible form').attr('id');
                } else {
                    formId = 'searchForm';
                }

                switch (formId) {
                    case 'advancedSearchForm':
                        advancedSearchParams = 'advanced';
                        break;
                    case 'qsearch_form':
                        advancedSearchParams = 'qsearch';
                        break;
                    default:
                        advancedSearchParams = 'simple';
                        break;
                }

                var form = $('#' + formId);
                if (form.length) {
                    fData = form.serialize();
                }
                modal.hide('.modal-yes', false);
                if (!searchAdvanced) {
                    modal.open();
                } else {
                    HPJUtils.displayLoadingBox();
                    // If the form use the searchAdvanced, preload a form inside the modal first
                    $.ajax({
                        url: preexportUrl,
                        data: fData,
                        dataType: 'json',
                        success: function (data) {
                            if (typeof data.html !== 'undefined') {
                                modal.setContent(data.html);
                            }
                        },
                        complete: function () {
                            HPJUtils.hideLoadingBox();
                            modal.open();
                        }
                    });
                }

                modal.setAction('.modal-yes', function () {
                    HPJUtils.displayLoadingBox();

                    let url = exportUrl + '?searchType=' + advancedSearchParams;

                    const modalElement = modal.getElement()[0];

                    if (searchAdvanced) {
                        const personalizeSearch = modalElement.querySelector('input[name="personalize_search"]:checked');

                        if (personalizeSearch) {
                            url += '&personalize_search=' + personalizeSearch.value;
                        }

                        const template = modalElement.querySelector('select[name="template"]');

                        if (template) {
                            url += '&template=' + template.value;
                        }

                    } else {
                        modal.close();
                    }

                    $.ajax({
                        url: url,
                        data: fData,
                        dataType: 'json',
                        success: function (data) {
                            if (searchAdvanced) {
                                modal.setContent(data.html);
                                $('#export-dismiss').text(data.close);
                                modal.hide('.modal-yes', true);
                            } else {
                                if (!modalR) {
                                    modalR = new HPJUtils.modal('#modal-' + a + '-result');
                                }
                                if (typeof data.html !== 'undefined') {
                                    modalR.setContent(data.html);
                                }
                                modalR.open();
                            }
                        },
                        complete: function () {
                            HPJUtils.hideLoadingBox();
                        }
                    });
                });
            });
    };
};

memboGo.core.cmsFormStep = {
    addStep: function (value) {
        $('body').addClass("step-" + value);
    },
    addView: function (value) {
        $('body').addClass("view-" + value);
    },
    reset: function () {
        $('body').attr('class').split(' ')
            .map(function (classe) {
                try {
                    classe = classe.trim('');
                    if (classe.includes('step-')) {
                        $('body').removeClass(classe);
                    }
                } catch (e) {

                }
            });
    }
};

memboGo.core.event = {
    dispatch: function (type, detail) {
        try {
            document.dispatchEvent(new CustomEvent(type, {detail: detail}));
        } catch (e) {
            console.log(e);
        }
    },
    listen: function (type, method) {
        this.remove(type);
        document.addEventListener(type, method);
    },
    remove: function (type) {
        try {
            document.removeEventListener(type);
        } catch (e) {

        }
    }
};

memboGo.core.money = {
    format: '',
    convert: function (n, c) {
        n = parseFloat(n);
        return n.money(c);
    },
    toFloat: function (n) {
        return typeof n === 'number' ? n : parseFloat(n.replace(',', '.'));
    },
    // Quick workaround for precision problem, still need to migrate for decimal.js
    add: function (a, b, c) {
        // Convert to cents => add => back to decimal
        return Math.abs((this.toFloat(a) * 100 + this.toFloat(b) * 100) / 100).toFixed(c || 2);
    },
    subtract: function (a, b, c) {
        // Convert to cents => subtract => back to decimal
        return Math.abs((this.toFloat(a) * 100 - this.toFloat(b) * 100) / 100).toFixed(c || 2);
    }
};

Number.prototype.money = function (c) {
    c = isNaN(c = Math.abs(c)) ? 2 : c;
    var n = this,
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0,
        s = n < 0 ? '-' : '',
        d = '.';

    if (memboGo.core.money.format.indexOf(',') >= 0) {
        d = ',';
    }
    var amount = s + (j ? i.substr(0, j) + " " : "")
        + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + " ")
        + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    return memboGo.core.money.format.replace(/(\d*\s*\d+(\.|\,)\d+)/i, amount);
};

memboGo.core.cookie = {
    set: function (name, value, ttl) {
        var expires = "", secure = "";
        if (ttl) {
            if (typeof ttl === 'object') {
                expires = "; expires=" + ttl.toGMTString();
            } else {
                var date = new Date();
                date.setTime(date.getTime() + parseInt(ttl) * 1000);
                expires = "; expires=" + date.toGMTString();
            }
        }
        if (location.protocol === 'https:') {
            secure = "secure";
        }
        document.cookie = name + "=" + value + expires + "; path=/;" + secure;
    },
    get: function (name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    },
    del: function (name) {
        createCookie(name, "", -1);
    }
};

memboGo.core.datepicker = {
    firstDayOfWeek: {
        0: ['AR', 'BZ', 'BO', 'BR', 'CA', 'CL', 'CN', 'CO', 'CR', 'DO', 'EC', 'SV', 'GT', 'HN', 'HK', 'IL', 'JM', 'JP', 'KE', 'MO', 'MX', 'NI', 'PA', 'PE', 'PH', 'PR', 'ZA', 'KR', 'TW', 'US', 'VE', 'ZW'],
        6: ['AF', 'DZ', 'BH', 'EG', 'IR', 'IQ', 'JO', 'KW', 'LY', 'OM', 'QA', 'SA', 'SY', 'AE', 'YE']
    },
    getDayName: function (that) {
        try {
            var date = new Date($(that).datepicker("getDate"));
            return $.datepicker.regional.dayNames[date.getDay()];
        } catch (e) {
            return '';
        }
    },
    init: function (data) {
        (function (factory) {
            if (typeof define === "function" && define.amd) {
                define(["../widgets/datepicker"], factory);
            } else {
                factory(jQuery.datepicker);
            }
        }(function (datepicker) {
            datepicker.regional = {
                monthNames: eval(data.monthNames),
                monthNamesShort: eval(data.monthNamesShort),
                dayNames: eval(data.dayNames),
                dayNamesShort: eval(data.dayNamesShort),
                dayNamesMin: eval(data.dayNamesMin),
                dateFormat: data.dateFormat,
                changeMonth: true,
                changeYear: true,
                firstDay: 1
            };
            const country = data.companyCountry || 'US';
            for (const day in memboGo.core.datepicker.firstDayOfWeek) {
                if (memboGo.core.datepicker.firstDayOfWeek[day].includes(country)) {
                    datepicker.regional.firstDay = day;
                    break;
                }
            }
            datepicker.setDefaults(datepicker.regional);
            return datepicker.regional;
        }));
    }
};

memboGo.core.timepicker = {
    /**
     * Autocomplete time pickers
     */
    initTimePicker: function (that, appendTo) {
        var self = this;
        that.find('.timepicker').each(function () {
            $(this).timeEntry({show24Hours: true});
            $(this).autocomplete({
                minLength: 0,
                appendTo: appendTo || null,
                source: function (request, response) {
                    response(self.getTime(this.element));
                }
            });
        });
    },

    /**
     * Get time for timepicker form elements
     *
     * @param that
     * @returns {[]}
     */
    getTime: function (that) {
        var now = $(that).val().split(':');
        var hour = parseInt(now[0] || null);
        if (isNaN(hour)) {
            hour = null;
        }
        var minute = parseInt(now[1] || null);
        if (isNaN(hour)) {
            minute = null;
        }
        var data = [];
        for (var i = 0; i < 24; i++) {
            if (hour === null || hour === i) {
                var length = data.length;
                if (i < 10) {
                    i = '0' + i;
                }
                data[length] = i + ':00';
                if (hour !== null) {
                    data[length + 1] = i + ':15';
                    data[length + 2] = i + ':30';
                    data[length + 3] = i + ':45';
                } else {
                    data[length + 1] = i + ':30';
                }
            }
        }
        return data;
    }
};

memboGo.core.optin = {
    init: function () {
        $(document).on('change', 'input.optin-field, .optin-field input[type="checkbox"]', function () {
            if ($(this).is(':checked')) {
                $(this).val(1);
            } else {
                $(this).val(0);
            }
        });
    },
};

memboGo.core.ckeditor = {
    init: function (element) {
        try {
            element.find('.ckeditor').each(function () {
                var height = '500px';
                if ($(this).attr('height')) {
                    height = $(this).attr('height');
                } else if (typeof $(this).data('ckeditor-height') !== 'undefined') {
                    height = $(this).data('ckeditor-height');
                }
                CKEDITOR.replace($(this).attr('id'),
                    {
                        height: height,
                        filebrowserBrowseUrl: baseUrl + 'ckfinder/ckfinder.html',
                        filebrowserImageBrowseUrl: baseUrl + 'ckfinder/ckfinder.html?Type=Images',
                        filebrowserUploadUrl: baseUrl + 'ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Files',
                        filebrowserImageUploadUrl: baseUrl + 'ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Images'
                    });
            });
        } catch (e) {
        }
    },
    prepareData: function () {
        if (typeof CKEDITOR !== 'undefined') {
            try {
                for (ckinstance in CKEDITOR.instances) {
                    if (document.getElementById(ckinstance) !== null) {
                        document.getElementById(ckinstance).value = CKEDITOR.instances[ckinstance].getData();
                    }
                }
            } catch (e) {
            }
        }
    },
    destroy: function () {
        try {
            for (ckinstance in CKEDITOR.instances) {
                if (typeof CKEDITOR.instances[ckinstance] !== 'undefined') {
                    try {
                        CKEDITOR.instances[ckinstance].destroy();
                    } catch (e) {
                    }
                }
            }
        } catch (e) {
        }
    },
};

memboGo.core.hotjar = function (hjid) {
    if (hjid === null || hjid === '') {
        return;
    }
    (function (h, o, t, j, a, r) {
        h.hj = h.hj || function () {
            (h.hj.q = h.hj.q || []).push(arguments)
        };
        h._hjSettings = {hjid: hjid, hjsv: 6};
        a = o.getElementsByTagName('head')[0];
        r = o.createElement('script');
        r.async = 1;
        r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
        a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
};

memboGo.core.googlePlace = {
    load: false,
    key: null,
    componentForm: {
        street_number: 'long_name',
        route: 'long_name',
        locality: 'long_name',
        administrative_area_level_1: 'short_name',
        administrative_area_level_2: 'short_name',
        country: 'short_name',
        postal_code_prefix: 'long_name',
        postal_code: 'long_name',
    },
    init: function (callback) {
        if (this.isAvailable()) {
            return true;
        }
        memboGo.core.event.listen('googleapis.done', callback);
        memboGo.core.googlePlace.initAPI();
        return false;
    },
    isAvailable: function () {
        return typeof google !== 'undefined' && typeof google.maps !== 'undefined';
    },
    initAPI: function () {
        var self = memboGo.core.googlePlace;
        if (self.key === null || self.key === '' || self.load) {
            return;
        }
        if (document.getElementById('membogo-google-places-api')) {
            self.load = true;
            return;
        }
        self.load = true;
        var script = document.createElement('script');
        script.id = 'membogo-google-places-api';
        script.type = 'text/javascript';
        script.src = 'https://maps.googleapis.com/maps/api/js?language=' + language + '&key=' + self.key + '&libraries=places';
        script.onload = script.onreadystatechange = function () {
            if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                script.onload = script.onreadystatechange = null;
                memboGo.core.event.dispatch('googleapis.done');
            }
        };
        document.getElementsByTagName('head')[0].appendChild(script);
    },
    placeData: function (place) {
        var result = [], i, t, street = [];
        if (typeof place.address_components !== 'undefined') {
            for (i = 0; i < place.address_components.length; i++) {
                t = place.address_components[i].types[0];
                if (this.componentForm[t]) {
                    result[t] = place.address_components[i][this.componentForm[t]];
                    if (result[t].length > 0) {
                        if (t === 'street_number' || t === 'route') {
                            street[street.length] = result[t];
                        } else if (t === 'postal_code_prefix' || t === 'postal_code') {
                            result['zip'] = result['zip_code'] = result[t];
                        }
                    }
                }
            }
            if (street.length) {
                result['street'] = street.join(', ');
            }
        }
        return this.normalizeState(result);
    },
    normalizeState: function (data) {
        if (typeof data['country'] === 'undefined') {
            return data;
        }

        let state;
        if (data['country'] === 'IT') {
            state = 'administrative_area_level_2';
        } else {
            state = 'administrative_area_level_1';
        }

        if (typeof data[state] === 'undefined' || !['CA', 'US', 'IT'].includes(data['country'])) {
            data[state] = '';
            return data;
        }

        if (data['country'] === 'US' && data[state].length) {
            data[state] = data['country'] + '_' + data[state];
        } else if (data['country'] === 'CA') {
            const extended = {'PE': 'CA_PE', 'NU': 'CA_NU', 'SK': 'CA_SK', 'NL': 'CA_NF', 'YT': 'CA_YT'};
            if (typeof extended[data[state]] !== 'undefined') {
                data[state] = extended[data[state]];
            }
        } else if (data['country'] === 'IT') {
            data['administrative_area_level_1'] = data[state];
        }

        return data;
    }
};

// Add Exception Routine Here
memboGo.core.dispatchException = function (e) {
    console.log(e)
};

memboGo.core.modalCancelAndRefund = {
    init: function () {
        let self = this;

        $(document).on('change.initModalCancel', '#global-modal-cancel input[name="cancel_with_refund"]', function () {
            let val = $('input[name="cancel_with_refund"]:checked').val();
            if (typeof val === 'undefined') {
                return false;
            }

            $('#modal-cancel .modal-yes').prop('disabled', false);

            if (val === 'cancel_with_refund') {
                $('.js-cancel-with-refund').removeClass('d-none');
                $('.js-cancel-without-refund').addClass('d-none');
            } else {
                $('.js-cancel-with-refund').addClass('d-none');
                $('.js-cancel-without-refund').removeClass('d-none');
            }
        });

        if (
            $('#global-modal-cancel #cancellation-fee').length
            && $('#global-modal-cancel #cancellation-refund-amount').length
        ) {
            let maxAmount = memboGo.core.money.toFloat($('#cancellation-paid-amount').val());
            let feeTaxesPercentage = $('#cancellation-fee-taxes').length ? $('#cancellation-fee-taxes').data('percentage') : 0;

            const updateRefundFeeAmount = function (maxAmount, selector1, selector2) {
                let currentAmount = memboGo.core.money.toFloat(selector1.val());

                if (currentAmount > maxAmount) {
                    currentAmount = maxAmount;
                }
                if (isNaN(currentAmount) || currentAmount <= 0) {
                    currentAmount = 0;
                }

                selector1.val(currentAmount);
                selector2.val(memboGo.core.money.subtract(maxAmount, currentAmount));
            }

            const updateRefundFeeAmountWithTaxes = function (maxAmount, selector1, selector2, feeTaxesPercentage) {
                let currentAmount = memboGo.core.money.toFloat(selector1.val());
                let feeTaxes = memboGo.core.money.toFloat(currentAmount * feeTaxesPercentage / 100).toFixed(2);
                let amountAndFee = memboGo.core.money.add(currentAmount, feeTaxes);

                if (amountAndFee > maxAmount) {
                    feeTaxes = memboGo.core.money.toFloat(maxAmount * feeTaxesPercentage / 100).toFixed(2);
                    currentAmount = memboGo.core.money.subtract(maxAmount, feeTaxes);
                }

                if (isNaN(currentAmount) || currentAmount <= 0) {
                    currentAmount = 0;
                    feeTaxes = 0;
                }

                selector1.val(currentAmount);
                $('#cancellation-fee-taxes').val(feeTaxes);

                let refundAmountBeforeTaxes = memboGo.core.money.subtract(maxAmount, currentAmount);
                if (feeTaxesPercentage === 0 || feeTaxes === 0) {
                    selector2.val(refundAmountBeforeTaxes);
                } else {
                    selector2.val(memboGo.core.money.subtract(refundAmountBeforeTaxes, feeTaxes));
                }
            }

            if (feeTaxesPercentage) {
                $(document).on('change.initModalCancel', '#cancellation-fee', function () {
                    updateRefundFeeAmountWithTaxes(maxAmount, $(this), $('#cancellation-refund-amount'), feeTaxesPercentage);
                });

                // Trigger once on load
                $('#cancellation-fee').trigger('change');
            } else {
                $(document).on('change.initModalCancel', '#cancellation-fee', function () {
                    updateRefundFeeAmount(maxAmount, $(this), $('#cancellation-refund-amount'));
                });

                $(document).on('change.initModalCancel', '#cancellation-refund-amount', function () {
                    updateRefundFeeAmount(maxAmount, $(this), $('#cancellation-fee'));
                });
            }
        }

        if ($('#global-modal-cancel input[name="cancel_with_refund"]:checked')) {
            $('#global-modal-cancel input[name="cancel_with_refund"]').trigger('change');
        }
    },
    unbind: function () {
        let self = this;

        if ($('#global-modal-cancel').length) {
            // Unbind all event that are not on document
            $('#global-modal-cancel').find('*').off();
            // Unbind all event on document with the specified namespace
            $(document).off('.initModalCancel');
        }
    },
    open: function (preCancelUrl, cancelUrl, itemId) {
        let self = this;
        let modalCancel = new HPJUtils.modal('#modal-cancel');

        // Display the cancellation form
        $.get({
            url: preCancelUrl,
            dataType: 'json',
            beforeSend: function () {
                HPJUtils.displayLoadingBox();
                self.unbind();
            },
            success: function (data) {
                let mesgWrapper = $('#message_box').html('');
                if (data.error) {
                    mesgWrapper.html(data.mesg);
                    $('html, body').animate({
                        scrollTop: $('body').offset().top
                    });
                    return false;
                }

                modalCancel.setContent(data.mesg);
                if ($('#cancel_table').length) {
                    $('#cancel_table').trigger('change');
                }

                if (typeof $('#global-modal-cancel input[name="cancel_with_refund"]:checked').val() === 'undefined') {
                    $('#modal-cancel .modal-yes').prop('disabled', true);
                }

                // Replace the placeholder on the warning message
                if ($('#global-modal-cancel .priority-messages #label-modal-yes')) {
                    $('#global-modal-cancel .priority-messages #label-modal-yes').html($('#modal-cancel .modal-yes').html());
                }

                if (typeof data.cancelUrl !== 'undefined') {
                    cancelUrl = data.cancelUrl;
                }

                modalCancel.open();
            },
            complete: function () {
                self.init();
                $('.datePicker').datepicker();
                HPJUtils.hideLoadingBox();
            }
        });

        // Submit the cancellation form
        modalCancel.setAction('.modal-yes', function () {
            $.post({
                url: cancelUrl,
                data: {
                    'itemId': itemId,
                    'cancelWithRefund': $('#global-modal-cancel input[name="cancel_with_refund"]:checked').val() || null,
                    'cancelWithoutRefundChoice': $('#global-modal-cancel input[name="cancel_without_refund_choice"]:checked').val(),
                    'date': $('#cancellation-date').val() || null,
                    'fee': $('#cancellation-fee').not(':disabled').val() || 0,
                    'refundAmount': $('#cancellation-refund-amount').not(':disabled').val() || 0,
                    'allowAutoRefund': $('#cancellation-allow-auto-refund').val() || 0,
                    'tableCancel': $('#cancel_table').length > 0 && $('#cancel_table').prop('checked'),
                },
                dataType: 'json',
                beforeSend: function () {
                    HPJUtils.displayLoadingBox();
                },
                success: function (data) {
                    if (data.error) {
                        let contentWrapper = modalCancel.getContentWrapper();
                        $('.priority-messages', contentWrapper).remove();
                        contentWrapper.prepend(data.error);
                    } else {
                        location.reload();
                        modalCancel.close();
                    }
                },
                complete: function () {
                    HPJUtils.hideLoadingBox();
                }
            });
        });
    }
};

// Front end utils functions
memboGo.core.utils = {
    elementIsOutOfViewport: function (elem) {
        // Get element's bounding
        var bounding = elem.getBoundingClientRect();

        // Check if it's out of the viewport on each side
        var out = {};
        out.top = bounding.top < 0;
        out.left = bounding.left < 0;
        out.bottom = bounding.bottom > document.documentElement.clientHeight;
        out.right = bounding.right > document.documentElement.clientWidth;
        out.any = out.top || out.left || out.bottom || out.right;
        out.all = out.top && out.left && out.bottom && out.right;

        return out;
    }
};

memboGo.core.tracking = function (events) {
    window.addEventListener("load", function () {
        window.dataLayer = window.dataLayer || [];
        if (events) {
            for (i in events) {
                memboGo.core.trackEvent(events[i]);
            }
        }
    });
};

memboGo.core.trackEvent = function (event) {
    if (typeof event !== 'object') {
        event = {event: event};
    }
    // Amplitude/VueJS
    document.dispatchEvent(new CustomEvent('track', {detail: event}));

    // GTM
    if (typeof window.dataLayer !== 'undefined') {
        window.dataLayer.push(event);
    }
};

memboGo.core.downloadDynFile = function (url, errorCallback) {
    HPJUtils.displayLoadingBox();

    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);

    xhr.responseType = "blob";

    xhr.onloadend = function (e) {
        if (xhr.status === 200) {
            if (!!document.documentMode) {
                window.navigator.msSaveBlob(xhr.response, xhr.getResponseHeader('Content-Filename'));
            } else {
                var a = document.createElement('a');
                a.href = window.URL.createObjectURL(xhr.response);
                a.download = xhr.getResponseHeader('Content-Filename');
                document.body.append(a);
                a.click();
                a.remove();
            }
        } else {
            try {
                var u = window.URL.createObjectURL(xhr.response), x = new XMLHttpRequest();
                x.open('GET', u, false);
                x.send();
                window.URL.revokeObjectURL(u);
                if (typeof errorCallback === 'function') {
                    errorCallback(x.responseText);
                }
            } catch (e) {
                memboGo.core.dispatchException(e);
            }
        }
        HPJUtils.hideLoadingBox();
    };

    xhr.send();
};

memboGo.core.URLSearchQuery = {
    init: function () {
        addEventListener('popstate', this.onHistoryStateChange.bind(this));
    },
    onHistoryStateChange: function (event) {
        if (event.state && event.state.reload) {
            window.location.reload();
        }
    },
    updateQueryParameters: function (container, tab) {
        const searchForm = new FormData(container.find('form:visible')[0]);
        if (tab) {
            searchForm.set('activetab', tab.data('item'));
        } else {
            searchForm.delete('activetab');
        }
        searchForm.delete('search_type');
        this.searchFormQueryParameters(container, searchForm, 'filter');
    },
    searchFormQueryParameters: function (container, searchForm, filterKey) {
        const zoneParameter = container.closest('[data-zone-id]').data('zone-id');

        searchForm.delete(zoneParameter + '_' + window.pageId);

        const newUrl = this.getSearchQueryParameters(searchForm, filterKey);

        window.history.pushState({reload: true}, '', newUrl);
    },
    getSearchQueryParameters: function (formData, filterKey) {
        let filter = {};
        /* eslint-disable-next-line */ // Handled by formdata-polyfill
        for (let entry of formData.entries()) {
            let key = entry[0];
            const value = entry[1];
            if (!value) continue;

            const encodedValue = encodeURIComponent(value);
            const arraySymbolPos = key.indexOf('[]');
            if (arraySymbolPos !== -1) {
                key = key.substring(0, arraySymbolPos);
            }

            if (typeof filter[key] === 'undefined' && encodedValue) {
                filter[key] = (arraySymbolPos !== -1) ? [encodedValue] : encodedValue;
            } else if (Array.isArray(filter[key]) && encodedValue) {
                filter[key].push(encodedValue);
            }
        }
        let query = "?";
        for (let paramKey in filter) {
            if (Array.isArray(filter[paramKey])) {
                query += filterKey + '[' + paramKey + ']=' + filter[paramKey].join(',') + '&';
            } else {
                query += filterKey + '[' + paramKey + ']=' + filter[paramKey] + '&';
            }
        }
        return window.location.origin + window.location.pathname + query.slice(0, query.length - 1);
    },
};

memboGo.core.captcha = {
    scriptTag: null,
    init: function () {
        if (!document.querySelectorAll('.g-recaptcha').length) {
            return;
        }

        if (typeof this.scriptTag === 'object' && document.body.contains(this.scriptTag)) {
            document.body.removeChild(this.scriptTag);
        }

        this.scriptTag = document.createElement('script');

        this.scriptTag.src = "https://www.google.com/recaptcha/api.js";

        document.body.appendChild(this.scriptTag);
    },
    submit: function (token) {
        let form = null;
        let btn;

        $('[name="g-recaptcha-response"]').each(function (i, elem) {
            if ($(elem).val() === token) {
                form = $(elem).closest('form');
                btn = $(elem).closest('.grecaptcha-badge').parent().next('button');
            }
        });

        if (form) {
            $(form).find('.g-recaptcha-response').val(token);

            if (form.find('[data-is-payment]').data('is-payment') === '1') {
                HPJPaymentCms.validateAction(btn);
            } else {
                $(form).submit();
            }
        }
    }
};

memboGo.core.csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': memboGo.core.csrf()
    }
});

document.addEventListener('DOMContentLoaded', () => {
    memboGo.core.captcha.init();
    document.querySelectorAll('.click-loader')
        .forEach(el => el.addEventListener('click', () => HPJUtils.displayLoadingBox()));
});

/** The data-callback on the button requires the function to be in the global scope */
window.submitCaptcha = memboGo.core.captcha.submit;