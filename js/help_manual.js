/**
 * js/help_manual.js
 * 5개 국어(KO, EN, ES, ZH, JA) 사용 매뉴얼 전용 모듈 (v2.7)
 * - 타이틀: '사용 매뉴얼' (KO: 사용 매뉴얼, EN: User Manual, ES: Manual de Usuario, ZH: 使用手册, JA: 使用マニュアル)
 * - 신규 기능(일일보고서 엑셀/PDF/공유, 모바일 2열 가로 최적화, 300개 프리셋, 하드웨어 기기지문 등) 반영
 * - 항목별 제목 상시 노출 및 세부 내용 접기/열기(Accordion <details><summary>) 구현
 */
const HelpManual = {
    dict: {
        ko: {
            modal_title: "📘 사용 매뉴얼",
            title_1: "1. 규격 및 공정 계수 · 입열량 계산 공식",
            formula: "HI = (k × V × A × T) / (L × 1000) (결과 단위: kJ/mm)",
            vars: "• <strong>k</strong>: 규격·공정 열효율 계수 | <strong>V</strong>: 전압 (V) | <strong>A</strong>: 전류 (A) | <strong>T</strong>: 용접 시간 (초) | <strong>L</strong>: 용접 길이 (mm)",
            th_std: "규격",
            th_proc: "용접 공정",
            th_k: "k 계수 (열효율)",
            aws_desc: "전체 공정 (FCAW, GMAW, SMAW, GTAW, SAW 공통)",
            iso_saw: "SAW (서브머지드 아크 - 121) · EGW (73) · ESW (72)",
            iso_tig: "GTAW (TIG - 141) · PAW (플라즈마 - 15)",
            iso_etc: "범용 아크 (SMAW 111 · GMAW 135 · FCAW 136/138) · HLAW (0.8)",
            iso_beam: "[PRO] 고밀도 빔 공정: LBW (레이저 - 52 : 0.75) · EBW (전자빔 - 51 : 0.95)",
            p_pro_proc: "• <strong>[PRO] 고능률 특수 아크 및 첨단 에너지 빔 공정 확장</strong>: 범용 5대 공정 외에 <strong>PAW</strong>(플라즈마), <strong>EGW</strong>(일렉트로가스), <strong>ESW</strong>(일렉트로슬래그), <strong>LBW</strong>(레이저), <strong>HLAW</strong>(하이브리드 레이저), <strong>EBW</strong>(전자빔) 등 조선·플랜트·첨단 정밀 용접 규격 계수($k$)가 영구 잠금 해제되어 정확한 입열량 산출이 가능합니다.",
            p_auto_k: "• <strong>WPS 자동 감지</strong>: WPS 번호나 패스 이름에 포함된 기호(SAW 121, FCAW 136 등)를 분석하여 해당 용접 공정과 규격별 k계수를 자동 동기화합니다.",

            title_2: "2. WPS 및 용접사 프리셋 관리 & 헬멧 스캔",
            p_free_ver: "• <span class='manual-free-tag'>Free 버전</span>: WPS·용접사 DATA 프리셋 각 최대 10개 저장 (.txt 샘플 다운로드 및 10개 이하 업로드 허용), PDF 추출·프리셋 편집·헬멧 스캔·라벨 인쇄 잠금(🔒)",
            p_pro_ver: "• <span class='manual-pro-tag'>PRO 버전</span>: WPS·용접사 DATA 각 최대 300개 대용량 저장, PDF 자동 파싱·추출, 인라인 편집(대체/병합/유지), 📷 용접사 헬멧 스캔(QR·바코드·일반스티커 자동입력) 및 🏷️ 전체 라벨 일괄 인쇄",
            p_manual: "• <strong>수동 모드</strong>: WPS 번호 및 최소/최대 입열량, 용접사 정보를 직접 입력하여 즉시 계산합니다.",
            p_preset: "• <strong>프리셋 모드 (1·2단계 선택)</strong>: 저장된 WPS 번호(1단계) 선택 후 패스별 입열량 범위(2단계)를 원클릭으로 신속하게 적용합니다.",
            p_txt: "• <strong>TXT 샘플 / 업로드 / 백업</strong>: 탭(Tab)으로 구분된 샘플 .txt 파일을 내려받아 엑셀 등에서 편집 후 일괄 업로드하거나 TXT 파일로 안전하게 백업합니다.",
            p_pdf: "• <strong>[PRO] PDF 자동 추출 및 대화형 편집</strong>: [PDF] 버튼으로 WPS 문서나 용접사 자격일람표 PDF에서 표 데이터를 자동 추출하고, 팝업 편집창에서 값을 확인·수정한 뒤 기존 목록에 대체(Replace) 또는 병합(Merge)합니다.",
            p_scan: "• <strong>[PRO] 용접사 헬멧 스캔 (QR·바코드·문자 OCR)</strong>: [📷 스캔] 버튼으로 헬멧·명찰의 QR/바코드나 일반 스티커(한글 이름, 사번, SAW 121 등 공정명)를 카메라 촬영 또는 이미지 선택으로 자동 인식하여 즉시 입력합니다.",
            p_label: "• <strong>[PRO] 헬멧 라벨 일괄 생성 및 인쇄</strong>: [🏷️ 라벨인쇄] 버튼으로 저장된 전체 용접사의 부착용 라벨(QR 코드 / 바코드 / QR+바코드 선택 및 하단 텍스트 포함)을 A4 규격에 맞춰 일괄 생성·인쇄합니다.",

            title_3: "3. 데이터 측정 입력 & 모바일 가로 2열 최적화",
            p_mobile_2col: "• <strong>모바일 가로 2열 최적화 (New)</strong>: 좁은 스마트폰 화면에서도 최소/최대 및 전압(V), 암페어(A), 길이(L), 시간(T) 입력창이 한 줄에 2개씩(2열) 배치되어 화면 스크롤 없이 신속하게 값을 확인하고 스테퍼(+/-)로 정밀 조절할 수 있습니다.",
            p_time_dual: "• <strong>분:초 분할 제어</strong>: 총 시간(초) 입력 외에 하단 분(MIN):초(SEC) 입력창이 실시간 연동되어 1분 이상의 장시간 용접도 직관적으로 입력할 수 있습니다.",
            p_validate: "• <strong>실시간 합격/불합격 판정 검증 & [PRO] 청각 사운드 피드백</strong>: 계산된 입열량이 WPS 허용 범위 내에 있으면 녹색(PASS), 범위를 벗어나면 적색(FAIL)으로 배너가 즉시 갱신됩니다. 특히 <strong>PRO 버전</strong>에서는 화면을 계속 보지 않고도 시공 결과를 직관적으로 알 수 있도록 <strong>합격(경쾌한 2화음 챠임벨) / 불합격(경고 비프음) 청각 알림음</strong>이 실시간으로 자동 출력됩니다.",

            title_4: "4. [PRO] 용접 변수 일일 검사 보고서 (Excel · PDF · 모바일 공유)",
            p_report_overview: "• <strong>당일 검사 기록 원클릭 집계</strong>: 측정 당일의 모든 용접 이력을 자동으로 취합하여 총 측정 건수, 합격(PASS) 건수, 불합격(FAIL) 건수, 합격률(%)을 대시보드로 실시간 계산합니다.",
            p_report_excel: "• <strong>[Excel 내보내기]</strong>: 프로젝트명, 검사일자, 검사원 정보가 포함된 표준 규격 형식의 엑셀 호환 보고서를 즉시 다운로드합니다.",
            p_report_pdf: "• <strong>[PDF 출력]</strong>: 인쇄 및 전자결재에 최적화된 용접 검사 보고서(하단 검사원 및 책임자 정식 서명란 포함)를 PDF로 저장하거나 종이로 즉시 인쇄합니다.",
            p_report_share: "• <strong>[모바일 공유]</strong>: 카카오톡, 라인, 문자메시지, 이메일 등으로 현장 검사 보고서 요약 및 데이터를 즉시 전송할 수 있습니다. (Web Share API 지원)",

            title_5: "5. 데이터 저장 및 이력 관리 (로컬 500건 & 인라인 편집)",
            p_auto_save: "• <strong>로컬 영구 보관</strong>: 데이터 저장 버튼 클릭 시 날짜·시간·규격·공정·WPS·용접사·V/A/L/T·입열량·판정 결과가 브라우저에 최대 500건까지 안전하게 저장됩니다.",
            p_edit_mode: "• <strong>[✏️ 편집 모드]</strong>: 저장된 이력 테이블에서 직접 V, A, L, T 및 조건을 수정할 수 있으며, 수정 즉시 입열량과 합격 여부가 자동 재계산됩니다.",
            p_csv: "• <strong>[CSV 내보내기]</strong>: 전체 이력을 엑셀에서 한글 깨짐이 없는 UTF-8 with BOM CSV 파일로 즉시 내보낼 수 있습니다.",

            title_6: "6. [PRO] 라이선스 인증 & 하드웨어 기기 고유번호",
            p_pro_hw: "• <strong>사용중인 하드웨어 지문 기기번호 기반으로 Pro 리딤코드 발행됩니다.</strong>",
            p_pro_step1: "• <strong>1단계 (기기번호 확인)</strong>: 상단 <strong>[FREE]</strong> 배지를 눌러 설정 창을 열고 화면에 표시된 5자리 <strong>내 기기 고유번호</strong>를 확인합니다.",
            p_pro_step2: "• <strong>2단계 (이메일 발급 & 후원)</strong>: 성함과 이메일을 입력하여 3초 만에 리딤 코드를 수신하고(※ 메일이 안 보이면 스팸메일함 확인), <strong>카카오페이(국내)</strong> 또는 <strong>Buy Me a Coffee(해외)</strong>로 커피 후원을 완료합니다. (문의: 카카오 1:1 채팅)",
            p_pro_step3: "• <strong>3단계 (영구 활성화)</strong>: <strong>사용자 / 기기번호</strong>와 발급받은 코드(<code>HEAT-기기번호-XXXXX-XXXXX</code>)를 입력하면 오프라인 환경에서도 SHA-256 비대칭 암호화를 통해 즉시 모든 PRO 기능이 영구 활성화됩니다.",

            title_7: "7. 홈화면에 바로가기 추가 (PWA) & 100% 오프라인 작동 안내",
            p_shortcut_1: "• <strong>홈화면에 바로가기 추가 (Heat-Input Calc)</strong>: 스마트폰, 태블릿, PC 홈화면에 전용 아이콘과 앱 이름(<strong>Heat-Input Calc</strong>)으로 바로가기를 추가하면 일반 앱처럼 원클릭으로 즉시 실행됩니다.",
            p_shortcut_2: "• <strong>100% 오프라인 작동</strong>: 프로그램과 직전 작업 환경이 기기에 완전 캐싱되어, <strong>인터넷이 전혀 연결되지 않는 오프라인 현장(선박 블록 내부, 지하, 해상 플랜트 음영지역 등)에서도 직전 작업 환경 그대로 입열량 계산 및 데이터 저장이 100% 가능</strong>합니다.",
            p_shortcut_3: "• <strong>온라인 복귀 시 자동 동기화 (상부 네트워크 마크 클릭으로 수동 동기화 가능)</strong>: 오프라인 상태에서 저장한 측정 기록(<code>⏳ 대기</code>)은 인터넷이 재연결되는 순간 자동으로 최신 상태(<code>✓</code>)로 안전하게 동기화됩니다. 상단 헤더의 <strong>네트워크 마크(Wi-Fi 아이콘)</strong>를 클릭하면 언제든 원하는 시점에 즉시 수동 동기화 및 네트워크 상태를 확인할 수 있습니다.",
            btn_open_shortcut: "📲 홈화면에 바로가기 추가하기 (Heat-Input Calc)",

            legal_title: "법적 고지 (Legal Notice):",
            legal_1: "1. 본 프로그램의 계산 로직은 AWS D1.1 / ASME Sec. IX 및 ISO 1011-1 / ISO 15614-1 공식을 기반으로 설계되었으며 현장 참고용입니다. 실제 적용 시 반드시 승인된 WPS 및 전문가의 검토를 거쳐야 하며, 계산 결과의 단순 적용으로 발생한 결과에 대해 개발자는 법적 책임을 지지 않습니다.",
            legal_2: "2. 본 프로그램의 Free 버전은 비상업적인 용도에 한해 무료로 제공되며, PRO 기능은 정식 리딤 코드 인증을 통해 영구 활성화됩니다.",
            legal_3: "3. 본 프로그램을 무단으로 수정, 복제, 역설계(디버깅)하거나 상업적으로 재배포하는 행위를 금지합니다."
        },
        en: {
            modal_title: "📘 User Manual",
            title_1: "1. Standard & Process Factor · Heat Input Formula",
            formula: "HI = (k × V × A × T) / (L × 1000) (Unit: kJ/mm)",
            vars: "• <strong>k</strong>: Thermal efficiency factor | <strong>V</strong>: Voltage (V) | <strong>A</strong>: Amperage (A) | <strong>T</strong>: Time (sec) | <strong>L</strong>: Length (mm)",
            th_std: "Standard",
            th_proc: "Welding Process",
            th_k: "k Factor",
            aws_desc: "All Processes (FCAW, GMAW, SMAW, GTAW, SAW)",
            iso_saw: "SAW (Submerged Arc - 121) · EGW (73) · ESW (72)",
            iso_tig: "GTAW (TIG - 141) · PAW (Plasma - 15)",
            iso_etc: "General Arc (SMAW 111 · GMAW 135 · FCAW 136/138) · HLAW (0.8)",
            iso_beam: "[PRO] High-Energy Beam: LBW (Laser - 52 : 0.75) · EBW (Electron Beam - 51 : 0.95)",
            p_pro_proc: "• <strong>[PRO] High-Efficiency Arc & Advanced Energy Beam Processes</strong>: In addition to the 5 standard processes, PRO unlocks <strong>PAW</strong> (Plasma), <strong>EGW</strong> (Electro-Gas), <strong>ESW</strong> (Electro-Slag), <strong>LBW</strong> (Laser), <strong>HLAW</strong> (Hybrid Laser), and <strong>EBW</strong> (Electron Beam) with standard ISO/AWS thermal efficiency factors ($k$).",
            p_auto_k: "• <strong>WPS Auto-Detection</strong>: Automatically identifies welding processes and syncs standard-specific k-factors from WPS numbers and pass identifiers.",

            title_2: "2. WPS & Welder Presets · Helmet Scan & Label Printing",
            p_free_ver: "• <span class='manual-free-tag'>Free Version</span>: Save up to 10 WPS & Welder presets each (.txt sample download & upload up to 10 items allowed); PDF extraction, preset editing, helmet scan, and label printing are locked (🔒).",
            p_pro_ver: "• <span class='manual-pro-tag'>PRO Version</span>: Save up to 300 presets each, automatic PDF table parsing & extraction, interactive editing (Replace/Merge/Keep), 📷 Helmet Scan (QR, Barcode, OCR sticker auto-input), and 🏷️ batch A4 label printing.",
            p_manual: "• <strong>Manual Mode</strong>: Directly input WPS No., Min/Max heat input range, and welder details for immediate calculation.",
            p_preset: "• <strong>Preset Mode (2-Step Selection)</strong>: Select WPS No. (Step 1) and apply pass-specific heat input limits (Step 2) with one click.",
            p_txt: "• <strong>TXT Sample / Upload / Backup</strong>: Download tab-delimited .txt sample files for spreadsheet editing, bulk upload, and secure backup.",
            p_pdf: "• <strong>[PRO] PDF Auto-Extraction & Interactive Editor</strong>: Extract tabular data automatically from WPS or Welder Qualification PDFs, review/edit in a popup grid, and Replace or Merge with existing presets.",
            p_scan: "• <strong>[PRO] Welder Helmet Scanner (QR, Barcode & OCR)</strong>: Capture QR/barcodes or read text stickers (Welder ID, Name, Process like SAW 121) using camera capture or image upload.",
            p_label: "• <strong>[PRO] Batch Helmet Label Generation & Printing</strong>: Generate and print helmet stickers (QR Code, Barcode, or QR+Barcode with welder details below) formatted for standard A4 sheets.",

            title_3: "3. Measurement Input & Mobile 2-Column Optimization",
            p_mobile_2col: "• <strong>Mobile 2-Column Grid Layout (New)</strong>: Min/Max limits and Voltage (V), Amperage (A), Length (L), and Time (T) input boxes are arranged 2 per row on mobile screens, enabling fast, scroll-free adjustment with stepper buttons (+/-).",
            p_time_dual: "• <strong>Dual Minute:Second Control</strong>: Total seconds and split MIN:SEC steppers remain synchronized in real time for effortless handling of long weld passes.",
            p_validate: "• <strong>Real-time PASS / FAIL Validation & [PRO] Audio Feedback</strong>: The banner dynamically illuminates in Green (PASS) when within WPS tolerance, and Red (FAIL) when out of range. In the <strong>PRO version</strong>, real-time <strong>audio feedback (Melodic 2-tone Chime for PASS / Low warning beep for FAIL)</strong> is automatically played, allowing hands-free inspection without constantly staring at the screen.",

            title_4: "4. [PRO] Daily Welding Parameter Check Report (Excel · PDF · Share)",
            p_report_overview: "• <strong>One-Click Daily Inspection Aggregation</strong>: Automatically aggregates all weld runs recorded today, providing instant stats on total welds, PASS count, FAIL count, and overall Pass Rate (%).",
            p_report_excel: "• <strong>[Excel Export]</strong>: Downloads an Excel-compatible standardized inspection report complete with project name, date, and inspector metadata.",
            p_report_pdf: "• <strong>[PDF Print]</strong>: Generates print-ready inspection sheets formatted with formal inspector and supervisor signature blocks for compliance audits.",
            p_report_share: "• <strong>[Mobile Sharing]</strong>: Instantly share inspection summaries and reports via KakaoTalk, SMS, or email directly from your phone (Web Share API).",

            title_5: "5. Data Storage & History Log (500 Records & Inline Editing)",
            p_auto_save: "• <strong>Local Persistent Storage</strong>: Saves up to 500 inspection records securely in browser storage, functioning 100% offline.",
            p_edit_mode: "• <strong>[✏️ Edit Mode]</strong>: Allows direct on-site editing of V, A, L, T, and WPS parameters within the history table, automatically recalculating heat input and pass/fail status.",
            p_csv: "• <strong>[CSV Export]</strong>: Exports entire history logs into clean UTF-8 with BOM CSV files compatible with Microsoft Excel.",

            title_6: "6. [PRO] License Activation & Hardware Fingerprint",
            p_pro_hw: "• <strong>Pro Redeem Codes are issued based on your device's hardware fingerprint ID.</strong>",
            p_pro_step1: "• <strong>Step 1 (Check Device ID)</strong>: Click the top <strong>[FREE]</strong> badge to open Settings and view your 5-character <strong>Device ID</strong>.",
            p_pro_step2: "• <strong>Step 2 (Instant Email & Sponsorship)</strong>: Enter your name and email to receive your redeem code in 3 seconds (check spam/junk folder if not found), and support via <strong>Buy Me a Coffee</strong> (Global) or <strong>KakaoPay</strong> (Korea).",
            p_pro_step3: "• <strong>Step 3 (Permanent Activation)</strong>: Enter your <strong>User / Device ID</strong> and code (<code>HEAT-DEVIC-XXXXX-XXXXX</code>) for permanent offline activation verified via SHA-256 cryptographic binding.",

            title_7: "7. Add to Home Screen (PWA) & 100% Offline Operation",
            p_shortcut_1: "• <strong>Add Home Screen Shortcut (Heat-Input Calc)</strong>: Add the app shortcut to your phone, tablet, or desktop home screen for one-tap native-app launch.",
            p_shortcut_2: "• <strong>100% Offline Operation</strong>: The application and previous working state are completely cached, allowing you to <strong>calculate heat input and save inspection records even inside enclosed ship blocks or remote plant sites without internet</strong>.",
            p_shortcut_3: "• <strong>Automatic Online Synchronization (Click Upper Network Icon for Manual Sync)</strong>: Records stored offline (<code>⏳ Pending</code>) automatically synchronize (<code>✓</code>) the moment connectivity is restored. You can also click the <strong>network icon (Wi-Fi mark)</strong> at the top header at any time to trigger immediate manual synchronization.",
            btn_open_shortcut: "📲 Add to Home Screen (Heat-Input Calc)",

            legal_title: "Legal Notice:",
            legal_1: "1. Calculation formulas are designed based on AWS D1.1 / ASME Sec. IX and ISO 1011-1 / ISO 15614-1 standards for field reference. All actual welding must comply with approved WPS and engineering review. The developer assumes no legal liability for direct applications.",
            legal_2: "2. The Free version is strictly for non-commercial use. PRO features are unlocked permanently via valid Redeem Code registration.",
            legal_3: "3. Unauthorized modification, reverse engineering, debugging, or commercial redistribution of this application is prohibited."
        },
        es: {
            modal_title: "📘 Manual de Usuario",
            title_1: "1. Factor de Norma y Proceso · Fórmula de Aporte Térmico",
            formula: "HI = (k × V × A × T) / (L × 1000) (Unidad: kJ/mm)",
            vars: "• <strong>k</strong>: Factor de eficiencia térmica | <strong>V</strong>: Voltaje (V) | <strong>A</strong>: Amperaje (A) | <strong>T</strong>: Tiempo (seg) | <strong>L</strong>: Longitud (mm)",
            th_std: "Norma",
            th_proc: "Proceso de Soldadura",
            th_k: "Factor k",
            aws_desc: "Todos los procesos (FCAW, GMAW, SMAW, GTAW, SAW)",
            iso_saw: "SAW (Arco Sumergido - 121) · EGW (73) · ESW (72)",
            iso_tig: "GTAW (TIG - 141) · PAW (Plasma - 15)",
            iso_etc: "Arco General (SMAW 111 · GMAW 135 · FCAW 136/138) · HLAW (0.8)",
            iso_beam: "[PRO] Haz de Alta Energía: LBW (Láser - 52 : 0.75) · EBW (Haz Electrónico - 51 : 0.95)",
            p_pro_proc: "• <strong>[PRO] Procesos Especiales de Alta Eficiencia y Haz Avanzado</strong>: Además de los 5 procesos estándar, PRO desbloquea <strong>PAW</strong>, <strong>EGW</strong>, <strong>ESW</strong>, <strong>LBW</strong>, <strong>HLAW</strong> y <strong>EBW</strong> con factores de eficiencia térmica certificados ($k$).",
            p_auto_k: "• <strong>Detección Automática de WPS</strong>: Detecta procesos y sincroniza factores k específicos según el código de WPS y la pasada.",

            title_2: "2. Presets de WPS y Soldador · Escáner e Impresión de Etiquetas",
            p_free_ver: "• <span class='manual-free-tag'>Versión Free</span>: Guarda hasta 10 presets de WPS y Soldador cada uno (.txt muestra y carga hasta 10 elementos permitida); PDF, edición, escaneo e impresión de etiquetas bloqueados (🔒).",
            p_pro_ver: "• <span class='manual-pro-tag'>Versión PRO</span>: Guarda hasta 300 presets cada uno, extracción automática de PDF, edición interactiva (Reemplazar/Combinar/Mantener), 📷 Escaneo de Casco (QR, código de barras y OCR) e 🏷️ impresión masiva de etiquetas en A4.",
            p_manual: "• <strong>Modo Manual</strong>: Ingrese directamente el N.º de WPS, rango de aporte térmico y datos del soldador para cálculo instantáneo.",
            p_preset: "• <strong>Modo Preset (2 Pasos)</strong>: Seleccione el N.º de WPS (Paso 1) y aplique los límites por pasada (Paso 2) con un solo clic.",
            p_txt: "• <strong>Muestra TXT / Carga / Respaldo</strong>: Descargue archivos .txt para edición masiva en Excel o cree copias de seguridad seguras.",
            p_pdf: "• <strong>[PRO] Extracción de PDF y Edición</strong>: Extraiga tablas automáticamente de documentos PDF de WPS o calificaciones de soldadores y edítelas interactivamente.",
            p_scan: "• <strong>[PRO] Escáner de Casco (QR, Código de Barras y OCR)</strong>: Lea códigos QR, barras o etiquetas de texto con la cámara o galería.",
            p_label: "• <strong>[PRO] Impresión Masiva de Etiquetas</strong>: Genere e imprima etiquetas adhesivas para todos los soldadores en hojas A4 estándar.",

            title_3: "3. Entrada de Medición y Optimización Móvil en 2 Columnas",
            p_mobile_2col: "• <strong>Diseño Móvil en 2 Columnas (Nuevo)</strong>: Los límites mín./máx. y voltaje (V), amperaje (A), longitud (L) y tiempo (T) se organizan en 2 columnas por fila para un ajuste rápido y sin desplazamientos en pantallas pequeñas.",
            p_time_dual: "• <strong>Control Dual Minutos:Segundos</strong>: Tiempo total en segundos y control de minutos/segundos sincronizados en tiempo real.",
            p_validate: "• <strong>Validación en Tiempo Real y [PRO] Sonido de Dictamen</strong>: El resultado se ilumina en Verde (PASS) dentro del rango WPS y en Rojo (FAIL) si está fuera de tolerancia. En la <strong>versión PRO</strong>, se emite una <strong>alerta sonora en tiempo real (Campana melódica para PASS / Tono de advertencia para FAIL)</strong> que permite comprobar el dictamen sin necesidad de mirar continuamente la pantalla.",

            title_4: "4. [PRO] Informe Diario de Inspección (Excel · PDF · Compartir)",
            p_report_overview: "• <strong>Resumen Diario en un Clic</strong>: Agrupa todas las soldaduras del día y calcula automáticamente el total, aprobadas (PASS), rechazadas (FAIL) y la tasa de aprobación (%).",
            p_report_excel: "• <strong>[Exportar a Excel]</strong>: Descargue un informe estándar compatible con hojas de cálculo con metadatos del proyecto e inspector.",
            p_report_pdf: "• <strong>[Imprimir PDF]</strong>: Genera un informe formal listo para imprimir con casillas de firma para inspector y supervisor.",
            p_report_share: "• <strong>[Compartir Móvil]</strong>: Envíe resúmenes e informes directamente por WhatsApp, SMS o correo electrónico.",

            title_5: "5. Gestión de Datos e Historial (500 Registros y Edición)",
            p_auto_save: "• <strong>Almacenamiento Local Seguro</strong>: Guarda hasta 500 registros con fecha y hora en el dispositivo (100% fuera de línea).",
            p_edit_mode: "• <strong>[✏️ Modo de Edición]</strong>: Permite corregir valores directamente en la tabla y recalcula instantáneamente el aporte térmico.",
            p_csv: "• <strong>[Exportar CSV]</strong>: Descargue todo el historial en formato CSV UTF-8 con BOM compatible con Excel.",

            title_6: "6. [PRO] Activación de Licencia e ID por Huella de Hardware",
            p_pro_hw: "• <strong>Los códigos Pro se emiten según el ID de huella de hardware del dispositivo en uso.</strong>",
            p_pro_step1: "• <strong>Paso 1 (Ver ID de Dispositivo)</strong>: Pulse la insignia <strong>[FREE]</strong> superior para consultar su ID de 5 caracteres.",
            p_pro_step2: "• <strong>Paso 2 (Email al Instante y Patrocinio)</strong>: Ingrese su nombre y correo para recibir su código en 3 segundos (revise la carpeta de spam si no lo ve) y apoye mediante <strong>Buy Me a Coffee</strong> (Global) o <strong>KakaoPay</strong> (Corea).",
            p_pro_step3: "• <strong>Paso 3 (Activación Permanente)</strong>: Ingrese su <strong>Usuario / ID de Dispositivo</strong> y el código (<code>HEAT-IDDIS-XXXXX-XXXXX</code>) para activar PRO sin internet mediante SHA-256.",

            title_7: "7. Añadir a Pantalla de Inicio (PWA) y Operación Fuera de Línea",
            p_shortcut_1: "• <strong>Acceso Directo (Heat-Input Calc)</strong>: Añada el icono a su pantalla de inicio para ejecutar la aplicación con un solo toque.",
            p_shortcut_2: "• <strong>100% Fuera de Línea</strong>: Todos los datos y la interfaz quedan almacenados localmente para operar en bloques de barcos o zonas subterráneas sin internet.",
            p_shortcut_3: "• <strong>Sincronización Automática (Clic en el Icono de Red Superior para Sincronización Manual)</strong>: Los registros guardados sin conexión (<code>⏳ Pend.</code>) se sincronizan (<code>✓</code>) en cuanto vuelve la conexión. También puede hacer clic en el <strong>icono de red (Wi-Fi)</strong> en la barra superior para forzar la sincronización manual inmediata.",
            btn_open_shortcut: "📲 Añadir a Pantalla de Inicio (Heat-Input Calc)",

            legal_title: "Aviso Legal:",
            legal_1: "1. Los cálculos se basan en AWS D1.1 / ASME Sec. IX e ISO 1011-1 / ISO 15614-1 solo con fines de referencia en campo. La aplicación real debe ser validada por un WPS aprobado.",
            legal_2: "2. La versión Free es para uso no comercial. Las funciones PRO se desbloquean permanentemente mediante código de canje.",
            legal_3: "3. Queda prohibida la modificación, ingeniería inversa o redistribución comercial no autorizada."
        },
        zh: {
            modal_title: "📘 使用手册",
            title_1: "1. 标准与工艺系数 · 热输入计算公式",
            formula: "HI = (k × V × A × T) / (L × 1000) (结果单位: kJ/mm)",
            vars: "• <strong>k</strong>: 标准/工艺热效率系数 | <strong>V</strong>: 电压 (V) | <strong>A</strong>: 电流 (A) | <strong>T</strong>: 焊接时间 (秒) | <strong>L</strong>: 焊接长度 (mm)",
            th_std: "标准",
            th_proc: "焊接工艺",
            th_k: "k 系数",
            aws_desc: "所有工艺 (FCAW, GMAW, SMAW, GTAW, SAW 通用)",
            iso_saw: "SAW (埋弧焊 - 121) · EGW (气电立焊 - 73) · ESW (电渣焊 - 72)",
            iso_tig: "GTAW (TIG - 141) · PAW (等离子弧焊 - 15)",
            iso_etc: "通用电弧焊 (SMAW 111 · GMAW 135 · FCAW 136/138) · HLAW (0.8)",
            iso_beam: "[PRO] 高能束工艺: LBW (激光焊 - 52 : 0.75) · EBW (电子束焊 - 51 : 0.95)",
            p_pro_proc: "• <strong>[PRO] 解锁高效特种电弧与尖端能束工艺</strong>: 除 5 大通用工艺外，PRO 专业版永久解锁 <strong>PAW</strong> (等离子)、<strong>EGW</strong> (气电立焊)、<strong>ESW</strong> (电渣焊)、<strong>LBW</strong> (激光焊)、<strong>HLAW</strong> (激光复合) 与 <strong>EBW</strong> (电子束焊) 的热效率系数($k$)，精准掌控特种厚板与高精结构的热输入。",
            p_auto_k: "• <strong>WPS 自动识别</strong>: 自动分析 WPS 编号与焊道名称中的工艺代号，实时同步对应的焊接工艺与标准 k 系数。",

            title_2: "2. WPS 与焊工预设管理 & 头盔扫码识别",
            p_free_ver: "• <span class='manual-free-tag'>Free 免费版</span>: WPS·焊工预设各最多保存 10 条（支持下载 .txt 样本及上传 10 条以内数据），PDF 提取·预设编辑·头盔扫码·标签打印锁定(🔒)",
            p_pro_ver: "• <span class='manual-pro-tag'>PRO 专业版</span>: WPS·焊工预设各最多保存 300 条，解锁 PDF 表格自动解析提取、交互式编辑（替换/合并/保留）、📷 头盔智能扫码（二维码·条码·文字贴纸自动输入）及 🏷️ 批量 A4 标签打印",
            p_manual: "• <strong>手动模式</strong>: 直接输入 WPS 编号、最小/最大热输入范围及焊工信息进行实时计算。",
            p_preset: "• <strong>预设模式 (两步选择)</strong>: 第1步快速点选 WPS 编号，第2步点击焊道即刻套用热输入限制范围。",
            p_txt: "• <strong>TXT 样本 / 上传 / 备份</strong>: 支持下载制表符(Tab)分隔的 .txt 样本，使用 Excel 批量编辑后上传或备份导出。",
            p_pdf: "• <strong>[PRO] PDF 自动提取与交互编辑</strong>: 点击 [PDF] 自动识别 WPS 或焊工资质表 PDF 表格数据，可在弹窗中核对修改后替换或合并导入。",
            p_scan: "• <strong>[PRO] 头盔智能扫码识别 (QR·条码·OCR)</strong>: 点击 [📷 扫码] 拍照或从相册选择图片，自动识别头盔贴纸上的工号、姓名及工艺代号（如 SAW 121）。",
            p_label: "• <strong>[PRO] 焊工标签批量排版打印</strong>: 点击 [🏷️ 标签打印] 即可一键生成全员头盔标签（支持二维码/条形码/图文结合）并按 A4 纸张排版打印。",

            title_3: "3. 测量数据输入 & 移动端横向双列优化",
            p_mobile_2col: "• <strong>移动端横向双列排版 (New)</strong>: 在较窄的手机屏幕上，最小/最大范围以及电压(V)、电流(A)、长度(L)、时间(T)输入框均采用单行双列(2列)优化排版，无需频繁上下滑动即可直观掌控并使用步进按钮(+/-)微调。",
            p_time_dual: "• <strong>分:秒双重输入联动</strong>: 总秒数输入框与分(MIN):秒(SEC)分段控制实时互通，长焊道计时输入更轻松。",
            p_validate: "• <strong>实时 PASS / FAIL 合格判定 & [PRO] 判定提示音</strong>: 计算出的热输入处于 WPS 许可范围内显示绿色(PASS)，超差即刻显示红色(FAIL)。在 <strong>PRO 专业版</strong>中，会自动播放实时<strong>声音反馈（合格为清脆双音和弦提示音，超差不合格为低沉警告警报音）</strong>，无需时刻盯紧屏幕即可掌握施工合格状况。",

            title_4: "4. [PRO] 焊接日常检查报告 (Excel · PDF · 移动端分享)",
            p_report_overview: "• <strong>当日检验数据一键汇总</strong>: 自动汇总当天所有焊接记录，实时呈现总测量数、合格数、超差点数及整体合格率(%)看板。",
            p_report_excel: "• <strong>[导出 Excel]</strong>: 一键下载包含工程名称、检测日期及质检人员信息的标准化 Excel 兼容报表。",
            p_report_pdf: "• <strong>[打印 PDF]</strong>: 自动生成排版精美的质检日报表 PDF，底部附带质检工程师与主管的签字确认栏。",
            p_report_share: "• <strong>[移动端分享]</strong>: 支持通过微信、短信、邮件一键分享日报表摘要及检测数据（支持 Web Share API）。",

            title_5: "5. 数据存储与历史管理 (本地500条 & 行内即时编辑)",
            p_auto_save: "• <strong>本地永久安全存储</strong>: 点击保存数据即可在设备浏览器内安全存放多达 500 条历史记录，无网络也能正常存储。",
            p_edit_mode: "• <strong>[✏️ 编辑模式]</strong>: 质检人员可在现场历史表格中直接修正 V、A、L、T 及工艺参数，系统会自动重新计算热输入与合格状态。",
            p_csv: "• <strong>[导出 CSV]</strong>: 一键导出带 UTF-8 BOM 编码的 CSV 报表，在 Microsoft Excel 中打开绝无中文乱码。",

            title_6: "6. [PRO] 许可证认证 & 硬件设备指纹",
            p_pro_hw: "• <strong>基于当前使用的硬件指纹设备码发行 Pro 兑换码。</strong>",
            p_pro_step1: "• <strong>第1步 (查看设备码)</strong>: 点击顶部 <strong>[FREE]</strong> 徽章打开设置窗口，查看您的 5 位专属<strong>设备唯一编号</strong>。",
            p_pro_step2: "• <strong>第2步 (邮箱秒发 & 咖啡赞助)</strong>: 输入姓名和邮箱 3 秒内极速获取专属兑换码（若未收到请检查垃圾邮件箱），并通过 <strong>Buy Me a Coffee</strong> (全球) 或 <strong>KakaoPay</strong> (韩国) 完成赞助支持。",
            p_pro_step3: "• <strong>第3步 (永久激活)</strong>: 输入<strong>用户 / 设备编号</strong>与兑换码 (<code>HEAT-设备码-XXXXX-XXXXX</code>)，即可通过 SHA-256 离线安全激活 PRO 全部特权。",

            title_7: "7. 添加到主屏幕 (PWA) & 100% 离线脱机运行指南",
            p_shortcut_1: "• <strong>添加到主屏幕 (Heat-Input Calc)</strong>: 将带有官方图标与应用名称 (<strong>Heat-Input Calc</strong>) 的快捷方式添加至手机或电脑桌面，享受如原生应用般的启动体验。",
            p_shortcut_2: "• <strong>100% 离线无网可用</strong>: 应用程序与上次作业数据已完整缓存，<strong>在船体分段内部、地下管廊或远海平台等完全无信号环境，依然能无障碍进行计算与数据保存</strong>。",
            p_shortcut_3: "• <strong>联网自动同步更新（可点击顶部网络图标手动即时同步）</strong>: 离线状态下保存的待同步记录 (<code>⏳ 待更新</code>) 会在网络连通的瞬间自动更新为最新状态 (<code>✓</code>)。您也可以随时点击顶部标题栏的<strong>网络图标 (Wi-Fi 标识)</strong> 立即执行手动强制同步与状态核验。",
            btn_open_shortcut: "📲 添加到主屏幕快捷方式 (Heat-Input Calc)",

            legal_title: "法律声明 (Legal Notice):",
            legal_1: "1. 本程序计算公式依据 AWS D1.1 / ASME Sec. IX 与 ISO 1011-1 / ISO 15614-1 标准设计，仅作现场辅助参考。实际施工前必须经批准的 WPS 及专业焊接工程师确认，开发者不承担直接套用造成的连带法律责任。",
            legal_2: "2. Free 免费版仅供非商业用途，输入官方兑换码即可永久解锁 PRO 全部专业功能。",
            legal_3: "3. 严禁未经授权修改、逆向工程、反编译或进行商业性二次分发。"
        },
        ja: {
            modal_title: "📘 使用マニュアル",
            title_1: "1. 規格およびプロセス係数・入熱量計算式",
            formula: "HI = (k × V × A × T) / (L × 1000) (単位: kJ/mm)",
            vars: "• <strong>k</strong>: 規格・プロセス熱効率係数 | <strong>V</strong>: 電圧 (V) | <strong>A</strong>: 電流 (A) | <strong>T</strong>: 溶接時間 (秒) | <strong>L</strong>: 溶接長 (mm)",
            th_std: "規格",
            th_proc: "溶接プロセス",
            th_k: "k 係数",
            aws_desc: "全プロセス共通 (FCAW, GMAW, SMAW, GTAW, SAW)",
            iso_saw: "SAW (サブマージアーク - 121) · EGW (73) · ESW (72)",
            iso_tig: "GTAW (TIG - 141) · PAW (プラズマ - 15)",
            iso_etc: "汎用アーク (SMAW 111 · GMAW 135 · FCAW 136/138) · HLAW (0.8)",
            iso_beam: "[PRO] 高エネルギービーム: LBW (レーザー - 52 : 0.75) · EBW (電子ビーム - 51 : 0.95)",
            p_pro_proc: "• <strong>[PRO] 高能率特殊アークおよび先端ビーム溶接プロセス解放</strong>: 汎用5大プロセスに加え、<strong>PAW</strong>（プラズマ）、<strong>EGW</strong>（エレクトロガス）、<strong>ESW</strong>（エレクトロスラグ）、<strong>LBW</strong>（レーザー）、<strong>HLAW</strong>（ハイブリッド）、<strong>EBW</strong>（電子ビーム）の規格熱効率係数($k$)が解放され、精密な入熱管理が可能になります。",
            p_auto_k: "• <strong>WPS自動認識</strong>: WPS番号やパス名に含まれるプロセス記号（SAW 121、FCAW 136等）から対象プロセスおよび規格別k係数を自動同期します。",

            title_2: "2. WPS・溶接士プリセット管理＆ヘルメットスキャン",
            p_free_ver: "• <span class='manual-free-tag'>Free 版</span>: WPS・溶接士プリセット各最大10件保存（.txtサンプルDLおよび10件以下のアップロード許可）、PDF抽出・プリセット編集・ヘルメットスキャン・ラベル印刷はロック(🔒)",
            p_pro_ver: "• <span class='manual-pro-tag'>PRO 版</span>: WPS・溶接士プリセット各最大300件の大容量保存、PDF自動抽出、対話型編集（置換/統合/維持）、📷 ヘルメットスキャン（QR・バーコード・一般ステッカーOCR自動入力）および 🏷️ A4ラベル一括印刷",
            p_manual: "• <strong>手動モード</strong>: WPS番号、最小/最大入熱範囲、溶接士情報を直接入力して即時計算します。",
            p_preset: "• <strong>プリセットモード (2段階選択)</strong>: WPS番号(1段階)を選択後、パス別入熱範囲(2段階)をワンクリックで迅速に適用します。",
            p_txt: "• <strong>TXTサンプル / アップロード / バックアップ</strong>: タブ区切りの .txt サンプルをダウンロードしてExcel等で編集後の一括アップロードや安全なバックアップが可能です。",
            p_pdf: "• <strong>[PRO] PDF自動抽出＆対話型エディタ</strong>: [PDF] ボタンからWPS文書や資格一覧表PDFの表データを自動抽出し、ポップアップ画面で確認・編集後に置換または統合できます。",
            p_scan: "• <strong>[PRO] 溶接士ヘルメットスキャン (QR・バーコード・文字OCR)</strong>: [📷 スキャン] ボタンでヘルメットや名札のQR/バーコード、文字ステッカー（氏名、社員番号、SAW 121等）をカメラや画像から自動認識します。",
            p_label: "• <strong>[PRO] ヘルメットラベル一括生成・印刷</strong>: [🏷️ ラベル印刷] ボタンで登録された全溶接士のラベル（QRコード、バーコード、両方＋下部テキスト表示）を一括生成し、A4用紙サイズで印刷します。",

            title_3: "3. 測定データ入力＆モバイル横2列最適化",
            p_mobile_2col: "• <strong>モバイル横2列最適化 (New)</strong>: 狭いスマートフォン画面でも最小/最大値および電圧(V)、電流(A)、長さ(L)、時間(T)の入力枠が1行に2つずつ(2列)配置され、画面スクロールなしでステッパー(+/-)による精密調整が可能です。",
            p_time_dual: "• <strong>分:秒デュアル制御</strong>: 総秒数入力と下部の分(MIN):秒(SEC)入力がリアルタイムで連動し、長時間の溶接も直感的に入力できます。",
            p_validate: "• <strong>リアルタイム合否判定＆[PRO] 判定サウンド出力</strong>: 入熱量がWPS許容範囲内であれば緑色(PASS)、範囲外であれば赤色(FAIL)で結果バナーが更新されます。さらに <strong>PRO 版</strong>では、画面を凝視しなくても施工結果を即座に把握できるよう、<strong>合格（軽快な2和音チャイム）／不合格（警告ビープ音）の音声フィードバック</strong>がリアルタイムで自動出力されます。",

            title_4: "4. [PRO] 溶接日常検査報告書 (Excel · PDF · モバイル共有)",
            p_report_overview: "• <strong>当日検査データのワンクリック集計</strong>: 当日記録されたすべての溶接データを自動集計し、総測定件数、合格数、不合格数、合格率(%)をダッシュボードで即座に算出します。",
            p_report_excel: "• <strong>[Excel 出力]</strong>: プロジェクト名、検査日、検査員情報が含まれた標準形式のExcel互換データをダウンロードします。",
            p_report_pdf: "• <strong>[PDF 印刷]</strong>: 印刷および承認に適した溶接検査報告書（検査員および責任者の正式署名欄付き）をPDF出力または即時印刷します。",
            p_report_share: "• <strong>[モバイル共有]</strong>: LINE、SMS、メール等で現場検査報告書のサマリーとデータをワンタップで送信できます（Web Share API対応）。",

            title_5: "5. データ保存＆履歴管理 (端末500件＆インライン即時編集)",
            p_auto_save: "• <strong>ローカル安全保存</strong>: 保存ボタンを押すと日時・規格・プロセス・WPS・溶接士・V/A/L/T・入熱量・判定結果がブラウザ内に最大500件まで安全に保持されます（オフライン完全対応）。",
            p_edit_mode: "• <strong>[✏️ 編集モード]</strong>: 履歴テーブル内で直接V、A、L、Tや条件を修正でき、修正と同時に自動で入熱量と合否が再計算されます。",
            p_csv: "• <strong>[CSV 出力]</strong>: 全履歴をExcelで文字化けしないUTF-8 with BOM形式のCSVファイルとして出力できます。",

            title_6: "6. [PRO] ライセンス認証＆ハードウェア端末番号",
            p_pro_hw: "• <strong>使用中のハードウェア指紋端末番号に基づいてProリディームコードが発行されます。</strong>",
            p_pro_step1: "• <strong>ステップ1 (端末番号確認)</strong>: 上部の <strong>[FREE]</strong> バッジを押して設定画面を開き、5桁の<strong>端末固有番号</strong>を確認します。",
            p_pro_step2: "• <strong>ステップ2 (メール即時発行＆サポート)</strong>: お名前とメールアドレスを入力して3秒でリディームコードを受信（届かない場合は迷惑メールフォルダをご確認ください）、<strong>Buy Me a Coffee</strong>（海外）または<strong>カカオペイ</strong>（韓国）でコーヒーサポートをお送りください。",
            p_pro_step3: "• <strong>ステップ3 (永久有効化)</strong>: <strong>ユーザー / 端末番号</strong>とコード（<code>HEAT-端末番号-XXXXX-XXXXX</code>）を入力すると、オフライン環境でもSHA-256暗号化認証により全PRO機能が永久に有効化されます。",

            title_7: "7. ホーム画面に追加 (PWA) ＆ 100% オフライン運用ガイド",
            p_shortcut_1: "• <strong>ホーム画面に追加 (Heat-Input Calc)</strong>: スマートフォンやPCのホーム画面に専用アイコンとアプリ名（<strong>Heat-Input Calc</strong>）で追加すると、ネイティブアプリのように起動できます。",
            p_shortcut_2: "• <strong>100% オフライン稼働</strong>: アプリ本体と直前の作業環境が端末に完全キャッシュされ、<strong>船舶ブロック内や地下ピット等の電波が届かないオフライン現場でも直前の環境のまま入熱量計算とデータ保存が可能</strong>です。",
            p_shortcut_3: "• <strong>オンライン復帰時の自動同期（上部ネットワークマークのクリックで手動即時同期可能）</strong>: オフライン中に保存された保留データ（<code>⏳ 待機</code>）は、インターネット再接続時に自動で最新状態（<code>✓</code>）へ安全に更新されます。また、上部ヘッダーの<strong>ネットワークマーク（Wi-Fi アイコン）</strong>をクリックすることで、いつでも任意のタイミングで手動即時同期を実行できます。",
            btn_open_shortcut: "📲 ホーム画面にショートカットを追加 (Heat-Input Calc)",

            legal_title: "法的告知 (Legal Notice):",
            legal_1: "1. 本プログラムの計算ロジックは AWS D1.1 / ASME Sec. IX および ISO 1011-1 / ISO 15614-1 の公式に基づいて設計されており、参考用です。実際の施工にあたっては承認されたWPSおよび専門技術者の確認を必ず経てください。",
            legal_2: "2. Free版は非営利目的に限り無料で使用でき、リディームコード認証によりPRO機能が永久に有効化されます。",
            legal_3: "3. 本プログラムの無断修正、変更、デバッグ、逆コンパイルおよび再配布を禁じます。"
        }
    },

    /**
     * 모달 내부에 사용 매뉴얼 렌더링 (아코디언 접기/열기 지원)
     */
    renderModal: function(lang, titleEl, bodyEl) {
        const d = this.dict[lang] || this.dict.ko;
        if (titleEl) titleEl.innerText = d.modal_title;
        if (!bodyEl) return;

        bodyEl.innerHTML = `
            <div class="manual-wrap">
                <!-- 1. 규격 및 계산 공식 (기본 열림) -->
                <details class="manual-accordion" open>
                    <summary class="manual-summary">${d.title_1}</summary>
                    <div class="manual-content">
                        <p style="font-size:14px; font-weight:800; color:var(--brand-orange); margin-bottom:6px;">${d.formula}</p>
                        <p style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">${d.vars}</p>
                        <div style="overflow-x:auto; margin-bottom:8px;">
                            <table style="width:100%; border-collapse:collapse; font-size:11.5px; line-height:1.35; text-align:center;" border="1">
                                <thead>
                                    <tr style="background:var(--bg-soft);">
                                        <th style="padding:5px 6px; border:1.5px solid var(--border-strong); font-weight:800;">${d.th_std}</th>
                                        <th style="padding:5px 6px; border:1.5px solid var(--border-strong); font-weight:800;">${d.th_proc}</th>
                                        <th style="padding:5px 6px; border:1.5px solid var(--border-strong); font-weight:800;">${d.th_k}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding:4px 6px; border:1px solid var(--border-light); font-weight:700;">AWS / ASME</td>
                                        <td style="padding:4px 6px; border:1px solid var(--border-light); text-align:left;">${d.aws_desc}</td>
                                        <td style="padding:4px 6px; border:1px solid var(--border-light); font-weight:800;">1.0</td>
                                    </tr>
                                    <tr>
                                        <td rowspan="4" style="padding:4px 6px; border:1px solid var(--border-light); font-weight:700;">ISO</td>
                                        <td style="padding:4px 6px; border:1px solid var(--border-light); text-align:left;">${d.iso_saw}</td>
                                        <td style="padding:4px 6px; border:1px solid var(--border-light); font-weight:800;">1.0</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:4px 6px; border:1px solid var(--border-light); text-align:left;">${d.iso_tig}</td>
                                        <td style="padding:4px 6px; border:1px solid var(--border-light); font-weight:800;">0.6</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:4px 6px; border:1px solid var(--border-light); text-align:left;">${d.iso_etc}</td>
                                        <td style="padding:4px 6px; border:1px solid var(--border-light); font-weight:800;">0.8</td>
                                    </tr>
                                    <tr style="background:var(--bg-card);">
                                        <td style="padding:4px 6px; border:1px solid var(--border-light); text-align:left; font-size:11px;">${d.iso_beam}</td>
                                        <td style="padding:4px 6px; border:1px solid var(--border-light); font-weight:800; font-size:11px;">0.75 / 0.95</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">${d.p_pro_proc || ''}</p>
                        <p style="font-size:12px; color:var(--text-muted); margin:0;">${d.p_auto_k || ''}</p>
                    </div>
                </details>

                <!-- 2. WPS 및 용접사 프리셋 & 스캔 -->
                <details class="manual-accordion">
                    <summary class="manual-summary">${d.title_2}</summary>
                    <div class="manual-content">
                        <div style="background:var(--bg-soft); padding:10px 12px; border-radius:8px; border:1px solid var(--border-light); margin-bottom:10px;">
                            <p style="margin-bottom:6px; font-size:12px;">${d.p_free_ver}</p>
                            <p style="margin:0; font-size:12px; font-weight:700;">${d.p_pro_ver}</p>
                        </div>
                        <p style="margin-bottom:6px;">${d.p_manual}</p>
                        <p style="margin-bottom:6px;">${d.p_preset}</p>
                        <p style="margin-bottom:6px;">${d.p_txt}</p>
                        <p style="margin-bottom:6px;">${d.p_pdf}</p>
                        <p style="margin-bottom:6px;">${d.p_scan}</p>
                        <p style="margin:0;">${d.p_label}</p>
                    </div>
                </details>

                <!-- 3. 측정 입력 & 모바일 2열 최적화 -->
                <details class="manual-accordion">
                    <summary class="manual-summary">${d.title_3}</summary>
                    <div class="manual-content">
                        <p style="margin-bottom:8px;">${d.p_mobile_2col}</p>
                        <p style="margin-bottom:8px;">${d.p_time_dual}</p>
                        <p style="margin:0;">${d.p_validate}</p>
                    </div>
                </details>

                <!-- 4. [PRO] 용접 변수 일일 검사 보고서 -->
                <details class="manual-accordion">
                    <summary class="manual-summary">${d.title_4}</summary>
                    <div class="manual-content">
                        <p style="margin-bottom:8px;">${d.p_report_overview}</p>
                        <div style="background:var(--bg-soft); padding:10px 12px; border-radius:8px; border:1px solid var(--border-light); margin-bottom:8px;">
                            <p style="margin-bottom:6px;">${d.p_report_excel}</p>
                            <p style="margin-bottom:6px;">${d.p_report_pdf}</p>
                            <p style="margin:0;">${d.p_report_share}</p>
                        </div>
                    </div>
                </details>

                <!-- 5. 데이터 저장 및 이력 관리 -->
                <details class="manual-accordion">
                    <summary class="manual-summary">${d.title_5}</summary>
                    <div class="manual-content">
                        <p style="margin-bottom:8px;">${d.p_auto_save}</p>
                        <p style="margin-bottom:8px;">${d.p_edit_mode}</p>
                        <p style="margin:0;">${d.p_csv}</p>
                    </div>
                </details>

                <!-- 6. [PRO] 라이선스 인증 & 하드웨어 기기번호 -->
                <details class="manual-accordion">
                    <summary class="manual-summary">${d.title_6}</summary>
                    <div class="manual-content">
                        <p style="margin-bottom:8px; color:var(--brand-orange); font-weight:700;">${d.p_pro_hw}</p>
                        <div style="background:var(--bg-soft); padding:10px 12px; border-radius:8px; border:1px solid var(--border-light);">
                            <p style="margin-bottom:6px;">${d.p_pro_step1}</p>
                            <p style="margin-bottom:6px;">${d.p_pro_step2}</p>
                            <p style="margin:0;">${d.p_pro_step3}</p>
                        </div>
                    </div>
                </details>

                <!-- 7. 홈화면 바로가기 추가 & 오프라인 작동 -->
                <details class="manual-accordion">
                    <summary class="manual-summary">${d.title_7}</summary>
                    <div class="manual-content">
                        <p style="margin-bottom:8px;">${d.p_shortcut_1}</p>
                        <p style="margin-bottom:8px;">${d.p_shortcut_2}</p>
                        <p style="margin-bottom:12px;">${d.p_shortcut_3}</p>
                        <button type="button" style="width:100%; background:var(--brand-orange); color:#fff; border:none; border-radius:8px; padding:10px 14px; font-size:13px; font-weight:900; cursor:pointer;" onclick="MainController.openShortcutModal(false)">
                            ${d.btn_open_shortcut}
                        </button>
                    </div>
                </details>

                <!-- 8. 법적 고지 -->
                <section style="font-size:11px; color:var(--text-muted); border-top:1px solid var(--border-light); padding-top:12px; margin-top:4px;">
                    <strong style="display:block; margin-bottom:4px; font-weight:800; color:var(--text-primary);">${d.legal_title}</strong>
                    <div style="margin-bottom:3px;">${d.legal_1}</div>
                    <div style="margin-bottom:3px;">${d.legal_2}</div>
                    <div>${d.legal_3}</div>
                </section>
            </div>
        `;
    }
};
