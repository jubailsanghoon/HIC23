/**
 * shared-header-kit/header-kit.js
 * 공용 표준 상단 헤더 키트 자바스크립트 모듈 (v1.0)
 */

const HeaderKit = (() => {
    let _config = {
        version: "v2.4",
        isPro: false,
        defaultLang: "ko",
        onThemeChange: null,
        onLanguageChange: null,
        onLicenseClick: null,
        onHelpClick: null
    };

    let _currentLang = "ko";
    let _isPro = false;
    let _theme = "light";

    const LANG_FLAGS = {
        ko: "shared-header-kit/icons/flag_ko.png",
        en: "shared-header-kit/icons/flag_en.png",
        zh: "shared-header-kit/icons/flag_zh.png",
        ja: "shared-header-kit/icons/flag_ja.png",
        es: "shared-header-kit/icons/flag_es.png"
    };

    const init = (cfg = {}) => {
        _config = Object.assign({}, _config, cfg);
        _currentLang = _config.defaultLang || localStorage.getItem('HI_LANG') || 'ko';
        _isPro = Boolean(_config.isPro);
        
        setVersion(_config.version || "v2.4");
        setProStatus(_isPro);
        setLanguage(_currentLang, false);
        bindEvents();
    };

    const bindEvents = () => {
        // 1. 라이선스 뱃지 클릭
        const proBadge = document.getElementById('proBadge');
        if (proBadge) {
            proBadge.onclick = (e) => {
                e.stopPropagation();
                if (typeof _config.onLicenseClick === 'function') {
                    _config.onLicenseClick(_isPro);
                }
            };
        }

        // 2. 다크모드 토글
        const btnDark = document.getElementById('btnDarkMode');
        if (btnDark) {
            btnDark.onclick = (e) => {
                e.stopPropagation();
                toggleTheme();
            };
        }

        // 3. 원형 국기 언어 드롭다운 토글
        const btnLang = document.getElementById('btnLangDropdown');
        const menuLang = document.getElementById('langDropdownMenu');
        const wrapLang = document.querySelector('.lang-dropdown-wrap');

        if (btnLang && menuLang) {
            btnLang.onclick = (e) => {
                e.stopPropagation();
                const isOpen = !menuLang.classList.contains('hidden');
                if (isOpen) {
                    menuLang.classList.add('hidden');
                    if (wrapLang) wrapLang.classList.remove('open');
                } else {
                    menuLang.classList.remove('hidden');
                    if (wrapLang) wrapLang.classList.add('open');
                }
            };

            document.addEventListener('click', (e) => {
                if (!menuLang.contains(e.target) && !btnLang.contains(e.target)) {
                    menuLang.classList.add('hidden');
                    if (wrapLang) wrapLang.classList.remove('open');
                }
            });

            const items = menuLang.querySelectorAll('.lang-item');
            items.forEach(item => {
                item.onclick = (e) => {
                    e.stopPropagation();
                    const lang = item.getAttribute('data-lang');
                    menuLang.classList.add('hidden');
                    if (wrapLang) wrapLang.classList.remove('open');
                    setLanguage(lang, true);
                };
            });
        }

        // 4. 도움말 버튼
        const btnManual = document.getElementById('btnManual');
        if (btnManual) {
            btnManual.onclick = (e) => {
                e.stopPropagation();
                if (typeof _config.onHelpClick === 'function') {
                    _config.onHelpClick();
                }
            };
        }

        // 5. WiFi 통신 상태 뱃지 클릭
        const netBadge = document.getElementById('netStatusBadge');
        if (netBadge) {
            netBadge.onclick = (e) => {
                e.stopPropagation();
                if (typeof MainController !== 'undefined' && typeof MainController.handleNetBadgeClick === 'function') {
                    MainController.handleNetBadgeClick();
                }
            };
        }
    };

    const setVersion = (ver) => {
        const el = document.getElementById('appVersionBadge');
        if (el) el.innerText = ver;
    };

    const setProStatus = (isPro, customText = null, mode = 'auto') => {
        _isPro = Boolean(isPro);
        const el = document.getElementById('proBadge');
        if (!el) return;

        el.classList.remove('is-pro', 'is-trial', 'is-free');

        if (customText) {
            el.innerText = customText;
        } else {
            el.innerText = _isPro ? "Pro" : "Free";
        }

        if (mode === 'trial' || (customText && customText.includes('체험'))) {
            el.classList.add('is-trial');
            el.style.backgroundColor = '#f59f00';
            el.style.color = '#ffffff';
        } else if (_isPro) {
            el.classList.add('is-pro');
            el.style.backgroundColor = 'var(--hk-pro-green)';
            el.style.color = '#ffffff';
        } else {
            el.classList.add('is-free');
            el.style.backgroundColor = 'var(--hk-btn-bg)';
            el.style.color = 'var(--hk-text)';
        }
    };

    const setNetStatus = (isOnline, title = "온라인") => {
        const el = document.getElementById('netStatusBadge');
        if (!el) return;
        el.classList.toggle('online', Boolean(isOnline));
        el.classList.toggle('offline', !isOnline);
        el.title = title || (isOnline ? "온라인" : "오프라인");
    };

    const setLanguage = (lang, triggerCallback = true) => {
        if (!lang) return;
        _currentLang = lang;
        localStorage.setItem('HI_LANG', lang);

        const flagEl = document.getElementById('currentFlagIcon');
        const flagSrc = LANG_FLAGS[lang] || LANG_FLAGS.ko;
        if (flagEl) {
            flagEl.innerHTML = `<img src="${flagSrc}" alt="${lang.toUpperCase()}" />`;
        }

        const menuLang = document.getElementById('langDropdownMenu');
        if (menuLang) {
            menuLang.querySelectorAll('.lang-item').forEach(item => {
                item.classList.toggle('active', item.getAttribute('data-lang') === lang);
            });
        }

        if (triggerCallback && typeof _config.onLanguageChange === 'function') {
            _config.onLanguageChange(lang);
        }
    };

    const setTitle = (fullTitle, shortTitle) => {
        const fullEl = document.querySelector('#appTitle .title-full');
        const shortEl = document.querySelector('#appTitle .title-short');
        if (fullEl && fullTitle) fullEl.innerText = fullTitle;
        if (shortEl && shortTitle) shortEl.innerText = shortTitle;
    };

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        _theme = isDark ? 'dark' : 'light';
        localStorage.setItem('HI_THEME', _theme);
        if (typeof _config.onThemeChange === 'function') {
            _config.onThemeChange(_theme);
        }
    };

    return {
        init,
        setVersion,
        setProStatus,
        setNetStatus,
        setLanguage,
        setTitle,
        toggleTheme
    };
})();
