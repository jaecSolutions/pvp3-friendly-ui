var HPJUtils = {
    /**
     * Display a loading box
     * @param [inside] if set will render the loading into it
     * @param [mode]
     */
    displayLoadingBox: function (inside, mode) {
        // In case old loader.js
        var load = $("#loadingBox");

        if (!load.length) {
            load = $("<div id='loadingBox'></div>");
        }

        if (typeof inside !== "undefined") {
            if (typeof inside === "string") {
                inside = $(inside);
            }

            mode = mode ? mode : "prepend";

            if (mode === "prepend") {
                inside.prepend(load);
            } else if (mode === "html") {
                inside.html(load);
            }

            load.css({
                position: "static",
                visibility: "visible",
            }).show();
        } else {
            var loadWrapper = $("#backgroundBox");

            if (!loadWrapper.length) {
                loadWrapper = $("<div id='backgroundBox'></div>");
                $(document.body).prepend(loadWrapper);
            }

            loadWrapper.html(load);

            var windowSize = getWindowSize(),
                coordinates = getCenteredCoordinates(windowSize, "loadingBox");

            load.css({
                visibility: "visible",
                top: coordinates.top + "px",
                left: coordinates.left + "px",
            }).show();

            loadWrapper
                .css({
                    visibility: "visible",
                    width: windowSize.width + "px",
                    height: windowSize.height + "px",
                })
                .show();
        }
    },
    showSpinner: function (text) {
        // In case old loader.js
        $("#backgroundBox").remove();
        $(document.body).prepend($("<div id='backgroundBox'><div id='loadingBox'></div></div>"));

        $("#loadingBox")
            .css({
                display: "inline-block",
                position: "unset",
                visibility: "visible",
            })
            .show();

        $("#backgroundBox")
            .css({
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.8)",
                display: "flex",
                height: "100%",
                justifyContent: "center",
                textAlign: "center",
                visibility: "visible",
                width: "100%",
            })
            .show();

        if (text) {
            $("#loadingBox")
                .html('<span style="top: 40px;position: relative;font-size: 1.8rem; font-weight: bold;">' + text + "</span>")
                .css({ width: "80%" });
        }
    },
    hideLoadingBox: function () {
        var loadWrapper = $("#backgroundBox");
        if (loadWrapper.length) {
            loadWrapper.hide();
        }
        $("#loadingBox").hide();
    },
    /**
     * Ajax call class
     */
    call: function (c) {
        this.c = ".main-page";
        this.modeC = "";

        if (typeof c !== "undefined" && c !== "") {
            this.c = c;
        }

        this.mode = function (mode) {
            this.modeC = mode;
            return this;
        };

        this.action = function (url, confirm) {
            var res = true,
                self = this;

            if (typeof this.c !== "object") {
                this.c = $(this.c);
            }

            if (typeof confirm !== "undefined" && confirm !== "") {
                res = confirm(confirm);
            }

            if (res) {
                $.ajax({
                    url: url,
                    success: function (d) {
                        if (d.mesg) {
                            $("#message_box").html(d.mesg);
                        }

                        if (d.html) {
                            if (self.modeC === "replaceWith") {
                                self.c.replaceWith(d.html);
                            } else {
                                self.c.html(d.html);
                            }
                        }

                        if (d.js) {
                            eval(d.js);
                        }
                    },
                    complete: HPJUtils.hideLoadingBox,
                    error: function (jqXHR) {},
                });
            }
        };
    },
    /**
     * Bind function to an array (click_to_edit, ...)
     *
     * @param {string} table [optional] - selector of the table
     */
    tableNavig: function (table) {
        this.table = typeof table !== "undefined" ? table : "table";
        var t = this;

        this.classToIgnore;
        this.useInspector = false;
        this.inspectorType = "MEMBER"; // ComponentType enum value
        this.inspectorFormId = null;

        /**
         * If set <td> with those CSS class will not have the 'click_to_edit' function
         * @param {string} classToIgnore
         */
        this.setClassToIgnore = function (classToIgnore) {
            this.classToIgnore = classToIgnore;
            return this;
        };

        /**
         * Build inspector URL by appending the appropriate ID parameter based on component type
         * @param {string} baseUrl - The base URL to append to
         * @param {string} componentType - ComponentType enum value
         * @param {string|number} entityId - The entity ID to append
         * @returns {string} The complete URL with ID parameter
         */
        this.buildInspectorUrl = function (baseUrl, componentType, entityId) {
            if (!baseUrl) {
                return baseUrl;
            }

            const componentIdParameterMapping = {
                EVENT_REGISTRATION: "registrationId",
                MEMBER: "memberId",
                CONTACT: "objectId",
                DONATION: "donationId",
                DONATION_DONOR: "donatorId",
            };

            return baseUrl + "/" + componentIdParameterMapping[componentType] + "/" + entityId;
        };

        /**
         * Enable inspector panel mode - clicks will open the inspector panel
         * instead of navigating to the detail page
         * @param {string} componentType - ComponentType enum value (e.g., 'MEMBER', 'EVENT', 'MEMBER_ORGANIZATION')
         * @param {number|null} formId - Optional form ID for the custom form query
         * @param {number|null} objectId - Optional object ID (e.g., eventId for registrations)
         * @param {string|null} detailUrl - Optional detail URL template
         * @param {string|null} editUrl - Optional edit URL template
         */
        this.enableInspector = function (componentType, formId, objectId, detailUrl, editUrl) {
            this.useInspector = true;
            this.inspectorType = componentType || "MEMBER";
            this.inspectorFormId = formId || null;
            this.inspectorObjectId = objectId || null;
            this.inspectorDetailUrl = detailUrl || null;
            this.inspectorEditUrl = editUrl || null;
            return this;
        };

        this.init = function () {
            if (!table.length) {
                return false;
            }
            this.initClickToAction();
        };

        /**
         * Init redirection on table line click
         *
         * @param clickToUrl ; If known base Url for the action, otherwise use data
         * @param params : @deprecated used to indicate which params is what, use data now
         */
        this.initClickToAction = function (clickToUrl, params, method) {
            // Remove the cursor-click-css if no need
            var tr = $("tbody tr", this.table).first();

            if (typeof tr.attr("id") === "undefined" && typeof tr.attr("data") === "undefined" && typeof tr.data("click") === "undefined") {
                $(this.table).removeClass("table-hover");
            }

            $("body").on(
                "click",
                this.table + " .click_to_edit td:not(._actionTd" + (t.classToIgnore ? "," + t.classToIgnore : "") + ")",
                function (event) {
                    if ($(event.target).closest(".disable-default-click").length) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();

                    var id = $(this).closest("tr").attr("id"),
                        data = $(this).closest("tr").data("click"),
                        url = "";

                    if (typeof id !== "undefined") {
                        // Couvrir les cas comme:
                        // 1. id="billing-detail_571"
                        // 2. id="billing-detail-stripe_in_123456789"
                        const parts = id.split("_");
                        id = [parts[0], parts.slice(1).join("_")]; // Reconstruire les deux parties
                    } else {
                        id = "";
                    }

                    // No id = no good url to go
                    if (!id && typeof data === "undefined") {
                        return false;
                    }

                    if (typeof clickToUrl !== "undefined") {
                        url = clickToUrl;
                    } else {
                        if (typeof window.location.origin === "undefined") {
                            window.location.origin = window.location.protocol + "//" + window.location.host;
                        }

                        var action = "",
                            param = window.location.href.replace(window.location.origin + "/", "").split("/"),
                            module = typeof param[0] !== "undefined" ? param[0] : "",
                            locale = typeof param[1] !== "undefined" ? param[1] : "",
                            controller = typeof param[2] !== "undefined" ? param[2] : "";

                        url = window.location.origin + "/" + (module ? module + "/" : "") + (locale ? locale + "/" : "");

                        // If data redefine the action
                        if (data) {
                            if (typeof data.module !== "undefined") {
                                url = window.location.origin + "/" + data.module + "/" + (locale ? locale + "/" : "");
                            }

                            if (typeof data.action !== "undefined") {
                                action = data.action;
                            }
                            // Old data
                            else if (typeof data === "string") {
                                action = data;
                            }
                        }

                        if (action) {
                            url += action;
                        }
                        // Default use the id attribute
                        else {
                            url += (controller ? controller + "/" : "") + id[0];
                        }
                    }

                    if (data && typeof data.ids !== "undefined") {
                        var separator = "/",
                            first = "/",
                            glue = "/";

                        if (typeof method !== "undefined" && method === "GET") {
                            separator = "=";
                            first = "?";
                            glue = "&";
                        }

                        url += first;

                        for (var k in data.ids) {
                            // eslint-disable-next-line no-prototype-builtins
                            if (data.ids.hasOwnProperty(k)) {
                                url += k + separator + data.ids[k] + glue;
                            }
                        }
                    }
                    // @deprecated
                    else if (typeof params !== "undefined" && params !== null) {
                        for (var i in params) {
                            var ii = parseInt(i) + 1;
                            url += "/" + params[i] + "/" + id[ii];
                        }
                    }
                    // Default use the id attribute
                    else {
                        url += "/id/" + id[1];
                    }

                    // Inspector Panel Integration - intercept member list clicks
                    if (t.useInspector && id[1]) {
                        const inspectorType = t.inspectorType || "MEMBER";
                        const entityId = id[1];

                        // Build URLs using the helper function
                        const detailUrl = t.buildInspectorUrl(t.inspectorDetailUrl || url, inspectorType, entityId);
                        const editUrl = t.buildInspectorUrl(t.inspectorEditUrl || url, inspectorType, entityId);

                        window.dispatchEvent(
                            new CustomEvent("inspector:open", {
                                detail: {
                                    component: inspectorType,
                                    id: entityId,
                                    formId: t.inspectorFormId,
                                    objectId: t.inspectorObjectId,
                                    detailUrl: detailUrl,
                                    editUrl: editUrl,
                                },
                            })
                        );
                        return;
                    }

                    window.location.href = url;
                }
            );

            return this;
        };

        /**
         * Create the 'delete' action on .deleteLink
         * If the delete link has no URL, it directly display the modal, otherwise it will load the result of this URL into the modal content
         *
         * @param urlD : Delete URL
         * @param modalId
         * @returns {HPJUtils}
         */
        this.initClickToDelete = function (urlD, modalId) {
            var modalValid = null,
                tD = this;
            modalId = typeof modalId !== "undefined" ? modalId : "#modal-doc";

            $("body").on("click", t.table + " .deleteLink", function (e) {
                e.preventDefault();
                var id = $(this).attr("id").split("_")[1],
                    url = $(this).attr("href");

                tD.initModal(url);
                modalValid.setAction(".modal-yes", function () {
                    HPJUtils.displayLoadingBox();

                    $.ajax({
                        url: urlD + "/id/" + id,
                        dataType: "json",
                        success: function (data) {
                            var mesgWrapper = $("#message_box");
                            mesgWrapper.html("");

                            if (data.mesg) {
                                mesgWrapper.html(data.mesg);
                                $("html, body").animate({ scrollTop: mesgWrapper.position().top - 50 }, 500, "easeInSine");
                            }

                            if (!data.error) {
                                if (data.redirect_url) {
                                    window.location.href = data.redirect_url;
                                } else {
                                    var line = $("#item_" + id);

                                    if (!line.length) {
                                        line = $("#edit_" + id);
                                        if (!line.length) {
                                            line = $('[id$="-edit_' + id + '"]');
                                        }
                                    }

                                    line.fadeOut(1000, function () {
                                        $(this).remove();
                                    });

                                    // No more line : reload the page (-1 because the current line is not yet removed)
                                    if (!($(t.table + " ._actionTd").length - 1)) {
                                        window.location.reload();
                                    } else {
                                        var nbItemW = $(".paginatorNbRow span", t.table);

                                        if (nbItemW.length) {
                                            nbItemW.html(nbItemW.html() - 1);
                                        }

                                        HPJUtils.hideLoadingBox();
                                    }
                                }
                            }

                            if (data.reload) {
                                location.reload();
                            }
                        },
                        complete: function () {
                            HPJUtils.hideLoadingBox();
                            modalValid.close();
                        },
                    });
                });
            });

            this.initModal = function (url) {
                modalValid = new HPJUtils.modal(modalId);

                if (typeof url === "undefined" || !url) {
                    modalValid.open();
                    return true;
                }

                $.ajax({
                    url: url,
                    dataType: "json",
                    success: function (data) {
                        if (data.content) {
                            tD.modalCallback(data);
                            modalValid.open(data.content);
                        }

                        //Disable and hide the validation button if something went wrong
                        if (data.error) {
                            $(modalId).find(".modal-yes").attr("disabled", true).addClass("d-none");
                        } else {
                            $(modalId).find(".modal-yes").attr("disabled", false).removeAttr("disabled").removeClass("d-none");
                        }
                    },
                });
            };

            // Client defined callback after modal opening
            this.modalCallback = function () {};

            this.setModalCallback = function (callBack) {
                this.modalCallback = callBack;
                return this;
            };

            return this;
        };
        this.initDuplicate = function () {
            $(document).on("click", t.table + " .duplicate", function (e) {
                e.preventDefault();
                HPJUtils.displayLoadingBox();
                $(".priority-messages").remove();
                $.ajax({
                    url: $(this).attr("href"),
                    dataType: "json",
                    success: function (data) {
                        if (data.result) {
                            window.location.href = data.url;
                        } else {
                            $(t.table).closest(".list-result-wrapper").before(data.error);
                        }
                    },
                    complete: function () {
                        HPJUtils.hideLoadingBox();
                    },
                });
            });

            return this;
        };
    },
    tableUX: function () {
        var table = $(".table-responsive > .table");

        if (!table.length || typeof table.floatThead !== "function") {
            return false;
        }

        table.floatThead({
            scrollContainer: function ($t) {
                return $t.closest(".table-responsive");
            },
            zIndex: 999,
        });
    },
    tableStickyHeaderRefresh: function () {
        var table = $(".table-responsive > .table");

        if (!table.length) {
            return false;
        }

        table.trigger("reflow");
    },
    modal: function (modal) {
        this.open = function (content) {
            if (typeof content !== "undefined") {
                if ($(modal).hasClass("modalux4")) {
                    $(".modal-body > div", modal).html(content);
                } else {
                    $(".modal-body", modal).html(content);
                }
            }

            $(modal).modal();

            return this;
        };
        this.close = function () {
            $(modal).modal("hide");
            return this;
        };
        this.setTitle = function (title) {
            if ($(modal).hasClass("modalux4")) {
                if ($("#defaultModalTitle", modal).length) {
                    $("#defaultModalTitle", modal).html(title);
                } else {
                    $(".modal-body", modal).prepend('<h3 id="defaultModalTitle">' + title + "</h3>");
                }
            } else {
                $(".modal-title", $(modal)).html(title);
            }

            return this;
        };
        this.setContent = function (content) {
            if ($(modal).hasClass("modalux4")) {
                $(".modal-body > div", modal).html(content);
            } else {
                $(modal).find(".modal-body").html(content);
            }

            return this;
        };
        this.setFooter = function (content) {
            $(modal).find(".modal-footer").html(content);
            return this;
        };
        this.getContentWrapper = function () {
            return $(".modal-body", $(modal));
        };
        this.getElement = function () {
            return $(modal);
        };
        /**
         * To hide or show an element in the Modal scope
         */
        this.hide = function (c, hide) {
            if (typeof hide === "undefined") {
                hide = true;
            }

            if (hide) {
                $(c, $(modal)).hide();
            } else {
                $(c, $(modal)).show();
            }

            return this;
        };
        this.hideYes = function (hide) {
            return this.hide(".modal-yes", hide);
        };
        this.hideCancel = function (hide) {
            return this.hide(".modal-cancel", hide);
        };
        this.hideClose = function (hide) {
            if ($(modal).hasClass("modalux4")) {
                this.hide(".modal-header .close", hide);
            }

            return this.hide(".js-modal-close", hide);
        };
        this.show = function (context, show) {
            show = show ? "show" : "hide";

            switch (context) {
                case "header":
                    $(modal).find(".modal-header")[show]();
                    break;
                case "body":
                    $(modal).find(".modal-body")[show]();
                    break;
                case "footer":
                    $(modal).find(".modal-footer")[show]();
                    break;
            }
        };
        /**
         * Bind the function 'doThis' to the element 'on'
         */
        this.setAction = function (on, doThis) {
            if (typeof doThis !== "function") {
                return false;
            }

            $("body")
                .off("click", modal + " " + on)
                .on("click", modal + " " + on, function (e) {
                    doThis(e, this);
                });

            return this;
        };
    },
    dragDrop: function (callUrl, maxDepth) {
        this.callUrl = callUrl;
        this.maxDepth = typeof maxDepth !== "undefined" ? maxDepth : 2;
        this.currentPos = "";
        this.init = function (id) {
            var self = this,
                n = $(id),
                fake_item = $(".dd-item.dd-fake");

            n.nestable({
                maxDepth: this.maxDepth,
                expandBtnHTML: "",
                collapseBtnHTML: "",
            });

            // Keep last order to prevent useless update
            this.currentPos = window.JSON.stringify(n.nestable("serialize"));

            n.on("change", function (e) {
                fake_item.appendTo($(".dd > .dd-list"));
                self.update(e);
            });
        };
        this.update = function (e) {
            var list = e.length ? e : $(e.target),
                data = list.nestable("serialize");
            data = window.JSON.stringify(data);

            if (this.currentPos != data) {
                $.ajax({
                    type: "POST",
                    data: { list: data },
                    url: this.callUrl,
                    dataType: "json",
                    success: function (data) {
                        // Reload on error
                        if (data.error) {
                            location.reload();
                        }
                    },
                });
            }

            this.currentPos = data;
        };
    },
    /**
     * Handle status update on Ajax
     * Any DOM element of class this.target will trigger the update on change
     */
    status: function (url, afterSuccess) {
        this.url = url;
        this.wrapper = "";
        this.wrapperUpdate = "";
        this.loading = "";
        this.target = ".status-update";
        this.type = "";
        this.listen = "click";

        this.beforeCall = function () {
            return true;
        };

        this.callBack = function () {};

        this.setWrapper = function (wrapper) {
            this.wrapper = wrapper;
            this.target = this.wrapper + " " + this.target;

            var test = $(this.target).first();

            if (test.length) {
                this.type = test.attr("type");
                if (this.type) {
                    this.listen = "change";
                }
            }

            return this;
        };

        this.setLoading = function (loading) {
            if (loading === "default" || loading === "mini") {
                this.loading = loading;
            }

            return this;
        };

        /**
         * @param wrapperUpdate : selector of an element to update after callback
         */
        this.setWrapperUpdate = function (wrapperUpdate) {
            this.wrapperUpdate = wrapperUpdate;
            return this;
        };

        this.setCallBack = function (callBack) {
            this.callBack = callBack;
            return this;
        };

        this.init = function (wrapperCall, wrapperUpdate) {
            this.setWrapper(wrapperCall);
            this.setWrapperUpdate(wrapperUpdate);
            var self = this;

            $("body")
                .off(this.listen, self.target)
                .on(this.listen, self.target, function () {
                    self.call(this);
                });
        };

        this.call = function (e) {
            var that = this;

            if (this.loading === "default") {
                HPJUtils.displayLoadingBox();
            }

            // If before call condition is not met, stop request
            if (!this.beforeCall({ self: e })) {
                return false;
            }

            e = $(e);
            var v = e.val(),
                id = e.data("id"),
                self = this;

            if (this.type === "checkbox") {
                v = e.is(":checked") ? 1 : 0;
            }

            var previousState = !v;

            $.ajax({
                type: "POST",
                data: {
                    id: id,
                    value: v,
                },
                url: this.url,
                dataType: "json",
                success: function (data) {
                    var mesgWrapper = $("#message_box").html("");

                    if (data.error) {
                        e.prop("checked", previousState);
                    }

                    if (data.mesg) {
                        mesgWrapper.html(data.mesg);
                    } else {
                        mesgWrapper.html("");
                    }

                    if (!data.error && self.wrapperUpdate && data.update) {
                        $(self.wrapperUpdate).html(data.update);
                    }

                    data.value = v;
                    self.callBack(data);

                    if (typeof afterSuccess == "function") {
                        afterSuccess(data);
                    }
                },
                complete: function () {
                    if (self.loading === "default") {
                        HPJUtils.hideLoadingBox();
                    }
                },
            });
        };
    },

    simpleTableNavig: function () {
        this.initClickTo = function () {
            $(".click_to td").each(function () {
                $(this).click(function (event) {
                    if ($(this).attr("class") !== "_actionTd") {
                        var url = $(this).closest("tr").attr("click_to");
                        window.location.href = url;
                    }
                });
            });
        };
    },

    slug: function (str) {
        str = str.replace(/^\s+|\s+$/g, "");
        str = str.toLowerCase();
        var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
        var to = "aaaaaeeeeeiiiiooooouuuunc------";

        for (var i = 0, l = from.length; i < l; i++) {
            str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
        }

        return str
            .replace(/[^a-z0-9 -]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    },

    getUrlVars: function () {
        var vars = [];
        var parts = window.location.search.substring(1).split("&");

        for (var i = 0; i < parts.length; i++) {
            var pair = parts[i].split("=");
            vars[pair[0]] = pair[1];
        }

        return vars;
    },

    show: function (that) {
        $(that).removeClass("d-none");
    },

    hide: function (that) {
        $(that).addClass("d-none");
    },
};

var HPJForm = {
    /**
     * Toggle the visibility of forms elements based on elem value
     *
     * @param elem | element triggering the toggle
     * @param toggleThat | element to be toggled
     * @param valShow | value or list of values of the 'elem' that will show toggleThat
     */
    toggle: function (elem, toggleThat, valShow) {
        valShow = typeof valShow !== "undefined" ? valShow : 1;

        if (typeof valShow !== "object") {
            valShow = [valShow.toString()];
        }

        if ($.isArray(toggleThat)) {
            var toggleOther = toggleThat[1];
            toggleThat = toggleThat[0];
        }

        var getVal = ":checked";

        if ($(elem).is("select")) {
            getVal = "";
        }

        if (typeof $(elem + getVal).val() === "undefined" || $.inArray($(elem + getVal).val(), valShow) === -1) {
            $(toggleThat).hide();
        } else if (typeof toggleOther !== "undefined" && $.inArray($(elem + getVal).val(), valShow) !== -1) {
            $(toggleOther).hide();
        }

        $("body")
            .off("change", elem)
            .on("change", elem, function () {
                var show = $.inArray($(elem + getVal).val(), valShow) !== -1;
                $(toggleThat)[show ? "show" : "hide"]();
                $(toggleOther)[!show ? "show" : "hide"]();
            });
    },
    /**
     * Clear a field (even input type=file)
     */
    clear: function (on, clearThat) {
        if (typeof on === "undefined") {
            on = $(".btn-clear-file");
        } else if (typeof on !== "object") {
            on = $(on);
        }

        if (typeof clearThat === "undefined") {
            clearThat = $("#" + on.data("id"));
        } else if (typeof clearThat !== "object") {
            clearThat = $(clearThat);
        }

        on.click(function (event) {
            clearThat.val("");
            //clearThat.replaceWith( clearThat = clearThat.clone( true ) );
        });
    },
    getStates: function () {
        let countryField = $(".js-select-country");

        if (!countryField.length) {
            return null;
        }

        countryField.each(function () {
            const form = $(this).closest("form");

            let stateField = form.find(".js-select-state");

            if (this.closest("[data-state-alias]")) {
                const countryStateAlias = this.closest("[data-state-alias]").dataset.stateAlias;
                stateField = countryStateAlias ? form.find("#" + countryStateAlias) : null;
            }

            if (!stateField.length) return;

            if (stateField.length > 1) {
                // Only the event registration form with registration manager can have multiple country fields (and therefore states)
                stateField = $(this).closest(".section").find(".js-select-state");

                if (!stateField.length || stateField.length === 0) {
                    // If for some reason the layout has changed, give up on the state field
                    return null;
                }
            }

            let defaultCountry = $(this).find("option:selected").val();
            let defaultState = stateField.find("option:selected").val();
            let defaultStateInWrapper = $(this).closest(".section").find(".js-state-wrapper").attr("data-default");

            if (!["CA", "US", "IT"].includes(defaultCountry)) {
                HPJForm.clearStates(stateField);
            }

            $(this)
                .off(".countryGetStates")
                .on("change.countryGetStates", function () {
                    if (["CA", "US", "IT"].includes($(this).val())) {
                        let url = "/form/" + language + "/form/getstates/country/" + $(this).val() + "/empty/1";

                        $.ajax({
                            url: url,
                            dataType: "json",
                            success: function (data) {
                                stateField.empty();

                                $.each(data, function (key, value) {
                                    value = key == "" ? value + "..." : value;
                                    stateField.append('<option value="' + key + '">' + value + "</option>");
                                });

                                stateField.closest(".js-state-wrapper").show();
                            },
                            complete: function () {
                                const priorities = [stateField.get(0).dataset?.targetValue ?? "", defaultState, defaultStateInWrapper, ""];

                                const targetValue = priorities.find(
                                    (value) =>
                                        typeof value === "string" && value.trim() !== "" && stateField.find(`option[value="${value}"]`).length > 0
                                );

                                if (targetValue !== undefined) {
                                    stateField.find(`option[value="${targetValue}"]`).prop("selected", true);
                                }
                            },
                        });
                    } else {
                        HPJForm.clearStates(stateField);
                    }
                });
        });

        $(document).ready(function () {
            $(".js-select-country").trigger("change.countryGetStates");
        });
    },
    getFiscalcode: function (countryField) {
        if (typeof countryField === "undefined" || !countryField) {
            countryField = "#country";
        }

        const initCountryVal = $(countryField + " option:selected").val();

        if (!["IT"].includes(initCountryVal)) {
            this.clearFiscalcode();
        }

        const self = this;

        $(document).on("change", countryField, function () {
            if (["IT"].includes($(this).val())) {
                $(".js-fiscalcode-wrapper").show();
            } else {
                self.clearFiscalcode();
            }
        });

        $(document).ready(function () {
            $(countryField).trigger("change");
        });
    },
    getIntracommunityvat: function (countryField) {
        if (typeof countryField === "undefined" || !countryField) {
            countryField = "#country";
        }

        const initCountryVal = $(countryField + " option:selected").val();

        if (!["BE", "IT"].includes(initCountryVal)) {
            this.clearIntracommunityvat();
        }

        const self = this;

        $(document).on("change", countryField, function () {
            if (["BE", "IT"].includes($(this).val())) {
                $(".js-intracommunityvat-wrapper").show();
            } else {
                self.clearIntracommunityvat();
            }
        });

        $(document).ready(function () {
            $(countryField).trigger("change");
        });
    },
    clearStates: function (stateField) {
        stateField.closest(".js-state-wrapper").hide();

        stateField
            .empty()
            // Set empty value to update DB last value
            .append('<option value=""></option>');
    },
    clearFiscalcode: function () {
        $(".js-fiscalcode-wrapper").hide();
    },
    clearIntracommunityvat: function () {
        $(".js-intracommunityvat-wrapper").hide();
    },
    // Default add mechanism
    getOptions: function (urlOptAdd, field) {
        if (typeof field === "undefined") {
            field = "option";
        }

        // option delete
        $("body").on("click", "." + field + "-moins", function (e) {
            var id = $(this).data("id"),
                wrapper = $("#" + field + "-select-wrapper" + id),
                name = $("#" + field + "-name" + id).html();

            // restore option to select
            var option = '<option label="' + name + '" value="' + id + '">' + name + "</option>";
            $("#" + field + "_select").append(option);

            wrapper.remove();
        });

        // option add
        $("#" + field + "-plus").click(function () {
            var option = $("#" + field + "_select").val(),
                name = $("#" + field + "_select option:selected").text();

            if (option != 0) {
                HPJUtils.displayLoadingBox();

                $.ajax({
                    url: urlOptAdd,
                    data: { option: option, name: name },
                    dataType: "json",
                    success: function (data) {
                        if (data.error) {
                            $("#" + field + "-mesg").html(data.error);
                        } else {
                            $("#" + field + '_select option[value="' + option + '"]').remove();
                            $("#" + field + "-select-wrapper").before(data.item);
                        }
                    },
                    complete: function () {
                        HPJUtils.hideLoadingBox();
                    },
                });
            }
        });
    },
    addHelpBlock: function (element, content, position) {
        position = position || "";
        var className = position.length > 0 ? "help-block-" + position : position;
        $(element)
            .find("p" + (className.length ? "." + className : "help-block"))
            .remove();

        if (typeof content != "undefined" && content.length) {
            $(element).append('<p class="help-block ' + className + '">' + content + "</p>");
        }
    },
    //TODO Uniformiser l'application pour utiliser cette function a l'avenir
    datePicker: function () {
        $(".datePicker").each(function () {
            var config = { dateFormat: "yy-mm-dd" };

            if ($(this).data("max-date") && $(this).data("max-date").length) {
                config.maxDate = $(this).data("max-date");
            }

            if ($(this).data("min-date") && $(this).data("min-date").length) {
                config.minDate = $(this).data("min-date");

                if (typeof config.maxDate != "undefined") {
                    var y1 = parseInt(/(\d{4})/.exec(config.maxDate)[0]),
                        y2 = parseInt(/(\d{4})/.exec(config.minDate)[0]);

                    if (y1 < y2) {
                        config.minDate = "";
                    }
                }
            }

            if ($(this).data("year-range") && $(this).data("year-range").length) {
                config.yearRange = $(this).data("year-range");
            }

            if ($(this).data("format")) {
                config.dateFormat = $(this).data("format");
            } else if ($(this).hasClass("dateFormatfr")) {
                config.dateFormat = "dd-mm-yy";
            }

            if ($(this).data("default-year-shift")) {
                config.defaultDate = $(this).data("default-year-shift") + "y";
            }

            $(this).datepicker(config);
        });
    },
    errorJump: function (form, next) {
        var offset = 20;

        $(form).find(".has-error").closest(".section").find(".section-title__collapsed").removeClass("section-title__collapsed");

        if ($(".app__header").length) {
            offset += $(".app__header").innerHeight();
        }

        $(form)
            .find(".has-error:first")
            .each(function () {
                $([document.documentElement, document.body]).animate(
                    {
                        scrollTop: $(this).offset().top - offset - 20,
                    },
                    2000
                );
                $(this).find("select:visible,input:visible,text:visible,textarea:visible").focus();
            });

        if (next) {
            $(form).on("change", "select,input,text,textarea", function () {
                $(this).closest(".has-error").find(".errors").remove().removeClass("has-error");
                $(this).closest(".has-error").removeClass("has-error");
                $(form)
                    .find(".has-error:first")
                    .each(function () {
                        $([document.documentElement, document.body]).animate(
                            {
                                scrollTop: $(this).offset().top - offset - 20,
                            },
                            1000
                        );
                        $(this).find("select:visible,input:visible,text:visible,textarea:visible").focus();
                    });
            });
        }
    },
    multiSelect: function () {
        $(document)
            .off("click", "[data-chosen-init]")
            .off("click", "[data-chosen-all]")
            .on("click", "[data-chosen-all]", function (e) {
                $($(this).data("chosen-all")).find("option").prop("selected", true);
                $($(this).data("chosen-all")).trigger("chosen:updated").trigger("change");
                e.preventDefault();
                e.stopPropagation();
            })
            .on("click", "[data-chosen-init]", function (e) {
                $($(this).data("chosen-init")).val("").trigger("chosen:updated").trigger("change");
                e.preventDefault();
                e.stopPropagation();
            });
    },
    afterLoad: function (form) {
        var ckeditorInit = true;

        if (!form) {
            form = $(document);
            ckeditorInit = false;
        }

        form.find("label.required").each(function (index) {
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

        form.find(".select-country").find("select").trigger("change");
        this.datePicker();

        form.find("[data-conditional-field]").trigger("change");

        form.find("[data-display-conditions]").trigger("change");

        try {
            memboGo.Field.Autocomplete.init();
        } catch (e) {
            memboGo.core.dispatchException(e);
        }

        ckeditorInit && memboGo.core.ckeditor.init(form);

        HPJForm.getStates();
    },
    addResetBtn: function (element, form) {
        $(document)
            .off("click", element)
            .on("click", element, function (e) {
                e.preventDefault();
                e.stopPropagation();
                $(form)
                    .find("input,textarea,select")
                    .each(function (e) {
                        if ($(this).attr("type") !== "submit") {
                            $(this).val("");
                        }
                    });
                $(form).find("input:radio, input:checkbox").removeAttr("checked").removeAttr("selected");

                $('select[multiple="multiple"]').each(function () {
                    $(this).val("").trigger("chosen:updated");
                });
                // @NOTE -100 of the headers
                $("html,body").animate({ scrollTop: $("form").offset().top - 100 }, "fast");
            });
    },
};

var HPJMath = {
    toFloat: function (n) {
        return typeof n === "number" ? n : parseFloat(n.replace(",", "."));
    },
    toInt: function (n) {
        return typeof n === "number" ? n : parseInt(n.replace(",", "."));
    },
};

/**
 * Used to submit generated form
 */
var clickCount = 0;

/**
 * Collision detection for a table's option menu
 */
function tableOptionsMenu() {
    var row_opt_btn = $("table .btn-group");

    if (!row_opt_btn.length) {
        return false;
    }

    row_opt_btn.on("shown.bs.dropdown", function () {
        var menu = $(this).find(".dropdown-menu"),
            toggle = $(this).find(".dropdown-toggle"),
            table_container = $(this).closest(".table-responsive, .table-simple");

        if (toggle != null && toggle.length == 1) {
            toggle.addClass("table-option");
        }

        if (menu != null && menu.length == 1) {
            var btn = menu.parent();

            menu.addClass("table-option");
            menu.position({
                my: "right center",
                at: "left-25px center",
                of: btn,
                collision: "none fit",
                within: table_container,
            });
        }
    });

    row_opt_btn.on("hidden.bs.dropdown", function () {
        var menu = $(this).find(".dropdown-menu");

        if (menu != null && menu.length == 1) {
            menu.css({ top: "", left: "" });
        }
    });
}

$(document).ready(function () {
    /**
     * Init Bootstrap tooltip
     */
    $(document.body).tooltip({
        selector: '[data-toggle="tooltip"]',
    });

    $(".form-submit").bind("click", function (e) {
        e.preventDefault();

        if (clickCount == 0) {
            var element = $(this).data("form") || ".js-form-bind form";
            var href = $(this).attr("href");
            if (href) {
                $(element).attr("action", href);
            }
            $(element).submit();
        }

        clickCount++;
    });

    /**
     * Component selector
     */
    $('select[name="componentSelect"]').change(function () {
        if ($(this).val() != "") {
            window.location.href = $(this).val();
        }
    });

    /**
     * Account selector
     */
    $('select[name="accountSelect"]').change(function () {
        if ($(this).val() != "") {
            var userId = $(this).val();
            var url = "/profile/" + language + "/authentication/autologin/id/" + userId;
            window.location.href = url;
        }
    });

    HPJForm.getStates();
});

$(document).on("click", "[data-modal]", function () {
    if ($(this).find(".body").length) {
        var id = $(this).data("modal"),
            text = "<p>" + $(this).find(".body").html() + "</p>";

        if ($("#" + id).length) {
            $("#" + id)
                .find(".modal-body")
                .html(text);
        } else {
            var html =
                '<div id="' +
                id +
                '" class="modal fade" aria-hidden="true" style="display: none;"><div class="modal-dialog"><div class="modal-content">';

            if ($(this).find(".header").length) {
                html += '<div class="modal-header">';
                html +=
                    '<button type="button" class="close" data-dismiss="modal" aria-label="Close"> <span aria-hidden="true">&times;</span> </button>';
                html += '<h4 class="modal-title">' + $(this).find(".header").html() + "</h4></div>";
            }

            html += '<div class="modal-body">' + text + "</div>";
            html += "</div></div></div>";
            $("body").append(html);
        }

        $(this).find(".header,.body").remove();
    }
});
