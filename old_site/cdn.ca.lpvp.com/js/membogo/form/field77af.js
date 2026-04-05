// Promises are used extensively and it is not compatible with IE11
/* eslint-disable */
if (typeof memboGo === 'undefined') {
    var memboGo = {};
}

if (typeof memboGo.Field === 'undefined') {
    memboGo.Field = {};
}

memboGo.Field.Conditional = {
    init: function () {
        $(document)
            .off('change', '[data-conditional-field]')
            .off('change', '[data-display-conditions]')
            .on('change', '[data-conditional-field]', function (e) {
                const $this = $(this);
                const values = Array.from($this.get(0).querySelectorAll('input:checked, select'))
                    .filter((element) => parseInt(element.value) > 0)
                    .map((element) => parseInt(element.value));
                $this.data('conditional-field').forEach(function (rule) {
                    const show = rule?.options?.some(option => values.includes(option));
                    $this.closest('.row')[0].querySelectorAll('[data-conditional-field-child="' + rule.id + '"]')
                        .forEach((el) => {
                            el.style.display = show ? 'block' : 'none';
                            memboGo.Field.Conditional.updateSectionDisplay(el, show);
                        });
                });
            })
            .on('change', '[data-display-conditions]', function () {
                memboGo.Field.Conditional.updateSectionDisplay(this, true);
            })
            .ready(function () {
                $('[data-conditional-field], [data-display-conditions]').trigger('change');
            })
    },
    updateSectionDisplay: function (element, parentVisibility) {

        if (!element.dataset.displayConditions) {
            return;
        }

        if (parentVisibility) {
            parentVisibility = element.style.display !== 'none' && (!element.closest('.section') || element.closest('.section').style.display !== 'none');
        }

        const displayConditions = JSON.parse(element.dataset.displayConditions);

        for (const sectionId in displayConditions) {
            let sectionVisibility = false;

            if (parentVisibility) {
                const allowedValues = Object.values(displayConditions[sectionId]);
                const elements = element.querySelectorAll('input:checked, select option:checked');
                if (elements.length === 0) {
                    sectionVisibility = allowedValues.includes(0);
                } else {
                    const intersectionValues = Array.from(elements).filter((el) => allowedValues.includes(parseInt(el.value)));
                    sectionVisibility = intersectionValues.length > 0;
                }
            }

            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = sectionVisibility ? 'block' : 'none';
                section.querySelectorAll('[data-display-conditions]')
                    .forEach((el) => memboGo.Field.Conditional.updateSectionDisplay(el, parentVisibility && sectionVisibility));

                memboGo.Field.Conditional.syncWithRelatedSections(sectionId, sectionVisibility);
            }

            memboGo.core.event.dispatch('change-section-display-conditions', {
                sectionId: sectionId,
                visible: sectionVisibility
            });
        }

        memboGo.core.event.dispatch('mgo-event-field-object-change-sections');
    },
    syncWithRelatedSections: function (sectionId, sectionVisibility) {
        const sections = document.querySelectorAll('[data-related-section="' + sectionId + '"]');
        sections.forEach((section) => {
            section.style.display = sectionVisibility ? 'block' : 'none';
            memboGo.Field.Conditional.syncWithRelatedSections(section.getAttribute('id'), sectionVisibility);
        });
    }
};

memboGo.Field.File = {
    text: {
        cancel: 'Remove',
        errorsize: 'Error size must be between __MIN__ - __MAX__',
    },

    add: function (element, params) {
        var self = this;
        if (typeof params.crop !== 'undefined') {
            params.crop = new memboGo.Field.Crop(element, params.crop);
        }
        Formstone.Ready(function () {
            window.addEventListener("dragover", function (e) {
                e = e || event;
                e.preventDefault();
            }, false);
            window.addEventListener("drop", function (e) {
                e = e || event;
                e.preventDefault();
            }, false);
            $(element).hide();
            if (!$(element).siblings('.field_file__draggablecomplete').length) {
                $(element).before($('<ul />', {class: 'field_file__draggablecomplete'}));
            }
            var elementAttr = {class: 'field_file__draggable', 'data-preview': '0'};
            if (typeof params['showPreview'] != 'undefined' && !!params['showPreview']) {
                elementAttr['data-preview'] = '1';
                $(element).siblings('.field_file__draggablecomplete').before($('<div />', elementAttr));
            } else {
                $(element).siblings('.field_file__draggablecomplete').after($('<div />', elementAttr));
            }
            $(element)
                .data('name', $(element).attr('name'))
                .removeAttr('name')
                .siblings('.field_file__draggable')
                .upload(params)
                .on("start.upload", self.onStart)
                .on("complete.upload", self.onComplete)
                .on("filestart.upload", self.onFileStart)
                .on("fileprogress.upload", self.onFileProgress)
                .on("filecomplete.upload", self.onFileComplete)
                .on("fileerror.upload", self.onFileError)
                .on("chunkstart.upload", self.onChunkStart)
                .on("chunkprogress.upload", self.onChunkProgress)
                .on("chunkcomplete.upload", self.onChunkComplete)
                .on("chunkerror.upload", self.onChunkError)
                .on("queued.upload", self.onQueued);

            $(document)
                .off('click', ".filelist.queue")
                .off('click', ".file_cancel_all")
                .off('click', '.remove-upload-file')
                .off('click', '.cancel-pre-upload-file')

                .on('click', ".filelist.queue", self.onCancel)
                .on('click', ".file_cancel_all", self.onCancelAll)
                .on('click', '.remove-upload-file', function () {
                    $(this).closest('li').remove();
                })
                .on('click', '.cancel-pre-upload-file', function () {
                    var ul = $(this).closest('ul'),
                        _p = $(this).closest(".field_file__draggablecomplete");

                    $(this).closest('li').remove();

                    ul.siblings('.field_file__draggable').upload('removeUpload');

                    if (!_p.find('li').length) {
                        _p.append($('<input />', {
                            type: "hidden",
                            class: 'empty-value',
                            name: _p.siblings('input[type="file"]').data('name') + '[]'
                        }));
                    }

                    memboGo.core.event.dispatch('eventFormFieldDraggablecomplete', {element: _p.get(0)});
                });

            if (typeof params.preUpload !== 'undefined') {
                var drawUploadFile = !$(element).closest(".form-group").find(".field_file__draggablecomplete").find('li').length;
                element = $(element).siblings('.field_file__draggable');
                if (typeof params.preUpload === 'object') {
                    for (var i in params.preUpload) {
                        if (drawUploadFile) {
                            memboGo.Field.File.addUploadedFile(element, params.preUpload[i]);
                        }
                        $(element).upload('incrementUpload');
                    }
                } else {
                    if (drawUploadFile) {
                        memboGo.Field.File.addUploadedFile(element, params.preUpload, params.urlDownload);
                    }
                    $(element).upload('incrementUpload');
                }
            }

            if (typeof params['presetError'] != 'undefined' && !!params['presetError'] && params['presetError'].length > 0) {
                self.addErrorMessages(element, params['presetError']);
            }
        });
    },

    onCancel: function (e) {
        var index = $(this).parents("li").data("index");
        $(this).parents("form").find(".upload").upload("abort", parseInt(index, 10));
    },

    onCancelAll: function (e) {
        $(this).parents("form").find(".upload").upload("abort");
    },

    onQueued: function (e, files) {
    },

    onStart: function (e, files) {
        HPJUtils.displayLoadingBox();
    },

    onComplete: function (e) {
        HPJUtils.hideLoadingBox();
    },

    onFileStart: function (e, file) {
    },

    onFileProgress: function (e, file, percent) {
    },

    onFileComplete: function (e, file, response, status, jqXHR, crop) {
        const parent = $(e.target).closest('.form-group');
        parent.removeClass('has-error');
        parent.find('.errors').remove();
        if (response['success'] == '1') {
            memboGo.Field.File.addUploadedFile(this, response.data);
            crop ? crop.addRestore() : null;
        } else {
            if (typeof response['messages'] !== 'undefined') {
                memboGo.Field.File.addErrorMessages(e.target, response['messages']);
            }
        }
    },

    onFileError: function (e, file, error) {
        if (error == 'size') {
            $(this).closest(".form-group").find(".field_file__draggablecomplete").append($('<li />').append($('<div />', {class: 'error'}).text(memboGo.Field.File.text.errorsize)));
            var last = $(this).closest(".form-group").find(".field_file__draggablecomplete").find('li').last();
            setTimeout(function () {
                $(last).remove();
            }, 3000);
        }
    },

    onChunkStart: function (e, file) {
        console.log("Chunk Start");
    },

    onChunkProgress: function (e, file, percent) {
        console.log("Chunk Progress");
    },

    onChunkComplete: function (e, file, response) {
        console.log("Chunk Complete");
    },

    onChunkError: function (e, file, error) {
        console.log("Chunk Error");
    },

    addUploadedFile: function (that, file, urlDownload) {
        if (typeof file === 'string') {
            file = {link: file, name: file.split('\\').pop().split('/').pop()};
        }

        if (urlDownload && urlDownload.length) {
            file['link'] = urlDownload;
        }

        var element;
        if (parseInt($(that).data('preview'), 2)) {
            element = $('<img />', {
                class: "file",
                style: "max-width:400px;margin:20px 0 0;",
                src: file['link'],
                alt: file['file_name']
            });
        } else {
            element = $('<a />', {class: "file", target: 'blank', href: file['link']});
        }
        element.text(file['name']);

        $(that).closest(".form-group").find(".field_file__draggablecomplete").each(function () {
            $(this).find('.empty-value').remove();

            var name = $(this).siblings('input[type="file"]').data('name') + '[]';
            $(this).append(
                $('<li />').append(
                    $('<div />', {class: 'content'})
                        .append(element,
                            '<div class="multifile__actions-file">'
                            + '<span class="cancel-pre-upload-file multifile__remove-file"><i class="fontawesome-icon icon-trash fa fa-times"></i></span>'
                            + '</div>',
                            $('<input />', {
                                type: "hidden",
                                name: name,
                                value: JSON.stringify(file)
                            }))
                )
            );
            memboGo.core.event.dispatch('eventFormFieldDraggablecomplete', {
                element: this,
                file: file['link']
            });
        });
    },

    addErrorMessages: function (element, errors) {
        const formGroupElement = $(element).closest('.form-group')
        if (!formGroupElement) {
            return;
        }
        formGroupElement.find('.cancel-pre-upload-file').click();
        formGroupElement.addClass('has-error');
        let htmlError = '<ul class="errors">';
        for (let i in errors) {
            htmlError += '<li>' + errors[i] + '</li>';
        }
        htmlError += '</ul>';
        formGroupElement.append(htmlError);
        const ul = formGroupElement.find('.field_file__draggablecomplete');
        ul.siblings('.field_file__draggable').upload('removeUpload');
    }
};

memboGo.Field.Crop = function (element, options) {
    this.image = null;
    this.opts = {
        viewMode: 2,
        background: false,
        rotatable: true,
        scalable: true,
        modal: false,
        guides: false,
        highlight: false,
        center: true,
        autoCrop: true,
    };
    this.rotateDegree = 45;
    this.maxWidth = 0;
    this.maxHeight = 0;
    this.crop = null;
    this.modal = null;
    this.file = null;
    this.fileType = 'image/jpeg';
    for (i in options) {
        if (i === 'maxWidth') {
            this.maxWidth = options[i];
        } else if (i === 'maxHeight') {
            this.maxHeight = options[i];
        } else {
            this.opts[i] = options[i];
        }
    }

    this.read = function (data, file) {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (typeof 'FileReader' !== 'undefined') {
                memboGo.core.event.remove('remove.before.crop.save');
                self.file = file || self.file;
                memboGo.Field.File.canUseImage(self.file)
                    .then(function (result) {
                        if (result) {
                            self.data = data || self.data;
                            var reader = new FileReader();
                            reader.onload = function (e) {
                                self.initCropper(e);
                            };
                            reader.readAsDataURL(self.file);
                            self.data.$input.val("");
                        }
                        resolve(result);
                    });
            } else {
                resolve(false);
            }
        });
    };

    this.reset = function () {
        if (this.crop !== null) {
            this.crop.destroy();
        }
        if (this.crop === null) {
            this.modal = new HPJUtils.modal('#modal-crop');
        }
        this.modal.close();
    };

    this.initCropper = function (e) {
        var self = this;

        this.reset();
        this.modal.open();

        $('#modal-crop').find('img').attr('src', e.target.result);

        // Set Max Size
        this.opts.crop = function (event) {
            if (parseInt(self.opts.maxWidth) > 0
                && parseInt(self.opts.maxHeight) > 0
                && (event.detail.width > self.opts.maxWidth || event.detail.height > self.opts.maxHeight)
            ) {
                self.crop.setData({width: self.opts.maxWidth, height: self.opts.maxHeight});
            } else {
                $('.cropbox-width').val(Math.floor(event.detail.width));
                $('.cropbox-height').val(Math.floor(event.detail.height));
            }
        };

        // Center and push to max crop box
        this.opts.ready = function (e, aspectRatio) {
            if (!aspectRatio && typeof self.opts.aspectRatio !== 'undefined') {
                aspectRatio = self.opts.aspectRatio;
            }
            if (aspectRatio) {
                self.crop.setAspectRatio(eval(aspectRatio));
            } else {
                self.crop.setAspectRatio(null);
            }
            const data = self.crop.cropBoxData;
            const canvas = self.crop.getCanvasData();
            const maxWidth = Math.floor(data.maxWidth);
            let boxData = {
                width: maxWidth,
                left: canvas.left + ((canvas.width - maxWidth) / 2),
                height: data.maxHeight,
                top: (canvas.height - data.maxHeight) / 2
            };
            if (aspectRatio) {
                if (canvas.width >= canvas.height) {
                    delete boxData.height;
                    delete boxData.top;
                } else {
                    delete boxData.width;
                    delete boxData.left;
                }
            }
            self.crop.setCropBoxData(boxData);
            $(".ratio").removeClass("active");
            if (aspectRatio) {
                $('#modal-crop [data-aspectratio]').filter(function () {
                    return eval($(this).data('aspectratio')) == aspectRatio;
                }).addClass("active");
                $('.input-group-crop .cropbox-height').parent('div')[aspectRatio == 1 ? 'hide' : 'show']();
            }
        };

        this.crop = new Cropper($('#modal-crop').find('img').get(0), this.opts);
        this._event();

        const type = e.target.result.match(/^data:image\/(png|jpeg|gif|webp);/);

        this.fileType = `image/${type?.[1] ?? 'jpeg'}`;
    };

    this._event = function () {
        var self = this;

        $('#modal-crop .drag').unbind('click').click(self.reset);

        $('#modal-crop .modal-yes')
            .unbind('click')
            .click(function (e) {
                e.preventDefault();
                memboGo.core.event.dispatch('remove.before.crop.save');
                self.crop.getCroppedCanvas().toBlob(function (blob) {
                    self.compressImage(blob)
                        .then(function (blob) {
                            if (blob) {
                                var formData = new FormData();
                                formData.append(self.data.postKey, blob, self.file.name);
                                for (var i in self.data.postData) {
                                    if (self.data.postData.hasOwnProperty(i)) {
                                        formData.append(i, self.data.postData[i]);
                                    }
                                }
                                HPJUtils.displayLoadingBox();
                                $.ajax({
                                    url: self.data.action,
                                    data: formData,
                                    dataType: self.data.dataType,
                                    type: "POST",
                                    contentType: false,
                                    processData: false,
                                    cache: false,
                                    success: function (response, status, jqXHR) {
                                        self.reset();
                                        self.data.uploaded++;
                                        self.data.$el.trigger("filecomplete.upload", [{}, response, status, jqXHR, self]);
                                        if (self.data.maxFiles && self.data.maxFiles <= self.data.uploaded) {
                                            self.data.$el.upload("disable");
                                        }
                                        memboGo.core.trackEvent('Dashboard - Confirm Logo');
                                    },
                                    complete: function () {
                                        HPJUtils.hideLoadingBox();
                                    },
                                    error: function (jqXHR, status, error) {
                                    }
                                });
                            }
                        });
                })
            });

        $('#modal-crop .rotate-plus')
            .unbind('click')
            .click(function (e) {
                e.preventDefault();
                self.crop.rotate(self.rotateDegree);
            });

        $('#modal-crop .rotate-minus')
            .unbind('click')
            .click(function (e) {
                e.preventDefault();
                self.crop.rotate(-self.rotateDegree);
            });

        $('#modal-crop .scale-x')
            .unbind('click')
            .click(function (e) {
                e.preventDefault();
                self.crop.scaleX(self.crop.getData().scaleX * -1);
            });

        $('#modal-crop [data-aspectratio]')
            .unbind('click')
            .click(function (e) {
                e.preventDefault();
                self.crop.options.ready(null, eval($(this).data('aspectratio')));
            });

        $('#modal-crop .reset')
            .unbind('click')
            .click(function (e) {
                e.preventDefault();
                self.crop.reset();
                self.crop.options.ready();
            });

        $('.cropbox-width,.cropbox-height')
            .on('keypress', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                } else if (e.key === '+' || e.key === '-') {
                    e.preventDefault();
                    if (!isNaN(parseInt(this.value))) {
                        $(this).val(parseInt(this.value) + (e.key === '+' ? 1 : -1));
                    }
                }
            })
            .on('keyup', function (e) {
                if (e.key === '+' || e.key === '-' || e.key === 'Enter') {
                    $(this).trigger('change');
                }
            })
            .on('change', function (e) {
                e.preventDefault();
                var side = $(this).hasClass('cropbox-height') ? 'height' : 'width',
                    v = parseInt(this.value),
                    i = self.crop.getImageData().width / self.crop.getImageData().naturalWidth,
                    max = Math.round((side === 'height' ? self.crop.cropBoxData.maxHeight : self.crop.cropBoxData.maxWidth) / i);

                this.value = !isNaN(v) && v > 0 && v <= max ? v : max;
                var cropBoxData = {};
                cropBoxData[side] = Math.floor(this.value * i);
                self.crop.setCropBoxData(cropBoxData);
            });
    };

    /**
     * Compress blob image before save it
     *
     * @param blob
     * @returns {Promise<string>}
     */
    this.compressImage = function (blob) {
        var self = this, img = new Image();
        img.src = URL.createObjectURL(blob);
        return new Promise(function (resolve, reject) {
            img.onload = function () {
                var width = img.width, height = img.height;
                if (self.maxWidth > 0 && width > self.maxWidth && width >= height) {
                    height = Math.floor((height *= self.maxWidth / width));
                    width = self.maxWidth;
                } else if (self.maxHeight > 0 && height > self.maxHeight) {
                    width = Math.floor((width *= self.maxHeight / height));
                    height = self.maxHeight;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d', { alpha: true });
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(function (blob) {
                    resolve(blob);
                }, self.fileType, 0.8);
            };
            img.onerror = function (err) {
                reject(null);
            }
        })
    };

    /**
     * Add Restore Action
     */
    this.addRestore = function () {
        var crop = this, _p = this.data.$input.closest('.form-group');
        _p.find('.multifile__actions-file').each(function () {
            $(this).append('<a class="js-crop-file-again"><i class="fontawesome-icon icon-edit fa fa-times"></i></a>');
        });
        _p.on('click', '.js-crop-file-again', function () {
            crop.read();
            memboGo.core.event.listen('remove.before.crop.save', function (e) {
                _p.find('.cancel-pre-upload-file').trigger('click');
            });
        });
    }
};

// Check if file is animated
memboGo.Field.File.canUseImage = function (file) {
    return new Promise(function (resolve, reject) {
        if (typeof file === 'object') {
            var reader = new FileReader();
            reader.readAsArrayBuffer(file);
            return reader.onload = function (e) {
                var dv = new DataView(e.target.result, 10);
                var offset = 0;
                var globalColorTable = dv.getUint8(0);
                var globalColorTableSize = 0;
                if (globalColorTable & 0x80) {
                    globalColorTableSize = 3 * Math.pow(2, (globalColorTable & 0x7) + 1);
                }
                offset = 3 + globalColorTableSize;
                var extensionIntroducer = dv.getUint8(offset);
                var graphicsConrolLabel = dv.getUint8(offset + 1);
                var delayTime = 0;
                if ((extensionIntroducer & 0x21) && (graphicsConrolLabel & 0xF9)) {
                    delayTime = dv.getUint16(offset + 4);
                }
                return resolve(delayTime <= 0);
            }
        }
        resolve(false);
    }).catch(function (error) {
        return false;
    });
};

memboGo.Field.Group = {
    _url: null,
    _default: {
        no_results_text: "",
        placeholder_text_multiple: "",
        inherit_select_classes: true,
        width: "",
        allow_single_deselect: true,
        search_contains: true
    },
    init: function (url, options) {
        if (url.length > 0) {
            try {
                for (a in options) {
                    this._default[a] = options[a];
                }
            } catch (e) {
            }
            this._url = url;
            this.getScript('/js/jquery/ajax-chosen.min.js', function () {
                memboGo.Field.Group.events();
            });
        } else {
            $(".select-other-group:not(.chosen-container),.select-main-group:not(.chosen-container)").each(
                function () {
                    $(this).chosen({
                        no_results_text: "",
                        placeholder_text_multiple: "",
                        inherit_select_classes: true,
                        width: "",
                        allow_single_deselect: true,
                        search_contains: true
                    });
                });
        }
    },
    events: function () {
        var self = this;
        $(".select-other-group:not(.chosen-container),.select-main-group:not(.chosen-container)").each(
            function () {
                $(this).ajaxChosen(
                    {
                        type: 'GET',
                        url: self._url,
                        dataType: 'json',
                        minTermLength: 1,
                        afterTypeDelay: 500,
                        jsonTermKey: "search",
                    },
                    function (data) {
                        var results = [];
                        $.map(data, function (name, id) {
                            results.push({value: id, text: name});
                        });
                        return results;
                    },
                    self._default
                );
            }
        )
    },
    getScript: function (url, success) {
        var script = document.createElement('script');
        script.src = url;
        var head = document.getElementsByTagName('head')[0],
            done = false;
        script.onload = script.onreadystatechange = function () {
            if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
                done = true;
                success();
                script.onload = script.onreadystatechange = null;
                head.removeChild(script);
            }
        };
        head.appendChild(script);
    }
};

memboGo.Field.checkIsUniqueValue = {
    campaignId: null,
    url: null,
    /**
     * Check if a given value is unique
     * @param url string
     */
    init: function (url, campaignId) {
        this.campaignId = campaignId;
        this.url = url;
        var self = this;
        $(document).find('input[type="email"]').each(function () {
            this.setAttribute('data-initialval', this.value);
        });

        $(document)
            .off('change', '[data-is-unique-email]')
            .on('change', '[data-is-unique-email]', function () {
                $(this).closest('.form-group').removeClass('has-error');
                $(this).closest('.form-group').find('.errors, .error').remove();
                if (this.value.length > 0 && this.value !== this.getAttribute('data-initialval')) {
                    self.validate(this);
                }
            });
    },
    validate: function (element) {
        $.ajax({
            type: 'POST',
            url: this.url,
            data: {
                campaignId: this.campaignId,
                alias: $(element).data('is-unique-email'),
                email: $(element).val()
            },
            dataType: 'json',
            success: function (data) {
                if (!data.result) {
                    $(element).closest('.form-group').addClass('has-error');
                    $(element).after(data.error);
                }
            }
        });
    }
};

memboGo.Field.Autocomplete = {
    types: ['city', 'state', 'country', 'zip_code', 'zip'],
    mapKey: null,
    word: '~@~',
    init: function () {
        if (!memboGo.core.googlePlace?.key?.length) {
            return;
        }
        var items = document.querySelectorAll('[data-autocomplete-address]'), i, form;
        if (items.length) {
            if (items.length) {
                for (i = 0; i < items.length; i++) {
                    try {
                        items[i].parentElement.dataset.id = items[i].id.replace('_street', '_' + this.word);
                        items[i].removeAttribute('data-autocomplete-address');
                        if ((form = this.getForm(items[i])) !== null) {
                            this.initElementMap(form, items[i]);
                        }
                    } catch (e) {
                        memboGo.core.dispatchException(e);
                    }
                }
            }

            if (memboGo.core.googlePlace.init(memboGo.Field.Autocomplete.initAutocomplete)) {
                memboGo.Field.Autocomplete.initAutocomplete();
            }
        }
    },
    initElementMap: function (form, element) {
        var clone = element.cloneNode(), i;
        clone.removeAttribute('id');
        clone.removeAttribute('name');
        clone.classList.add('form-field-autocomplete');
        clone.style.display = 'none';
        clone.value = '';
        element.parentNode.insertBefore(clone, element);
        this.addAction(element, false);
        this.addAction(clone, true);
        clone.addEventListener('keypress', function (e) {
            if (e.keyCode === 13) {
                e.stopPropagation();
                e.preventDefault();
            }
        });
        if (this.isAddressEmpty(form, element.parentElement.dataset.id)) {
            this.autocomplete(element);
        }
    },
    getForm: function (el) {
        while (el) {
            el = el.parentElement;
            if (el === null || el.tagName === 'FORM') {
                return el;
            }
        }
    },
    addAction: function (el, manual) {
        var nodeElement = document.createElement('a');
        if (manual) {
            nodeElement.setAttribute('class', 'address_autocomplete_off');
            nodeElement.innerText = fieldText.manual;
            nodeElement.style.display = 'none';
        } else {
            nodeElement.setAttribute('class', 'address_autocomplete_on');
            nodeElement.innerText = fieldText.autocomplete;
        }
        nodeElement.addEventListener('click', function (e) {
            e.stopPropagation();
            memboGo.Field.Autocomplete.autocomplete(this);
        });
        el.parentNode.insertBefore(nodeElement, el.nextSibling);
    },
    autocomplete: function (element) {
        var form = this.getForm(element), id = element.parentElement.dataset.id, i, elementId;
        if (form !== null) {
            var childs = element.parentElement.children;
            for (i = 0; i < childs.length; i++) {
                childs[i].style.display = childs[i].style.display === 'none' ? 'block' : 'none';
            }
            for (i in this.types) {
                elementId = id.replace(this.word, this.types[i]);
                if (typeof form.elements[elementId] !== 'undefined') {
                    this.toggle(form.elements[elementId]);
                }
            }
        }
    },
    toggle: function (el) {
        while (el) {
            el = el.parentElement;
            if (el.classList.contains('form-group')) {
                if (el.parentElement.children.length === 1) {
                    el = el.parentElement;
                }
                if (el.classList.contains('hidden')) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
                break;
            }
        }
    },
    isAddressEmpty: function (form, id) {
        var address = ['street', 'city', 'zip_code', 'zip'];
        for (i in address) {
            var elementId = id.replace(this.word, address[i]);
            if (typeof form.elements[elementId] !== 'undefined' && form.elements[elementId].value.length > 0) {
                return false;
            }
        }
        return true;
    },
    initAutocomplete: function () {
        var items = document.getElementsByClassName('form-field-autocomplete'),
            i,
            form,
            mapField,
            self = memboGo.Field.Autocomplete;
        if (items.length) {
            for (i = 0; i < items.length; i++) {
                var element = items[i];
                if ((form = self.getForm(element)) !== null) {
                    mapField = self.getMapField(element.parentElement.dataset.id);
                    (new google.maps.places.Autocomplete(element, {types: ['geocode'], fields: ['address_component']}))
                        .addListener('place_changed', function () {
                            var data = memboGo.core.googlePlace.placeData(this.getPlace());
                            for (i in mapField) {
                                if (typeof form.elements[mapField[i]] !== 'undefined') {
                                    form.elements[mapField[i]].value = data[i] || '';
                                    if (i === 'country') {
                                        form.elements[mapField[i]].dispatchEvent(new Event('change', {bubbles: true}));
                                    } else if (i === 'administrative_area_level_1') {
                                        form.elements[mapField[i]].dataset.targetValue = data[i] || '';
                                    }
                                }
                            }
                        });

                    // Fix for Chrome
                    if (navigator.userAgent.indexOf("Chrome") !== -1) {
                        setTimeout(function () {
                            element.setAttribute('autocomplete', 'disabled');
                        }, 500);
                    }
                }
            }
        }
    },
    getMapField: function (name) {
        return {
            'street': name.replace(this.word, 'street'),
            'locality': name.replace(this.word, 'city'),
            'administrative_area_level_1': name.replace(this.word, 'state'),
            'country': name.replace(this.word, 'country'),
            'zip': name.replace(this.word, 'zip'),
            'zip_code': name.replace(this.word, 'zip_code'),
        };
    },
};

memboGo.Field.Conditional.init();
