var currentPage = 1;
$(document)
    .ready(function () {
        initPaginationForm();
    })
    .off('click', '.paginationControl span,.paginationControl a')
    .on('click', '.paginationControl span,.paginationControl a', function (e) {
        e.preventDefault();
        var self = this,
            pageControl = $(self).closest('.paginationControl'),
            url = '';

        try {
            if (pageControl.attr('action').length) {
                url = decodeURI(pageControl.attr('action'));
            }
        } catch (e) {
            if (typeof (paginationAction) != "undefined") {
                url = paginationAction.split('#')[0].replace(/^\/*|\/*$/gm, '');
            }
        }
        if (!url.length || $(this).hasClass('disabled')) {
            return;
        }

        let last = parseInt(pageControl.find('.last').attr('id')),
            data = new FormData();
        if (last < currentPage) currentPage = last;
        if ($(self).hasClass('first')) {
            currentPage = 1;
        } else if ($(self).hasClass('previous')) {
            currentPage = parseInt(currentPage) - 1;
        } else if ($(self).hasClass('next')) {
            currentPage = parseInt(currentPage) + 1;
        } else if ($(self).hasClass('last')) {
            currentPage = last;
        } else {
            currentPage = jQuery.trim($(self).html());
        }

        if (currentPage === '...' && self.dataset.page !== undefined) {
            currentPage = self.dataset.page;
        }

        if (pageControl.is('form')) {
            if (pageControl.find('[name=pageNumber]').length) {
                pageControl.find('[name=pageNumber]').val(currentPage);
                currentPage = null;
            }
            data = new FormData(pageControl[0]);
        }

        try {
            const props = JSON.parse(pageControl.get(0)?.dataset?.props || '{}');
            Object.keys(props).forEach(key => {
                if (key === 'pageNumber') {
                    props[key] = currentPage;
                    currentPage = null;
                }
                data.append(key, props[key]);
            });
        } catch (e) {
                console.error('Invalid paging data');
        }

        // Add Zone Id Only CMS Context
        if ($(self).closest('[data-zone-id]').length) {
            data.append('zoneId', $(self).closest('[data-zone-id]').data('zone-id'));
        }
        // If url has get elements
        if (url.indexOf('?') > 0) {
            var r = /[?&]([^=#]+)=([^&#]*)/g, match = null;
            // eslint-disable-next-line no-cond-assign
            while (match = r.exec(url)) {
                data.append(match[1], match[2]);
            }
            url = url.split('?')[0];
        }

        if (currentPage !== null) {
            url += '/pageNumber/' + currentPage;
        }
        var pathname = window.location.pathname, parts = pathname.split("/");
        for (var i = 0; i < parts.length; i++) {
            if (parts[i] === 'sort' || parts[i] === 'order' || parts[i] === 'col') {
                url += '/' + parts[i] + '/' + parts[++i];
            }
        }

        $.ajax({
            url: baseUrl + url,
            type: 'GET',
            // NOTE: definitely not compatible with IE11
            data: new URLSearchParams(data).toString(), // eslint-disable-line compat/compat
            cache: false,
            dataType: 'html',
            beforeSend: function () {
                displayLoadingBox();
            },
            complete: function () {
                hideLoadingBox();
            },
            success: function (data) {
                if (data != '') {
                    var _p = $(self).closest('.site_line__item');
                    tableId = $(self).closest('table').attr('id');
                    dispatch = $(self).closest('.paginationControl').data('dispatch');
                    $(self).closest('.list-result-wrapper').after(data).remove();
                    if (typeof dispatch !== 'undefined') {
                        memboGo.core.event.dispatch(dispatch, {element: '#' + tableId});
                    }
                    if (_p.length) {
                        $('html, body').animate({scrollTop: _p.offset().top}, 100);
                    }
                }
            }
        });
    });

function initPaginationForm() {
    if (typeof (paginationAction) != "undefined"
        || typeof (paginationFilterId) == "undefined"
        || !paginationFilterId.length
        || !$('#' + paginationFilterId).length
        || $('#' + paginationFilterId).is('form')) return;
    $('#' + paginationFilterId).find('[type=button]').each(function () {
        $(this).click(function () {
            var url = baseUrl + paginationAction + '/page/' + currentPage + '?' + $('#' + paginationFilterId).serialize();
            $.ajax({
                url: url, type: 'GET', cache: false, dataType: 'html',
                beforeSend: function () {
                    displayLoadingBox();
                }, complete: function () {
                    hideLoadingBox();
                },
                success: function (data) {
                    if (data != '' && typeof (paginationListId) != "undefined" && $('#' + paginationListId)) {
                        $('#' + paginationListId).html(data);
                    }
                }
            });
        });
    });
}