/**
 * js/main.js
 * 메인 컨트롤러 (이력 관리, 다국어 동기화, PRO 인증, 지연 로딩 기반 스캐너/라벨 인쇄 분리 모달 및 정밀 OCR 파싱)
 */
const MainController = (() => {
    // 프라이빗 클로저 보안 영역 (콘솔 조작 및 소스코드 평문 검색 방지)
    const _B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    // XOR 난독화된 시크릿 및 마스크 솔트
    const _SC_ENC = [157, 225, 147, 231, 152, 250, 158, 251, 146, 248];
    const _MS_ENC = [226, 227, 158, 154, 245, 231, 235, 249, 225, 245, 252, 158, 154];
    const _decBytes = arr => arr.map(b => String.fromCharCode(b ^ 0xAA)).join('');

    // 비보안 컨텍스트(file://, http://)에서도 동일하게 작동하는 순수 JS SHA-256 폴백
    const _pureSha256 = ascii => {
        const rightRotate = (v, a) => (v >>> a) | (v << (32 - a));
        const mathPow = Math.pow, maxWord = mathPow(2, 32);
        let i, j, result = '';
        const words = [], asciiBitLength = ascii.length * 8;
        let hash = [
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
            0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
        ];
        const k = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        ];
        ascii += '\x80';
        while (ascii.length % 64 - 56) ascii += '\x00';
        for (i = 0; i < ascii.length; i++) {
            j = ascii.charCodeAt(i);
            if (j >> 8) return new Uint8Array(32);
            words[i >> 2] |= j << ((3 - i) % 4) * 8;
        }
        words[words.length] = ((asciiBitLength / maxWord) | 0);
        words[words.length] = (asciiBitLength);
        for (j = 0; j < words.length;) {
            const w = words.slice(j, j += 16);
            const oldHash = hash.slice(0);
            for (i = 0; i < 64; i++) {
                const i2 = i + j;
                const w15 = w[i - 15], w2 = w[i - 2];
                const a = hash[0], e = hash[4];
                const temp1 = hash[7]
                    + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                    + ((e & hash[5]) ^ ((~e) & hash[6]))
                    + k[i]
                    + (w[i] = (i < 16) ? w[i] : (
                        w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                    ) | 0);
                const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                    + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
                hash = [(temp1 + temp2) | 0].concat(hash);
                hash[4] = (hash[4] + temp1) | 0;
                hash.pop();
            }
            for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
        }
        const out = new Uint8Array(32);
        for (i = 0; i < 8; i++) {
            out[i * 4] = (hash[i] >>> 24) & 0xff;
            out[i * 4 + 1] = (hash[i] >>> 16) & 0xff;
            out[i * 4 + 2] = (hash[i] >>> 8) & 0xff;
            out[i * 4 + 3] = hash[i] & 0xff;
        }
        return out;
    };

    const _sha256Bytes = async ascii => {
        try {
            if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
                const data = new TextEncoder().encode(ascii);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                return new Uint8Array(hashBuffer);
            }
        } catch (e) {}
        return _pureSha256(ascii);
    };

    const _DEVICE_KEY = 'HI_DEVICE_ID_V27';
    const _getDeviceCode = () => {
        try {
            // 1. 이미 활성화된 PRO 라이선스가 있는 경우 해당 기기번호를 최우선 유지 (기존 활성 사용자 보호)
            const savedLic = JSON.parse(localStorage.getItem('HI_PRO_LICENSE_V2') || 'null');
            if (savedLic && savedLic.code && typeof savedLic.code === 'string') {
                const parts = savedLic.code.split('-');
                if (parts.length >= 2 && /^[0-9A-Z]{5}$/.test(parts[1]) && !parts[1].startsWith('VIP')) {
                    localStorage.setItem(_DEVICE_KEY, parts[1]);
                    return parts[1];
                }
            }
            // 2. 이미 발급되어 저장된 V27 기기번호가 있으면 재사용
            const saved = (localStorage.getItem(_DEVICE_KEY) || '').trim().toUpperCase();
            if (/^[0-9A-Z]{5}$/.test(saved) && !saved.startsWith('VIP')) return saved;
        } catch (e) {}

        // 3. 순수 하드웨어 스펙 기반 100% 결정적(Deterministic) 고유 지문 생성 (브라우저 변경/난수 무관)
        let glRenderer = '';
        try {
            const cnv = document.createElement('canvas');
            const gl = cnv.getContext('webgl') || cnv.getContext('experimental-webgl');
            if (gl) {
                const dbg = gl.getExtension('WEBGL_debug_renderer_info');
                glRenderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : String(gl.getParameter(gl.RENDERER) || '');
            }
        } catch (e) {}

        // 화면 회전(가로/세로 모드)에 영향받지 않도록 짧은 축과 긴 축으로 정규화
        let scrDim = '';
        try {
            if (typeof screen !== 'undefined') {
                const sw = Math.min(screen.width || 0, screen.height || 0);
                const sh = Math.max(screen.width || 0, screen.height || 0);
                scrDim = `${sw}x${sh}x${screen.colorDepth || 24}`;
            }
        } catch (e) {}

        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1).toFixed(2) : '1.00';
        const navHw = typeof navigator !== 'undefined' ? [
            navigator.platform || '',
            navigator.hardwareConcurrency || 4,
            navigator.maxTouchPoints || 0
        ].join('|') : '';

        // 캔버스 2D 서브픽셀/GPU 렌더링 핑거프린트
        let canvasFp = '';
        try {
            const c2 = document.createElement('canvas');
            c2.width = 160; c2.height = 30;
            const ctx = c2.getContext('2d');
            if (ctx) {
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial, sans-serif';
                ctx.fillStyle = '#ff7f00';
                ctx.fillRect(0, 0, 80, 20);
                ctx.fillStyle = '#12b886';
                ctx.fillText('HIC-2027', 10, 4);
                canvasFp = c2.toDataURL();
            }
        } catch (e) {}

        const hwRaw = [scrDim, dpr, navHw, glRenderer, canvasFp].join('||');
        const hwHash = _pureSha256('HIC27_HW_' + hwRaw);

        // 난수(Random)를 완전 배제하고 5자리 모두 하드웨어 해시로부터 추출
        let code = '';
        for (let i = 0; i < 5; i++) {
            code += _B32[hwHash[i] & 31];
        }
        if (code.startsWith('VIP')) code = 'V1P' + code.slice(3);

        try { localStorage.setItem(_DEVICE_KEY, code); } catch (e) {}
        return code;
    };

    const _REVOKED_KEY = 'HI_REVOKED_CODES_V23';

    const _isCodeRevoked = rawCode => {
        try {
            const list = JSON.parse(localStorage.getItem(_REVOKED_KEY) || '[]');
            return Array.isArray(list) && list.includes(rawCode);
        } catch (e) {
            return false;
        }
    };

    
    const _generateDeviceCode = (appPrefix, dev) => {
        const prefix = appPrefix || 'HEAT';
        const devCode = (dev || _getDeviceCode()).toUpperCase();
        const secretCore = _decBytes(_SC_ENC);
        const maskSalt = _decBytes(_MS_ENC);
        const saltInput = maskSalt + prefix + devCode;
        const mask = _pureSha256(saltInput);
        let g23 = "";
        for (let i = 0; i < 10; i++) {
            const idx = _B32.indexOf(secretCore.charAt(i)) ^ (mask[i] & 31);
            g23 += _B32.charAt(idx);
        }
        return `${prefix}-${devCode}-${g23.slice(0, 5)}-${g23.slice(5, 10)}`;
    };

    const _verifyCodeDetailSync = rawCode => {
        if (!rawCode || !/^([A-Z0-9]{3,5})-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(rawCode)) {
            return { ok: false, reason: 'FORMAT' };
        }
        const parts = rawCode.split('-');
        const prefix = parts[0];
        const g1 = parts[1];
        const g23 = parts[2] + parts[3];
        const devCode = _getDeviceCode();

        // 앱 식별자 검증: 본 입열량 계산기에서는 'HEAT' (표준) 및 'HI40' (레거시 호환)만 수용
        if (prefix !== 'HEAT' && prefix !== 'HI40') {
            return { ok: false, reason: 'APP_MISMATCH', prefix, codeDevice: g1, currentDevice: devCode };
        }

        try {
            const secretCore = _decBytes(_SC_ENC);
            const maskSalt = _decBytes(_MS_ENC);

            // HI40은 레거시 호환 (maskSalt + g1), HEAT는 신규 표준 (maskSalt + 'HEAT' + g1)
            const saltInput = (prefix === 'HI40') ? (maskSalt + g1) : (maskSalt + 'HEAT' + g1);
            const mask = _pureSha256(saltInput);
            for (let i = 0; i < 10; i++) {
                const expectedIdx = _B32.indexOf(secretCore[i]) ^ (mask[i] & 31);
                if (_B32[expectedIdx] !== g23[i]) return { ok: false, reason: 'SIGNATURE' };
            }
            if (g1 !== devCode && !g1.startsWith('VIP')) {
                return { ok: false, reason: 'DEVICE_MISMATCH', codeDevice: g1, currentDevice: devCode };
            }
            if (_isCodeRevoked(rawCode)) {
                return { ok: false, reason: 'REVOKED', codeDevice: g1, currentDevice: devCode };
            }
            return { ok: true, reason: 'OK', prefix, codeDevice: g1, currentDevice: devCode };
        } catch (e) {
            return { ok: false, reason: 'ERROR' };
        }
    };

    const _verifyCodeDetail = async rawCode => _verifyCodeDetailSync(rawCode);

    const _verifyCodeInternal = async rawCode => {
        const res = _verifyCodeDetailSync(rawCode);
        return res.ok;
    };

    const _checkProSynchronous = () => {
        try {
            const raw = localStorage.getItem('HI_PRO_LICENSE_V2');
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.code) return false;
            const res = _verifyCodeDetailSync(parsed.code);
            return Boolean(res && res.ok === true);
        } catch (e) {
            return false;
        }
    };
    let _proVerifiedState = _checkProSynchronous();

    const ctrl = {
    STORAGE_LOG_KEY: 'HI_CALC_RECORDS_V2',
    LICENSE_KEY: 'HI_PRO_LICENSE_V2',
    LICENSE_API_URL_KEY: 'HI_LICENSE_API_URL_V23',
    DEFAULT_LICENSE_API_URL: 'https://script.google.com/macros/s/AKfycbwM6ExFgIRdOUP_POvhSQ1S0C5V9heKiSJ9fyuqKLRrIfy663qhhP8ULKQPk_00F_nFag/exec',
    LAST_WORK_STATE_KEY: 'HI_LAST_WORK_STATE_V23',
    OFFLINE_QUEUE_KEY: 'HI_OFFLINE_SYNC_QUEUE_V23',
    SHORTCUT_PROMPT_KEY: 'HI_SHORTCUT_ADDED_V23_PC_AUTO',
    get isPro() { return Boolean(_proVerifiedState); },
    set isPro(_val) { /* 외부 콘솔에서의 강제 할당(MainController.isPro = true) 무시 */ },
    _currentModalType: null,
    _isRestoringWorkState: false,
    _toastTimer: null,
    _deferredInstallPrompt: null,

    t: function(key, params) {
        return (typeof DataStore !== 'undefined' && typeof DataStore.t === 'function')
            ? DataStore.t(key, params)
            : key;
    },

    init: async function() {
        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.toggle('is-free-mode', !_proVerifiedState);
        }
        this.registerServiceWorker();
        const savedLang = localStorage.getItem('HI_LANG') || 'ko';
        const langSelect = document.getElementById('langSelect');
        if (langSelect) langSelect.value = savedLang;
        
        await this.checkProStatus();
        this.restoreLastWorkState();
        this.changeLanguage(savedLang);
        if (typeof Calculator !== 'undefined') Calculator.calculate();
        this.bindNetworkEvents();
        this.updateNetStatusUI();
        if (navigator.onLine === false) {
            this.showSyncToast(this.t('net_offline_notice'), 'offline-mode', 6000);
        } else {
            if (this.getPendingSyncCount() > 0) {
                await this.syncOfflineRecords(true);
            }
            this.syncRemoteLicenseStatus();
        }
        // 1분마다 48시간 조건부 PRO 만료 여부 자동 점검
        setInterval(() => {
            this.checkProStatus();
        }, 60000);
        this.checkFirstRunShortcutPrompt();
        this.checkKakaoInAppBanner();
    },

    checkKakaoInAppBanner: function() {
        try {
            const ua = (navigator.userAgent || '').toLowerCase();
            if (ua.indexOf('kakaotalk') !== -1) {
                const overlay = document.getElementById('kakaoInAppOverlay');
                if (overlay) {
                    overlay.classList.remove('hidden');
                    overlay.style.display = 'flex';
                }
                const banner = document.getElementById('kakaoInAppBanner');
                if (banner) {
                    banner.classList.remove('hidden');
                    banner.style.display = 'flex';
                }
            }
        } catch (e) {}
    },

    escapeKakaoInApp: function() {
        const url = window.location.href;
        const ua = (navigator.userAgent || '').toLowerCase();
        if (/iphone|ipad|ipod/i.test(ua)) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    alert('주소가 복사되었습니다!\n\nSafari(사파리) 브라우저를 열고 주소창에 "붙여넣기 및 이동"을 해주세요.');
                }).catch(() => {
                    alert('Safari(사파리) 브라우저로 접속해 주세요:\n' + url);
                });
            } else {
                alert('Safari(사파리) 브라우저로 접속해 주세요:\n' + url);
            }
        } else {
            // Android: 카카오톡 전용 외부 브라우저 호출 스킴 및 Intent 스킴 연속 시도 (사용자 기본 브라우저 열기)
            try {
                location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
            } catch (e) {
                const rawHost = url.replace(/^https?:\/\//i, '');
                location.href = 'intent://' + rawHost + '#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end';
            }
        }
    },

    registerServiceWorker: function() {
        try {
            if (window.__deferredInstallPrompt) {
                this._deferredInstallPrompt = window.__deferredInstallPrompt;
            }
            if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:')) {
                navigator.serviceWorker.register('./sw.js').then(reg => {
                    if (reg) reg.update();
                    return navigator.serviceWorker.ready;
                }).then(() => {
                    if (!this._deferredInstallPrompt && !window.__deferredInstallPrompt) {
                        const mLink = document.getElementById('appManifestLink');
                        if (mLink) mLink.href = 'manifest.json?sw=1';
                    }
                }).catch(() => {});
            }
            window.addEventListener('beforeinstallprompt', e => {
                e.preventDefault();
                this._deferredInstallPrompt = e;
                window.__deferredInstallPrompt = e;
            });
            window.addEventListener('appinstalled', () => {
                this._deferredInstallPrompt = null;
                window.__deferredInstallPrompt = null;
                localStorage.setItem(this.SHORTCUT_PROMPT_KEY, 'true');
                this.showSyncToast(this.t('net_offline_notice'), 'online-synced', 6000);
            });
        } catch (e) {}
    },

    isStandaloneMode: function() {
        try {
            return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || Boolean(window.navigator.standalone);
        } catch (e) {
            return false;
        }
    },

    checkFirstRunShortcutPrompt: function() {
        try {
            if (this.isStandaloneMode()) return;
            if (localStorage.getItem(this.SHORTCUT_PROMPT_KEY) === 'true') return;
            this.openShortcutModal(true);
        } catch (e) {}
    },

    openShortcutModal: function(isFirstRun = false) {
        const modal = document.getElementById('subPageModal');
        const title = document.getElementById('subPageTitle');
        const body = document.getElementById('subPageBody');
        if (!modal || !title || !body) return;

        this._currentModalType = 'shortcut';
        title.innerText = this.t('shortcut_modal_title');
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

        body.innerHTML = `
            <!-- 배너 버튼 -->
            <button type="button" onclick="MainController.triggerAddHomeShortcut()" style="width:100%; text-align:left; background-color:var(--brand-orange); padding:16px 18px; border-radius:10px; color:#fff; font-weight:800; margin-bottom:14px; border:2px solid #ea580c; cursor:pointer; box-shadow:0 4px 12px rgba(255,127,0,0.28); display:block;">
                <h3 style="margin:0 0 6px 0; font-size:16px; font-weight:900; color:#fff;">
                    ${isMobile ? '📲' : '🖥️'} ${this.t('shortcut_banner_title')}
                </h3>
                <p style="font-size:12px; font-weight:normal; margin:0; color:#fff; line-height:1.45;">${this.t('shortcut_banner_desc')}</p>
            </button>

            ${!isMobile ? `
            <!-- PC 전용 바탕화면 바로가기 원클릭 생성 카드 -->
            <div style="background:#e7f5ff; border:1.5px solid #339af0; border-radius:10px; padding:14px 16px; margin-bottom:14px; color:#1864ab;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:13.5px; font-weight:900; color:#1864ab;">🖥️ PC 바탕화면 바로가기 생성</span>
                    <span style="font-size:11px; background:#1c7ed6; color:#fff; padding:2px 8px; border-radius:6px; font-weight:800;">Windows / Mac</span>
                </div>
                <p style="font-size:12px; margin:0 0 10px 0; line-height:1.5; color:#1971c2;">
                    아래 버튼을 클릭하면 윈도우 바탕화면 표준 바로가기 파일(<code>.url</code>)이 다운로드됩니다. 다운로드된 파일을 바탕화면으로 옮겨두시면 언제든 더블 클릭으로 <strong>기본 브라우저</strong>에서 즉시 실행됩니다.
                </p>
                <div style="display:flex; gap:8px;">
                    <button type="button" onclick="MainController.downloadPcShortcut('url')" style="flex:1; padding:11px 12px; background:#1c7ed6; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:900; cursor:pointer; box-shadow:0 2px 6px rgba(28,126,214,0.35);">
                        🖥️ 바탕화면 바로가기 다운로드 (.url)
                    </button>
                    <button type="button" onclick="MainController.downloadPcShortcut('html')" style="padding:11px 12px; background:#fff; color:#1c7ed6; border:1.5px solid #1c7ed6; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer;">
                        🌐 HTML 실행기 (.html)
                    </button>
                </div>
            </div>
            ` : ''}

            <!-- 오프라인 상태 측정/저장 가능 안내 강조 박스 -->
            <div style="background:#ecfdf5; border:1.5px solid #10b981; border-radius:10px; padding:14px 16px; margin-bottom:14px; color:#065f46;">
                <div style="font-size:13px; font-weight:900; margin-bottom:6px;">${this.t('shortcut_offline_title')}</div>
                <div style="font-size:12px; line-height:1.6; font-weight:600;">${this.t('shortcut_offline_desc')}</div>
            </div>

            <!-- 기기별 바로가기 추가 안내 -->
            <div style="background:var(--bg-soft); border:1px solid var(--border-light); border-radius:10px; padding:14px 16px; margin-bottom:18px; font-size:12px; line-height:1.65; color:var(--text-primary);">
                <div style="font-weight:900; font-size:13px; margin-bottom:6px; color:var(--brand-orange);">${this.t('shortcut_guide_title')}</div>
                <div style="margin-bottom:4px;">${this.t('shortcut_guide_android')}</div>
                <div style="margin-bottom:4px;">${this.t('shortcut_guide_ios')}</div>
                <div>${this.t('shortcut_guide_pc')}</div>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px;">
                <button type="button" class="act-btn" style="width:100%; background:#000; color:#fff; border:none; font-size:13px; height:42px;" onclick="MainController.closeModal()">
                    ${isFirstRun ? this.t('btn_shortcut_later') : this.t('btn_close_x')}
                </button>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    precacheOfflineAssets: async function() {
        try {
            if ('caches' in window && (location.protocol === 'https:' || location.protocol === 'http:')) {
                const cache = await caches.open('hic-pro-v27-offline-v12');
                await cache.addAll([
                    './',
                    './index.html',
                    './manifest.json',
                    './hi-logo.png',
                    './hi-logo.svg',
                    './kakao-channel-qr.svg',
                    './wps_sample.txt',
                    './welder_sample.txt',
                    './css/style.css',
                    './js/data_store.js',
                    './js/help_manual.js',
                    './js/calculator.js',
                    './pages/dashboard.js',
                    './js/main.js'
                ]).catch(() => {});
            }
        } catch (e) {}
    },

    buildPcLauncherHtml: function() {
        const appUrl = window.location.href.split('#')[0];
        const iconUrl = new URL('hi-logo.png', appUrl).href;
        return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>HeatInPut Calculator</title>
<link rel="icon" type="image/png" href="${iconUrl}">
<meta http-equiv="refresh" content="0; url=${appUrl}">
<script>window.location.replace(${JSON.stringify(appUrl)});<\/script>
</head>
<body style="font-family:sans-serif;text-align:center;padding:40px;background:#f8f9fa;">
<p><a href="${appUrl}" style="color:#ff7f00;font-weight:bold;font-size:18px;">HeatInPut Calculator 실행 중...</a></p>
</body>
</html>`;
    },

    createPcDesktopShortcut: function(type = 'url') {
        try {
            const appUrl = window.location.href.split('#')[0];
            const iconUrl = new URL('hi-logo.png', appUrl).href;
            let blob, fileName;

            if (type === 'html') {
                const htmlContent = this.buildPcLauncherHtml();
                blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                fileName = 'HeatInPut Calculator.html';
            } else {
                // Windows 인터넷 바로가기 (.url) - 기본 브라우저로 자동 실행
                const urlContent = `[InternetShortcut]\r\nURL=${appUrl}\r\nIconIndex=0\r\nIconFile=${iconUrl}\r\nHotKey=0\r\n[{000214A0-0000-0000-C000-000000000046}]\r\nProp3=19,0\r\n`;
                blob = new Blob([urlContent], { type: 'application/internet-shortcut;charset=utf-8' });
                fileName = 'HeatInPut Calculator.url';
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                try { document.body.removeChild(a); } catch (e) {}
                URL.revokeObjectURL(url);
            }, 1000);
            return true;
        } catch (e) {
            return false;
        }
    },

    downloadPcShortcut: function(type = 'url') {
        const ok = this.createPcDesktopShortcut(type);
        this.saveLastWorkState();
        this.precacheOfflineAssets();
        localStorage.setItem(this.SHORTCUT_PROMPT_KEY, 'true');
        if (ok) {
            alert(this.t('alert_pc_shortcut_created'));
            this.showSyncToast(this.t('net_offline_notice'), 'online-synced', 6500);
        }
    },

    triggerAddHomeShortcut: async function() {
        let promptEvent = this._deferredInstallPrompt || window.__deferredInstallPrompt;
        if (!promptEvent && (location.protocol === 'https:' || location.protocol === 'http:')) {
            await new Promise(resolve => setTimeout(resolve, 450));
            promptEvent = this._deferredInstallPrompt || window.__deferredInstallPrompt;
        }
        let nativeInstalled = false;
        if (promptEvent) {
            try {
                promptEvent.prompt();
                const choiceResult = await promptEvent.userChoice;
                if (choiceResult && choiceResult.outcome === 'accepted') {
                    nativeInstalled = true;
                }
                this._deferredInstallPrompt = null;
                window.__deferredInstallPrompt = null;
            } catch (e) {}
        }
        this.saveLastWorkState();
        this.precacheOfflineAssets();
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
        if (!nativeInstalled && !isMobile) {
            this.createPcDesktopShortcut('url');
        }
        localStorage.setItem(this.SHORTCUT_PROMPT_KEY, 'true');
        this.closeModal();
        if (!isMobile) {
            alert(this.t('alert_pc_shortcut_created'));
        } else {
            alert(this.t('alert_shortcut_added'));
        }
        this.showSyncToast(this.t('net_offline_notice'), 'online-synced', 6500);
    },

    confirmShortcutAdded: function() {
        this.triggerAddHomeShortcut();
    },

    saveLastWorkState: function() {
        if (this._isRestoringWorkState) return;
        try {
            const wpsEl = document.getElementById('inpWpsNo');
            const stateObj = {
                standard: (typeof Calculator !== 'undefined' && Calculator.state) ? Calculator.state.standard : 'ISO',
                process: document.getElementById('selProcess') ? document.getElementById('selProcess').value : 'FCAW',
                wpsMode: (typeof Calculator !== 'undefined' && Calculator.state) ? Calculator.state.wpsMode : 'manual',
                welderMode: (typeof Calculator !== 'undefined' && Calculator.state) ? Calculator.state.welderMode : 'manual',
                pass: (typeof Calculator !== 'undefined' && Calculator.state) ? Calculator.state.pass : 'Root',
                wpsNo: wpsEl ? wpsEl.value : '',
                baseWpsNo: (wpsEl && wpsEl.dataset && wpsEl.dataset.baseWpsNo) ? wpsEl.dataset.baseWpsNo : '',
                wpsMin: document.getElementById('inpWpsMin') ? document.getElementById('inpWpsMin').value : '1.00',
                wpsMax: document.getElementById('inpWpsMax') ? document.getElementById('inpWpsMax').value : '1.66',
                voltage: document.getElementById('inpVoltage') ? document.getElementById('inpVoltage').value : '30.0',
                amperage: document.getElementById('inpAmperage') ? document.getElementById('inpAmperage').value : '300.0',
                length: document.getElementById('inpLength') ? document.getElementById('inpLength').value : '5.0',
                timeSecTotal: document.getElementById('inpTimeSecTotal') ? document.getElementById('inpTimeSecTotal').value : '1.0',
                timeMin: document.getElementById('inpTimeMin') ? document.getElementById('inpTimeMin').value : '0',
                timeSecPart: document.getElementById('inpTimeSecPart') ? document.getElementById('inpTimeSecPart').value : '1.0',
                welderId: document.getElementById('inpWelderId') ? document.getElementById('inpWelderId').value : 'WLD-001',
                welderName: document.getElementById('inpWelderName') ? document.getElementById('inpWelderName').value : '홍길동',
                welderDept: document.getElementById('inpWelderDept') ? document.getElementById('inpWelderDept').value : '136(FCAW) A팀',
                jointNo: document.getElementById('inpJointNo') ? document.getElementById('inpJointNo').value : '',
                savedAt: Date.now()
            };
            localStorage.setItem(this.LAST_WORK_STATE_KEY, JSON.stringify(stateObj));
        } catch (e) {}
    },

    restoreLastWorkState: function() {
        try {
            const raw = localStorage.getItem(this.LAST_WORK_STATE_KEY);
            if (!raw) return;
            const st = JSON.parse(raw);
            if (!st || typeof st !== 'object') return;
            this._isRestoringWorkState = true;

            if (typeof Calculator !== 'undefined') {
                if (st.standard === 'AWS' || st.standard === 'ISO') {
                    Calculator.state.standard = st.standard;
                    const btnAWS = document.getElementById('btnStdAWS');
                    const btnISO = document.getElementById('btnStdISO');
                    if (btnAWS) btnAWS.classList.toggle('active', st.standard === 'AWS');
                    if (btnISO) btnISO.classList.toggle('active', st.standard === 'ISO');
                }
                if (st.pass) {
                    Calculator.state.pass = st.pass;
                    document.querySelectorAll('.pass-btn').forEach(btn => {
                        btn.classList.toggle('active', btn.innerText.trim() === st.pass);
                    });
                }
            }

            const setVal = (id, v) => {
                const el = document.getElementById(id);
                if (el && v !== undefined && v !== null) el.value = v;
            };

            setVal('selProcess', st.process);
            setVal('inpWpsNo', st.wpsNo);
            const wpsEl = document.getElementById('inpWpsNo');
            if (wpsEl && st.baseWpsNo) wpsEl.dataset.baseWpsNo = st.baseWpsNo;
            setVal('inpWpsMin', st.wpsMin);
            setVal('inpWpsMax', st.wpsMax);
            setVal('inpVoltage', st.voltage);
            setVal('inpAmperage', st.amperage);
            setVal('inpLength', st.length);
            setVal('inpTimeSecTotal', st.timeSecTotal);
            setVal('inpTimeMin', st.timeMin);
            setVal('inpTimeSecPart', st.timeSecPart);
            if (!this.isPro && st.welderId === 'YU-WQT-203') {
                st.welderId = 'WLD-001';
                st.welderName = '홍길동';
                st.welderDept = '136(FCAW) A팀';
            }
            setVal('inpWelderId', st.welderId);
            setVal('inpWelderName', st.welderName);
            setVal('inpWelderDept', st.welderDept);
            setVal('inpJointNo', st.jointNo);

            // FREE 버전일 때 직전 WPS가 허용된 프리셋(10개) 밖의 PRO 데이터인 경우 초기화 보호
            if (!this.isPro && wpsEl && wpsEl.value) {
                const allowedWps = DataStore.getWpsPresets();
                const baseCheck = (st.baseWpsNo || wpsEl.value).replace(/\s*\([^)]*\)\s*$/, '').trim();
                if (baseCheck && !allowedWps.some(item => (item.wpsNo || item.id) === baseCheck)) {
                    wpsEl.value = '';
                    delete wpsEl.dataset.baseWpsNo;
                }
            }

            if (typeof Calculator !== 'undefined') {
                if (st.wpsMode === 'preset' || st.wpsMode === 'manual') {
                    Calculator.setWpsMode(st.wpsMode);
                }
                if (st.welderMode === 'preset' || st.welderMode === 'manual') {
                    Calculator.setWelderMode(st.welderMode);
                }
            }
        } catch (e) {
        } finally {
            this._isRestoringWorkState = false;
        }
    },

    getOfflineQueue: function() {
        try {
            const q = JSON.parse(localStorage.getItem(this.OFFLINE_QUEUE_KEY) || '[]');
            return Array.isArray(q) ? q : [];
        } catch (e) {
            return [];
        }
    },

    setOfflineQueue: function(q) {
        try {
            localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(Array.isArray(q) ? q : []));
        } catch (e) {}
    },

    getPendingSyncCount: function() {
        const records = this.getRecords();
        const pendingInRecords = records.filter(r => r && r.syncStatus === 'pending').length;
        const queueLen = this.getOfflineQueue().length;
        return Math.max(pendingInRecords, queueLen);
    },

    bindNetworkEvents: function() {
        if (this._netEventsBound) return;
        this._netEventsBound = true;
        window.addEventListener('online', () => {
            this.updateNetStatusUI();
            this.syncOfflineRecords(true);
            this.syncRemoteLicenseStatus();
        });
        window.addEventListener('offline', () => {
            this.updateNetStatusUI();
            this.showSyncToast(this.t('net_offline_notice'), 'offline-mode', 6000);
        });
    },

    updateNetStatusUI: function() {
        const badge = document.getElementById('netStatusBadge');
        if (!badge) return;
        const isOnline = navigator.onLine !== false;
        const pendingCnt = this.getPendingSyncCount();
        const titleStr = isOnline
            ? this.t('net_online')
            : (pendingCnt > 0 ? this.t('net_offline_pending', { cnt: pendingCnt }) : this.t('net_offline'));
        badge.classList.toggle('online', isOnline);
        badge.classList.toggle('offline', !isOnline);
        badge.setAttribute('title', titleStr);
        if (typeof HeaderKit !== 'undefined' && typeof HeaderKit.setNetStatus === 'function') {
            HeaderKit.setNetStatus(isOnline, titleStr);
        } else if (!badge.querySelector('.wifi-svg')) {
            badge.innerText = titleStr;
        }
    },

    showSyncToast: function(message, modeClass = 'online-synced', durationMs = 4500) {
        const banner = document.getElementById('offlineToastBanner');
        const msgEl = document.getElementById('offlineToastMsg');
        if (!banner || !msgEl) return;
        banner.classList.remove('hidden', 'offline-mode', 'online-synced');
        banner.classList.add(modeClass);
        msgEl.innerText = message;
        if (this._toastTimer) clearTimeout(this._toastTimer);
        if (durationMs > 0) {
            this._toastTimer = setTimeout(() => {
                banner.classList.add('hidden');
            }, durationMs);
        }
    },

    handleNetBadgeClick: async function() {
        if (navigator.onLine === false) {
            this.showSyncToast(this.t('net_offline_notice'), 'offline-mode', 5000);
            return;
        }
        const pendingCnt = this.getPendingSyncCount();
        if (pendingCnt > 0) {
            await this.syncOfflineRecords(true);
        } else {
            this.showSyncToast(this.t('net_already_synced'), 'online-synced', 3500);
        }
    },

    syncOfflineRecords: async function(showToast = true) {
        if (navigator.onLine === false) return 0;
        await this.checkProStatus();
        const records = this.getRecords();
        const queueSet = new Set(this.getOfflineQueue());
        const welderMap = this.buildWelderLookupMap();
        const presets = (typeof DataStore !== 'undefined' && DataStore.getWpsPresets) ? DataStore.getWpsPresets() : [];

        let updatedCount = 0;
        const updatedRecords = records.map(r => {
            if (!r) return r;
            const isPending = r.syncStatus === 'pending' || (r.recordId && queueSet.has(r.recordId));
            if (!isPending) return r;

            updatedCount++;
            const std = r.std || 'ISO';
            const proc = r.process || 'FCAW';
            const k = (typeof DataStore !== 'undefined' && DataStore.kFactors && DataStore.kFactors[std] && DataStore.kFactors[std][proc])
                ? DataStore.kFactors[std][proc]
                : 1.0;
            const V = parseFloat(r.V) || 0;
            const A = parseFloat(r.A) || 0;
            const L = parseFloat(r.L) || 0;
            const T = parseFloat(r.T) || 0;
            const recalcResult = (L > 0 && T > 0) ? ((k * V * A * T) / (L * 1000)).toFixed(3) : (r.result || '0.000');

            const syncedRow = {
                ...r,
                result: recalcResult,
                welderName: this.resolveRecordWelderName(r, welderMap),
                syncStatus: 'synced',
                syncedAt: new Date().toISOString()
            };
            syncedRow.judgment = this.computeRecordJudgment(syncedRow, presets);
            return syncedRow;
        });

        if (updatedCount > 0 || queueSet.size > 0) {
            this.setRecords(updatedRecords);
            this.setOfflineQueue([]);
            if (this.isHistoryEditing) {
                this.tempHistoryRecords = updatedRecords.map(r => ({ ...r }));
            }
            this.renderHistoryTable();
            this.updateNetStatusUI();
            if (showToast && updatedCount > 0) {
                this.showSyncToast(this.t('net_sync_done', { cnt: updatedCount }), 'online-synced', 5500);
            }
        } else {
            this.updateNetStatusUI();
        }
        return updatedCount;
    },

    toggleDarkMode: function() {
        const root = document.documentElement;
        const isDark = root.classList.toggle('dark');
        root.style.setProperty('color-scheme', isDark ? 'dark' : 'light', 'important');
        localStorage.setItem('HI_DARK_MODE', isDark ? 'true' : 'false');
    },

    changeLanguage: function(lang) {
        localStorage.setItem('HI_LANG', lang);
        if (typeof DataStore !== 'undefined' && typeof DataStore.syncSampleWeldersForLang === 'function') {
            if (DataStore.syncSampleWeldersForLang(lang)) {
                this._welderPoolCache = null;
                if (typeof PresetManager !== 'undefined' && typeof PresetManager.updateCounts === 'function') {
                    PresetManager.updateCounts();
                }
            }
        }
        const dict = DataStore.i18n[lang] || DataStore.i18n.ko;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.innerText = dict[key];
        });
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (dict[key]) el.innerHTML = dict[key];
        });

        if (typeof HeaderKit !== 'undefined') {
            HeaderKit.setLanguage(lang, false);
            const titles = {
                ko: { full: "용접 입열량 계산기", short: "입열량 계산기" },
                en: { full: "Heat-Input Calculator", short: "Heat-Input Calc" },
                zh: { full: "焊接热输入计算器", short: "热输入计算器" },
                ja: { full: "溶接 入熱量 計算機", short: "入熱量 計算機" },
                es: { full: "Calculadora de Aporte Térmico", short: "Calc. Aporte Térmico" }
            };
            const t = titles[lang] || titles.ko;
            HeaderKit.setTitle(t.full, t.short);
        }

        const btnManual = document.getElementById('btnManual');
        if (btnManual) {
            const manualTitles = {
                ko: "사용 매뉴얼",
                en: "User Manual",
                zh: "使用手册",
                ja: "使用マニュアル",
                es: "Manual de Usuario"
            };
            btnManual.title = manualTitles[lang] || manualTitles.ko;
        }

        const badge = document.getElementById('proBadge');
        if (badge) {
            if (_proVerifiedState) {
                badge.innerText = this.t('badge_pro');
                badge.style.backgroundColor = '#12b886';
                badge.style.color = '#ffffff';
            } else {
                badge.innerText = 'Free';
                badge.style.backgroundColor = '';
                badge.style.color = '';
            }
        }

        if (typeof PresetManager !== 'undefined' && typeof PresetManager.updateCounts === 'function') {
            PresetManager.updateCounts();
        }
        this.updateNetStatusUI();
        this.updateProcessSelectUI();
        this.renderHistoryTable();

        // 모달이 열려 있는 상태에서 언어를 변경하면 즉시 해당 언어로 갱신
        const modal = document.getElementById('subPageModal');
        if (modal && !modal.classList.contains('hidden')) {
            const title = document.getElementById('subPageTitle');
            const body = document.getElementById('subPageBody');
            if (this._currentModalType === 'help' && typeof HelpManual !== 'undefined') {
                HelpManual.renderModal(lang, title, body);
            } else if (this._currentModalType === 'settings') {
                this.openModal('pages/settings.html');
            } else if (this._currentModalType === 'shortcut') {
                this.openShortcutModal(false);
            } else if (this._currentModalType === 'preset_view' && typeof PresetManager !== 'undefined') {
                PresetManager.openViewer(PresetManager.currentImportType || 'wps');
            } else if (this._currentModalType === 'preset_edit' && typeof PresetManager !== 'undefined') {
                PresetManager.openEditor(PresetManager.currentImportType || 'wps', PresetManager.tempEditingData);
            }
        }
    },

    saveRecord: function() {
        const now = new Date();
        const wpsEl = document.getElementById('inpWpsNo');
        const rawWpsInput = (wpsEl ? wpsEl.value : '').trim();
        let cleanWpsNo = rawWpsInput;
        const passSuffix = Calculator.state.pass ? `(${Calculator.state.pass})` : '';
        if (passSuffix && cleanWpsNo.endsWith(passSuffix)) {
            cleanWpsNo = cleanWpsNo.slice(0, -passSuffix.length).trim();
        } else if (wpsEl && wpsEl.dataset && wpsEl.dataset.baseWpsNo && cleanWpsNo.startsWith(wpsEl.dataset.baseWpsNo)) {
            cleanWpsNo = wpsEl.dataset.baseWpsNo.trim();
        } else {
            cleanWpsNo = cleanWpsNo.replace(/\s*\((?:Root|Fill|Cap|Hot|All|[^()]*?(?:\([^()]*\))?)\)\s*$/i, '').trim();
        }
        cleanWpsNo = cleanWpsNo || '-';
        const minWps = parseFloat(document.getElementById('inpWpsMin').value) || 0;
        const maxWps = parseFloat(document.getElementById('inpWpsMax').value) || 999;
        const hiVal = Calculator.state.lastResult || 0;
        const isPass = (hiVal >= minWps && hiVal <= maxWps && hiVal > 0);
        const isOnline = navigator.onLine !== false;
        const recordId = 'REC_' + now.getTime() + '_' + Math.random().toString(36).slice(2, 6);
        const record = {
            recordId: recordId,
            date: now.toISOString().slice(0, 10),
            time: now.toTimeString().slice(0, 8),
            std: Calculator.state.standard,
            process: document.getElementById('selProcess').value,
            wpsNo: cleanWpsNo,
            pass: Calculator.state.pass,
            welderId: document.getElementById('inpWelderId').value || '-',
            welderName: (document.getElementById('inpWelderName') ? document.getElementById('inpWelderName').value : '') || '-',
            dept: document.getElementById('inpWelderDept').value || '-',
            jointNo: document.getElementById('inpJointNo').value || '-',
            V: parseFloat(document.getElementById('inpVoltage').value).toFixed(1),
            A: parseFloat(document.getElementById('inpAmperage').value).toFixed(1),
            L: parseFloat(document.getElementById('inpLength').value).toFixed(1),
            T: parseFloat(document.getElementById('inpTimeSecTotal').value).toFixed(1),
            result: hiVal.toFixed(3),
            minWps: minWps.toFixed(2),
            maxWps: maxWps.toFixed(2),
            judgment: isPass ? 'Pass' : 'Fail',
            syncStatus: isOnline ? 'synced' : 'pending'
        };
        const list = this.getRecords();
        list.unshift(record);
        if (list.length > 500) list.pop();
        this.setRecords(list);
        if (!isOnline) {
            const q = this.getOfflineQueue();
            q.push(recordId);
            this.setOfflineQueue(q);
        }
        this.saveLastWorkState();
        this.updateNetStatusUI();
        if (this.isHistoryEditing) {
            this.tempHistoryRecords = list.map(r => ({ ...r }));
        }
        this.renderHistoryTable();
    },

    isHistoryEditing: false,
    tempHistoryRecords: [],
    _recordsCache: null,
    _welderPoolCache: null,

    escapeHtmlAttr: function(val) {
        return String(val == null ? '' : val)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    escapeHtml: function(val) {
        return this.escapeHtmlAttr(val);
    },

    buildWelderLookupMap: function(lang = 'ko') {
        const map = new Map();
        const pool = typeof this.getCombinedWelderPool === 'function' ? this.getCombinedWelderPool() : [];
        for (const w of pool) {
            const wid = String(w.id || w.welder_no || '').trim().toUpperCase();
            if (wid) {
                const name = (lang !== 'ko' && w.alt) ? w.alt : (w.name || w.alt || '');
                if (name) map.set(wid, name);
            }
        }
        return map;
    },

    resolveRecordWelderName: function(r, welderMap = null, lang = 'ko') {
        if (!r) return '-';
        const wid = String(r.welderId || '').trim().toUpperCase();
        if (wid && wid !== '-') {
            if (welderMap) {
                const name = welderMap.get(wid);
                if (name) return name;
            } else if (typeof this.getCombinedWelderPool === 'function') {
                const matched = this.getCombinedWelderPool().find(
                    w => String(w.id || w.welder_no || '').trim().toUpperCase() === wid
                );
                if (matched) {
                    if (lang !== 'ko' && matched.alt) return matched.alt;
                    if (matched.name) return matched.name;
                }
            }
        }
        if (r.welderName && String(r.welderName).trim() && r.welderName !== '-') {
            if (lang !== 'ko' && r.welderName === '홍길동') return 'Hong Gil-Dong';
            return String(r.welderName).trim();
        }
        return '-';
    },

    computeRecordJudgment: function(r, presetsCache = null) {
        if (!r) return 'Fail';
        const val = parseFloat(r.result) || 0;
        if (val <= 0) return 'Fail';

        if (r.minWps !== undefined && r.maxWps !== undefined && !isNaN(parseFloat(r.minWps)) && !isNaN(parseFloat(r.maxWps))) {
            return (val >= parseFloat(r.minWps) && val <= parseFloat(r.maxWps)) ? 'Pass' : 'Fail';
        }

        const presets = presetsCache || ((typeof DataStore !== 'undefined' && typeof DataStore.getWpsPresets === 'function') ? (DataStore.getWpsPresets() || []) : []);
        if (presets.length > 0) {
            const wpsNo = String(r.wpsNo || '').trim().toUpperCase();
            const pass = String(r.pass || '').trim().toUpperCase();
            let matched = presets.find(
                p => String(p.wpsNo || p.id || '').trim().toUpperCase() === wpsNo && String(p.pass || '').trim().toUpperCase() === pass
            );
            if (!matched && wpsNo && wpsNo !== '-') {
                matched = presets.find(p => String(p.wpsNo || p.id || '').trim().toUpperCase() === wpsNo);
            }
            if (matched) {
                return (val >= Number(matched.min) && val <= Number(matched.max)) ? 'Pass' : 'Fail';
            }
        }

        const minEl = document.getElementById('inpWpsMin');
        const maxEl = document.getElementById('inpWpsMax');
        const minWps = minEl ? (parseFloat(minEl.value) || 0) : 0;
        const maxWps = maxEl ? (parseFloat(maxEl.value) || 999) : 999;
        return (val >= minWps && val <= maxWps) ? 'Pass' : 'Fail';
    },

    resolveRecordJudgment: function(r, presetsCache = null) {
        if (!r) return 'Fail';
        if (r.judgment === 'Pass' || r.judgment === 'Accept') return 'Pass';
        if (r.judgment === 'Fail') return 'Fail';
        return this.computeRecordJudgment(r, presetsCache);
    },

    getRecords: function() {
        if (this._recordsCache) return this._recordsCache;
        try {
            this._recordsCache = JSON.parse(localStorage.getItem(this.STORAGE_LOG_KEY) || '[]');
        } catch (e) {
            this._recordsCache = [];
        }
        return this._recordsCache;
    },

    setRecords: function(list) {
        this._recordsCache = Array.isArray(list) ? list : [];
        localStorage.setItem(this.STORAGE_LOG_KEY, JSON.stringify(this._recordsCache));
    },

    toggleHistoryEditMode: function() {
        if (this.isHistoryEditing) {
            this.saveHistoryEdits();
            return;
        }
        const welderMap = this.buildWelderLookupMap();
        const presets = (typeof DataStore !== 'undefined' && DataStore.getWpsPresets) ? DataStore.getWpsPresets() : [];
        this.tempHistoryRecords = this.getRecords().map(r => ({
            ...r,
            welderName: this.resolveRecordWelderName(r, welderMap),
            judgment: this.resolveRecordJudgment(r, presets)
        }));
        this.isHistoryEditing = true;
        this.renderHistoryTable();
        const card = document.querySelector('.table-outline-card');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    updateHistoryEditField: function(idx, field, val) {
        const row = this.tempHistoryRecords[idx];
        if (!row) return;
        row[field] = val;

        // 규격, 공정, V, A, L, T 변경 시 입열량(result) 실시간 재계산
        if (['std', 'process', 'V', 'A', 'L', 'T'].includes(field)) {
            const std = row.std || 'ISO';
            const proc = row.process || 'FCAW';
            const k = (typeof DataStore !== 'undefined' && DataStore.kFactors && DataStore.kFactors[std] && DataStore.kFactors[std][proc])
                ? DataStore.kFactors[std][proc]
                : 1.0;
            const V = parseFloat(row.V) || 0;
            const A = parseFloat(row.A) || 0;
            const L = parseFloat(row.L) || 0;
            const T = parseFloat(row.T) || 0;
            const hi = (L > 0 && T > 0) ? (k * V * A * T) / (L * 1000) : 0;
            row.result = hi.toFixed(3);
            const resInput = document.getElementById(`histResInput_${idx}`);
            if (resInput) resInput.value = row.result;
        }

        // 입열량 또는 WPS/Pass 변경 시 합·부 판정(Pass/Fail) 자동 갱신
        if (['std', 'process', 'V', 'A', 'L', 'T', 'result', 'wpsNo', 'pass'].includes(field)) {
            if (field === 'wpsNo' || field === 'pass') {
                delete row.minWps;
                delete row.maxWps;
            }
            row.judgment = this.computeRecordJudgment(row);
            const judgeSel = document.getElementById(`histJudgeSelect_${idx}`);
            if (judgeSel) {
                judgeSel.value = row.judgment;
                judgeSel.style.color = row.judgment === 'Pass' ? '#16a34a' : '#dc2626';
            }
        } else if (field === 'judgment') {
            const judgeSel = document.getElementById(`histJudgeSelect_${idx}`);
            if (judgeSel) {
                judgeSel.style.color = val === 'Pass' ? '#16a34a' : '#dc2626';
            }
        }
    },

    addHistoryEditRow: function() {
        const now = new Date();
        const minWps = parseFloat(document.getElementById('inpWpsMin') ? document.getElementById('inpWpsMin').value : 0) || 0;
        const maxWps = parseFloat(document.getElementById('inpWpsMax') ? document.getElementById('inpWpsMax').value : 999) || 999;
        const newRow = {
            date: now.toISOString().slice(0, 10),
            time: now.toTimeString().slice(0, 8),
            std: (typeof Calculator !== 'undefined' && Calculator.state) ? Calculator.state.standard : 'ISO',
            process: document.getElementById('selProcess') ? document.getElementById('selProcess').value : 'FCAW',
            wpsNo: '-',
            pass: (typeof Calculator !== 'undefined' && Calculator.state) ? Calculator.state.pass : 'Root',
            welderId: document.getElementById('inpWelderId') ? (document.getElementById('inpWelderId').value || '-') : '-',
            welderName: document.getElementById('inpWelderName') ? (document.getElementById('inpWelderName').value || '-') : '-',
            dept: document.getElementById('inpWelderDept') ? (document.getElementById('inpWelderDept').value || '-') : '-',
            jointNo: document.getElementById('inpJointNo') ? (document.getElementById('inpJointNo').value || '-') : '-',
            V: '30.0',
            A: '300.0',
            L: '5.0',
            T: '1.0',
            result: '1.440',
            minWps: minWps.toFixed(2),
            maxWps: maxWps.toFixed(2),
            judgment: (1.440 >= minWps && 1.440 <= maxWps) ? 'Pass' : 'Fail'
        };
        this.tempHistoryRecords.unshift(newRow);
        this.renderHistoryTable();
    },

    moveHistoryEditRow: function(idx, dir) {
        const target = idx + dir;
        if (target < 0 || target >= this.tempHistoryRecords.length) return;
        const scrollWrap = document.querySelector('.table-scroll');
        const prevTop = scrollWrap ? scrollWrap.scrollTop : 0;
        const prevLeft = scrollWrap ? scrollWrap.scrollLeft : 0;
        const tmp = this.tempHistoryRecords[idx];
        this.tempHistoryRecords[idx] = this.tempHistoryRecords[target];
        this.tempHistoryRecords[target] = tmp;
        this.renderHistoryTable();
        if (scrollWrap) {
            scrollWrap.scrollTop = prevTop;
            scrollWrap.scrollLeft = prevLeft;
        }
    },

    removeHistoryEditRow: function(idx) {
        const scrollWrap = document.querySelector('.table-scroll');
        const prevTop = scrollWrap ? scrollWrap.scrollTop : 0;
        const prevLeft = scrollWrap ? scrollWrap.scrollLeft : 0;
        this.tempHistoryRecords.splice(idx, 1);
        this.renderHistoryTable();
        if (scrollWrap) {
            scrollWrap.scrollTop = prevTop;
            scrollWrap.scrollLeft = prevLeft;
        }
    },

    saveHistoryEdits: function() {
        const presets = (typeof DataStore !== 'undefined' && DataStore.getWpsPresets) ? DataStore.getWpsPresets() : [];
        const cleaned = this.tempHistoryRecords.map(r => ({
            ...r,
            date: String(r.date || '-').trim() || '-',
            time: String(r.time || '-').trim() || '-',
            std: String(r.std || 'ISO').trim(),
            process: String(r.process || 'FCAW').trim(),
            wpsNo: String(r.wpsNo || '-').trim() || '-',
            pass: String(r.pass || 'Root').trim() || 'Root',
            welderId: String(r.welderId || '-').trim() || '-',
            welderName: String(r.welderName || '-').trim() || '-',
            dept: String(r.dept || '-').trim() || '-',
            jointNo: String(r.jointNo || '-').trim() || '-',
            V: (parseFloat(r.V) || 0).toFixed(1),
            A: (parseFloat(r.A) || 0).toFixed(1),
            L: (parseFloat(r.L) || 0).toFixed(1),
            T: (parseFloat(r.T) || 0).toFixed(1),
            result: (parseFloat(r.result) || 0).toFixed(3),
            judgment: this.resolveRecordJudgment(r, presets)
        }));
        this.setRecords(cleaned.slice(0, 500));
        this.isHistoryEditing = false;
        this.tempHistoryRecords = [];
        this.renderHistoryTable();
    },

    cancelHistoryEdits: function() {
        this.isHistoryEditing = false;
        this.tempHistoryRecords = [];
        this.renderHistoryTable();
    },

    renderHistoryTable: function() {
        const list = this.isHistoryEditing ? this.tempHistoryRecords : this.getRecords();
        const countEl = document.getElementById('logCount');
        if (countEl) countEl.innerText = list.length;

        const editBtn = document.getElementById('btnHistoryEditMode');
        const editLbl = document.getElementById('lblHistoryEditMode');
        const toolbar = document.getElementById('historyEditToolbar');
        const headRow = document.getElementById('historyTableHeadRow');

        if (editBtn) editBtn.classList.toggle('editing-active', this.isHistoryEditing);
        if (editLbl) editLbl.innerText = this.isHistoryEditing ? this.t('btn_edit_done') : this.t('btn_edit_mode');
        if (toolbar) toolbar.classList.toggle('hidden', !this.isHistoryEditing);

        if (headRow) {
            const existingManageTh = document.getElementById('thHistoryManage');
            if (this.isHistoryEditing && !existingManageTh) {
                const th = document.createElement('th');
                th.id = 'thHistoryManage';
                th.innerText = this.t('th_manage');
                headRow.appendChild(th);
            } else if (this.isHistoryEditing && existingManageTh) {
                existingManageTh.innerText = this.t('th_manage');
            } else if (!this.isHistoryEditing && existingManageTh) {
                existingManageTh.remove();
            }
        }

        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        const emptyMsg = this.t('msg_empty_log');

        if (list.length === 0) {
            const colSpan = this.isHistoryEditing ? 17 : 16;
            tbody.innerHTML = `<tr><td colspan="${colSpan}" class="empty-msg">${this.isHistoryEditing ? this.t('msg_empty_hist_edit') : emptyMsg}</td></tr>`;
            return;
        }

        const welderMap = this.buildWelderLookupMap();
        const presets = (typeof DataStore !== 'undefined' && DataStore.getWpsPresets) ? DataStore.getWpsPresets() : [];

        if (!this.isHistoryEditing) {
            const pendingTxt = this.escapeHtmlAttr(this.t('badge_pending_sync'));
            tbody.innerHTML = list.map(r => {
                const wName = this.resolveRecordWelderName(r, welderMap);
                const judge = this.resolveRecordJudgment(r, presets);
                const isPass = judge === 'Pass';
                const isPending = r.syncStatus === 'pending';
                const pendingBadge = isPending
                    ? ` <span style="display:inline-block; padding:2px 6px; border-radius:999px; font-size:10px; font-weight:800; background:#fff7ed; color:#c2410c; border:1px solid #fdba74;">${pendingTxt}</span>`
                    : '';
                const judgeBadge = `<span style="display:inline-block; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:800; background:${isPass ? '#dcfce7' : '#fee2e2'}; color:${isPass ? '#15803d' : '#b91c1c'};">${judge}</span>${pendingBadge}`;
                return `
                <tr>
                    <td>${this.escapeHtmlAttr(r.date)}</td><td>${this.escapeHtmlAttr(r.time)}</td><td>${this.escapeHtmlAttr(r.std)}</td><td>${this.escapeHtmlAttr(r.process)}</td>
                    <td>${this.escapeHtmlAttr(r.wpsNo)}</td><td>${this.escapeHtmlAttr(r.pass)}</td><td>${this.escapeHtmlAttr(r.welderId)}</td><td>${this.escapeHtmlAttr(wName)}</td><td>${this.escapeHtmlAttr(r.dept)}</td>
                    <td>${this.escapeHtmlAttr(r.jointNo)}</td><td>${this.escapeHtmlAttr(r.V)}</td><td>${this.escapeHtmlAttr(r.A)}</td><td>${this.escapeHtmlAttr(r.L)}</td><td>${this.escapeHtmlAttr(r.T)}</td>
                    <td><strong>${this.escapeHtmlAttr(r.result)}</strong></td><td>${judgeBadge}</td>
                </tr>
            `;
            }).join('');
            return;
        }

        const processes = ['FCAW', 'GMAW', 'SMAW', 'GTAW', 'SAW', 'PAW', 'EGW', 'ESW', 'LBW', 'HLAW', 'EBW'];
        const standards = ['ISO', 'AWS'];

        tbody.innerHTML = list.map((r, idx) => {
            const stdOpts = standards.map(s => `<option value="${s}" ${r.std === s ? 'selected' : ''}>${s}</option>`).join('');
            const procOpts = processes.map(p => `<option value="${p}" ${r.process === p ? 'selected' : ''}>${p}</option>`).join('');
            const wName = this.resolveRecordWelderName(r, welderMap);
            const judge = this.resolveRecordJudgment(r, presets);
            const isFirst = idx === 0;
            const isLast = idx === list.length - 1;
            return `
                <tr>
                    <td><input type="text" class="hist-cell-input" style="min-width:80px;" value="${this.escapeHtmlAttr(r.date)}" oninput="MainController.updateHistoryEditField(${idx}, 'date', this.value)"></td>
                    <td><input type="text" class="hist-cell-input" style="min-width:64px;" value="${this.escapeHtmlAttr(r.time)}" oninput="MainController.updateHistoryEditField(${idx}, 'time', this.value)"></td>
                    <td><select class="hist-cell-input" style="min-width:52px;" onchange="MainController.updateHistoryEditField(${idx}, 'std', this.value)">${stdOpts}</select></td>
                    <td><select class="hist-cell-input" style="min-width:62px;" onchange="MainController.updateHistoryEditField(${idx}, 'process', this.value)">${procOpts}</select></td>
                    <td><input type="text" class="hist-cell-input" style="min-width:105px; font-family:monospace;" value="${this.escapeHtmlAttr(r.wpsNo)}" oninput="MainController.updateHistoryEditField(${idx}, 'wpsNo', this.value)"></td>
                    <td><input type="text" class="hist-cell-input" style="min-width:58px;" value="${this.escapeHtmlAttr(r.pass)}" oninput="MainController.updateHistoryEditField(${idx}, 'pass', this.value)"></td>
                    <td><input type="text" class="hist-cell-input" style="min-width:84px; font-family:monospace;" value="${this.escapeHtmlAttr(r.welderId)}" oninput="MainController.updateHistoryEditField(${idx}, 'welderId', this.value)"></td>
                    <td><input type="text" class="hist-cell-input" style="min-width:62px;" value="${this.escapeHtmlAttr(wName)}" oninput="MainController.updateHistoryEditField(${idx}, 'welderName', this.value)"></td>
                    <td><input type="text" class="hist-cell-input" style="min-width:100px;" value="${this.escapeHtmlAttr(r.dept)}" oninput="MainController.updateHistoryEditField(${idx}, 'dept', this.value)"></td>
                    <td><input type="text" class="hist-cell-input" style="min-width:56px;" value="${this.escapeHtmlAttr(r.jointNo)}" oninput="MainController.updateHistoryEditField(${idx}, 'jointNo', this.value)"></td>
                    <td><input type="number" step="0.1" class="hist-cell-input" style="min-width:50px;" value="${this.escapeHtmlAttr(r.V)}" oninput="MainController.updateHistoryEditField(${idx}, 'V', this.value)"></td>
                    <td><input type="number" step="1" class="hist-cell-input" style="min-width:56px;" value="${this.escapeHtmlAttr(r.A)}" oninput="MainController.updateHistoryEditField(${idx}, 'A', this.value)"></td>
                    <td><input type="number" step="0.5" class="hist-cell-input" style="min-width:48px;" value="${this.escapeHtmlAttr(r.L)}" oninput="MainController.updateHistoryEditField(${idx}, 'L', this.value)"></td>
                    <td><input type="number" step="0.5" class="hist-cell-input" style="min-width:48px;" value="${this.escapeHtmlAttr(r.T)}" oninput="MainController.updateHistoryEditField(${idx}, 'T', this.value)"></td>
                    <td><input type="number" step="0.001" id="histResInput_${idx}" class="hist-cell-input" style="min-width:60px; font-weight:900; color:var(--brand-orange);" value="${this.escapeHtmlAttr(r.result)}" oninput="MainController.updateHistoryEditField(${idx}, 'result', this.value)"></td>
                    <td>
                        <select id="histJudgeSelect_${idx}" class="hist-cell-input" style="min-width:60px; font-weight:900; color:${judge === 'Pass' ? '#16a34a' : '#dc2626'};" onchange="MainController.updateHistoryEditField(${idx}, 'judgment', this.value)">
                            <option value="Pass" ${judge === 'Pass' ? 'selected' : ''}>Pass</option>
                            <option value="Fail" ${judge === 'Fail' ? 'selected' : ''}>Fail</option>
                        </select>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:center; gap:3px;">
                            <button type="button" title="위로" style="background:var(--bg-soft); border:none; border-radius:4px; width:22px; height:22px; font-size:10px; color:var(--text-primary); ${isFirst ? 'opacity:0.35; cursor:default;' : 'cursor:pointer;'}" onclick="MainController.moveHistoryEditRow(${idx}, -1)" ${isFirst ? 'disabled' : ''}>▲</button>
                            <button type="button" title="아래로" style="background:var(--bg-soft); border:none; border-radius:4px; width:22px; height:22px; font-size:10px; color:var(--text-primary); ${isLast ? 'opacity:0.35; cursor:default;' : 'cursor:pointer;'}" onclick="MainController.moveHistoryEditRow(${idx}, 1)" ${isLast ? 'disabled' : ''}>▼</button>
                            <button type="button" title="행 삭제" style="background:#fee2e2; border:none; border-radius:4px; width:22px; height:22px; color:#dc2626; font-size:12px; font-weight:900; cursor:pointer;" onclick="MainController.removeHistoryEditRow(${idx})">✕</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    clearHistory: function() {
        if (!confirm(this.t('confirm_clear_history'))) return;
        localStorage.removeItem(this.STORAGE_LOG_KEY);
        this.setOfflineQueue([]);
        this._recordsCache = [];
        this.isHistoryEditing = false;
        this.tempHistoryRecords = [];
        this.updateNetStatusUI();
        this.updateProcessSelectUI();
        this.renderHistoryTable();
    },

    toggleHistoryTable: function() {
        const card = document.querySelector('.table-outline-card');
        if (card) card.scrollIntoView({ behavior: 'smooth' });
    },

    exportCSV: function() {
        const list = this.getRecords();
        if (list.length === 0) { alert(this.t('alert_no_csv_data')); return; }
        const welderMap = this.buildWelderLookupMap();
        const presets = (typeof DataStore !== 'undefined' && DataStore.getWpsPresets) ? DataStore.getWpsPresets() : [];
        const headers = ['날짜','시간','규격','용접공정','WPS번호','용접패스','용접사번호','이름','소속부서','조인트번호','V','A','L','T','입열량','판정'];
        const csvEsc = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
        const rows = list.map(r => [r.date, r.time, r.std, r.process, csvEsc(r.wpsNo), csvEsc(r.pass), csvEsc(r.welderId), csvEsc(this.resolveRecordWelderName(r, welderMap)), csvEsc(r.dept), csvEsc(r.jointNo), r.V, r.A, r.L, r.T, r.result, this.resolveRecordJudgment(r, presets)].join(','));
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `Heat_Input_Report_${new Date().toISOString().slice(0,10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    },

    // ─────────────────────────────────────────────────────────
    // [PRO 전용] 일일 검사 보고서 (Daily Welding Parameter Check Report)
    // ─────────────────────────────────────────────────────────
    _getDailyReportHeaders: function(lang) {
        const dict = {
            ko: ['순번', '일자', '시간', '규격', '공정', 'WPS번호', '패스', '용접사ID', '성명', '소속부서', '조인트No', '전압(V)', '전류(A)', '길이(mm)', '시간(s)', '입열량(kJ/mm)', '판정'],
            en: ['No', 'Date', 'Time', 'Standard', 'Process', 'WPS No', 'Pass', 'Welder ID', 'Name', 'Dept', 'Joint No', 'Volt(V)', 'Amp(A)', 'Length(mm)', 'Time(s)', 'Heat Input(kJ/mm)', 'Judgment'],
            es: ['N.º', 'Fecha', 'Hora', 'Norma', 'Proceso', 'N.º WPS', 'Pasada', 'ID Soldador', 'Nombre', 'Depto', 'N.º Junta', 'Volt(V)', 'Amp(A)', 'Long(mm)', 'Tiempo(s)', 'Aporte(kJ/mm)', 'Dictamen'],
            zh: ['序号', '日期', '时间', '标准', '工艺', 'WPS编号', '层道', '焊工编号', '姓名', '部门', '焊口号', '电压(V)', '电流(A)', '长度(mm)', '时间(秒)', '热输入(kJ/mm)', '判定'],
            ja: ['番号', '日付', '時間', '規格', 'プロセス', 'WPS番号', 'パス', '溶接士ID', '氏名', '部署', '継手番号', '電圧(V)', '電流(A)', 'ビード長(mm)', '時間(秒)', '入熱量(kJ/mm)', '判定']
        };
        return dict[lang] || dict.ko;
    },

    _getDailyReportI18n: function(lang) {
        const dict = {
            ko: {
                title: '용접 변수 일일 검사 보고서 (Daily Welding Parameter Check Report)',
                modalTitle: '용접 변수 일일 검사 보고서',
                projLbl: '프로젝트 / 공사명',
                inspLbl: '검사원 성명',
                projPh: '예: HULL 1042 / A-BLOCK',
                inspPh: '예: 홍길동 (CWI)',
                projDefault: 'PROJECT-WELD-01',
                inspDefault: 'QC Inspector',
                dateLbl: '검사일자:',
                stdLbl: '규격:',
                procLbl: '공정:',
                stdProcLbl: '규격/공정:',
                rateLbl: '합격률:',
                kpiTotal: '총 측정 건수',
                kpiPass: '합격 (Pass)',
                kpiFail: '불합격 (Fail)',
                kpiAvgHi: '평균 입열량',
                passTxt: '합격',
                failTxt: '불합격',
                unitCase: '건',
                inspSign: '검사원 서명 (Inspector Signature)',
                apprSign: '입회 / 승인자 서명 (Approved By Signature)',
                filePrefix: 'Welding_Daily_Report',
                summaryTitle: '용접 변수 일일 검사 보고서',
                summaryDate: '일자',
                summaryProj: '프로젝트',
                summaryInsp: '검사원',
                summaryStdProc: '규격/공정',
                summaryResult: '측정 결과',
                summaryCountFmt: function(tot, p, f, r) { return '총 ' + tot + '건 (합격 ' + p + '건, 불합격 ' + f + '건, 합격률 ' + r + ')'; },
                summaryAvgHi: '평균 입열량',
                summaryNotice: '※ Heat-Input Calculator Pro v2.7 공인 일일 검사 보고서',
                clipboardSuccess: '📋 일일 검사 보고서 요약이 클립보드에 복사되었습니다.\n카카오톡이나 메신저, 이메일에 바로 붙여넣기 하실 수 있습니다.',
                periodLbl: '보고서 기간',
                periodDaily: '일간',
                periodWeekly: '주간',
                periodMonthly: '월간',
                titleWeekly: '용접 변수 주간 검사 보고서 (Weekly Welding Parameter Check Report)',
                titleMonthly: '용접 변수 월간 검사 보고서 (Monthly Welding Parameter Check Report)',
                modalTitleWeekly: '용접 변수 주간 검사 보고서',
                modalTitleMonthly: '용접 변수 월간 검사 보고서',
                filePrefixWeekly: 'Welding_Weekly_Report',
                filePrefixMonthly: 'Welding_Monthly_Report',
                emptyPeriod: '선택한 기간에 해당하는 측정 기록이 없습니다.'
            },
            en: {
                title: 'Daily Welding Parameter Check Report',
                modalTitle: 'Daily Welding Parameter Check Report',
                projLbl: 'Project / Structure',
                inspLbl: 'Inspector Name',
                projPh: 'e.g. HULL 1042 / A-BLOCK',
                inspPh: 'e.g. John Doe (CWI)',
                projDefault: 'PROJECT-WELD-01',
                inspDefault: 'QC Inspector',
                dateLbl: 'Date:',
                stdLbl: 'Standard:',
                procLbl: 'Process:',
                stdProcLbl: 'Standard / Process:',
                rateLbl: 'Pass Rate:',
                kpiTotal: 'Total Records',
                kpiPass: 'Pass',
                kpiFail: 'Fail',
                kpiAvgHi: 'Avg Heat Input',
                passTxt: 'PASS',
                failTxt: 'FAIL',
                unitCase: 'records',
                inspSign: 'Inspector Signature',
                apprSign: 'Approved By Signature',
                filePrefix: 'Welding_Daily_Report',
                summaryTitle: 'Daily Welding Parameter Check Report',
                summaryDate: 'Date',
                summaryProj: 'Project',
                summaryInsp: 'Inspector',
                summaryStdProc: 'Standard/Process',
                summaryResult: 'Results',
                summaryCountFmt: function(tot, p, f, r) { return 'Total ' + tot + ' (Pass: ' + p + ', Fail: ' + f + ', Rate: ' + r + ')'; },
                summaryAvgHi: 'Avg Heat Input',
                summaryNotice: '※ Heat-Input Calculator Pro v2.7 Certified Daily Report',
                clipboardSuccess: '📋 Daily inspection report summary copied to clipboard.\nYou can paste it directly into email or messengers.',
                periodLbl: 'Report Period',
                periodDaily: 'Daily',
                periodWeekly: 'Weekly',
                periodMonthly: 'Monthly',
                titleWeekly: 'Weekly Welding Parameter Check Report',
                titleMonthly: 'Monthly Welding Parameter Check Report',
                modalTitleWeekly: 'Weekly Welding Parameter Check Report',
                modalTitleMonthly: 'Monthly Welding Parameter Check Report',
                filePrefixWeekly: 'Welding_Weekly_Report',
                filePrefixMonthly: 'Welding_Monthly_Report',
                emptyPeriod: 'No measurement records found for the selected period.'
            },
            es: {
                title: 'Informe Diario de Inspección de Soldadura',
                modalTitle: 'Informe Diario de Inspección de Soldadura',
                projLbl: 'Proyecto / Estructura',
                inspLbl: 'Nombre del Inspector',
                projPh: 'Ej: HULL 1042 / BLOQUE-A',
                inspPh: 'Ej: Juan Pérez (CWI)',
                projDefault: 'PROYECTO-WELD-01',
                inspDefault: 'Inspector QC',
                dateLbl: 'Fecha:',
                stdLbl: 'Norma:',
                procLbl: 'Proceso:',
                stdProcLbl: 'Norma / Proceso:',
                rateLbl: 'Tasa de Aprobación:',
                kpiTotal: 'Total Mediciones',
                kpiPass: 'Aprobado',
                kpiFail: 'Rechazado',
                kpiAvgHi: 'Aporte Térmico Medio',
                passTxt: 'APROBADO',
                failTxt: 'RECHAZADO',
                unitCase: 'reg.',
                inspSign: 'Firma del Inspector',
                apprSign: 'Firma del Aprobador / Supervisor',
                filePrefix: 'Informe_Diario_Soldadura',
                summaryTitle: 'Informe Diario de Inspección de Soldadura',
                summaryDate: 'Fecha',
                summaryProj: 'Proyecto',
                summaryInsp: 'Inspector',
                summaryStdProc: 'Norma/Proceso',
                summaryResult: 'Resultados',
                summaryCountFmt: function(tot, p, f, r) { return 'Total ' + tot + ' (Aprobados: ' + p + ', Rechazados: ' + f + ', Tasa: ' + r + ')'; },
                summaryAvgHi: 'Aporte Térmico Medio',
                summaryNotice: '※ Informe Certificado Heat-Input Calculator Pro v2.7',
                clipboardSuccess: '📋 Resumen del informe diario copiado al portapapeles.\nPuede pegarlo directamente en correo o mensajería.',
                periodLbl: 'Período',
                periodDaily: 'Diario',
                periodWeekly: 'Semanal',
                periodMonthly: 'Mensual',
                titleWeekly: 'Informe Semanal de Inspección de Soldadura',
                titleMonthly: 'Informe Mensual de Inspección de Soldadura',
                modalTitleWeekly: 'Informe Semanal de Inspección de Soldadura',
                modalTitleMonthly: 'Informe Mensual de Inspección de Soldadura',
                filePrefixWeekly: 'Informe_Semanal_Soldadura',
                filePrefixMonthly: 'Informe_Mensual_Soldadura',
                emptyPeriod: 'No hay registros en el período seleccionado.'
            },
            zh: {
                title: '焊接每日检验报告',
                modalTitle: '焊接每日检验报告',
                projLbl: '工程 / 项目名称',
                inspLbl: '检验员姓名',
                projPh: '例: 船体 1042 / A分段',
                inspPh: '例: 张伟 (CWI)',
                projDefault: 'PROJECT-WELD-01',
                inspDefault: 'QC 检验员',
                dateLbl: '检验日期:',
                stdLbl: '标准:',
                procLbl: '工艺:',
                stdProcLbl: '标准 / 工艺:',
                rateLbl: '合格率:',
                kpiTotal: '总测量次数',
                kpiPass: '合格',
                kpiFail: '不合格',
                kpiAvgHi: '平均热输入',
                passTxt: '合格',
                failTxt: '不合格',
                unitCase: '项',
                inspSign: '检验员签字',
                apprSign: '见证人 / 批准人签字',
                filePrefix: 'Welding_Daily_Report_ZH',
                summaryTitle: '焊接每日检验报告',
                summaryDate: '日期',
                summaryProj: '项目',
                summaryInsp: '检验员',
                summaryStdProc: '标准/工艺',
                summaryResult: '测量结果',
                summaryCountFmt: function(tot, p, f, r) { return '共 ' + tot + ' 项 (合格: ' + p + ' 项, 不合格: ' + f + ' 项, 合格率: ' + r + ')'; },
                summaryAvgHi: '平均热输入',
                summaryNotice: '※ Heat-Input Calculator Pro v2.7 官方每日检验报告',
                clipboardSuccess: '📋 每日检验报告摘要已复制到剪贴板。\n可直接粘贴至邮件或通讯软件。',
                periodLbl: '报告周期',
                periodDaily: '日报',
                periodWeekly: '周报',
                periodMonthly: '月报',
                titleWeekly: '焊接每周检验报告',
                titleMonthly: '焊接每月检验报告',
                modalTitleWeekly: '焊接每周检验报告',
                modalTitleMonthly: '焊接每月检验报告',
                filePrefixWeekly: 'Welding_Weekly_Report_ZH',
                filePrefixMonthly: 'Welding_Monthly_Report_ZH',
                emptyPeriod: '所选时间段内没有测量记录。'
            },
            ja: {
                title: '溶接 日常検査報告書',
                modalTitle: '溶接 日常検査報告書',
                projLbl: 'プロジェクト / 工事名',
                inspLbl: '検査員氏名',
                projPh: '例: 船体 1042 / Aブロック',
                inspPh: '例: 山田太郎 (CWI)',
                projDefault: 'PROJECT-WELD-01',
                inspDefault: 'QC 検査員',
                dateLbl: '検査日:',
                stdLbl: '規格:',
                procLbl: 'プロセス:',
                stdProcLbl: '規格 / プロセス:',
                rateLbl: '合格率:',
                kpiTotal: '総測定件数',
                kpiPass: '合格',
                kpiFail: '不合格',
                kpiAvgHi: '平均入熱量',
                passTxt: '合格',
                failTxt: '不合格',
                unitCase: '件',
                inspSign: '検査員署名',
                apprSign: '立会人 / 承認者署名',
                filePrefix: 'Welding_Daily_Report_JA',
                summaryTitle: '溶接 日常検査報告書',
                summaryDate: '日付',
                summaryProj: 'プロジェクト',
                summaryInsp: '検査員',
                summaryStdProc: '規格/プロセス',
                summaryResult: '測定結果',
                summaryCountFmt: function(tot, p, f, r) { return '合計 ' + tot + ' 件 (合格: ' + p + ' 件, 不合格: ' + f + ' 件, 合格率: ' + r + ')'; },
                summaryAvgHi: '平均入熱量',
                summaryNotice: '※ Heat-Input Calculator Pro v2.7 公認 日常検査報告書',
                clipboardSuccess: '📋 日常検査報告書の要約をクリップボードにコピーしました。\nメールやメッセージに貼り付けて共有できます。',
                periodLbl: '集計期間',
                periodDaily: '日次',
                periodWeekly: '週間',
                periodMonthly: '月間',
                titleWeekly: '溶接 週間検査報告書',
                titleMonthly: '溶接 月間検査報告書',
                modalTitleWeekly: '溶接 週間検査報告書',
                modalTitleMonthly: '溶接 月間検査報告書',
                filePrefixWeekly: 'Welding_Weekly_Report_JA',
                filePrefixMonthly: 'Welding_Monthly_Report_JA',
                emptyPeriod: '選択した期間に該当する測定記録がありません。'
            }
        };
        return dict[lang] || dict.ko;
    },

    _reportPeriod: 'daily',
    _reportRefDate: null,

    _formatLocalDate: function(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    },

    _getReportDateRange: function(period, refStr) {
        const todayStr = this._formatLocalDate(new Date());
        const baseStr = /^\d{4}-\d{2}-\d{2}$/.test(refStr || '') ? refStr : todayStr;
        const [yy, mm, dd] = baseStr.split('-').map(Number);
        const base = new Date(yy, mm - 1, dd);

        if (period === 'weekly') {
            const dow = (base.getDay() + 6) % 7;
            const mon = new Date(yy, mm - 1, dd - dow);
            const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
            const start = this._formatLocalDate(mon);
            const end = this._formatLocalDate(sun);
            return { start, end, ref: baseStr, label: `${start} ~ ${end}` };
        }
        if (period === 'monthly') {
            const first = new Date(yy, mm - 1, 1);
            const last = new Date(yy, mm, 0);
            const start = this._formatLocalDate(first);
            const end = this._formatLocalDate(last);
            return { start, end, ref: baseStr, label: `${baseStr.slice(0, 7)} (${start} ~ ${end})` };
        }
        return { start: baseStr, end: baseStr, ref: baseStr, label: baseStr };
    },

    _getReportMetaByPeriod: function(i18n, period) {
        if (period === 'weekly') {
            return {
                title: i18n.titleWeekly || i18n.title,
                modalTitle: i18n.modalTitleWeekly || i18n.modalTitle,
                filePrefix: i18n.filePrefixWeekly || i18n.filePrefix
            };
        }
        if (period === 'monthly') {
            return {
                title: i18n.titleMonthly || i18n.title,
                modalTitle: i18n.modalTitleMonthly || i18n.modalTitle,
                filePrefix: i18n.filePrefixMonthly || i18n.filePrefix
            };
        }
        return {
            title: i18n.title,
            modalTitle: i18n.modalTitle,
            filePrefix: i18n.filePrefix
        };
    },

    _getFilteredReportRecords: function() {
        const period = this._reportPeriod || 'daily';
        const range = this._getReportDateRange(period, this._reportRefDate);
        const all = this.getRecords();
        const filtered = all.filter(r => {
            const d = String(r.date || '').slice(0, 10);
            return d >= range.start && d <= range.end;
        });
        return { list: filtered, period, range };
    },

    setReportPeriod: function(period) {
        this._reportPeriod = (period === 'weekly' || period === 'monthly') ? period : 'daily';
        const body = document.getElementById('subPageBody');
        const title = document.getElementById('subPageTitle');
        if (!body) return;
        const projEl = document.getElementById('reportProjectName');
        const inspEl = document.getElementById('reportInspectorName');
        const savedProj = projEl ? projEl.value : null;
        const savedInsp = inspEl ? inspEl.value : null;
        const lang = localStorage.getItem('HI_LANG') || 'ko';
        const i18n = this._getDailyReportI18n(lang);
        if (title) title.innerText = this._getReportMetaByPeriod(i18n, this._reportPeriod).modalTitle;
        this.renderDailyReportModal(body, null, savedProj, savedInsp);
    },

    setReportRefDate: function(val) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(val || '')) {
            this._reportRefDate = val;
            const body = document.getElementById('subPageBody');
            if (!body) return;
            const projEl = document.getElementById('reportProjectName');
            const inspEl = document.getElementById('reportInspectorName');
            const savedProj = projEl ? projEl.value : null;
            const savedInsp = inspEl ? inspEl.value : null;
            this.renderDailyReportModal(body, null, savedProj, savedInsp);
        }
    },

    openDailyReportModal: function() {
        if (!_proVerifiedState) {
            alert(this.t('alert_pro_report'));
            this.openModal('pages/settings.html');
            return;
        }
        const all = this.getRecords();
        if (all.length === 0) {
            alert(this.t('msg_empty_log'));
            return;
        }
        if (!this._reportRefDate) {
            this._reportRefDate = String(all[0].date || '').slice(0, 10) || this._formatLocalDate(new Date());
        }
        const lang = localStorage.getItem('HI_LANG') || 'ko';
        const i18n = this._getDailyReportI18n(lang);
        const meta = this._getReportMetaByPeriod(i18n, this._reportPeriod);
        this._currentModalType = 'daily_report';
        const modal = document.getElementById('subPageModal');
        const title = document.getElementById('subPageTitle');
        const body = document.getElementById('subPageBody');
        if (!modal || !body || !title) return;

        title.innerText = meta.modalTitle;
        this.renderDailyReportModal(body);
        modal.classList.remove('hidden');
    },

    renderDailyReportModal: function(body, _unusedList, savedProj, savedInsp) {
        const lang = localStorage.getItem('HI_LANG') || 'ko';
        const i18n = this._getDailyReportI18n(lang);
        const { list, period, range } = this._getFilteredReportRecords();
        const presets = (typeof DataStore !== 'undefined' && DataStore.getWpsPresets) ? DataStore.getWpsPresets() : [];
        const welderMap = this.buildWelderLookupMap(lang);

        let passCount = 0;
        list.forEach(r => {
            const j = this.resolveRecordJudgment(r, presets);
            if (j === '합격' || j === 'OK' || j === 'Passed' || j === 'Pass' || j === this.t('judge_pass')) passCount++;
        });
        const failCount = list.length - passCount;
        const passRate = list.length ? (((passCount / list.length) * 100).toFixed(1) + '%') : '0.0%';
        const avgHi = list.length ? (list.reduce((acc, r) => acc + (parseFloat(r.result) || 0), 0) / list.length).toFixed(2) : '0.00';
        const headers = this._getDailyReportHeaders(lang);

        const tableRowsHtml = list.length ? list.map((r, idx) => {
            const j = this.resolveRecordJudgment(r, presets);
            const isPass = (j === '합격' || j === 'OK' || j === 'Passed' || j === 'Pass' || j === this.t('judge_pass'));
            const judgeDisplay = isPass ? i18n.passTxt : i18n.failTxt;
            const wName = this.resolveRecordWelderName(r, welderMap, lang) || '-';
            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${this.escapeHtml(r.date || '')}</td>
                    <td>${this.escapeHtml(r.time || '')}</td>
                    <td>${this.escapeHtml(r.std || '')}</td>
                    <td>${this.escapeHtml(r.process || '')}</td>
                    <td style="font-weight:800;">${this.escapeHtml(r.wpsNo || '-')}</td>
                    <td>${this.escapeHtml(r.pass || '-')}</td>
                    <td>${this.escapeHtml(r.welderId || '-')}</td>
                    <td>${this.escapeHtml(wName)}</td>
                    <td>${this.escapeHtml(r.dept || '-')}</td>
                    <td>${this.escapeHtml(r.jointNo || '-')}</td>
                    <td>${r.V}</td>
                    <td>${r.A}</td>
                    <td>${r.L}</td>
                    <td>${r.T}</td>
                    <td style="font-weight:900; color:var(--brand-orange);">${r.result}</td>
                    <td><span class="${isPass ? 'badge-pass' : 'badge-fail'}">${this.escapeHtml(judgeDisplay)}</span></td>
                </tr>
            `;
        }).join('') : `<tr><td colspan="${headers.length}" style="padding:20px; text-align:center; color:var(--text-muted); font-weight:700;">${this.escapeHtml(i18n.emptyPeriod)}</td></tr>`;

        const projVal = savedProj != null ? savedProj : i18n.projDefault;
        const inspVal = savedInsp != null ? savedInsp : i18n.inspDefault;
        const periodBtnStyle = (p) => p === period
            ? 'background:var(--brand-orange); color:#fff; border:1.5px solid var(--brand-orange); font-weight:900;'
            : 'background:var(--bg-card); color:var(--text-primary); border:1.5px solid var(--border-strong); font-weight:700;';

        body.innerHTML = `
            <div class="report-modal-wrap">
                <div class="report-meta-box">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--border-light);">
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            <span style="font-size:12px; font-weight:800; color:var(--text-muted);">🗓️ ${i18n.periodLbl}:</span>
                            <button type="button" onclick="MainController.setReportPeriod('daily')" style="padding:5px 12px; border-radius:7px; font-size:12px; cursor:pointer; ${periodBtnStyle('daily')}">${i18n.periodDaily}</button>
                            <button type="button" onclick="MainController.setReportPeriod('weekly')" style="padding:5px 12px; border-radius:7px; font-size:12px; cursor:pointer; ${periodBtnStyle('weekly')}">${i18n.periodWeekly}</button>
                            <button type="button" onclick="MainController.setReportPeriod('monthly')" style="padding:5px 12px; border-radius:7px; font-size:12px; cursor:pointer; ${periodBtnStyle('monthly')}">${i18n.periodMonthly}</button>
                        </div>
                        <input type="date" id="reportRefDate" value="${range.ref}" onchange="MainController.setReportRefDate(this.value)" style="padding:4px 8px; border-radius:7px; border:1.5px solid var(--border-strong); font-size:12px; font-weight:700; background:var(--bg-card); color:var(--text-primary);">
                    </div>
                    <div class="report-meta-grid">
                        <div class="report-meta-item">
                            <label>${i18n.projLbl}</label>
                            <input type="text" id="reportProjectName" placeholder="${i18n.projPh}" value="${this.escapeHtmlAttr(projVal)}" />
                        </div>
                        <div class="report-meta-item">
                            <label>${i18n.inspLbl}</label>
                            <input type="text" id="reportInspectorName" placeholder="${i18n.inspPh}" value="${this.escapeHtmlAttr(inspVal)}" />
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; color:var(--text-muted); padding-top:6px; flex-wrap:wrap; gap:6px;">
                        <span>📅 ${i18n.dateLbl} <strong>${range.label}</strong></span>
                        <span>📐 ${i18n.stdLbl} <strong>${(Calculator.state && Calculator.state.standard) || 'AWS'}</strong> / ${i18n.procLbl} <strong>${(document.getElementById('selProcess') ? document.getElementById('selProcess').value : '') || (Calculator.state && Calculator.state.process) || 'FCAW'}</strong></span>
                        <span>📈 ${i18n.rateLbl} <strong>${passRate}</strong></span>
                    </div>
                </div>

                <div class="report-kpi-row">
                    <div class="report-kpi-card">
                        <div class="report-kpi-val kpi-total">${list.length}</div>
                        <div class="report-kpi-lbl">${i18n.kpiTotal}</div>
                    </div>
                    <div class="report-kpi-card">
                        <div class="report-kpi-val kpi-pass">${passCount}</div>
                        <div class="report-kpi-lbl">${i18n.kpiPass}</div>
                    </div>
                    <div class="report-kpi-card">
                        <div class="report-kpi-val kpi-fail">${failCount}</div>
                        <div class="report-kpi-lbl">${i18n.kpiFail}</div>
                    </div>
                    <div class="report-kpi-card">
                        <div class="report-kpi-val" style="color:#228be6;">${avgHi} <span style="font-size:10px;">kJ/mm</span></div>
                        <div class="report-kpi-lbl">${i18n.kpiAvgHi}</div>
                    </div>
                </div>

                <div class="report-table-scroll">
                    <table class="report-table">
                        <thead>
                            <tr>
                                ${headers.map(h => `<th>${h}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                    </table>
                </div>

                <div class="report-sign-block">
                    <div class="report-sign-grid">
                        <div>
                            <div>${i18n.inspSign}</div>
                            <div class="sign-line"></div>
                        </div>
                        <div>
                            <div>${i18n.apprSign}</div>
                            <div class="sign-line"></div>
                        </div>
                    </div>
                </div>

                <div class="report-action-btns">
                    <button type="button" class="report-act-btn btn-rep-excel" onclick="MainController.exportDailyReportExcel()">
                        ${this.t('btn_export_excel')}
                    </button>
                    <button type="button" class="report-act-btn btn-rep-pdf" onclick="MainController.printDailyReportPDF()">
                        ${this.t('btn_print_pdf')}
                    </button>
                    <button type="button" class="report-act-btn btn-rep-share" onclick="MainController.shareDailyReport()">
                        ${this.t('btn_share_report')}
                    </button>
                </div>
            </div>
        `;
    },

    exportDailyReportExcel: function() {
        const lang = localStorage.getItem('HI_LANG') || 'ko';
        const i18n = this._getDailyReportI18n(lang);
        const { list, period, range } = this._getFilteredReportRecords();
        if (list.length === 0) { alert(i18n.emptyPeriod || this.t('msg_empty_log')); return; }
        const meta = this._getReportMetaByPeriod(i18n, period);
        const welderMap = this.buildWelderLookupMap(lang);
        const presets = (typeof DataStore !== 'undefined' && DataStore.getWpsPresets) ? DataStore.getWpsPresets() : [];
        const today = range.label;
        const fileTag = period === 'daily' ? range.start : (period === 'monthly' ? range.start.slice(0, 7) : `${range.start}_${range.end}`);
        const projEl = document.getElementById('reportProjectName');
        const inspEl = document.getElementById('reportInspectorName');
        const projName = (projEl ? projEl.value : '').trim() || '-';
        const inspName = (inspEl ? inspEl.value : '').trim() || '-';
        const curStd = (Calculator.state && Calculator.state.standard) || 'AWS';
        const curProc = (document.getElementById('selProcess') ? document.getElementById('selProcess').value : '') || (Calculator.state && Calculator.state.process) || 'FCAW';

        let passCount = 0;
        list.forEach(r => {
            const j = this.resolveRecordJudgment(r, presets);
            if (j === '합격' || j === 'OK' || j === 'Passed' || j === 'Pass' || j === this.t('judge_pass')) passCount++;
        });
        const failCount = list.length - passCount;
        const passRate = ((passCount / list.length) * 100).toFixed(1) + '%';
        const avgHi = (list.reduce((acc, r) => acc + (parseFloat(r.result) || 0), 0) / list.length).toFixed(2);

        const titleText = meta.title;
        const headers = this._getDailyReportHeaders(lang);

        const rowsHtml = list.map((r, idx) => {
            const j = this.resolveRecordJudgment(r, presets);
            const isPass = (j === '합격' || j === 'OK' || j === 'Passed' || j === 'Pass' || j === this.t('judge_pass'));
            const judgeDisplay = isPass ? i18n.passTxt : i18n.failTxt;
            const wName = this.resolveRecordWelderName(r, welderMap, lang) || '-';
            const bg = isPass ? '#f0fdf4' : '#fff5f5';
            const jColor = isPass ? '#166534' : '#991b1b';
            return `
                <tr style="background:${bg}; text-align:center;">
                    <td style="border:1px solid #ccc; padding:6px;">${idx + 1}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${this.escapeHtml(r.date || '')}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${this.escapeHtml(r.time || '')}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${this.escapeHtml(r.std || '')}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${this.escapeHtml(r.process || '')}</td>
                    <td style="border:1px solid #ccc; padding:6px; font-weight:bold;">${this.escapeHtml(r.wpsNo || '-')}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${this.escapeHtml(r.pass || '-')}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${this.escapeHtml(r.welderId || '-')}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${this.escapeHtml(wName)}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${this.escapeHtml(r.dept || '-')}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${this.escapeHtml(r.jointNo || '-')}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${r.V}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${r.A}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${r.L}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${r.T}</td>
                    <td style="border:1px solid #ccc; padding:6px; font-weight:bold; color:#d9480f;">${r.result}</td>
                    <td style="border:1px solid #ccc; padding:6px; font-weight:bold; color:${jColor};">${this.escapeHtml(judgeDisplay)}</td>
                </tr>
            `;
        }).join('');

        const excelHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>Daily_Report</x:Name>
                                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
                <style>
                    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
                    th { background-color: #212529; color: #ffffff; border: 1px solid #000; padding: 8px; font-weight: bold; }
                </style>
            </head>
            <body>
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        <td colspan="17" style="font-size:18pt; font-weight:bold; text-align:center; padding:15px; background:#fff3e6; color:#d9480f; border:1px solid #ffa94d;">
                            ${titleText}
                        </td>
                    </tr>
                    <tr><td colspan="17" style="height:10px;"></td></tr>
                    <tr style="font-weight:bold; background:#f8f9fa;">
                        <td colspan="4" style="border:1px solid #dee2e6; padding:6px;">📅 ${i18n.dateLbl} ${today}</td>
                        <td colspan="5" style="border:1px solid #dee2e6; padding:6px;">🏗️ ${i18n.projLbl}: ${this.escapeHtml(projName)}</td>
                        <td colspan="4" style="border:1px solid #dee2e6; padding:6px;">👤 ${i18n.inspLbl}: ${this.escapeHtml(inspName)}</td>
                        <td colspan="4" style="border:1px solid #dee2e6; padding:6px;">📐 ${i18n.stdProcLbl} ${curStd} / ${curProc}</td>
                    </tr>
                    <tr style="font-weight:bold; background:#e7f5ff;">
                        <td colspan="4" style="border:1px solid #dee2e6; padding:6px;">${i18n.kpiTotal}: ${list.length} ${i18n.unitCase}</td>
                        <td colspan="4" style="border:1px solid #dee2e6; padding:6px; color:#2b8a3e;">${i18n.kpiPass}: ${passCount}</td>
                        <td colspan="4" style="border:1px solid #dee2e6; padding:6px; color:#c92a2a;">${i18n.kpiFail}: ${failCount}</td>
                        <td colspan="3" style="border:1px solid #dee2e6; padding:6px; color:#1864ab;">${i18n.rateLbl} ${passRate}</td>
                        <td colspan="2" style="border:1px solid #dee2e6; padding:6px;">${i18n.kpiAvgHi}: ${avgHi} kJ/mm</td>
                    </tr>
                    <tr><td colspan="17" style="height:10px;"></td></tr>
                    <tr style="background:#212529; color:#fff; text-align:center;">
                        ${headers.map(h => `<th style="background:#212529; color:#fff; border:1px solid #495057; padding:8px;">${h}</th>`).join('')}
                    </tr>
                    ${rowsHtml}
                    <tr><td colspan="17" style="height:15px;"></td></tr>
                    <tr>
                        <td colspan="8" style="border:1px solid #000; padding:15px; font-weight:bold; height:60px; vertical-align:top;">
                            ${i18n.inspSign}:<br><br>____________________________________
                        </td>
                        <td colspan="9" style="border:1px solid #000; padding:15px; font-weight:bold; height:60px; vertical-align:top;">
                            ${i18n.apprSign}:<br><br>____________________________________
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        try {
            const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${meta.filePrefix}_${fileTag}.xls`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                try { document.body.removeChild(a); } catch (e) {}
                URL.revokeObjectURL(url);
            }, 1000);
        } catch (e) {
            alert(e.message || 'Excel export error');
        }
    },

    printDailyReportPDF: function() {
        const lang = localStorage.getItem('HI_LANG') || 'ko';
        const i18n = this._getDailyReportI18n(lang);
        const { list, period, range } = this._getFilteredReportRecords();
        if (list.length === 0) { alert(i18n.emptyPeriod || this.t('msg_empty_log')); return; }
        const meta = this._getReportMetaByPeriod(i18n, period);
        const welderMap = this.buildWelderLookupMap(lang);
        const presets = (typeof DataStore !== 'undefined' && DataStore.getWpsPresets) ? DataStore.getWpsPresets() : [];
        const today = range.label;
        const projEl = document.getElementById('reportProjectName');
        const inspEl = document.getElementById('reportInspectorName');
        const projName = (projEl ? projEl.value : '').trim() || '-';
        const inspName = (inspEl ? inspEl.value : '').trim() || '-';
        const curStd = (Calculator.state && Calculator.state.standard) || 'AWS';
        const curProc = (document.getElementById('selProcess') ? document.getElementById('selProcess').value : '') || (Calculator.state && Calculator.state.process) || 'FCAW';

        let passCount = 0;
        list.forEach(r => {
            const j = this.resolveRecordJudgment(r, presets);
            if (j === '합격' || j === 'OK' || j === 'Passed' || j === 'Pass' || j === this.t('judge_pass')) passCount++;
        });
        const failCount = list.length - passCount;
        const passRate = ((passCount / list.length) * 100).toFixed(1) + '%';
        const avgHi = (list.reduce((acc, r) => acc + (parseFloat(r.result) || 0), 0) / list.length).toFixed(2);

        const titleText = meta.title;
        const headers = this._getDailyReportHeaders(lang);

        const rowsHtml = list.map((r, idx) => {
            const j = this.resolveRecordJudgment(r, presets);
            const isPass = (j === '합격' || j === 'OK' || j === 'Passed' || j === 'Pass' || j === this.t('judge_pass'));
            const judgeDisplay = isPass ? i18n.passTxt : i18n.failTxt;
            const wName = this.resolveRecordWelderName(r, welderMap, lang) || '-';
            const bg = isPass ? '' : 'background:#fff5f5;';
            const jColor = isPass ? '#2b8a3e' : '#c92a2a';
            return `
                <tr style="${bg}">
                    <td>${idx + 1}</td>
                    <td>${this.escapeHtml(r.date || '')}</td>
                    <td>${this.escapeHtml(r.time || '')}</td>
                    <td>${this.escapeHtml(r.std || '')}</td>
                    <td>${this.escapeHtml(r.process || '')}</td>
                    <td style="font-weight:bold;">${this.escapeHtml(r.wpsNo || '-')}</td>
                    <td>${this.escapeHtml(r.pass || '-')}</td>
                    <td>${this.escapeHtml(r.welderId || '-')}</td>
                    <td>${this.escapeHtml(wName)}</td>
                    <td>${this.escapeHtml(r.dept || '-')}</td>
                    <td>${this.escapeHtml(r.jointNo || '-')}</td>
                    <td>${r.V}</td>
                    <td>${r.A}</td>
                    <td>${r.L}</td>
                    <td>${r.T}</td>
                    <td style="font-weight:bold; color:#e8590c;">${r.result}</td>
                    <td style="font-weight:bold; color:${jColor};">${this.escapeHtml(judgeDisplay)}</td>
                </tr>
            `;
        }).join('');

        const printHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${titleText} - ${today}</title>
                <style>
                    @page { size: A4 landscape; margin: 10mm; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 8.5pt; color: #212529; margin: 0; padding: 0; }
                    .header-title { font-size: 14pt; font-weight: 900; text-align: center; margin-bottom: 8px; color: #d9480f; border-bottom: 2px solid #fd7e14; padding-bottom: 4px; }
                    .meta-bar { display: flex; justify-content: space-between; font-size: 8pt; margin-bottom: 6px; padding: 4px 8px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; }
                    .kpi-bar { display: flex; justify-content: space-around; background: #e7f5ff; border: 1px solid #74c0fc; border-radius: 4px; padding: 4px 6px; margin-bottom: 8px; text-align: center; }
                    .kpi-item .val { font-size: 11pt; font-weight: 800; }
                    .kpi-item .lbl { font-size: 7pt; color: #495057; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
                    th, td { border: 1px solid #ced4da; padding: 3px 4px; text-align: center; font-size: 7.5pt; }
                    th { background: #343a40; color: #fff; font-weight: 700; }
                    tr:nth-child(even) { background: #fafafa; }
                    .sign-box { display: flex; justify-content: space-between; gap: 16px; margin-top: 10px; page-break-inside: avoid; }
                    .sign-col { flex: 1; border: 1px solid #333; border-radius: 4px; padding: 8px; height: 55px; }
                    .sign-col-title { font-weight: 800; font-size: 8pt; margin-bottom: 22px; }
                    .sign-col-line { border-bottom: 1px solid #555; width: 80%; }
                </style>
            </head>
            <body>
                <div class="header-title">${titleText}</div>
                <div class="meta-bar">
                    <span>📅 <strong>${i18n.dateLbl}</strong> ${today}</span>
                    <span>🏗️ <strong>${i18n.projLbl}:</strong> ${this.escapeHtml(projName)}</span>
                    <span>👤 <strong>${i18n.inspLbl}:</strong> ${this.escapeHtml(inspName)}</span>
                    <span>📐 <strong>${i18n.stdProcLbl}</strong> ${curStd} / ${curProc}</span>
                </div>
                <div class="kpi-bar">
                    <div class="kpi-item"><div class="val">${list.length}</div><div class="lbl">${i18n.kpiTotal}</div></div>
                    <div class="kpi-item"><div class="val" style="color:#2b8a3e;">${passCount}</div><div class="lbl">${i18n.kpiPass}</div></div>
                    <div class="kpi-item"><div class="val" style="color:#c92a2a;">${failCount}</div><div class="lbl">${i18n.kpiFail}</div></div>
                    <div class="kpi-item"><div class="val" style="color:#1864ab;">${passRate}</div><div class="lbl">${i18n.rateLbl}</div></div>
                    <div class="kpi-item"><div class="val" style="color:#e8590c;">${avgHi} <span style="font-size:7pt;">kJ/mm</span></div><div class="lbl">${i18n.kpiAvgHi}</div></div>
                </div>
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
                <div class="sign-box">
                    <div class="sign-col">
                        <div class="sign-col-title">${i18n.inspSign}</div>
                        <div class="sign-col-line"></div>
                    </div>
                    <div class="sign-col">
                        <div class="sign-col-title">${i18n.apprSign}</div>
                        <div class="sign-col-line"></div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWin = window.open('', '_blank', 'width=1100,height=800');
        if (printWin) {
            printWin.document.open();
            printWin.document.write(printHtml);
            printWin.document.close();
            setTimeout(() => {
                printWin.focus();
                printWin.print();
            }, 300);
        } else {
            window.print();
        }
    },

    shareDailyReport: async function() {
        const lang = localStorage.getItem('HI_LANG') || 'ko';
        const i18n = this._getDailyReportI18n(lang);
        const { list, period, range } = this._getFilteredReportRecords();
        if (list.length === 0) { alert(i18n.emptyPeriod || this.t('msg_empty_log')); return; }
        const meta = this._getReportMetaByPeriod(i18n, period);
        const presets = (typeof DataStore !== 'undefined' && DataStore.getWpsPresets) ? DataStore.getWpsPresets() : [];
        const welderMap = this.buildWelderLookupMap(lang);
        const today = range.label;
        const fileTag = period === 'daily' ? range.start : (period === 'monthly' ? range.start.slice(0, 7) : `${range.start}_${range.end}`);
        const projEl = document.getElementById('reportProjectName');
        const inspEl = document.getElementById('reportInspectorName');
        const projName = (projEl ? projEl.value : '').trim() || (lang === 'ko' ? '용접 검사' : 'Welding Inspection');
        const inspName = (inspEl ? inspEl.value : '').trim() || '-';
        const curStd = (Calculator.state && Calculator.state.standard) || 'AWS';
        const curProc = (document.getElementById('selProcess') ? document.getElementById('selProcess').value : '') || (Calculator.state && Calculator.state.process) || 'FCAW';

        let passCount = 0;
        list.forEach(r => {
            const j = this.resolveRecordJudgment(r, presets);
            if (j === '합격' || j === 'OK' || j === 'Passed' || j === 'Pass' || j === this.t('judge_pass')) passCount++;
        });
        const failCount = list.length - passCount;
        const passRate = ((passCount / list.length) * 100).toFixed(1) + '%';
        const avgHi = (list.reduce((acc, r) => acc + (parseFloat(r.result) || 0), 0) / list.length).toFixed(2);

        const summaryText = '[' + meta.modalTitle + ']\n' +
            '• ' + i18n.summaryDate + ': ' + today + '\n' +
            '• ' + i18n.summaryProj + ': ' + projName + '\n' +
            '• ' + i18n.summaryInsp + ': ' + inspName + '\n' +
            '• ' + i18n.summaryStdProc + ': ' + curStd + ' / ' + curProc + '\n' +
            '• ' + i18n.summaryResult + ': ' + i18n.summaryCountFmt(list.length, passCount, failCount, passRate) + '\n' +
            '• ' + i18n.summaryAvgHi + ': ' + avgHi + ' kJ/mm\n\n' +
            i18n.summaryNotice;

        if (navigator.share) {
            try {
                const headers = this._getDailyReportHeaders(lang);
                const csvEsc = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
                const rows = list.map((r, idx) => {
                    const j = this.resolveRecordJudgment(r, presets);
                    const isPass = (j === '합격' || j === 'OK' || j === 'Passed' || j === 'Pass' || j === this.t('judge_pass'));
                    const judgeDisplay = isPass ? i18n.passTxt : i18n.failTxt;
                    return [idx + 1, r.date, r.time, r.std, r.process, csvEsc(r.wpsNo), csvEsc(r.pass), csvEsc(r.welderId), csvEsc(this.resolveRecordWelderName(r, welderMap, lang)), csvEsc(r.dept), csvEsc(r.jointNo), r.V, r.A, r.L, r.T, r.result, csvEsc(judgeDisplay)].join(',');
                });
                const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

                let sharedWithFile = false;
                try {
                    const file = new File([csvContent], `${meta.filePrefix}_${fileTag}.csv`, { type: 'text/csv' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: `${meta.modalTitle} (${today})`,
                            text: summaryText,
                            files: [file]
                        });
                        sharedWithFile = true;
                    }
                } catch (fe) {}

                if (!sharedWithFile) {
                    await navigator.share({
                        title: `${meta.modalTitle} (${today})`,
                        text: summaryText
                    });
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this._copyReportToClipboard(summaryText, i18n);
                }
            }
        } else {
            this._copyReportToClipboard(summaryText, i18n);
        }
    },

    _copyReportToClipboard: function(text, i18n = null) {
        const lang = localStorage.getItem('HI_LANG') || 'ko';
        const reportI18n = i18n || this._getDailyReportI18n(lang);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                alert(reportI18n.clipboardSuccess);
            }).catch(() => { alert(text); });
        } else {
            alert(text);
        }
    },

    certWelders: [
        {"welder_no":"YU-WQT-007","name":"한영우","alt":"Han Yeong-U","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-008","name":"김민수","alt":"Gim Min-Su","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-009","name":"하태민","alt":"Ha Tae-Min","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-010","name":"손주현","alt":"Son Ju-Hyeon","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-011","name":"윤준혁","alt":"Yun Jun-Hyeok","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-012","name":"이상현","alt":"Lee Sang-Hyeon","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-013","name":"김유열","alt":"Kim Yu-Yeol","dept":"Welder - FCAW(136), TIG(141)"},
        {"welder_no":"YU-WQT-014","name":"박상윤","alt":"Park Sang-Yun","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-016","name":"이춘화","alt":"Li Chun-Hua","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-017","name":"장옥영","alt":"Zhang Yur-Ong","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-018","name":"최유원","alt":"Choi Yu-Won","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-019","name":"탕","alt":"Ho Trong Thang","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-020","name":"박동준","alt":"Park Dong-Jun","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-039","name":"김대호","alt":"Kim Dae-ho","dept":"SAW Operator - FCAW(136), SAW(121)"},
        {"welder_no":"YU-WQT-044","name":"서형문","alt":"Seo Hyung-moon","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-075","name":"성경용","alt":"Seong Gyeong- Yong","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-076","name":"정상호","alt":"Jeong Sang-Ho","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-077","name":"김종태","alt":"Kim Jong-Tae","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-096","name":"신춘호","alt":"SHEN CHUNHAO","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-097","name":"응엉","alt":"PHI DINH NGOC","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-098","name":"박성근","alt":"Park Seong- Geun","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-099","name":"문홍석","alt":"Moon Hong- Seok","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-100","name":"러이","alt":"NGO XUAN HUU","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-101","name":"주안","alt":"NGO ANH","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-102","name":"안잘리","alt":"SURAMANEE ANCHALEE","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-103","name":"나샤밧","alt":"THEERAITTHIMAI TREE NATCHAPHAT","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-111","name":"흐엉","alt":"NGUYEN CONGHUOUG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-112","name":"서보철","alt":"Seo Bo-Cheol","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-113","name":"문경곤","alt":"Moon Kyoung- Gon","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-114","name":"김채연","alt":"CAO THI CAM","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-115","name":"누","alt":"KUMDI TEERATUM","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-116","name":"다와사이","alt":"SAESIA THAWATCHAI","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-117","name":"피라퐁","alt":"PHANGSRI PEERAPHONG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-118","name":"딱","alt":"WANNEE MIKTHA","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-119","name":"왓차림","alt":"CHANAPOTWATC HARIN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-120","name":"유영토","alt":"LIU YONGTAO","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-121","name":"조암","alt":"ZHAO YAN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-122","name":"박형건","alt":"PIAO HENGQIAN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-123","name":"뚝따","alt":"PUTTHACO PUTTHARUGSA","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-124","name":"분","alt":"KANSOPHA PUNYISA","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-125","name":"김기호","alt":"Kim Gi-Ho","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-126","name":"이기승","alt":"Lee Gi-Seung","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-127","name":"백룡","alt":"SRENG VENGLONG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-128","name":"김홍","alt":"HENG KIM","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-129","name":"두치","alt":"KONG TOCH","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-130","name":"세레에","alt":"YOEURN SOKSEREY","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-132","name":"딘타인","alt":"NGUYEN DINHTHANH","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-133","name":"양청춘","alt":"YANG CHENGCHUN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-134","name":"위샨","alt":"MUEANGJAI WISAN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-137","name":"지미","alt":"OONG- AROONRUT MA- IN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-142","name":"김영인","alt":"KIM YEONG-IN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-144","name":"조사현","alt":"JO SA-HYEON","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-159","name":"반","alt":"LA ANH VAN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-162","name":"정남일","alt":"JEONG NAM-IL","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-163","name":"백성민","alt":"BAEK SEONG- MIN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-164","name":"전상원","alt":"JEON SANG- WON","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-179","name":"구이엣","alt":"PHI DINH QUYET","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-180","name":"김병호","alt":"KIM BYEONG-HO","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-181","name":"기엉","alt":"CAO KIEN CUONG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-182","name":"장지강","alt":"ZAANG ZHIQIANG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-183","name":"호안","alt":"BIEN VAN HOAN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-184","name":"황","alt":"DUONG VAN HOANG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-203","name":"홍보","alt":"LIU HINGBO","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-205","name":"김태영","alt":"KIM TAE-YEONG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-224","name":"몰클","alt":"PHIMBOOL MONGKOL","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-225","name":"캄런","alt":"PROMNON KOMLON","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-226","name":"전영남","alt":"JEON YEONG NAM","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-227","name":"정명제","alt":"JUNG MYEONG- JE","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-228","name":"최점수","alt":"CHOI JEOM-SU","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-229","name":"김영미","alt":"KIM YEONGMI","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-230","name":"이홍가","alt":"LI HONGJIA","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-231","name":"양상모","alt":"YANG SANG-MO","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-232","name":"중","alt":"NGUYEN VAN TRUNG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-233","name":"기엔","alt":"TRAN VAN KIEN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-141","name":"류동매","alt":"LIU DONGMEI","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-234","name":"컴","alt":"PRAWANTA PRAKOB","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-235","name":"배철국","alt":"BAE CHEOL-GUK","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-236","name":"전효진","alt":"JEON HYO-JIN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-237","name":"윤원중","alt":"YOON WON- JUNG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-238","name":"하가윤","alt":"HA GA-YUN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-239","name":"황대성","alt":"HWANG DAE- SEONG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-240","name":"김광수","alt":"KIM GWANG-SU","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-241","name":"수지타","alt":"JAIWANGLOK SUJITRA","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-242","name":"하이","alt":"PHAT HAI","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-243","name":"피사이","alt":"HENG PISEY","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-244","name":"쇼피아","alt":"BICH SOPHEA","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-245","name":"서인호","alt":"SEO IN-HO","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-246","name":"정일성","alt":"JUNG IL-SEONG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-247","name":"담","alt":"TAN XINMING","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-248","name":"이준우","alt":"LEE JUN-WOO","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-101-1","name":"주앙","alt":"NGO ANH","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-249","name":"김명진","alt":"KIM MYEONG- JIN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-250","name":"사연","alt":"HENG SAYORNN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-251","name":"박일주","alt":"PARK IL-JU","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-252","name":"이대원","alt":"LEE DAE-WON","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-253","name":"박준석","alt":"PARK JUN-SEOK","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-254","name":"박형진","alt":"PARK HYEONG- JIN","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-255","name":"이관호","alt":"LEE GWAN-HO","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-256","name":"박석현","alt":"PARK SEOK- HYEON","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-257","name":"투안","alt":"TRAN VAN TUAN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-258","name":"화이","alt":"CAO QUOC HOAI","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-259","name":"쏘냐","alt":"HOUON SONA","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-260","name":"마라니","alt":"CHHENG MARADY","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-261","name":"키엔","alt":"NGUYEN TRUNG KIEN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-262","name":"피런","alt":"THOEUN PHIRUN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-263","name":"잔륜","alt":"KONDON MR JARUN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-264","name":"김성현","alt":"KIM SEONG- HYEON","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-265","name":"김세평","alt":"KIM SE-PYEONG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-266","name":"배현준","alt":"BAE HYEON-JUN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-267","name":"김대광","alt":"KIM DAE- GWANG","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-268","name":"편일범","alt":"PYEON IL-BEOM","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-269","name":"박아나돌리","alt":"PAK A-NADOLLI","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-270","name":"아실벡","alt":"HAYDAROV ASILBEK","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-245-1","name":"서인호","alt":"SEO IN-HO","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-234-1","name":"컴","alt":"PRAWANTA PRAKOB","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-097-1","name":"응엉","alt":"PHI DINH NGOC","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-271","name":"고강민","alt":"GAO QIANGMIN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-272","name":"이학철","alt":"LEE HAK-CHEOL","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-273","name":"반옌","alt":"MUENKHAM BANYEN","dept":"Auto Carriage - FCAW(136)"},
        {"welder_no":"YU-WQT-274","name":"김신태","alt":"KIM SHIN-TAE","dept":"SAW Operator - SAW(121)"},
        {"welder_no":"YU-WQT-275","name":"박경일","alt":"PARK GYEONG IL","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-276","name":"티엔","alt":"VY VAN TIEN","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-277","name":"딜리라즈","alt":"BHUSAL DILLIRAJ","dept":"Welder - FCAW(136)"},
        {"welder_no":"YU-WQT-278","name":"마우삼","alt":"LIMBU MAUSAM","dept":"Welder - FCAW(136)"}
    ],

    // 사용자 프리셋 + 공인 용접사(86명) 통합 마스터 풀 반환 (alt 영문명 자동 보강 및 인메모리 캐싱)
    getCombinedWelderPool: function() {
        if (this._welderPoolCache) return this._welderPoolCache;
        const certMap = new Map();
        for (const cw of (this.certWelders || [])) {
            if (!cw) continue;
            const cid = String(cw.id || cw.welder_no || '').trim().toUpperCase();
            if (cid) certMap.set(cid, cw);
        }
        const seenPool = new Set();
        const pool = [];
        const userPresets = (typeof DataStore !== 'undefined' && DataStore.getWelderPresets)
            ? DataStore.getWelderPresets()
            : [];
        const extraCertWelders = this.isPro ? (this.certWelders || []) : [];
        for (const w of [...userPresets, ...extraCertWelders]) {
            if (!w) continue;
            const wid = String(w.id || w.welder_no || '').trim();
            if (!wid) continue;
            const k = wid.toUpperCase();
            if (seenPool.has(k)) continue;
            seenPool.add(k);
            const certRef = certMap.get(k);
            pool.push({
                id: wid,
                welder_no: wid,
                name: w.name || (certRef ? certRef.name : '') || '',
                alt: w.alt || (certRef ? certRef.alt : '') || '',
                dept: w.dept || (certRef ? certRef.dept : '') || ''
            });
        }
        this._welderPoolCache = pool;
        return pool;
    },

    // ─────────────────────────────────────────────────────────
    // 동적 스크립트 지연 로딩 (Lazy Loading) 및 HI OCR v4 워커 캐싱
    // ─────────────────────────────────────────────────────────
    _ocrWorker: null,
    _ocrWorkerPromise: null,
    _ocrProgressHook: null,
    _scanTimer: null,
    _scanStream: null,
    _torchOn: false,
    _lastScanCands: [],

    loadScannerLibraries: async function(mode = 'all') {
        const labelScripts = [
            "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
            "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"
        ];
        if (mode === 'scanner') {
            return; // 스캐너는 내장 QR 디코더 + hiGetOcrWorker(Tesseract v5.1.1) 자체 로더 사용
        }
        const scripts = labelScripts;
        const promises = scripts.map(src => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        });
        await Promise.all(promises);
    },

    // ─────────────────────────────────────────────────────────
    // 1. 스캐너 전용 모달 (QR / 바코드 / 스티커 OCR - Heat_Input_Calculator_Pro_2_3 엔진)
    // ─────────────────────────────────────────────────────────
    openScannerModal: async function() {
        if (!this.isPro) {
            alert(this.t('alert_pro_scan'));
            this.openModal('pages/settings.html');
            return;
        }

        const modal = document.getElementById('subPageModal');
        const title = document.getElementById('subPageTitle');
        const body = document.getElementById('subPageBody');
        if (!modal || !body) return;

        this._currentModalType = 'scanner';
        modal.classList.remove('hidden');

        // 모달 오픈과 동시에 백그라운드에서 OCR 워커 사전 초기화
        this.hiGetOcrWorker().catch(() => {});

        const maxCount = (typeof PresetManager !== 'undefined' && PresetManager.getMaxCount) ? PresetManager.getMaxCount() : 300;
        const currentWelderCount = DataStore.getWelderPresets().length;

        title.innerHTML = `
            <div style="background-color: var(--brand-orange); color: white; padding: 16px; border-radius: 8px 8px 0 0; margin: -20px -20px 16px -20px;">
                <h3 style="margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">📷 용접사 헬멧 스캐너 - QR · 바코드 · 문자(OCR) (PRO)</h3>
                <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: normal;">QR/바코드 및 일반 이름표·번호 스티커의 문자를 읽어 [용접사 정보]에 자동 입력합니다. (프리셋 ${currentWelderCount}/${maxCount}명)</p>
            </div>
        `;

        body.innerHTML = `
            <div style="background-color: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 12px; border-radius: 8px; font-size: 11px; line-height: 1.6; margin-bottom: 14px;">
                <b style="font-size: 12px;">💡 아래 3가지 스캔 버튼 및 갤럭시 텍스트 스캔 사용 안내</b><br>
                ① <b>[📷 카메라 촬영 (좌측 주황 박스)]</b>: 카메라 앱을 바로 실행해 <b>QR 코드 또는 일반 스티커</b>를 사진 찍어 통합 판독합니다.<br>
                ② <b>[🔤 스티커 사진 선택 (가운데 파란 박스)]</b>: 휴대폰 갤러리(앨범)나 폴더에 저장된 <b>일반 스티커 사진·이미지 파일</b>을 불러와 한글·영문·사번 문자(OCR)를 정밀 추출합니다.<br>
                ③ <b>[🎥 실시간 카메라 (우측 검정 박스)]</b>: 실시간 연속 스캔 화면을 수동으로 켭니다. (또는 하단 입력창에서 삼성키보드 <b>[📷 텍스트 스캔]</b> 사용)
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <label style="background: var(--brand-orange); color: white; text-align: center; padding: 12px 4px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; border: 2px solid #ea580c; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.4;">
                    <span style="font-size: 13px; margin-bottom: 2px;">📷 카메라 촬영</span>
                    <span style="font-size: 10px; opacity: 0.9;">(QR+스티커 바로찍기)</span>
                    <input type="file" accept="image/*" capture="environment" style="display:none" onchange="MainController.handleBarcodeImageUpload(event)">
                </label>
                <label style="background: #2563eb; color: white; text-align: center; padding: 12px 4px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; border: 2px solid #1d4ed8; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.4;">
                    <span style="font-size: 13px; margin-bottom: 2px;">🔤 스티커 사진선택</span>
                    <span style="font-size: 10px; opacity: 0.9;">(앨범·파일 문자추출)</span>
                    <input type="file" accept="image/*" style="display:none" onchange="MainController.handleStickerOcrUpload(event)">
                </label>
                <button type="button" id="btnToggleCam" style="background: #111827; color: white; border: 2px solid #000; text-align: center; padding: 12px 4px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.4;" onclick="MainController.startLiveCamera()">
                    <span style="font-size: 13px; margin-bottom: 2px;">🎥 실시간 카메라</span>
                    <span style="font-size: 10px; opacity: 0.85;">(수동으로 켜기)</span>
                </button>
            </div>

            <div id="scanVideoWrap" style="display:none; position:relative; width:100%; max-width:420px; margin:0 auto 12px auto; border-radius:10px; overflow:hidden; background:#111; border:2px solid var(--border-strong);">
                <video id="scanVideoEl" playsinline muted style="width:100%; height:240px; object-fit:cover; display:block;"></video>
                <div style="position:absolute; inset:0; pointer-events:none; display:flex; align-items:center; justify-content:center;">
                    <div style="width:78%; height:52%; border:2.5px dashed #ff6d00; border-radius:10px; box-shadow:0 0 0 9999px rgba(0,0,0,0.38); display:flex; align-items:flex-end; justify-content:center; padding-bottom:4px;">
                        <span style="background:rgba(0,0,0,0.65); color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px;">이 사각틀 안에 스티커(이름·사번)를 맞춰주세요</span>
                    </div>
                </div>
                <button type="button" id="btnTorchToggle" onclick="MainController.toggleCameraTorch()" style="display:none; position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.7); color:#fbbf24; border:1.5px solid #fbbf24; border-radius:6px; padding:5px 9px; font-size:11px; font-weight:900; cursor:pointer;">🔦 조명</button>
                <button type="button" onclick="MainController.captureLiveStickerOcr()" style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); background:#ff6d00; color:#fff; border:2px solid #fff; border-radius:999px; padding:8px 18px; font-size:12px; font-weight:900; box-shadow:0 4px 12px rgba(0,0,0,0.4); cursor:pointer; white-space:nowrap;">📸 지금 화면에서 문자(OCR) 바로 읽기</button>
            </div>

            <div id="readerBox" style="width: 100%; margin-bottom: 12px; border-radius: 8px; overflow: hidden; display: none;"></div>
            <div id="ocrStatus" style="margin-bottom: 8px; text-align: center; font-size: 12px; font-weight: 800; color: var(--brand-orange); min-height: 18px;"></div>
            <div id="scanSaveImgBox" style="display:none; margin-bottom:10px; padding:10px; background:#fef2f2; border:1.5px solid #dc2626; border-radius:8px;"></div>
            <div id="scanCandBox" style="display:none; margin-bottom:10px; padding:8px; background:#eff6ff; border:1.5px solid #2563eb; border-radius:8px;"></div>

            <div style="border: 2px solid var(--border-strong); border-radius: 8px; padding: 12px; background: var(--bg-card);">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px; margin-bottom: 8px;">
                    <span style="font-size: 11px; font-weight: 900; color: var(--text-primary);">📱 갤럭시 [텍스트 스캔] · 클립보드 · 빠른 검색</span>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        <button type="button" onclick="MainController.focusGalaxyTextScan()" style="background: var(--brand-orange); color: white; font-size: 10px; font-weight: 900; padding: 3px 7px; border-radius: 5px; border: 1.5px solid #000; cursor: pointer;">📱 갤럭시 텍스트 스캔</button>
                        <button type="button" onclick="MainController.pasteClipboardToScanner()" style="background: #2563eb; color: white; font-size: 10px; font-weight: 900; padding: 3px 7px; border-radius: 5px; border: 1.5px solid #000; cursor: pointer;">📋 복사글자 붙여넣기</button>
                        <button type="button" id="btnNfcScan" onclick="MainController.startNfcScan()" style="background: #059669; color: white; font-size: 10px; font-weight: 900; padding: 3px 7px; border-radius: 5px; border: 1.5px solid #000; cursor: pointer;">📡 NFC</button>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="scanRawText" style="flex: 1; padding: 9px 10px; border: 1.5px solid var(--border-strong); border-radius: 6px; font-size: 13px; font-weight: 800; background: var(--bg-main); color: var(--text-primary);" placeholder="여기를 1초간 길게 눌러 [📷 텍스트 스캔] 선택 또는 이름/번호 입력 (예: 홍보, YU-WQT-203)" oninput="MainController.filterQuickWelderSearch(this.value)" onkeydown="if(event.key==='Enter'){MainController.applyRawText();}">
                    <button type="button" style="background: #000; color: white; font-weight: 900; font-size: 13px; border: none; border-radius: 6px; padding: 0 14px; cursor: pointer; white-space: nowrap;" onclick="MainController.applyRawText()">자동입력</button>
                </div>
                <div id="scanQuickSearch" style="display:flex; flex-wrap:wrap; gap:5px; max-height:110px; overflow-y:auto; margin-top:8px;"></div>
            </div>

            <button type="button" style="width: 100%; padding: 12px; background: #000; color: #fff; font-weight: 800; font-size: 14px; border: none; border-radius: 8px; margin-top: 16px; cursor: pointer;" onclick="MainController.closeScanModal()">${this.t('btn_close_x')}</button>
        `;

        this.filterQuickWelderSearch('');
    },

    // 기존 호환용 별칭 유지
    scanQRCode: function() {
        this.openScannerModal();
    },

    // ─────────────────────────────────────────────────────────
    // 2. 라벨 인쇄 전용 모달 (전체 용접사 일괄 생성 및 A4 인쇄)
    // ─────────────────────────────────────────────────────────
    openLabelPrintModal: async function() {
        if (!this.isPro) {
            alert(this.t('alert_pro_label'));
            this.openModal('pages/settings.html');
            return;
        }

        const modal = document.getElementById('subPageModal');
        const title = document.getElementById('subPageTitle');
        const body = document.getElementById('subPageBody');
        if (!modal || !body) return;

        this._currentModalType = 'label';
        title.innerHTML = `<h3 style="margin: 0; font-size: 16px;">⏳ 라벨 생성 모듈을 불러오는 중입니다...</h3>`;
        body.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-muted);">첫 실행 시에만 모듈 다운로드 시간이 소요될 수 있습니다.</div>`;
        modal.classList.remove('hidden');

        try {
            await this.loadScannerLibraries('label');
        } catch(e) {
            alert("라벨 생성 모듈을 불러오는 중 네트워크 오류가 발생했습니다.");
            this.closeModal();
            return;
        }

        const maxCount = (typeof PresetManager !== 'undefined' && PresetManager.getMaxCount) ? PresetManager.getMaxCount() : 300;
        const currentWelderCount = DataStore.getWelderPresets().length;

        title.innerHTML = `
            <div style="background-color: #10b981; color: white; padding: 16px; border-radius: 8px 8px 0 0; margin: -20px -20px 16px -20px;">
                <h3 style="margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">🏷️ 헬멧 라벨 일괄 생성 및 인쇄 (PRO)</h3>
                <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: normal;">현재 저장된 모든 용접사의 부착용 라벨(QR/바코드)을 일괄 생성하여 인쇄합니다. (프리셋 ${currentWelderCount}/${maxCount}명)</p>
            </div>
        `;

        body.innerHTML = `
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px; border-radius: 8px; font-size: 11px; line-height: 1.6; margin-bottom: 16px;">
                💡 현재 프리셋에 저장된 <b>전체 용접사(${currentWelderCount}명)</b>를 대상으로 헬멧 부착용 라벨을 일괄 생성합니다.<br>
                라벨 하단에는 용접사의 이름, 사번, 소속 정보가 텍스트로 깔끔하게 표시됩니다.
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="font-size:12px; font-weight:800; color:var(--text-primary); display:block; margin-bottom:8px;">라벨 코드 형태 선택</label>
                <div style="display: flex; gap: 10px;">
                    <label style="flex:1; background:var(--bg-card); border:2px solid var(--border-light); padding:10px; border-radius:8px; text-align:center; cursor:pointer; font-size:13px; font-weight:800;">
                        <input type="radio" name="lblType" value="qr" checked style="margin-bottom:4px;"> <br>QR 코드
                    </label>
                    <label style="flex:1; background:var(--bg-card); border:2px solid var(--border-light); padding:10px; border-radius:8px; text-align:center; cursor:pointer; font-size:13px; font-weight:800;">
                        <input type="radio" name="lblType" value="barcode" style="margin-bottom:4px;"> <br>바코드
                    </label>
                    <label style="flex:1; background:var(--bg-card); border:2px solid var(--border-light); padding:10px; border-radius:8px; text-align:center; cursor:pointer; font-size:13px; font-weight:800;">
                        <input type="radio" name="lblType" value="both" style="margin-bottom:4px;"> <br>QR + 바코드
                    </label>
                </div>
            </div>

            <button type="button" class="act-btn btn-black" style="width:100%; margin-bottom:16px;" onclick="MainController.generateLabelPreview()">전체 용접사 라벨 일괄 생성</button>
            
            <div id="labelPreviewArea" style="display:none; border: 2px dashed var(--border-strong); padding: 16px; border-radius: 8px; background: #fafafa; max-height: 380px; overflow-y: auto;">
                <div id="printTarget" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; background: #fff; padding: 16px; color: #000;">
                </div>
                <div style="margin-top: 20px;">
                    <button type="button" class="act-btn" style="display:inline-flex; width: 100%; background: var(--brand-orange); color: white; border: none;" onclick="MainController.printLabel()">🖨️ 라벨 일괄 인쇄하기 (A4)</button>
                </div>
            </div>
            <button type="button" style="width: 100%; padding: 12px; background: #000; color: #fff; font-weight: 800; font-size: 14px; border: none; border-radius: 8px; margin-top: 16px; cursor: pointer;" onclick="MainController.closeScanModal()">${this.t('btn_close_x')}</button>
        `;
    },

    // 전체 용접사 대상 라벨 일괄 생성 로직 (QR 한글 인코딩 무결성 및 API Fallback 적용)
    generateLabelPreview: function() {
        const welders = DataStore.getWelderPresets();
        if (!welders || welders.length === 0) {
            alert("저장된 용접사 프리셋이 없습니다. 용접사 정보를 먼저 추가해주세요.");
            return;
        }

        const typeRadios = document.getElementsByName('lblType');
        let labelType = 'qr';
        for (let r of typeRadios) {
            if (r.checked) labelType = r.value;
        }

        const previewArea = document.getElementById('labelPreviewArea');
        const printTarget = document.getElementById('printTarget');
        previewArea.style.display = 'block';
        printTarget.innerHTML = '';

        welders.forEach((w, idx) => {
            const rawData = `${w.id || ''}|${w.name || ''}|${w.dept || ''}`;
            const barcodeData = w.id || 'NO-ID'; 
            
            const labelDiv = document.createElement('div');
            labelDiv.style.cssText = "border: 2px solid #000; padding: 16px; border-radius: 8px; background: #fff; text-align: center; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: space-between; page-break-inside: avoid; min-height: 180px;";

            const codeArea = document.createElement('div');
            codeArea.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 12px; width: 100%; justify-content: center; flex: 1;";

            const qrId = `qr-${idx}`;
            const barId = `bar-${idx}`;
            const size = labelType === 'both' ? 70 : 110;

            if (labelType === 'qr' || labelType === 'both') {
                const qrContainer = document.createElement('div');
                qrContainer.id = qrId;
                qrContainer.style.width = `${size}px`;
                qrContainer.style.height = `${size}px`;
                qrContainer.style.display = "flex";
                qrContainer.style.justifyContent = "center";
                qrContainer.style.alignItems = "center";
                codeArea.appendChild(qrContainer);
            }
            
            if (labelType === 'barcode' || labelType === 'both') {
                const barSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                barSvg.id = barId;
                barSvg.style.width = "100%";
                barSvg.style.maxHeight = labelType === 'both' ? "45px" : "65px";
                codeArea.appendChild(barSvg);
            }

            const textArea = document.createElement('div');
            textArea.style.cssText = "width: 100%; text-align: center; border-top: 1px dashed #ccc; padding-top: 8px;";
            textArea.innerHTML = `
                <div style="font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #000; margin-bottom: 4px;">${this.escapeHtmlAttr(w.name || '-')}</div>
                <div style="font-size: 14px; font-weight: 700; color: #000; margin-bottom: 2px;">${this.escapeHtmlAttr(w.id || '-')}</div>
                <div style="font-size: 11px; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtmlAttr(w.dept || '-')}</div>
            `;

            labelDiv.appendChild(codeArea);
            labelDiv.appendChild(textArea);
            printTarget.appendChild(labelDiv);

            if (labelType === 'qr' || labelType === 'both') {
                const qrNode = document.getElementById(qrId);
                const qrFallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(rawData)}`;
                
                try {
                    if (typeof QRCode !== 'undefined') {
                        const utf8Data = unescape(encodeURIComponent(rawData));
                        new QRCode(qrNode, {
                            text: utf8Data,
                            width: size,
                            height: size,
                            colorDark : "#000000",
                            colorLight : "#ffffff",
                            correctLevel : QRCode.CorrectLevel.M 
                        });
                    } else {
                        throw new Error("Library missing");
                    }
                } catch (err) {
                    qrNode.innerHTML = `<img src="${qrFallbackUrl}" width="${size}" height="${size}" alt="QR Code">`;
                }
            }

            if (labelType === 'barcode' || labelType === 'both') {
                try {
                    if (typeof JsBarcode !== 'undefined') {
                        JsBarcode(document.getElementById(barId), barcodeData, {
                            format: "CODE128", 
                            width: 1.5, 
                            height: labelType === 'both' ? 35 : 45, 
                            displayValue: false, 
                            margin: 0
                        });
                    }
                } catch (err) {
                    document.getElementById(barId).outerHTML = `<div style="font-size:10px;color:red;">바코드 생성 불가</div>`;
                }
            }
        });
    },

    printLabel: function() {
        const printContent = document.getElementById('printTarget').outerHTML;
        const win = window.open('', '', 'width=800,height=600');
        win.document.write(`
            <html>
            <head>
                <title>용접사 라벨 일괄 인쇄</title>
                <style>
                    body { margin: 0; padding: 20px; background: #fff; }
                    #printTarget { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
                    @media print {
                        @page { size: A4; margin: 10mm; }
                        body { padding: 0; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
                <script>
                    setTimeout(() => { window.print(); window.close(); }, 800);
                <\/script>
            </body>
            </html>
        `);
        win.document.close();
    },

    // ─────────────────────────────────────────────────────────
    // 내장 QR 매트릭스/바코드 디코더 & HI OCR v4 엔진 (Heat_Input_Calculator_Pro_2_3 이식)
    // ─────────────────────────────────────────────────────────
    QR_BLOCKS_DEC: {
        1: [null,[7,1,19,0,0],[10,1,34,0,0],[15,1,55,0,0],[20,1,80,0,0],[26,1,108,0,0],[18,2,68,0,0],[20,4,39,0,0],[24,2,97,0,0],[30,2,116,0,0],[18,2,68,2,69]],
        0: [null,[10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],[16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44]],
        3: [null,[13,1,13,0,0],[22,1,22,0,0],[18,2,17,0,0],[26,2,24,0,0],[18,2,15,2,16],[24,4,19,0,0],[18,2,14,4,15],[22,4,18,2,19],[20,4,16,4,17],[24,6,19,2,20]],
        2: [null,[17,1,9,0,0],[28,1,16,0,0],[22,2,13,0,0],[16,4,9,0,0],[22,2,11,2,12],[28,4,15,0,0],[26,4,13,1,14],[26,4,14,2,15],[24,4,12,4,13],[28,6,15,2,16]]
    },
    ALIGN_POS_DEC: [[],[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]],

    decodeQrMatrix: function(mat, n) {
        const ver = Math.round((n - 17) / 4);
        if (ver < 1 || ver > 10 || ver * 4 + 17 !== n) return null;
        const fPos1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
        let fmt1 = 0, fmt2 = 0;
        for (let i = 0; i < 15; i++) {
            fmt1 = (fmt1 << 1) | (mat[fPos1[i][0]][fPos1[i][1]] & 1);
            const b2 = i < 7 ? mat[n - 1 - i][8] : mat[8][n - 15 + i];
            fmt2 = (fmt2 << 1) | (b2 & 1);
        }
        let bestFmt = -1, bestDist = 99;
        for (let d = 0; d < 32; d++) {
            let rem = d << 10;
            for (let i = 14; i >= 10; i--) if ((rem >>> i) & 1) rem ^= 1335 << (i - 10);
            const cand = ((d << 10) | rem) ^ 21522;
            for (const f of [fmt1, fmt2]) {
                let x = cand ^ f, dist = 0;
                while (x) { dist += x & 1; x >>>= 1; }
                if (dist < bestDist) { bestDist = dist; bestFmt = d; }
            }
        }
        if (bestDist > 3 || bestFmt < 0) return null;
        const eccLevel = bestFmt >>> 3, maskPattern = bestFmt & 7;
        const isFunc = Array.from({ length: n }, () => new Uint8Array(n));
        const mark = (r, c) => { if (r >= 0 && r < n && c >= 0 && c < n) isFunc[r][c] = 1; };
        const drawF = (r0, c0) => { for (let dy = -1; dy <= 7; dy++) for (let dx = -1; dx <= 7; dx++) mark(r0 + dy, c0 + dx); };
        drawF(0, 0); drawF(0, n - 7); drawF(n - 7, 0);
        for (let i = 8; i < n - 8; i++) { mark(6, i); mark(i, 6); }
        for (const ar of this.ALIGN_POS_DEC[ver]) {
            for (const ac of this.ALIGN_POS_DEC[ver]) {
                if ((ar === 6 && ac === 6) || (ar === 6 && ac === n - 7) || (ar === n - 7 && ac === 6)) continue;
                for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) mark(ar + dy, ac + dx);
            }
        }
        for (let i = 0; i <= 8; i++) { mark(8, i); mark(i, 8); }
        for (let i = 0; i < 8; i++) { mark(8, n - 1 - i); mark(n - 1 - i, 8); }
        if (ver >= 7) {
            for (let i = 0; i < 18; i++) {
                const a = n - 11 + (i % 3), b = Math.floor(i / 3);
                mark(a, b); mark(b, a);
            }
        }
        const maskFn = (r, c) => maskPattern === 0 ? (r + c) % 2 === 0
            : maskPattern === 1 ? r % 2 === 0
            : maskPattern === 2 ? c % 3 === 0
            : maskPattern === 3 ? (r + c) % 3 === 0
            : maskPattern === 4 ? (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0
            : maskPattern === 5 ? (r * c) % 2 + (r * c) % 3 === 0
            : maskPattern === 6 ? ((r * c) % 2 + (r * c) % 3) % 2 === 0
            : ((r + c) % 2 + (r * c) % 3) % 2 === 0;
        const bits = [];
        let up = true;
        for (let right = n - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;
            for (let v = 0; v < n; v++) {
                const r = up ? n - 1 - v : v;
                for (let j = 0; j < 2; j++) {
                    const c = right - j;
                    if (!isFunc[r][c]) bits.push((mat[r][c] ^ (maskFn(r, c) ? 1 : 0)) & 1);
                }
            }
            up = !up;
        }
        const rawCw = [];
        for (let i = 0; i + 8 <= bits.length; i += 8) {
            let b = 0;
            for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
            rawCw.push(b);
        }
        const blkInfo = this.QR_BLOCKS_DEC[eccLevel] && this.QR_BLOCKS_DEC[eccLevel][ver];
        if (!blkInfo) return null;
        const [, g1Blocks, g1DataCw, g2Blocks, g2DataCw] = blkInfo;
        const totalBlocks = g1Blocks + g2Blocks;
        const dataBlocks = Array.from({ length: totalBlocks }, () => []);
        const maxDataLen = Math.max(g1DataCw, g2DataCw);
        let cwIdx = 0;
        for (let col = 0; col < maxDataLen; col++) {
            for (let b = 0; b < totalBlocks; b++) {
                const blkLen = b < g1Blocks ? g1DataCw : g2DataCw;
                if (col < blkLen && cwIdx < rawCw.length) dataBlocks[b].push(rawCw[cwIdx++]);
            }
        }
        const dataBytes = [];
        for (const blk of dataBlocks) for (const cw of blk) dataBytes.push(cw);
        const dBits = [];
        for (const cw of dataBytes) for (let i = 7; i >= 0; i--) dBits.push((cw >>> i) & 1);
        let bp = 0;
        const readBits = len => {
            let v = 0;
            for (let i = 0; i < len && bp < dBits.length; i++) v = (v << 1) | dBits[bp++];
            return v;
        };
        let outStr = "";
        const alphaTable = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
        while (bp + 4 <= dBits.length) {
            const mode = readBits(4);
            if (mode === 0) break;
            if (mode === 4) {
                const count = readBits(ver <= 9 ? 8 : 16);
                if (count <= 0 || bp + count * 8 > dBits.length + 8) break;
                const u8 = new Uint8Array(count);
                for (let i = 0; i < count; i++) u8[i] = readBits(8);
                outStr += (new TextDecoder("utf-8", { fatal: false })).decode(u8);
            } else if (mode === 2) {
                let count = readBits(ver <= 9 ? 9 : 11);
                while (count >= 2) {
                    const v = readBits(11);
                    outStr += (alphaTable[Math.floor(v / 45)] || "") + (alphaTable[v % 45] || "");
                    count -= 2;
                }
                if (count === 1) outStr += alphaTable[readBits(6)] || "";
            } else if (mode === 1) {
                let count = readBits(ver <= 9 ? 10 : 12);
                while (count >= 3) { outStr += String(readBits(10)).padStart(3, "0"); count -= 3; }
                if (count === 2) outStr += String(readBits(7)).padStart(2, "0");
                else if (count === 1) outStr += String(readBits(4));
            } else break;
        }
        const cleaned = outStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
        return cleaned || null;
    },

    decodeQrFromRgba: function(rgba, w, h) {
        const gray = new Uint8Array(w * h), intImg = new Int32Array((w + 1) * (h + 1));
        for (let y = 0; y < h; y++) {
            let rowSum = 0;
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const g = (rgba[idx] * 77 + rgba[idx + 1] * 150 + rgba[idx + 2] * 29) >> 8;
                gray[y * w + x] = g;
                rowSum += g;
                intImg[(y + 1) * (w + 1) + (x + 1)] = intImg[y * (w + 1) + (x + 1)] + rowSum;
            }
        }
        const bin = new Uint8Array(w * h), win = Math.max(14, Math.floor(Math.min(w, h) / 14));
        for (let y = 0; y < h; y++) {
            const y0 = Math.max(0, y - win), y1 = Math.min(h - 1, y + win);
            for (let x = 0; x < w; x++) {
                const x0 = Math.max(0, x - win), x1 = Math.min(w - 1, x + win);
                const area = (y1 - y0 + 1) * (x1 - x0 + 1);
                const sum = intImg[(y1 + 1) * (w + 1) + (x1 + 1)] - intImg[y0 * (w + 1) + (x1 + 1)] - intImg[(y1 + 1) * (w + 1) + x0] + intImg[y0 * (w + 1) + x0];
                bin[y * w + x] = gray[y * w + x] * area < sum * 0.94 ? 1 : 0;
            }
        }
        const isRatio11311 = s => {
            const tot = s[0] + s[1] + s[2] + s[3] + s[4];
            if (tot < 7) return false;
            const m = tot / 7, tol = m * 0.68;
            return Math.abs(s[0] - m) < tol && Math.abs(s[1] - m) < tol && Math.abs(s[2] - 3 * m) < 3 * tol && Math.abs(s[3] - m) < tol && Math.abs(s[4] - m) < tol;
        };
        const checkVert = (midY, cx, hTotal) => {
            if (cx < 0 || cx >= w || !bin[midY * w + cx]) return null;
            const s = [0, 0, 0, 0, 0];
            let y = midY;
            while (y >= 0 && bin[y * w + cx]) { s[2]++; y--; }
            if (y < 0) return null;
            while (y >= 0 && !bin[y * w + cx] && s[1] <= hTotal) { s[1]++; y--; }
            if (y < 0 || s[1] > hTotal) return null;
            while (y >= 0 && bin[y * w + cx] && s[0] <= hTotal) { s[0]++; y--; }
            y = midY + 1;
            while (y < h && bin[y * w + cx]) { s[2]++; y++; }
            if (y >= h) return null;
            while (y < h && !bin[y * w + cx] && s[3] <= hTotal) { s[3]++; y++; }
            if (y >= h || s[3] > hTotal) return null;
            while (y < h && bin[y * w + cx] && s[4] <= hTotal) { s[4]++; y++; }
            const vTot = s[0] + s[1] + s[2] + s[3] + s[4];
            return Math.abs(vTot - hTotal) * 5 > hTotal * 2 || !isRatio11311(s) ? null : { cy: y - s[4] - s[3] - s[2] / 2, vTot };
        };
        const centers = [];
        for (let y = 0; y < h; y += 2) {
            const s = [0, 0, 0, 0, 0];
            let state = 0;
            for (let x = 0; x < w; x++) {
                if (bin[y * w + x]) {
                    if (state & 1) state++;
                    s[state]++;
                } else if (state & 1) {
                    s[state]++;
                } else if (state === 4) {
                    if (isRatio11311(s)) {
                        const hTot = s[0] + s[1] + s[2] + s[3] + s[4];
                        const cx = Math.round(x - s[4] - s[3] - s[2] / 2);
                        const vRes = checkVert(y, cx, hTot);
                        if (vRes) {
                            const mod = (hTot + vRes.vTot) / 14;
                            const existing = centers.find(c => Math.hypot(c.x - cx, c.y - vRes.cy) < mod * 4);
                            if (existing) {
                                existing.x = (existing.x * existing.cnt + cx) / (existing.cnt + 1);
                                existing.y = (existing.y * existing.cnt + vRes.cy) / (existing.cnt + 1);
                                existing.mod = (existing.mod * existing.cnt + mod) / (existing.cnt + 1);
                                existing.cnt++;
                            } else centers.push({ x: cx, y: vRes.cy, mod, cnt: 1 });
                        }
                    }
                    s[0] = s[2]; s[1] = s[3]; s[2] = s[4]; s[3] = 1; s[4] = 0; state = 3;
                } else {
                    state++; s[state]++;
                }
            }
        }
        centers.sort((a, b) => b.cnt - a.cnt);
        const topCenters = centers.slice(0, 7);
        if (topCenters.length < 3) return null;
        for (let i = 0; i < topCenters.length; i++) {
            for (let j = i + 1; j < topCenters.length; j++) {
                for (let k = j + 1; k < topCenters.length; k++) {
                    const pts = [topCenters[i], topCenters[j], topCenters[k]];
                    const d01 = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                    const d12 = Math.hypot(pts[1].x - pts[2].x, pts[1].y - pts[2].y);
                    const d02 = Math.hypot(pts[0].x - pts[2].x, pts[0].y - pts[2].y);
                    let tl, pA, pB;
                    if (d01 >= d12 && d01 >= d02) { tl = pts[2]; pA = pts[0]; pB = pts[1]; }
                    else if (d12 >= d01 && d12 >= d02) { tl = pts[0]; pA = pts[1]; pB = pts[2]; }
                    else { tl = pts[1]; pA = pts[0]; pB = pts[2]; }
                    const s1 = Math.hypot(pA.x - tl.x, pA.y - tl.y), s2 = Math.hypot(pB.x - tl.x, pB.y - tl.y);
                    if (Math.abs(s1 - s2) / Math.max(s1, s2) > 0.28) continue;
                    const cross = (pA.x - tl.x) * (pB.y - tl.y) - (pA.y - tl.y) * (pB.x - tl.x);
                    const tr = cross > 0 ? pA : pB, bl = cross > 0 ? pB : pA;
                    const avgMod = (tl.mod + tr.mod + bl.mod) / 3;
                    const rawDim = Math.round(((s1 + s2) / 2) / avgMod) + 7;
                    const verBase = Math.max(1, Math.min(10, Math.round((rawDim - 17) / 4)));
                    for (const ver of [verBase, verBase - 1, verBase + 1]) {
                        if (ver < 1 || ver > 10) continue;
                        const n = ver * 4 + 17, span = n - 7;
                        const ux = (tr.x - tl.x) / span, uy = (tr.y - tl.y) / span;
                        const vx = (bl.x - tl.x) / span, vy = (bl.y - tl.y) / span;
                        const mat = Array.from({ length: n }, () => new Uint8Array(n));
                        for (let r = 0; r < n; r++) {
                            for (let c = 0; c < n; c++) {
                                const px = Math.round(tl.x + (c - 3) * ux + (r - 3) * vx);
                                const py = Math.round(tl.y + (c - 3) * uy + (r - 3) * vy);
                                if (px >= 0 && px < w && py >= 0 && py < h) mat[r][c] = bin[py * w + px];
                            }
                        }
                        const decoded = this.decodeQrMatrix(mat, n);
                        if (decoded) return decoded;
                    }
                }
            }
        }
        return null;
    },

    _barcodeCanvas: null,
    _barcodeCtx: null,
    decodeBarcodeFromSource: async function(source) {
        const srcW = source.naturalWidth || source.videoWidth || source.width || 0;
        const srcH = source.naturalHeight || source.videoHeight || source.height || 0;
        if (!srcW || !srcH) return null;
        if (!this._barcodeCanvas) {
            this._barcodeCanvas = document.createElement("canvas");
            this._barcodeCtx = this._barcodeCanvas.getContext("2d", { willReadFrequently: true });
        }
        const cnv = this._barcodeCanvas, ctx = this._barcodeCtx;
        if (typeof window !== "undefined" && "BarcodeDetector" in window) {
            try {
                const det = new window.BarcodeDetector({ formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8"] });
                const res = await det.detect(source);
                if (res && res.length > 0 && res[0].rawValue) return res[0].rawValue.trim();
                for (const maxD of [1200, 720]) {
                    const s0 = Math.min(1, maxD / Math.max(srcW, srcH));
                    cnv.width = Math.round(srcW * s0);
                    cnv.height = Math.round(srcH * s0);
                    ctx.drawImage(source, 0, 0, cnv.width, cnv.height);
                    const res2 = await det.detect(cnv);
                    if (res2 && res2.length > 0 && res2[0].rawValue) return res2[0].rawValue.trim();
                }
            } catch (e) {}
        }
        try {
            for (const maxD of [720, 1080, 500]) {
                const scale = Math.min(1, maxD / Math.max(srcW, srcH));
                const w = Math.round(srcW * scale), h = Math.round(srcH * scale);
                cnv.width = w; cnv.height = h;
                ctx.drawImage(source, 0, 0, w, h);
                const rgba = ctx.getImageData(0, 0, w, h).data;
                const qrRes = this.decodeQrFromRgba(rgba, w, h);
                if (qrRes) return qrRes;
            }
        } catch (e) { console.warn("QR fallback error:", e); }
        return null;
    },

    // ─────────────────────────────────────────────────────────
    // HI OCR v4 (PSM 11/6 멀티패스 + Sauvola 적응형 이진화 + 마스터 풀 조기 종료)
    // ─────────────────────────────────────────────────────────
    hiGray: function(d, n) {
        const g = new Uint8Array(n);
        for (let i = 0, p = 0; p < n; i += 4, p++) g[p] = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
        return g;
    },

    hiInvert: function(g, n) {
        const o = new Uint8Array(n);
        for (let p = 0; p < n; p++) o[p] = 255 - g[p];
        return o;
    },

    hiSauvola: function(g, w, h, win, k) {
        const W1 = w + 1, I = new Float64Array(W1 * (h + 1)), I2 = new Float64Array(W1 * (h + 1));
        for (let y = 0; y < h; y++) {
            let rs = 0, rs2 = 0;
            for (let x = 0; x < w; x++) {
                const v = g[y * w + x];
                rs += v; rs2 += v * v;
                I[(y + 1) * W1 + x + 1] = I[y * W1 + x + 1] + rs;
                I2[(y + 1) * W1 + x + 1] = I2[y * W1 + x + 1] + rs2;
            }
        }
        const r = win >> 1, o = new Uint8Array(w * h), R = 128;
        for (let y = 0; y < h; y++) {
            const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
            for (let x = 0; x < w; x++) {
                const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1), area = (x1 - x0) * (y1 - y0);
                const s = I[y1 * W1 + x1] - I[y0 * W1 + x1] - I[y1 * W1 + x0] + I[y0 * W1 + x0];
                const s2 = I2[y1 * W1 + x1] - I2[y0 * W1 + x1] - I2[y1 * W1 + x0] + I2[y0 * W1 + x0];
                const m = s / area, sd = Math.sqrt(Math.max(0, s2 / area - m * m)), t = m * (1 + k * (sd / R - 1));
                o[y * w + x] = g[y * w + x] > t ? 255 : 0;
            }
        }
        return o;
    },

    hiWinFor: function(w, h) {
        let v = Math.round(Math.min(w, h) / 8);
        if (v < 31) v = 31;
        if (v > 101) v = 101;
        return v | 1;
    },

    hiCanon: function(t) {
        return String(t || "").toUpperCase()
            .replace(/[|!]/g, "1")
            .replace(/[^0-9A-Z\uAC00-\uD7A3]/g, "")
            .replace(/[IL]/g, "1")
            .replace(/[OQD]/g, "0")
            .replace(/S/g, "5")
            .replace(/B/g, "8")
            .replace(/Z/g, "2")
            .replace(/G/g, "6");
    },

    hiPoolHit: function(text, pool) {
        try {
            const tc = this.hiCanon(text);
            const th = String(text || "").replace(/[^\uAC00-\uD7A3]/g, "");
            if (!tc) return false;
            for (const w of (pool || [])) {
                if (!w) continue;
                const wid = w.id || w.welder_no || "";
                const idc = this.hiCanon(wid);
                if (idc.length >= 5 && tc.includes(idc)) return true;
                const nm = String(w.name || "").replace(/\s+/g, "");
                if (/^[\uAC00-\uD7A3]{3,5}$/.test(nm) && th.includes(nm)) return true;
            }
        } catch (e) {}
        return false;
    },

    hiLooksComplete: function(text) {
        const t = String(text || "").toUpperCase();
        const idLike = /[A-Z]{1,4}[-\s]?(?:WQT[-\s]?)?\d{3,6}/.test(t);
        const rest = String(text || "")
            .replace(/[\uAC00-\uD7A30-9]*(?:팀|부서|부|과|실|반|라인|공정)(?![\uAC00-\uD7A3])/g, " ")
            .replace(/(성명|이름|번호|사번|소속|용접사|자격증|용접)/g, " ");
        const hg = /[\uAC00-\uD7A3]{2,4}/.test(rest);
        return idLike && hg;
    },

    hiLoadScript: function(src, ms) {
        return new Promise((res, rej) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing && window.Tesseract) { res(); return; }
            const sc = document.createElement("script");
            let done = false;
            const to = setTimeout(() => { if (!done) { done = true; rej(new Error("script timeout: " + src)); } }, ms || 15000);
            sc.src = src;
            sc.onload = () => { if (!done) { done = true; clearTimeout(to); res(); } };
            sc.onerror = () => { if (!done) { done = true; clearTimeout(to); rej(new Error("script error: " + src)); } };
            document.head.appendChild(sc);
        });
    },

    hiWithTimeout: function(p, ms, label) {
        let to;
        return Promise.race([
            p,
            new Promise((_, rej) => { to = setTimeout(() => rej(new Error("timeout: " + label)), ms); })
        ]).finally(() => clearTimeout(to));
    },

    hiGetOcrWorker: async function(onStatus) {
        if (window.__hiOcrWorker) return window.__hiOcrWorker;
        if (window.__hiOcrInit) return window.__hiOcrInit;
        window.__hiOcrInit = (async () => {
            const say = m => { if (onStatus) onStatus(m); };
            const V = "5.1.1";
            const custom = window.__HI_OCR_OPTS || null;
            let local = "";
            try { if (/^https?:/i.test(document.baseURI)) local = new URL("ocr/", document.baseURI).href; } catch (e) {}
            const cands = [];
            if (window.Tesseract && typeof window.Tesseract.createWorker === "function") {
                cands.push({ kind: "preloaded", script: "", opts: {} });
            } else {
                if (local) cands.push({ kind: "local", script: local + "tesseract.min.js", to: 12000, wto: 40000, opts: { workerPath: local + "worker.min.js", corePath: local, langPath: local, gzip: true } });
                cands.push({ kind: "jsdelivr", script: "https://cdn.jsdelivr.net/npm/tesseract.js@" + V + "/dist/tesseract.min.js", to: 15000, wto: 180000, opts: {} });
                cands.push({ kind: "unpkg", script: "https://unpkg.com/tesseract.js@" + V + "/dist/tesseract.min.js", to: 15000, wto: 180000, opts: { workerPath: "https://unpkg.com/tesseract.js@" + V + "/dist/worker.min.js", corePath: "https://unpkg.com/tesseract.js-core@" + V } });
            }
            let lastErr = null, loadedByUs = false;
            for (const c of cands) {
                try {
                    const scriptUrl = c.script, opts = c.opts, langs = ["kor", "eng"];
                    if (scriptUrl) {
                        try { window.Tesseract = undefined; } catch (e) {}
                        say(c.kind === "local" ? "⏳ 내장(오프라인) OCR 엔진 확인 중..." : "⏳ 한글·영문 정밀 문자 인식(OCR) 엔진을 불러오는 중입니다...");
                        loadedByUs = true;
                        await this.hiLoadScript(scriptUrl, c.to);
                    }
                    if (!window.Tesseract) throw new Error("Tesseract global missing (" + c.kind + ")");
                    say("⏳ 한글+영문 정밀 OCR 모델 준비 중 (최초 1회)...");
                    let w;
                    try {
                        w = await this.hiWithTimeout(window.Tesseract.createWorker(langs, 1, custom || opts), c.wto || 60000, "createWorker/" + c.kind);
                    } catch (v4FallbackErr) {
                        // 만약 기존 페이지에 Tesseract v4가 로드되어 있는 경우 호환 초기화
                        w = await window.Tesseract.createWorker();
                        if (typeof w.loadLanguage === "function") {
                            await w.loadLanguage("kor+eng");
                            await w.initialize("kor+eng");
                        }
                    }
                    window.__hiOcrWorker = w;
                    window.__hiOcrSource = c.kind;
                    return w;
                } catch (e) {
                    lastErr = e;
                    console.warn("OCR engine candidate failed:", c.kind, e);
                }
            }
            if (loadedByUs) { try { window.Tesseract = undefined; } catch (e) {} }
            throw lastErr || new Error("OCR engine unavailable");
        })();
        try {
            return await window.__hiOcrInit;
        } finally {
            if (!window.__hiOcrWorker) window.__hiOcrInit = null;
        }
    },

    extractTextFromStickerSource: async function(source, onStatus, presetPool = []) {
        const srcW = source.naturalWidth || source.videoWidth || source.width || 0;
        const srcH = source.naturalHeight || source.videoHeight || source.height || 0;
        if (!srcW || !srcH) return null;
        const longSide = Math.max(srcW, srcH);
        let scale = Math.max(1, Math.min(3, 1050 / longSide));
        if (longSide > 2600) scale = 2600 / longSide;
        const w = Math.round(srcW * scale), h = Math.round(srcH * scale), pad = 28, cw = w + pad * 2, ch = h + pad * 2;
        const cnv = document.createElement("canvas"), ctx = cnv.getContext("2d");
        cnv.width = cw; cnv.height = ch;
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(source, pad, pad, w, h);

        const variants = { orig: cnv };
        const getVariant = k => {
            if (variants[k]) return variants[k];
            const inv = k === "binInv", c = document.createElement("canvas");
            c.width = cw; c.height = ch;
            const x = c.getContext("2d", { willReadFrequently: true });
            x.drawImage(cnv, 0, 0);
            const id = x.getImageData(0, 0, cw, ch), n = cw * ch, d = id.data;
            let g = this.hiGray(d, n);
            if (inv) g = this.hiInvert(g, n);
            const b = this.hiSauvola(g, cw, ch, this.hiWinFor(cw, ch), 0.25);
            for (let p = 0, i = 0; p < n; p++, i += 4) {
                d[i] = d[i + 1] = d[i + 2] = b[p];
                d[i + 3] = 255;
            }
            x.putImageData(id, 0, 0);
            variants[k] = c;
            return c;
        };

        const collected = [];
        const plan = [["orig", "11"], ["orig", "6"], ["bin", "6"], ["binInv", "6"], ["bin", "11"]];
        let hit = false;
        try {
            const worker = await this.hiGetOcrWorker(onStatus);
            for (let i = 0; i < plan.length; i++) {
                const [vk, psm] = plan[i];
                if (onStatus) onStatus("🔍 스티커의 한글·영문·숫자를 정밀 판독하고 있습니다... (" + (i + 1) + "/" + plan.length + ")");
                await worker.setParameters({ tessedit_pageseg_mode: psm });
                const ret = await worker.recognize(getVariant(vk));
                const txt = ret && ret.data && ret.data.text ? ret.data.text.trim() : "";
                if (txt) collected.push(txt);
                const joined = collected.join("\n");
                // 마스터 풀에 일치하는 사번/이름이 나오면 즉시 패스 중단 (속도 & 정확도 극대화)
                if (this.hiPoolHit(joined, presetPool)) { hit = true; break; }
                if (i >= 1 && this.hiLooksComplete(joined)) { hit = true; break; }
            }
        } catch (e) { console.warn("Tesseract OCR error:", e); }

        if (!hit && typeof window !== "undefined" && "TextDetector" in window) {
            try {
                const td = new window.TextDetector(), b1 = await td.detect(cnv);
                if (b1 && b1.length > 0) collected.push(b1.map(b => b.rawValue || "").join("\n"));
            } catch (e) {}
        }

        const uniq = [], seen = new Set();
        for (const blk of collected) {
            for (const ln of String(blk || "").split(/\r?\n/)) {
                const t = ln.trim();
                if (!t) continue;
                if (t.replace(/[^0-9A-Za-z\uAC00-\uD7A3]/g, "").length < 2) continue;
                const key = t.toUpperCase().replace(/\s+/g, "");
                if (seen.has(key)) continue;
                seen.add(key);
                uniq.push(t);
            }
        }
        return uniq.join("\n").trim() || null;
    },

    // ─────────────────────────────────────────────────────────
    // 자격증명 스티커 노이즈 필터링 & 퍼지 후보 매칭 (Heat_Input_Calculator_Pro_2_3 이식)
    // ─────────────────────────────────────────────────────────
    cleanWelderName: function(raw) {
        if (!raw) return "";
        let s = String(raw);
        s = s.replace(/\b[A-Z]{1,4}[-\s]?(?:WQT[-\s]?)?\d{2,6}(?:-\d+)?\b/gi, " ")
             .replace(/\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b/g, " ")
             .replace(/\b\d+(?:\.\d+)?\s*(?:mm|t|T|OD)?\b/g, " ");
        s = s.replace(/\b(WERLDER|WELDER|WELDING|CERT|CERTIFICATE|CERTIFICATION|NO|NAME|PROCESS|MATERIAL|FILLER|THICKNESS|OUTSIDE|DIAMETER|POSITION|QUALIFICATION|RANGE|EXPIRATION|DATE|REMARK|TEST|RESULT|PASS|TYPE|JOINT|BUTT|FILLET|SINGLE|MULTI|LAYER|GROUP|SHIELDING|GAS|CURRENT|POLARITY|SAW|FCAW|SMAW|GTAW|GMAW|TIG|MAG|MIG|WPS|PQR|WQT|ISO|ASME|AWS|PA|PB|PC|PD|PE|PF|PG|1G|2G|3G|4G|5G|6G|1F|2F|3F|4F|FM1|FM2|FM3|FM4|OD|MM|SS|BS|NB|CI)\b/gi, " ");
        s = s.replace(/(안전제일|안전모|혈액형|용접사|자격증명|자격증|성명|이름|사번|번호|등록번호|소속|부서|업체|공정|팀명|연락처|비상연락처|유효기간|합격|확인)/g, " ");
        s = s.replace(/[\uAC00-\uD7A30-9]*(?:팀|부서|부|과|실|반|라인|공정)(?![\uAC00-\uD7A3])/g, " ");
        const korMatches = (s.match(/[\uAC00-\uD7A3]{2,4}/g) || []).filter(w => !/^(용접|자격|성명|이름|사번|번호|소속|부서|공정|안전|합격|확인|혈액)$/.test(w));
        if (korMatches.length > 0) return korMatches[0];
        const engTokens = (s.match(/[A-Za-z]{3,}/g) || []).filter(w => !/^(THE|AND|FOR|WITH|FROM|AUTO|CARRIAGE|OPERATOR|SUBMERGED|FLUX|CORED|SHIELD|METAL|ARC|MAN|MANUAL)$/i.test(w));
        if (engTokens.length > 0) return engTokens.slice(0, 3).join(" ").slice(0, 24);
        return "";
    },

    // 한글 자모 분해 + Levenshtein 편집 거리 기반 퍼지 후보 계산
    computeWelderCands: function(raw, pool) {
        const txt = String(raw || "");
        if (!txt.trim()) return [];
        const cn = s => String(s || "").toUpperCase()
            .replace(/[|!]/g, "1")
            .replace(/[^0-9A-Z\uAC00-\uD7A3]/g, "")
            .replace(/[IL]/g, "1")
            .replace(/[OQD]/g, "0")
            .replace(/S/g, "5")
            .replace(/B/g, "8")
            .replace(/Z/g, "2")
            .replace(/G/g, "6");
        const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
        const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
        const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
        const jm = s => {
            let o = "";
            for (const ch of String(s || "")) {
                const c = ch.charCodeAt(0) - 0xAC00;
                if (c >= 0 && c < 11172) {
                    o += CHO[Math.floor(c / 588)] + JUNG[Math.floor((c % 588) / 28)] + JONG[c % 28];
                } else if (/[\uAC00-\uD7A3A-Z0-9]/i.test(ch)) {
                    o += ch.toUpperCase();
                }
            }
            return o;
        };
        const lev = (a, b, mx = 6) => {
            const la = a.length, lb = b.length;
            if (Math.abs(la - lb) > mx) return mx + 1;
            const dp = new Uint16Array(lb + 1);
            for (let j = 0; j <= lb; j++) dp[j] = j;
            for (let i = 1; i <= la; i++) {
                let pr = dp[0];
                dp[0] = i;
                let mn = dp[0];
                for (let j = 1; j <= lb; j++) {
                    const tp = dp[j];
                    const cs = a[i - 1] === b[j - 1] ? 0 : 1;
                    dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, pr + cs);
                    pr = tp;
                    if (dp[j] < mn) mn = dp[j];
                }
                if (mn > mx) return mx + 1;
            }
            return dp[lb];
        };

        const rawUp = txt.toUpperCase().replace(/\s+/g, " ");
        const rawCn = cn(txt);
        const rawDigs = [...new Set(txt.match(/\d{2,5}/g) || [])];
        const rawKorWords = [...new Set(txt.match(/[\uAC00-\uD7A3]{1,5}/g) || [])];
        const rawEngWords = [...new Set((txt.toUpperCase().match(/[A-Z]{2,}/g) || []))];
        const rawWins = [];
        for (let L = 5; L <= Math.min(12, rawCn.length); L++) {
            for (let i = 0; i + L <= rawCn.length; i++) {
                // 숫자 중간에서 잘린 윈도우는 제외 (예: YUWQT991에서 1을 잘라 YUWQT99로 만들어 YUWQT099와 매칭되는 현상 방지)
                if (i + L < rawCn.length && /\d/.test(rawCn[i + L - 1]) && /\d/.test(rawCn[i + L])) continue;
                if (i > 0 && /\d/.test(rawCn[i]) && /\d/.test(rawCn[i - 1])) continue;
                rawWins.push(rawCn.slice(i, i + L));
            }
        }

        const out = [];
        for (const w of (pool || [])) {
            if (!w) continue;
            const id = String(w.id || w.welder_no || "").trim();
            const nm = String(w.name || "").trim();
            const alt = String(w.alt || "").trim();
            const idCn = cn(id);
            const idNum = (id.match(/\d{2,5}(?:-\d+)?$/) || [""])[0];
            const idNumMain = (id.match(/(\d{3})(?:-\d+)?$/) || ["", ""])[1];
            let sId = 0, sNm = 0;

            if (idCn.length >= 4 && rawCn.includes(idCn)) sId = 100;
            else if (idNum && idNum.includes("-") && rawUp.includes(idNum)) sId = 90;
            else if (idNumMain && new RegExp("(?:WQT|W0T|WOT|YU|W)[-\\s.]*0*" + parseInt(idNumMain, 10) + "(?!\\d)", "i").test(rawUp)) sId = 85;
            else if (idCn.length >= 6 && rawWins.length) {
                let best = 99;
                for (const win of rawWins) {
                    if (Math.abs(win.length - idCn.length) > 2) continue;
                    const d = lev(win, idCn, 2);
                    if (d < best) { best = d; if (best === 0) break; }
                }
                if (best === 1) sId = 78;
                else if (best === 2) sId = 60;
            }
            if (sId < 55 && idNumMain && rawDigs.some(d => parseInt(d, 10) === parseInt(idNumMain, 10))) sId = 55;

            const nmClean = nm.replace(/\s+/g, "");
            if (nmClean) {
                if (nmClean.length >= 2 && txt.includes(nmClean)) sNm = 85;
                else if (nmClean.length === 1 && rawKorWords.includes(nmClean)) sNm = 50;
                else if (nmClean.length >= 2) {
                    const jTarget = jm(nmClean);
                    let bestJ = 99;
                    for (const kw of rawKorWords) {
                        if (Math.abs(kw.length - nmClean.length) > 1) continue;
                        const d = lev(jm(kw), jTarget, 3);
                        if (d < bestJ) bestJ = d;
                    }
                    if (bestJ === 1) sNm = 70;
                    else if (bestJ === 2 && jTarget.length >= 5) sNm = 54;
                }
            }
            if (alt) {
                const altToks = alt.toUpperCase().split(/[^A-Z]+/).filter(t => t.length >= 3);
                if (altToks.length) {
                    let hits = 0, near = 0;
                    for (const t of altToks) {
                        if (rawUp.includes(t)) hits++;
                        else if (t.length >= 4 && rawEngWords.some(rw => Math.abs(rw.length - t.length) <= 1 && lev(rw, t, 1) <= 1)) near++;
                    }
                    const altScore = hits >= 2 ? 85 : hits === 1 ? (altToks.length === 1 ? 76 : 62) : near >= 2 ? 68 : near === 1 ? 50 : 0;
                    if (altScore > sNm) sNm = altScore;
                }
            }
            const total = sId > 0 && sNm > 0 ? Math.min(130, sId + Math.round(sNm * 0.5)) : Math.max(sId, sNm);
            if (total >= 50) out.push({ w, total, sId, sNm });
        }
        out.sort((a, b) => b.total - a.total || b.sId - a.sId || b.sNm - a.sNm);
        return out.slice(0, 5);
    },

    normalizeWelderId: function(rawId) {
        if (!rawId) return '';
        let cleaned = String(rawId)
            .replace(/[–—―~]/g, '-')
            .replace(/\s*-\s*/g, '-')
            .trim()
            .toUpperCase();
        const parts = cleaned.split('-');
        if (parts.length >= 2) {
            for (let i = 0; i < parts.length - 1; i++) {
                parts[i] = parts[i].replace(/^W[0O]T$/i, 'WQT');
            }
            const lastIdx = parts.length - 1;
            if (/[0-9OILSZB]{2,}/i.test(parts[lastIdx])) {
                parts[lastIdx] = parts[lastIdx]
                    .replace(/O/g, '0')
                    .replace(/[IL]/g, '1')
                    .replace(/S/g, '5')
                    .replace(/B/g, '8')
                    .replace(/Z/g, '2');
            }
            cleaned = parts.join('-');
        }
        return cleaned;
    },

    decodeQrText: function(str) {
        if (!str) return '';
        let res = String(str).trim();
        if (!/[가-힣]/.test(res) && /[\x80-\xFF]/.test(res)) {
            try {
                const decoded = decodeURIComponent(escape(res));
                if (decoded) res = decoded;
            } catch (e) {}
        }
        return res;
    },

    syncProcessSelectFromDept: function(deptStr) {
        if (!deptStr) return;
        const m = String(deptStr).match(/\b(FCAW|GMAW|SMAW|GTAW|SAW)\b/i);
        if (m) {
            const sel = document.getElementById('selProcess');
            const proc = m[1].toUpperCase();
            if (sel && Array.from(sel.options).some(o => o.value === proc)) {
                sel.value = proc;
            }
        }
    },

    // 테스트 및 외부 호출을 위한 정밀 파서 (불필요한 자격증 테이블 노이즈 원천 차단)
    parseWelderInfo: function(rawText) {
        const decoded = this.decodeQrText(rawText);
        if (!decoded) return { id: '', name: '', dept: '', isPipeQr: false };

        const raw = decoded
            .replace(/[（]/g, '(')
            .replace(/[）]/g, ')')
            .replace(/[–—―]/g, '-')
            .replace(/[｜¦]/g, '|')
            .trim();

        const pool = this.getCombinedWelderPool();

        // 1. 파이프(|) 구분 QR 코드 (예: YU-WQT-203|홍보|121(SAW) Butt)
        if (raw.includes('|')) {
            const parts = raw.replace(/[\r\n]+/g, ' ').split('|').map(s => s.trim());
            const pNo = this.normalizeWelderId(parts[0] || '');
            const pName = this.cleanWelderName(parts[1] || '') || (parts[1] || '');
            const pDept = parts.slice(2).join(' | ').trim();
            const foundByPipe = pool.find(w =>
                (pNo && String(w.id || w.welder_no || '').trim().toUpperCase() === pNo.toUpperCase()) ||
                (pName && String(w.name || '').trim() === pName)
            );
            if (foundByPipe) {
                return {
                    id: foundByPipe.id || foundByPipe.welder_no || pNo,
                    name: foundByPipe.name || pName,
                    dept: pDept || foundByPipe.dept || '',
                    isPipeQr: true
                };
            }
            return { id: pNo, name: pName, dept: pDept, isPipeQr: true };
        }

        // 2. 공정/소속 화이트리스트 추출 (자격증 테이블의 불필요한 문장은 절대 추출하지 않음)
        const extractCleanDept = text => {
            // (A) "Auto Carriage - FCAW(136)", "SAW Operator - SAW(121)", "Welder - FCAW(136), TIG(141)"
            const roleProcMatch = text.match(/\b(?:Auto\s*Carriage|SAW\s*Operator|Welder)\s*-\s*(?:FCAW|SAW|GTAW|GMAW|SMAW|TIG|MAG)\s*\(\s*\d{3}\s*\)(?:\s*,\s*(?:FCAW|SAW|GTAW|GMAW|SMAW|TIG|MAG)\s*\(\s*\d{3}\s*\))*/i);
            if (roleProcMatch) {
                return roleProcMatch[0]
                    .replace(/\s+/g, ' ')
                    .replace(/\s*-\s*/g, ' - ')
                    .replace(/\s*\(\s*/g, '(')
                    .replace(/\s*\)\s*/g, ')')
                    .trim();
            }
            // (B) "121(SAW) Butt", "136(FCAW) Fillet", "FCAW(136)" 등
            const procMatch = text.match(/\b(?:\d{3}\s*\(\s*(?:SAW|FCAW|SMAW|GTAW|GMAW|TIG|MAG)\s*\)(?:\s*(?:Butt|Fillet| Pipe|Plate))?|(?:SAW|FCAW|SMAW|GTAW|GMAW|TIG|MAG)\s*\(\s*\d{3}\s*\)(?:\s*,\s*(?:SAW|FCAW|SMAW|GTAW|GMAW|TIG|MAG)\s*\(\s*\d{3}\s*\))*)/i);
            if (procMatch) {
                return procMatch[0].replace(/\s+/g, ' ').replace(/\s*\(\s*/g, '(').replace(/\s*\)\s*/g, ')').trim();
            }
            // (C) 한글 부서명 (예: "생산1팀", "품질관리부" 등 - 단 자격증 라벨 제외)
            const deptMatches = text.match(/[\uAC00-\uD7A3A-Za-z0-9]{1,10}(?:팀|부|과|실|반|공정|업체|소속|라인)/g) || [];
            for (const dm of deptMatches) {
                if (!/^(?:소속|부서|업체|공정|팀명|합격부|확인부)$/.test(dm)) return dm;
            }
            return '';
        };

        const explicitDept = extractCleanDept(raw);

        // 3. 마스터 풀(사용자 프리셋 + 공인 용접사 86명) 직접 매칭
        let found = pool.find(w => {
            const wid = String(w.id || w.welder_no || '').trim().toUpperCase();
            const wnm = String(w.name || '').trim();
            return wid === raw.toUpperCase() || (wnm && wnm === raw);
        });
        if (!found) {
            const rawCompact = raw.toUpperCase().replace(/[\s_-]+/g, "");
            found = pool.find(w => {
                const no = String(w.id || w.welder_no || "").trim().toUpperCase();
                const noCompact = no.replace(/[\s_-]+/g, "");
                return (no && raw.toUpperCase().includes(no)) || (noCompact.length >= 4 && rawCompact.includes(noCompact));
            });
        }
        if (!found) {
            found = pool.find(w => {
                const nm = String(w.name || "").trim();
                const alt = String(w.alt || "").trim().toUpperCase();
                if (nm.length >= 2 && raw.includes(nm)) return true;
                if (alt.length >= 4) {
                    const tokens = alt.split(/\s+/).filter(t => t.length >= 3);
                    if (tokens.length >= 2 && tokens.every(t => raw.toUpperCase().includes(t))) return true;
                }
                return false;
            });
        }
        if (!found) {
            const cands = this.computeWelderCands(raw, pool);
            if (cands.length === 1 && cands[0].total >= 70) {
                found = cands[0].w;
            } else if (cands.length >= 2 && cands[0].total >= 75 && (cands[0].total - cands[1].total) >= 20) {
                found = cands[0].w;
            }
        }

        if (found) {
            return {
                id: found.id || found.welder_no || '',
                name: found.name || '',
                dept: found.dept || explicitDept || '',
                isPipeQr: false,
                matchedPool: true
            };
        }

        // 4. 마스터 풀에 없는 신규 용접사인 경우: 엄격한 정규식과 cleanWelderName으로 노이즈 없이 추출
        const idMatch = raw.match(/\b([A-Z]{1,4})\s*-\s*(WQT|W0T|WOT)\s*-\s*([0-9OILSZB]{2,6}(?:-\d+)?)\b/i)
                     || raw.match(/\b(?!FCAW|SAW|GTAW|GMAW|SMAW|AUTO|SEMI|ROOT|FILL|PASS|CERT|DATE|TEST|TYPE|WELD)([A-Z]{1,4}[-\s]?(?:WQT[-\s]?)?\d{2,6}(?:-\d+)?)\b/i);
        const freeNo = idMatch ? this.normalizeWelderId(idMatch[0].replace(/\s+/g, "")) : "";
        let freeName = this.cleanWelderName(raw);

        // 만약 "YU-WQT-999   홍   Auto Carriage - FCAW(136)" 처럼 사번 직후 외자 한글 이름이 구조적으로 배치된 경우만 1글자 이름 허용
        if (!freeName && idMatch) {
            const afterId = raw.slice(raw.indexOf(idMatch[0]) + idMatch[0].length).trim();
            const singleKorMatch = afterId.match(/^([가-힣])(?:\s+|$)/);
            if (singleKorMatch && !/^[팀부과실반]$/.test(singleKorMatch[1])) {
                freeName = singleKorMatch[1];
            }
        }

        return {
            id: freeNo,
            name: freeName,
            dept: explicitDept,
            isPipeQr: false,
            matchedPool: false
        };
    },

    // ─────────────────────────────────────────────────────────
    // Heat_Input_Calculator_Pro_2_3 의 applyScannedBarcode 완벽 이식
    // ─────────────────────────────────────────────────────────
    applyRawText: function(textParam) {
        const raw = textParam || (document.getElementById('scanRawText') ? document.getElementById('scanRawText').value : '');
        this.processScannedText(raw);
    },

    applyExtractedText: function(rawText) {
        this.processScannedText(rawText);
    },

    processScannedText: function(rawText) {
        const decoded = this.decodeQrText(rawText);
        const raw = String(decoded || "").trim();
        if (!raw) return;

        const statusEl = document.getElementById('ocrStatus');
        const candBox = document.getElementById('scanCandBox');
        if (candBox) { candBox.style.display = 'none'; candBox.innerHTML = ''; }

        const pool = this.getCombinedWelderPool();

        const applyWelderToForm = (idVal, nameVal, deptVal, statusHtml) => {
            const idInput = document.getElementById('inpWelderId');
            const nameInput = document.getElementById('inpWelderName');
            const deptInput = document.getElementById('inpWelderDept');
            if (idInput) idInput.value = idVal || '';
            if (nameInput) nameInput.value = nameVal || '';
            if (deptInput) deptInput.value = deptVal || '';
            this.syncProcessSelectFromDept(deptVal);
            if (statusEl && statusHtml) statusEl.innerHTML = statusHtml;
            setTimeout(() => {
                this.closeScanModal();
                if (typeof Calculator !== 'undefined') Calculator.calculate();
            }, 350);
        };
        const esc = v => this.escapeHtmlAttr(v);

        // 1. 파이프(|) 구분 QR 코드 (예: YU-WQT-203|홍보|121(SAW) Butt)
        if (raw.includes('|')) {
            const parts = raw.replace(/[\r\n]+/g, ' ').split('|').map(s => s.trim());
            const pNo = this.normalizeWelderId(parts[0] || '');
            const pName = this.cleanWelderName(parts[1] || '') || (parts[1] || '');
            const pDept = parts.slice(2).join(' | ').trim();
            const foundByPipe = pool.find(w =>
                (pNo && String(w.id || w.welder_no || '').trim().toUpperCase() === pNo.toUpperCase()) ||
                (pName && String(w.name || '').trim() === pName)
            );
            if (foundByPipe) {
                const fId = foundByPipe.id || foundByPipe.welder_no || pNo;
                const fName = foundByPipe.name || pName;
                const fDept = pDept || foundByPipe.dept || '';
                applyWelderToForm(fId, fName, fDept, `<span style="color:#16a34a;">✅ 인식 성공: <b>${esc(fId)} (${esc(fName)})</b> 자동 입력 완료!</span>`);
                return;
            }
            if (pNo || pName) {
                applyWelderToForm(pNo, pName, pDept, `<span style="color:#16a34a;">✅ QR/바코드 정보 자동 입력: <b>${esc(pNo || '-')} ${pName ? '(' + esc(pName) + ')' : ''}</b></span>`);
                return;
            }
        }

        // 2. 마스터 풀(프리셋 + 공인 용접사 86명) 직접 매칭
        let found = pool.find(w => {
            const wid = String(w.id || w.welder_no || '').trim().toUpperCase();
            const wnm = String(w.name || '').trim();
            return wid === raw.toUpperCase() || (wnm && wnm === raw);
        });
        if (!found) {
            const rawCompact = raw.toUpperCase().replace(/[\s_-]+/g, "");
            found = pool.find(w => {
                const no = String(w.id || w.welder_no || "").trim().toUpperCase();
                const noCompact = no.replace(/[\s_-]+/g, "");
                return (no && raw.toUpperCase().includes(no)) || (noCompact.length >= 4 && rawCompact.includes(noCompact));
            });
        }
        if (!found) {
            found = pool.find(w => {
                const nm = String(w.name || "").trim();
                const alt = String(w.alt || "").trim().toUpperCase();
                if (nm.length >= 2 && raw.includes(nm)) return true;
                if (alt.length >= 4) {
                    const tokens = alt.split(/\s+/).filter(t => t.length >= 3);
                    if (tokens.length >= 2 && tokens.every(t => raw.toUpperCase().includes(t))) return true;
                }
                return false;
            });
        }

        let topCands = [];
        if (!found) {
            topCands = this.computeWelderCands(raw, pool);
            if (topCands.length === 1 && topCands[0].total >= 70) {
                found = topCands[0].w;
            } else if (topCands.length >= 2 && topCands[0].total >= 75 && (topCands[0].total - topCands[1].total) >= 20) {
                found = topCands[0].w;
            }
        }

        const parsed = this.parseWelderInfo(raw);

        if (found) {
            const finalId = found.id || found.welder_no || '';
            const finalName = found.name || '';
            const finalDept = found.dept || parsed.dept || '';
            applyWelderToForm(finalId, finalName, finalDept, `<span style="color:#16a34a;">✅ 인식 성공: <b>${esc(finalId)} (${esc(finalName)})</b> 자동 입력 완료!</span>`);
            return;
        }

        // 3. 다수 퍼지 후보가 존재할 경우 선택 UI 제공
        // 단, 마스터 풀에 없는 신규 용접사의 명확한 사번(freeNo)과 이름(freeName)이 모두 클린하게 읽혔고
        // 퍼지 후보 점수가 낮다면(<75) 신규 용접사 정보를 우선 반영하고 후보는 하단 참고용으로만 표시
        const freeNo = parsed.id;
        const freeName = parsed.name;
        const freeDept = parsed.dept;

        if (topCands.length > 0 && !(freeNo && freeName && topCands[0].total < 75)) {
            this._lastScanCands = topCands.map(c => c.w);
            const best = topCands[0].w;
            const idInput = document.getElementById('inpWelderId');
            const nameInput = document.getElementById('inpWelderName');
            const deptInput = document.getElementById('inpWelderDept');
            if (idInput) idInput.value = best.id || best.welder_no || '';
            if (nameInput) nameInput.value = best.name || '';
            if (deptInput) deptInput.value = best.dept || '';
            this.syncProcessSelectFromDept(best.dept || '');
            if (typeof Calculator !== 'undefined') Calculator.calculate();

            if (candBox) {
                candBox.style.display = 'block';
                candBox.innerHTML = `<div style="font-size:11px;font-weight:900;color:#1e40af;margin-bottom:5px;">🔎 혹시 이분인가요? (탭하여 선택)</div>` +
                    `<div style="display:flex;flex-wrap:wrap;gap:5px;">` +
                    this._lastScanCands.map((w, idx) =>
                        `<button type="button" onclick="MainController.pickScanCandidate(${idx})" style="padding:6px 10px;border-radius:6px;border:1.5px solid ${idx === 0 ? '#ea580c' : '#2563eb'};background:${idx === 0 ? '#fff7ed' : '#fff'};color:#111;font-size:11px;font-weight:900;cursor:pointer;">${idx === 0 ? '⭐ ' : ''}<b>${esc(w.id || w.welder_no)}</b> · ${esc(w.name)}${w.dept ? ' <span style="color:#6b7280;font-weight:700;">(' + esc(w.dept) + ')</span>' : ''}</button>`
                    ).join('') + `</div>`;
            }
            if (statusEl) {
                statusEl.innerHTML = `<span style="color:#2563eb;">🔎 유사 후보 <b>${topCands.length}명</b> 발견 — 1순위 <b>${esc(best.id || best.welder_no)} (${esc(best.name)})</b> 임시 반영됨 (아래에서 탭하여 확정)</span>`;
            }
            this.renderSaveScanImageBar();
            return;
        }

        // 4. 마스터 풀에 없는 용접사 자유 추출 (불필요한 자격증 테이블 노이즈 제외된 값만 반영)

        if (freeNo || freeName) {
            const fallbackNo = freeNo || (raw.length <= 16 && /^[A-Za-z0-9_-]+$/.test(raw) ? raw : "");
            applyWelderToForm(
                fallbackNo,
                freeName,
                freeDept,
                `<span style="color:#d97706;">ℹ️ 스티커에서 추출한 정보 자동 입력: <b>${fallbackNo ? '[' + esc(fallbackNo) + '] ' : ''}${esc(freeName || '')} ${freeDept ? '(' + esc(freeDept) + ')' : ''}</b></span>`
            );
        } else {
            if (statusEl) {
                statusEl.innerHTML = `<span style="color:#dc2626;">⚠️ 용접사 사번이나 이름을 명확히 구분하지 못했습니다. 스티커를 가까이에서 밝게 다시 찍거나 아래 입력창에서 직접 수정해 주세요.</span>`;
            }
            this.renderSaveScanImageBar();
        }
    },

    pickScanCandidate: function(idx) {
        const w = (this._lastScanCands || [])[idx];
        if (!w) return;
        this.processScannedText(w.id || w.welder_no);
    },

    filterQuickWelderSearch: function(q) {
        const box = document.getElementById('scanQuickSearch');
        if (!box) return;
        const pool = this.getCombinedWelderPool();
        const query = String(q || '').trim().toUpperCase();
        const matched = query
            ? pool.filter(w => {
                const wid = String(w.id || w.welder_no || '').toUpperCase();
                const wnm = String(w.name || '').toUpperCase();
                const walt = String(w.alt || '').toUpperCase();
                const wdept = String(w.dept || '').toUpperCase();
                return wid.includes(query) || wnm.includes(query) || walt.includes(query) || wdept.includes(query);
            }).slice(0, 24)
            : pool.slice(0, 18);

        if (matched.length === 0) {
            box.innerHTML = `<span style="font-size:11px; color:var(--text-muted);">일치하는 등록 용접사가 없습니다. [자동입력]을 누르면 입력한 값으로 적용됩니다.</span>`;
            return;
        }
        box.innerHTML = matched.map(w => {
            const wid = w.id || w.welder_no;
            return `<button type="button" data-welder-id="${this.escapeHtmlAttr(wid)}" onclick="MainController.processScannedText(this.getAttribute('data-welder-id'))" style="padding:4px 8px; border-radius:6px; border:1px solid var(--border-strong); background:var(--bg-main); color:var(--text-primary); font-size:11px; font-weight:800; cursor:pointer;"><b>${this.escapeHtmlAttr(wid)}</b> · ${this.escapeHtmlAttr(w.name)}</button>`;
        }).join('');
    },

    focusGalaxyTextScan: function() {
        const inp = document.getElementById('scanRawText');
        const statusEl = document.getElementById('ocrStatus');
        if (inp) {
            inp.value = '';
            inp.focus();
        }
        if (statusEl) {
            statusEl.innerHTML = `<span style="color:#ff6d00;">📱 입력창이 선택되었습니다! 키보드 상단 <b>[📷 텍스트 스캔]</b> 아이콘(또는 입력창 길게 누르기 → 텍스트 스캔)을 눌러 헬멧 글자를 비추세요.</span>`;
        }
    },

    pasteClipboardToScanner: async function() {
        const statusEl = document.getElementById('ocrStatus');
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const txt = await navigator.clipboard.readText();
                if (txt && txt.trim()) {
                    const inp = document.getElementById('scanRawText');
                    if (inp) inp.value = txt.trim();
                    this.processScannedText(txt.trim());
                    return;
                }
            }
            const inp = document.getElementById('scanRawText');
            if (inp) inp.focus();
            if (statusEl) statusEl.innerHTML = `<span style="color:#2563eb;">📋 아래 입력창을 길게 눌러 [붙여넣기]를 선택한 뒤 [자동입력]을 눌러주세요.</span>`;
        } catch (e) {
            const inp = document.getElementById('scanRawText');
            if (inp) inp.focus();
            if (statusEl) statusEl.innerHTML = `<span style="color:#2563eb;">📋 아래 입력창을 길게 눌러 [붙여넣기]를 선택한 뒤 [자동입력]을 눌러주세요.</span>`;
        }
    },

    startNfcScan: async function() {
        const statusEl = document.getElementById('ocrStatus');
        if (!('NDEFReader' in window)) {
            if (statusEl) statusEl.innerHTML = `<span style="color:#dc2626;">⚠️ 현재 브라우저/기기에서는 웹 NFC 기능을 지원하지 않습니다. (안드로이드 Chrome 지원)</span>`;
            return;
        }
        try {
            const ndef = new window.NDEFReader();
            await ndef.scan();
            if (statusEl) statusEl.innerHTML = `<span style="color:#059669;">📡 NFC 스캔 대기 중... 헬멧의 NFC 태그에 휴대폰 뒷면을 가까이 대주세요.</span>`;
            ndef.onreading = event => {
                const decoder = new TextDecoder();
                for (const record of event.message.records) {
                    const txt = decoder.decode(record.data);
                    if (txt && txt.trim()) {
                        const inp = document.getElementById('scanRawText');
                        if (inp) inp.value = txt.trim();
                        this.processScannedText(txt.trim());
                        break;
                    }
                }
            };
        } catch (e) {
            if (statusEl) statusEl.innerHTML = `<span style="color:#dc2626;">⚠️ NFC 권한이 거부되었거나 비활성화 상태입니다.</span>`;
        }
    },

    // ─────────────────────────────────────────────────────────
    // 스캔 실패 시 촬영/선택 이미지 갤러리(기기) 저장 옵션 지원
    // ─────────────────────────────────────────────────────────
    _lastScannedBlob: null,
    _lastScannedDataUrl: null,

    cacheScannedImage: async function(source, fileObj = null) {
        try {
            if (fileObj instanceof Blob) {
                this._lastScannedBlob = fileObj;
                if (this._lastScannedDataUrl && this._lastScannedDataUrl.startsWith('blob:')) {
                    try { URL.revokeObjectURL(this._lastScannedDataUrl); } catch (e) {}
                }
                this._lastScannedDataUrl = URL.createObjectURL(fileObj);
                return;
            }
            if (!source) return;
            const c = document.createElement('canvas');
            const w = source.videoWidth || source.naturalWidth || source.width || 640;
            const h = source.videoHeight || source.naturalHeight || source.height || 480;
            c.width = w;
            c.height = h;
            const ctx = c.getContext('2d');
            ctx.drawImage(source, 0, 0, w, h);
            const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.95));
            if (blob) {
                this._lastScannedBlob = blob;
                if (this._lastScannedDataUrl && this._lastScannedDataUrl.startsWith('blob:')) {
                    try { URL.revokeObjectURL(this._lastScannedDataUrl); } catch (e) {}
                }
                this._lastScannedDataUrl = URL.createObjectURL(blob);
            }
        } catch (e) {}
    },

    hideSaveScanImageBar: function() {
        const box = document.getElementById('scanSaveImgBox');
        if (box) {
            box.style.display = 'none';
            box.innerHTML = '';
        }
    },

    renderSaveScanImageBar: function() {
        const box = document.getElementById('scanSaveImgBox');
        if (!box) return;
        if (!this._lastScannedDataUrl && !this._lastScannedBlob) {
            box.style.display = 'none';
            box.innerHTML = '';
            return;
        }
        box.style.display = 'flex';
        box.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; width:100%; justify-content:space-between; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${this._lastScannedDataUrl}" alt="스캔 이미지" style="width:44px; height:44px; object-fit:cover; border-radius:6px; border:1.5px solid #dc2626; background:#000;" />
                    <div style="text-align:left; line-height:1.35;">
                        <div style="font-size:12px; font-weight:900; color:#991b1b;">📷 촬영/스캔한 이미지를 갤러리에 저장할까요?</div>
                        <div style="font-size:10px; color:#7f1d1d;">저장 후 [🔤 스티커 사진선택] 또는 갤럭시 [텍스트 스캔]에 다시 활용할 수 있습니다.</div>
                    </div>
                </div>
                <button type="button" onclick="MainController.saveLastScannedImageToGallery()" style="background:#dc2626; color:#fff; border:none; border-radius:6px; padding:8px 12px; font-size:12px; font-weight:900; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(220,38,38,0.25);">
                    💾 갤러리에 이미지 저장
                </button>
            </div>
        `;
    },

    saveLastScannedImageToGallery: async function() {
        if (!this._lastScannedBlob && !this._lastScannedDataUrl) {
            alert('저장할 스캔 이미지가 없습니다.');
            return;
        }
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const ext = (this._lastScannedBlob && this._lastScannedBlob.type === 'image/png') ? 'png' : 'jpg';
        const filename = `welder_scan_${stamp}.${ext}`;

        try {
            const href = this._lastScannedDataUrl || URL.createObjectURL(this._lastScannedBlob);
            const a = document.createElement('a');
            a.href = href;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            const statusEl = document.getElementById('ocrStatus');
            if (statusEl) {
                statusEl.innerHTML = `<span style="color:#16a34a;">✅ 스캔 이미지가 기기(갤러리/다운로드)에 <b>${filename}</b> 으로 저장되었습니다!</span>`;
            }
        } catch (e) {
            alert('이미지 저장 중 오류가 발생했습니다.');
        }
    },

    // ─────────────────────────────────────────────────────────
    // 이미지 업로드 핸들러 (① 카메라 촬영: QR+스티커 통합, ② 스티커 사진선택: OCR 전용)
    // ─────────────────────────────────────────────────────────
    processImageOCR: async function(event) {
        return this.handleBarcodeImageUpload(event);
    },

    handleBarcodeImageUpload: async function(event) {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        this.hideSaveScanImageBar();
        await this.cacheScannedImage(null, file);
        const statusEl = document.getElementById('ocrStatus');
        if (statusEl) statusEl.innerText = "⏳ 사진에서 QR/바코드 및 문자(OCR)를 분석 중입니다...";
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = async () => {
            try {
                // 1차: QR/바코드 초고속 탐색
                const code = await this.decodeBarcodeFromSource(img);
                if (code) {
                    const cleanCode = this.decodeQrText(code);
                    const rawBox = document.getElementById('scanRawText');
                    if (rawBox) rawBox.value = cleanCode;
                    this.processScannedText(cleanCode);
                    return;
                }
                // 2차: QR/바코드가 없으면 즉시 HI OCR v4 엔진으로 스티커 문자 판독
                const pool = this.getCombinedWelderPool();
                const ocrText = await this.extractTextFromStickerSource(
                    img,
                    msg => { if (statusEl) statusEl.innerText = msg; },
                    pool
                );
                if (ocrText) {
                    const rawBox = document.getElementById('scanRawText');
                    if (rawBox) rawBox.value = ocrText.replace(/\s+/g, " ").trim();
                    this.processScannedText(ocrText);
                } else {
                    if (statusEl) {
                        statusEl.innerHTML = `<span style="color:#dc2626;">❌ 사진에서 QR/바코드나 스티커 글자를 찾지 못했습니다. 스티커를 가까이에서 밝게 다시 촬영해 주세요.</span>`;
                    }
                    this.renderSaveScanImageBar();
                }
            } finally {
                URL.revokeObjectURL(url);
                event.target.value = "";
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            if (statusEl) statusEl.innerText = "❌ 이미지를 불러오지 못했습니다.";
            this.renderSaveScanImageBar();
            event.target.value = "";
        };
        img.src = url;
    },

    handleStickerOcrUpload: async function(event) {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        this.hideSaveScanImageBar();
        await this.cacheScannedImage(null, file);
        const statusEl = document.getElementById('ocrStatus');
        if (statusEl) statusEl.innerText = "⏳ 스티커 사진에서 한글·영문·숫자(OCR)를 정밀 판독 중입니다...";
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = async () => {
            try {
                // 1차: HI OCR v4 엔진으로 스티커 문자 판독 (마스터 풀 조기 종료 지원)
                const pool = this.getCombinedWelderPool();
                const ocrText = await this.extractTextFromStickerSource(
                    img,
                    msg => { if (statusEl) statusEl.innerText = msg; },
                    pool
                );
                if (ocrText) {
                    const rawBox = document.getElementById('scanRawText');
                    if (rawBox) rawBox.value = ocrText.replace(/\s+/g, " ").trim();
                    this.processScannedText(ocrText);
                    return;
                }
                // 2차: 문자가 없으면 혹시 QR/바코드가 있는지 보조 확인
                const code = await this.decodeBarcodeFromSource(img);
                if (code) {
                    const cleanCode = this.decodeQrText(code);
                    const rawBox = document.getElementById('scanRawText');
                    if (rawBox) rawBox.value = cleanCode;
                    this.processScannedText(cleanCode);
                } else {
                    if (statusEl) {
                        statusEl.innerHTML = `<span style="color:#dc2626;">❌ 스티커에서 글자를 읽지 못했습니다. 글자가 흔들리지 않게 가까이에서 다시 촬영해 주세요.</span>`;
                    }
                    this.renderSaveScanImageBar();
                }
            } finally {
                URL.revokeObjectURL(url);
                event.target.value = "";
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            if (statusEl) statusEl.innerText = "❌ 이미지를 불러오지 못했습니다.";
            this.renderSaveScanImageBar();
            event.target.value = "";
        };
        img.src = url;
    },

    // ─────────────────────────────────────────────────────────
    // 실시간 카메라 제어 (가이드 사각틀 + 최선명 프레임 버스트 캡처 + 조명 토글)
    // ─────────────────────────────────────────────────────────
    startLiveCamera: async function() {
        if (this._scanStream) {
            this.stopLiveCamera();
            return;
        }
        const wrap = document.getElementById('scanVideoWrap');
        const video = document.getElementById('scanVideoEl');
        const statusEl = document.getElementById('ocrStatus');
        const btnCam = document.getElementById('btnToggleCam');
        if (!wrap || !video) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (statusEl) statusEl.innerHTML = `<span style="color:#dc2626;">⚠️ 현재 환경에서는 실시간 카메라 스트림이 제한됩니다. 좌측 <b>[📷 카메라 촬영]</b> 또는 <b>[🔤 스티커 사진선택]</b>을 사용해 주세요.</span>`;
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false
            });
            this._scanStream = stream;
            this._torchOn = false;
            video.srcObject = stream;
            await video.play();
            wrap.style.display = 'block';
            if (btnCam) {
                btnCam.innerHTML = `<span style="font-size: 13px; margin-bottom: 2px;">⏹️ 카메라 끄기</span><span style="font-size: 10px; opacity: 0.85;">(실시간 스캔중)</span>`;
                btnCam.style.background = '#dc2626';
            }

            try {
                const track = stream.getVideoTracks()[0];
                const caps = track && track.getCapabilities ? track.getCapabilities() : {};
                const torchBtn = document.getElementById('btnTorchToggle');
                if (torchBtn) torchBtn.style.display = caps && caps.torch ? 'block' : 'none';
                if (caps && caps.focusMode && caps.focusMode.includes('continuous')) {
                    track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
                }
            } catch (e) {}

            if (statusEl) {
                statusEl.innerText = "📷 실시간 스캔 중... QR/바코드는 자동 인식되며, 일반 스티커는 화면 하단 [📸 지금 화면에서 문자 바로 읽기]를 누르세요.";
            }

            let busy = false;
            this._scanTimer = setInterval(async () => {
                if (busy || !this._scanStream || video.readyState < 2) return;
                busy = true;
                try {
                    const code = await this.decodeBarcodeFromSource(video);
                    if (code) {
                        const cleanCode = this.decodeQrText(code);
                        const rawBox = document.getElementById('scanRawText');
                        if (rawBox) rawBox.value = cleanCode;
                        this.stopLiveCamera();
                        this.processScannedText(cleanCode);
                    }
                } catch (e) {} finally {
                    busy = false;
                }
            }, 350);
        } catch (err) {
            if (statusEl) {
                statusEl.innerHTML = `<span style="color:#dc2626;">⚠️ 카메라 권한이 거부되었거나 사용할 수 없습니다. 좌측 <b>[📷 카메라 촬영]</b> 버튼을 사용해 주세요.</span>`;
            }
        }
    },

    toggleCameraTorch: async function() {
        if (!this._scanStream) return;
        try {
            const track = this._scanStream.getVideoTracks()[0];
            this._torchOn = !this._torchOn;
            await track.applyConstraints({ advanced: [{ torch: this._torchOn }] });
            const torchBtn = document.getElementById('btnTorchToggle');
            if (torchBtn) {
                torchBtn.style.background = this._torchOn ? '#fbbf24' : 'rgba(0,0,0,0.7)';
                torchBtn.style.color = this._torchOn ? '#111' : '#fbbf24';
            }
        } catch (e) {}
    },

    grabSharpestCrop: async function(video) {
        const vw = video.videoWidth || 0, vh = video.videoHeight || 0;
        if (!vw || !vh) return video;
        const sx = Math.round(vw * 0.08), sy = Math.round(vh * 0.18), sw = Math.round(vw * 0.84), sh = Math.round(vh * 0.64);
        let bestCnv = null, bestScore = -1;
        for (let f = 0; f < 3; f++) {
            const c = document.createElement('canvas');
            c.width = sw; c.height = sh;
            const cx = c.getContext('2d', { willReadFrequently: true });
            cx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
            try {
                const d = cx.getImageData(0, 0, sw, sh).data;
                let sum = 0, cnt = 0;
                const step = 4 * 4;
                for (let y = 2; y < sh - 2; y += 4) {
                    const row = y * sw * 4;
                    for (let x = 2; x < sw - 2; x += 4) {
                        const i = row + x * 4;
                        const gx = Math.abs(d[i + step] - d[i - step]);
                        const gy = Math.abs(d[i + sw * 4] - d[i - sw * 4]);
                        sum += gx + gy;
                        cnt++;
                    }
                }
                const sc = cnt ? sum / cnt : 0;
                if (sc > bestScore) { bestScore = sc; bestCnv = c; }
            } catch (e) { bestCnv = c; break; }
            if (f < 2) await new Promise(r => setTimeout(r, 45));
        }
        return bestCnv || video;
    },

    captureLiveStickerOcr: async function() {
        const video = document.getElementById('scanVideoEl');
        const statusEl = document.getElementById('ocrStatus');
        if (!video || !this._scanStream || video.readyState < 2) {
            if (statusEl) statusEl.innerText = "⚠️ 먼저 [🎥 실시간 카메라]를 켜주세요.";
            return;
        }
        this.hideSaveScanImageBar();
        if (statusEl) statusEl.innerText = "📸 가장 선명한 프레임을 포착하여 판독 중입니다...";
        const cropCnv = await this.grabSharpestCrop(video);
        await this.cacheScannedImage(video, null);
        const code = await this.decodeBarcodeFromSource(cropCnv) || await this.decodeBarcodeFromSource(video);
        if (code) {
            const cleanCode = this.decodeQrText(code);
            const rawBox = document.getElementById('scanRawText');
            if (rawBox) rawBox.value = cleanCode;
            this.stopLiveCamera();
            this.processScannedText(cleanCode);
            return;
        }
        const pool = this.getCombinedWelderPool();
        const ocrText = await this.extractTextFromStickerSource(
            cropCnv,
            msg => { if (statusEl) statusEl.innerText = msg; },
            pool
        );
        if (ocrText) {
            const rawBox = document.getElementById('scanRawText');
            if (rawBox) rawBox.value = ocrText.replace(/\s+/g, " ").trim();
            this.stopLiveCamera();
            this.processScannedText(ocrText);
        } else {
            if (statusEl) {
                statusEl.innerHTML = `<span style="color:#dc2626;">⚠️ 현재 화면에서 글자를 읽지 못했습니다. 주황색 점선 사각틀 안에 스티커를 맞추고 다시 눌러주세요.</span>`;
            }
            this.renderSaveScanImageBar();
        }
    },

    stopLiveCamera: async function() {
        if (this._scanTimer) {
            clearInterval(this._scanTimer);
            this._scanTimer = null;
        }
        if (this._scanStream) {
            try { this._scanStream.getTracks().forEach(t => t.stop()); } catch (e) {}
            this._scanStream = null;
        }
        this._torchOn = false;
        const wrap = document.getElementById('scanVideoWrap');
        if (wrap) wrap.style.display = 'none';
        const btnCam = document.getElementById('btnToggleCam');
        if (btnCam) {
            btnCam.innerHTML = `<span style="font-size: 13px; margin-bottom: 2px;">🎥 실시간 카메라</span><span style="font-size: 10px; opacity: 0.85;">(수동으로 켜기)</span>`;
            btnCam.style.background = '#111827';
        }
        if (window.html5QrcodeScanner) {
            try {
                if (window.html5QrcodeScanner.isScanning) await window.html5QrcodeScanner.stop();
            } catch (e) {}
            try { window.html5QrcodeScanner.clear(); } catch (e) {}
            window.html5QrcodeScanner = null;
        }
    },

    closeScanModal: function() {
        this.stopLiveCamera();
        this.closeModal();
    },

    // ─────────────────────────────────────────────────────────
    // 도움말 모달(HelpManual 연동) 및 PRO 인증 설정 모달
    // ─────────────────────────────────────────────────────────
    openModal: async function(pagePath) {
        const modal = document.getElementById('subPageModal');
        const body = document.getElementById('subPageBody');
        const title = document.getElementById('subPageTitle');
        if (!modal || !body || !title) return;

        const lang = localStorage.getItem('HI_LANG') || 'ko';

        if (pagePath.includes('dashboard')) {
            this._currentModalType = 'help';
            if (typeof HelpManual !== 'undefined') {
                HelpManual.renderModal(lang, title, body);
            } else {
                title.innerText = '📘 사용 매뉴얼';
                body.innerHTML = `<div style="padding:20px;">js/help_manual.js 파일을 로드해 주세요.</div>`;
            }
            modal.classList.remove('hidden');
        } else {
            this._currentModalType = 'settings';
            const devCode = _getDeviceCode();
            const prevNameEl = document.getElementById('proRegName');
            const prevCodeEl = document.getElementById('proRegCode');
            const prevNameVal = prevNameEl ? this.escapeHtmlAttr(prevNameEl.value) : '';
            const prevCodeVal = prevCodeEl ? this.escapeHtmlAttr(prevCodeEl.value) : '';

            title.innerText = this.t('settings_title');
            body.innerHTML = `
                <div style="background-color:var(--brand-orange); padding:16px; border-radius:10px; color:#fff; font-weight:800; margin-bottom:16px;">
                    <h3 style="margin-bottom:4px; font-size:16px;">${this.t('settings_banner_title')}</h3>
                    <p style="font-size:12px; font-weight:normal; margin:0;">${this.t('settings_banner_desc')}</p>
                </div>

                <!-- 내 기기 고유번호 표시 및 원클릭 복사 카드 -->
                <div style="border:2px solid var(--brand-orange); border-radius:10px; padding:14px 16px; margin-bottom:16px; background:var(--bg-soft);">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
                        <div>
                            <div style="font-size:11px; font-weight:800; color:var(--text-muted); margin-bottom:2px;">${this.t('settings_dev_id_lbl')}</div>
                            <div id="myDeviceCodeTxt" style="font-family:monospace; font-size:22px; font-weight:900; color:var(--brand-orange); letter-spacing:1.5px;">${devCode}</div>
                        </div>
                        <button type="button" style="background:#111827; color:#fff; border:none; border-radius:8px; padding:10px 14px; font-size:12px; font-weight:800; cursor:pointer;" onclick="MainController.copyMyDeviceCode(false)">
                            ${this.t('btn_copy_dev_id')}
                        </button>
                    </div>
                    <p style="margin:8px 0 0 0; font-size:11px; color:var(--text-muted); line-height:1.45;">
                        ${this.t('settings_dev_id_note', { dev: devCode })}
                    </p>
                </div>

                <div style="background:var(--bg-soft); padding:14px; border-radius:10px; font-size:12px; margin-bottom:16px; line-height:1.5;">
                    <b style="font-size:13px; color:var(--text-primary);">${this.t('settings_compare_title')}</b>
                    <ul style="margin-top:6px; padding-left:20px; color:var(--text-muted);">
                        <li style="margin-bottom:4px;">${this.t('settings_compare_free')}</li>
                        <li><strong style="color:var(--text-primary);">${this.t('settings_compare_pro')}</strong></li>
                    </ul>
                </div>

                <!-- 📱 원스톱 3단계 신청 & 활성화 카드 -->
                <!-- 1단계: 📧 신청자 정보 (기기번호 + 성함 + 이메일) 및 3초 발급 -->
                <div style="background:#e7f5ff; border:1.5px solid #74c0fc; border-radius:12px; padding:14px; margin-bottom:14px;">
                    <div style="font-size:13px; font-weight:900; color:#1864ab; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                        <span>📧</span> <strong>${this.t('step1_title')}</strong>
                    </div>

                    <!-- 2열 그리드: 기기번호(자동감지) + 신청자 성함 -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                        <div>
                            <label style="display:block; font-size:11.5px; font-weight:800; color:#495057; margin-bottom:4px;">
                                ${this.t('step1_my_dev')}
                            </label>
                            <input type="text" id="myDevDisplay" value="${devCode}" readonly style="width:100%; padding:10px; font-family:monospace; font-size:16px; font-weight:900; color:var(--brand-orange); background:#f8f9fa; border:1.5px solid #ced4da; border-radius:8px; text-align:center; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:11.5px; font-weight:800; color:#495057; margin-bottom:4px;">
                                ${this.t('step1_applicant_name')} <span style="color:#e03131;">*</span>
                            </label>
                            <input type="text" id="proRegName" value="${prevNameVal}" placeholder="${this.t('ph_applicant_name')}" style="width:100%; padding:10px; font-size:13px; font-weight:700; border:1.5px solid #adb5bd; border-radius:8px; outline:none; background:#fff; box-sizing:border-box;">
                        </div>
                    </div>

                    <!-- 이메일 입력 및 3초 발급 버튼 -->
                    <div>
                        <label style="display:block; font-size:11.5px; font-weight:800; color:#495057; margin-bottom:4px;">
                            ${this.t('step1_email_label')} <span style="color:#e03131;">*</span>
                        </label>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <input type="email" id="emailApplyInput" placeholder="${this.t('ph_email')}" style="flex:1; min-width:180px; padding:10px 12px; font-size:13px; font-weight:700; border:1.5px solid #adb5bd; border-radius:8px; outline:none; background:#fff; box-sizing:border-box;">
                            <button type="button" id="btnApplyEmail" onclick="MainController.applyByEmail()" style="background:#1864ab; color:#fff; border:none; border-radius:8px; padding:10px 16px; font-size:13px; font-weight:900; cursor:pointer; white-space:nowrap; box-shadow:0 2px 6px rgba(24,100,171,0.25); transition:all 0.2s ease;">
                                ${this.t('step1_btn_get')}
                            </button>
                        </div>
                        <div id="emailApplyStatus" style="margin-top:10px;">
                            <div style="background:#f8f9fa; border:1px solid #ced4da; border-radius:8px; padding:10px 12px; font-size:12px; line-height:1.5;">
                                <div style="color:#495057; font-weight:700;">
                                    ${this.t('step1_guide')}
                                </div>
                                <div style="color:#e03131; font-size:11.5px; margin-top:4px; font-weight:700;">
                                    ${this.t('step1_spam_notice')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2단계: ☕ 후원 링크 선택 (카카오페이 & Buy Me a Coffee) -->
                <div style="border:1.5px solid var(--border-strong); border-radius:12px; padding:14px; margin-bottom:14px; background:var(--bg-card);">
                    <div style="font-size:13px; font-weight:900; color:var(--text-primary); margin-bottom:8px;">
                        ${this.t('step2_title')}
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
                        <a href="https://qr.kakaopay.com/FLfFztgIX" target="_blank" rel="noopener" style="display:flex; align-items:center; justify-content:center; gap:6px; background:#FEE500; color:#191919; text-decoration:none; padding:12px 8px; border-radius:8px; font-size:13px; font-weight:900; border:1.5px solid #e6cf00;">
                            ${this.t('step2_kakaopay')}
                        </a>
                        <a href="https://buymeacoffee.com/iskorea" target="_blank" rel="noopener" style="display:flex; align-items:center; justify-content:center; gap:6px; background:#FFDD00; color:#000000; text-decoration:none; padding:12px 8px; border-radius:8px; font-size:13px; font-weight:900; border:1.5px solid #ebd000;">
                            ${this.t('step2_buymeacoffee')}
                        </a>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-soft); padding:8px 12px; border-radius:8px; font-size:11.5px; border:1px solid var(--border-light);">
                        <span style="color:var(--text-muted);">${this.t('step2_inquiry')}</span>
                        <a href="https://pf.kakao.com/_hALxeX" target="_blank" rel="noopener" style="color:var(--brand-orange); font-weight:800; text-decoration:underline;">${this.t('step2_kakao_chat')}</a>
                    </div>
                </div>

                <!-- 3단계: 리딤코드 입력 및 활성화 -->
                <div style="background:var(--bg-soft); border:1.5px solid var(--border-strong); border-radius:12px; padding:14px; margin-bottom:16px;">
                    <div style="font-size:13px; font-weight:900; color:var(--text-primary); margin-bottom:4px;">
                        ${this.t('step3_title')}
                    </div>
                    <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:8px;">
                        ${this.t('step3_desc')}
                    </div>
                    <input type="text" id="proRegCode" class="full-input" style="font-family:monospace; font-weight:900; font-size:15px; letter-spacing:1.5px; text-align:center; color:#065f46; background:#fff; padding:12px; border:1.5px solid #adb5bd; border-radius:8px; width:100%; box-sizing:border-box; margin-bottom:12px;" value="${prevCodeVal}" placeholder="HEAT-${devCode}-XXXXX-XXXXX" oninput="this.value = this.value.toUpperCase()">

                    <div style="display:flex; gap:10px;">
                        <button type="button" class="act-btn btn-orange" style="flex:1; background:var(--brand-orange); color:#fff; border:none; padding:13px; border-radius:8px; font-size:15px; font-weight:900; cursor:pointer;" onclick="MainController.verifyRedeemCode()">${this.t('btn_activate_pro')}</button>
                        <button type="button" class="act-btn" style="background:#000; color:#fff; border:none; width:100px; padding:13px; border-radius:8px; font-size:14px; font-weight:800; cursor:pointer;" onclick="MainController.closeModal()">${this.t('btn_close_x')}</button>
                    </div>
                </div>
                <div style="display:none;"><button type="button" class="act-btn btn-orange" style="flex:1; background:var(--brand-orange); color:#fff; border:none;" onclick="MainController.verifyRedeemCode()">${this.t('btn_activate_pro')}</button>
                    <button type="button" class="act-btn" style="background:#000; color:#fff; border:none; width:100px;" onclick="MainController.closeModal()">${this.t('btn_close_x')}</button>
                </div>
                <div id="proAuthMessage" style="margin-top:12px; font-size:13px; font-weight:800; text-align:center;"></div>
                <div id="currentLicenseHolder" style="margin-top:10px; font-size:12px; text-align:center; color:var(--text-muted);"></div>
            `;
            modal.classList.remove('hidden');
            this.renderLicenseBoxInSettings();
        }
    },

    getDeviceCode: function() {
        return _getDeviceCode();
    },

    
    applyByEmail: async function() {
        const emailInp = document.getElementById('emailApplyInput');
        const statusEl = document.getElementById('emailApplyStatus');
        const nameInp = document.getElementById('proRegName');
        const btn = document.getElementById('btnApplyEmail');
        const email = (emailInp ? emailInp.value : '').trim();
        const name = (nameInp && nameInp.value ? nameInp.value : '').trim();
        const dev = _getDeviceCode();

        if (!name) {
            if (statusEl) {
                statusEl.innerHTML = `
                    <div style="background:#fff5f5; border:1.5px solid #ff8787; border-radius:8px; padding:10px 12px; color:#c92a2a; font-weight:800; font-size:12px;">
                        ${this.t('err_name_required')}
                    </div>
                `;
            }
            if (nameInp) nameInp.focus();
            return;
        }

        if (!email || !email.includes('@')) {
            if (statusEl) {
                statusEl.innerHTML = `
                    <div style="background:#fff5f5; border:1.5px solid #ff8787; border-radius:8px; padding:10px 12px; color:#c92a2a; font-weight:800; font-size:12px;">
                        ${this.t('err_email_invalid')}
                    </div>
                `;
            }
            if (emailInp) emailInp.focus();
            return;
        }

        // 1. 클라이언트에서 전용 영구 리딤코드 즉시 선계산 및 자동 채우기 (사용자 대기시간 0초)
        const instantCode = _generateDeviceCode('HEAT', dev);
        const codeInp = document.getElementById('proRegCode');
        if (codeInp) codeInp.value = instantCode;

        // 버튼 상태 변경 (중복 클릭 방지)
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.innerHTML = this.t('status_sending');
        }

        // 2. 실시간 발송 진행 상황 안내 박스 즉시 출력
        if (statusEl) {
            statusEl.innerHTML = `
                <div style="background:#e7f5ff; border:1.5px solid #339af0; border-radius:10px; padding:12px 14px; box-shadow:0 2px 8px rgba(51,154,240,0.15);">
                    <div style="font-size:13px; font-weight:900; color:#1864ab; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
                        <span style="display:inline-block; font-size:16px;">⏳</span> ${this.t('status_processing_title')}
                    </div>
                    <div style="font-size:12px; color:#343a40; line-height:1.6;">
                        ${this.t('status_code_ready')}<br>
                        ${this.t('status_sending_mail', { email: email })}<br>
                        <div style="margin-top:6px; color:#e03131; font-size:11.5px; font-weight:800; background:#fff5f5; padding:4px 8px; border-radius:6px; border:1px solid #ffc9c9;">
                            ${this.t('step1_spam_notice')}
                        </div>
                    </div>
                </div>
            `;
        }

        const apiUrl = (localStorage.getItem('PRO_ADMIN_GAS_URL') || localStorage.getItem(this.LICENSE_API_URL_KEY) || this.DEFAULT_LICENSE_API_URL || '').trim();
        if (!apiUrl) {
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.innerHTML = this.t('step1_btn_get');
            }
            if (statusEl) {
                statusEl.innerHTML = `
                    <div style="background:#ebfbee; border:1.5px solid #63e6be; border-radius:8px; padding:10px; margin-top:6px; font-size:12px; color:#2b8a3e; line-height:1.5;">
                        ✅ ${this.t('status_code_ready')}
                    </div>
                `;
            }
            return;
        }

        const cleanUrl = apiUrl.split('?')[0].trim();
        const sep = cleanUrl.includes('?') ? '&' : '?';
        const reqUrl = `${cleanUrl}${sep}action=emailApply&email=${encodeURIComponent(email)}&dev=${encodeURIComponent(dev)}&name=${encodeURIComponent(name)}&app=HEAT&t=${Date.now()}`;

        let isCompleted = false;
        const markSuccess = (emailSent) => {
            if (isCompleted) return;
            isCompleted = true;
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.innerHTML = this.t('btn_resend');
            }
            if (statusEl) {
                statusEl.innerHTML = `
                    <div style="background:#ebfbee; border:1.5px solid #38d9a9; border-radius:10px; padding:12px 14px; box-shadow:0 2px 8px rgba(56,217,169,0.15);">
                        <div style="font-size:13px; font-weight:900; color:#0ca678; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                            <span>🎉</span> <strong>${this.t('status_sent_title', { email: email })}</strong>
                        </div>
                        <div style="font-size:12px; color:#212529; line-height:1.6;">
                            ${this.t('status_sent_line1', { code: instantCode })}<br>
                            ${this.t('status_sent_line2')}<br>
                            <div style="margin-top:8px; background:#fff9db; border:1.5px solid #fcc419; border-radius:6px; padding:6px 10px; font-size:11.5px; color:#d9480f; font-weight:800;">
                                ${this.t('status_sent_spam')}
                            </div>
                        </div>
                    </div>
                `;
            }
        };

        const markTimeoutOrError = () => {
            if (isCompleted) return;
            isCompleted = true;
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.innerHTML = this.t('btn_resend');
            }
            if (statusEl) {
                statusEl.innerHTML = `
                    <div style="background:#f8f9fa; border:1.5px solid #ced4da; border-radius:10px; padding:12px 14px; margin-top:6px;">
                        <div style="font-size:13px; font-weight:900; color:#2b8a3e; margin-bottom:4px;">
                            ${this.t('status_sent_line1', { code: instantCode })}
                        </div>
                        <div style="font-size:12px; color:#495057; line-height:1.6;">
                            ${this.t('status_sent_line2')}<br>
                            <span style="display:inline-block; margin-top:4px; font-size:11px; color:#868e96;">
                                ${this.t('step1_spam_notice')}
                            </span>
                        </div>
                    </div>
                `;
            }
        };

        // 6초 타임아웃 타이머 설정
        const timer = setTimeout(markTimeoutOrError, 6000);

        try {
            const res = await fetch(reqUrl);
            const data = await res.json();
            clearTimeout(timer);
            if (data && (data.ok || data.success)) {
                markSuccess(data.emailSent);
            } else {
                markTimeoutOrError();
            }
        } catch(err) {
            // JSONP Fallback
            const cbName = 'email_cb_' + Date.now();
            const s = document.createElement('script');
            window[cbName] = (data) => {
                clearTimeout(timer);
                if (s.parentNode) s.parentNode.removeChild(s);
                delete window[cbName];
                if (data && (data.ok || data.success)) {
                    markSuccess(data.emailSent);
                } else {
                    markTimeoutOrError();
                }
            };
            s.onerror = () => {
                clearTimeout(timer);
                markTimeoutOrError();
            };
            s.src = reqUrl + '&callback=' + cbName;
            document.body.appendChild(s);
        }
    },

    copyMyDeviceCode: function(openKakao = false) {
        const devCode = _getDeviceCode();
        const nameEl = document.getElementById('proRegName');
        const userTxt = nameEl && nameEl.value ? nameEl.value.trim() : '';
        const userPart = userTxt ? (this.t('msg_kakao_user_prefix') + userTxt) : '';
        const copyTxt = openKakao
            ? this.t('msg_kakao_copy_template', { user: userPart, dev: devCode })
            : devCode;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(copyTxt).catch(() => {});
        }
        try {
            const STORAGE_KEY = 'PRO_ADMIN_APP_LIST_V27';
            let list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (!Array.isArray(list)) list = [];
            const nowStr = new Date().toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
            if (!list.some(r => r.dev === devCode)) {
                list.unshift({
                    dev: devCode,
                    name: userTxt || '카톡 신청자',
                    app: 'HEAT',
                    status: 'PENDING',
                    code: '',
                    time: nowStr,
                    ts: Date.now()
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            }
        } catch(e) {}
        if (openKakao) {
            alert(this.t('alert_kakao_copied', { dev: devCode }));
            window.open('https://pf.kakao.com/_hALxeX', '_blank');
        } else {
            alert(this.t('alert_dev_id_copied', { dev: devCode }));
        }
    },

    closeModal: function() {
        this.stopLiveCamera();
        const modal = document.getElementById('subPageModal');
        if (modal) modal.classList.add('hidden');
        this._currentModalType = null;
    },

    showMainView: function() { this.closeModal(); },

    switchToFreeModeForTesting: async function() {
        localStorage.removeItem(this.LICENSE_KEY);
        _proVerifiedState = false;
        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.add('is-free-mode');
        }
        const badge = document.getElementById('proBadge');
        if (badge) {
            badge.innerText = 'Free';
            badge.style.backgroundColor = '';
            badge.style.color = '';
        }
        if (typeof HeaderKit !== 'undefined') {
            HeaderKit.setProStatus(false, 'Free', 'free');
        }
        await this.checkProStatus();
        this.renderLicenseBoxInSettings();
        if (typeof PresetManager !== 'undefined') PresetManager.updateCounts();
        const msgEl = document.getElementById('proAuthMessage');
        if (msgEl) {
            msgEl.style.color = '#e03131';
            msgEl.innerText = '🔄 [테스트 모드] PRO 인증이 해제되어 FREE(무료) 모드로 전환되었습니다.';
        }
        const codeInput = document.getElementById('proRegCode');
        if (codeInput) codeInput.value = '';
        alert('🔄 FREE(무료) 모드로 성공적으로 전환되었습니다.\n프리 버전의 기능 제한 및 블러 처리를 테스트하실 수 있습니다.\n(언제든 정식 리딤 코드를 다시 입력하면 PRO로 복구됩니다.)');
    },

    verifyRedeemCode: async function() {
        const nameInput = document.getElementById('proRegName');
        const codeInput = document.getElementById('proRegCode');
        const msgEl = document.getElementById('proAuthMessage');
        const holderName = (nameInput && nameInput.value ? nameInput.value : "").trim();
        const rawCode = (codeInput ? codeInput.value : "").trim().toUpperCase();
        const devCode = _getDeviceCode();

        // 🧪 [관리자 비공개 테스트] PRO -> FREE 원클릭 전환 비밀 코드 (일반 사용자 비노출)
        if (rawCode === 'FREEADMINTEST' || rawCode === 'FREE-ADMIN-TEST') {
            await this.switchToFreeModeForTesting();
            return;
        }

        if (!holderName) {
            msgEl.style.color = '#e03131';
            msgEl.innerText = this.t('err_reg_name_req', { dev: devCode });
            if (nameInput) nameInput.focus();
            return;
        }

        if (!/^([A-Z0-9]{3,5})-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(rawCode)) {
            msgEl.style.color = '#e03131';
            msgEl.innerText = this.t('err_reg_code_fmt', { dev: devCode });
            return;
        }

        try {
            const detail = await _verifyCodeDetail(rawCode);
            if (detail.ok) {
                localStorage.setItem(this.LICENSE_KEY, JSON.stringify({
                    name: holderName,
                    code: rawCode,
                    device: devCode
                }));
                msgEl.style.color = '#12b886';
                msgEl.innerText = this.t('msg_pro_verified', {
                    holder: holderName ? `${holderName} / ` : '',
                    dev: devCode
                });
                _proVerifiedState = true;
                await this.checkProStatus();
                this.renderLicenseBoxInSettings();
                if(typeof PresetManager !== 'undefined') PresetManager.updateCounts();
                if (navigator.onLine !== false) {
                    this.syncRemoteLicenseStatus();
                }
            } else if (detail.reason === 'APP_MISMATCH') {
                msgEl.style.color = '#e03131';
                msgEl.innerText = this.t('err_app_mismatch', { prefix: detail.prefix || 'UNKNOWN' });
            } else if (detail.reason === 'DEVICE_MISMATCH') {
                msgEl.style.color = '#e03131';
                msgEl.innerText = this.t('err_pro_dev_mismatch', {
                    codeDev: detail.codeDevice,
                    curDev: detail.currentDevice
                });
            } else {
                msgEl.style.color = '#e03131';
                msgEl.innerText = this.t('err_pro_invalid');
            }
        } catch(e) {
            msgEl.style.color = '#e03131';
            msgEl.innerText = this.t('err_pro_exception');
        }
    },

    checkProStatus: async function() {
        const badge = document.getElementById('proBadge');
        this._welderPoolCache = null;
        if (typeof DataStore !== 'undefined') {
            DataStore._wpsCache = null;
            DataStore._welderCache = null;
        }
        try {
            const saved = JSON.parse(localStorage.getItem(this.LICENSE_KEY));
            if (saved && saved.code) {
                const detail = await _verifyCodeDetail(saved.code);
                if (detail.ok) {
                    _proVerifiedState = true;
                    if (typeof document !== 'undefined' && document.body) {
                        document.body.classList.remove('is-free-mode');
                    }
                    if (badge) {
                        badge.innerText = 'Pro';
                        badge.style.backgroundColor = '#12b886';
                        badge.style.color = '#ffffff';
                    }
                    if (typeof HeaderKit !== 'undefined') {
                        HeaderKit.setProStatus(true, 'Pro', 'pro');
                    }
                    if (typeof PresetManager !== 'undefined') PresetManager.updateCounts();
                    this.updateProcessSelectUI();
                    return;
                }
            }
        } catch (e) {}
        _proVerifiedState = false;
        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.add('is-free-mode');
        }
        if (badge) {
            badge.innerText = 'Free';
            badge.style.backgroundColor = '';
            badge.style.color = '';
        }
        if (typeof HeaderKit !== 'undefined') {
            HeaderKit.setProStatus(false, 'Free', 'free');
        }
        if (typeof PresetManager !== 'undefined') PresetManager.updateCounts();
        this.updateProcessSelectUI();
    },

    syncRemoteLicenseStatus: async function() {
        try {
            if (navigator.onLine === false) return;
            const apiUrl = (localStorage.getItem('PRO_ADMIN_GAS_URL') || localStorage.getItem(this.LICENSE_API_URL_KEY) || this.DEFAULT_LICENSE_API_URL || '').trim();
            if (!apiUrl) return;
            const saved = JSON.parse(localStorage.getItem(this.LICENSE_KEY) || 'null');
            if (!saved || !saved.code) return;
            const devCode = _getDeviceCode();
            const url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}action=check&dev=${encodeURIComponent(devCode)}&code=${encodeURIComponent(saved.code)}`;
            const res = await fetch(url, { method: 'GET', cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            if (!data || !data.status) return;

            if (data.status === 'APPROVED' && data.permanentCode) {
                const permDetail = await _verifyCodeDetail(data.permanentCode);
                if (permDetail.ok) {
                    try {
                        const revList = JSON.parse(localStorage.getItem(_REVOKED_KEY) || '[]');
                        const filtered = Array.isArray(revList)
                            ? revList.filter(c => c !== saved.code && c !== data.permanentCode)
                            : [];
                        localStorage.setItem(_REVOKED_KEY, JSON.stringify(filtered));
                    } catch (e) {}
                    localStorage.setItem(this.LICENSE_KEY, JSON.stringify({
                        name: saved.name || devCode,
                        code: data.permanentCode,
                        initialCode: saved.initialCode || saved.code,
                        device: devCode
                    }));
                    await this.checkProStatus();
                    this.renderLicenseBoxInSettings();
                }
            } else if (data.status === 'REVOKED' || data.status === 'EXPIRED') {
                const revList = JSON.parse(localStorage.getItem(_REVOKED_KEY) || '[]');
                if (Array.isArray(revList)) {
                    if (saved.code && !revList.includes(saved.code)) revList.push(saved.code);
                    if (saved.initialCode && !revList.includes(saved.initialCode)) revList.push(saved.initialCode);
                    localStorage.setItem(_REVOKED_KEY, JSON.stringify(revList));
                }
                localStorage.removeItem(this.LICENSE_KEY);
                await this.checkProStatus();
                this.renderLicenseBoxInSettings();
            }
        } catch (e) {}
    },

    renderLicenseBoxInSettings: function() {
        const statusEl = document.getElementById('currentLicenseHolder');
        if (!statusEl) return;
        const devCode = _getDeviceCode();
        const saved = JSON.parse(localStorage.getItem(this.LICENSE_KEY) || 'null');
        if (_proVerifiedState && saved && saved.code) {
            statusEl.style.display = 'block';
            statusEl.style.fontWeight = '800';
            statusEl.style.color = '#12b886';
            statusEl.innerHTML = `
                <div>${this.t('status_pro_active', { dev: devCode, holder: saved.name ? `(${saved.name})` : '' })}</div>
            `;
        } else {
            statusEl.style.display = 'block';
            statusEl.style.color = 'var(--text-muted)';
            statusEl.innerText = this.t('status_free_mode', { dev: devCode });
        }
    },

    updateProcessSelectUI: function() {
        const sel = document.getElementById('selProcess');
        if (!sel) return;
        const curVal = sel.value || 'FCAW';
        const isPro = this.isPro;
        const lockPrefix = isPro ? '' : '🔒 ';

        sel.innerHTML = `
            <optgroup label="${this.t('proc_std_group')}">
                <option value="FCAW">${this.t('proc_fcaw')}</option>
                <option value="GMAW">${this.t('proc_gmaw')}</option>
                <option value="SMAW">${this.t('proc_smaw')}</option>
                <option value="GTAW">${this.t('proc_gtaw')}</option>
                <option value="SAW">${this.t('proc_saw')}</option>
            </optgroup>
            <optgroup label="${lockPrefix}${this.t('proc_arc_group')}">
                <option value="PAW">${lockPrefix}${this.t('proc_paw')}</option>
                <option value="EGW">${lockPrefix}${this.t('proc_egw')}</option>
                <option value="ESW">${lockPrefix}${this.t('proc_esw')}</option>
            </optgroup>
            <optgroup label="${lockPrefix}${this.t('proc_beam_group')}">
                <option value="LBW">${lockPrefix}${this.t('proc_lbw')}</option>
                <option value="HLAW">${lockPrefix}${this.t('proc_hlaw')}</option>
                <option value="EBW">${lockPrefix}${this.t('proc_ebw')}</option>
            </optgroup>
        `;

        if (Array.from(sel.options).some(o => o.value === curVal)) {
            sel.value = curVal;
        } else {
            sel.value = 'FCAW';
        }
    }
    };
    return ctrl;
})();

window.addEventListener('DOMContentLoaded', () => MainController.init());