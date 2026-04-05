if (typeof memboGo === 'undefined') {
    var memboGo = {};
}

if (typeof memboGo.Web === 'undefined') {
    memboGo.Web = {};
}

memboGo.Web.Consent = {
    ga4: '',
    hotjarId: '',
    facebookId: '',
    ga: {},

    init: function (enable, translate, lang) {
        var self = this;
        this.prepareLPVPConsent(translate, lang);
        if (enable) {
            var s = document.createElement('script');
            s.src = 'https://cdn.kiprotect.com/klaro/v0.7.18/klaro.js';
            s.defer = true;
            s.setAttribute('data-klaro-config', 'lpvpConsent');
            s.addEventListener('load', () => {
                window.dispatchEvent(new Event('klaroLoaded'));
            });
            document.head.appendChild(s);
        } else {
            self.rgpd();
            $.map(window.lpvpConsent.services, function (item) {
                item.callback(true, item);
            });
        }
    },

    gtm: function (tags) {
        try {
            for (let layer in tags) {
                this.addGtmScript(tags[layer], layer);
            }
        } catch (e) {
            memboGo.core.dispatchException(e);
        }
    },

    rgpd: function () {
        if (typeof RGPDContent !== 'undefined') {
            window.addEventListener("load", function () {
                window.cookieconsent.initialise({
                    "palette": {
                        "popup": {
                            "background": "#858585F2"
                        },
                        "button": {
                            "background": "transparent"
                        }
                    },
                    "theme": "edgeless",
                    "content": RGPDContent,
                    "position": "bottom"
                })
            });
            $(document).on('click', '.cc-link', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if ($('#modal-user-consent').length) {
                    modalUserConsent.open();
                } else {
                    $.get($(this).attr('href'), function (data) {
                        $('body').append(data);
                    });
                }
            });
        }
    },

    googleAnalytics: function (id) {
        if (typeof this.ga[id] !== 'undefined') {
            return;
        }
        const layer = 'gaLayer';
        this.ga[id] = 1;
        this.addGtmScript(id, layer);
        window.ga4 = function () {
            window[layer].push(arguments)
        };
        window.ga4('config', id);
    },

    addGtmScript: function (id, layer, callback) {
        $('body').append('<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=' + id + '" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>');

        (function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
            let f = d.getElementsByTagName(s)[0],
                j = d.createElement(s),
                dl = l !== 'dataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j, f);

            if (typeof callback === 'function') {
                callback();
            }

        })(window, document, 'script', layer, id);
    },

    fbPixel: function (id) {
        if (window.fbq) return;
        $('header').append('<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=' + id + '&ev=PageView&noscript=1" alt=""/></noscript>');
        var n = window.fbq = function () {
            n.callMethod ?
                n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        };
        if (!window._fbq) window._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        var t = document.createElement('script');
        t.async = !0;
        t.src = 'https://connect.facebook.net/en_US/fbevents.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(t, s);
        window.fbq('init', id);
        window.fbq('track', 'PageView');
    },

    gtmTrack: function (name) {
        memboGo.core.trackEvent('LPVP-' + name + '-Accepted');
    },

    prepareLPVPConsent: function (translate, lang) {
        window.lpvpConsent = {
            lang: lang,
            translations: {},
            version: 1,
            elementID: 'lpvp-consent-box',
            styling: {
                theme: ['light', 'top', 'wide'],
            },
            noAutoLoad: true,
            htmlTexts: true,
            embedded: false,
            groupByPurpose: false,
            storageMethod: 'cookie',
            cookieName: 'lpvp-consent',
            cookieExpiresAfterDays: 365,
            default: false,
            mustConsent: false,
            acceptAll: true,
            hideDeclineAll: false,
            hideLearnMore: false,
            noticeAsModal: false,
            disablePoweredBy: true,
            additionalClass: 'lpvp-consent',
            show: false,
            services: [
                {
                    name: 'Google-Analytics',
                    contextualConsentOnly: false,
                    callback: function (c, s) {
                        if (c) {
                            memboGo.Web.Consent.gtmTrack(s.name);

                            if (memboGo.Web.Consent.ga4 !== '') {
                                memboGo.Web.Consent.googleAnalytics(memboGo.Web.Consent.ga4);
                            }

                        } else {
                            memboGo.Web.Consent.clearCookies(s.cookies);
                        }
                        memboGo.Web.Consent.gtmTrack('Drip')
                    },
                    cookies: [
                        {
                            pattern: '^_(ga|gid|dc_gtm_UA-)',
                            path: '/'
                        }
                    ]

                },
                {
                    name: 'Google-Ads',
                    contextualConsentOnly: false,
                    callback: function (c, s) {
                        if (c) {
                            memboGo.Web.Consent.gtmTrack(s.name);
                        } else {
                            memboGo.Web.Consent.clearCookies(s.cookies);
                        }
                    },
                    cookies: [
                        {
                            pattern: '^_gcl_au',
                            path: '/'
                        }
                    ]
                },
                {
                    name: 'Amplitude',
                    contextualConsentOnly: false,
                    callback: function (c, s) {
                        if (c) {
                            memboGo.Web.Consent.gtmTrack(s.name);
                        } else {
                            memboGo.Web.Consent.clearCookies(s.cookies);
                        }
                    },
                    cookies: [
                        {
                            pattern: '^amplitude_',
                            path: '/'
                        }
                    ]
                },
                {
                    name: 'Hotjar',
                    contextualConsentOnly: false,
                    callback: function (c, s) {
                        if (c) {
                            memboGo.Web.Consent.gtmTrack(s.name);
                            memboGo.Web.Consent.hotjarId !== '' && memboGo.core.hotjar(memboGo.Web.Consent.hotjarId)
                        } else {
                            memboGo.Web.Consent.clearCookies(s.cookies);
                        }
                    },
                    cookies: [
                        {
                            pattern: '^_(hjid|hjAbsoluteSessionInProgress|hjTLDTest|hjSession|hjFirstSeen|hjIncludedInPageviewSample)',
                            path: '/'
                        }
                    ]
                },
                {
                    name: 'Facebook',
                    contextualConsentOnly: false,
                    callback: function (c, s) {
                        if (c) {
                            memboGo.Web.Consent.gtmTrack(s.name);
                            memboGo.Web.Consent.facebookId !== '' && memboGo.Web.Consent.fbPixel(memboGo.Web.Consent.facebookId);
                        } else {
                            memboGo.Web.Consent.clearCookies(s.cookies);
                        }
                    },
                    cookies: [
                        {
                            pattern: '^_fbp',
                            path: '/'
                        }
                    ]
                },
                {
                    name: 'Sentry',
                    contextualConsentOnly: false,
                    callback: function (c, s) {
                        if (c) {
                            window.dispatchEvent(new CustomEvent('consentGiven', {detail: 'sentry'}));
                        }
                    }
                }
            ]
        };
        window.lpvpConsent.translations[lang] = translate;
    },
    /* Note: We have to clear cookies for all domain variations which is something currently not supported by klaro.
             See https://github.com/kiprotect/klaro/issues/51
    */
    clearCookies: function (cookies) {
        if (!cookies && typeof cookies[0].pattern === 'undefined') {
            return;
        }
        var domain = window.location.hostname.split('.').slice(-2).join('.'),
            r = new RegExp(cookies[0].pattern),
            items = document.cookie.split(";");
        for (var i = 0; i < items.length; i++) {
            var name = items[i].split('=')[0].trim();
            if (r.exec(name)) {
                name += "=; Max-Age=-99999999; path=" + cookies[0].path + "; domain=";
                document.cookie = name + domain + ";";
                document.cookie = name + "." + domain + ";";

                // Because some cookies saved in membogo.com domain
                if (domain !== 'membogo.com') {
                    document.cookie = name + ".membogo.com;";
                }
            }
        }
    }
}

memboGo.Web.Menu = {
	vertical: function (ul) {
		var children = document.querySelector(ul).querySelectorAll('.has-children'), self = this;
		for (var i = 0; i < children.length; i++) {
			children[i].addEventListener("click", function (e) {
				e.stopPropagation();
				self.show(this, null);
			});

			children[i].addEventListener("mouseenter", function (e) {
				if (window.innerWidth > 992) {
					e.stopPropagation();
					self.show(this, true);
				}
			});

			children[i].addEventListener("mouseleave", function (e) {
				if (window.innerWidth > 992) {
					e.stopPropagation();
					self.show(this, false);
				}
			});
		}
	},
	show: function (that, state) {
		var id = that.getAttribute('data-menu-id'),
			submenu = document.getElementById('submenu_' + id);
		if (state === null) {
			state = submenu.style.display === 'none';
		}
		submenu.style.display = state ? 'block' : 'none';

		// On desktop, we check if submenu is outside of right viewport.
		// If it'ts the case, we display it on bottom.
		if (window.innerWidth > 992) {
			var submenuIsOutOfRightViewport = memboGo.core.utils.elementIsOutOfViewport(submenu).right,
				dropdownToggle = submenu.previousElementSibling,
				caret = dropdownToggle.querySelector(".caret");

			if (submenuIsOutOfRightViewport) {
				submenu.classList.add("bottom");
				dropdownToggle.classList.add("bottom");
				submenu.parentNode.style.display = "inline-block";
			} else {
				submenu.classList.remove("bottom");
				dropdownToggle.classList.remove("bottom");
				submenu.parentNode.style.display = "flex";
			}

			// Fix caret
			caret.className = submenuIsOutOfRightViewport ? "caret" : "caret caret-right";
		} else {
			submenu.parentNode.style.display = "inline-block";
		}
	},
}
