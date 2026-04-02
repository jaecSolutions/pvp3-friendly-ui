if (typeof memboGo === "undefined") {
    var memboGo = {};
}
if (typeof memboGo.event === "undefined") {
    memboGo.event = {};
}

// Event Subscription
memboGo.event.registration = {
    params: {
        element: "#modal-event-add",
        eventId: null,
    },
    searchHTML: null,
    contacts: {},
    modal: "",
    message: null,
    priceId: null,
    sId: null,
    pId: null,
    priceRate: {},
    init: function (eventId, priceRate) {
        var self = this;
        this.priceRate = priceRate;
        memboGo.core.cmsFormStep.addStep("register");
        self.params.eventId = eventId;
        $(document)
            .off("click", "[data-event-registration]")
            .off("click", ".js-event-registration-delete")
            .off("click", ".edit-rate-participant")
            .off("click", ".js-event-registration-validate")

            .on("click", "[data-event-registration]", function (e) {
                e.preventDefault();
                self.priceId = $(this).closest("[data-price-id]").data("price-id");
                self.sId = self.pId = null;
                self.add();
            })
            .on("click", ".edit-rate-participant", function (e) {
                e.preventDefault();
                self.priceId = $(this).closest("[data-price-id]").data("price-id");
                self.sId = $(this).closest("tr").data("subscription");
                self.pId = $(this).closest("tr").data("participant");
                self.add();
            })
            .on("click", ".js-event-registration-delete,.remove-rate-participant", function (e) {
                e.preventDefault();
                if (!self.hasProcessBeforeDelete(this)) {
                    self.deleteSubscription(this);
                }
            })
            .on("click", ".js-event-registration-validate", function (e) {
                e.preventDefault();
                self.validate(this);
            })
            .on("change", '[name="subscriptions_quantity"]', function () {
                if (typeof $(this).data("place") !== "undefined") {
                    if ($(this).data("place") < $(this).val()) {
                        $(this).val($(this).data("place"));
                    }
                }
            })
            .ready(function () {
                self.initSearch();
                self.modal = new HPJUtils.modal(self.params.element);
                self.modal.setAction(".modal-yes", function () {
                    if ($(self.params.element).find("#add_event_responsible").length) {
                        self.responsible.add("POST");
                    } else {
                        self.add("POST");
                    }
                });
                memboGo.core.event.listen("mgo-event-registration-change-list", self.priceList);
                $(".registration-event-bloc").each(function () {
                    self.calculatePlace(this);
                });
                memboGo.core.event.dispatch("mgo-event-registration-change-list");
            });
        memboGo.event.registration.responsible.init();
        self.quantity();
    },
    add: function (type) {
        var self = this,
            params = {
                url: "/" + language + "/method/ajax-subscription-edit/name/event/",
                cache: false,
                dataType: "html",
                beforeSend: function () {
                    HPJUtils.displayLoadingBox();
                },
                success: function (data) {
                    var element = '.form-edition[data-price-id="' + self.priceId + '"]';
                    if (data.indexOf("{") === 0) {
                        data = JSON.parse(data);
                    }
                    if (typeof data === "string") {
                        self.openModal(data, true);
                        if (/error-form-email-missed/.test(data)) {
                            self.modal.getElement().find(".modal-footer").hide();
                        }
                    } else {
                        self.setMessage(data);
                        $(element).find(".wrap-registration-price-table").html(data.table);
                        $(element).closest(".registration-event-bloc").find(".btn-add")[data.add ? "show" : "hide"]();
                        self.closeModal();
                    }
                    self.calculatePlace($(element).parents(".registration-event-bloc"));
                    memboGo.core.event.dispatch("mgo-event-registration-change-list");
                },
                complete: function () {
                    HPJUtils.hideLoadingBox();
                    HPJForm.getStates();
                },
            };
        self.alertMessage(false);
        if (type === "POST") {
            var form = $(this.params.element).find("form");
            this.prepareDataCK();
            params.data = new FormData(form.get(0));

            form.find('[type="file"]')
                .closest(".form-group")
                .find(".preview")
                .filter(function () {
                    return $(this).is(":visible");
                })
                .find("img")
                .each(function () {
                    if ($(this).attr("src")) {
                        params.data.append($(this).closest(".form-group").find('[type="file"]').attr("name"), $(this).attr("src"));
                    }
                });

            params.data.append("eventId", this.params.eventId);
            params.data.append("priceId", this.priceId);
            if (self.sId) {
                params.data.append("_sid", self.sId);
                if (self.pId) {
                    params.data.append("_pid", self.pId);
                }
            }
            params.contentType = params.processData = false;
            params.type = "POST";
        } else {
            params.data = {
                eventId: this.params.eventId,
                priceId: this.priceId,
            };
            if (self.sId) {
                params.data._sid = self.sId;
                if (self.pId) {
                    params.data._pid = self.pId;
                }
            }
            params.type = "GET";
        }
        $.ajax(params);
    },
    deleteSubscription: function (that) {
        var self = this;
        HPJUtils.displayLoadingBox();
        $.ajax({
            url: "/" + language + "/method/ajax-subscription-delete/name/event/",
            dataType: "json",
            cache: false,
            data: {
                eventId: this.params.eventId,
                priceId: $(that).closest("[data-price-id]").data("price-id"),
                _sid: $(that).closest("[data-subscription]").data("subscription"),
                _pid: $(that).closest("[data-participant]").data("participant"),
            },
            success: function (data) {
                var _p = $(that).closest(".registration-event-bloc"),
                    a;
                if (typeof data.add !== "undefined") {
                    _p.find(".btn-add")[data.add ? "show" : "hide"]();
                }
                if (typeof data.table !== "undefined") {
                    $(that).closest("[data-price-id]").find(".wrap-registration-price-table").html(data.table);
                }
                if (typeof data.list !== "undefined") {
                    for (a in data.list) {
                        _p.find('[data-subscription="' + a + '"]')
                            .removeAttr("data-subscription")
                            .attr("data-subscription", data.list[a]);
                    }
                }

                self.responsible.showUp(data.responsible);

                self.calculatePlace(_p);

                memboGo.core.event.dispatch("mgo-event-registration-change-list");
            },
            complete: function () {
                HPJUtils.hideLoadingBox();
            },
        });
    },
    hasProcessBeforeDelete: function (that) {
        var self = this,
            subId = $(that).closest("[data-subscription]").data("subscription"),
            pId = $(that).closest("[data-subscription]").data("participant") || "";
        if ($("#modal-event-remove-main").length && subId === 1 && pId === "") {
            var modal = new HPJUtils.modal("#modal-event-remove-main");
            modal.setAction(".modal-yes", function () {
                modal.close();
                self.deleteSubscription(that);
            });
            modal.open();
            return true;
        }
        return false;
    },
    initSearch: function () {
        var element = $(".event-search-member");
        if (element.length) {
            this.searchHTML = element.html();
            element.remove();
        }
    },
    openModal: function (html, showPrice) {
        if (showPrice) {
            html = this.searchHTML + html;
            if (this.priceId !== "free") {
                html =
                    '<div class="participant-event-bloc-title">' +
                    $('[data-price-id="' + this.priceId + '"]')
                        .find(".registration-event-bloc-title")
                        .html() +
                    "</div>" +
                    html;
            }
        }
        this.modal.setContent(html);
        $(this.params.element).find(".modal-dialog").attr("style", "max-width:initial;");
        var form = $(this.params.element).find("form");
        afterFormLoad(form);
        HPJForm.datePicker();
        this.modal.open();
        document.dispatchEvent(new CustomEvent("reload-components"));
        $(this.params.element).find(".modal-body").scrollTop(0);
        if ($(this.params.element).find(".has-error").length) {
            $(this.params.element)
                .find(".modal-body")
                .scrollTop($(this.params.element).find(".has-error").first().offset().top - $(this.params.element).find(".modal-body").offset().top);
        }
        $(form).find(".select-country").trigger("change");

        this.modal.getElement().find(".modal-footer").show();

        this.initContacts();
    },
    initContacts: function () {
        var self = this;
        if (!this.contacts.length) {
            $.ajax({
                url: "/" + language + "/method/ajax-contacts/name/event/",
                dataType: "json",
                data: {
                    eventId: self.params.eventId,
                },
                beforeSend: function () {
                    HPJUtils.displayLoadingBox();
                },
                success: function (data) {
                    self.contacts = data.sort(function (a, b) {
                        if (a.label < b.label) {
                            return -1;
                        }
                        return a.label > b.label ? 1 : 0;
                    });
                },
                complete: function () {
                    HPJUtils.hideLoadingBox();
                },
            });
        }
        var element = self.params.element + " form";
        $(self.params.element + " #search-member")
            .autocomplete({
                minLength: 0,
                appendTo: self.params.element,
                source: function (request, response) {
                    response(
                        $.map(self.contacts, function (item) {
                            var word = item.label + " " + item.email,
                                term = request.term.toLowerCase();
                            if (word.toLowerCase().indexOf(term) !== -1) {
                                return {
                                    id: item.id,
                                    label: item.label,
                                };
                            }
                        })
                    );
                },
                select: function (event, ui) {
                    $.ajax({
                        url: "/" + language + "/method/ajax-contacts/name/event/",
                        dataType: "json",
                        data: {
                            eventId: self.params.eventId,
                            m: ui.item.id,
                        },
                        beforeSend: function () {
                            HPJUtils.displayLoadingBox();
                        },
                        success: function (data) {
                            if (typeof data.id == "undefined" || data.id == null) {
                                return null;
                            }
                            $(element)
                                .each(function () {
                                    $(this)
                                        .find("select,text,input,textarea")
                                        .each(function () {
                                            var name = $(this).attr("name");
                                            if (!name.length || typeof data[name] == "undefined") {
                                                return;
                                            }
                                            $(this).val("");
                                            if (!/^.*\[.*\]$/g.test(data[name]) && typeof data[name] === "string") {
                                                if ($(this).parent().hasClass(".select-state")) {
                                                    $(this).attr("refDefault", data[name]);
                                                } else {
                                                    switch ($(this).get(0).tagName) {
                                                        case "INPUT":
                                                            $(this).val(data[name]);
                                                            break;
                                                        case "TEXT":
                                                        case "TEXTAREA":
                                                            $(this).val(data[name]);
                                                            break;
                                                        case "SELECT":
                                                            $(this).val(data[name]);
                                                            break;
                                                    }
                                                }
                                            }
                                        });
                                })
                                .promise()
                                .done(function () {
                                    $('input[name="member_id"]').val(isNaN(data.id) ? data.id : "");
                                    $(element)
                                        .find(".select-country")
                                        .each(function () {
                                            $(this).trigger("change");
                                        });
                                    try {
                                        for (instance in CKEDITOR.instances) {
                                            CKEDITOR.instances[instance].setData($("#" + instance).val());
                                        }
                                    } catch (e) {}
                                });
                        },
                        complete: function () {
                            HPJUtils.hideLoadingBox();
                        },
                    });
                },
            })
            .focus(function () {
                $(this).autocomplete("search", $(this).val());
            });
    },
    closeModal: function () {
        this.modal.setContent("");
        this.modal.close();
    },
    setMessage: function (data) {
        if (typeof data.message !== "undefined" && data.message !== "" && data.message !== null) {
            this.message = {
                success: data.success,
                message: data.message,
            };
        }
    },
    addMessage: function () {
        this._parentElement.parent().find(".alert-object-message").remove();
        if (this._message !== null) {
            this._parentElement.before(
                $("<div />", { class: "alert alert-object-message alert-" + (this._message.success ? "success" : "danger") }).text(
                    this._message.message
                )
            );
        }
        this._message = null;
        var a = this._parentElement.parent().find(".alert-object-message");
        setTimeout(function () {
            a.remove();
        }, 7000);
    },
    prepareDataCK: function () {
        if (typeof CKEDITOR === "undefined") {
            return;
        }
        try {
            for (ckinstance in CKEDITOR.instances) {
                if (document.getElementById(ckinstance) !== null) {
                    document.getElementById(ckinstance).value = CKEDITOR.instances[ckinstance].getData();
                }
            }
        } catch (e) {}
    },
    priceList: function () {
        var prices = memboGo.event.registration.priceRate;
        $(".registration-event-bloc").each(function () {
            if (typeof prices.limit !== "undefined") {
                var total = 0,
                    a;
                $(this)
                    .find('[data-price-member-only="2"], [data-price-member-only="0"], [data-price-member-only="1"]')
                    .each(function () {
                        if ($(this).hasClass("js-event-price-group")) {
                            total += $(this).find(".price-table-item").length;
                        } else {
                            total += $(this).find(".rate-participant-bloc").length;
                        }
                    });
                var actionMember = "show",
                    actionNoMember = "hide";
                if (total >= prices.limit) {
                    actionMember = "hide";
                    actionNoMember = "show";
                }
                if (typeof prices.member !== "undefined") {
                    for (a in prices.member) {
                        $(this)
                            .find('[data-price-id="' + prices.member[a] + '"] a[data-event-registration="add"]')[actionMember]();
                    }
                }
                if (typeof prices.noMember !== "undefined") {
                    for (a in prices.noMember) {
                        $(this)
                            .find('[data-price-id="' + prices.noMember[a] + '"]')
                            .each(function () {
                                $(this).show();
                                if ($(this).find("[data-subscription]").length) {
                                    $(this).find('a[data-event-registration="add"]')[actionNoMember]();
                                } else {
                                    $(this)[actionNoMember]();
                                }
                            });
                    }
                }
            }
        });
        memboGo.event.registration.syncAddBtn();
    },
    alertMessage: function (message) {
        var bloc = $(".registration-event-bloc");
        bloc.closest(".form-withProgress__wrapper").find(".alert").remove();
        if (message) {
            bloc.closest(".form-withProgress__wrapper").prepend($("<div />", { class: "alert alert-danger error" }).html(message));
        }
    },
    syncAddBtn: function () {
        var first = "show",
            second = "hide",
            _p = $(".registration-event-bloc"),
            element = $(".js-event-registration-validate");

        // Lock next btn
        element.addClass("lock");
        element.attr("title", element.data("title"));

        if ($('.event-bloc-responsible [data-event-responsible="edit"]').length || _p.find("[data-subscription]").length) {
            first = "hide";
            second = "show";
            if (_p.find("[data-subscription]").length) {
                // Unlock next btn
                element.removeClass("lock");
                element.removeAttr("title");
            }
        }
        _p.find('a[data-event-registration="add"]').find("first")[first]();
        _p.find('a[data-event-registration="add"]').find("second")[second]();
        _p.find(".first-participant")[first]();
    },
    calculatePlace: function (that) {
        var self = this,
            canAdd = !$(that).find("[data-subscription]").length || $(that).data("multi");
        $(that)
            .find("[data-price-id]")
            .each(function () {
                var price = $(this);
                if (typeof price.data("place") !== "undefined") {
                    var availablePlace = parseInt(price.data("place"));
                    price.find(".rate-participant-bloc").each(function () {
                        availablePlace -= $(this).data("quantity-per-subscription");
                    });
                    if (availablePlace < price.data("quantity-per-subscription")) {
                        price.find(".subscription-price-full").show();
                        price.find("[data-event-registration]").hide();
                    } else {
                        price.find(".subscription-price-full").hide();
                        price.find("[data-event-registration]")[canAdd ? "show" : "hide"]();
                        if (self.priceId === price.data("price-id")) {
                            $(self.params.element)
                                .find('[name="subscriptions_quantity"]')
                                .each(function () {
                                    if (self.sId !== null) {
                                        availablePlace += price
                                            .find('.rate-participant-bloc[data-subscription="' + self.sId + '"]')
                                            .data("quantity-per-subscription");
                                    }
                                    if (availablePlace > price.data("quantity-per-subscription")) {
                                        $(this).data("place", availablePlace - 1);
                                    } else {
                                        $(this).prop("disabled", true);
                                    }
                                });
                        }
                    }
                }
            });
        self.changeOption();
    },
    validate: function (that) {
        if ($(that).hasClass("lock")) {
            return;
        }
        var self = this,
            _p = $(that).closest(".form-withProgress__wrapper"),
            url = $(that).attr("href");
        $.ajax({
            url: "/" + language + "/method/ajax-subscription-validate/name/event/",
            type: "GET",
            dataType: "json",
            cache: false,
            data: {
                eventId: self.params.eventId,
            },
            beforeSend: function () {
                _p.find(".registration-event-price-error").remove();
                HPJUtils.displayLoadingBox();
                self.alertMessage(false);
            },
            success: function (data) {
                if (!data.result) {
                    HPJUtils.hideLoadingBox();
                    self.alertMessage(data.message);

                    if (typeof data.reload !== "undefined") {
                        HPJUtils.displayLoadingBox();
                        window.location.reload();
                    }

                    $("html,body").animate(
                        {
                            scrollTop: $(".registration-event-bloc").closest(".form-withProgress__wrapper").offset().top,
                        },
                        "fast"
                    );
                    var id;
                    if (typeof data.priceMessage !== "undefined") {
                        for (id in data.priceMessage) {
                            _p.find('[data-price-id="' + id + '"]')
                                .data("place", data.priceMessage[id])
                                .find(".registration-event-bloc-title")
                                .after(
                                    $("<div />", { class: "registration-event-price-error alert alert-danger error" }).html(data.priceMessage[id])
                                );
                        }
                        self.calculatePlace(_p);
                    }
                } else {
                    window.location.href = url;
                }
            },
            error: function () {
                HPJUtils.hideLoadingBox();
            },
        });
    },
    quantity: function () {
        var self = this;
        $(document)
            .on("change", '.wrapper-object-quantity input[type="number"]', function () {
                if (isNaN(parseInt(this.value)) || parseInt(this.value) < 1) {
                    this.value = 1;
                } else if ($(this).data("max") > 0 && $(this).data("max") < this.value) {
                    this.value = $(this).data("max");
                }
                var span = $(this).closest("li").find(".badge>span");
                memboGo.core.money.format = span.text();
                span.text(memboGo.core.money.convert($(this).data("price-value") * this.value));
            })
            .on("change", '#add_event_web [name="options[]"]', self.changeOption);
    },
    changeOption: function () {
        $("#add_event_web .list-group-item").each(function () {
            if ($(this).find('[name="options[]"]').is(":checked")) {
                $(this).find(".wrapper-object-quantity").show();
            } else {
                $(this).find('input[type="number"]').val(1);
                $(this).find(".wrapper-object-quantity").hide();
            }
            $(this).find('input[type="number"]').trigger("change");
        });
    },
};

memboGo.event.registration.responsible = {
    init: function () {
        var self = this;
        $(document)
            .off("click", "[data-event-responsible]")
            .off("change", '[name="_organizer[enable]"],[name="_organizer[fill_member]"],[name="_organizer[subscription]"]')
            .on("click", "[data-event-responsible]", function (e) {
                e.preventDefault();
                if ($(this).data("event-responsible") === "delete") {
                    self.delete();
                } else {
                    self.add();
                }
            })
            .on("change", '[name="_organizer[enable]"],[name="_organizer[fill_member]"],[name="_organizer[subscription]"]', function () {
                self.showForm(this);
                self.getForm();
            })
            .ready(function () {
                self.showUp(null);
            });
    },
    add: function (type, data) {
        var self = memboGo.event.registration,
            that = this,
            params = {
                url: "/" + language + "/method/ajax-responsible-edit/name/event/",
                cache: false,
                dataType: "html",
                beforeSend: function () {
                    HPJUtils.displayLoadingBox();
                },
                success: function (data) {
                    if (data.indexOf("{") === 0) {
                        data = JSON.parse(data);
                    }
                    if (typeof data === "string") {
                        self.openModal(data, false);
                        that.showForm();
                    } else {
                        self.setMessage(data);
                        self.responsible.showUp(data.html);
                        self.closeModal();
                    }
                },
                complete: function () {
                    HPJUtils.hideLoadingBox();
                    HPJForm.getStates();
                },
            };
        if (type === "POST") {
            self.prepareDataCK();
            params.data = new FormData($(self.params.element).find("form").get(0));
            params.data.append("eventId", self.params.eventId);
            params.contentType = params.processData = false;
            params.type = "POST";
        } else {
            data = data ? data : {};
            data.eventId = self.params.eventId;
            params.data = data;
            params.type = "GET";
        }
        self.alertMessage(false);
        $.ajax(params);
    },
    showUp: function (html) {
        if (html !== null) {
            $(".event-bloc-responsible").html(html);
        }
        memboGo.event.registration.syncAddBtn();
    },
    showForm: function () {
        const value = $('[name="_organizer[enable]"]:checked').val();
        $(".wrapper-responsible-participate,.wrapper-responsible-not-participate").hide();
        if (value === "2") {
            $(".wrapper-responsible-not-participate").show();
        }
        if (value === "1") {
            $(".wrapper-responsible-participate").show();
        }
    },
    getForm: function () {
        var data = {
            _organizer: {
                enable: $('[name="_organizer[enable]"]:checked').val(),
            },
        };
        if (data._organizer.enable === "2") {
            data._organizer["fill_member"] = $("#_organizer-fill_member").is(":checked") ? 1 : 0;
        } else {
            data._organizer.subscription = $('[name="_organizer[subscription]"]').val();
        }
        this.add("GET", data);
    },
};

// Edit existing event subscription
memboGo.event.editParticipant = {
    url: "",
    modal: "",
    objectId: null,
    elementId: null,
    modalId: "#modal-event-rate-edit",
    currentLine: null,
    init: function (url) {
        var self = this;
        this.url = url;
        $(document)
            .off("click", ".edit-rate-participant")
            .off("click", ".event-participant-save")
            .off("click", "[data-participant-action]")
            .off("click", ".precancel-subscription")

            .on("click", ".event-participant-save", function (e) {
                e.preventDefault();
                $(this).closest(".content").find("form").submit();
            })
            .on("click", ".edit-rate-participant", function (e) {
                e.preventDefault();
                self.setIdentification($(this));
                self.save(false);
            })
            .on("click", "[data-participant-action]", function (e) {
                e.preventDefault();
                var that = this;
                self.setIdentification($(this));
                HPJUtils.displayLoadingBox();
                $.ajax({
                    url: self.url + "ajax-table-participant-status/module/member",
                    type: "POST",
                    dataType: "json",
                    data: {
                        objectId: self.objectId,
                        subscriptionId: self.elementId,
                        status: $(this).data("participant-action"),
                    },
                    success: function (data) {
                        if (typeof data.html !== "undefined" && data.html !== null) {
                            $(that).closest("tr").find("td:eq(2)").html(data.status);

                            $(that).closest("div").replaceWith(data.html);
                        }
                    },
                    complete: function () {
                        HPJUtils.hideLoadingBox();
                    },
                });
            })
            .on("click", ".cancel-registration", function (e) {
                e.preventDefault();
                self.cancelSubscription($(this));
            })
            .ready(function () {
                self.initModal();
            });
        document.addEventListener("participant-new", function (e) {
            $(e.detail)
                .find('input[name$="pricesId"]:checked')
                .closest("li")
                .find(".js-rate-group")
                .each(function (i) {
                    var price = [];
                    price[i] = { id: $(this).closest("[data-id]").data("id"), price: $(this).data("price") };
                    self.openRate(price);
                });
        });

        memboGo.core.event.listen("event-price-group-registration-edit", function (e) {
            self.currentLine = null;
            self.objectId = e.detail.eventId;
            self.elementId = e.detail.registrationId;
            self.save(false);
        });
    },
    setIdentification: function (that) {
        this.currentLine = that.closest("[data-subscription]");
        this.objectId = this.currentLine.data("object");
        this.elementId = this.currentLine.data("subscription");
    },
    initModal: function () {
        var self = this;
        this.modal = new HPJUtils.modal(self.modalId);
        this.modal.setAction(".modal-yes", function () {
            self.save(true);
        });
    },
    save: function (isPost) {
        var self = this;
        HPJUtils.displayLoadingBox();
        var ajaxData = {
            url: self.url + "ajax-table-participant/module/member",
            type: "GET",
            cache: false,
            dataType: "json",
            data: {
                objectId: this.objectId,
                subscriptionId: this.elementId,
            },
            success: function (data) {
                var content = "";
                if (data.saved) {
                    self.modal.close();
                    self.modal.setContent(content);
                    if (self.currentLine) {
                        self.currentLine
                            .closest("tr")
                            .find("td")
                            .each(function (i) {
                                if (i < 2) {
                                    $(this).html(ajaxData.data.get(i === 0 ? "firstname" : "lastname"));
                                }
                            });
                        if (typeof data.status !== "undefined" && data.status.html !== null) {
                            self.currentLine.closest("tr").find("td:eq(2)").html(data.status.status);
                            self.currentLine.closest("div").replaceWith(data.status.html);
                        }
                    }
                } else {
                    if (data.message !== null) {
                        content += '<div class="alert-danger error">' + data.message + "</div>";
                    }
                    if (data.form !== null) {
                        $(self.modalId).find(".modal-footer > .modal-yes").show();
                        content += data.form;
                    } else {
                        $(self.modalId).find(".modal-footer > .modal-yes").hide();
                    }
                    self.modal.setContent(content);
                    self.modal.open();
                    afterFormLoad(self.modalId);
                }
            },
            complete: function () {
                HPJUtils.hideLoadingBox();
            },
        };
        if (isPost) {
            ajaxData.type = "POST";
            ajaxData.data = new FormData($("#event-participant-edit")[0]);
            ajaxData.data.append("objectId", this.objectId);
            ajaxData.data.append("subscriptionId", this.elementId);
            ajaxData.contentType = false;
            ajaxData.processData = false;
        }
        $.ajax(ajaxData);
    },
    cancelSubscription: function ($link) {
        var self = this;
        self.modal = new HPJUtils.modal("#modal-event-cancel-registration");
        var content = self.modal.getContentWrapper();
        $(".alert", content).remove();
        self.modal.open();
        self.modal.setAction(".modal-yes", function () {
            HPJUtils.displayLoadingBox();
            $.ajax({
                url: $link.attr("href"),
                type: "POST",
                dataType: "json",
                data: {
                    eventId: $link.data("eventid"),
                    registrationId: $link.data("registrationid"),
                    memberId: $link.data("memberid"),
                },
                success: function (data) {
                    if (data.message !== null) {
                        $(".alert", content).remove();
                        self.modal.setContent(data.message + content.html());
                    }
                    if (data.result) {
                        const back = document.querySelector(".myevents-back-btn");
                        if (back) {
                            back.click();
                        }
                    }
                },
                complete: function () {
                    HPJUtils.hideLoadingBox();
                },
            });
        });
    },
};

memboGo.event.filterList = {
    init: function () {
        var self = this;
        $(document)
            .off("change", ".event_list_filter input,.event_list_filter select")
            .on("change", ".event_list_filter input,.event_list_filter select", function (e) {
                e.preventDefault();
                self.send($(this).closest("form"));
            })
            .on("submit", ".event_activity_list_filter form", function (e) {
                e.preventDefault();
                self.send($(this));
            });
    },
    send: function (form) {
        HPJUtils.displayLoadingBox();

        var formData = new FormData(form.get(0));

        memboGo.core.URLSearchQuery.searchFormQueryParameters(form.parent(), formData, "event-filter");

        $.ajax({
            type: "POST",
            url: form.attr("action"),
            async: true,
            cache: false,
            data: formData,
            dataType: "html",
            processData: false,
            contentType: false,
            success: function (data) {
                var element = form.parent().next("div");
                if (element.find(".calendar-content").length) {
                    element.find(".calendar-content").replaceWith(data);
                } else {
                    element.replaceWith(data);
                }
                document.dispatchEvent(new CustomEvent("reload-components"));
            },
            complete: function () {
                HPJUtils.hideLoadingBox();
            },
        });
    },
    tagInit: function (tags) {
        var tagElement = $("#tags");
        if (tags !== null && typeof tags == "object") {
            var tag_keys = Object.keys(tags),
                a;
            if (tag_keys.length > 0) {
                for (a in tag_keys) {
                    tagElement
                        .find("option")
                        .filter(function () {
                            return this.value === tag_keys[a];
                        })
                        .show();
                }
            }
        }
        tagElement.find("option").each(function () {
            if ($(this).hasClass("hide")) {
                $(this).prop("selected", false);
            }
        });
        tagElement.trigger("chosen:updated");
    },
    initCalendarMonth: function () {
        $(document)
            .off("change", '[name="event_calendar_month"]')
            .on("change", '[name="event_calendar_month"]', function () {
                var zone = $(this).closest("[data-zone-id]"),
                    selectedMonth = this.value;
                zone.find(".panel-month").hide();
                if (zone.find(".panel-month-" + selectedMonth).length) {
                    zone.find(".panel-month-" + selectedMonth).show();
                    return;
                }
                var formData = new FormData();
                if (zone.find("form").length) {
                    formData = new FormData(zone.find("form").get(0));
                }
                formData.append("month", selectedMonth);
                HPJUtils.displayLoadingBox();
                $.ajax({
                    type: "POST",
                    url: $(this).data("url"),
                    async: true,
                    cache: false,
                    data: formData,
                    dataType: "html",
                    processData: false,
                    contentType: false,
                    success: function (data) {
                        zone.find(".calendar-content-months").append(data);
                    },
                    complete: function () {
                        HPJUtils.hideLoadingBox();
                    },
                });
            })
            .ready(function () {
                $('[name="event_calendar_month"]').trigger("change");
            });
    },
};

memboGo.event.myEventsTab = {
    url: "",
    init: function (url) {
        const self = this;

        this.url = url;

        $(".myevents-list")
            .off("click touchstart", "a.theadLink")
            .on("click touchstart", "a.theadLink", function (e) {
                e.preventDefault();
                const list = self.findParentWithRoleTabPanel(this);
                if (list) {
                    self.loadTabContent(this.href, list);
                }
            });
    },
    loadTabContent: function (url, list) {
        $.ajax({
            type: "GET",
            async: "false",
            url: url,
            dataType: "html",
            beforeSend: () => HPJUtils.displayLoadingBox(),
            success: (data) => (list.innerHTML = data),
            complete: () => HPJUtils.hideLoadingBox(),
        });
    },
    findParentWithRoleTabPanel: function (element) {
        let parent = element.parentElement;
        while (parent) {
            if (parent.classList.contains("table-list")) {
                return parent;
            }
            parent = parent.parentElement;
        }
        return null;
    },
};
