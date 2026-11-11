/**
 * pages/dashboard.js
 * 1/2단계 UI 및 PRO 권한(10개 vs 300개, 편집/PDF 기능 제한)이 적용된 매니저
 */
const PresetManager = {
    currentImportType: 'wps',
    selectedWpsNo: null,
    tempEditingData: [],
    isWpsListCollapsed: false,

    toggleWpsList: function() {
        this.isWpsListCollapsed = !this.isWpsListCollapsed;
        this.renderWpsStep1();
    },

    // WPS 번호 뒤에 이미 (Pass명)이 붙어있으면 중복 없이 "WPS번호 (Pass)" 형태로 포맷팅
    formatWpsWithPass: function(wpsNo, passName) {
        let cleanWps = String(wpsNo || '').trim();
        const cleanPass = String(passName || '').trim();
        if (cleanPass && cleanWps.endsWith(`(${cleanPass})`)) {
            cleanWps = cleanWps.slice(0, cleanWps.length - (`(${cleanPass})`).length).trim();
        } else {
            cleanWps = cleanWps.replace(/\s*\((?:Root|Fill|Cap|Hot|All|[0-9]+(?:\s*[-~]\s*[0-9A-Za-z]+)?)\)\s*$/i, '').trim();
        }
        if (!cleanWps) return '';
        return cleanPass ? `${cleanWps} (${cleanPass})` : cleanWps;
    },

    // WPS 번호 또는 Pass 문자열에 'sa'/'saw'가 있으면 'SAW', 'fc'/'fcaw'가 있으면 'FCAW'로 상부 Process 자동 변경
    syncProcessFromWpsItem: function(wpsNo, passName, fallbackProcess) {
        if (typeof Calculator !== 'undefined' && typeof Calculator.syncProcessFromWps === 'function') {
            Calculator.syncProcessFromWps(wpsNo, passName, fallbackProcess);
            return;
        }
        const combined = `${passName || ''} ${wpsNo || ''}`;
        let proc = fallbackProcess || '';
        if (/(?:^|[^A-Z])(?:SAW|SA)(?:[^A-Z0-9]|[0-9]|$)/i.test(combined)) proc = 'SAW';
        else if (/(?:^|[^A-Z])(?:FCAW|FC)(?:[^A-Z0-9]|[0-9]|$)/i.test(combined)) proc = 'FCAW';
        if (proc) {
            const sel = document.getElementById('selProcess');
            if (sel && Array.from(sel.options).some(o => o.value === proc)) {
                sel.value = proc;
            }
        }
    },

    t: function(key, params) {
        return (typeof DataStore !== 'undefined' && typeof DataStore.t === 'function')
            ? DataStore.t(key, params)
            : key;
    },

    getMaxCount: function() {
        if (typeof DataStore !== 'undefined' && typeof DataStore.isProUser === 'function') {
            return DataStore.isProUser() ? 300 : 10;
        }
        return (typeof MainController !== 'undefined' && MainController.isPro) ? 300 : 10;
    },

    updateCounts: function() {
        const wpsList = DataStore.getWpsPresets();
        const welderList = DataStore.getWelderPresets();
        const maxCnt = this.getMaxCount();
        const viewTxt = this.t('btn_view_list');
        const wpsLbl = document.getElementById('wpsCountLbl');
        const welderLbl = document.getElementById('welderCountLbl');
        if (wpsLbl) wpsLbl.innerText = `${viewTxt} (${Math.min(wpsList.length, maxCnt)}/${maxCnt})`;
        if (welderLbl) welderLbl.innerText = `${viewTxt} (${Math.min(welderList.length, maxCnt)}/${maxCnt})`;

        const stepBox = document.getElementById('wpsStepContainer');
        if (stepBox && !document.getElementById('wpsPresetView').classList.contains('hidden')) {
            if (this.selectedWpsNo && wpsList.some(item => (item.wpsNo || item.id) === this.selectedWpsNo)) {
                this.renderWpsStep2(this.selectedWpsNo);
            } else {
                this.selectedWpsNo = null;
                this.renderWpsStep1();
            }
        }
    },

    renderWpsStep1: function() {
        this.selectedWpsNo = null;
        const container = document.getElementById('wpsStepContainer');
        if (!container) return;

        const list = DataStore.getWpsPresets();
        if (list.length === 0) {
            container.innerHTML = `<div style="padding:15px; text-align:center; color:var(--text-muted); font-size:13px;">${this.t('msg_no_wps_preset')}</div>`;
            return;
        }
        const curWpsVal = (document.getElementById('inpWpsNo') ? document.getElementById('inpWpsNo').value : '').trim();
        const curMinVal = (document.getElementById('inpWpsMin') ? document.getElementById('inpWpsMin').value : '').trim();
        const curMaxVal = (document.getElementById('inpWpsMax') ? document.getElementById('inpWpsMax').value : '').trim();
        const selectedBanner = curWpsVal
            ? `<div style="padding:8px 10px; margin-bottom:10px; background:#111; color:#fff; border-radius:6px; font-size:12px; font-weight:800; display:flex; justify-content:space-between; align-items:center;">
                   <span>${this.t('lbl_selected')}: ${this.escapeAttr(curWpsVal)}</span>
                   <span style="opacity:0.75; font-family:monospace;">${this.escapeAttr(curMinVal)}~${this.escapeAttr(curMaxVal)} kJ/mm</span>
               </div>`
            : '';

        const uniqueWps = [...new Set(list.map(item => item.wpsNo || item.id).filter(Boolean))];
        const isCollapsed = Boolean(this.isWpsListCollapsed);
        const collapseBtnTxt = isCollapsed ? this.t('btn_expand_list') : this.t('btn_collapse_list');

        let html = `
            ${selectedBanner}
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:700; color:var(--text-muted);">${this.t('step1_wps_select')} (${uniqueWps.length})</span>
                <button type="button" class="wps-toggle-btn" onclick="PresetManager.toggleWpsList()" title="${this.escapeAttr(collapseBtnTxt)}">
                    ${this.escapeAttr(collapseBtnTxt)}
                </button>
            </div>
        `;

        if (isCollapsed) {
            html += `
                <div style="padding:12px 14px; background:var(--bg-soft); border-radius:8px; font-size:12px; font-weight:700; color:var(--text-muted); text-align:center; cursor:pointer; border:1px dashed var(--border-light);" onclick="PresetManager.toggleWpsList()">
                    ${this.t('msg_wps_list_collapsed', { cnt: uniqueWps.length })}
                </div>
            `;
        } else {
            html += `
                <div class="wps-grid-scroll">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            `;
            uniqueWps.forEach(wpsNo => {
                html += `<button type="button" class="wps-chip-btn" data-wps-no="${this.escapeAttr(wpsNo)}" onclick="PresetManager.renderWpsStep2(this.getAttribute('data-wps-no'))">${this.escapeAttr(wpsNo)}</button>`;
            });
            html += `
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    },

    renderWpsStep2: function(wpsNo) {
        this.selectedWpsNo = wpsNo;
        // 1단계에서 WPS 번호만 선택했을 때도 'sa'/'saw' 또는 'fc'/'fcaw'가 포함되어 있으면 상단 Process 즉시 동기화
        this.syncProcessFromWpsItem(wpsNo, '', '');
        if (typeof Calculator !== 'undefined') Calculator.calculate();

        const container = document.getElementById('wpsStepContainer');
        if (!container) return;
        const list = DataStore.getWpsPresets();
        const filtered = list.filter(item => (item.wpsNo || item.id) === wpsNo);

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:700; color:var(--text-muted);">${this.t('step2_pass_select')} (${this.escapeAttr(wpsNo)})</span>
                <button type="button" style="background:none; border:none; color:var(--brand-orange); font-size:12px; font-weight:800; cursor:pointer;" onclick="PresetManager.renderWpsStep1()">${this.t('btn_back')}</button>
            </div>
            <div class="wps-grid-scroll">
                <div style="display:flex; flex-direction:column; gap:8px;">
        `;
        filtered.forEach(item => {
            const globalIdx = list.indexOf(item);
            const passName = this.escapeAttr(item.pass || 'Root');
            const minVal = (Number(item.min) || 0).toFixed(2);
            const maxVal = (Number(item.max) || 0).toFixed(2);
            html += `<button type="button" class="pass-card-btn" onclick="PresetManager.applyWpsStep2Selection(${globalIdx})">${passName} | ${minVal}~${maxVal} kJ/mm</button>`;
        });
        html += `
                </div>
            </div>
        `;
        container.innerHTML = html;
    },

    applyWpsStep2Selection: function(globalIdx) {
        const list = DataStore.getWpsPresets();
        const item = list[globalIdx];
        if (!item) return;

        const wpsNo = item.wpsNo || item.id || '';
        const passName = item.pass || 'Root';
        const wpsEl = document.getElementById('inpWpsNo');
        if (wpsEl) {
            wpsEl.value = this.formatWpsWithPass(wpsNo, passName);
            wpsEl.dataset.baseWpsNo = wpsNo;
        }
        document.getElementById('inpWpsMin').value = (Number(item.min) || 0).toFixed(2);
        document.getElementById('inpWpsMax').value = (Number(item.max) || 0).toFixed(2);
        // 선택된 WPS 번호 및 Pass에 'sa'/'saw' 또는 'fc'/'fcaw'가 있으면 상부 Process 자동 변경
        this.syncProcessFromWpsItem(wpsNo, passName, item.process);
        if (passName) {
            Calculator.state.pass = passName;
            document.querySelectorAll('.pass-btn').forEach(btn => {
                btn.classList.toggle('active', btn.innerText.trim() === passName);
            });
        }
        Calculator.calculate();
        
        // 선택 완료 즉시 2단계 화면 닫고 수동 입력 화면으로 자동 복귀
        Calculator.setWpsMode('manual');
        this.renderWpsStep1();
    },

    escapeAttr: function(val) {
        return String(val == null ? '' : val)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    renderPresetModalHeader: function(type, activeTab, count, maxCount) {
        const prefix = type === 'wps' ? this.t('title_wps_preset') : this.t('title_welder_preset');
        return `
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span>${prefix}</span>
                <div class="mode-pill-group">
                    <button type="button" class="mode-pill ${activeTab === 'view' ? 'active' : ''}" onclick="PresetManager.openViewer('${type}')">${this.t('btn_view_list')}</button>
                    <button type="button" class="mode-pill ${activeTab === 'edit' ? 'active' : ''}" onclick="PresetManager.openEditor('${type}')">${this.t('btn_edit')}</button>
                </div>
                <span style="font-size:12px; font-weight:700; color:var(--text-muted);">(<span id="editCountLbl">${count}</span>/${maxCount})</span>
            </div>
        `;
    },

    openViewer: function(type) {
        this.currentImportType = type;
        if (typeof MainController !== 'undefined') MainController._currentModalType = 'preset_view';
        const list = type === 'wps' ? DataStore.getWpsPresets() : DataStore.getWelderPresets();
        const modal = document.getElementById('subPageModal');
        const title = document.getElementById('subPageTitle');
        const body = document.getElementById('subPageBody');
        if (!modal || !body) return;

        const maxCount = this.getMaxCount();
        title.innerHTML = this.renderPresetModalHeader(type, 'view', Math.min(list.length, maxCount), maxCount);

        let html = `<div style="max-height:60vh; overflow-y:auto;"><table style="width:100%; border-collapse:collapse; font-size:13px;" border="1">`;
        const applyTxt = this.t('btn_apply');
        
        if (type === 'wps') {
            html += `<tr style="background:var(--bg-soft); position:sticky; top:0; z-index:1;"><th style="padding:8px;">${this.t('lbl_wps_no')}</th><th style="padding:8px;">${this.t('lbl_pass_short')}</th><th style="padding:8px;">${this.t('lbl_min')}</th><th style="padding:8px;">${this.t('lbl_max')}</th><th style="padding:8px;">${this.t('th_select')}</th></tr>`;
            if (list.length === 0) {
                html += `<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--text-muted); font-weight:700;">${this.t('msg_empty_wps_viewer')}</td></tr>`;
            } else {
                list.forEach((item, idx) => {
                    html += `<tr>
                        <td style="padding:8px; text-align:center; font-family:monospace;">${this.escapeAttr(item.wpsNo || '-')}</td>
                        <td style="padding:8px; text-align:center;">${this.escapeAttr(item.pass || 'Root')}</td>
                        <td style="padding:8px; text-align:center; font-family:monospace;">${(Number(item.min)||0).toFixed(2)}</td>
                        <td style="padding:8px; text-align:center; font-family:monospace;">${(Number(item.max)||0).toFixed(2)}</td>
                        <td style="padding:8px; text-align:center;"><button class="close-sub-btn" onclick="PresetManager.applyViewerItem('${type}', ${idx})">${applyTxt}</button></td>
                    </tr>`;
                });
            }
        } else {
            html += `<tr style="background:var(--bg-soft); position:sticky; top:0; z-index:1;"><th style="padding:8px;">${this.t('lbl_welder_id')}</th><th style="padding:8px;">${this.t('th_name')}</th><th style="padding:8px;">${this.t('lbl_dept')}</th><th style="padding:8px;">${this.t('th_select')}</th></tr>`;
            if (list.length === 0) {
                html += `<tr><td colspan="4" style="padding:24px; text-align:center; color:var(--text-muted); font-weight:700;">${this.t('msg_empty_welder_viewer')}</td></tr>`;
            } else {
                list.forEach((item, idx) => {
                    html += `<tr>
                        <td style="padding:8px; text-align:center;">${this.escapeAttr(item.id || '-')}</td>
                        <td style="padding:8px; text-align:center;">${this.escapeAttr(item.name || '-')}</td>
                        <td style="padding:8px; text-align:center;">${this.escapeAttr(item.dept || '-')}</td>
                        <td style="padding:8px; text-align:center;"><button class="close-sub-btn" onclick="PresetManager.applyViewerItem('${type}', ${idx})">${applyTxt}</button></td>
                    </tr>`;
                });
            }
        }
        html += `</table></div>`;
        body.innerHTML = html;
        modal.classList.remove('hidden');
    },

    applyViewerItem: function(type, idx) {
        const list = type === 'wps' ? DataStore.getWpsPresets() : DataStore.getWelderPresets();
        const item = list[idx];
        if (!item) return;

        if (type === 'wps') {
            const wpsNo = item.wpsNo || item.id || '';
            const passName = item.pass || 'Root';
            const wpsEl = document.getElementById('inpWpsNo');
            if (wpsEl) {
                wpsEl.value = this.formatWpsWithPass(wpsNo, passName);
                wpsEl.dataset.baseWpsNo = wpsNo;
            }
            document.getElementById('inpWpsMin').value = (Number(item.min) || 0).toFixed(2);
            document.getElementById('inpWpsMax').value = (Number(item.max) || 0).toFixed(2);
            this.syncProcessFromWpsItem(wpsNo, passName, item.process);
            if (passName) {
                Calculator.state.pass = passName;
                document.querySelectorAll('.pass-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.innerText.trim() === passName);
                });
            }
            Calculator.setWpsMode('manual');
        } else {
            document.getElementById('inpWelderId').value = item.id || '';
            document.getElementById('inpWelderName').value = item.name || '';
            document.getElementById('inpWelderDept').value = item.dept || '';
            if (typeof MainController !== 'undefined' && MainController.syncProcessSelectFromDept) {
                MainController.syncProcessSelectFromDept(item.dept || '');
            }
            if (typeof Calculator !== 'undefined') Calculator.setWelderMode('manual');
        }
        MainController.closeModal();
        Calculator.calculate();
    },

    // 프리셋 리스트 편집 모달 ('목록보기' / '편집' 탭 연동)
    openEditor: function(type, initialData = null) {
        if (!MainController.isPro) {
            alert(this.t('alert_pro_edit'));
            MainController.openModal('pages/settings.html');
            return;
        }
        this.currentImportType = type;
        if (typeof MainController !== 'undefined') MainController._currentModalType = 'preset_edit';
        const currentSaved = type === 'wps' ? DataStore.getWpsPresets() : DataStore.getWelderPresets();
        const sourceList = initialData ? initialData : currentSaved;
        this.tempEditingData = sourceList.map(item => ({ ...item }));
        
        const modal = document.getElementById('subPageModal');
        const title = document.getElementById('subPageTitle');
        const body = document.getElementById('subPageBody');
        if (!modal || !body) return;

        const maxCount = this.getMaxCount();
        const savedCount = currentSaved.length;
        const editCount = this.tempEditingData.length;
        const unitTxt = this.t('unit_items');

        title.innerHTML = this.renderPresetModalHeader(type, 'edit', editCount, maxCount);
        
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px; font-size:13px; font-weight:700;">
                <span style="color:var(--text-muted);">${this.t('lbl_saved_cnt')}: <strong style="color:var(--text-primary);">${savedCount}</strong>${unitTxt} | ${this.t('lbl_edit_cnt')}: <strong style="color:var(--brand-orange);" id="editorRowCountInfo">${editCount}</strong>/${maxCount}${unitTxt}</span>
                <div style="display:flex; gap:8px; align-items:center;">
                    <button type="button" style="background:var(--bg-soft); border:1px solid var(--border-light); border-radius:6px; padding:6px 10px; cursor:pointer; font-weight:800; font-size:12px; color:var(--text-primary);" onclick="PresetManager.triggerImport('${type}')">
                        ${this.t('btn_load_txt')}
                    </button>
                    <button type="button" style="background:var(--bg-soft); border:1px solid var(--border-light); border-radius:6px; padding:6px 10px; cursor:pointer; font-weight:800; font-size:12px; color:#dc2626;" onclick="PresetManager.clearAllEditorRows()">
                        ${this.t('btn_clear_all')}
                    </button>
                    <button type="button" style="background-color:var(--brand-orange); color:#fff; border:none; border-radius:6px; padding:6px 12px; font-weight:800; font-size:13px; cursor:pointer;" onclick="PresetManager.addRowToEditor()">
                        ${this.t('btn_add_row')}
                    </button>
                </div>
            </div>

            <div style="border: 2px solid var(--border-strong); border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
                <div id="editorTableScroll" style="max-height:52vh; overflow-y:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left; background:var(--bg-card);">
                        <thead style="position:sticky; top:0; background:var(--bg-soft); z-index:1;">
                            <tr>
                                <th style="padding:10px 6px; border-bottom:2px solid var(--border-strong); width:38px; text-align:center;">#</th>
                                <th style="padding:10px; border-bottom:2px solid var(--border-strong);">${type==='wps'?this.t('lbl_wps_no'):this.t('lbl_welder_id')}</th>
                                <th style="padding:10px; border-bottom:2px solid var(--border-strong);">${type==='wps'?this.t('lbl_pass_short'):this.t('th_name')}</th>
                                <th style="padding:10px; border-bottom:2px solid var(--border-strong);">${type==='wps'?this.t('lbl_min'):this.t('lbl_dept')}</th>
                                ${type==='wps' ? `<th style="padding:10px; border-bottom:2px solid var(--border-strong);">${this.t('lbl_max')}</th>` : ''}
                                <th style="padding:10px; border-bottom:2px solid var(--border-strong); width:92px; text-align:center;">${this.t('th_manage')}</th>
                            </tr>
                        </thead>
                        <tbody id="editorTableBody">
        `;

        if (this.tempEditingData.length === 0) {
            const colSpan = type === 'wps' ? 6 : 5;
            html += `<tr><td colspan="${colSpan}" style="padding:24px; text-align:center; color:var(--text-muted); font-weight:700;">${this.t('msg_empty_editor')}</td></tr>`;
        }

        const tipUp = this.escapeAttr(this.t('tip_move_up'));
        const tipDown = this.escapeAttr(this.t('tip_move_down'));
        const tipDel = this.escapeAttr(this.t('tip_del_row'));

        this.tempEditingData.forEach((item, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === this.tempEditingData.length - 1;
            const actionBtns = `
                <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                    <button type="button" title="${tipUp}" style="background:var(--bg-soft); border:none; border-radius:4px; width:24px; height:24px; font-size:11px; color:var(--text-primary); ${isFirst ? 'opacity:0.35; cursor:default;' : 'cursor:pointer;'}" onclick="PresetManager.moveEditorRow(${idx}, -1)" ${isFirst ? 'disabled' : ''}>▲</button>
                    <button type="button" title="${tipDown}" style="background:var(--bg-soft); border:none; border-radius:4px; width:24px; height:24px; font-size:11px; color:var(--text-primary); ${isLast ? 'opacity:0.35; cursor:default;' : 'cursor:pointer;'}" onclick="PresetManager.moveEditorRow(${idx}, 1)" ${isLast ? 'disabled' : ''}>▼</button>
                    <button type="button" title="${tipDel}" style="background:#fee2e2; border:none; border-radius:4px; width:24px; height:24px; color:#dc2626; font-size:13px; font-weight:800; cursor:pointer;" onclick="PresetManager.removeRow(${idx})">✕</button>
                </div>
            `;
            if (type === 'wps') {
                html += `
                    <tr>
                        <td style="padding:6px; border-bottom:1px solid var(--border-light); text-align:center; font-weight:700; color:var(--text-muted);">${idx + 1}</td>
                        <td style="padding:6px; border-bottom:1px solid var(--border-light);"><input type="text" data-editor-row="${idx}" value="${this.escapeAttr(item.wpsNo || '')}" oninput="PresetManager.updateRowData(${idx}, 'wpsNo', this.value)" style="width:100%; padding:8px; border:1px solid var(--border-light); border-radius:4px; outline:none; font-family:monospace; font-size:13px; background:var(--bg-main); color:var(--text-primary);"></td>
                        <td style="padding:6px; border-bottom:1px solid var(--border-light);"><input type="text" value="${this.escapeAttr(item.pass || 'Root')}" oninput="PresetManager.updateRowData(${idx}, 'pass', this.value)" style="width:100%; padding:8px; border:1px solid var(--border-light); border-radius:4px; outline:none; font-family:monospace; font-size:13px; background:var(--bg-main); color:var(--text-primary);"></td>
                        <td style="padding:6px; border-bottom:1px solid var(--border-light);"><input type="number" step="0.01" value="${(Number(item.min)||0).toFixed(2)}" oninput="PresetManager.updateRowData(${idx}, 'min', this.value)" style="width:100%; padding:8px; border:1px solid var(--border-light); border-radius:4px; outline:none; font-family:monospace; font-size:13px; background:var(--bg-main); color:var(--text-primary);"></td>
                        <td style="padding:6px; border-bottom:1px solid var(--border-light);"><input type="number" step="0.01" value="${(Number(item.max)||0).toFixed(2)}" oninput="PresetManager.updateRowData(${idx}, 'max', this.value)" style="width:100%; padding:8px; border:1px solid var(--border-light); border-radius:4px; outline:none; font-family:monospace; font-size:13px; background:var(--bg-main); color:var(--text-primary);"></td>
                        <td style="padding:6px; border-bottom:1px solid var(--border-light); text-align:center;">${actionBtns}</td>
                    </tr>
                `;
            } else {
                html += `
                    <tr>
                        <td style="padding:6px; border-bottom:1px solid var(--border-light); text-align:center; font-weight:700; color:var(--text-muted);">${idx + 1}</td>
                        <td style="padding:6px; border-bottom:1px solid var(--border-light);"><input type="text" data-editor-row="${idx}" value="${this.escapeAttr(item.id || '')}" oninput="PresetManager.updateRowData(${idx}, 'id', this.value)" style="width:100%; padding:8px; border:1px solid var(--border-light); border-radius:4px; outline:none; font-family:monospace; font-size:13px; background:var(--bg-main); color:var(--text-primary);"></td>
                        <td style="padding:6px; border-bottom:1px solid var(--border-light);"><input type="text" value="${this.escapeAttr(item.name || '')}" oninput="PresetManager.updateRowData(${idx}, 'name', this.value)" style="width:100%; padding:8px; border:1px solid var(--border-light); border-radius:4px; outline:none; font-family:monospace; font-size:13px; background:var(--bg-main); color:var(--text-primary);"></td>
                        <td style="padding:6px; border-bottom:1px solid var(--border-light);"><input type="text" value="${this.escapeAttr(item.dept || '')}" oninput="PresetManager.updateRowData(${idx}, 'dept', this.value)" style="width:100%; padding:8px; border:1px solid var(--border-light); border-radius:4px; outline:none; font-family:monospace; font-size:13px; background:var(--bg-main); color:var(--text-primary);"></td>
                        <td style="padding:6px; border-bottom:1px solid var(--border-light); text-align:center;">${actionBtns}</td>
                    </tr>
                `;
            }
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>

            <div style="display:flex; gap:10px;">
                <button type="button" style="flex:1.2; height:46px; border-radius:8px; border:none; font-size:14px; font-weight:800; background-color:var(--brand-orange); color:#fff; cursor:pointer;" onclick="PresetManager.saveEditorMode('replace')">${this.t('btn_save_replace')}</button>
                <button type="button" style="flex:1; height:46px; border-radius:8px; border:none; font-size:14px; font-weight:800; background-color:#12b886; color:#fff; cursor:pointer;" onclick="PresetManager.saveEditorMode('merge')">${this.t('btn_save_merge')}</button>
                <button type="button" style="flex:0.8; height:46px; border-radius:8px; border:none; font-size:14px; font-weight:800; background-color:#000; color:#fff; cursor:pointer;" onclick="PresetManager.openViewer('${type}')">${this.t('btn_cancel')}</button>
            </div>
        `;

        body.innerHTML = html;
        modal.classList.remove('hidden');
    },

    updateRowData: function(idx, field, val) {
        if (this.tempEditingData[idx]) this.tempEditingData[idx][field] = val;
    },

    addRowToEditor: function() {
        if (this.tempEditingData.length >= this.getMaxCount()) {
            alert(this.t('alert_max_exceeded', { max: this.getMaxCount() }));
            return;
        }
        if (this.currentImportType === 'wps') {
            this.tempEditingData.push({ wpsNo: "YI-WPS-NEW", pass: "Root", min: 1.00, max: 2.00, process: "FCAW" });
        } else {
            this.tempEditingData.push({ id: "NEW-ID", name: this.t('def_new_welder'), dept: this.t('def_new_dept') });
        }
        this.openEditor(this.currentImportType, this.tempEditingData);
        const scrollEl = document.getElementById('editorTableScroll');
        if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
        const lastIdx = this.tempEditingData.length - 1;
        const inputEl = document.querySelector(`input[data-editor-row="${lastIdx}"]`);
        if (inputEl) {
            inputEl.focus();
            inputEl.select();
        }
    },

    moveEditorRow: function(idx, dir) {
        const targetIdx = idx + dir;
        if (targetIdx < 0 || targetIdx >= this.tempEditingData.length) return;
        const temp = this.tempEditingData[idx];
        this.tempEditingData[idx] = this.tempEditingData[targetIdx];
        this.tempEditingData[targetIdx] = temp;
        const scrollEl = document.getElementById('editorTableScroll');
        const prevScroll = scrollEl ? scrollEl.scrollTop : 0;
        this.openEditor(this.currentImportType, this.tempEditingData);
        const newScrollEl = document.getElementById('editorTableScroll');
        if (newScrollEl) newScrollEl.scrollTop = prevScroll;
    },

    removeRow: function(idx) {
        const scrollEl = document.getElementById('editorTableScroll');
        const prevScroll = scrollEl ? scrollEl.scrollTop : 0;
        this.tempEditingData.splice(idx, 1);
        this.openEditor(this.currentImportType, this.tempEditingData);
        const newScrollEl = document.getElementById('editorTableScroll');
        if (newScrollEl) newScrollEl.scrollTop = prevScroll;
    },

    clearAllEditorRows: function() {
        if (this.tempEditingData.length === 0) return;
        if (!confirm(this.t('confirm_clear_editor'))) return;
        this.tempEditingData = [];
        this.openEditor(this.currentImportType, this.tempEditingData);
    },

    saveEditorMode: function(mode) {
        try {
            const type = this.currentImportType;
            const key = type === 'wps' ? 'HI_WPS_PRESETS' : 'HI_WELDER_PRESETS';
            let existing = mode === 'merge' ? (type === 'wps' ? DataStore.getWpsPresets() : DataStore.getWelderPresets()) : [];
            
            const cleanedRows = [];
            if (type === 'wps') {
                this.tempEditingData.forEach(item => {
                    const wpsNo = String(item.wpsNo || '').trim();
                    if (!wpsNo) return;
                    const pass = String(item.pass || 'Root').trim() || 'Root';
                    const min = parseFloat((Number(item.min) || 0).toFixed(2));
                    const max = parseFloat((Number(item.max) || 0).toFixed(2));
                    const process = (typeof Calculator !== 'undefined' && Calculator.inferProcessFromWps)
                        ? Calculator.inferProcessFromWps(wpsNo, pass, item.process || 'FCAW')
                        : (item.process || 'FCAW');
                    cleanedRows.push({ ...item, wpsNo, pass, min, max, process });
                });
            } else {
                this.tempEditingData.forEach(item => {
                    const id = String(item.id || '').trim();
                    const name = String(item.name || '').trim();
                    const dept = String(item.dept || '').trim();
                    if (!id && !name) return;
                    cleanedRows.push({ ...item, id: id || '-', name: name || '-', dept: dept || '-' });
                });
            }

            let finalList = [...existing, ...cleanedRows];
            const maxAllowed = this.getMaxCount();
            
            // 저장 제한 확인
            if (finalList.length > maxAllowed) {
                alert(this.t('alert_save_truncated', { max: maxAllowed }));
                finalList = finalList.slice(0, maxAllowed);
            }

            if (type === 'wps') {
                if (DataStore.setWpsPresets) {
                    DataStore.setWpsPresets(finalList);
                } else {
                    DataStore._wpsCache = finalList.slice(0, maxAllowed);
                    localStorage.setItem('HI_WPS_PRESETS', JSON.stringify(DataStore._wpsCache));
                    localStorage.setItem('HI_WPS_SAMPLE10_V23_ARB', 'true');
                }
            } else {
                if (DataStore.setWelderPresets) {
                    DataStore.setWelderPresets(finalList);
                } else {
                    DataStore._welderCache = finalList.slice(0, maxAllowed);
                    localStorage.setItem('HI_WELDER_PRESETS', JSON.stringify(DataStore._welderCache));
                    localStorage.setItem('HI_WELDER_SAMPLE10_V23_ARB', 'true');
                }
            }
            if (typeof MainController !== 'undefined') {
                MainController._welderPoolCache = null;
                if (typeof MainController.syncOfflineRecords === 'function') {
                    MainController.syncOfflineRecords(false);
                }
                if (typeof MainController.renderHistoryTable === 'function') {
                    MainController.renderHistoryTable();
                }
            }
            this.updateCounts();
            this.openViewer(type);
        } catch (e) {
            alert(this.t('alert_save_error'));
        }
    },

    downloadSample: function(type) {
        let content = "";
        if (type === 'wps') {
            const sampleWps = (DataStore.defaultWpsPresets || []).slice(0, 10);
            content = "WPS번호\t패스\t최소입열량\t최대입열량\t공정\n";
            sampleWps.forEach(item => {
                content += `${item.wpsNo}\t${item.pass || 'Root'}\t${(Number(item.min) || 0).toFixed(2)}\t${(Number(item.max) || 0).toFixed(2)}\t${item.process || 'FCAW'}\n`;
            });
            if (!MainController.isPro || DataStore.getWpsPresets().length === 0) {
                DataStore.setWpsPresets(sampleWps);
                this.updateCounts();
            }
        } else {
            const sampleWelders = (DataStore.defaultWelderPresets || []).slice(0, 10);
            content = "용접사번호\t이름\t소속부서\n";
            sampleWelders.forEach(item => {
                content += `${item.id}\t${item.name}\t${item.dept}\n`;
            });
            if (!MainController.isPro || DataStore.getWelderPresets().length === 0) {
                DataStore.setWelderPresets(sampleWelders);
                if (typeof MainController !== 'undefined') MainController._welderPoolCache = null;
                this.updateCounts();
            }
        }
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${type}_sample.txt`; a.click();
        URL.revokeObjectURL(url);
    },

    exportBackup: function(type) {
        const list = type === 'wps' ? DataStore.getWpsPresets() : DataStore.getWelderPresets();
        if (!list || list.length === 0) {
            alert(this.t('alert_no_backup_data'));
            return;
        }

        // 탭(Tab)으로 분리된 텍스트 형식 구성 (기존 단일 파일 호환)
        let content = "";
        if (type === 'wps') {
            content = "WPS번호\t패스\t최소입열량\t최대입열량\t공정\n";
            list.forEach(item => {
                content += `${item.wpsNo || ''}\t${item.pass || 'Root'}\t${(Number(item.min)||0).toFixed(2)}\t${(Number(item.max)||0).toFixed(2)}\t${item.process || 'FCAW'}\n`;
            });
        } else {
            content = "용접사번호\t이름\t소속부서\n";
            list.forEach(item => {
                content += `${item.id || ''}\t${item.name || ''}\t${item.dept || ''}\n`;
            });
        }

        // 날짜 생성 (yymmdd 형식)
        const d = new Date();
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yy}${mm}${dd}`;

        // 당일 중복 백업 시 순번(-n) 부여를 위한 로컬스토리지 카운터 관리
        const countKey = `HI_BACKUP_SEQ_${type}_${dateStr}`;
        let seq = parseInt(localStorage.getItem(countKey) || '0', 10) + 1;
        localStorage.setItem(countKey, seq);

        // 파일 이름 지정 (예: welder_list_backup_260320-1.txt)
        const prefix = type === 'wps' ? 'wps_list_backup' : 'welder_list_backup';
        const filename = `${prefix}_${dateStr}-${seq}.txt`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = filename; 
        a.click();
        URL.revokeObjectURL(url);
    },

    // ─────────────────────────────────────────────────────────
    // 파일 및 PDF 임포트시 PRO 제약사항(제한 개수 및 잠금)
    // ─────────────────────────────────────────────────────────
    triggerImport: function(type) { 
        this.currentImportType = type; 
        document.getElementById('hiddenFileInput').click(); 
    },

    handleFileImport: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        const type = this.currentImportType;
        
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                let parsedData = [];
                if (file.name.endsWith('.json')) {
                    parsedData = JSON.parse(text);
                } else {
                    const lines = text.split(/\r?\n/);
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        if (i === 0 && (line.includes('WPS') || line.includes('용접사') || line.includes('최소'))) continue;
                        
                        const cols = line.split(/[\t,|]+/).map(s => s.trim()).filter(Boolean);
                        
                        if (type === 'wps' && cols.length >= 4) {
                            const wpsNo = cols[0];
                            const pass = cols[1] || 'Root';
                            const explicitProc = cols[4] || '';
                            const inferredProc = (typeof Calculator !== 'undefined' && Calculator.inferProcessFromWps)
                                ? Calculator.inferProcessFromWps(wpsNo, pass, explicitProc || 'FCAW')
                                : (explicitProc || 'FCAW');
                            parsedData.push({
                                wpsNo: wpsNo, pass: pass,
                                min: parseFloat((parseFloat(cols[2]) || 0).toFixed(2)),
                                max: parseFloat((parseFloat(cols[3]) || 2.5).toFixed(2)),
                                process: inferredProc
                            });
                        } else if (type === 'wps' && cols.length >= 3) {
                            const wpsNo = cols[0];
                            const pass = 'Root';
                            const inferredProc = (typeof Calculator !== 'undefined' && Calculator.inferProcessFromWps)
                                ? Calculator.inferProcessFromWps(wpsNo, pass, 'FCAW')
                                : 'FCAW';
                            parsedData.push({
                                wpsNo: wpsNo, pass: pass,
                                min: parseFloat((parseFloat(cols[1]) || 0).toFixed(2)),
                                max: parseFloat((parseFloat(cols[2]) || 2.5).toFixed(2)),
                                process: inferredProc
                            });
                        } else if (type === 'welder' && cols.length >= 3) {
                            parsedData.push({ id: cols[0], name: cols[1], dept: cols[2] });
                        }
                    }
                }

                if (parsedData.length > 0) {
                    const maxCnt = PresetManager.getMaxCount();
                    if (!MainController.isPro && parsedData.length > maxCnt) {
                        alert(PresetManager.t('alert_pro_upload_limit', { count: parsedData.length }));
                        event.target.value = '';
                        MainController.openModal('pages/settings.html');
                        return;
                    }
                    if (parsedData.length > maxCnt) {
                        alert(PresetManager.t('alert_import_truncated', { max: maxCnt }));
                        parsedData = parsedData.slice(0, maxCnt);
                    }
                    if (!MainController.isPro) {
                        if (type === 'wps' && DataStore.setWpsPresets) {
                            DataStore.setWpsPresets(parsedData);
                        } else if (type !== 'wps' && DataStore.setWelderPresets) {
                            DataStore.setWelderPresets(parsedData);
                        }
                        if (typeof MainController !== 'undefined') {
                            MainController._welderPoolCache = null;
                            if (typeof MainController.syncOfflineRecords === 'function') {
                                MainController.syncOfflineRecords(false);
                            }
                            if (typeof MainController.renderHistoryTable === 'function') {
                                MainController.renderHistoryTable();
                            }
                        }
                        PresetManager.updateCounts();
                        PresetManager.openViewer(type);
                    } else {
                        PresetManager.openEditor(type, parsedData);
                    }
                } else {
                    alert(PresetManager.t('alert_import_no_data'));
                }
            } catch (err) {
                console.error("File Import Error:", err);
                alert(PresetManager.t('alert_import_error'));
            }
            event.target.value = '';
        };
        reader.readAsText(file, 'utf-8');
    },

    _pdfLibPromise: null,
    ensurePdfJsLoaded: function() {
        if (typeof window.pdfjsLib !== 'undefined') return Promise.resolve(window.pdfjsLib);
        if (this._pdfLibPromise) return this._pdfLibPromise;
        this._pdfLibPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.async = true;
            script.onload = () => {
                if (window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    resolve(window.pdfjsLib);
                } else {
                    this._pdfLibPromise = null;
                    reject(new Error('pdfjsLib load failed'));
                }
            };
            script.onerror = (err) => {
                this._pdfLibPromise = null;
                reject(err);
            };
            document.head.appendChild(script);
        });
        return this._pdfLibPromise;
    },

    triggerPdfImport: function(type) {
        if (!MainController.isPro) {
            alert(this.t('alert_pro_pdf'));
            MainController.openModal('pages/settings.html');
            return;
        }
        this.currentImportType = type; 
        this.ensurePdfJsLoaded().catch(() => {});
        document.getElementById('hiddenPdfInput').click(); 
    },

    handlePdfImport: async function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const type = this.currentImportType;
        try {
            const pdfjs = await this.ensurePdfJsLoaded();
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument(new Uint8Array(arrayBuffer));
            const pdf = await loadingTask.promise;
            
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                const items = textContent.items;
                items.sort((a, b) => {
                    if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
                        return b.transform[5] - a.transform[5];
                    }
                    return a.transform[4] - b.transform[4];
                });
                
                let lastY = -1;
                items.forEach(item => {
                    if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 5) {
                        fullText += '\n';
                    }
                    fullText += item.str + ' ';
                    lastY = item.transform[5];
                });
                fullText += '\n';
            }
            
            if (fullText.trim() === '') {
                throw new Error("Scanned Document");
            }

            let parsedData = [];
            
            if (type === 'wps') {
                let currentWpsNo = 'WPS-EXTRACTED';
                const lines = fullText.split(/\r?\n/);
                
                lines.forEach(line => {
                    if (!line.trim()) return;
                    const wpsRegex = /(?:WPS\s*No\.?\s*[:\-]?\s*)?([A-Z0-9]+-WPS-[A-Z0-9\-]+(?:\s*\([A-Z0-9,\/\s]+\))?|WPS-[A-Z0-9\-]+|W\d{2,}-[\w\-\/]+)/i;
                    const wpsMatch = line.match(wpsRegex);
                    if (wpsMatch && wpsMatch[1]) currentWpsNo = wpsMatch[1].trim();

                    if (line.match(/(?:page|date|rev|revision|scale|drawn)/i)) return;

                    const nums = line.match(/\b\d+(?:\.\d+)?\b/g);
                    if (nums) {
                        const hiNums = nums.map(Number).filter(n => n > 0 && n <= 30);
                        if (hiNums.length >= 2) {
                            const minVal = hiNums[hiNums.length - 2];
                            const maxVal = hiNums[hiNums.length - 1];
                            const passMatch = line.match(/\b(Root|Fill|Cap)\b/i);
                            const procMatch = line.match(/\b(FCAW|SAW|GTAW|GMAW|SMAW)\b/i);
                            const currentPass = passMatch ? passMatch[0].trim() : 'Root';
                            const lastEntry = parsedData[parsedData.length - 1];
                            
                            if (!lastEntry || lastEntry.wpsNo !== currentWpsNo || lastEntry.pass !== currentPass || lastEntry.min !== parseFloat(minVal.toFixed(2))) {
                                const explicitProc = procMatch ? procMatch[0].toUpperCase() : '';
                                const inferredProc = (typeof Calculator !== 'undefined' && Calculator.inferProcessFromWps)
                                    ? Calculator.inferProcessFromWps(currentWpsNo, currentPass, explicitProc || 'FCAW')
                                    : (explicitProc || 'FCAW');
                                parsedData.push({
                                    wpsNo: currentWpsNo, pass: currentPass,
                                    min: parseFloat(minVal.toFixed(2)), max: parseFloat(maxVal.toFixed(2)),
                                    process: inferredProc
                                });
                            }
                        }
                    }
                });
            } else {
                let currentDept = '소속미상';
                const lines = fullText.split(/\r?\n/);
                lines.forEach(line => {
                    const deptMatch = line.match(/\d{3}\([A-Z]+\)\s[A-Za-z]+/);
                    if (deptMatch) currentDept = deptMatch[0].trim();
                    const idMatch = line.match(/[A-Z]+-\w+-\d+/i);
                    if (idMatch) {
                        const nameMatch = line.replace(idMatch[0], '').match(/[가-힣]{2,4}/);
                        parsedData.push({
                            id: idMatch[0], name: nameMatch ? nameMatch[0] : '추출됨', dept: currentDept
                        });
                    }
                });
            }

            if (parsedData.length === 0) {
                 alert(this.t('alert_pdf_no_data'));
                 event.target.value = '';
                 return;
            }

            this.openEditor(type, parsedData);

        } catch (e) {
            alert(this.t('alert_pdf_error'));
        }
        event.target.value = '';
    }
};
