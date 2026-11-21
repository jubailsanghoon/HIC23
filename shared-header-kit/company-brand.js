/**
 * shared-header-kit/company-brand.js
 * 공용 회사명 & 회사 로고 저장/모달/보고서 헤더 모듈 (5개국어 지원)
 */
(function (root) {
    'use strict';

    const BRAND_KEY = 'ISKOREA_COMPANY_BRAND_V1';

    const I18N_MAP = {
        ko: {
            btn: '🏢 회사 로고',
            title: '보고서 회사명 & 로고 설정',
            desc: '등록한 회사명과 로고는 PDF 및 Excel 보고서 상단에 자동 배치됩니다.',
            nameLbl: '회사 / 조직명 (Organization)',
            logoLbl: '회사 로고 이미지 (PNG / JPG / SVG)',
            pickBtn: '🖼️ 로고 첨부',
            noFile: '선택된 파일 없음',
            clearBtn: '로고 제거',
            none: '등록된 로고가 없습니다.',
            close: '닫기',
            save: '저장',
            saved: '회사명 및 로고 설정이 저장되었습니다.'
        },
        en: {
            btn: '🏢 Company Logo',
            title: 'Report Company Name & Logo',
            desc: 'Your company name and logo are automatically placed on PDF & Excel reports.',
            nameLbl: 'Company / Organization Name',
            logoLbl: 'Company Logo Image (PNG / JPG / SVG)',
            pickBtn: '🖼️ Upload Logo',
            noFile: 'No file chosen',
            clearBtn: 'Remove Logo',
            none: 'No logo uploaded.',
            close: 'Close',
            save: 'Save',
            saved: 'Company name and logo saved.'
        },
        zh: {
            btn: '🏢 公司徽标',
            title: '报告公司名称及徽标设置',
            desc: '设置后的公司名称与徽标将自动显示在 PDF 与 Excel 报告顶部。',
            nameLbl: '公司 / 组织名称',
            logoLbl: '公司徽标图片 (PNG / JPG / SVG)',
            pickBtn: '🖼️ 上传徽标',
            noFile: '未选择文件',
            clearBtn: '清除徽标',
            none: '尚未上传徽标。',
            close: '关闭',
            save: '保存',
            saved: '公司名称与徽标设置已保存。'
        },
        ja: {
            btn: '🏢 会社ロゴ',
            title: '報告書 会社名＆ロゴ設定',
            desc: '登録した会社名とロゴは PDF・Excel 報告書の上部に自動配置されます。',
            nameLbl: '会社名 / 組織名',
            logoLbl: '会社ロゴ画像 (PNG / JPG / SVG)',
            pickBtn: '🖼️ ロゴ添付',
            noFile: 'ファイル未選択',
            clearBtn: 'ロゴ削除',
            none: '登録されたロゴはありません。',
            close: '閉じる',
            save: '保存',
            saved: '会社名とロゴ設定を保存しました。'
        },
        es: {
            btn: '🏢 Logo Empresa',
            title: 'Nombre de Empresa y Logo para Reportes',
            desc: 'El nombre y logo se colocarán automáticamente en reportes PDF y Excel.',
            nameLbl: 'Nombre de Empresa / Organización',
            logoLbl: 'Imagen de Logo (PNG / JPG / SVG)',
            pickBtn: '🖼️ Subir Logo',
            noFile: 'Ningún archivo seleccionado',
            clearBtn: 'Quitar Logo',
            none: 'No hay logo registrado.',
            close: 'Cerrar',
            save: 'Guardar',
            saved: 'Nombre de empresa y logo guardados.'
        }
    };

    function get() {
        try {
            const raw = JSON.parse(localStorage.getItem(BRAND_KEY) || 'null');
            if (raw && typeof raw === 'object') {
                return { companyName: raw.companyName || '', companyLogo: raw.companyLogo || '' };
            }
        } catch (e) {}
        return { companyName: '', companyLogo: '' };
    }

    function set(companyName, companyLogo) {
        const cur = get();
        const next = {
            companyName: typeof companyName === 'string' ? companyName.trim() : cur.companyName,
            companyLogo: typeof companyLogo === 'string' ? companyLogo : cur.companyLogo
        };
        try { localStorage.setItem(BRAND_KEY, JSON.stringify(next)); } catch (e) {}
        return next;
    }

    function getDict(lang) {
        return I18N_MAP[lang] || I18N_MAP.ko;
    }

    function btnLabel(lang) {
        return getDict(lang).btn;
    }

    function readLogo(file, cb) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const maxSide = 240;
                let w = img.width, h = img.height;
                if (w > maxSide || h > maxSide) {
                    const sc = Math.min(maxSide / w, maxSide / h);
                    w = Math.round(w * sc);
                    h = Math.round(h * sc);
                }
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                c.getContext('2d').drawImage(img, 0, 0, w, h);
                cb(c.toDataURL('image/png'));
            };
            img.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
    }

    function openModal(lang, onSave) {
        const d = getDict(lang);
        const cur = get();
        let tempLogo = cur.companyLogo || '';

        let overlay = document.getElementById('cbBrandOverlay');
        if (overlay) overlay.remove();
        overlay = document.createElement('div');
        overlay.id = 'cbBrandOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
        overlay.innerHTML = `
            <div style="width:100%;max-width:480px;background:#fff;color:#111;border-radius:14px;padding:18px 20px;box-shadow:0 16px 40px rgba(0,0,0,0.28);font-family:'Malgun Gothic',sans-serif;">
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1e3a8a;padding-bottom:10px;margin-bottom:12px;">
                    <h3 style="margin:0;font-size:15px;font-weight:900;">${d.title}</h3>
                    <button type="button" id="cbBtnX" style="width:28px;height:28px;border:none;border-radius:7px;background:#1e3a8a;color:#fff;font-weight:900;cursor:pointer;">✕</button>
                </div>
                <p style="margin:0 0 12px 0;font-size:12px;color:#555;">${d.desc}</p>
                <label style="display:block;font-size:11.5px;font-weight:800;color:#444;margin-bottom:4px;">${d.nameLbl}</label>
                <input type="text" id="cbCompName" value="${(cur.companyName || '').replace(/"/g, '&quot;')}" placeholder="ISKOREA" style="width:100%;padding:8px 10px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;font-weight:700;box-sizing:border-box;margin-bottom:12px;" />
                <label style="display:block;font-size:11.5px;font-weight:800;color:#444;margin-bottom:4px;">${d.logoLbl}</label>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <label style="padding:7px 12px;border-radius:8px;border:1.5px solid #cbd5e1;background:#f1f5f9;font-size:12px;font-weight:800;cursor:pointer;">${d.pickBtn}<input type="file" id="cbLogoFile" accept="image/*" style="display:none;" /></label>
                    <span id="cbFileName" style="flex:1;font-size:11.5px;color:#64748b;">${d.noFile}</span>
                    <button type="button" id="cbClearBtn" style="padding:7px 10px;border-radius:8px;border:1.5px solid #cbd5e1;background:#f1f5f9;font-size:12px;font-weight:800;cursor:pointer;">${d.clearBtn}</button>
                </div>
                <div id="cbPreview" style="margin-top:12px;padding:12px;border-radius:8px;background:#f8fafc;border:1px dashed #cbd5e1;text-align:center;">
                    ${tempLogo ? `<img src="${tempLogo}" style="max-height:54px;max-width:200px;object-fit:contain;" />` : `<span style="font-size:12px;color:#64748b;">${d.none}</span>`}
                </div>
                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
                    <button type="button" id="cbCloseBtn" style="padding:8px 14px;border:none;border-radius:8px;background:#1e3a8a;color:#fff;font-weight:800;cursor:pointer;">${d.close}</button>
                    <button type="button" id="cbSaveBtn" style="padding:8px 16px;border:none;border-radius:8px;background:#ff7f00;color:#fff;font-weight:800;cursor:pointer;">${d.save}</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
        document.getElementById('cbBtnX').onclick = close;
        document.getElementById('cbCloseBtn').onclick = close;
        document.getElementById('cbLogoFile').onchange = (e) => {
            const f = e.target.files && e.target.files[0];
            if (f) document.getElementById('cbFileName').textContent = f.name;
            readLogo(f, (dataUrl) => {
                tempLogo = dataUrl;
                document.getElementById('cbPreview').innerHTML = `<img src="${dataUrl}" style="max-height:54px;max-width:200px;object-fit:contain;" />`;
            });
        };
        document.getElementById('cbClearBtn').onclick = () => {
            tempLogo = '';
            document.getElementById('cbFileName').textContent = d.noFile;
            document.getElementById('cbPreview').innerHTML = `<span style="font-size:12px;color:#64748b;">${d.none}</span>`;
        };
        document.getElementById('cbSaveBtn').onclick = () => {
            const saved = set(document.getElementById('cbCompName').value, tempLogo);
            close();
            if (typeof onSave === 'function') onSave(saved);
            alert(d.saved);
        };
    }

    function headerHtml(defaultTitle) {
        const b = get();
        if (!b.companyLogo && !b.companyName) return '';
        const esc = (s) => String(s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
        return `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                ${b.companyLogo ? `<img src="${b.companyLogo}" alt="Logo" style="height:36px;max-width:130px;object-fit:contain;" />` : ''}
                ${b.companyName ? `<span style="font-size:15px;font-weight:900;color:#111;">${esc(b.companyName)}</span>` : (defaultTitle ? `<span style="font-size:14px;font-weight:800;color:#333;">${esc(defaultTitle)}</span>` : '')}
            </div>
        `;
    }

    root.CompanyBrand = { get, set, getDict, btnLabel, openModal, headerHtml };
})(typeof window !== 'undefined' ? window : globalThis);
