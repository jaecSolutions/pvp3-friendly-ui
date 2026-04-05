if (typeof memboGo === 'undefined') {
    var memboGo = {};
}

if (typeof memboGo.Donation === 'undefined') {
    memboGo.Donation = {};
}

memboGo.Donation.newParticipant = {
    campaignId: null,
    teamId: null,
    init: function (campaignId, teamId) {
        this.campaignId = campaignId;
        this.teamId = teamId;
        var self = this;
        $(document)
            .on('click', '[data-go-step]', function (e) {
                e.preventDefault();
                $('.js-participant-add-message').empty();
                var goStep = $(this).data('go-step'),
                    _p = $(this).closest('.js-participant-add-box');
                if (goStep === 'forward' && _p.find('.p2p--participant--wizard li.active').data('step') === 'summary') {
                    goStep = 'submit';
                }
                if (goStep === 'back') {
                    self.back(_p);
                } else if (goStep === 'submit') {
                    HPJUtils.displayLoadingBox();
                    _p.find('.p2p--participant--add > form').submit();
                } else {
                    self.next(_p);
                }
            })
            .ready(function () {
                $('.js-participant-add-box').each(function () {
                    self.step($(this).find('.p2p--participant--wizard li.active').data('step'), $(this))
                });
            });
    },
    back: function (element) {
        var self = this;
        $.ajax({
            url: '/' + language + '/method/ajax-participant-back/id/donation/',
            data: {campaignId: this.campaignId, teamId: this.teamId},
            type: 'GET',
            dataType: "json",
            beforeSend: function () {
                HPJUtils.displayLoadingBox();
            },
            success: function (data) {
                if (typeof data.reload !== 'undefined') {
                    window.location = window.location.href;
                    return;
                }
                self.step(data.step, element);
                element.find('.p2p--participant--add').html(data.html);
                HPJForm.afterLoad();
                HPJUtils.hideLoadingBox();
            },
            error: function () {
                HPJUtils.hideLoadingBox();
            }
        });
    },
    next: function (element) {
        var self = this, form = new FormData(element.find('.p2p--participant--add form')[0]);
        form.append('campaignId', this.campaignId);
        form.append('teamId', this.teamId);
        $.ajax({
            url: '/' + language + '/method/ajax-participant-next/id/donation/',
            data: form,
            type: 'POST',
            async: true,
            cache: false,
            dataType: "json",
            processData: false,
            contentType: false,
            beforeSend: function () {
                HPJUtils.displayLoadingBox();
            },
            success: function (data) {
                if (data.html === 'reload') {
                    window.location.reload();
                    return;
                }
                self.step(data.step, element);
                element.find('.p2p--participant--add').html(data.html);
                if (data.message) {
                    element.find('.js-participant-add-message').html(data.message);
                }
                HPJForm.afterLoad();
            },
            complete: function () {
                HPJUtils.hideLoadingBox();
            }
        });
    },
    step: function (step, element) {
        memboGo.core.cmsFormStep.reset();
        memboGo.core.cmsFormStep.addStep(step);
        var wizard = element.find('.p2p--participant--wizard');
        wizard.find('li').removeClass('active');
        wizard.find('li[data-step="' + step + '"]').addClass('active');
        element.find('[data-go-step]').show();
        if (wizard.find('li.active').data('step') === 'confirmation') {
            element.find('.form-withProgress__navigation-footer').remove();
        } else {
            if (wizard.find('li').index(wizard.find('li.active')) < 1) {
                element.find('[data-go-step="back"]').hide();
            }
            if (wizard.find('li.active').data('step') !== 'payment') {
                element.find('[data-go-step="submit"]').hide();
            } else {
                element.find('[data-go-step="forward"]').hide();
            }
        }
    }
};

memboGo.Donation.SelectMode = {
    init: function () {
        $(document)
            .on('change', '[name="campaign_id"]', function () {
                $('.campaign-actions')[!isNaN(parseInt($(this).val())) ? 'show' : 'hide']();
            })
            .on('click', '[data-donation-select-mode]', function (e) {
                e.preventDefault();
                var campagnId = $(this).closest('.campaigns').find('select[name="campaign_id"]').val();
                if (isNaN(parseInt(campagnId))) {
                    return;
                }
                var url = $(this).attr('href');
                HPJUtils.displayLoadingBox();
                $.ajax({
                    type: 'GET',
                    cache: false,
                    data: {campaignId: campagnId},
                    url: '/' + language + '/method/ajax-campaign-url/name/donation/',
                    dataType: "json",
                    success: function (data) {
                        if (data.success) {
                            window.location.href = url + data.redirect;
                        } else {
                            HPJUtils.hideLoadingBox();
                        }
                    },
                    error: function () {
                        HPJUtils.hideLoadingBox();
                    }
                });
            })
            .ready(function () {
                $('[name="campaign_id"]').trigger('change');
            });
    }
}

memboGo.Donation.Creation = {
    tracking: {},
    trackingMode: '',
    init: function (step) {
        var self = this;
        memboGo.core.cmsFormStep.reset();
        memboGo.core.cmsFormStep.addStep(step);
        this.trackingPush(step);
        $(document)
            .on('change', '.form-donation__info-step input[type="radio"]', function () {
                $(this).closest('fieldset').find('label').removeClass('radio-active');
                $(this).closest('label').addClass('radio-active');
            })
            .on('change', 'input[name^="donation_choice_id"][type="radio"]', function (e) {
                if (this.value !== 'other') {
                    var id = 'custom_amount';
                    if (this.getAttribute('name') === 'donation_choice_idrecurrent') {
                        id = 'custom_amountrecurrent';
                    }
                    document.getElementById(id).value = '';
                    document.getElementById(id).setAttribute('data-custom-amount', '');
                }
            })
            .on('click', '.form-element-custom_amountrecurrent,.form-element-custom_amount', function () {
                $(this).parent('.card-body').find('input[name^="donation_choice_id"][value="other"]').trigger('click');
            })
            .on('change', '[name="recurrent"]', function () {
                $('#fieldset-AmountInfosrecurrent,#fieldset-AmountInfos').hide();
                if ($(this).val() == 'monthly') {
                    $('#fieldset-AmountInfosrecurrent').show();
                } else {
                    $('#fieldset-AmountInfos').show();
                }
            })
            .ready(function () {
                $('input[name^="donation_choice_id"][type="radio"]:checked').trigger('change');
                $('.form-donation__info-step')
                    .find('input[type="radio"]:checked')
                    .closest('label')
                    .addClass('radio-active');
                if ($('[name="recurrent"]').length) {
                    $('#custom_amountrecurrent,#custom_amount').closest('fieldset').val('');
                    $('[name="recurrent"]:checked').trigger('change');
                }
                $(document)
                    .on('change', '.single-page-donation-wrapper .form-donation__info-step input', function () {
                        if (this.hasAttribute('data-custom-amount')) {
                            if (!this.value.match(/^\d+(\.\d*)?$/)) {
                                this.value = this.getAttribute('data-custom-amount');
                                return;
                            }
                            this.setAttribute('data-custom-amount', this.value);
                        }
                        memboGo.Donation.SingleMode.donationInfo(this);
                    })
                    .on('change', '.single-page-donation-wrapper .form-donation__info-step select', function () {
                        self.showDescription(this);
                        memboGo.Donation.SingleMode.donationInfo(this);
                    });

                $('.form-donation__info-step select').each(function () {
                    self.showDescription(this);
                });
            });
    },
    showDescription: function (that) {
        var value = parseInt(that.value);
        $(that).closest('.form-donation__info-step')
            .find('.donation-type-description')
            .hide()
            .find('[data-list-id]')
            .each(function () {
                if ($(this).data('list-id') === value) {
                    $(this).show().closest('.donation-type-description').show();
                } else {
                    $(this).hide();
                }
            });
    },
    trackingPush: function (step) {
        if (typeof this.tracking[step] !== 'undefined') {
            let trackData = {'event': this.tracking[step], 'mode': this.trackingMode}
            if (step === 'payment') {
                trackData.fee_type = document.getElementsByClassName('js-tip-edit') ? 'tip' : 'commission';
            }
            memboGo.core.trackEvent(trackData);
            // Remove from tracking list to prevent double send
            delete (this.tracking[step]);
        }
    }
}

memboGo.Donation.SingleMode = {
    donorFormReplace: false,
    init: function (step) {
        var self = this;
        memboGo.Donation.Creation.init(step);
        $(document)
            .on('click', '.single-page-donation-wrapper #validate,.single-page-donation-wrapper #external_payment', function (e) {
                if (typeof $(this).data('lock') !== 'undefined' && $(this).data('lock') === 1) {
                    self.changeDonationInfo(this, 1);
                }
            })
            .on('change', '.form-donor-infos-step input,.form-donor-infos-step select', function () {
                if (!self.donorFormReplace) {
                    memboGo.Donation.Creation.trackingPush('donor_infos');
                }
            })
            .ready(function () {
                $('input[name^="donation_choice_id"][value="other"]').closest('label').hide();
                $('.single-page-donation-wrapper')
                    .each(function () {
                        $(this).find('.donation-footer-frame').find('#validate,#external_payment').data('lock', 1);
                        self.lock($(this).closest('.single-page-donation-wrapper'), $(this).find('lock').length);
                        $(this).find('lock').remove();
                    });
            });
    },
    donationInfo: function (that) {
        var _p = $(that).closest('.single-page-donation-wrapper');
        if (_p.find('input[name^="donation_choice_id"]:checked:visible').length
            || !isNaN(parseFloat(_p.find('input[name^="custom_amount"]:visible').val()))
            || that.name === 'recurrent'
        ) {
            this.changeDonationInfo(that, 0);
        }
    },
    changeDonationInfo: function (that, validate) {
        var self = this,
            _p = $(that).closest('.single-page-donation-wrapper');
        $.ajax({
            url: '/' + language + '/method/ajax-registration-donation-info/name/donation/?campaignId=' + _p.data('campaign-id'),
            type: 'POST',
            async: true,
            cache: false,
            data: self.prepareDataToSend(_p.get(0), validate),
            dataType: "html",
            processData: false,
            contentType: false,
            beforeSend: function () {
                HPJUtils.displayLoadingBox();
            },
            success: function (html) {
                var tmp = $('<div />').html(html), error = false;

                const csrf = tmp.get(0).querySelector('input[name="csrf_token"]');
                if (csrf) {
                    const _p_csrf = _p.get(0).querySelector('input[name="csrf_token"]');
                    if (!_p_csrf) {
                        window.location.reload();
                    }
                    _p_csrf.value = csrf.value;
                }

                if (tmp.find('.form-donation__info-step').find('li').length) {
                    tmp.find('.form-donation__info-step').find('li').each(function () {
                        if (validate) {
                            _p.find('.form-donation__info-step .' + $(this).attr('class')).addClass('has-error').append(
                                '<ul class="error"><li class="text-danger">' + $(this).text() + '</li></ul>'
                            );
                        } else {
                            _p.find('.form-donation__info-step .' + $(this).attr('class')).addClass('has-error');
                        }
                    });
                    error = true;
                }

                self.lock(_p, error);


                tmp.find('.payment-fieldsets fieldset').each(function () {
                    _p.find('#' + this.id).replaceWith(tmp.find('#' + this.id));
                });

                if (!tmp.find('.billing-auto-fill-address-wrapper').length) {
                    _p.find('.billing-auto-fill-address-wrapper').remove();
                    _p.find('.payment-billing .row').show();
                } else if (!_p.find('.billing-auto-fill-address-wrapper').length) {
                    _p.find('.payment-billing h2').after(tmp.find('.billing-auto-fill-address-wrapper'));
                    _p.find('#billing_auto_fill_address').trigger('change');
                }

                if (tmp.find('.form-donor-infos-step').length) {
                    self.donorFormReplace = true;
                    _p.find('.form-donor-infos-step').replaceWith(tmp.find('.form-donor-infos-step'));
                    HPJForm.afterLoad(_p.find('.form-donor-infos-step'));
                    _p.find('.select-country').trigger('change');
                    self.donorFormReplace = false;
                }

                if (tmp.find('.alert').length) {
                    _p.find('.donation-zone').before(tmp.find('.alert'));
                    error = true;
                }

                HPJUtils.hideLoadingBox();

                $('input[name="payment_method"]:checked, input[name="payment_method"][type="hidden"]').trigger('change');

                if (validate && !error) {
                    memboGo.Donation.Creation.trackingPush('payment');
                    $(that).data('lock', 0).trigger('click');
                }

                if (error) {
                    // Focus over first error
                    self.focusOverFirstError();
                }
            },
            error: function () {
                HPJUtils.hideLoadingBox();

                // Focus over first error
                self.focusOverFirstError();
            }
        });
    },
    prepareDataToSend: function (that, validate) {
        if (validate) {
            memboGo.Donation.Creation.trackingPush('donor_infos');
        }
        memboGo.core.ckeditor.prepareData();
        var data = new FormData(that.querySelector('.form-donor-infos-step')),
            donationForm = new FormData(that.querySelector('.form-donation__info-step'));
        data.append('_donation_infos_', JSON.stringify(Object.fromEntries(donationForm))); // eslint-disable-line
        data.append('_validate_', validate);
        data.append('_payment_data_', JSON.stringify({
            'payment_method': that.querySelector('input[name="payment_method"]:checked')
                ? that.querySelector('input[name="payment_method"]:checked').value
                : null,
            'tip_amount': that.querySelector('#tip_amount')
                ? that.querySelector('#tip_amount').value
                : null
        }));
        $(that).find('.alert').remove();
        $(that).find('.form-donation__info-step').find('.has-error').removeClass('has-error');
        $(that).find('.form-donation__info-step').find('.error').remove();
        return data;
    },
    lock: function (that, locked) {
        if (locked) {
            that.find('.donation-step').not(':first').append('<div class="donataion-step-locked"></div>');
        } else {
            that.find('.donataion-step-locked').remove();
        }
    },
    focusOverFirstError: function () {
        let divsWithError = document.getElementsByClassName("has-error");
        if (divsWithError && divsWithError.length > 0) {
            let firstInput = divsWithError[0].getElementsByTagName("input")[0];
            if (firstInput) {
                firstInput.focus();
            }
        }
    }
}

memboGo.Donation.ParticipantLoadMore = {
    locked: false,
    cols: 1,
    init: function (cols) {
        var self = this;
        this.cols = parseInt(cols);
        if (isNaN(this.cols)) {
            this.cols = 1;
        }
        $(document)
            .on('click', '#campaign-tabs a.nav-link', function () {
                window.location.href = $(this).attr('href') === '#tab-campaign-teams' ? '#teams' : '#participants';
                if ($($(this).attr('href')).length) {
                    self.loadResult('GET', $($(this).attr('href')));
                }
            })
            .on('click', '.load-more-donation-participants', function () {
                self.loadResult('GET', $(this).closest('[data-url]'));
            })
            .ready(function () {
                // Set active tab and triggers the first click.
                var anchor = window.location.href.split('#')[1] || null;
                if ($('#tab-campaign-' + anchor).length) {
                    $('a[href="#tab-campaign-' + anchor + '"]').trigger('click');
                } else {
                    $('#campaign-tabs li.active a').first().trigger('click');
                }

                // Scrolls
                $(document).scroll(function () {
                    var block = $($('#campaign-tabs li.active>a').attr('href')),
                        lastRow = block.find('.row').last();
                    if (lastRow.length
                        && ($(window).scrollTop() + $(window).height()) > (lastRow.offset().top + lastRow.outerHeight())
                    ) {
                        self.loadResult('GET', block);
                    }
                });
            })
    },
    loadResult: function (type, block) {
        if (this.locked || !block.find('.load-more-donation-participants').length) {
            return;
        }
        this.locked = true;
        var self = this;
        $.ajax({
            type: type,
            async: "false",
            url: block.data('url'),
            dataType: "html",
            data: {
                start: block.find('.row .item').length
            },
            beforeSend: function () {
                HPJUtils.displayLoadingBox();
            },
            success: function (data) {
                block.find('.load-more-donation-participants').remove();
                data = (new DOMParser()).parseFromString(data, 'text/html');
                if (!data.getElementsByTagName('DIV').length) {
                    return;
                }
                var items = data.getElementsByClassName('item-box'), i = 0,
                    row = document.createElement("DIV");
                row.classList.add('row');

                for (; i < items.length; i++) {
                    var last = block.find('.row').last();
                    if (!last.length || last.find('.item-box').length >= self.cols) {
                        block.append(row.outerHTML);
                    }
                    block.find('.row').last().append(items[i].outerHTML);
                }
                if (data.getElementsByClassName('load-more-donation-participants').length) {
                    block.append(data.getElementsByClassName('load-more-donation-participants')[0].outerHTML);
                }
            },
            complete: function () {
                HPJUtils.hideLoadingBox();
                self.locked = false;
            }
        });
    },
};

memboGo.Donation.myDonations = {
    tabId: null,
    activeTab: null,
    currentUrl: null,
    init: function (currentUrl) {
        const self = this;
        this.currentUrl = currentUrl;
        $(document)
            .off('click', '#my-donations-table-list a')
            .on('click', '#my-donations-table-list a.download', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var previousError = document.getElementsByClassName('alert-danger');
                if (previousError.length) {
                    previousError[0].parentNode.removeChild(previousError[0]);
                }
                self.clearError();
                memboGo.core.downloadDynFile(this.getAttribute('href'), self.showError.bind(this));
            });
        memboGo.Donation.myDonations.initTabs();
    },
    initTabs: function () {
        const self = this;
        const elements = document.querySelectorAll('#my-donations-tabs a');
        this.setActiveTab();

        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener('click', function () {
                window.history.pushState(
                    {reload: true},
                    '',
                    window.location.origin + window.location.pathname + '?activetab=' + this.dataset.activetab
                );
                self.loadTable(this.getAttribute('href').replace('#', ''), this.dataset.activetab);
                requestAnimationFrame(function () {
                    self.setActiveTab();
                });
            });
        }

        this.bindStopRecurrentDonationAction();
    },
    bindStopRecurrentDonationAction: function () {
        const recurrentTab = document.getElementById('my-donations-tab-recurrent');
        if (!recurrentTab) {
            return;
        }

        const self = this;
        const disableDonationBtns = recurrentTab.getElementsByClassName('recurrent-disable');
        const modal = new HPJUtils.modal("#modal-recurrent-disable");

        let currentElement;

        modal.setAction('.modal-yes', function () {
            modal.close();
            HPJUtils.displayLoadingBox();

            const disableDonationRequest = new XMLHttpRequest();

            self.clearError();
            disableDonationRequest.open('POST', self.currentUrl + '/ajax-recurrent-disable/module/donator', true);
            disableDonationRequest.responseType = "json";

            disableDonationRequest.onloadend = function (e) {
                if (disableDonationRequest.status === 200) {
                    self.clearTabContent(self.tabId);
                    self.loadTable(self.tabId, self.activeTab);
                } else {
                    self.showError(disableDonationRequest.response.message);
                    HPJUtils.hideLoadingBox();
                }
            };
            disableDonationRequest.send(JSON.stringify({
                token: currentElement.dataset.token,
                id: currentElement.dataset.id
            }));
        });

        for (let i = 0; i < disableDonationBtns.length; i++) {
            disableDonationBtns[i].addEventListener('click', function (e) {
                e.preventDefault();
                currentElement = this;
                modal.open();
            });
        }
    },
    clearTabContent: function (tabId) {
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
            tabContent.innerHTML = '';
            tabContent.dataset.loadtable = '0';
        }
    },
    setActiveTab: function () {
        this.tabId = document.querySelector('#my-donations-list-container .tab-pane.active').id || null;
        this.activeTab = document.querySelector('#my-donations-list-container .nav-item.active a').getAttribute('data-activetab') || null;
    },
    loadTable: function (tabId, activeTab) {
        const tabContent = document.getElementById(tabId);

        if (tabContent.dataset.loadtable === '1') {
            return;
        }

        tabContent.dataset.loadtable = '1';
        HPJUtils.displayLoadingBox();

        const self = this;
        const tableDataRequest = new XMLHttpRequest();

        self.clearError();
        tableDataRequest.open('GET', this.currentUrl + '/ajax-donations/module/donator?activetab=' + activeTab, true);
        tableDataRequest.responseType = "text";

        tableDataRequest.onloadend = function (e) {
            if (tableDataRequest.status === 200) {
                const newItem = document.createElement('div');
                newItem.innerHTML = tableDataRequest.responseText;
                tabContent.appendChild(newItem.firstChild);
                self.bindStopRecurrentDonationAction();
            } else {
                self.showError(tableDataRequest.response.message);
            }
            HPJUtils.hideLoadingBox();
        };

        tableDataRequest.send();
    },
    clearError: function () {
        if (document.getElementById('my-donations-error-box')) {
            document.getElementById('my-donations-error-box').remove();
        }
    },
    showError: function (message) {
        const errorElement = document.createElement('div');
        errorElement.id = 'my-donations-error-box';
        errorElement.classList.add('alert', 'alert-danger', 'error');
        errorElement.innerHTML = message;
        document.getElementById('my-donations-list-container')
            .parentNode
            .insertBefore(errorElement, document.getElementById('my-donations-list-container'));
    }
};