/**
 * js/help_manual.js
 * 5개 국어(KO, EN, ES, ZH, JA) 국제 규격 매뉴얼 및 입열량 가이드 전용 모듈 (v2.3)
 */
const HelpManual = {
    dict: {
        ko: {
            modal_title: "📘 국제 규격 매뉴얼 & 입열량 가이드 (v2.3)",
            title_1: "1. 규격 및 공정 계수 · 입열량 계산 공식",
            formula: "HI = (k × V × A × T) / (L × 1000) (결과 단위: kJ/mm)",
            vars: "• <strong>k</strong>: 규격·공정 열효율 계수 | <strong>V</strong>: 전압 (V) | <strong>A</strong>: 전류 (A) | <strong>T</strong>: 용접 시간 (초) | <strong>L</strong>: 용접 길이 (mm)",
            th_std: "규격",
            th_proc: "용접 공정",
            th_k: "k 계수 (열효율)",
            aws_desc: "전체 공정 (FCAW, GMAW, SMAW, GTAW, SAW 공통)",
            iso_saw: "SAW (서브머지드 아크 용접 - 121)",
            iso_tig: "GTAW (TIG - 141) · PAW (플라즈마)",
            iso_etc: "기타 공정 (SMAW 111 · GMAW 135 · FCAW 136/138)",
            title_2: "2. WPS 및 용접사 프리셋 · 스캔 · 라벨 인쇄",
            p_free_ver: "• <strong>Free 버전</strong>: WPS·용접사 DATA 프리셋 각 최대 10개 저장 (.txt 샘플 다운로드 및 10개 이하 업로드 허용), PDF 추출·프리셋 편집·헬멧 스캔·라벨 인쇄 잠금(🔒)",
            p_pro_ver: "• <strong>PRO 버전</strong>: WPS·용접사 DATA 최대 300개 저장, PDF 자동 추출, 프리셋 편집(대체/병합/유지), 📷 용접사 헬멧 스캔(QR·바코드·일반스티커 자동입력) 및 🏷️ 전체 라벨 일괄 인쇄 잠금 해제",
            p_manual: "• <strong>수동 모드</strong>: WPS 번호 및 최소/최대 입열량, 용접사 정보를 직접 입력하여 즉시 계산합니다.",
            p_preset: "• <strong>프리셋 모드 (1·2단계 선택)</strong>: 저장된 WPS 번호(1단계) 선택 후 패스별 입열량 범위(2단계)를 원클릭으로 적용합니다. (Free: 각 최대 10개 / PRO: 각 최대 300개)",
            p_txt: "• <strong>TXT 샘플 / 업로드 / 백업</strong>: 탭(Tab)으로 구분된 샘플 .txt 파일을 내려받아 편집 후 일괄 업로드하거나 TXT 파일로 백업할 수 있습니다.",
            p_pdf: "• <strong>PDF 자동 추출 및 대화형 편집 (PRO)</strong>: [PDF] 버튼으로 WPS 문서나 용접사 자격일람표 PDF에서 표 데이터를 자동 추출하고, 팝업 편집창에서 값을 확인·수정한 뒤 기존 목록에 대체 또는 병합합니다.",
            p_scan: "• <strong>용접사 헬멧 스캔 - QR·바코드·문자 OCR (PRO)</strong>: [📷 스캔] 버튼으로 헬멧·명찰의 QR/바코드나 일반 스티커(한글 이름, 사번, SAW 121 등 공정명)를 카메라 촬영 또는 이미지 선택으로 자동 인식하여 입력합니다.",
            p_label: "• <strong>헬멧 라벨 일괄 생성 및 인쇄 (PRO)</strong>: [🏷️ 라벨인쇄] 버튼으로 저장된 전체 용접사의 부착용 라벨(QR 코드 / 바코드 / QR+바코드 선택 및 하단 텍스트 포함)을 A4 규격에 맞춰 일괄 생성·인쇄합니다.",
            title_3: "3. 데이터 관리 및 입력값 검증",
            p_auto_save: "• <strong>데이터 저장 및 이력 관리</strong>: 날짜·시간·조건·입열량 결과를 브라우저 로컬 스토리지에 최대 500건까지 보관하며, 전체 이력을 한글 깨짐 없는 UTF-8 CSV 파일로 내보낼 수 있습니다.",
            p_validate: "• <strong>실시간 판정 검증</strong>: 전압(V), 전류(A), 시간(T), 길이(L) 및 WPS 최소/최대값은 0보다 커야 하며, 계산된 입열량이 WPS 허용 범위 내에 있으면 녹색(PASS), 벗어나면 적색(FAIL)으로 실시간 표시됩니다.",
            title_4: "4. PRO 버전 업그레이드 및 리딤 코드 인증 절차 (기기 고유번호 귀속)",
            p_pro_step1: "• <strong>1단계 (내 기기 고유번호 확인)</strong>: 상단 <strong>[FREE 버전]</strong> 배지를 눌러 설정 창을 열고, 화면에 표시된 5자리 <strong>내 기기 고유번호(예: 8F3K9)</strong>를 <strong>[📋 기기번호 복사]</strong> 버튼으로 복사합니다.",
            p_pro_step2: "• <strong>2단계 (카카오 채널 방문 및 코드 즉시 발급)</strong>: 설정 창의 <strong>QR 코드</strong> 또는 <strong>[💬 카카오 채널 방문하기]</strong>(<code>https://pf.kakao.com/_hALxeX</code>)로 채널에 방문하여 후원금(3,000원) 송금 후, <strong>[⚡ 리딤코드 즉시발급]</strong> 메뉴를 통해 코드를 즉시 발급받습니다.",
            p_pro_step3: "• <strong>3단계 (리딤 코드 입력 및 영구 활성화)</strong>: <strong>사용자 / 기기번호 (필수사항)</strong>와 발급받은 코드를 입력하고 <strong>[PRO 버전 활성화]</strong>를 누르면 즉시 모든 PRO 기능이 열리며, 관리자 후원 입금 승인 시 코드 재입력 없이 영구 유지됩니다. (48시간 내 미입금 시 자동 해제)",
            title_5: "5. 홈화면에 바로가기 추가하기 (아이콘 및 앱이름: HeatInPut Calculator) · 오프라인 측정/저장",
            p_shortcut_1: "• <strong>홈화면에 바로가기 추가 (HeatInPut Calculator)</strong>: 스마트폰이나 태블릿·PC 홈화면에 전용 아이콘과 앱 이름(<strong>HeatInPut Calculator</strong>)으로 바로가기를 추가하면 일반 앱처럼 원클릭으로 즉시 실행할 수 있습니다.",
            p_shortcut_2: "• <strong>오프라인 상태에서도 측정/저장 가능 안내</strong>: 바로가기를 추가(또는 최초 1회 실행)하면 프로그램과 직전 작업 환경이 기기에 자동 캐싱되어, <strong>인터넷이 전혀 연결되지 않은 오프라인 현장(선박 블록 내부, 지하, 플랜트 음영지역 등)에서도 직전 실행 환경 그대로 입열량 측정(계산) 및 데이터 저장이 100% 가능</strong>합니다.",
            p_shortcut_3: "• <strong>인터넷 재연결 시 자동 업데이트</strong>: 오프라인 상태에서 저장한 측정 기록(<code>⏳ 대기</code>)들은 이후 인터넷이 연결되는 순간 자동으로 최신 상태(<code>✓</code>)로 동기화·업데이트됩니다.",
            btn_open_shortcut: "📲 홈화면에 바로가기 추가하기 (HeatInPut Calculator)",
            legal_title: "법적 고지 (Legal Notice):",
            legal_1: "1. 본 프로그램의 계산 로직은 AWS D1.1 및 ISO 1011-1 / ISO 15614-1 공식을 기반으로 설계되었으며, 현장 참고용이므로 실제 적용 시 승인된 WPS 및 전문가의 검토를 거쳐야 합니다. 본 프로그램의 계산 결과를 단순 적용하여 발생한 결과에 대해 개발자는 법적 책임을 지지 않습니다.",
            legal_2: "2. 이 프로그램의 Free 버전은 비상업적인 용도에 한해 무료로 사용할 수 있으며, PRO 기능은 리딤 코드 인증을 통해 영구 활성화됩니다.",
            legal_3: "3. 본 프로그램을 무단으로 수정, 복제, 역설계(디버깅)하거나 상업적으로 재배포하는 행위를 금지합니다."
        },
        en: {
            modal_title: "📘 International Standard Manual & Heat Input Guide (v2.3)",
            title_1: "1. Standard & Process Factor · Heat Input Formula",
            formula: "HI = (k × V × A × T) / (L × 1000) (Unit: kJ/mm)",
            vars: "• <strong>k</strong>: Thermal efficiency factor | <strong>V</strong>: Voltage (V) | <strong>A</strong>: Amperage (A) | <strong>T</strong>: Time (sec) | <strong>L</strong>: Length (mm)",
            th_std: "Standard",
            th_proc: "Welding Process",
            th_k: "k Factor",
            aws_desc: "All Processes (FCAW, GMAW, SMAW, GTAW, SAW)",
            iso_saw: "SAW (Submerged Arc Welding - 121)",
            iso_tig: "GTAW (TIG - 141) · PAW (Plasma)",
            iso_etc: "Other Processes (SMAW 111 · GMAW 135 · FCAW 136/138)",
            title_2: "2. WPS & Welder Presets · Scanner · Label Printing",
            p_free_ver: "• <strong>Free Version</strong>: Save up to 10 WPS & Welder DATA presets each (.txt sample download and upload up to 10 items allowed); PDF extraction, preset editing, helmet scan, and label printing are locked (🔒).",
            p_pro_ver: "• <strong>PRO Version</strong>: Save up to 300 WPS & Welder DATA items, automatic PDF extraction, preset editing (Replace/Merge/Keep), 📷 Welder Helmet Scan (QR, Barcode, and text sticker auto-input), and 🏷️ batch label printing unlocked.",
            p_manual: "• <strong>Manual Mode</strong>: Directly enter WPS No., Min/Max heat input, and welder info for instant calculation.",
            p_preset: "• <strong>Preset Mode (2-Step Selection)</strong>: Select WPS No. (Step 1) and apply Pass/Heat Input range (Step 2) with one click. (Free: max 10 each / PRO: max 300 each)",
            p_txt: "• <strong>TXT Sample / Upload / Backup</strong>: Download tab-delimited .txt sample files to edit and upload in bulk, or backup data as TXT.",
            p_pdf: "• <strong>PDF Auto-Extraction & Interactive Editor (PRO)</strong>: Click [PDF] to automatically extract data from WPS or Welder Qualification PDFs, review/edit rows in the interactive table modal, and Replace or Merge with existing presets.",
            p_scan: "• <strong>Welder Helmet Scanner - QR, Barcode & OCR (PRO)</strong>: Use [📷 Scan] to capture QR/barcodes or read text stickers (Welder ID, Name, Process like SAW 121) via camera or gallery image OCR.",
            p_label: "• <strong>Batch Label Generation & Printing (PRO)</strong>: Use [🏷️ Print Label] to generate and print helmet stickers (QR Code / Barcode / QR+Barcode with welder info text below) for all saved welders on A4 sheets.",
            title_3: "3. Data Management & Input Validation",
            p_auto_save: "• <strong>Data Logging & CSV Export</strong>: Save up to 500 measurement records with date/time locally and export the entire history to a UTF-8 CSV file.",
            p_validate: "• <strong>Real-time Validation</strong>: V, A, T, L, and Min/Max values must be greater than 0. The result banner turns Green (PASS) when within the WPS range, and Red (FAIL) when out of bounds.",
            title_4: "4. PRO Upgrade & Redeem Code Activation (Device ID Bound)",
            p_pro_step1: "• <strong>Step 1 (Check Device ID)</strong>: Click the top <strong>[FREE]</strong> badge to open the PRO settings modal and copy your 5-character <strong>Device ID (e.g. 8F3K9)</strong>.",
            p_pro_step2: "• <strong>Step 2 (Visit Kakao Channel & Request via 1:1 Chat)</strong>: Scan the <strong>QR code</strong> or open the <strong>Kakao Channel</strong> (<code>https://pf.kakao.com/_hALxeX</code>) to read the channel notices, then send your <strong>Device ID</strong> via <strong>[1:1 Chat] inside the channel</strong> to receive your device-specific Redeem Code.",
            p_pro_step3: "• <strong>Step 3 (Activate Permanently)</strong>: Enter <strong>User / Device ID (Required)</strong> and the issued code (<code>HI40-DEVIC-XXXXX-XXXXX</code>), then click <strong>[Activate PRO]</strong>. Codes are cryptographically bound to your Device ID via SHA-256 and cannot be shared with other devices.",
            title_5: "5. Add to Home Screen (Icon & App Name: HeatInPut Calculator) · Offline Measurement & Saving",
            p_shortcut_1: "• <strong>Add Home Screen Shortcut (HeatInPut Calculator)</strong>: Add the shortcut with the official icon and app name (<strong>HeatInPut Calculator</strong>) to your phone, tablet, or PC home screen for one-tap standalone app launch.",
            p_shortcut_2: "• <strong>Offline Measurement & Saving Enabled</strong>: Once added, all app files and your last working environment are cached on your device—<strong>allowing you to run heat input calculations and save measurement data even when completely offline (no internet connection)</strong>.",
            p_shortcut_3: "• <strong>Auto-Update When Back Online</strong>: Records saved while offline (<code>⏳ Pending</code>) are automatically verified and updated as soon as an internet connection is restored.",
            btn_open_shortcut: "📲 Add to Home Screen (HeatInPut Calculator)",
            legal_title: "Legal Notice:",
            legal_1: "1. Calculation logic is based on AWS D1.1 and ISO 1011-1 / ISO 15614-1 formulas for reference only. Always verify against approved project WPS. The developer assumes no legal liability for outcomes resulting from the use of this application.",
            legal_2: "2. The Free version is provided for non-commercial use. PRO features are permanently unlocked via a valid Redeem Code.",
            legal_3: "3. Unauthorized modification, reverse-engineering, debugging, or commercial redistribution of this software is strictly prohibited."
        },
        es: {
            modal_title: "📘 Manual de Normas Internacionales y Guía de Aporte Térmico (v2.3)",
            title_1: "1. Factor de Norma y Proceso · Fórmula de Aporte Térmico",
            formula: "HI = (k × V × A × T) / (L × 1000) (Unidad: kJ/mm)",
            vars: "• <strong>k</strong>: Factor de eficiencia térmica | <strong>V</strong>: Voltaje (V) | <strong>A</strong>: Amperaje (A) | <strong>T</strong>: Tiempo (seg) | <strong>L</strong>: Longitud (mm)",
            th_std: "Norma",
            th_proc: "Proceso de Soldadura",
            th_k: "Factor k",
            aws_desc: "Todos los procesos (FCAW, GMAW, SMAW, GTAW, SAW)",
            iso_saw: "SAW (Arco Sumergido - 121)",
            iso_tig: "GTAW (TIG - 141) · PAW (Plasma)",
            iso_etc: "Otros procesos (SMAW 111 · GMAW 135 · FCAW 136/138)",
            title_2: "2. Presets de WPS y Soldador · Escáner · Impresión de Etiquetas",
            p_free_ver: "• <strong>Versión Free</strong>: Guarda hasta 10 presets de DATOS de WPS y Soldador cada uno (descarga de muestra .txt y carga de hasta 10 elementos permitida); extracción de PDF, edición de presets, escaneo de casco e impresión de etiquetas bloqueados (🔒).",
            p_pro_ver: "• <strong>Versión PRO</strong>: Guarda hasta 300 DATOS de WPS y Soldador, extracción automática de PDF, edición de presets (Reemplazar/Combinar/Mantener), 📷 Escaneo de Casco de Soldador (entrada automática de QR, código de barras y etiqueta normal) e 🏷️ impresión masiva de etiquetas desbloqueados.",
            p_manual: "• <strong>Modo Manual</strong>: Ingrese directamente el N.º de WPS, aporte térmico mín./máx. y datos del soldador.",
            p_preset: "• <strong>Modo Preset (Selección en 2 pasos)</strong>: Seleccione el N.º de WPS (Paso 1) y el rango por pasada (Paso 2). (Free: máx. 10 / PRO: máx. 300 cada uno)",
            p_txt: "• <strong>Muestra TXT / Carga / Respaldo</strong>: Descargue archivos .txt separados por tabulaciones para carga masiva o respalde en formato TXT.",
            p_pdf: "• <strong>Extracción de PDF y Editor Interactivo (PRO)</strong>: Extraiga datos automáticamente de documentos PDF de WPS o listas de soldadores, edite en la tabla emergente y reemplace o combine los datos.",
            p_scan: "• <strong>Escáner de Casco - QR, Código de Barras y OCR (PRO)</strong>: Use [📷 Escanear] para leer códigos QR/barras o etiquetas de texto (ID, Nombre, Proceso como SAW 121) mediante cámara o galería.",
            p_label: "• <strong>Generación e Impresión de Etiquetas (PRO)</strong>: Use [🏷️ Etiquetas] para generar e imprimir etiquetas en lote (QR / Código de barras / Ambos con texto inferior) para todos los soldadores registrados.",
            title_3: "3. Gestión de Datos y Validación",
            p_auto_save: "• <strong>Guardado y Exportación CSV</strong>: Almacene hasta 500 registros con fecha y hora en el navegador y exporte el historial completo a un archivo CSV.",
            p_validate: "• <strong>Validación en Tiempo Real</strong>: Voltaje, amperaje, tiempo, longitud y límites mín./máx. deben ser mayores que 0. El resultado se muestra en verde (PASS) dentro del rango y rojo (FAIL) fuera del límite.",
            title_4: "4. Actualización PRO y Activación por ID de Dispositivo",
            p_pro_step1: "• <strong>Paso 1 (Ver ID de Dispositivo)</strong>: Pulse la insignia <strong>[FREE]</strong> superior y copie su <strong>ID de Dispositivo de 5 caracteres (ej. 8F3K9)</strong>.",
            p_pro_step2: "• <strong>Paso 2 (Visitar Canal de Kakao y Chat 1:1)</strong>: Escanee el <strong>código QR</strong> o visite el <strong>Canal de Kakao</strong> (<code>https://pf.kakao.com/_hALxeX</code>) para leer los avisos y envíe su ID de Dispositivo mediante el <strong>[Chat 1:1] dentro del canal</strong> para recibir su código exclusivo.",
            p_pro_step3: "• <strong>Paso 3 (Activación Permanente)</strong>: Ingrese <strong>Usuario / ID de Dispositivo (Obligatorio)</strong> y el código (<code>HI40-IDDIS-XXXXX-XXXXX</code>) para activar PRO. Cada código está vinculado criptográficamente a un único dispositivo.",
            title_5: "5. Añadir a Pantalla de Inicio (Icono y Nombre: HeatInPut Calculator) · Medición y Guardado sin Conexión",
            p_shortcut_1: "• <strong>Acceso Directo en Pantalla de Inicio (HeatInPut Calculator)</strong>: Añada el acceso directo con el icono oficial y el nombre de la app (<strong>HeatInPut Calculator</strong>) a su pantalla de inicio.",
            p_shortcut_2: "• <strong>Medición y Guardado sin Conexión (Offline)</strong>: Al añadir el acceso directo, el entorno de ejecución anterior queda almacenado en el dispositivo, permitiendo <strong>calcular el aporte térmico y guardar mediciones incluso sin conexión a internet</strong>.",
            p_shortcut_3: "• <strong>Actualización Automática al Conectar</strong>: Los datos guardados sin conexión (<code>⏳ Pend.</code>) se sincronizan y actualizan automáticamente al recuperar la conexión a internet.",
            btn_open_shortcut: "📲 Añadir a Pantalla de Inicio (HeatInPut Calculator)",
            legal_title: "Aviso Legal:",
            legal_1: "1. Los cálculos se basan en las normas AWS D1.1 e ISO 1011-1 / ISO 15614-1 solo como referencia. Verifique siempre con el WPS aprobado. El desarrollador no asume ninguna responsabilidad legal por el uso de los resultados.",
            legal_2: "2. La versión gratuita es para uso no comercial. Las funciones PRO se desbloquean permanentemente mediante código de canje.",
            legal_3: "3. Queda prohibida la modificación, ingeniería inversa o redistribución no autorizada de este programa."
        },
        zh: {
            modal_title: "📘 国际标准手册与热输入计算指南 (v2.3)",
            title_1: "1. 标准与工艺系数 · 热输入计算公式",
            formula: "HI = (k × V × A × T) / (L × 1000) (结果单位: kJ/mm)",
            vars: "• <strong>k</strong>: 标准/工艺热效率系数 | <strong>V</strong>: 电压 (V) | <strong>A</strong>: 电流 (A) | <strong>T</strong>: 焊接时间 (秒) | <strong>L</strong>: 焊接长度 (mm)",
            th_std: "标准",
            th_proc: "焊接工艺",
            th_k: "k 系数",
            aws_desc: "所有工艺 (FCAW, GMAW, SMAW, GTAW, SAW 通用)",
            iso_saw: "SAW (埋弧焊 - 121)",
            iso_tig: "GTAW (TIG - 141) · PAW (等离子弧焊)",
            iso_etc: "其他工艺 (SMAW 111 · GMAW 135 · FCAW 136/138)",
            title_2: "2. WPS 与焊工预设 · 扫码识别 · 标签打印",
            p_free_ver: "• <strong>Free 版本</strong>: WPS·焊工 DATA 预设各最多保存 10 条（允许下载 .txt 样本及上传 10 条以内数据），PDF 提取·预设编辑·头盔扫描·标签打印锁定(🔒)",
            p_pro_ver: "• <strong>PRO 版本</strong>: WPS·焊工 DATA 最多保存 300 条，解锁 PDF 自动提取、预设编辑（替换/合并/保留）、📷 焊工头盔扫描（QR·条形码·普通贴纸自动输入）及 🏷️ 全部标签批量打印",
            p_manual: "• <strong>手动模式</strong>: 直接输入 WPS 编号、最小/最大热输入及焊工信息进行实时计算。",
            p_preset: "• <strong>预设模式 (两步选择)</strong>: 第1步选择 WPS 编号，第2步点击焊道自动填入热输入范围。(免费版: 各限 10 条 / PRO版: 各限 300 条)",
            p_txt: "• <strong>TXT 样本 / 上传 / 备份</strong>: 下载制表符(Tab)分隔的 .txt 样本文件批量上传，或导出 TXT 备份。",
            p_pdf: "• <strong>PDF 自动提取与交互式编辑 (PRO)</strong>: 点击 [PDF] 自动提取 WPS 或焊工名册 PDF 中的表格数据，在弹窗表格中核对修改后，可选择替换或合并至现有列表。",
            p_scan: "• <strong>焊工头盔扫描 - QR·条形码·OCR文字识别 (PRO)</strong>: 点击 [📷 扫码] 拍照或从相册选择标签图片，自动识别二维码、条形码或普通文字贴纸（工号、姓名、SAW 121 等工艺）。",
            p_label: "• <strong>头盔标签批量生成与打印 (PRO)</strong>: 点击 [🏷️ 标签打印] 为所有已保存的焊工批量生成标签（支持 QR码 / 条形码 / QR+条形码，底部附带焊工文字信息）并按 A4 排版打印。",
            title_3: "3. 数据管理与输入验证",
            p_auto_save: "• <strong>历史记录与 CSV 导出</strong>: 自动带日期时间保存最近 500 条记录，支持一键导出兼容 Excel 的 UTF-8 CSV 报表。",
            p_validate: "• <strong>实时合格判定</strong>: 电压、电流、时间、长度及最小/最大值均需大于 0。计算结果在允许范围内显示绿色(PASS)，超差显示红色(FAIL)。",
            title_4: "4. PRO 版本升级与兑换码认证流程 (设备唯一编号绑定)",
            p_pro_step1: "• <strong>第1步 (复制设备编号)</strong>: 点击顶部 <strong>[FREE]</strong> 徽章打开设置窗口，复制显示的 5 位<strong>设备唯一编号 (如: 8F3K9)</strong>。",
            p_pro_step2: "• <strong>第2步 (访问 Kakao 频道并通过 1:1 聊天申请)</strong>: 扫描二维码或访问 <strong>Kakao 频道</strong> (<code>https://pf.kakao.com/_hALxeX</code>) 查看公告说明后，在<strong>频道内的 [1:1 聊天]</strong> 中发送您的<strong>设备编号</strong>，即可获取专属兑换码。",
            p_pro_step3: "• <strong>第3步 (永久激活 PRO)</strong>: 输入<strong>用户 / 设备编号 (必填)</strong> 与专属兑换码 (<code>HI40-设备编号-XXXXX-XXXXX</code>) 并点击激活。兑换码通过 SHA-256 与当前设备绑定，无法在其他设备上重复使用。",
            title_5: "5. 添加到主屏幕快捷方式（图标及应用名：HeatInPut Calculator）· 离线测量与保存",
            p_shortcut_1: "• <strong>添加到主屏幕快捷方式 (HeatInPut Calculator)</strong>: 将带有专属图标和应用名称 (<strong>HeatInPut Calculator</strong>) 的快捷方式添加到手机或电脑主屏幕，即可像原生应用一样一键启动。",
            p_shortcut_2: "• <strong>支持无网络（离线）测量与保存</strong>: 添加快捷方式后，程序与上次运行环境会自动缓存至本机，<strong>即使在完全没有网络连接的离线现场，也能恢复上次运行环境并正常执行热输入测量（计算）与数据保存</strong>。",
            p_shortcut_3: "• <strong>联网后自动更新</strong>: 离线状态下保存的记录 (<code>⏳ 待更新</code>) 会在重新连接网络时自动同步更新为最新状态。",
            btn_open_shortcut: "📲 添加到主屏幕快捷方式 (HeatInPut Calculator)",
            legal_title: "法律声明 (Legal Notice):",
            legal_1: "1. 本程序计算逻辑基于 AWS D1.1 及 ISO 1011-1 / ISO 15614-1 标准公式设计，仅供参考，实际应用前请务必经专业工程师结合批准的 WPS 审核。开发者不对直接套用计算结果产生的任何后果承担法律责任。",
            legal_2: "2. 免费版仅供非商业用途使用，输入兑换码(Redeem Code)可永久解锁 PRO 全部功能。",
            legal_3: "3. 严禁擅自修改、反编译、调试或商业性二次分发本程序。"
        },
        ja: {
            modal_title: "📘 国際規格マニュアル＆溶接入熱ガイド (v2.3)",
            title_1: "1. 規格およびプロセス係数・入熱量計算式",
            formula: "HI = (k × V × A × T) / (L × 1000) (単位: kJ/mm)",
            vars: "• <strong>k</strong>: 規格・プロセス熱効率係数 | <strong>V</strong>: 電圧 (V) | <strong>A</strong>: 電流 (A) | <strong>T</strong>: 溶接時間 (秒) | <strong>L</strong>: 溶接長 (mm)",
            th_std: "規格",
            th_proc: "溶接プロセス",
            th_k: "k 係数",
            aws_desc: "全プロセス共通 (FCAW, GMAW, SMAW, GTAW, SAW)",
            iso_saw: "SAW (サブマージアーク溶接 - 121)",
            iso_tig: "GTAW (TIG - 141) · PAW (プラズマ)",
            iso_etc: "その他プロセス (SMAW 111 · GMAW 135 · FCAW 136/138)",
            title_2: "2. WPS・溶接士プリセット・スキャン・ラベル印刷",
            p_free_ver: "• <strong>Free バージョン</strong>: WPS・溶接士 DATA プリセット各最大10件保存（.txtサンプルダウンロードおよび10件以下のアップロード許可）、PDF抽出・プリセット編集・ヘルメットスキャン・ラベル印刷はロック(🔒)",
            p_pro_ver: "• <strong>PRO バージョン</strong>: WPS・溶接士 DATA 最大300件保存、PDF自動抽出、プリセット編集（置換/統合/維持）、📷 溶接士ヘルメットスキャン（QR・バーコード・一般ステッカー自動入力）および 🏷️ 全ラベル一括印刷のロック解除",
            p_manual: "• <strong>手動モード</strong>: WPS番号、最小/最大入熱量、溶接士情報を直接入力して即時計算します。",
            p_preset: "• <strong>プリセットモード (2段階選択)</strong>: WPS番号(1段階)を選択後、パス別入熱範囲(2段階)をワンクリックで適用します。(Free: 各最大10件 / PRO: 各最大300件)",
            p_txt: "• <strong>TXTサンプル / アップロード / バックアップ</strong>: タブ区切りの .txt サンプルをダウンロードして一括アップロード、またはTXT形式でバックアップできます。",
            p_pdf: "• <strong>PDF自動抽出＆対話型エディタ (PRO)</strong>: [PDF] ボタンからWPS文書や溶接士一覧PDFのデータを自動抽出し、ポップアップ表で編集後、既存リストへの置換または統合が可能です。",
            p_scan: "• <strong>ヘルメットスキャン - QR・バーコード・文字OCR (PRO)</strong>: [📷 スキャン] ボタンでヘルメットや名札のQR/バーコード、一般ステッカー文字（ID、氏名、SAW 121等の工程）をカメラや画像から自動認識します。",
            p_label: "• <strong>ヘルメットラベル一括生成・印刷 (PRO)</strong>: [🏷️ ラベル印刷] ボタンで保存された全溶接士のラベル（QRコード / バーコード / 両方＋下部テキスト表示）を一括生成し、A4サイズで印刷します。",
            title_3: "3. データ管理および入力値検証",
            p_auto_save: "• <strong>履歴保存＆CSV出力</strong>: 日時と共に最大500件の測定履歴をローカル保存し、文字化けしないUTF-8 CSVファイルとして出力できます。",
            p_validate: "• <strong>リアルタイム合否判定</strong>: 電圧、電流、時間、長さ、最小/最大値はすべて0より大きい必要があります。計算結果がWPS範囲内であれば緑色(PASS)、範囲外であれば赤色(FAIL)で表示されます。",
            title_4: "4. PRO版アップグレード＆認証手順 (端末固有番号バインド方式)",
            p_pro_step1: "• <strong>ステップ1 (端末固有番号の確認)</strong>: 上部の <strong>[FREE]</strong> バッジを押し、表示された5桁の<strong>端末固有番号 (例: 8F3K9)</strong> をコピーします。",
            p_pro_step2: "• <strong>ステップ2 (カカオチャンネル訪問＆1:1チャットでコード申請)</strong>: QRコードまたは<strong>カカオチャンネル</strong>（<code>https://pf.kakao.com/_hALxeX</code>）にアクセスしてお知らせを確認後、<strong>チャンネル内の [1:1チャット]</strong> で<strong>端末固有番号</strong>を送信し、専用リディームコードを受け取ります。",
            p_pro_step3: "• <strong>ステップ3 (永久有効化)</strong>: <strong>ユーザー / 端末番号 (必須)</strong> と専用コード (<code>HI40-端末番号-XXXXX-XXXXX</code>) を入力して有効化します。コードはSHA-256で端末固有番号に紐付けられており、他端末での使い回しはできません。",
            title_5: "5. ホーム画面にショートカットを追加（アイコン＆アプリ名：HeatInPut Calculator）・オフライン測定/保存",
            p_shortcut_1: "• <strong>ホーム画面にショートカット追加 (HeatInPut Calculator)</strong>: 専用アイコンとアプリ名（<strong>HeatInPut Calculator</strong>）でホーム画面にショートカットを追加すると、ワンタップで即座に起動できます。",
            p_shortcut_2: "• <strong>オフライン状態でも測定・保存が可能</strong>: ショートカットを追加するとプログラムと直前の実行環境が端末にキャッシュされ、<strong>インターネット未接続のオフライン現場でも直前の環境のまま入熱量の測定（計算）およびデータ保存が可能</strong>です。",
            p_shortcut_3: "• <strong>オンライン復帰時の自動更新</strong>: オフライン中に保存されたデータ（<code>⏳ 待機</code>）は、インターネット再接続時に自動的に最新状態へ更新されます。",
            btn_open_shortcut: "📲 ホーム画面にショートカットを追加 (HeatInPut Calculator)",
            legal_title: "法的告知 (Legal Notice):",
            legal_1: "1. 本プログラムの計算ロジックは AWS D1.1 および ISO 1011-1 / ISO 15614-1 の公式に基づいて設計されており、参考用です。現場適用時は必ず承認されたWPSおよび専門家の確認を経てください。開発者は計算結果の適用によるいかなる結果に対しても法的責任を負いません。",
            legal_2: "2. Free版は非営利目的でのみ無料で使用でき、リディームコード認証によりPRO機能が永久に有効化されます。",
            legal_3: "3. 本プログラムの無断修正、変更、デバッグ、逆コンパイルおよび再配布を禁じます。"
        }
    },

    renderModal: function(lang, titleEl, bodyEl) {
        const d = this.dict[lang] || this.dict.ko;
        if (titleEl) titleEl.innerText = d.modal_title;
        if (!bodyEl) return;

        bodyEl.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:16px; font-size:13px; line-height:1.6; max-height:70vh; overflow-y:auto; padding-right:6px;">
                <section>
                    <h3 style="color:var(--brand-orange); margin-bottom:6px; font-size:14px; font-weight:800;">${d.title_1}</h3>
                    <p><strong>${d.formula}</strong></p>
                    <p style="margin-top:4px; font-size:12px; color:var(--text-muted);">${d.vars}</p>
                    <div style="overflow-x:auto; margin-top:8px;">
                        <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;" border="1">
                            <thead>
                                <tr style="background:var(--bg-soft);">
                                    <th style="padding:8px; border:1.5px solid var(--border-strong);">${d.th_std}</th>
                                    <th style="padding:8px; border:1.5px solid var(--border-strong);">${d.th_proc}</th>
                                    <th style="padding:8px; border:1.5px solid var(--border-strong);">${d.th_k}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding:8px; border:1px solid var(--border-light); font-weight:700;">AWS</td>
                                    <td style="padding:8px; border:1px solid var(--border-light); text-align:left;">${d.aws_desc}</td>
                                    <td style="padding:8px; border:1px solid var(--border-light); font-weight:800;">1.0</td>
                                </tr>
                                <tr>
                                    <td rowspan="3" style="padding:8px; border:1px solid var(--border-light); font-weight:700;">ISO</td>
                                    <td style="padding:8px; border:1px solid var(--border-light); text-align:left;">${d.iso_saw}</td>
                                    <td style="padding:8px; border:1px solid var(--border-light); font-weight:800;">1.0</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px; border:1px solid var(--border-light); text-align:left;">${d.iso_tig}</td>
                                    <td style="padding:8px; border:1px solid var(--border-light); font-weight:800;">0.6</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px; border:1px solid var(--border-light); text-align:left;">${d.iso_etc}</td>
                                    <td style="padding:8px; border:1px solid var(--border-light); font-weight:800;">0.8</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
                <section>
                    <h3 style="color:var(--brand-orange); margin-bottom:6px; font-size:14px; font-weight:800;">${d.title_2}</h3>
                    <div style="background:var(--bg-soft); padding:10px 12px; border-radius:8px; border:1px solid var(--border-light); margin-bottom:8px;">
                        <p style="margin-bottom:4px; color:var(--text-muted);">${d.p_free_ver || ''}</p>
                        <p style="margin-bottom:0; color:var(--text-primary);">${d.p_pro_ver || ''}</p>
                    </div>
                    <p style="margin-bottom:4px;">${d.p_manual}</p>
                    <p style="margin-bottom:4px;">${d.p_preset}</p>
                    <p style="margin-bottom:4px;">${d.p_txt}</p>
                    <p style="margin-bottom:4px;">${d.p_pdf}</p>
                    <p style="margin-bottom:4px;">${d.p_scan}</p>
                    <p style="margin-bottom:4px;">${d.p_label}</p>
                </section>
                <section>
                    <h3 style="color:var(--brand-orange); margin-bottom:6px; font-size:14px; font-weight:800;">${d.title_3}</h3>
                    <p style="margin-bottom:4px;">${d.p_auto_save}</p>
                    <p style="margin-bottom:4px;">${d.p_validate}</p>
                </section>
                <section style="background:var(--bg-soft); padding:12px 14px; border-radius:10px; border:1px solid var(--border-light);">
                    <h3 style="color:var(--brand-orange); margin-bottom:6px; font-size:14px; font-weight:800;">${d.title_4 || ''}</h3>
                    <p style="margin-bottom:4px;">${d.p_pro_step1 || ''}</p>
                    <p style="margin-bottom:4px;">${d.p_pro_step2 || ''}</p>
                    <p style="margin-bottom:0;">${d.p_pro_step3 || ''}</p>
                </section>
                <section style="background:var(--bg-soft); padding:14px; border-radius:10px; border:1.5px solid var(--brand-orange);">
                    <h3 style="color:var(--brand-orange); margin-bottom:8px; font-size:14px; font-weight:800;">${d.title_5 || ''}</h3>
                    <p style="margin-bottom:4px;">${d.p_shortcut_1 || ''}</p>
                    <p style="margin-bottom:4px;">${d.p_shortcut_2 || ''}</p>
                    <p style="margin-bottom:10px;">${d.p_shortcut_3 || ''}</p>
                    <button type="button" style="width:100%; background:var(--brand-orange); color:#fff; border:none; border-radius:8px; padding:10px 14px; font-size:13px; font-weight:900; cursor:pointer;" onclick="MainController.openShortcutModal(false)">
                        ${d.btn_open_shortcut || ''}
                    </button>
                </section>
                <section style="font-size:11px; color:var(--text-muted); border-top:1px solid var(--border-light); padding-top:10px;">
                    <strong style="display:block; margin-bottom:4px; font-weight:800;">${d.legal_title}</strong>
                    <div style="margin-bottom:2px;">${d.legal_1}</div>
                    <div style="margin-bottom:2px;">${d.legal_2}</div>
                    <div>${d.legal_3}</div>
                </section>
            </div>
        `;
    }
};
