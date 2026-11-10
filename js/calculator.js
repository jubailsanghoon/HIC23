/**
 * js/calculator.js
 * 실시간 입열량(Heat Input) 연산, 스테퍼 증감, 분:초 양방향 동기화
 */
const Calculator = {
    state: { standard: 'ISO', wpsMode: 'manual', welderMode: 'manual', pass: 'Root', lastResult: 1.440, lastWpsInput: '' },

    setStandard: function(std) {
        this.state.standard = std;
        document.getElementById('btnStdAWS').classList.toggle('active', std === 'AWS');
        document.getElementById('btnStdISO').classList.toggle('active', std === 'ISO');
        this.calculate();
    },

    setWpsMode: function(mode) {
        this.state.wpsMode = mode;
        document.getElementById('btnWpsManual').classList.toggle('active', mode === 'manual');
        document.getElementById('btnWpsPreset').classList.toggle('active', mode === 'preset');
        const manualView = document.getElementById('wpsManualView');
        const presetView = document.getElementById('wpsPresetView');
        if (mode === 'preset') {
            manualView.classList.add('hidden');
            presetView.classList.remove('hidden');
            PresetManager.renderWpsStep1();
        } else {
            manualView.classList.remove('hidden');
            presetView.classList.add('hidden');
        }
        if (typeof MainController !== 'undefined' && MainController.saveLastWorkState) {
            MainController.saveLastWorkState();
        }
    },

    setWelderMode: function(mode) {
        this.state.welderMode = mode;
        document.getElementById('btnWelderManual').classList.toggle('active', mode === 'manual');
        document.getElementById('btnWelderPreset').classList.toggle('active', mode === 'preset');
        const presetView = document.getElementById('welderPresetView');
        if (mode === 'preset') {
            presetView.classList.remove('hidden');
            PresetManager.updateCounts();
        } else {
            presetView.classList.add('hidden');
        }
        if (typeof MainController !== 'undefined' && MainController.saveLastWorkState) {
            MainController.saveLastWorkState();
        }
    },

    // WPS 번호 및 Pass 문자열에서 'SA'/'SAW' -> 'SAW', 'FC'/'FCAW' -> 'FCAW' 자동 판별 및 상단 Process 동기화
    inferProcessFromWps: function(wpsNo, passName, fallbackProc) {
        const pStr = String(passName || '').toUpperCase();
        const wStr = String(wpsNo || '').toUpperCase();
        const hasToken = (str, tokenRegex) => tokenRegex.test(str);

        const saRegex = /(?:^|[^A-Z])(?:SAW|SA)(?:[^A-Z]|$)/i;
        const fcRegex = /(?:^|[^A-Z])(?:FCAW|FC)(?:[^A-Z]|$)/i;

        // 1순위: Pass명에 명시된 공정 (예: Root(FC), Fill/Cap(SA))
        if (hasToken(pStr, saRegex)) return 'SAW';
        if (hasToken(pStr, fcRegex)) return 'FCAW';

        // 2순위: WPS 번호에 포함된 공정 약어 (예: YI-W46-SA-003, W46-FC-001-1G/3G)
        if (hasToken(wStr, saRegex)) return 'SAW';
        if (hasToken(wStr, fcRegex)) return 'FCAW';

        // 전체 문자열에서 부분 포함 여부 보조 확인 (예: SAW121, FCAW136 등 숫자와 붙어있는 경우)
        const combined = `${pStr} ${wStr}`;
        if (/SAW|(?:^|[^A-Z])SA(?=[0-9]|$)/i.test(combined)) return 'SAW';
        if (/FCAW|(?:^|[^A-Z])FC(?=[0-9]|$)/i.test(combined)) return 'FCAW';

        return fallbackProc || '';
    },

    syncProcessFromWps: function(wpsNo, passName, fallbackProc) {
        const detected = this.inferProcessFromWps(wpsNo, passName, fallbackProc);
        if (!detected) return;
        const sel = document.getElementById('selProcess');
        if (sel && Array.from(sel.options).some(o => o.value === detected)) {
            sel.value = detected;
        }
    },

    setPass: function(passName, btnEl) {
        this.state.pass = passName;
        document.querySelectorAll('.pass-btn').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');

        // WPS 번호 입력란에 이미 WPS 번호가 있는 경우 WPS 번호에 이어 Pass 정보도 함께 갱신하여 표시
        const wpsEl = document.getElementById('inpWpsNo');
        if (wpsEl && wpsEl.value.trim()) {
            let baseWps = wpsEl.value.trim();
            if (wpsEl.dataset && wpsEl.dataset.baseWpsNo && baseWps.startsWith(wpsEl.dataset.baseWpsNo)) {
                baseWps = wpsEl.dataset.baseWpsNo;
            } else {
                baseWps = baseWps.replace(/\s*\((?:Root|Fill|Cap|Hot|All|[^()]*?(?:\([^()]*\))?)\)\s*$/i, '').trim();
            }
            if (baseWps) {
                wpsEl.value = `${baseWps} (${passName})`;
                this.state.lastWpsInput = wpsEl.value;
                let matchedPreset = null;
                if (typeof DataStore !== 'undefined' && DataStore.getWpsPresets) {
                    matchedPreset = DataStore.getWpsPresets().find(
                        item => (item.wpsNo || item.id) === baseWps && String(item.pass || '').toLowerCase() === String(passName).toLowerCase()
                    );
                    if (matchedPreset) {
                        document.getElementById('inpWpsMin').value = (Number(matchedPreset.min) || 0).toFixed(2);
                        document.getElementById('inpWpsMax').value = (Number(matchedPreset.max) || 0).toFixed(2);
                    }
                }
                this.syncProcessFromWps(baseWps, passName, matchedPreset ? matchedPreset.process : '');
                this.calculate();
            }
        }
    },

    stepValue: function(inputId, delta) {
        const el = document.getElementById(inputId);
        if (!el) return;
        let current = parseFloat(el.value) || 0;
        let next = Math.max(0, current + delta);
        const decimals = (Math.abs(delta) < 0.1) ? 2 : 1;
        el.value = next.toFixed(decimals);
        this.calculate();
    },

    syncFromTotalSec: function() {
        let totalSec = parseFloat(document.getElementById('inpTimeSecTotal').value) || 0;
        if (totalSec < 0) totalSec = 0;
        const mins = Math.floor(totalSec / 60);
        const secs = +(totalSec % 60).toFixed(1);
        document.getElementById('inpTimeMin').value = mins;
        document.getElementById('inpTimeSecPart').value = secs.toFixed(1);
        this.calculate();
    },

    syncFromMinSec: function() {
        const mins = parseInt(document.getElementById('inpTimeMin').value, 10) || 0;
        const secs = parseFloat(document.getElementById('inpTimeSecPart').value) || 0;
        const total = Math.max(0, mins * 60 + secs);
        document.getElementById('inpTimeSecTotal').value = total.toFixed(1);
        this.calculate();
    },

    stepTotalSec: function(delta) {
        const el = document.getElementById('inpTimeSecTotal');
        let val = Math.max(0.5, (parseFloat(el.value) || 0) + delta);
        el.value = val.toFixed(1);
        this.syncFromTotalSec();
    },

    stepMinSec: function(part, delta) {
        if (part === 'min') {
            const el = document.getElementById('inpTimeMin');
            el.value = Math.max(0, (parseInt(el.value, 10) || 0) + delta);
        } else {
            const el = document.getElementById('inpTimeSecPart');
            el.value = Math.max(0, (parseFloat(el.value) || 0) + delta).toFixed(1);
        }
        this.syncFromMinSec();
    },

    calculate: function() {
        const wpsEl = document.getElementById('inpWpsNo');
        const currentWpsVal = wpsEl ? wpsEl.value.trim() : '';
        if (currentWpsVal !== this.state.lastWpsInput) {
            this.state.lastWpsInput = currentWpsVal;
            if (currentWpsVal) {
                this.syncProcessFromWps(currentWpsVal, this.state.pass, '');
            }
        }

        const std = this.state.standard;
        const proc = document.getElementById('selProcess').value;
        const k = (DataStore.kFactors[std] && DataStore.kFactors[std][proc]) || 1.0;
        const V = parseFloat(document.getElementById('inpVoltage').value) || 0;
        const A = parseFloat(document.getElementById('inpAmperage').value) || 0;
        const L = parseFloat(document.getElementById('inpLength').value) || 0;
        const T = parseFloat(document.getElementById('inpTimeSecTotal').value) || 0;
        const minWps = parseFloat(document.getElementById('inpWpsMin').value) || 0;
        const maxWps = parseFloat(document.getElementById('inpWpsMax').value) || 999;
        
        let heatInput = 0;
        if (L > 0 && T > 0) heatInput = (k * V * A * T) / (L * 1000);
        this.state.lastResult = heatInput;
        
        const outEl = document.getElementById('outHeatInput');
        if (outEl) outEl.innerText = heatInput.toFixed(3);
        
        const banner = document.getElementById('resultBanner');
        if (banner) {
            const isPass = (heatInput >= minWps && heatInput <= maxWps && heatInput > 0);
            banner.classList.toggle('pass', isPass);
            banner.classList.toggle('fail', !isPass);
        }
        if (typeof MainController !== 'undefined' && MainController.saveLastWorkState) {
            MainController.saveLastWorkState();
        }
    }
};
