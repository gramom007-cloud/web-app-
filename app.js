/**
 * Merit Physiotherapy Clinic - Frontend Application Controller
 * Handles HN Auto-running (starting from 00001), Real-time BMI calculation & interpretation,
 * Demographics, Assessment, Search Filtering, A4 Medical Record Printing, and Modals.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let currentEditingHN = null;
  let allPatients = [];
  let pendingDeleteHN = null;

  // HTML Escape Utility (Prevents XSS and ReferenceError)
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  const escapeHTML = escapeHtml;
  window.escapeHtml = escapeHtml;
  window.escapeHTML = escapeHtml;

  // =========================================================================
  // DOM SELECTORS
  // =========================================================================
  // Tabs & Nav
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const topTitle = document.getElementById('top-title');
  const topSubtitle = document.getElementById('top-subtitle');

  // Top Bar Actions
  const btnNewPatient = document.getElementById('btn-new-patient');
  const btnSavePatient = document.getElementById('btn-save-patient');
  const btnSaveFromDiag = document.getElementById('btn-save-from-diag');
  const editingIndicator = document.getElementById('editing-indicator');
  const editHnTag = document.getElementById('edit-hn-tag');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');

  // Tab Navigation Buttons
  const btnNextToDiag = document.getElementById('btn-next-to-diag');
  const btnBackToPatient = document.getElementById('btn-back-to-patient');

  // Form Fields - Tab 1
  const patientHnInput = document.getElementById('patient-hn');
  const btnGenHn = document.getElementById('btn-gen-hn');
  const treatmentDateInput = document.getElementById('treatment-date');
  const nationalIdInput = document.getElementById('national-id');
  const firstNameInput = document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const genderSelect = document.getElementById('gender');
  const dobDaySelect = document.getElementById('dob-day');
  const dobMonthSelect = document.getElementById('dob-month');
  const dobYearSelect = document.getElementById('dob-year');
  const patientAgeInput = document.getElementById('patient-age');
  const ethnicityInput = document.getElementById('ethnicity');
  const phoneInput = document.getElementById('phone');
  const patientAddressInput = document.getElementById('patient-address');

  // Emergency Contact
  const emergencyNameInput = document.getElementById('emergency-name');
  const emergencyPhoneInput = document.getElementById('emergency-phone');
  const emergencyRelationInput = document.getElementById('emergency-relation');

  // Vital Signs & BMI
  const vitalBpInput = document.getElementById('vital-bp');
  const vitalPrInput = document.getElementById('vital-pr');
  const vitalWeightInput = document.getElementById('vital-weight');
  const vitalHeightInput = document.getElementById('vital-height');
  const displayBmi = document.getElementById('display-bmi');
  const displayBmiStatus = document.getElementById('display-bmi-status');

  // History & Alerts
  const underlyingDiseaseInput = document.getElementById('underlying-disease');
  const chiefComplaintInput = document.getElementById('chief-complaint');
  const subjectiveExamInput = document.getElementById('subjective-exam');
  const drugAllergyInput = document.getElementById('drug-allergy');
  const contraindicationsInput = document.getElementById('contraindications');

  // Form Fields - Tab 2 (Diagnosis & Physical Examination)
  const examObservation = document.getElementById('exam-observation');
  const examPalpation = document.getElementById('exam-palpation');
  const examMeasurement = document.getElementById('exam-measurement');
  const examPhysical = document.getElementById('exam-physical');
  const examActiveTest = document.getElementById('exam-active-test');
  const examPassiveTest = document.getElementById('exam-passive-test');
  const examSpecialTest = document.getElementById('exam-special-test');
  const examDiagnosis = document.getElementById('exam-diagnosis');
  const examTreatment = document.getElementById('exam-treatment');

  // Tab 3 Search & Table
  const tableSearchInput = document.getElementById('table-search-input');
  const patientTableTbody = document.getElementById('patient-table-tbody');
  const recordCountText = document.getElementById('record-count-text');
  const customDateRangeBox = document.getElementById('custom-date-range');
  const filterDateFromInput = document.getElementById('filter-date-from');
  const filterDateToInput = document.getElementById('filter-date-to');
  const btnClearCustomDate = document.getElementById('btn-clear-custom-date');

  // Tab 3 Pagination Selectors
  const tablePaginationBar = document.getElementById('table-pagination-bar');
  const rowsPerPageSelect = document.getElementById('rows-per-page-select');
  const paginationInfo = document.getElementById('pagination-info');
  const btnFirstPage = document.getElementById('btn-first-page');
  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');
  const btnLastPage = document.getElementById('btn-last-page');
  const paginationPageNumbers = document.getElementById('pagination-page-numbers');

  // Modals
  const deleteModal = document.getElementById('delete-modal');
  const delHnDisplay = document.getElementById('del-hn-display');
  const delNameDisplay = document.getElementById('del-name-display');
  const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  const printModal = document.getElementById('print-modal');
  const btnClosePrintModal = document.getElementById('btn-close-print-modal');
  const btnTriggerPrint = document.getElementById('btn-trigger-print');

  const settingsModal = document.getElementById('settings-modal');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettingsModal = document.getElementById('btn-close-settings-modal');
  const btnCancelSettings = document.getElementById('btn-cancel-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const settingsApiUrl = document.getElementById('settings-api-url');
  const settingsApiKey = document.getElementById('settings-api-key');
  const btnExportBackup = document.getElementById('btn-export-backup');

  // Google Drive Attachments (Tab 2)
  const driveCurrentHn = document.getElementById('drive-current-hn');
  const driveCurrentName = document.getElementById('drive-current-name');
  const drivePatientFolderLink = document.getElementById('drive-patient-folder-link');
  const btnRefreshFiles = document.getElementById('btn-refresh-files');
  const driveDropzone = document.getElementById('drive-dropzone');
  const driveFileInput = document.getElementById('drive-file-input');
  const driveSelectedPreview = document.getElementById('drive-selected-preview');
  const previewFileIcon = document.getElementById('preview-file-icon');
  const previewFileName = document.getElementById('preview-file-name');
  const previewFileSize = document.getElementById('preview-file-size');
  const btnClearFile = document.getElementById('btn-clear-file');
  const driveFileCategory = document.getElementById('drive-file-category');
  const driveFileCustomDesc = document.getElementById('drive-file-custom-desc');
  const btnUploadDrive = document.getElementById('btn-upload-drive');
  const driveFilesCountBadge = document.getElementById('drive-files-count-badge');
  const driveFilesContainer = document.getElementById('drive-files-container');

  // Lightbox Preview Modal
  const imagePreviewModal = document.getElementById('image-preview-modal');
  const lightboxBody = document.getElementById('lightbox-body');
  const lightboxFileName = document.getElementById('lightbox-file-name');
  const lightboxFileMeta = document.getElementById('lightbox-file-meta');
  const lightboxDriveLink = document.getElementById('lightbox-drive-link');
  const lightboxDownloadLink = document.getElementById('lightbox-download-link');
  const btnCloseLightbox = document.getElementById('btn-close-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxLoader = document.getElementById('lightbox-loader');
  const lightboxError = document.getElementById('lightbox-error');
  const lightboxErrorDriveLink = document.getElementById('lightbox-error-drive-link');
  const btnLightboxZoomIn = document.getElementById('btn-lightbox-zoom-in');
  const btnLightboxZoomOut = document.getElementById('btn-lightbox-zoom-out');
  const btnLightboxZoomReset = document.getElementById('btn-lightbox-zoom-reset');
  const lightboxZoomLevelText = document.getElementById('lightbox-zoom-level-text');

  // Settings Connection Test
  const btnTestConnection = document.getElementById('btn-test-connection');
  const btnFixHn = document.getElementById('btn-fix-hn');
  const connectionResultBox = document.getElementById('connection-result-box');
  const connResultTitle = document.getElementById('conn-result-title');
  const connResultMessage = document.getElementById('conn-result-message');
  const connResultDetails = document.getElementById('conn-result-details');
  const connSheetName = document.getElementById('conn-sheet-name');
  const connFolderName = document.getElementById('conn-folder-name');
  const connPatientsCount = document.getElementById('conn-patients-count');
  const connLatency = document.getElementById('conn-latency');
  const connResultActions = document.getElementById('conn-result-actions');
  const connDriveLink = document.getElementById('conn-drive-link');

  // Print Modal Drive Save
  const btnSaveDocDrive = document.getElementById('btn-save-doc-drive');
  let currentPrintPatient = null;
  let selectedDriveFile = null;

  // Tab 4 Appointment Selectors
  const apptSearchInput = document.getElementById('appt-search-input');
  const btnClearApptSearch = document.getElementById('btn-clear-appt-search');
  const apptSearchWrap = document.getElementById('appt-search-wrap');
  const apptControlsBar = document.getElementById('appt-controls-bar');
  const apptDateChipsWrap = document.getElementById('appt-date-chips-wrap');
  const apptStatCardsWrap = document.getElementById('appt-stat-cards-wrap');
  const apptFilterChips = document.querySelectorAll('[data-appt-filter]');
  const apptCustomDateRange = document.getElementById('appt-custom-date-range');
  const apptDateFrom = document.getElementById('appt-date-from');
  const apptDateTo = document.getElementById('appt-date-to');
  const btnClearApptDate = document.getElementById('btn-clear-appt-date');
  const btnRefreshAppointments = document.getElementById('btn-refresh-appointments');
  const apptSyncDot = document.getElementById('appt-sync-dot');
  const apptCalendarName = document.getElementById('appt-calendar-name');
  const apptStatsSummary = document.getElementById('appt-stats-summary');
  const statApptToday = document.getElementById('stat-appt-today');
  const statApptUpcoming = document.getElementById('stat-appt-upcoming');
  const statApptMonth = document.getElementById('stat-appt-month');
  const statApptTotal = document.getElementById('stat-appt-total');
  const apptScheduleContainer = document.getElementById('appt-schedule-container');

  // View Switcher & Calendar Embed
  const btnViewAgenda = document.getElementById('btn-view-agenda');
  const btnViewCalendar = document.getElementById('btn-view-calendar');
  const apptCalendarEmbedContainer = document.getElementById('appt-calendar-embed-container');
  const googleCalendarIframe = document.getElementById('google-calendar-iframe');
  const btnReloadCalendarIframe = document.getElementById('btn-reload-calendar-iframe');
  const btnNewCalendarEvent = document.getElementById('btn-new-calendar-event');
  const settingsCalendarId = document.getElementById('settings-calendar-id');

  // Create Appointment Modal Selectors
  const createApptModal = document.getElementById('create-appt-modal');
  const formCreateAppt = document.getElementById('form-create-appt');
  const apptPatientSearch = document.getElementById('appt-patient-search');
  const apptPatientDropdown = document.getElementById('appt-patient-dropdown');
  const apptSelectedHN = document.getElementById('appt-selected-hn');
  const btnClearApptPatient = document.getElementById('btn-clear-appt-patient');
  const apptTitleInput = document.getElementById('appt-title-input');
  const apptFormDate = document.getElementById('appt-form-date');
  const apptFormTimeStart = document.getElementById('appt-form-time-start');
  const apptFormTimeEnd = document.getElementById('appt-form-time-end');
  const apptFormLocation = document.getElementById('appt-form-location');
  const apptFormDesc = document.getElementById('appt-form-desc');
  const btnCloseCreateApptModal = document.getElementById('btn-close-create-appt-modal');
  const btnCancelCreateAppt = document.getElementById('btn-cancel-create-appt');
  const btnSubmitCreateAppt = document.getElementById('btn-submit-create-appt');

  // Delete Appointment Modal Selectors
  const deleteApptModal = document.getElementById('delete-appt-modal');
  const delApptTitleDisplay = document.getElementById('del-appt-title-display');
  const delApptTimeDisplay = document.getElementById('del-appt-time-display');
  const btnCloseDeleteApptModal = document.getElementById('btn-close-delete-appt-modal');
  const btnCancelDeleteAppt = document.getElementById('btn-cancel-delete-appt');
  const btnConfirmDeleteAppt = document.getElementById('btn-confirm-delete-appt');

  // Tab 4 Appointment State
  let allAppointments = [];
  let pendingDeleteAppt = null;
  let activeApptFilter = 'today'; // 'today', 'upcoming7', 'thisMonth', 'custom'
  let activeApptViewMode = 'agenda'; // 'agenda' or 'calendar'
  let apptCustomFrom = '';
  let apptCustomTo = '';
  let cachedCalendarId = '';
  let apptRenderLimit = 20;
  let apptSearchTimeout = null;

  // Tab 5 Billing & Receipts Selectors
  const billingMonthSelect = document.getElementById('billing-month-select');
  const bStatRevenue = document.getElementById('b-stat-revenue');
  const bStatPatients = document.getElementById('b-stat-patients');
  const bStatBillsCount = document.getElementById('b-stat-bills-count');
  const bStatAvg = document.getElementById('b-stat-avg');
  const bStatCash = document.getElementById('b-stat-cash');
  const bStatTransfer = document.getElementById('b-stat-transfer');
  const bStatCard = document.getElementById('b-stat-card');
  const btnExportBillingCsv = document.getElementById('btn-export-billing-csv');

  // Cashier & Bill Form Selectors
  const billPatientSearch = document.getElementById('bill-patient-search');
  const billPatientDropdown = document.getElementById('bill-patient-dropdown');
  const billSelectedHN = document.getElementById('bill-selected-hn');
  const billSelectedName = document.getElementById('bill-selected-name');
  const billSelectedPhone = document.getElementById('bill-selected-phone');
  const btnClearBillPatient = document.getElementById('btn-clear-bill-patient');
  const billDate = document.getElementById('bill-date');
  const billCashierName = document.getElementById('bill-cashier-name');
  const btnAddCustomItem = document.getElementById('btn-add-custom-item');
  const billItemsTable = document.getElementById('bill-items-table');
  const billItemsTbody = document.getElementById('bill-items-tbody');
  const billNotes = document.getElementById('bill-notes');
  const billSubtotalDisplay = document.getElementById('bill-subtotal-display');
  const btnDiscountBaht = document.getElementById('btn-discount-baht');
  const btnDiscountPercent = document.getElementById('btn-discount-percent');
  const billDiscountInput = document.getElementById('bill-discount-input');
  const billDiscountCalcDisplay = document.getElementById('bill-discount-calc-display');
  const billNetTotalDisplay = document.getElementById('bill-net-total-display');
  const btnClearBill = document.getElementById('btn-clear-bill');
  const btnSaveBillOnly = document.getElementById('btn-save-bill-only');
  const btnSavePrintBill = document.getElementById('btn-save-print-bill');

  // Receipts History Selectors
  const historyMonthLabel = document.getElementById('history-month-label');
  const receiptsHistoryTbody = document.getElementById('receipts-history-tbody');
  const billingPaginationBar = document.getElementById('billing-pagination-bar');
  const billingPaginationInfo = document.getElementById('billing-pagination-info');
  const btnBillingPrevPage = document.getElementById('btn-billing-prev-page');
  const btnBillingNextPage = document.getElementById('btn-billing-next-page');
  const billingPaginationPages = document.getElementById('billing-pagination-pages');

  // Quick Patient Chips Selectors
  const quickPatientContainer = document.getElementById('quick-patient-container');
  const quickPatientChips = document.getElementById('quick-patient-chips');

  // Printable Receipt Modal Selectors
  const receiptModal = document.getElementById('receipt-modal');
  const btnTriggerPrintReceipt = document.getElementById('btn-trigger-print-receipt');
  const btnCloseReceiptModal = document.getElementById('btn-close-receipt-modal');
  const recSlipOriginal = document.getElementById('rec-slip-original');
  const recSlipCopy = document.getElementById('rec-slip-copy');

  // Tab 5 Billing State
  let currentBillItems = [];
  let allReceipts = [];
  let activeBillingMonth = ''; // 'YYYY-MM'
  let billDiscountType = 'baht'; // 'baht' or 'percent'
  let currentActiveReceiptForPrint = null;
  let billingCurrentPage = 1;
  const billingRowsPerPage = 15;

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  function init() {
    setupDateDropdowns();
    setDefaultTreatmentDate();
    setupTabSwitching();
    setupVitalSignsAndBMI();
    setupNationalIdFormatter();
    setupPhoneFormatter();
    setupEventListeners();
    setupDriveIntegration();
    setupAppointments();
    populateAppointmentTimeDropdowns();
    api.clearLocalCalendarCache();
    setupBillingSystem();
    loadPatients();

    // Set initial auto-HN
    if (!patientHnInput.value) {
      patientHnInput.value = generateNextHN();
    }

    const isOnline = api.isOnline();
    const statusTextEl = document.getElementById('system-status-text');
    if (statusTextEl) {
      statusTextEl.textContent = isOnline
        ? 'เชื่อมต่อ Google Sheets & Drive สำเร็จ'
        : 'โหมดจำลองในเครื่อง (Offline)';
    }

    updateDrivePatientContext();
  }

  // =========================================================================
  // HN AUTO-RUNNING LOGIC (Starts from 00001)
  // =========================================================================
  /**
   * Generates the next HN starting from 00001.
   * Scans all records and finds the highest numerical HN sequence.
   */
  function generateNextHN() {
    if (!allPatients || allPatients.length === 0) {
      return '00001';
    }

    let maxNum = 0;
    allPatients.forEach(p => {
      if (!p.hn) return;
      // Extract numeric part from HN (supports '00001', 'HN-00001', 'PT-00001', etc.)
      const cleaned = String(p.hn).trim();
      const numMatch = cleaned.match(/(\d+)/g);
      if (numMatch && numMatch.length > 0) {
        // Get the last numeric group
        const num = parseInt(numMatch[numMatch.length - 1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextVal = maxNum + 1;
    // Format with 5 digits minimum (e.g. 00001, 00002... 99999)
    return String(nextVal).padStart(5, '0');
  }

  // =========================================================================
  // DATE & AGE HANDLING (BUDDHIST ERA)
  // =========================================================================
  function getTodayBEString() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearBE = now.getFullYear() + 543;
    return `${day}/${month}/${yearBE}`;
  }

  function formatTreatmentDateString(val) {
    return api.formatTreatmentDate(val);
  }

  function setDefaultTreatmentDate() {
    if (!treatmentDateInput.value) {
      treatmentDateInput.value = getTodayBEString();
    } else {
      treatmentDateInput.value = formatTreatmentDateString(treatmentDateInput.value);
    }
  }

  function setupDateDropdowns() {
    // Days 1-31
    dobDaySelect.innerHTML = '<option value="">วัน</option>';
    for (let d = 1; d <= 31; d++) {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      dobDaySelect.appendChild(opt);
    }

    // Years BE (Current Year down 100 years)
    const currentYearBE = new Date().getFullYear() + 543;
    dobYearSelect.innerHTML = '<option value="">ปี พ.ศ.</option>';
    for (let y = currentYearBE; y >= currentYearBE - 100; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      dobYearSelect.appendChild(opt);
    }

    // Age Auto-Calculator Event
    const calculateAge = () => {
      const day = parseInt(dobDaySelect.value, 10);
      const month = parseInt(dobMonthSelect.value, 10);
      const yearBE = parseInt(dobYearSelect.value, 10);

      if (yearBE) {
        const yearCE = yearBE - 543;
        const now = new Date();
        const birthDate = new Date(yearCE, (month || 1) - 1, day || 1);

        let age = now.getFullYear() - birthDate.getFullYear();
        const monthDiff = now.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
          age--;
        }

        patientAgeInput.value = age >= 0 ? age : 0;
      } else {
        patientAgeInput.value = '';
      }
    };

    dobDaySelect.addEventListener('change', calculateAge);
    dobMonthSelect.addEventListener('change', calculateAge);
    dobYearSelect.addEventListener('change', calculateAge);
  }

  // =========================================================================
  // VITAL SIGNS & BMI AUTO-CALCULATION
  // =========================================================================
  function setupVitalSignsAndBMI() {
    const calculateBMI = () => {
      const weight = parseFloat(vitalWeightInput.value);
      const height = parseFloat(vitalHeightInput.value);

      if (weight > 0 && height > 0) {
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);
        const roundedBMI = bmi.toFixed(1);

        displayBmi.textContent = roundedBMI;

        // Asian BMI Cutoffs & Interpretations
        let statusText = '';
        let chipClass = '';

        if (bmi < 18.5) {
          statusText = 'ผอม / ต่ำกว่าเกณฑ์';
          chipClass = 'bmi-chip-underweight';
        } else if (bmi <= 22.9) {
          statusText = 'สมส่วน / ปกติ';
          chipClass = 'bmi-chip-normal';
        } else if (bmi <= 24.9) {
          statusText = 'น้ำหนักเกิน / ท้วม';
          chipClass = 'bmi-chip-overweight';
        } else if (bmi <= 29.9) {
          statusText = 'โรคอ้วนระดับ 1';
          chipClass = 'bmi-chip-obese1';
        } else {
          statusText = 'โรคอ้วนระดับ 2';
          chipClass = 'bmi-chip-obese2';
        }

        displayBmiStatus.textContent = statusText;
        displayBmiStatus.className = `bmi-interpretation-chip ${chipClass}`;
      } else {
        displayBmi.textContent = '-';
        displayBmiStatus.textContent = 'รอข้อมูลส่วนสูง/น้ำหนัก';
        displayBmiStatus.className = 'bmi-interpretation-chip';
      }
    };

    vitalWeightInput.addEventListener('input', calculateBMI);
    vitalHeightInput.addEventListener('input', calculateBMI);
  }

  // National ID Format check (13 Digits)
  function setupNationalIdFormatter() {
    nationalIdInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 13) val = val.substring(0, 13);
      e.target.value = val;
    });
  }

  // Phone Number Format check (Auto leading 0 & max 10 Digits)
  function setupPhoneFormatter() {
    [phoneInput, emergencyPhoneInput].forEach(input => {
      if (!input) return;
      input.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^\d]/g, '');
        if (val.length > 10) val = val.substring(0, 10);
        e.target.value = val;
      });

      input.addEventListener('blur', (e) => {
        const val = e.target.value.trim();
        if (val) {
          e.target.value = api.formatPhone(val);
        }
      });
    });
  }

  // =========================================================================
  // TAB NAVIGATION
  // =========================================================================
  function setupTabSwitching() {
    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    btnNextToDiag.addEventListener('click', () => {
      switchTab('diagnosis-tab');
    });

    btnBackToPatient.addEventListener('click', () => {
      switchTab('patient-tab');
    });
  }

  function switchTab(tabId) {
    navItems.forEach(b => {
      if (b.getAttribute('data-tab') === tabId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    tabPanes.forEach(pane => {
      if (pane.id === tabId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Update Top Header Titles
    if (tabId === 'patient-tab') {
      topTitle.innerHTML = '<i class="fa-solid fa-user-injured" style="color: var(--primary-light);"></i> <span>ข้อมูลคนไข้</span>';
      topSubtitle.textContent = 'บันทึกข้อมูลส่วนตัว ประวัติการรักษา และสัญญาณชีพ';
    } else if (tabId === 'diagnosis-tab') {
      topTitle.innerHTML = '<i class="fa-solid fa-stethoscope" style="color: var(--primary-light);"></i> <span>ข้อมูลการวินิจฉัย</span>';
      topSubtitle.textContent = 'ผลการตรวจร่างกายทางกายภาพบำบัด การวินิจฉัย และแผนการรักษา';
      updateDrivePatientContext();
    } else if (tabId === 'search-tab') {
      topTitle.innerHTML = '<i class="fa-solid fa-magnifying-glass" style="color: var(--primary-light);"></i> <span>ค้นหาข้อมูล</span>';
      topSubtitle.textContent = 'สืบค้นข้อมูลเวชระเบียน แก้ไข ลบ และพิมพ์รายงาน A4';
      loadPatients();
    } else if (tabId === 'appointment-tab') {
      topTitle.innerHTML = '<i class="fa-solid fa-calendar-check" style="color: var(--primary-light);"></i> <span>ตารางนัดหมาย</span>';
      topSubtitle.textContent = 'ตารางนัดหมายคนไข้จาก Google Calendar แก้ไขและจัดการผ่านปฏิทินของ Gmail';
      loadAppointments();
    } else if (tabId === 'billing-tab') {
      topTitle.innerHTML = '<i class="fa-solid fa-file-invoice-dollar" style="color: var(--primary-light);"></i> <span>คิดเงิน & ออกใบเสร็จ</span>';
      topSubtitle.textContent = 'คำนวณค่ารักษา จัดการส่วนลด ออกใบเสร็จรับเงิน และสรุปสถิติยอดรายเดือน';
      onSwitchToBillingTab();
    }

    // Scroll to top of viewport
    document.querySelector('.content-viewport').scrollTop = 0;
  }

  // =========================================================================
  // LOAD & RENDER PATIENT DATABASE (TAB 3) WITH QUICK FILTERS, SORTING & PAGINATION
  // =========================================================================
  // Filter, Sort & Pagination State
  let activeDateFilter = 'all'; // 'all', 'today', '7days', 'month', 'custom'
  let customDateFrom = '';
  let customDateTo = '';
  let currentSort = { column: 'treatmentDate', direction: 'desc' }; // default: newest treatment date first
  let currentPage = 1;
  let rowsPerPage = 20;

  /**
   * แปลงสตริงวันที่รักษา (DD/MM/YYYY พ.ศ. หรือ ค.ศ. หรือ ISO) เป็น JavaScript Date Object
   */
  function parseTreatmentDateToDate(str) {
    if (!str || typeof str !== 'string') return null;
    const cleanStr = str.trim().split(' ')[0]; // ตัดเวลาออกถ้ามี
    const parts = cleanStr.split(/[\/\-\.]/);
    if (parts.length !== 3) return null;

    let d, m, y;
    if (parts[0].length === 4) {
      // รูปแบบ YYYY-MM-DD
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else {
      // รูปแบบ DD/MM/YYYY
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
    }

    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    if (y >= 2400) y -= 543; // แปลง พ.ศ. เป็น ค.ศ. สำหรับการคำนวณ Date
    return new Date(y, m - 1, d);
  }

  async function loadPatients(query = '') {
    try {
      allPatients = await api.getPatients(query);
      applyFiltersAndSort();
      renderQuickTodayPatients();
    } catch (e) {
      console.error('Error fetching patients:', e);
      renderTable([], 0, 0, 0);
      renderPagination(0, 1, 0, 0);
    }
  }

  /**
   * รวมการกรองตามคำค้นหา ตัวกรองวันที่ การจัดเรียงลำดับตาราง และการแบ่งหน้า (Pagination)
   */
  function applyFiltersAndSort(resetPage = false) {
    if (resetPage) {
      currentPage = 1;
    }

    let result = [...allPatients];

    // 1. กรองตามคำค้นหา (Search Query)
    const q = tableSearchInput ? tableSearchInput.value.toLowerCase().trim() : '';
    if (q) {
      result = result.filter(p => {
        const name = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
        const phone = String(p.phone || '').toLowerCase();
        const hn = String(p.hn || '').toLowerCase();
        const diag = String(p.diagnosis || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || hn.includes(q) || diag.includes(q);
      });
    }

    // 2. กรองตามวันที่รักษา (Date Range Filter)
    if (activeDateFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      if (activeDateFilter === 'today') {
        result = result.filter(p => {
          const pDate = parseTreatmentDateToDate(p.treatmentDate);
          if (!pDate) return false;
          return pDate >= todayStart && pDate <= todayEnd;
        });
      } else if (activeDateFilter === '7days') {
        const past7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        result = result.filter(p => {
          const pDate = parseTreatmentDateToDate(p.treatmentDate);
          if (!pDate) return false;
          return pDate >= past7Days && pDate <= todayEnd;
        });
      } else if (activeDateFilter === 'month') {
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        result = result.filter(p => {
          const pDate = parseTreatmentDateToDate(p.treatmentDate);
          if (!pDate) return false;
          return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
        });
      } else if (activeDateFilter === 'custom') {
        let fromDate = null;
        let toDate = null;
        if (customDateFrom) {
          const [fy, fm, fd] = customDateFrom.split('-').map(Number);
          fromDate = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
        }
        if (customDateTo) {
          const [ty, tm, td] = customDateTo.split('-').map(Number);
          toDate = new Date(ty, tm - 1, td, 23, 59, 59, 999);
        }

        if (fromDate || toDate) {
          result = result.filter(p => {
            const pDate = parseTreatmentDateToDate(p.treatmentDate);
            if (!pDate) return false;
            if (fromDate && pDate < fromDate) return false;
            if (toDate && pDate > toDate) return false;
            return true;
          });
        }
      }
    }

    // 3. จัดเรียงลำดับข้อมูล (Sorting)
    const { column, direction } = currentSort;
    result.sort((a, b) => {
      let comp = 0;
      if (column === 'hn') {
        const numA = parseInt(String(a.hn).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.hn).replace(/\D/g, ''), 10) || 0;
        comp = numA - numB;
      } else if (column === 'treatmentDate') {
        const dateA = parseTreatmentDateToDate(a.treatmentDate);
        const dateB = parseTreatmentDateToDate(b.treatmentDate);
        const timeA = dateA ? dateA.getTime() : 0;
        const timeB = dateB ? dateB.getTime() : 0;
        comp = timeA - timeB;
      } else if (column === 'name') {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
        comp = nameA.localeCompare(nameB, 'th');
      }

      return direction === 'asc' ? comp : -comp;
    });

    // 4. อัปเดตไอคอนบนหัวตาราง
    updateSortIcons();

    // 5. คำนวณการแบ่งหน้า (Pagination Calculation)
    const totalItems = result.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
    const pageItems = result.slice(startIndex, endIndex);

    // 6. เรนเดอร์ตารางและตัวควบคุมการแบ่งหน้า
    renderTable(pageItems, totalItems, startIndex, endIndex);
    renderPagination(totalItems, totalPages, startIndex, endIndex);
  }

  /**
   * อัปเดตไอคอนลูกศรบนหัวตารางตามสถานะการเรียงลำดับปัจจุบัน
   */
  function updateSortIcons() {
    const sortHeaders = document.querySelectorAll('th.th-sortable');
    sortHeaders.forEach(th => {
      const col = th.getAttribute('data-sort');
      const icon = th.querySelector('.sort-icon');
      th.classList.remove('sorted-asc', 'sorted-desc');

      if (col === currentSort.column) {
        if (currentSort.direction === 'asc') {
          th.classList.add('sorted-asc');
          if (icon) icon.className = 'fa-solid fa-arrow-up-wide-short sort-icon';
        } else {
          th.classList.add('sorted-desc');
          if (icon) icon.className = 'fa-solid fa-arrow-down-wide-short sort-icon';
        }
      } else {
        if (icon) icon.className = 'fa-solid fa-sort sort-icon';
      }
    });
  }

  /**
   * เรนเดอร์ตารางคนไข้
   */
  function renderTable(patients, totalItems = 0, startIndex = 0, endIndex = 0) {
    patientTableTbody.innerHTML = '';
    
    // อัปเดตตัวเลขนับจำนวนรายการบนหัวตาราง
    if (allPatients.length > 0 && totalItems !== allPatients.length) {
      recordCountText.textContent = `พบข้อมูลคนไข้ ${totalItems} จากทั้งหมด ${allPatients.length} รายการ`;
    } else {
      recordCountText.textContent = `พบข้อมูลคนไข้ ${totalItems} รายการ`;
    }

    if (!patients || patients.length === 0) {
      patientTableTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
            <i class="fa-regular fa-folder-open" style="font-size: 32px; color: #cbd5e1; margin-bottom: 8px;"></i>
            <p style="font-size: 14.5px;">ไม่พบข้อมูลคนไข้ตามเงื่อนไข หรือยังไม่มีการบันทึก</p>
          </td>
        </tr>
      `;
      return;
    }

    patients.forEach(p => {
      const tr = document.createElement('tr');
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || '-';
      const hasContra = Boolean(p.contraindications && p.contraindications.trim() !== '' && p.contraindications.trim() !== '-');
      const hasAllergy = Boolean(p.drugAllergy && p.drugAllergy.trim() !== '' && p.drugAllergy.trim() !== '-');

      // Alert Badges
      let alertBadgeHtml = '';
      if (hasContra) {
        alertBadgeHtml += `<span class="badge-pink-caution" title="${escapeHtml(p.contraindications)}"><i class="fa-solid fa-ban"></i> ข้อควรระวัง</span> `;
      }
      if (hasAllergy) {
        alertBadgeHtml += `<span class="badge-yellow-allergy" title="${escapeHtml(p.drugAllergy)}"><i class="fa-solid fa-triangle-exclamation"></i> แพ้ยา</span>`;
      }
      if (!hasContra && !hasAllergy) {
        alertBadgeHtml = '<span style="color: #94a3b8; font-size: 12px;">- ปกติ -</span>';
      }

      tr.innerHTML = `
        <td><span class="hn-tag">${escapeHtml(p.hn || '-')}</span></td>
        <td>${escapeHtml(formatTreatmentDateString(p.treatmentDate) || '-')}</td>
        <td style="font-weight: 600; color: var(--primary-color);">${escapeHtml(fullName)}</td>
        <td>${escapeHtml(api.formatPhone(p.phone) || '-')}</td>
        <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(p.diagnosis || '-')}
        </td>
        <td>${alertBadgeHtml}</td>
        <td style="text-align: center;">
          <div class="action-btn-group" style="justify-content: center;">
            <button type="button" class="btn btn-sm btn-action-edit btn-edit-row" data-hn="${escapeHtml(p.hn)}" title="แก้ไขข้อมูล">
              <i class="fa-solid fa-pen"></i> แก้ไข
            </button>
            <button type="button" class="btn btn-sm btn-action-print btn-print-row" data-hn="${escapeHtml(p.hn)}" title="พิมพ์เวชระเบียน A4">
              <i class="fa-solid fa-print"></i> พิมพ์ A4
            </button>
            <button type="button" class="btn btn-sm btn-action-delete btn-del-row" data-hn="${escapeHtml(p.hn)}" data-name="${escapeHtml(fullName)}" title="ลบข้อมูล">
              <i class="fa-solid fa-trash-can"></i> ลบ
            </button>
          </div>
        </td>
      `;

      patientTableTbody.appendChild(tr);
    });

    // Attach Row Action Events
    document.querySelectorAll('.btn-edit-row').forEach(b => {
      b.addEventListener('click', () => {
        const hn = b.getAttribute('data-hn');
        editPatient(hn);
      });
    });

    document.querySelectorAll('.btn-print-row').forEach(b => {
      b.addEventListener('click', () => {
        const hn = b.getAttribute('data-hn');
        openPrintModal(hn);
      });
    });

    document.querySelectorAll('.btn-del-row').forEach(b => {
      b.addEventListener('click', () => {
        const hn = b.getAttribute('data-hn');
        const name = b.getAttribute('data-name');
        openDeleteModal(hn, name);
      });
    });
  }

  /**
   * เรนเดอร์แถบควบคุมการแบ่งหน้า (Pagination Bar)
   */
  function renderPagination(totalItems, totalPages, startIndex, endIndex) {
    if (!tablePaginationBar) return;

    if (totalItems === 0) {
      if (paginationInfo) paginationInfo.textContent = 'แสดง 0 รายการ';
      if (btnFirstPage) btnFirstPage.disabled = true;
      if (btnPrevPage) btnPrevPage.disabled = true;
      if (btnNextPage) btnNextPage.disabled = true;
      if (btnLastPage) btnLastPage.disabled = true;
      if (paginationPageNumbers) paginationPageNumbers.innerHTML = '';
      return;
    }

    if (paginationInfo) {
      paginationInfo.textContent = `แสดง ${startIndex + 1}-${endIndex} จาก ${totalItems} รายการ`;
    }

    if (btnFirstPage) btnFirstPage.disabled = (currentPage <= 1);
    if (btnPrevPage) btnPrevPage.disabled = (currentPage <= 1);
    if (btnNextPage) btnNextPage.disabled = (currentPage >= totalPages);
    if (btnLastPage) btnLastPage.disabled = (currentPage >= totalPages);

    if (!paginationPageNumbers) return;
    paginationPageNumbers.innerHTML = '';

    // คำนวณช่วงหมายเลขหน้าที่จะแสดง (Smart Page Windowing)
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    pages.forEach(p => {
      if (p === '...') {
        const span = document.createElement('span');
        span.className = 'page-ellipsis';
        span.textContent = '...';
        paginationPageNumbers.appendChild(span);
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `page-num-btn ${p === currentPage ? 'active' : ''}`;
        btn.textContent = p;
        btn.setAttribute('data-page', p);
        btn.addEventListener('click', () => {
          currentPage = p;
          applyFiltersAndSort(false);
        });
        paginationPageNumbers.appendChild(btn);
      }
    });
  }

  // Real-time Search Input (รีเซ็ตกลับหน้า 1 เสมอ)
  tableSearchInput.addEventListener('input', () => {
    applyFiltersAndSort(true);
  });

  // =========================================================================
  // SAVE PATIENT RECORD (CREATE / UPDATE)
  // =========================================================================
  async function handleSavePatient() {
    const hn = api.formatHN(patientHnInput.value.trim());
    if (hn) patientHnInput.value = hn;
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const treatmentDate = formatTreatmentDateString(treatmentDateInput.value.trim());
    if (treatmentDate) treatmentDateInput.value = treatmentDate;
    const phone = api.formatPhone(phoneInput.value.trim());
    if (phone) phoneInput.value = phone;
    const emergencyContactPhone = api.formatPhone(emergencyPhoneInput.value.trim());
    if (emergencyContactPhone) emergencyPhoneInput.value = emergencyContactPhone;

    // Required Field Validation
    if (!hn) {
      showToast('กรุณาระบุเลข HN คนไข้', 'error');
      switchTab('patient-tab');
      patientHnInput.focus();
      return;
    }

    if (!treatmentDate) {
      showToast('กรุณาระบุวันที่รักษา', 'error');
      switchTab('patient-tab');
      treatmentDateInput.focus();
      return;
    }

    if (!firstName || !lastName) {
      showToast('กรุณาระบุชื่อและนามสกุลคนไข้ให้ครบถ้วน', 'error');
      switchTab('patient-tab');
      if (!firstName) firstNameInput.focus();
      else lastNameInput.focus();
      return;
    }

    if (!phone) {
      showToast('กรุณาระบุเบอร์โทรศัพท์ติดต่อ', 'error');
      switchTab('patient-tab');
      phoneInput.focus();
      return;
    }

    // Build Patient Object
    const patientData = {
      hn: hn,
      treatmentDate: treatmentDate,
      nationalId: nationalIdInput.value.trim(),
      firstName: firstName,
      lastName: lastName,
      gender: genderSelect.value,
      dobDay: dobDaySelect.value,
      dobMonth: dobMonthSelect.value,
      dobYear: dobYearSelect.value,
      age: patientAgeInput.value ? parseInt(patientAgeInput.value, 10) : null,
      ethnicity: ethnicityInput.value.trim(),
      phone: phone,
      address: patientAddressInput.value.trim(),

      // Emergency
      emergencyContactName: emergencyNameInput.value.trim(),
      emergencyContactPhone: emergencyContactPhone,
      emergencyRelation: emergencyRelationInput.value.trim(),

      // Vital Signs & BMI
      bp: vitalBpInput.value.trim(),
      pr: vitalPrInput.value.trim(),
      weight: vitalWeightInput.value ? parseFloat(vitalWeightInput.value) : null,
      height: vitalHeightInput.value ? parseFloat(vitalHeightInput.value) : null,
      bmi: displayBmi.textContent !== '-' ? displayBmi.textContent : '',
      bmiInterpretation: displayBmiStatus.textContent !== 'รอข้อมูลส่วนสูง/น้ำหนัก' ? displayBmiStatus.textContent : '',

      // History & Alerts
      underlyingDisease: underlyingDiseaseInput.value.trim(),
      chiefComplaint: chiefComplaintInput.value.trim(),
      subjectiveExam: subjectiveExamInput.value.trim(),
      drugAllergy: drugAllergyInput.value.trim(),
      contraindications: contraindicationsInput.value.trim(),

      // Tab 2: Physical Examination & Assessments
      observation: examObservation.value.trim(),
      palpation: examPalpation.value.trim(),
      measurement: examMeasurement.value.trim(),
      physicalExam: examPhysical.value.trim(),
      activeTest: examActiveTest.value.trim(),
      passiveTest: examPassiveTest.value.trim(),
      specialTest: examSpecialTest.value.trim(),
      diagnosis: examDiagnosis.value.trim(),
      treatment: examTreatment.value.trim(),

      // คนไข้ใหม่ -> ถ้า HN ซ้ำกับที่มีในชีต เซิร์ฟเวอร์จะออก HN ใหม่ให้แทนการเขียนทับ
      isNew: !currentEditingHN
    };

    // Save via API / LocalStorage
    try {
      const res = await api.savePatient(patientData);
      if (res.hnChanged) {
        showToast(res.message || `HN ถูกเปลี่ยนเป็น ${res.data.hn}`, 'warning');
      } else {
        showToast(res.message || 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
      }

      // Update local cache
      await loadPatients();

      // Reset Edit Indicator if matched
      if (currentEditingHN === hn) {
        exitEditMode();
      }

      // Automatically switch to search tab to see saved result
      switchTab('search-tab');
    } catch (err) {
      console.error('Save error:', err);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message, 'error');
    }
  }

  // =========================================================================
  // EDIT PATIENT (LOAD INTO FORM)
  // =========================================================================
  function editPatient(hn) {
    const patient = allPatients.find(p => String(p.hn).trim().toLowerCase() === String(hn).trim().toLowerCase());
    if (!patient) {
      showToast('ไม่พบข้อมูลคนไข้รหัสนี้', 'error');
      return;
    }

    currentEditingHN = patient.hn;
    editHnTag.textContent = patient.hn;
    editingIndicator.classList.remove('hidden');

    // Populate Tab 1
    patientHnInput.value = patient.hn || '';
    treatmentDateInput.value = formatTreatmentDateString(patient.treatmentDate) || getTodayBEString();
    nationalIdInput.value = patient.nationalId || '';
    firstNameInput.value = patient.firstName || '';
    lastNameInput.value = patient.lastName || '';
    genderSelect.value = patient.gender || '';
    dobDaySelect.value = patient.dobDay || '';
    dobMonthSelect.value = patient.dobMonth || '';
    dobYearSelect.value = patient.dobYear || '';
    patientAgeInput.value = patient.age || '';
    ethnicityInput.value = patient.ethnicity || 'ไทย';
    phoneInput.value = api.formatPhone(patient.phone) || '';
    patientAddressInput.value = patient.address || '';

    // Emergency Contact
    emergencyNameInput.value = patient.emergencyContactName || '';
    emergencyPhoneInput.value = api.formatPhone(patient.emergencyContactPhone) || '';
    emergencyRelationInput.value = patient.emergencyRelation || '';

    // Vital Signs
    vitalBpInput.value = patient.bp || '';
    vitalPrInput.value = patient.pr || '';
    vitalWeightInput.value = patient.weight || '';
    vitalHeightInput.value = patient.height || '';

    // Trigger BMI Recalculate
    vitalWeightInput.dispatchEvent(new Event('input'));

    // History & Alerts
    underlyingDiseaseInput.value = patient.underlyingDisease || '';
    chiefComplaintInput.value = patient.chiefComplaint || '';
    subjectiveExamInput.value = patient.subjectiveExam || '';
    drugAllergyInput.value = patient.drugAllergy || '';
    contraindicationsInput.value = patient.contraindications || '';

    // Populate Tab 2
    examObservation.value = patient.observation || '';
    examPalpation.value = patient.palpation || '';
    examMeasurement.value = patient.measurement || '';
    examPhysical.value = patient.physicalExam || '';
    examActiveTest.value = patient.activeTest || '';
    examPassiveTest.value = patient.passiveTest || '';
    examSpecialTest.value = patient.specialTest || '';
    examDiagnosis.value = patient.diagnosis || '';
    examTreatment.value = patient.treatment || '';

    // Switch to Tab 1 immediately
    switchTab('patient-tab');
    updateDrivePatientContext();
    showToast(`ดึงข้อมูล HN: ${patient.hn} เข้าสู่แบบฟอร์มแล้ว`, 'info');
  }

  function exitEditMode() {
    currentEditingHN = null;
    editingIndicator.classList.add('hidden');
    editHnTag.textContent = '-';
  }

  function clearFormToNew() {
    exitEditMode();
    document.getElementById('form-patient').reset();
    document.getElementById('form-diagnosis').reset();

    setDefaultTreatmentDate();
    patientHnInput.value = generateNextHN();
    ethnicityInput.value = 'ไทย';

    displayBmi.textContent = '-';
    displayBmiStatus.textContent = 'รอข้อมูลส่วนสูง/น้ำหนัก';
    displayBmiStatus.className = 'bmi-interpretation-chip';

    clearSelectedDriveFile();
    updateDrivePatientContext();

    switchTab('patient-tab');
    showToast(`พร้อมบันทึกคนไข้ใหม่ (รัน HN อัตโนมัติ: ${patientHnInput.value})`, 'info');
  }

  // =========================================================================
  // DELETE PATIENT & CONFIRMATION MODAL
  // =========================================================================
  function openDeleteModal(hn, name) {
    pendingDeleteHN = hn;
    delHnDisplay.textContent = hn;
    delNameDisplay.textContent = name;
    deleteModal.classList.add('open');
  }

  function closeDeleteModal() {
    pendingDeleteHN = null;
    deleteModal.classList.remove('open');
  }

  async function confirmDelete() {
    if (!pendingDeleteHN) return;
    try {
      await api.deletePatient(pendingDeleteHN);
      showToast(`ลบข้อมูลเวชระเบียน HN: ${pendingDeleteHN} เรียบร้อย`, 'success');

      if (currentEditingHN === pendingDeleteHN) {
        clearFormToNew();
      }

      closeDeleteModal();
      await loadPatients();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('ไม่สามารถลบข้อมูลได้: ' + err.message, 'error');
    }
  }

  // =========================================================================
  // A4 MEDICAL RECORD PRINT PREVIEW & PRINT ENGINE
  // =========================================================================
  function openPrintModal(hn) {
    const p = allPatients.find(item => String(item.hn).trim().toLowerCase() === String(hn).trim().toLowerCase());
    if (!p) {
      showToast('ไม่พบข้อมูลสำหรับพิมพ์เอกสาร', 'error');
      return;
    }
    currentPrintPatient = p;

    // Populate A4 Template
    document.getElementById('p-print-hn').textContent = `HN: ${p.hn || '-'}`;
    document.getElementById('p-print-date').textContent = `วันที่รับการรักษา: ${formatTreatmentDateString(p.treatmentDate) || '-'}`;

    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || '-';
    document.getElementById('p-print-name').textContent = fullName;
    document.getElementById('p-print-id').textContent = p.nationalId || '-';

    const dobStr = (p.dobDay && p.dobMonth && p.dobYear)
      ? `${p.dobDay}/${p.dobMonth}/${p.dobYear} (พ.ศ.)`
      : '-';
    document.getElementById('p-print-dob').textContent = dobStr;
    document.getElementById('p-print-age').textContent = p.age ? `${p.age} ปี` : '-';
    document.getElementById('p-print-gender').textContent = p.gender || '-';
    document.getElementById('p-print-phone').textContent = api.formatPhone(p.phone) || '-';
    document.getElementById('p-print-ethnicity').textContent = p.ethnicity || '-';
    document.getElementById('p-print-address').textContent = p.address || '-';

    // Emergency Contact
    let emerStr = p.emergencyContactName || '-';
    if (p.emergencyContactPhone) emerStr += ` (โทร: ${api.formatPhone(p.emergencyContactPhone)})`;
    if (p.emergencyRelation) emerStr += ` [ความสัมพันธ์: ${p.emergencyRelation}]`;
    document.getElementById('p-print-emergency').textContent = emerStr;

    // Vital Signs & BMI
    document.getElementById('p-print-bp').textContent = p.bp ? `${p.bp} mmHg` : '-';
    document.getElementById('p-print-pr').textContent = p.pr ? `${p.pr} bpm` : '-';
    const whStr = (p.weight || p.height)
      ? `${p.weight || '-'} kg / ${p.height || '-'} cm`
      : '-';
    document.getElementById('p-print-wh').textContent = whStr;
    const bmiStr = p.bmi ? `${p.bmi} kg/m² (${p.bmiInterpretation || ''})` : '-';
    document.getElementById('p-print-bmi').textContent = bmiStr;

    // Alerts
    document.getElementById('p-print-allergy').textContent = p.drugAllergy || 'ไม่มีประวัติแพ้ยา';
    document.getElementById('p-print-contraindications').textContent = p.contraindications || 'ไม่มีข้อห้ามพิเศษ';

    // History & Subjective
    document.getElementById('p-print-underlying').textContent = p.underlyingDisease || '-';
    document.getElementById('p-print-cc').textContent = p.chiefComplaint || '-';
    document.getElementById('p-print-subjective').textContent = p.subjectiveExam || '-';

    // Objective Assessments
    document.getElementById('p-print-observation').textContent = p.observation || '-';
    document.getElementById('p-print-palpation').textContent = p.palpation || '-';
    document.getElementById('p-print-measurement').textContent = p.measurement || '-';
    document.getElementById('p-print-physical').textContent = p.physicalExam || '-';

    let actPassStr = '';
    if (p.activeTest) actPassStr += `Active: ${p.activeTest}\n`;
    if (p.passiveTest) actPassStr += `Passive: ${p.passiveTest}`;
    document.getElementById('p-print-active-passive').textContent = actPassStr.trim() || '-';

    document.getElementById('p-print-special').textContent = p.specialTest || '-';

    // Diagnosis & Treatment
    document.getElementById('p-print-diagnosis').textContent = p.diagnosis || '-';
    document.getElementById('p-print-treatment').textContent = p.treatment || '-';

    printModal.classList.add('open');
  }

  function closePrintModal() {
    printModal.classList.remove('open');
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message, type = 'info') {
    const toastBox = document.getElementById('toast-box');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-xmark';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    toastBox.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // =========================================================================
  // GOOGLE DRIVE ATTACHMENTS & CLOUD STORAGE
  // =========================================================================
  function updateDrivePatientContext() {
    const rawHn = (patientHnInput.value || '').trim();
    const hn = api.formatHN(rawHn);
    const fname = (firstNameInput.value || '').trim();
    const lname = (lastNameInput.value || '').trim();
    const fullName = `${fname} ${lname}`.trim();

    if (driveCurrentHn) driveCurrentHn.textContent = hn || '-';
    if (driveCurrentName) driveCurrentName.textContent = fullName || 'ยังไม่ได้ระบุชื่อคนไข้';

    // Check if patient in database has folderUrl
    const p = allPatients.find(item => api.formatHN(item.hn) === hn);
    if (p && p.driveFolderUrl && drivePatientFolderLink) {
      drivePatientFolderLink.href = p.driveFolderUrl;
      drivePatientFolderLink.style.display = 'inline-flex';
    } else if (drivePatientFolderLink) {
      drivePatientFolderLink.style.display = 'none';
    }

    if (hn) {
      loadPatientDriveFiles(hn);
    } else {
      renderDriveFilesList([], api.isOnline());
    }
  }

  function handleFileSelected(file) {
    if (!file) return;

    // Check size (25MB limit)
    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast('ขนาดไฟล์เกินกำหนด (จำกัดไม่เกิน 25MB)', 'error');
      return;
    }

    selectedDriveFile = file;

    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${sizeKB} KB`;

    previewFileName.textContent = file.name;
    previewFileSize.textContent = `(${sizeStr})`;

    previewFileIcon.className = 'file-icon fa-solid ';
    if (file.type.startsWith('image/')) {
      previewFileIcon.className += 'fa-file-image';
    } else if (file.type === 'application/pdf') {
      previewFileIcon.className += 'fa-file-pdf';
    } else if (file.type.includes('word') || file.type.includes('document')) {
      previewFileIcon.className += 'fa-file-word';
    } else {
      previewFileIcon.className += 'fa-file-lines';
    }

    driveSelectedPreview.style.display = 'block';
    btnUploadDrive.disabled = false;
  }

  function clearSelectedDriveFile() {
    selectedDriveFile = null;
    if (driveFileInput) driveFileInput.value = '';
    if (driveSelectedPreview) driveSelectedPreview.style.display = 'none';
    if (btnUploadDrive) btnUploadDrive.disabled = true;
  }

  async function uploadSelectedDriveFile() {
    const hn = api.formatHN(patientHnInput.value.trim());
    if (hn) patientHnInput.value = hn;
    if (!hn) {
      showToast('กรุณาระบุ HN ของคนไข้ก่อนอัปโหลดไฟล์', 'error');
      return;
    }

    if (!selectedDriveFile) {
      showToast('กรุณาเลือกไฟล์ที่ต้องการอัปโหลด', 'error');
      return;
    }

    if (!api.isOnline()) {
      showToast('กรุณาเชื่อมต่อ Google Sheets & Drive ในการตั้งค่าก่อนอัปโหลด', 'error');
      settingsApiUrl.value = api.getApiUrl();
      settingsModal.classList.add('open');
      return;
    }

    const patientName = `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`.trim() || 'Patient';
    const category = driveFileCategory.value;
    const customDesc = driveFileCustomDesc.value.trim();
    const description = customDesc ? `${category} - ${customDesc}` : category;

    btnUploadDrive.disabled = true;
    const origText = btnUploadDrive.innerHTML;
    btnUploadDrive.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังอัปโหลดเข้า Google Drive...';

    try {
      const base64Data = await readFileAsBase64(selectedDriveFile);

      const res = await api.uploadFileToDrive({
        hn: hn,
        patientName: patientName,
        fileName: selectedDriveFile.name,
        mimeType: selectedDriveFile.type || 'application/octet-stream',
        fileData: base64Data,
        description: description
      });

      if (res && res.status === 'success') {
        showToast('อัปโหลดไฟล์เข้า Google Drive สำเร็จเรียบร้อย!', 'success');
        clearSelectedDriveFile();
        driveFileCustomDesc.value = '';

        if (res.folderUrl && drivePatientFolderLink) {
          drivePatientFolderLink.href = res.folderUrl;
          drivePatientFolderLink.style.display = 'inline-flex';
        }

        await loadPatientDriveFiles(hn);
      } else {
        throw new Error(res.message || 'ไม่สามารถอัปโหลดไฟล์ได้');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('อัปโหลดไฟล์ล้มเหลว: ' + err.message, 'error');
    } finally {
      btnUploadDrive.innerHTML = origText;
      btnUploadDrive.disabled = !selectedDriveFile;
    }
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  let activePatientFiles = [];
  let currentLightboxFile = null;

  function formatDisplayDate(rawDate) {
    if (!rawDate || rawDate === '-') return '-';
    try {
      if (typeof rawDate === 'string' && rawDate.includes('/')) {
        return rawDate;
      }
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return String(rawDate);
      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const day = d.getDate();
      const month = thaiMonths[d.getMonth()];
      let year = d.getFullYear();
      if (year < 2400) year += 543;
      const pad = n => String(n).padStart(2, '0');
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())} น.`;
      return `${day} ${month} ${year} เวลา ${timeStr}`;
    } catch (e) {
      return String(rawDate);
    }
  }

  function getFileCategoryBadge(desc = '', fileName = '', mimeType = '') {
    const text = `${desc} ${fileName}`.toLowerCase();
    if (text.includes('x-ray') || text.includes('xray') || text.includes('เอ็กซเรย์') || text.includes('เอกซเรย์') || text.includes('ฟิล์ม')) {
      return { badgeClass: 'drive-badge-xray', icon: 'fa-x-ray', label: 'X-Ray' };
    }
    if (text.includes('mri') || text.includes('ct scan') || text.includes('ct-scan') || text.includes('ultrasound')) {
      return { badgeClass: 'drive-badge-mri', icon: 'fa-brain', label: 'MRI / Ultrasound' };
    }
    if (text.includes('ท่าทาง') || text.includes('posture') || text.includes('rom') || text.includes('movement') || text.includes('เดิน')) {
      return { badgeClass: 'drive-badge-posture', icon: 'fa-person-walking', label: 'Posture / ท่าทาง' };
    }
    if (text.includes('เวชระเบียน') || text.includes('opd') || (mimeType && (mimeType.includes('html') || mimeType.includes('pdf')))) {
      return { badgeClass: 'drive-badge-doc', icon: 'fa-file-lines', label: 'เอกสาร / เวชระเบียน' };
    }
    if (mimeType && mimeType.startsWith('image/')) {
      return { badgeClass: 'drive-badge-doc', icon: 'fa-image', label: 'ภาพทางการแพทย์' };
    }
    return { badgeClass: 'drive-badge-doc', icon: 'fa-paperclip', label: 'ไฟล์แนบ' };
  }

  window.handleDriveImgError = function(imgElement, fileId) {
    if (!fileId || imgElement.dataset.failed) {
      imgElement.style.display = 'none';
      if (imgElement.parentElement && !imgElement.parentElement.querySelector('.drive-file-preview-fallback')) {
        const fallback = document.createElement('div');
        fallback.className = 'drive-file-preview-fallback';
        fallback.innerHTML = '<i class="fa-regular fa-image"></i><span style="font-size: 11px;">เปิดดูผ่าน Drive</span>';
        imgElement.parentElement.appendChild(fallback);
      }
      return;
    }
    imgElement.dataset.failed = 'true';
    api.getFileBase64(fileId).then(dataUrl => {
      if (dataUrl) {
        imgElement.src = dataUrl;
      } else {
        imgElement.style.display = 'none';
        if (imgElement.parentElement && !imgElement.parentElement.querySelector('.drive-file-preview-fallback')) {
          const fallback = document.createElement('div');
          fallback.className = 'drive-file-preview-fallback';
          fallback.innerHTML = '<i class="fa-regular fa-image"></i><span style="font-size: 11px;">เปิดดูผ่าน Drive</span>';
          imgElement.parentElement.appendChild(fallback);
        }
      }
    });
  };

  let currentLightboxZoom = 1;
  let baseImgWidth = 0;

  function updateZoomBadge() {
    if (lightboxZoomLevelText) {
      lightboxZoomLevelText.textContent = `${Math.round(currentLightboxZoom * 100)}%`;
    }
  }

  function applyLightboxZoom() {
    if (!lightboxImg) return;
    updateZoomBadge();

    if (currentLightboxZoom === 1) {
      lightboxImg.style.width = '';
      lightboxImg.style.maxWidth = '100%';
      lightboxImg.style.height = 'auto';
    } else {
      lightboxImg.style.maxWidth = 'none';
      const containerW = (lightboxBody ? lightboxBody.clientWidth - 48 : 800) || 800;
      const base = baseImgWidth || Math.min(lightboxImg.naturalWidth || containerW, containerW);
      lightboxImg.style.width = `${Math.round(base * currentLightboxZoom)}px`;
      lightboxImg.style.height = 'auto';
    }
  }

  function zoomInLightbox() {
    if (currentLightboxZoom < 3.5) {
      currentLightboxZoom = Math.min(Math.round((currentLightboxZoom + 0.25) * 100) / 100, 3.5);
      applyLightboxZoom();
    }
  }

  function zoomOutLightbox() {
    if (currentLightboxZoom > 0.4) {
      currentLightboxZoom = Math.max(Math.round((currentLightboxZoom - 0.25) * 100) / 100, 0.4);
      applyLightboxZoom();
    }
  }

  function resetLightboxZoom() {
    currentLightboxZoom = 1;
    applyLightboxZoom();
  }

  function setupLightboxImgLoad(src) {
    if (!lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.style.display = 'block';
    const onReady = () => {
      const containerW = (lightboxBody ? lightboxBody.clientWidth - 48 : 800) || 800;
      baseImgWidth = Math.min(lightboxImg.naturalWidth || containerW, containerW);
      applyLightboxZoom();
    };
    if (lightboxImg.complete && lightboxImg.naturalWidth) {
      onReady();
    } else {
      lightboxImg.onload = onReady;
    }
  }

  function openLightbox(file) {
    if (!file || !imagePreviewModal) return;
    currentLightboxFile = file;
    currentLightboxZoom = 1;
    baseImgWidth = 0;
    updateZoomBadge();

    // Reset scroll position to top so user can scroll smoothly with mouse wheel
    if (lightboxBody) {
      lightboxBody.scrollTop = 0;
      lightboxBody.scrollLeft = 0;
    }

    if (lightboxFileName) lightboxFileName.textContent = file.fileName || 'ภาพทางการแพทย์';
    if (lightboxFileMeta) {
      const desc = file.description || 'ไฟล์ใน Google Drive';
      const date = formatDisplayDate(file.uploadedAt);
      lightboxFileMeta.textContent = `${desc} • อัปโหลดเมื่อ: ${date}`;
    }

    if (lightboxDriveLink) {
      lightboxDriveLink.href = file.viewUrl || '#';
      lightboxDriveLink.style.display = file.viewUrl ? 'inline-flex' : 'none';
    }

    if (lightboxDownloadLink) {
      lightboxDownloadLink.href = file.downloadUrl || file.viewUrl || '#';
      lightboxDownloadLink.style.display = (file.downloadUrl || file.viewUrl) ? 'inline-flex' : 'none';
    }

    if (lightboxLoader) lightboxLoader.style.display = 'none';
    if (lightboxError) lightboxError.style.display = 'none';
    if (lightboxImg) {
      lightboxImg.style.display = 'none';
      lightboxImg.style.width = '';
      lightboxImg.style.maxWidth = '100%';
      lightboxImg.src = '';
    }

    const cachedData = api.getThumbCache(file.fileId);
    if (cachedData) {
      setupLightboxImgLoad(cachedData);
    } else {
      if (lightboxLoader) lightboxLoader.style.display = 'flex';

      let resolved = false;
      const fileId = file.fileId;
      const directCdnUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

      const probe = new Image();
      probe.onload = () => {
        if (!resolved && currentLightboxFile && currentLightboxFile.fileId === fileId) {
          resolved = true;
          if (lightboxLoader) lightboxLoader.style.display = 'none';
          setupLightboxImgLoad(directCdnUrl);
        }
      };

      probe.onerror = () => {
        // Direct CDN failed, request Base64 from Google Apps Script
        api.getFileBase64(fileId).then(base64 => {
          if (currentLightboxFile && currentLightboxFile.fileId === fileId) {
            if (lightboxLoader) lightboxLoader.style.display = 'none';
            if (base64) {
              setupLightboxImgLoad(base64);
            } else {
              if (lightboxImg) lightboxImg.style.display = 'none';
              if (lightboxError) {
                lightboxError.style.display = 'flex';
                if (lightboxErrorDriveLink) lightboxErrorDriveLink.href = file.viewUrl || '#';
              }
            }
          }
        }).catch(() => {
          if (currentLightboxFile && currentLightboxFile.fileId === fileId) {
            if (lightboxLoader) lightboxLoader.style.display = 'none';
            if (lightboxImg) lightboxImg.style.display = 'none';
            if (lightboxError) {
              lightboxError.style.display = 'flex';
              if (lightboxErrorDriveLink) lightboxErrorDriveLink.href = file.viewUrl || '#';
            }
          }
        });
      };

      probe.src = directCdnUrl;

      // Fallback timeout: if direct probe doesn't respond in 1.5s, fetch base64
      setTimeout(() => {
        if (!resolved && currentLightboxFile && currentLightboxFile.fileId === fileId) {
          api.getFileBase64(fileId).then(base64 => {
            if (base64 && !resolved && currentLightboxFile && currentLightboxFile.fileId === fileId) {
              resolved = true;
              if (lightboxLoader) lightboxLoader.style.display = 'none';
              setupLightboxImgLoad(base64);
            }
          });
        }
      }, 1500);
    }

    imagePreviewModal.classList.add('open');
  }

  function closeLightbox() {
    if (!imagePreviewModal) return;
    imagePreviewModal.classList.remove('open');
    if (lightboxImg) {
      lightboxImg.src = '';
      lightboxImg.style.display = 'none';
      lightboxImg.style.width = '';
      lightboxImg.style.maxWidth = '100%';
    }
    if (lightboxLoader) lightboxLoader.style.display = 'none';
    if (lightboxError) lightboxError.style.display = 'none';
    currentLightboxFile = null;
    currentLightboxZoom = 1;
    baseImgWidth = 0;
    updateZoomBadge();
  }

  async function loadPatientDriveFiles(hn) {
    if (!hn) return;

    if (!api.isOnline()) {
      activePatientFiles = [];
      renderDriveFilesList([], false);
      return;
    }

    try {
      const files = await api.getPatientFiles(hn);
      activePatientFiles = files || [];
      renderDriveFilesList(activePatientFiles, true);
    } catch (err) {
      console.warn('Error fetching patient files:', err);
      activePatientFiles = [];
      renderDriveFilesList([], true);
    }
  }

  function renderDriveFilesList(files = [], isOnline = true) {
    if (!driveFilesContainer) return;

    if (driveFilesCountBadge) {
      driveFilesCountBadge.textContent = `${files.length} รายการ`;
    }

    if (!isOnline) {
      driveFilesContainer.innerHTML = `
        <div class="drive-empty-files" style="grid-column: 1 / -1;">
          <i class="fa-solid fa-cloud-slash" style="color: #cbd5e1;"></i>
          <div>อยู่ในโหมด Local (ยังไม่ได้เชื่อมต่อ Google Drive)</div>
          <button type="button" class="btn btn-outline btn-sm btn-drive-connect-prompt" style="margin-top: 10px;">
            <i class="fa-brands fa-google-drive"></i> เชื่อมต่อ Google Drive เพื่อดูและอัปโหลดไฟล์
          </button>
        </div>
      `;
      const promptBtn = driveFilesContainer.querySelector('.btn-drive-connect-prompt');
      if (promptBtn) {
        promptBtn.addEventListener('click', () => {
          settingsApiUrl.value = api.getApiUrl();
          settingsModal.classList.add('open');
        });
      }
      return;
    }

    if (!files || files.length === 0) {
      driveFilesContainer.innerHTML = `
        <div class="drive-empty-files" style="grid-column: 1 / -1;">
          <i class="fa-solid fa-folder-open"></i>
          <div>ยังไม่มีไฟล์ที่แนบสำหรับคนไข้รายนี้ใน Google Drive</div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">เลือกไฟล์ด้านบนเพื่ออัปโหลดเก็บเข้าโฟลเดอร์ Google Drive โดยตรง</div>
        </div>
      `;
      return;
    }

    let html = '';
    files.forEach(file => {
      const isImg = Boolean(
        (file.mimeType && file.mimeType.startsWith('image/')) ||
        (file.fileName && /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.fileName))
      );
      const cat = getFileCategoryBadge(file.description, file.fileName, file.mimeType);
      const displayDate = formatDisplayDate(file.uploadedAt);
      const thumbSrc = api.getThumbCache(file.fileId) || file.thumbnailUrl || (`https://lh3.googleusercontent.com/d/${file.fileId}`);

      html += `
        <div class="drive-file-card" data-file-id="${escapeHtml(file.fileId)}">
          <div class="drive-file-preview-wrap ${isImg ? '' : 'drive-file-preview-fallback'}" data-file-id="${escapeHtml(file.fileId)}" title="${isImg ? 'คลิกเพื่อดูภาพขยาย' : 'คลิกเพื่อเปิดไฟล์'}">
            ${isImg
              ? `<img class="drive-file-preview-img" src="${thumbSrc}" alt="${escapeHtml(file.fileName)}" loading="lazy" onerror="window.handleDriveImgError(this, '${escapeHtml(file.fileId)}')">
                 <div class="drive-file-preview-overlay">
                   <i class="fa-solid fa-magnifying-glass-plus"></i>
                   <span>ดูภาพขยาย</span>
                 </div>`
              : `<i class="fa-solid ${cat.icon}"></i>
                 <span style="font-size: 11.5px; font-weight: 600; margin-top: 4px;">${escapeHtml(cat.label)}</span>`
            }
          </div>
          <div class="drive-file-card-content">
            <span class="drive-file-badge ${cat.badgeClass}">
              <i class="fa-solid ${cat.icon}"></i> ${escapeHtml(cat.label)}
            </span>
            <div class="drive-file-name-text" title="${escapeHtml(file.fileName)}">${escapeHtml(file.fileName)}</div>
            <div class="drive-file-timestamp">
              <i class="fa-regular fa-calendar-check"></i>
              <span>${escapeHtml(displayDate)}</span>
            </div>
            ${file.description && file.description !== '-' ? `<div style="font-size: 11px; color: #64748b;"><i class="fa-solid fa-tag" style="font-size: 10px;"></i> ${escapeHtml(file.description)}</div>` : ''}
          </div>
          <div class="drive-file-footer-bar">
            ${isImg
              ? `<button type="button" class="btn-preview-action" data-file-id="${escapeHtml(file.fileId)}" title="เปิดดูภาพขนาดใหญ่">
                   <i class="fa-regular fa-eye"></i> ดูภาพ
                 </button>`
              : `<a href="${escapeHtml(file.viewUrl)}" target="_blank" title="เปิดไฟล์">
                   <i class="fa-solid fa-file-export"></i> เปิดไฟล์
                 </a>`
            }
            <a href="${escapeHtml(file.viewUrl)}" target="_blank" title="เปิดดูใน Google Drive">
              <i class="fa-brands fa-google-drive"></i> ใน Drive
            </a>
            <button type="button" class="btn-delete-drive-file" data-file-id="${escapeHtml(file.fileId)}" data-file-name="${escapeHtml(file.fileName)}" title="ลบไฟล์ออกจาก Google Drive">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    });

    driveFilesContainer.innerHTML = html;

    // Attach click events to previews
    driveFilesContainer.querySelectorAll('.drive-file-preview-wrap').forEach(wrap => {
      wrap.addEventListener('click', () => {
        const fId = wrap.getAttribute('data-file-id');
        const fileObj = files.find(f => String(f.fileId || '') === String(fId || ''));
        if (!fileObj) return;

        const isImg = Boolean(
          (fileObj.mimeType && fileObj.mimeType.startsWith('image/')) ||
          (fileObj.fileName && /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(fileObj.fileName))
        );
        if (isImg) {
          openLightbox(fileObj);
        } else if (fileObj.viewUrl) {
          window.open(fileObj.viewUrl, '_blank');
        }
      });
    });

    // Attach click events to "ดูภาพ" button
    driveFilesContainer.querySelectorAll('.btn-preview-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const fId = btn.getAttribute('data-file-id');
        const fileObj = files.find(f => String(f.fileId || '') === String(fId || ''));
        if (fileObj) openLightbox(fileObj);
      });
    });

    // Attach delete handlers
    driveFilesContainer.querySelectorAll('.btn-delete-drive-file').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const fileId = btn.getAttribute('data-file-id');
        const fileName = btn.getAttribute('data-file-name') || 'ไฟล์นี้';
        if (!fileId) return;

        if (confirm(`คุณต้องการลบไฟล์ "${fileName}" ออกจาก Google Drive และเวชระเบียนใช่หรือไม่?`)) {
          const hn = patientHnInput.value.trim();
          showToast('กำลังลบไฟล์ออกจาก Drive...', 'info');
          const delRes = await api.deleteFileFromDrive(fileId, hn);
          if (delRes && delRes.status === 'success') {
            showToast('ลบไฟล์ออกจาก Google Drive เรียบร้อยแล้ว', 'success');
            await loadPatientDriveFiles(hn);
          } else {
            showToast('ลบไฟล์ไม่สำเร็จ: ' + (delRes.message || ''), 'error');
          }
        }
      });
    });
  }

  function setupDriveIntegration() {
    // Dropzone click & drag
    if (driveDropzone) {
      driveDropzone.addEventListener('click', () => {
        if (driveFileInput) driveFileInput.click();
      });

      driveDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        driveDropzone.classList.add('dragover');
      });

      driveDropzone.addEventListener('dragleave', () => {
        driveDropzone.classList.remove('dragover');
      });

      driveDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        driveDropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileSelected(e.dataTransfer.files[0]);
        }
      });
    }

    if (driveFileInput) {
      driveFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFileSelected(e.target.files[0]);
        }
      });
    }

    if (btnClearFile) {
      btnClearFile.addEventListener('click', clearSelectedDriveFile);
    }

    if (btnUploadDrive) {
      btnUploadDrive.addEventListener('click', uploadSelectedDriveFile);
    }

    if (btnRefreshFiles) {
      btnRefreshFiles.addEventListener('click', () => {
        const hn = patientHnInput.value.trim();
        if (hn) {
          loadPatientDriveFiles(hn);
          showToast('รีเฟรชรายการไฟล์เรียบร้อย', 'info');
        }
      });
    }

    // Dynamic name/HN sync with Drive UI
    if (patientHnInput) {
      patientHnInput.addEventListener('input', () => {
        if (driveCurrentHn) driveCurrentHn.textContent = patientHnInput.value || '-';
      });
    }

    const syncDriveName = () => {
      if (driveCurrentName) {
        const f = firstNameInput.value.trim();
        const l = lastNameInput.value.trim();
        driveCurrentName.textContent = `${f} ${l}`.trim() || 'ยังไม่ได้ระบุชื่อคนไข้';
      }
    };

    if (firstNameInput) firstNameInput.addEventListener('input', syncDriveName);
    if (lastNameInput) lastNameInput.addEventListener('input', syncDriveName);
  }

  // =========================================================================
  // CONNECTION TEST CONTROLLER (SETTINGS MODAL)
  // =========================================================================
  async function runConnectionTest() {
    const url = settingsApiUrl.value.trim();
    if (!url) {
      showToast('กรุณากรอก Web App URL ของ Apps Script ก่อนทดสอบ', 'error');
      settingsApiUrl.focus();
      return;
    }

    btnTestConnection.disabled = true;
    const origHtml = btnTestConnection.innerHTML;
    btnTestConnection.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังทดสอบ...';

    connectionResultBox.className = 'connection-result-box show';
    connResultTitle.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>กำลังตรวจสอบสิทธิ์และการเชื่อมต่อ...</span>';
    connResultMessage.textContent = 'กรุณารอสักครู่ ระบบกำลังทดสอบการสื่อสารกับ Google Sheets และ Google Drive...';
    connResultDetails.style.display = 'none';
    connResultActions.style.display = 'none';

    try {
      const res = await api.testConnection(url, settingsApiKey ? settingsApiKey.value : null);
      if (res && res.status === 'success') {
        connectionResultBox.className = 'connection-result-box show success';
        connResultTitle.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>เชื่อมต่อ Google Sheets & Google Drive สำเร็จสมบูรณ์!</span>';
        connResultMessage.textContent = res.message || 'ระบบพร้อมจัดเก็บข้อมูลและไฟล์อัตโนมัติ';
        
        connSheetName.textContent = res.data.spreadsheetName || 'เชื่อมต่อสำเร็จ';
        connFolderName.textContent = res.data.driveFolderName || 'Merit_Physiotherapy_Clinic_Records';
        connPatientsCount.textContent = res.data.patientRecordsCount || 0;
        connLatency.textContent = res.data.latencyMs || 0;
        connResultDetails.style.display = 'grid';

        if (res.data.driveFolderUrl) {
          connDriveLink.href = res.data.driveFolderUrl;
          connResultActions.style.display = 'block';
        }

        showToast('ทดสอบการเชื่อมต่อ Google Sheets & Drive สำเร็จ', 'success');
      } else {
        throw new Error(res.message || 'การเชื่อมต่อไม่สำเร็จ');
      }
    } catch (err) {
      connectionResultBox.className = 'connection-result-box show error';
      connResultTitle.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span>การเชื่อมต่อล้มเหลว</span>';
      connResultMessage.textContent = err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      connResultDetails.style.display = 'none';
      connResultActions.style.display = 'none';
      showToast('การเชื่อมต่อล้มเหลว: ' + err.message, 'error');
    } finally {
      btnTestConnection.innerHTML = origHtml;
      btnTestConnection.disabled = false;
    }
  }

  async function runFixHn() {
    const url = settingsApiUrl.value.trim();
    if (!url) {
      showToast('กรุณากรอก Web App URL ของ Apps Script ก่อนซ่อมแซม HN', 'error');
      settingsApiUrl.focus();
      return;
    }

    if (btnFixHn) {
      btnFixHn.disabled = true;
      btnFixHn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังซ่อมแซม...';
    }

    try {
      const res = await api.fixHN();
      if (res && res.status === 'success') {
        showToast(res.message || 'ซ่อมแซมและจัดรูปแบบ HN ในทุกชีตเรียบร้อยแล้ว', 'success');
        await loadPatients();
        updateDrivePatientContext();
      } else {
        throw new Error(res.message || 'ซ่อมแซมไม่สำเร็จ');
      }
    } catch (err) {
      showToast('ซ่อมแซม HN ล้มเหลว: ' + err.message, 'error');
    } finally {
      if (btnFixHn) {
        btnFixHn.disabled = false;
        btnFixHn.innerHTML = '<i class="fa-solid fa-wrench"></i> ซ่อมแซม HN ใน Sheets';
      }
    }
  }

  // =========================================================================
  // SAVE MEDICAL RECORD TO GOOGLE DRIVE
  // =========================================================================
  async function saveMedicalRecordToDrive() {
    if (!currentPrintPatient) {
      showToast('ไม่พบข้อมูลคนไข้สำหรับบันทึก', 'error');
      return;
    }

    if (!api.isOnline()) {
      showToast('กรุณาเชื่อมต่อ Google Sheets & Drive ก่อนบันทึกเวชระเบียนเข้า Drive', 'error');
      settingsApiUrl.value = api.getApiUrl();
      settingsModal.classList.add('open');
      return;
    }

    btnSaveDocDrive.disabled = true;
    const origHtml = btnSaveDocDrive.innerHTML;
    btnSaveDocDrive.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกเข้า Drive...';

    try {
      const docElement = document.getElementById('printable-a4-document');
      const fullName = `${currentPrintPatient.firstName || ''} ${currentPrintPatient.lastName || ''}`.trim() || 'Patient';

      const fullHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>OPD Record - HN ${currentPrintPatient.hn} - ${fullName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Prompt:wght@400;500;600;700&family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Sarabun', 'Prompt', sans-serif; margin: 20px; background: #f1f5f9; color: #1e293b; }
    .a4-sheet { max-width: 210mm; margin: 0 auto; background: #ffffff; padding: 20mm; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-radius: 4px; }
    .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #162c54; padding-bottom: 12px; margin-bottom: 14px; }
    .print-clinic-name { font-family: 'Prompt', sans-serif; font-size: 20px; font-weight: 800; color: #162c54; }
    .print-clinic-sub { font-size: 13.5px; font-weight: 600; color: #b89223; }
    .print-clinic-address { font-size: 11px; color: #64748b; }
    .print-doc-badge .tag { background: #162c54; color: #fff; font-weight: 700; font-size: 13px; padding: 5px 14px; border-radius: 4px; display: inline-block; }
    .print-doc-badge .hn-text { font-size: 15px; font-weight: 800; color: #162c54; margin-top: 5px; }
    .print-section-title { font-size: 13.5px; font-weight: 700; color: #162c54; border-bottom: 1.5px solid #d4af37; padding-bottom: 3px; margin-bottom: 6px; }
    .print-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; }
    .print-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 10px; }
    .print-data-row { display: flex; gap: 6px; font-size: 12.5px; margin-bottom: 3px; }
    .print-data-row .lbl { font-weight: 600; color: #475569; }
    .print-alert-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 8px 0; }
    .print-box-yellow { background: #fffbeb; border: 1px solid #f59e0b; border-radius: 4px; padding: 6px 10px; font-size: 12px; }
    .print-box-pink { background: #fff1f2; border: 1px solid #f43f5e; border-radius: 4px; padding: 6px 10px; font-size: 12px; }
    .print-exam-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; font-size: 12px; margin-bottom: 6px; }
    .print-footer-signature { margin-top: 24px; padding-top: 18px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; }
    .print-signature-box { text-align: center; width: 220px; }
    .print-signature-line { border-bottom: 1px dotted #475569; height: 38px; margin-bottom: 6px; }
  </style>
</head>
<body>
  ${docElement.outerHTML}
</body>
</html>`;

      const res = await api.saveMedicalRecordToDrive(currentPrintPatient.hn, fullName, fullHtml);
      if (res && res.status === 'success') {
        showToast('บันทึกเวชระเบียนเข้า Google Drive เรียบร้อยแล้ว!', 'success');
        if (res.viewUrl) {
          window.open(res.viewUrl, '_blank');
        }
      } else {
        throw new Error(res.message || 'บันทึกเอกสารไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Save doc to drive error:', err);
      showToast('บันทึกเอกสารเข้า Drive ล้มเหลว: ' + err.message, 'error');
    } finally {
      btnSaveDocDrive.innerHTML = origHtml;
      btnSaveDocDrive.disabled = false;
    }
  }

  // =========================================================================
  // TAB 4: GOOGLE CALENDAR APPOINTMENTS ENGINE
  // =========================================================================

  const THAI_DAY_NAMES = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  const THAI_MONTH_NAMES = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  function formatThaiAppointmentDate(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    const dayName = THAI_DAY_NAMES[dateObj.getDay()];
    const dateNum = dateObj.getDate();
    const monthName = THAI_MONTH_NAMES[dateObj.getMonth()];
    const yearBE = dateObj.getFullYear() + 543;
    return `${dayName}ที่ ${dateNum} ${monthName} ${yearBE}`;
  }

  function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  function calculateAppointmentDuration(start, end) {
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return '';
    const totalMins = Math.round(diffMs / (60 * 1000));
    if (totalMins < 60) {
      return `${totalMins} นาที`;
    }
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (mins === 0) {
      return `${hours} ชม.`;
    }
    return `${hours} ชม. ${mins} นาที`;
  }

  function formatAppointmentTimeInfo(startTimeStr, endTimeStr, isAllDay) {
    if (isAllDay) {
      return { timeStr: 'ตลอดวัน', durationStr: '' };
    }
    const s = new Date(startTimeStr);
    const e = new Date(endTimeStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      return { timeStr: 'ไม่ระบุเวลา', durationStr: '' };
    }

    const pad = n => String(n).padStart(2, '0');
    const startStr = `${pad(s.getHours())}:${pad(s.getMinutes())}`;
    const endStr = `${pad(e.getHours())}:${pad(e.getMinutes())}`;
    const durStr = calculateAppointmentDuration(s, e);
    return {
      timeStr: `${startStr} - ${endStr} น.`,
      durationStr: durStr
    };
  }

  function setupAppointments() {
    // Search input with debounce (250ms) to eliminate UI stuttering & prevent overload
    if (apptSearchInput) {
      apptSearchInput.addEventListener('input', () => {
        if (btnClearApptSearch) {
          btnClearApptSearch.style.display = apptSearchInput.value.trim() ? 'block' : 'none';
        }
        clearTimeout(apptSearchTimeout);
        apptSearchTimeout = setTimeout(() => {
          apptRenderLimit = 20; // reset pagination when searching
          applyAppointmentFilters();
        }, 250);
      });
    }

    if (btnClearApptSearch) {
      btnClearApptSearch.addEventListener('click', () => {
        if (apptSearchInput) apptSearchInput.value = '';
        btnClearApptSearch.style.display = 'none';
        clearTimeout(apptSearchTimeout);
        apptRenderLimit = 20;
        applyAppointmentFilters();
      });
    }

    // Filter Chips
    apptFilterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        apptFilterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeApptFilter = chip.getAttribute('data-appt-filter');

        if (activeApptFilter === 'custom') {
          if (apptCustomDateRange) apptCustomDateRange.style.display = 'flex';
        } else {
          if (apptCustomDateRange) apptCustomDateRange.style.display = 'none';
        }
        apptRenderLimit = 20;
        applyAppointmentFilters();
      });
    });

    // Custom Date Range Inputs
    if (apptDateFrom) {
      apptDateFrom.addEventListener('change', () => {
        apptCustomFrom = apptDateFrom.value;
        apptRenderLimit = 20;
        applyAppointmentFilters();
      });
    }

    if (apptDateTo) {
      apptDateTo.addEventListener('change', () => {
        apptCustomTo = apptDateTo.value;
        apptRenderLimit = 20;
        applyAppointmentFilters();
      });
    }

    if (btnClearApptDate) {
      btnClearApptDate.addEventListener('click', () => {
        if (apptDateFrom) apptDateFrom.value = '';
        if (apptDateTo) apptDateTo.value = '';
        apptCustomFrom = '';
        apptCustomTo = '';
        apptRenderLimit = 20;
        applyAppointmentFilters();
      });
    }

    // Refresh Button
    if (btnRefreshAppointments) {
      btnRefreshAppointments.addEventListener('click', () => {
        loadAppointments(true);
      });
    }

    // View Switcher (Agenda vs Calendar Embed)
    if (btnViewAgenda) {
      btnViewAgenda.addEventListener('click', () => {
        switchAppointmentView('agenda');
      });
    }
    if (btnViewCalendar) {
      btnViewCalendar.addEventListener('click', () => {
        switchAppointmentView('calendar');
      });
    }
    if (btnReloadCalendarIframe) {
      btnReloadCalendarIframe.addEventListener('click', () => {
        loadCalendarIframe(true);
        showToast('กำลังโหลดปฏิทิน Google Calendar ใหม่...', 'info');
      });
    }

    // New Appointment Button -> Open Modal
    if (btnNewCalendarEvent) {
      btnNewCalendarEvent.addEventListener('click', () => {
        openCreateApptModal();
      });
    }

    // Create Appointment Modal Actions
    if (btnCloseCreateApptModal) {
      btnCloseCreateApptModal.addEventListener('click', closeCreateApptModal);
    }
    if (btnCancelCreateAppt) {
      btnCancelCreateAppt.addEventListener('click', closeCreateApptModal);
    }
    if (formCreateAppt) {
      formCreateAppt.addEventListener('submit', handleCreateApptSubmit);
    }
    if (apptPatientSearch) {
      apptPatientSearch.addEventListener('input', handleApptPatientSearchInput);
      apptPatientSearch.addEventListener('focus', handleApptPatientSearchInput);
    }
    if (btnClearApptPatient) {
      btnClearApptPatient.addEventListener('click', clearSelectedPatientForAppt);
    }
    document.addEventListener('click', (e) => {
      if (apptPatientDropdown && !e.target.closest('.appt-patient-search-wrap') && !e.target.closest('.appt-patient-dropdown')) {
        apptPatientDropdown.style.display = 'none';
      }
    });

    // Delete Modal Actions
    if (btnCloseDeleteApptModal) {
      btnCloseDeleteApptModal.addEventListener('click', closeDeleteApptModal);
    }
    if (btnCancelDeleteAppt) {
      btnCancelDeleteAppt.addEventListener('click', closeDeleteApptModal);
    }
    if (btnConfirmDeleteAppt) {
      btnConfirmDeleteAppt.addEventListener('click', confirmDeleteAppt);
    }
  }

  function switchAppointmentView(mode) {
    activeApptViewMode = mode;
    if (btnViewAgenda) {
      if (mode === 'agenda') btnViewAgenda.classList.add('active');
      else btnViewAgenda.classList.remove('active');
    }
    if (btnViewCalendar) {
      if (mode === 'calendar') btnViewCalendar.classList.add('active');
      else btnViewCalendar.classList.remove('active');
    }

    if (mode === 'agenda') {
      if (apptScheduleContainer) apptScheduleContainer.style.display = 'flex';
      if (apptControlsBar) apptControlsBar.style.display = 'flex';
      if (apptStatCardsWrap) apptStatCardsWrap.style.display = 'grid';
      if (activeApptFilter === 'custom' && apptCustomDateRange) {
        apptCustomDateRange.style.display = 'flex';
      }
      if (apptCalendarEmbedContainer) apptCalendarEmbedContainer.style.display = 'none';
    } else {
      // Calendar Embed View
      if (apptScheduleContainer) apptScheduleContainer.style.display = 'none';
      if (apptControlsBar) apptControlsBar.style.display = 'none';
      if (apptCustomDateRange) apptCustomDateRange.style.display = 'none';
      if (apptStatCardsWrap) apptStatCardsWrap.style.display = 'grid';
      if (apptCalendarEmbedContainer) apptCalendarEmbedContainer.style.display = 'block';

      loadCalendarIframe();
    }
  }

  function loadCalendarIframe(force = false) {
    if (!googleCalendarIframe) return;
    // Lazy loading: only load iFrame if user switched to calendar view or forced reload
    if (!force && activeApptViewMode !== 'calendar') return;
    const embedUrl = api.getCalendarEmbedUrl(cachedCalendarId);
    // ยังไม่รู้ Calendar ID (กำลังโหลด getCalendarInfo) -> รอก่อน เพราะ embed ที่ไม่มี src จะไม่แสดงปฏิทินใดเลย
    if (!embedUrl.includes('&src=')) return;
    // โหลดใหม่เมื่อ URL เปลี่ยน (เช่น ได้ Calendar ID หลังจากเปิดมุมมองปฏิทินไปแล้ว)
    if (force || googleCalendarIframe.src !== embedUrl) {
      googleCalendarIframe.src = embedUrl;
    }
  }

  function populateAppointmentTimeDropdowns() {
    if (!apptFormTimeStart || !apptFormTimeEnd) return;

    let optionsHtml = '';
    for (let h = 0; h < 24; h++) {
      const hh = String(h).padStart(2, '0');
      for (let m = 0; m < 60; m += 15) {
        const mm = String(m).padStart(2, '0');
        const timeVal = `${hh}:${mm}`;
        optionsHtml += `<option value="${timeVal}">${timeVal} น.</option>`;
      }
    }

    apptFormTimeStart.innerHTML = optionsHtml;
    apptFormTimeEnd.innerHTML = optionsHtml;

    // Default times (e.g. 09:00 - 10:00)
    apptFormTimeStart.value = '09:00';
    apptFormTimeEnd.value = '10:00';

    // Auto-adjust end time when start time changes
    apptFormTimeStart.addEventListener('change', () => {
      const sVal = apptFormTimeStart.value;
      if (!sVal) return;
      const parts = sVal.split(':');
      let h = parseInt(parts[0], 10) + 1;
      let m = parts[1];
      if (h >= 24) h = 23;
      const targetVal = `${String(h).padStart(2, '0')}:${m}`;
      if (apptFormTimeEnd.value <= sVal) {
        apptFormTimeEnd.value = targetVal;
      }
    });

    // Thai Date Preview updater
    if (apptFormDate) {
      apptFormDate.addEventListener('change', updateApptThaiDatePreview);
      apptFormDate.addEventListener('input', updateApptThaiDatePreview);
    }
  }

  function updateApptThaiDatePreview() {
    const previewEl = document.getElementById('appt-form-thai-date-preview');
    if (!previewEl || !apptFormDate || !apptFormDate.value) {
      if (previewEl) previewEl.textContent = '';
      return;
    }
    const parts = apptFormDate.value.split('-');
    if (parts.length === 3) {
      const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (!isNaN(dObj.getTime())) {
        previewEl.textContent = `📅 ${formatThaiAppointmentDate(dObj)}`;
        return;
      }
    }
    previewEl.textContent = '';
  }

  function openCreateApptModal() {
    if (!createApptModal) return;

    // Reset patient search state (prevents DOM overload)
    clearSelectedPatientForAppt();

    // If currently editing a patient in the app, preselect that patient!
    if (currentEditingHN) {
      const p = allPatients.find(item => item.hn === currentEditingHN);
      if (p) {
        selectPatientForAppt(p);
      }
    }

    // Default Date to today (YYYY-MM-DD)
    if (apptFormDate && !apptFormDate.value) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      apptFormDate.value = `${y}-${m}-${d}`;
    }
    updateApptThaiDatePreview();

    // Default times: next hour (24-hour format)
    if (apptFormTimeStart && apptFormTimeEnd) {
      const now = new Date();
      const nextH = (now.getHours() + 1) % 24;
      const endH = (nextH + 1) % 24;
      const sH = String(nextH).padStart(2, '0');
      const eH = String(endH).padStart(2, '0');
      apptFormTimeStart.value = `${sH}:00`;
      apptFormTimeEnd.value = `${eH}:00`;
    }

    createApptModal.classList.add('open');
  }

  function closeCreateApptModal() {
    if (!createApptModal) return;
    createApptModal.classList.remove('open');
    if (formCreateAppt) formCreateAppt.reset();
    clearSelectedPatientForAppt();
  }

  function selectPatientForAppt(p) {
    if (!p) return;
    const pName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    if (apptPatientSearch) {
      apptPatientSearch.value = `HN: ${p.hn} - ${pName}`;
    }
    if (apptSelectedHN) {
      apptSelectedHN.value = p.hn;
    }
    if (btnClearApptPatient) {
      btnClearApptPatient.style.display = 'block';
    }
    if (apptPatientDropdown) {
      apptPatientDropdown.style.display = 'none';
      apptPatientDropdown.innerHTML = '';
    }
    if (apptTitleInput) {
      apptTitleInput.value = `นัดทำกายภาพบำบัด: ${pName} (HN: ${p.hn})`;
    }
    if (apptFormDesc && !apptFormDesc.value) {
      let desc = '';
      if (p.diagnosis) desc += `การวินิจฉัย/อาการ: ${p.diagnosis}\n`;
      if (p.phone) desc += `เบอร์โทรติดต่อ: ${api.formatPhone(p.phone)}\n`;
      apptFormDesc.value = desc.trim();
    }
  }

  function clearSelectedPatientForAppt() {
    if (apptPatientSearch) apptPatientSearch.value = '';
    if (apptSelectedHN) apptSelectedHN.value = '';
    if (btnClearApptPatient) btnClearApptPatient.style.display = 'none';
    if (apptPatientDropdown) {
      apptPatientDropdown.style.display = 'none';
      apptPatientDropdown.innerHTML = '';
    }
  }

  function handleApptPatientSearchInput() {
    if (!apptPatientSearch || !apptPatientDropdown) return;
    const q = (apptPatientSearch.value || '').trim().toLowerCase();

    if (!q) {
      apptPatientDropdown.style.display = 'none';
      apptPatientDropdown.innerHTML = '';
      if (btnClearApptPatient) btnClearApptPatient.style.display = 'none';
      return;
    }

    if (btnClearApptPatient) btnClearApptPatient.style.display = 'block';

    // Filter patients (max 8 matches to keep DOM lightweight)
    const matches = (allPatients || []).filter(p => {
      const hn = (p.hn || '').toLowerCase();
      const name = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return hn.includes(q) || name.includes(q) || phone.includes(q);
    }).slice(0, 8);

    if (matches.length === 0) {
      apptPatientDropdown.innerHTML = '<div class="appt-patient-empty"><i class="fa-regular fa-folder-open"></i> ไม่พบคนไข้ที่ตรงกับคำค้นหา</div>';
    } else {
      apptPatientDropdown.innerHTML = matches.map(p => {
        const pName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
        return `
          <div class="appt-patient-item" data-hn="${escapeHtml(p.hn)}">
            <div>
              <span class="appt-patient-item-hn">HN: ${escapeHtml(p.hn)}</span>
              <span class="appt-patient-item-name">${escapeHtml(pName)}</span>
            </div>
            <div class="appt-patient-item-sub">${escapeHtml(api.formatPhone(p.phone) || p.diagnosis || '')}</div>
          </div>
        `;
      }).join('');

      apptPatientDropdown.querySelectorAll('.appt-patient-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const hn = item.getAttribute('data-hn');
          const target = allPatients.find(p => p.hn === hn);
          if (target) selectPatientForAppt(target);
        });
      });
    }

    apptPatientDropdown.style.display = 'block';
  }

  async function handleCreateApptSubmit(e) {
    if (e) e.preventDefault();

    const title = (apptTitleInput ? apptTitleInput.value : '').trim();
    const dateStr = (apptFormDate ? apptFormDate.value : '').trim();
    const timeStartStr = (apptFormTimeStart ? apptFormTimeStart.value : '').trim();
    const timeEndStr = (apptFormTimeEnd ? apptFormTimeEnd.value : '').trim();
    const location = (apptFormLocation ? apptFormLocation.value : '').trim();
    const description = (apptFormDesc ? apptFormDesc.value : '').trim();

    if (!title) {
      showToast('กรุณาระบุหัวข้อนัดหมาย', 'warning');
      if (apptTitleInput) apptTitleInput.focus();
      return;
    }
    if (!dateStr || !timeStartStr || !timeEndStr) {
      showToast('กรุณาระบุ วันที่ และ เวลาเริ่มต้น-สิ้นสุด ให้ครบถ้วน', 'warning');
      return;
    }

    const startDateTime = new Date(`${dateStr}T${timeStartStr}:00`);
    const endDateTime = new Date(`${dateStr}T${timeEndStr}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      showToast('รูปแบบวันเวลาไม่ถูกต้อง', 'error');
      return;
    }

    if (endDateTime <= startDateTime) {
      showToast('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น', 'warning');
      if (apptFormTimeEnd) apptFormTimeEnd.focus();
      return;
    }

    const origBtnHtml = btnSubmitCreateAppt ? btnSubmitCreateAppt.innerHTML : '';
    if (btnSubmitCreateAppt) {
      btnSubmitCreateAppt.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก Google Calendar...';
      btnSubmitCreateAppt.disabled = true;
    }

    try {
      const res = await api.createCalendarEvent({
        title: title,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: location,
        description: description
      });

      if (res && res.success) {
        showToast(res.message || 'สร้างนัดหมายใน Google Calendar เรียบร้อยแล้ว', 'success');
        closeCreateApptModal();
        await loadAppointments(true);
        if (activeApptViewMode === 'calendar') {
          loadCalendarIframe(true);
        }
      } else {
        throw new Error((res && res.error) || 'บันทึกนัดหมายลง Google Calendar ไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Create appointment error:', err);
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      if (btnSubmitCreateAppt) {
        btnSubmitCreateAppt.innerHTML = origBtnHtml;
        btnSubmitCreateAppt.disabled = false;
      }
    }
  }

  async function loadAppointments(forceRefresh = false) {
    if (!apptScheduleContainer) return;

    if (apptCalendarName) {
      apptCalendarName.textContent = 'กำลังโหลดข้อมูลจาก Google Calendar (Online)...';
    }
    if (apptSyncDot) {
      apptSyncDot.className = 'status-dot';
    }

    apptScheduleContainer.innerHTML = `
      <div class="appt-loading-placeholder">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>กำลังดึงข้อมูลตารางนัดหมายจาก Google Calendar...</span>
      </div>
    `;

    try {
      const isOnline = api.isOnline();
      let info = null;
      if (isOnline) {
        info = await api.getCalendarInfo();
      }

      if (info && info.status === 'success') {
        cachedCalendarId = info.calendarId || '';
        if (apptCalendarName) {
          apptCalendarName.textContent = `ปฏิทิน: ${info.calendarName || 'Google Calendar'} (${info.calendarId || ''})`;
        }
        if (apptSyncDot) {
          apptSyncDot.className = 'status-dot online';
        }
      } else {
        if (apptCalendarName) {
          apptCalendarName.textContent = info && info.message
            ? `Google Calendar: ${info.message}`
            : (isOnline ? 'ไม่สามารถเชื่อมต่อ Google Calendar ได้' : 'ยังไม่ได้ระบุ Web App URL');
        }
        if (apptSyncDot) {
          apptSyncDot.className = 'status-dot';
        }
      }

      // ได้ Calendar ID แล้ว -> โหลดปฏิทิน embed ทันที ไม่ต้องรอรายการนัดหมาย
      if (activeApptViewMode === 'calendar') {
        loadCalendarIframe();
      }

      const res = await api.getCalendarEvents();
      if (res && res.success) {
        if (!cachedCalendarId && res.calendarId) {
          cachedCalendarId = res.calendarId;
        }
        allAppointments = Array.isArray(res.events) ? res.events : [];
        applyAppointmentFilters();

        if (activeApptViewMode === 'calendar') {
          loadCalendarIframe();
        }

        if (forceRefresh) {
          showToast('อัปเดตตารางนัดหมายล่าสุดจาก Google Calendar เรียบร้อยแล้ว', 'success');
        }
      } else {
        allAppointments = [];
        updateAppointmentStatCards([]);
        if (apptStatsSummary) {
          apptStatsSummary.textContent = 'ไม่สามารถดึงข้อมูลนัดหมายได้';
        }

        apptScheduleContainer.innerHTML = `
          <div class="appt-empty-state">
            <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>
            <p style="font-weight: 600; color: #1e293b;">ไม่สามารถโหลดตารางนัดหมายจาก Google Calendar ได้</p>
            <p style="font-size: 13px; color: #b91c1c; margin-top: 6px; font-weight: 500;">${escapeHtml((res && res.error) || 'โปรดตรวจสอบการเชื่อมต่อหรือการ Deploy Web App')}</p>
            <div style="margin-top: 14px; display: flex; justify-content: center; gap: 8px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('btn-refresh-appointments').click()">
                <i class="fa-solid fa-arrows-rotate"></i> ลองใหม่อีกครั้ง
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('btn-open-settings').click()">
                <i class="fa-solid fa-gear"></i> ตั้งค่าการเชื่อมต่อ
              </button>
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
      allAppointments = [];
      updateAppointmentStatCards([]);
      apptScheduleContainer.innerHTML = `
        <div class="appt-empty-state">
          <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>
          <p style="font-weight: 600; color: #1e293b;">เกิดข้อผิดพลาดในการโหลดตารางนัดหมาย</p>
          <p style="font-size: 13px; color: #b91c1c; margin-top: 6px; font-weight: 500;">${escapeHtml(err.message || 'โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต')}</p>
          <div style="margin-top: 14px; display: flex; justify-content: center; gap: 8px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('btn-refresh-appointments').click()">
              <i class="fa-solid fa-arrows-rotate"></i> ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      `;
    }
  }

  function updateAppointmentStatCards(events) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    sevenDaysLater.setHours(23, 59, 59, 999);

    let todayCount = 0;
    let upcomingCount = 0;
    let monthCount = 0;
    const totalCount = events.length;

    events.forEach(ev => {
      const evDate = new Date(ev.startTime);
      if (isNaN(evDate.getTime())) return;

      if (isSameDay(evDate, today)) {
        todayCount++;
      }
      if (evDate >= today && evDate <= sevenDaysLater) {
        upcomingCount++;
      }
      if (evDate.getFullYear() === now.getFullYear() && evDate.getMonth() === now.getMonth()) {
        monthCount++;
      }
    });

    if (statApptToday) statApptToday.textContent = todayCount;
    if (statApptUpcoming) statApptUpcoming.textContent = upcomingCount;
    if (statApptMonth) statApptMonth.textContent = monthCount;
    if (statApptTotal) statApptTotal.textContent = totalCount;
  }

  function applyAppointmentFilters() {
    if (!Array.isArray(allAppointments)) {
      allAppointments = [];
    }

    updateAppointmentStatCards(allAppointments);

    const q = (apptSearchInput ? apptSearchInput.value : '').trim().toLowerCase();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    sevenDaysLater.setHours(23, 59, 59, 999);

    let filtered = allAppointments.filter(ev => {
      // Search text filter
      if (q) {
        const title = (ev.title || '').toLowerCase();
        const desc = (ev.description || '').toLowerCase();
        const loc = (ev.location || '').toLowerCase();
        if (!title.includes(q) && !desc.includes(q) && !loc.includes(q)) {
          return false;
        }
      }

      // Date filter
      const evDate = new Date(ev.startTime);
      if (isNaN(evDate.getTime())) return true;

      if (activeApptFilter === 'today') {
        return isSameDay(evDate, today);
      } else if (activeApptFilter === 'upcoming7') {
        return evDate >= today && evDate <= sevenDaysLater;
      } else if (activeApptFilter === 'thisMonth') {
        return evDate.getFullYear() === now.getFullYear() && evDate.getMonth() === now.getMonth();
      } else if (activeApptFilter === 'custom') {
        if (apptCustomFrom) {
          const fromD = new Date(apptCustomFrom);
          fromD.setHours(0, 0, 0, 0);
          if (evDate < fromD) return false;
        }
        if (apptCustomTo) {
          const toD = new Date(apptCustomTo);
          toD.setHours(23, 59, 59, 999);
          if (evDate > toD) return false;
        }
      }

      return true;
    });

    // Update summary text
    if (apptStatsSummary) {
      apptStatsSummary.textContent = `พบ ${filtered.length} นัดหมาย${filtered.length !== allAppointments.length ? ` (จากทั้งหมด ${allAppointments.length})` : ''}`;
    }

    // Progressive rendering: slice by apptRenderLimit to prevent DOM overload
    const visibleEvents = filtered.slice(0, apptRenderLimit);
    renderAppointments(visibleEvents, filtered.length);
  }

  function renderAppointments(events, totalMatchingCount = 0) {
    if (!apptScheduleContainer) return;

    if (!events || events.length === 0) {
      apptScheduleContainer.innerHTML = `
        <div class="appt-empty-state">
          <i class="fa-regular fa-calendar-xmark"></i>
          <p style="font-weight: 600; color: #1e293b;">ไม่พบนัดหมายที่ตรงกับเงื่อนไข</p>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">ลองเปลี่ยนคำค้นหา หรือเลือกช่วงวันที่อื่น</p>
          <div style="margin-top: 14px; display: flex; justify-content: center; gap: 8px;">
            <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('btn-new-calendar-event').click()">
              <i class="fa-solid fa-calendar-plus"></i> เพิ่มนัดหมายใหม่
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Group events by date (YYYY-MM-DD)
    const groups = new Map();
    events.forEach(ev => {
      const d = new Date(ev.startTime);
      let dateKey = 'undated';
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateKey = `${y}-${m}-${day}`;
      }
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey).push(ev);
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let html = '';
    groups.forEach((dayEvents, dateKey) => {
      let isToday = false;
      let thaiDateText = 'ไม่ระบุวันที่';

      if (dateKey !== 'undated') {
        const parts = dateKey.split('-');
        const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        isToday = isSameDay(dObj, today);
        thaiDateText = formatThaiAppointmentDate(dObj);
      }

      html += `
        <div class="appt-date-group">
          <div class="appt-date-header ${isToday ? 'is-today' : ''}" role="button" tabindex="0" title="คลิกเพื่อย่อ/ขยายกลุ่มนัดหมายนี้">
            <i class="fa-regular fa-calendar-check"></i>
            <span style="flex: 1;">${escapeHTML(thaiDateText)}</span>
            ${isToday ? '<span class="badge-today">วันนี้</span>' : ''}
            <span class="appt-count-pill">${dayEvents.length} นัดหมาย</span>
            <i class="fa-solid fa-chevron-down appt-chevron"></i>
          </div>

          <div class="appt-cards-list">
            ${dayEvents.map(ev => {
              const timeInfo = formatAppointmentTimeInfo(ev.startTime, ev.endTime, ev.isAllDay);
              const editUrl = ev.editUrl || 'https://calendar.google.com';
              const titleSafe = escapeHTML(ev.title || '(ไม่มีชื่อหัวข้อ)');
              const descSafe = escapeHTML(ev.description || '');
              const locSafe = escapeHTML(ev.location || '');

              return `
                <div class="appt-card" data-id="${escapeHTML(ev.id)}">
                  <div class="appt-time-col">
                    <div class="appt-time-range">${escapeHTML(timeInfo.timeStr)}</div>
                    ${timeInfo.durationStr ? `<div class="appt-duration-tag">${escapeHTML(timeInfo.durationStr)}</div>` : ''}
                  </div>

                  <div class="appt-content-col">
                    <div class="appt-title">
                      <i class="fa-solid fa-user-clock" style="color: var(--primary-color);"></i>
                      <span>${titleSafe}</span>
                    </div>

                    ${descSafe ? `<div class="appt-desc">${descSafe}</div>` : ''}

                    ${locSafe ? `
                      <div class="appt-location">
                        <i class="fa-solid fa-location-dot" style="color: #ef4444;"></i>
                        <span>${locSafe}</span>
                      </div>
                    ` : ''}
                  </div>

                  <div class="appt-actions-col">
                    <a href="${editUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" title="เปิดหน้าแก้ไขนัดหมายบน Google Calendar โดยตรง">
                      <i class="fa-solid fa-arrow-up-right-from-square"></i> แก้ไขใน Google Calendar
                    </a>
                    <button type="button" class="btn btn-outline btn-sm btn-delete-appt" data-id="${escapeHTML(ev.id)}" style="color: var(--color-danger); border-color: #fca5a5;" title="ยกเลิกนัดหมายนี้ใน Google Calendar">
                      <i class="fa-solid fa-calendar-xmark"></i> ยกเลิก
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    // Progressive rendering: Show "Load More" button if total matching count exceeds visible count
    if (totalMatchingCount > events.length) {
      html += `
        <div class="appt-load-more-wrap">
          <button type="button" id="btn-load-more-appts" class="btn-load-more-appts" title="โหลดนัดหมายเพิ่มเติม">
            <i class="fa-solid fa-chevron-down"></i>
            <span>แสดงนัดหมายเพิ่มเติม</span>
            <span class="load-more-badge">แสดง ${events.length} จาก ${totalMatchingCount}</span>
          </button>
        </div>
      `;
    }

    apptScheduleContainer.innerHTML = html;

    // Attach click listeners to Load More button
    const btnLoadMore = apptScheduleContainer.querySelector('#btn-load-more-appts');
    if (btnLoadMore) {
      btnLoadMore.addEventListener('click', () => {
        apptRenderLimit += 20;
        applyAppointmentFilters();
      });
    }

    // Attach collapsible accordion toggle to each date header
    apptScheduleContainer.querySelectorAll('.appt-date-header').forEach(header => {
      header.addEventListener('click', () => {
        header.classList.toggle('is-collapsed');
        const cardsList = header.nextElementSibling;
        if (cardsList && cardsList.classList.contains('appt-cards-list')) {
          cardsList.classList.toggle('is-collapsed');
        }
      });
    });

    // Attach click listeners to delete buttons
    apptScheduleContainer.querySelectorAll('.btn-delete-appt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        openDeleteApptModal(id);
      });
    });
  }

  function openDeleteApptModal(apptId) {
    const appt = allAppointments.find(a => a.id === apptId);
    if (!appt) return;

    pendingDeleteAppt = appt;
    if (delApptTitleDisplay) {
      delApptTitleDisplay.textContent = appt.title || '(ไม่มีชื่อหัวข้อ)';
    }
    if (delApptTimeDisplay) {
      const s = new Date(appt.startTime);
      const thaiDate = formatThaiAppointmentDate(s);
      const timeInfo = formatAppointmentTimeInfo(appt.startTime, appt.endTime, appt.isAllDay);
      delApptTimeDisplay.textContent = `${thaiDate} เวลา ${timeInfo.timeStr}`;
    }

    if (deleteApptModal) {
      deleteApptModal.classList.add('open');
    }
  }

  function closeDeleteApptModal() {
    pendingDeleteAppt = null;
    if (deleteApptModal) {
      deleteApptModal.classList.remove('open');
    }
  }

  async function confirmDeleteAppt() {
    if (!pendingDeleteAppt) return;

    const id = pendingDeleteAppt.id;
    const title = pendingDeleteAppt.title;
    const origBtnHtml = btnConfirmDeleteAppt ? btnConfirmDeleteAppt.innerHTML : '';

    if (btnConfirmDeleteAppt) {
      btnConfirmDeleteAppt.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังยกเลิก...';
      btnConfirmDeleteAppt.disabled = true;
    }

    try {
      const res = await api.deleteCalendarEvent(id);
      if (res && res.success) {
        showToast(`ยกเลิกนัดหมาย "${title}" ใน Google Calendar เรียบร้อยแล้ว`, 'success');
        closeDeleteApptModal();
        allAppointments = allAppointments.filter(a => a.id !== id);
        applyAppointmentFilters();
      } else {
        throw new Error((res && res.error) || 'ไม่สามารถยกเลิกนัดหมายใน Google Calendar ได้');
      }
    } catch (err) {
      console.error('Delete calendar event error:', err);
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      if (btnConfirmDeleteAppt) {
        btnConfirmDeleteAppt.innerHTML = origBtnHtml;
        btnConfirmDeleteAppt.disabled = false;
      }
    }
  }

  // =========================================================================
  // EVENT LISTENERS
  // =========================================================================
  function setupEventListeners() {
    // Generate Next HN Button
    btnGenHn.addEventListener('click', () => {
      patientHnInput.value = generateNextHN();
      if (driveCurrentHn) driveCurrentHn.textContent = patientHnInput.value;
      updateDrivePatientContext();
      showToast(`รันรหัส HN ถัดไป: ${patientHnInput.value}`, 'info');
    });

    // Auto-format HN on Blur (e.g. typing 1 becomes 00001)
    patientHnInput.addEventListener('blur', () => {
      const formatted = api.formatHN(patientHnInput.value);
      if (formatted) {
        patientHnInput.value = formatted;
        updateDrivePatientContext();
      }
    });

    patientHnInput.addEventListener('input', () => {
      updateDrivePatientContext();
    });

    // Auto-format Treatment Date on Blur (normal Day/Month/Year without time)
    treatmentDateInput.addEventListener('blur', () => {
      if (treatmentDateInput.value.trim()) {
        treatmentDateInput.value = formatTreatmentDateString(treatmentDateInput.value.trim());
      }
    });

    // Tab 3: Date Filter Chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeDateFilter = chip.getAttribute('data-filter');

        if (activeDateFilter === 'custom') {
          if (customDateRangeBox) customDateRangeBox.style.display = 'flex';
        } else {
          if (customDateRangeBox) customDateRangeBox.style.display = 'none';
        }

        applyFiltersAndSort(true);
      });
    });

    // Tab 3: Custom Date Range Inputs
    if (filterDateFromInput) {
      filterDateFromInput.addEventListener('change', () => {
        customDateFrom = filterDateFromInput.value;
        applyFiltersAndSort(true);
      });
    }

    if (filterDateToInput) {
      filterDateToInput.addEventListener('change', () => {
        customDateTo = filterDateToInput.value;
        applyFiltersAndSort(true);
      });
    }

    if (btnClearCustomDate) {
      btnClearCustomDate.addEventListener('click', () => {
        if (filterDateFromInput) filterDateFromInput.value = '';
        if (filterDateToInput) filterDateToInput.value = '';
        customDateFrom = '';
        customDateTo = '';
        applyFiltersAndSort(true);
      });
    }

    // Tab 3: Sortable Table Headers
    const sortHeaders = document.querySelectorAll('th.th-sortable');
    sortHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (currentSort.column === col) {
          // สลับทิศทาง asc / desc
          currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          currentSort.column = col;
          // ถ้าเป็นวันที่หรือ HN ให้เรียงจากใหม่สุด/มากสุดก่อน (desc), ถ้าเป็นชื่อเรียง ก-ฮ (asc)
          currentSort.direction = (col === 'treatmentDate' || col === 'hn') ? 'desc' : 'asc';
        }
        applyFiltersAndSort(false);
      });
    });

    // Tab 3: Pagination Controls
    if (rowsPerPageSelect) {
      rowsPerPageSelect.addEventListener('change', () => {
        rowsPerPage = parseInt(rowsPerPageSelect.value, 10) || 20;
        applyFiltersAndSort(true);
      });
    }

    if (btnFirstPage) {
      btnFirstPage.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage = 1;
          applyFiltersAndSort(false);
        }
      });
    }

    if (btnPrevPage) {
      btnPrevPage.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          applyFiltersAndSort(false);
        }
      });
    }

    if (btnNextPage) {
      btnNextPage.addEventListener('click', () => {
        currentPage++;
        applyFiltersAndSort(false);
      });
    }

    if (btnLastPage) {
      btnLastPage.addEventListener('click', () => {
        currentPage = 999999; // จะถูก clamp ให้เท่ากับ totalPages ใน applyFiltersAndSort
        applyFiltersAndSort(false);
      });
    }

    // Save Patient
    btnSavePatient.addEventListener('click', handleSavePatient);
    btnSaveFromDiag.addEventListener('click', handleSavePatient);

    // New Patient
    btnNewPatient.addEventListener('click', clearFormToNew);

    // Cancel Edit
    btnCancelEdit.addEventListener('click', clearFormToNew);

    // Delete Modal Actions
    btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
    btnCancelDelete.addEventListener('click', closeDeleteModal);
    btnConfirmDelete.addEventListener('click', confirmDelete);

    // Print Modal Actions
    btnClosePrintModal.addEventListener('click', closePrintModal);
    btnTriggerPrint.addEventListener('click', () => {
      window.print();
    });
    if (btnSaveDocDrive) {
      btnSaveDocDrive.addEventListener('click', saveMedicalRecordToDrive);
    }

    // Settings Modal
    if (settingsApiKey) settingsApiKey.value = api.getApiKey();
    btnOpenSettings.addEventListener('click', () => {
      settingsApiUrl.value = api.getApiUrl();
      if (settingsApiKey) settingsApiKey.value = api.getApiKey();
      if (settingsCalendarId) {
        settingsCalendarId.value = api.getCustomCalendarId();
      }
      connectionResultBox.className = 'connection-result-box';
      settingsModal.classList.add('open');
    });

    const btnMobileSettings = document.getElementById('btn-mobile-settings');
    if (btnMobileSettings) {
      btnMobileSettings.addEventListener('click', () => btnOpenSettings.click());
    }

    if (btnTestConnection) {
      btnTestConnection.addEventListener('click', runConnectionTest);
    }

    if (btnFixHn) {
      btnFixHn.addEventListener('click', runFixHn);
    }

    btnCloseSettingsModal.addEventListener('click', () => settingsModal.classList.remove('open'));
    btnCancelSettings.addEventListener('click', () => settingsModal.classList.remove('open'));

    btnSaveSettings.addEventListener('click', () => {
      api.setApiUrl(settingsApiUrl.value);
      if (settingsApiKey) api.setApiKey(settingsApiKey.value);
      if (settingsCalendarId) {
        api.setCustomCalendarId(settingsCalendarId.value);
        loadCalendarIframe(true);
      }
      settingsModal.classList.remove('open');
      const isOnline = api.isOnline();
      document.getElementById('system-status-text').textContent = isOnline
        ? 'เชื่อมต่อ Google Sheets & Drive สำเร็จ'
        : 'โหมดจำลองในเครื่อง (Offline)';
      showToast(isOnline ? 'บันทึกการเชื่อมต่อ Google Sheets & Drive แล้ว' : 'ใช้งานในโหมด LocalStorage', 'success');
      updateDrivePatientContext();
    });

    // Export JSON Backup
    btnExportBackup.addEventListener('click', () => {
      api.exportDataJSON();
      showToast('ดาวน์โหลดไฟล์สำรองข้อมูล JSON แล้ว', 'success');
    });

    // Lightbox Modal Controls
    if (btnCloseLightbox) {
      btnCloseLightbox.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeLightbox();
      });
    }

    // Lightbox Zoom Controls
    if (btnLightboxZoomIn) {
      btnLightboxZoomIn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        zoomInLightbox();
      });
    }

    if (btnLightboxZoomOut) {
      btnLightboxZoomOut.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        zoomOutLightbox();
      });
    }

    if (btnLightboxZoomReset) {
      btnLightboxZoomReset.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resetLightboxZoom();
      });
    }

    // Ctrl + Mouse Wheel Zoom (Normal Mouse Wheel scrolls up/down smoothly)
    if (lightboxBody) {
      lightboxBody.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          if (e.deltaY < 0) {
            zoomInLightbox();
          } else {
            zoomOutLightbox();
          }
        }
      }, { passive: false });
    }

    // Close modals on backdrop click
    window.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeDeleteModal();
      if (e.target === deleteApptModal) closeDeleteApptModal();
      if (e.target === createApptModal) closeCreateApptModal();
      if (e.target === printModal) closePrintModal();
      if (e.target === settingsModal) settingsModal.classList.remove('open');
      if (e.target === imagePreviewModal) closeLightbox();
      if (e.target === receiptModal) closeReceiptModal();
    });

    // Keyboard Shortcuts & Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDeleteModal();
        closeDeleteApptModal();
        closeCreateApptModal();
        closePrintModal();
        settingsModal.classList.remove('open');
        closeLightbox();
        closeReceiptModal();
        return;
      }

      // If Lightbox is open, handle zoom shortcuts
      if (imagePreviewModal && imagePreviewModal.classList.contains('open')) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          zoomInLightbox();
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          zoomOutLightbox();
        } else if (e.key === '0') {
          e.preventDefault();
          resetLightboxZoom();
        }
      }
    });
  }

  // =========================================================================
  // TAB 5: BILLING & RECEIPTS SYSTEM (คิดเงิน & ออกใบเสร็จ)
  // =========================================================================

  /**
   * Formats numbers with commas and 2 decimals
   */
  function formatNumberWithCommas(x) {
    if (x == null || isNaN(x)) return '0.00';
    const num = Number(x);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatThaiMonthYear(yearMonthStr) {
    if (!yearMonthStr || !yearMonthStr.includes('-')) return yearMonthStr || '-';
    const parts = yearMonthStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const thaiYear = y + 543;
    const mName = THAI_MONTH_NAMES[m - 1] || '';
    return `${mName} ${thaiYear}`;
  }

  async function loadMonthlyReceipts(monthKey) {
    if (!monthKey) {
      const now = new Date();
      monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    billingCurrentPage = 1;

    if (receiptsHistoryTbody) {
      receiptsHistoryTbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 32px; color: var(--text-muted);">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 8px; color: var(--primary-color);"></i>
            <p>กำลังเชื่อมต่อและโหลดข้อมูลใบเสร็จจาก Google Sheets...</p>
          </td>
        </tr>
      `;
    }

    try {
      const data = await api.getReceipts(monthKey);
      allReceipts = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error loading receipts:', err);
      allReceipts = [];
    }

    initBillingMonthOptions();
    renderBillingDashboard(monthKey);
    renderReceiptsHistory(monthKey);
  }

  function setupBillingSystem() {
    initBillingMonthOptions();
    setupBillPatientSearch();
    setupBillCatalogButtons();
    setupBillCalculationEvents();
    setupReceiptModalEvents();
    setupBillingPaginationEvents();
    renderQuickTodayPatients();

    // Default bill date to today
    if (billDate && !billDate.value) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      billDate.value = `${y}-${m}-${d}`;
    }

    // Month filter change
    if (billingMonthSelect) {
      billingMonthSelect.addEventListener('change', async () => {
        billingCurrentPage = 1;
        activeBillingMonth = billingMonthSelect.value;
        await loadMonthlyReceipts(activeBillingMonth);
      });
    }

    // Export CSV
    if (btnExportBillingCsv) {
      btnExportBillingCsv.addEventListener('click', () => {
        exportBillingCsv(activeBillingMonth);
      });
    }

    // Save Bill actions
    if (btnSaveBillOnly) {
      btnSaveBillOnly.addEventListener('click', () => handleSaveBill(false));
    }
    if (btnSavePrintBill) {
      btnSavePrintBill.addEventListener('click', () => handleSaveBill(true));
    }
    if (btnClearBill) {
      btnClearBill.addEventListener('click', () => {
        if (currentBillItems.length === 0 && (!billSelectedHN || !billSelectedHN.value)) {
          clearBillForm();
          return;
        }
        if (confirm('คุณต้องการล้างรายการและข้อมูลในบิลนี้ทั้งหมดใช่หรือไม่?')) {
          clearBillForm();
          showToast('ล้างรายการบิลเรียบร้อยแล้ว', 'info');
        }
      });
    }
  }

  function initBillingMonthOptions() {
    if (!billingMonthSelect) return;
    const now = new Date();
    const currentY = now.getFullYear();
    const currentM = now.getMonth() + 1;
    const currentYM = `${currentY}-${String(currentM).padStart(2, '0')}`;

    // Collect all unique months from receipts + past 12 months
    const monthSet = new Set();
    monthSet.add(currentYM);

    // Past 12 months
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentY, currentM - 1 - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthSet.add(ym);
    }

    // Add any months found in stored receipts
    if (Array.isArray(allReceipts)) {
      allReceipts.forEach(r => {
        if (r.monthKey) monthSet.add(r.monthKey);
        else if (r.date) {
          const ym = r.date.substring(0, 7);
          if (ym.length === 7) monthSet.add(ym);
        }
      });
    }

    // Sort descending (latest month first)
    const sortedMonths = Array.from(monthSet).sort().reverse();

    let html = '';
    sortedMonths.forEach(ym => {
      const isSelected = ym === activeBillingMonth || (ym === currentYM && !activeBillingMonth) ? 'selected' : '';
      html += `<option value="${ym}" ${isSelected}>${formatThaiMonthYear(ym)}</option>`;
    });

    billingMonthSelect.innerHTML = html;
    if (!activeBillingMonth) activeBillingMonth = currentYM;
  }

  async function onSwitchToBillingTab() {
    renderQuickTodayPatients();

    // If currently editing a patient and no patient is selected in bill, auto-select!
    if (currentEditingHN && (!billSelectedHN || !billSelectedHN.value)) {
      const p = (allPatients || []).find(item => item.hn === currentEditingHN);
      if (p) {
        selectPatientForBill(p);
      }
    }

    if (billingMonthSelect && billingMonthSelect.value) {
      activeBillingMonth = billingMonthSelect.value;
    }

    await loadMonthlyReceipts(activeBillingMonth);
  }

  function setupBillPatientSearch() {
    if (!billPatientSearch) return;

    let searchTimeout = null;
    billPatientSearch.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        handleBillPatientSearchInput();
      }, 300);
    });

    billPatientSearch.addEventListener('focus', () => {
      if (billPatientSearch.value.trim().length > 0) {
        handleBillPatientSearchInput();
      }
    });

    if (btnClearBillPatient) {
      btnClearBillPatient.addEventListener('click', () => {
        clearSelectedPatientForBill();
      });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#bill-patient-search') && !e.target.closest('#bill-patient-dropdown')) {
        if (billPatientDropdown) billPatientDropdown.style.display = 'none';
      }
    });
  }

  function handleBillPatientSearchInput() {
    if (!billPatientSearch || !billPatientDropdown) return;
    const q = (billPatientSearch.value || '').trim().toLowerCase();

    if (!q) {
      billPatientDropdown.style.display = 'none';
      billPatientDropdown.innerHTML = '';
      if (btnClearBillPatient) btnClearBillPatient.style.display = 'none';
      return;
    }

    if (btnClearBillPatient) btnClearBillPatient.style.display = 'block';

    const matches = (allPatients || []).filter(p => {
      const hn = (p.hn || '').toLowerCase();
      const name = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return hn.includes(q) || name.includes(q) || phone.includes(q);
    }).slice(0, 8);

    if (matches.length === 0) {
      billPatientDropdown.innerHTML = '<div class="appt-patient-empty"><i class="fa-regular fa-folder-open"></i> ไม่พบคนไข้ที่ตรงกับคำค้นหา</div>';
    } else {
      billPatientDropdown.innerHTML = matches.map(p => {
        const pName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
        return `
          <div class="appt-patient-item bill-patient-item" data-hn="${escapeHtml(p.hn)}">
            <div>
              <span class="appt-patient-item-hn">HN: ${escapeHtml(p.hn)}</span>
              <span class="appt-patient-item-name">${escapeHtml(pName)}</span>
            </div>
            <div class="appt-patient-item-sub">${escapeHtml(api.formatPhone(p.phone) || p.diagnosis || '')}</div>
          </div>
        `;
      }).join('');

      billPatientDropdown.querySelectorAll('.bill-patient-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const hn = item.getAttribute('data-hn');
          const target = (allPatients || []).find(p => p.hn === hn);
          if (target) selectPatientForBill(target);
        });
      });
    }

    billPatientDropdown.style.display = 'block';
  }

  function selectPatientForBill(p) {
    if (!p) return;
    const cleanHn = api.formatHN(p.hn);
    const pName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    if (billPatientSearch) {
      billPatientSearch.value = `HN: ${cleanHn} - ${pName}`;
    }
    if (billSelectedHN) billSelectedHN.value = cleanHn;
    if (billSelectedName) billSelectedName.value = pName;
    if (billSelectedPhone) billSelectedPhone.value = api.formatPhone(p.phone) || '-';
    if (btnClearBillPatient) btnClearBillPatient.style.display = 'block';
    if (billPatientDropdown) {
      billPatientDropdown.style.display = 'none';
      billPatientDropdown.innerHTML = '';
    }
  }

  function clearSelectedPatientForBill() {
    if (billPatientSearch) billPatientSearch.value = '';
    if (billSelectedHN) billSelectedHN.value = '';
    if (billSelectedName) billSelectedName.value = '';
    if (billSelectedPhone) billSelectedPhone.value = '';
    if (btnClearBillPatient) btnClearBillPatient.style.display = 'none';
    if (billPatientDropdown) {
      billPatientDropdown.style.display = 'none';
      billPatientDropdown.innerHTML = '';
    }
  }

  function setupBillCatalogButtons() {
    const catalogBtns = document.querySelectorAll('.btn-catalog-item');
    catalogBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const price = parseFloat(btn.getAttribute('data-price')) || 0;
        addBillItem(name, price);
      });
    });

    if (btnAddCustomItem) {
      btnAddCustomItem.addEventListener('click', () => {
        const customName = prompt('ระบุชื่อรายการรักษา หรืออุปกรณ์:');
        if (customName && customName.trim()) {
          const priceInput = prompt('ระบุราคาต่อหน่วย (บาท):', '0');
          const price = parseFloat(priceInput) || 0;
          addBillItem(customName.trim(), price);
        }
      });
    }
  }

  function addBillItem(name, unitPrice) {
    const existing = currentBillItems.find(item => item.name === name);
    if (existing) {
      existing.qty += 1;
      existing.total = existing.qty * existing.unitPrice;
      showToast(`เพิ่มจำนวน "${name}" เป็น ${existing.qty}`, 'info');
    } else {
      const newItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: name,
        unitPrice: Math.max(0, unitPrice),
        qty: 1,
        total: Math.max(0, unitPrice)
      };
      currentBillItems.push(newItem);
      showToast(`เพิ่ม "${name}" ลงในบิลแล้ว`, 'success');
    }
    renderBillItemsTable();
    calculateBillTotals();
  }

  function removeBillItem(itemId) {
    currentBillItems = currentBillItems.filter(item => item.id !== itemId);
    renderBillItemsTable();
    calculateBillTotals();
  }

  function updateBillItemUnitPrice(itemId, newPrice) {
    const item = currentBillItems.find(i => i.id === itemId);
    if (item) {
      item.unitPrice = Math.max(0, parseFloat(newPrice) || 0);
      item.total = item.qty * item.unitPrice;
      renderBillItemsTable(false);
      calculateBillTotals();
    }
  }

  function updateBillItemQty(itemId, newQty) {
    const item = currentBillItems.find(i => i.id === itemId);
    if (item) {
      item.qty = Math.max(1, parseInt(newQty, 10) || 1);
      item.total = item.qty * item.unitPrice;
      renderBillItemsTable(false);
      calculateBillTotals();
    }
  }

  function renderBillItemsTable(fullRender = true) {
    if (!billItemsTbody) return;

    if (currentBillItems.length === 0) {
      billItemsTbody.innerHTML = `
        <tr class="bill-empty-row">
          <td colspan="6" style="text-align: center; padding: 28px; color: var(--text-muted);">
            <i class="fa-solid fa-basket-shopping" style="font-size: 24px; margin-bottom: 6px; display: block; color: #cbd5e1;"></i>
            ยังไม่มีรายการในบิล — กรุณาคลิกเลือกรายการด้านบน หรือกดเพิ่มรายการเอง
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    currentBillItems.forEach((item, idx) => {
      html += `
        <tr data-item-id="${item.id}">
          <td style="text-align: center; color: var(--text-muted); font-size: 12.5px;">${idx + 1}</td>
          <td>
            <div class="bill-item-name" style="font-weight: 600; color: var(--text-dark);">${escapeHtml(item.name)}</div>
          </td>
          <td style="text-align: right;">
            <input type="number" class="bill-input-price" data-id="${item.id}" value="${item.unitPrice}" min="0" step="any" style="width: 110px; text-align: right; padding: 4px 8px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 4px;">
          </td>
          <td style="text-align: center;">
            <input type="number" class="bill-input-qty" data-id="${item.id}" value="${item.qty}" min="1" step="1" style="width: 65px; text-align: center; padding: 4px 8px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 4px;">
          </td>
          <td style="text-align: right; font-weight: 700; color: var(--primary-color);">
            ฿${formatNumberWithCommas(item.total)}
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn-delete-bill-item" data-id="${item.id}" title="ลบรายการนี้" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px 8px; font-size: 14px;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    });

    billItemsTbody.innerHTML = html;

    billItemsTbody.querySelectorAll('.bill-input-price').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        updateBillItemUnitPrice(id, e.target.value);
      });
    });

    billItemsTbody.querySelectorAll('.bill-input-qty').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        updateBillItemQty(id, e.target.value);
      });
    });

    billItemsTbody.querySelectorAll('.btn-delete-bill-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        removeBillItem(id);
      });
    });
  }

  function setupBillCalculationEvents() {
    if (btnDiscountBaht) {
      btnDiscountBaht.addEventListener('click', () => {
        billDiscountType = 'baht';
        btnDiscountBaht.classList.add('active');
        if (btnDiscountPercent) btnDiscountPercent.classList.remove('active');
        calculateBillTotals();
      });
    }

    if (btnDiscountPercent) {
      btnDiscountPercent.addEventListener('click', () => {
        billDiscountType = 'percent';
        btnDiscountPercent.classList.add('active');
        if (btnDiscountBaht) btnDiscountBaht.classList.remove('active');
        calculateBillTotals();
      });
    }

    if (billDiscountInput) {
      billDiscountInput.addEventListener('input', calculateBillTotals);
      billDiscountInput.addEventListener('change', calculateBillTotals);
    }
  }

  function calculateBillTotals() {
    let subtotal = 0;
    currentBillItems.forEach(item => {
      subtotal += (item.unitPrice * item.qty);
    });

    let discountRaw = parseFloat(billDiscountInput ? billDiscountInput.value : 0) || 0;
    discountRaw = Math.max(0, discountRaw);

    let calculatedDiscount = 0;
    if (billDiscountType === 'percent') {
      calculatedDiscount = (subtotal * discountRaw) / 100;
    } else {
      calculatedDiscount = discountRaw;
    }

    if (calculatedDiscount > subtotal) {
      calculatedDiscount = subtotal;
    }

    const netTotal = Math.max(0, subtotal - calculatedDiscount);

    if (billSubtotalDisplay) {
      billSubtotalDisplay.textContent = `฿${formatNumberWithCommas(subtotal)}`;
    }

    if (billDiscountCalcDisplay) {
      billDiscountCalcDisplay.textContent = `-฿${formatNumberWithCommas(calculatedDiscount)}`;
    }

    if (billNetTotalDisplay) {
      billNetTotalDisplay.textContent = `฿${formatNumberWithCommas(netTotal)}`;
    }

    return {
      subtotal,
      discountRaw,
      discountType: billDiscountType,
      calculatedDiscount,
      netTotal
    };
  }

  async function handleSaveBill(shouldPrint) {
    const hn = billSelectedHN ? api.formatHN(billSelectedHN.value.trim()) : '';
    const patientName = billSelectedName ? billSelectedName.value.trim() : '';
    const phone = billSelectedPhone ? api.formatPhone(billSelectedPhone.value.trim()) : '';

    if (!hn || !patientName) {
      showToast('กรุณาเลือกคนไข้ก่อนบันทึกบิล', 'error');
      if (billPatientSearch) billPatientSearch.focus();
      return;
    }

    if (currentBillItems.length === 0) {
      showToast('กรุณาเลือกรายการรักษาอย่างน้อย 1 รายการ', 'error');
      return;
    }

    const totals = calculateBillTotals();
    const dateVal = billDate && billDate.value ? billDate.value : new Date().toISOString().split('T')[0];
    const cashier = billCashierName && billCashierName.value.trim() ? billCashierName.value.trim() : 'นักกายภาพบำบัด';
    const notes = billNotes ? billNotes.value.trim() : '';

    let paymentMethod = 'เงินสด';
    const checkedRadio = document.querySelector('input[name="bill-payment-method"]:checked');
    if (checkedRadio) {
      paymentMethod = checkedRadio.value;
    }

    const receiptNo = generateNextReceiptNumber(dateVal);
    const monthKey = dateVal.substring(0, 7);

    const receipt = {
      receiptNo: receiptNo,
      date: dateVal,
      createdAt: new Date().toISOString(),
      monthKey: monthKey,
      hn: hn,
      patientName: patientName,
      patientPhone: phone,
      items: JSON.parse(JSON.stringify(currentBillItems)),
      subtotal: totals.subtotal,
      discountType: totals.discountType,
      discountValue: totals.discountRaw,
      discountAmount: totals.calculatedDiscount,
      netTotal: totals.netTotal,
      paymentMethod: paymentMethod,
      cashierName: cashier,
      notes: notes,
      isNew: true
    };

    const actionBtn = shouldPrint ? btnSavePrintBill : btnSaveBillOnly;
    const originalBtnHtml = actionBtn ? actionBtn.innerHTML : '';
    if (actionBtn) {
      actionBtn.disabled = true;
      actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
    }

    try {
      const res = await api.saveReceipt(receipt);
      if (res && res.success) {
        if (res.receiptNoChanged) {
          showToast(`เลขที่ ${receiptNo} ถูกใช้แล้ว ระบบออกใบเสร็จเป็นเลขที่ ${receipt.receiptNo}`, 'warning');
        } else {
          showToast(`บันทึกใบเสร็จเลขที่ ${receipt.receiptNo} ลง Google Sheets สำเร็จ`, 'success');
        }
        await loadMonthlyReceipts(monthKey);
        if (billingMonthSelect) billingMonthSelect.value = monthKey;

        if (shouldPrint) {
          openReceiptModal(receipt);
        } else {
          clearBillForm();
        }
      } else {
        showToast((res && res.error) || 'เกิดข้อผิดพลาดในการบันทึกใบเสร็จ', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
        actionBtn.innerHTML = originalBtnHtml;
      }
    }
  }

  function clearBillForm() {
    currentBillItems = [];
    renderBillItemsTable();
    clearSelectedPatientForBill();
    if (billNotes) billNotes.value = '';
    if (billDiscountInput) billDiscountInput.value = '0';
    billDiscountType = 'baht';
    if (btnDiscountBaht) btnDiscountBaht.classList.add('active');
    if (btnDiscountPercent) btnDiscountPercent.classList.remove('active');
    calculateBillTotals();
  }

  function generateNextReceiptNumber(dateStr) {
    let d = new Date();
    if (dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    const thaiYear = d.getFullYear() + 543;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const prefix = `REC-${thaiYear}${month}-`;

    let maxSeq = 0;
    (allReceipts || []).forEach(r => {
      if (r.receiptNo && r.receiptNo.startsWith(prefix)) {
        const seqPart = r.receiptNo.substring(prefix.length);
        const num = parseInt(seqPart, 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
  }

  function renderBillingDashboard(yearMonth) {
    if (!yearMonth) {
      const now = new Date();
      yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const monthReceipts = (allReceipts || []).filter(r => {
      if (r.monthKey) return r.monthKey === yearMonth;
      if (r.date) return r.date.startsWith(yearMonth);
      return false;
    });

    let totalRev = 0;
    let cashRev = 0;
    let transferRev = 0;
    let cardRev = 0;
    const patientHns = new Set();

    monthReceipts.forEach(r => {
      const net = parseFloat(r.netTotal) || 0;
      totalRev += net;
      if (r.hn) patientHns.add(r.hn);
      else if (r.patientName) patientHns.add(r.patientName);

      const pm = (r.paymentMethod || '').toLowerCase();
      if (pm.includes('สด')) cashRev += net;
      else if (pm.includes('โอน') || pm.includes('qr') || pm.includes('promptpay')) transferRev += net;
      else if (pm.includes('บัตร')) cardRev += net;
      else cashRev += net;
    });

    const billsCount = monthReceipts.length;
    const avgPerBill = billsCount > 0 ? (totalRev / billsCount) : 0;

    if (bStatRevenue) bStatRevenue.textContent = `฿${formatNumberWithCommas(totalRev)}`;
    if (bStatPatients) bStatPatients.textContent = `${patientHns.size} คน`;
    if (bStatBillsCount) bStatBillsCount.textContent = `${billsCount} บิล`;
    if (bStatAvg) bStatAvg.textContent = `฿${formatNumberWithCommas(avgPerBill)}`;
    if (bStatCash) bStatCash.textContent = `฿${formatNumberWithCommas(cashRev)}`;
    if (bStatTransfer) bStatTransfer.textContent = `฿${formatNumberWithCommas(transferRev)}`;
    if (bStatCard) bStatCard.textContent = `฿${formatNumberWithCommas(cardRev)}`;
  }

  function renderReceiptsHistory(yearMonth) {
    if (!receiptsHistoryTbody) return;

    if (historyMonthLabel) {
      historyMonthLabel.textContent = formatThaiMonthYear(yearMonth);
    }

    const monthReceipts = (allReceipts || []).filter(r => {
      if (r.monthKey) return r.monthKey === yearMonth;
      if (r.date) return r.date.startsWith(yearMonth);
      return false;
    });

    if (monthReceipts.length === 0) {
      receiptsHistoryTbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 32px; color: var(--text-muted);">
            <i class="fa-solid fa-receipt" style="font-size: 24px; margin-bottom: 6px; display: block; color: #cbd5e1;"></i>
            ไม่พบข้อมูลใบเสร็จในเดือน ${formatThaiMonthYear(yearMonth)}
          </td>
        </tr>
      `;
      if (billingPaginationBar) billingPaginationBar.style.display = 'none';
      return;
    }

    monthReceipts.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

    // Pagination calculations
    const totalItems = monthReceipts.length;
    const totalPages = Math.ceil(totalItems / billingRowsPerPage) || 1;
    if (billingCurrentPage > totalPages) billingCurrentPage = totalPages;
    if (billingCurrentPage < 1) billingCurrentPage = 1;

    const startIndex = (billingCurrentPage - 1) * billingRowsPerPage;
    const endIndex = Math.min(startIndex + billingRowsPerPage, totalItems);
    const pageReceipts = monthReceipts.slice(startIndex, endIndex);

    let html = '';
    pageReceipts.forEach(r => {
      let dateDisplay = r.date || '-';
      if (r.date) {
        const p = r.date.split('-');
        if (p.length === 3) {
          dateDisplay = `${p[2]}/${p[1]}/${parseInt(p[0], 10) + 543}`;
        }
      }

      const itemsSummary = (r.items || []).map(i => `${i.name} (x${i.qty})`).join(', ');

      html += `
        <tr>
          <td><strong style="color: var(--primary-color); font-size: 12.5px;">${escapeHtml(r.receiptNo)}</strong></td>
          <td><span style="font-size: 12px; color: #475569;">${escapeHtml(dateDisplay)}</span></td>
          <td><span class="badge" style="background: #e2e8f0; color: #1e293b;">${escapeHtml(api.formatHN(r.hn) || '-')}</span></td>
          <td><div style="font-weight: 600;">${escapeHtml(r.patientName || '-')}</div></td>
          <td><div style="font-size: 12px; color: #64748b; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(itemsSummary)}">${escapeHtml(itemsSummary)}</div></td>
          <td style="text-align: right;"><strong style="color: var(--gold-dark); font-size: 13.5px;">฿${formatNumberWithCommas(r.netTotal)}</strong></td>
          <td style="text-align: center;"><span class="badge" style="background: #ecfdf5; color: #065f46; font-size: 11px;">${escapeHtml(r.paymentMethod || 'เงินสด')}</span></td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 4px; justify-content: center;">
              <button type="button" class="btn btn-outline btn-sm btn-view-receipt" data-id="${escapeHtml(r.id)}" title="ดูและพิมพ์ใบเสร็จ" style="padding: 4px 8px; font-size: 11.5px;">
                <i class="fa-solid fa-print"></i> พิมพ์
              </button>
              <button type="button" class="btn btn-outline btn-sm btn-delete-receipt" data-id="${escapeHtml(r.id)}" data-no="${escapeHtml(r.receiptNo)}" title="ยกเลิก/ลบใบเสร็จ" style="padding: 4px 8px; font-size: 11.5px; color: #ef4444; border-color: #fecdd3;">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    receiptsHistoryTbody.innerHTML = html;

    receiptsHistoryTbody.querySelectorAll('.btn-view-receipt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const r = (allReceipts || []).find(item => item.id === id || item.receiptNo === id);
        if (r) openReceiptModal(r);
      });
    });

    receiptsHistoryTbody.querySelectorAll('.btn-delete-receipt').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const no = btn.getAttribute('data-no');
        const r = (allReceipts || []).find(item => item.id === id || item.receiptNo === no);
        if (confirm(`คุณต้องการยกเลิก/ลบใบเสร็จเลขที่ "${no}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
          const res = await api.deleteReceipt(no, (r && r.monthKey) || activeBillingMonth);
          if (res && res.success) {
            await loadMonthlyReceipts(activeBillingMonth);
            showToast(`ลบใบเสร็จเลขที่ ${no} จาก Google Sheets สำเร็จ`, 'info');
          } else {
            showToast((res && res.error) || 'เกิดข้อผิดพลาดในการลบใบเสร็จ', 'error');
          }
        }
      });
    });

    // Render Billing Pagination Controls
    renderBillingPagination(totalItems, totalPages, startIndex, endIndex);
  }

  function renderBillingPagination(totalItems, totalPages, startIndex, endIndex) {
    if (!billingPaginationBar) return;

    if (totalItems === 0) {
      billingPaginationBar.style.display = 'none';
      return;
    }

    billingPaginationBar.style.display = 'flex';

    if (billingPaginationInfo) {
      billingPaginationInfo.textContent = `แสดง ${startIndex + 1}-${endIndex} จาก ${totalItems} บิล`;
    }

    if (btnBillingPrevPage) btnBillingPrevPage.disabled = (billingCurrentPage <= 1);
    if (btnBillingNextPage) btnBillingNextPage.disabled = (billingCurrentPage >= totalPages);

    if (!billingPaginationPages) return;
    billingPaginationPages.innerHTML = '';

    // Smart Page Windowing
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (billingCurrentPage > 3) pages.push('...');

      const start = Math.max(2, billingCurrentPage - 1);
      const end = Math.min(totalPages - 1, billingCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (billingCurrentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    pages.forEach(p => {
      if (p === '...') {
        const span = document.createElement('span');
        span.className = 'page-ellipsis';
        span.textContent = '...';
        billingPaginationPages.appendChild(span);
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `page-num-btn ${p === billingCurrentPage ? 'active' : ''}`;
        btn.textContent = p;
        btn.setAttribute('data-page', p);
        btn.addEventListener('click', () => {
          billingCurrentPage = p;
          renderReceiptsHistory(activeBillingMonth);
        });
        billingPaginationPages.appendChild(btn);
      }
    });
  }

  function setupBillingPaginationEvents() {
    if (btnBillingPrevPage) {
      btnBillingPrevPage.addEventListener('click', () => {
        if (billingCurrentPage > 1) {
          billingCurrentPage--;
          renderReceiptsHistory(activeBillingMonth);
        }
      });
    }

    if (btnBillingNextPage) {
      btnBillingNextPage.addEventListener('click', () => {
        billingCurrentPage++;
        renderReceiptsHistory(activeBillingMonth);
      });
    }
  }

  function renderQuickTodayPatients() {
    if (!quickPatientContainer || !quickPatientChips) return;

    if (!allPatients || allPatients.length === 0) {
      quickPatientContainer.style.display = 'none';
      quickPatientChips.innerHTML = '';
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Look for patients treated today
    let candidatePatients = allPatients.filter(p => {
      const pDate = parseTreatmentDateToDate(p.treatmentDate);
      if (!pDate) return false;
      return pDate >= todayStart && pDate <= todayEnd;
    });

    let titleLabel = '<i class="fa-solid fa-bolt" style="color: var(--gold-dark); font-size: 11px;"></i> คนไข้ตรวจวันนี้ (คลิกเลือกด่วน):';

    // 2. Fallback to 5 most recent patients if none today
    if (candidatePatients.length === 0) {
      candidatePatients = [...allPatients].sort((a, b) => {
        const dateA = parseTreatmentDateToDate(a.treatmentDate);
        const dateB = parseTreatmentDateToDate(b.treatmentDate);
        const timeA = dateA ? dateA.getTime() : 0;
        const timeB = dateB ? dateB.getTime() : 0;
        return timeB - timeA;
      }).slice(0, 5);
      titleLabel = '<i class="fa-solid fa-clock-rotate-left" style="color: var(--gold-dark); font-size: 11px;"></i> คนไข้ล่าสุด (คลิกเลือกด่วน):';
    }

    if (candidatePatients.length === 0) {
      quickPatientContainer.style.display = 'none';
      quickPatientChips.innerHTML = '';
      return;
    }

    const titleEl = quickPatientContainer.querySelector('.quick-patient-title');
    if (titleEl) {
      titleEl.innerHTML = titleLabel;
    }

    quickPatientChips.innerHTML = candidatePatients.map(p => {
      const hnFormatted = api.formatHN(p.hn) || p.hn || '-';
      const pName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
      return `
        <button type="button" class="btn-quick-patient" data-hn="${escapeHtml(p.hn)}" title="เลือก ${escapeHtml(pName)} เพื่อออกบิล">
          <span class="quick-chip-hn">HN ${escapeHtml(hnFormatted)}</span>
          <span class="quick-chip-name">${escapeHtml(pName)}</span>
        </button>
      `;
    }).join('');

    quickPatientChips.querySelectorAll('.btn-quick-patient').forEach(btn => {
      btn.addEventListener('click', () => {
        const hn = btn.getAttribute('data-hn');
        const target = (allPatients || []).find(p => String(p.hn) === String(hn));
        if (target) {
          selectPatientForBill(target);
        }
      });
    });

    quickPatientContainer.style.display = 'block';
  }

  function setupReceiptModalEvents() {
    if (btnCloseReceiptModal) {
      btnCloseReceiptModal.addEventListener('click', closeReceiptModal);
    }
    if (btnTriggerPrintReceipt) {
      btnTriggerPrintReceipt.addEventListener('click', printReceipt);
    }
  }

  function renderReceiptSlipHtml(receipt, type) {
    const isCopy = (type === 'copy');
    const items = receipt.items || [];
    const itemCount = items.length;

    let tableScaleClass = '';
    if (itemCount >= 7) {
      tableScaleClass = 'ultra-compact';
    } else if (itemCount >= 4) {
      tableScaleClass = 'compact';
    }

    // Format date DD/MM/YYYY (พ.ศ.)
    let dStr = receipt.date || '';
    if (dStr) {
      const p = dStr.split('-');
      if (p.length === 3) {
        dStr = `${p[2]}/${p[1]}/${parseInt(p[0], 10) + 543}`;
      }
    }

    // Items table rows
    let itemsHtml = '';
    items.forEach((item, idx) => {
      itemsHtml += `
        <tr>
          <td style="text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="font-weight: 500;"><div class="item-name-cell" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div></td>
          <td style="text-align: center;">${item.qty}</td>
          <td style="text-align: right;">${formatNumberWithCommas(item.unitPrice)}</td>
          <td style="text-align: right; font-weight: 600;">${formatNumberWithCommas(item.total)}</td>
        </tr>
      `;
    });

    // Auto-fill empty placeholder rows if items < 4 to maintain fixed height & clean look
    const minRows = 4;
    if (itemCount < minRows) {
      for (let i = itemCount; i < minRows; i++) {
        itemsHtml += `
          <tr class="empty-placeholder-row">
            <td style="text-align: center; color: #cbd5e1;">${i + 1}</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
        `;
      }
    }

    // Baht text
    const bahtText = api.convertNumberToThaiBahtText(receipt.netTotal);

    // Notes
    let notesHtml = '';
    if (receipt.notes && receipt.notes.trim()) {
      notesHtml = `
        <div class="receipt-notes-display">
          <strong>หมายเหตุ:</strong> <span>${escapeHtml(receipt.notes.trim())}</span>
        </div>
      `;
    }

    // Discount
    let discountHtml = '';
    const disc = parseFloat(receipt.discountAmount || 0);
    if (disc > 0) {
      discountHtml = `
        <div class="rec-total-row discount-row">
          <span>ส่วนลด (Discount):</span>
          <span>-฿${formatNumberWithCommas(disc)}</span>
        </div>
      `;
    }

    return `
      <div class="receipt-slip-inner">
        <!-- Header -->
        <div class="receipt-header-row">
          <div class="receipt-brand-left">
            <img src="logo.png" alt="Merit Logo" class="receipt-logo">
            <div class="receipt-brand-text">
              <div class="receipt-clinic-eng">MERIT PHYSIOTHERAPY CLINIC</div>
              <div class="receipt-clinic-th">คลินิกกายภาพบำบัดเมอริท</div>
              <div class="receipt-clinic-sub">การตรวจประเมิน ฟื้นฟู รักษาทางกายภาพบำบัด และออกกำลังกาย</div>
              <div class="receipt-contact-line">
                <span><i class="fa-solid fa-phone"></i> 093-965-2293</span>
                <span><i class="fa-brands fa-facebook"></i> Meritphysio</span>
              </div>
            </div>
          </div>

          <div class="receipt-title-right">
            <div class="receipt-type-badge ${isCopy ? 'badge-copy' : 'badge-original'}">
              ${isCopy ? '<i class="fa-regular fa-copy"></i> สำเนา / COPY (สำหรับคลินิก)' : '<i class="fa-solid fa-certificate"></i> ต้นฉบับ / ORIGINAL (สำหรับลูกค้า)'}
            </div>
            <div class="receipt-main-title">ใบเสร็จรับเงิน</div>
            <div class="receipt-meta-box">
              <div class="receipt-meta-item"><span>เลขที่ / No:</span> <strong>${escapeHtml(receipt.receiptNo || '-')}</strong></div>
              <div class="receipt-meta-item"><span>วันที่ / Date:</span> <strong>${escapeHtml(dStr || '-')}</strong></div>
            </div>
          </div>
        </div>

        <!-- Customer Box -->
        <div class="receipt-customer-box">
          <div class="receipt-cust-grid">
            <div><span class="cust-lbl">ชื่อ-นามสกุล:</span> <strong class="cust-val">${escapeHtml(receipt.patientName || '-')}</strong></div>
            <div><span class="cust-lbl">HN:</span> <strong class="cust-val">${escapeHtml(api.formatHN(receipt.hn) || '-')}</strong></div>
            <div><span class="cust-lbl">เบอร์โทรศัพท์:</span> <span class="cust-val">${escapeHtml(api.formatPhone(receipt.patientPhone) || '-')}</span></div>
            <div><span class="cust-lbl">วิธีชำระเงิน:</span> <strong class="cust-val">${escapeHtml(receipt.paymentMethod || 'เงินสด')}</strong></div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="receipt-table-wrapper ${tableScaleClass}">
          <table class="receipt-items-table ${tableScaleClass}">
            <thead>
              <tr>
                <th style="width: 38px; text-align: center;">ลำดับ<br><small>No.</small></th>
                <th>รายการตรวจรักษา / หัตถการ<br><small>Description</small></th>
                <th style="width: 55px; text-align: center;">จำนวน<br><small>Qty</small></th>
                <th style="width: 95px; text-align: right;">ราคาต่อหน่วย<br><small>Unit Price</small></th>
                <th style="width: 105px; text-align: right;">จำนวนเงิน (บาท)<br><small>Amount (THB)</small></th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Summary & Totals -->
        <div class="receipt-summary-grid">
          <div class="receipt-baht-text-col">
            <div class="baht-text-title">จำนวนเงินตัวอักษร (Amount in words):</div>
            <div class="baht-text-val">${bahtText}</div>
            ${notesHtml}
          </div>

          <div class="receipt-totals-col">
            <div class="rec-total-row">
              <span>รวมเป็นเงิน (Subtotal):</span>
              <span>฿${formatNumberWithCommas(receipt.subtotal)}</span>
            </div>
            ${discountHtml}
            <div class="rec-total-row grand-row">
              <span>ยอดสุทธิ (Total Amount):</span>
              <span>฿${formatNumberWithCommas(receipt.netTotal)}</span>
            </div>
          </div>
        </div>

        <!-- Footer & Signature -->
        <div class="receipt-footer-row">
          <div class="receipt-footer-terms">
            <div>* เอกสารนี้ออกให้เพื่อเป็นหลักฐานการรับเงินค่าบริการทางกายภาพบำบัด</div>
            <div>คลินิกกายภาพบำบัดเมอริท ขอขอบพระคุณที่ไว้วางใจให้เราดูแลสุขภาพของท่าน</div>
          </div>
          <div class="receipt-signature-box">
            <div class="signature-line"></div>
            <div class="signature-name">(${escapeHtml(receipt.cashierName || 'นักกายภาพบำบัด')})</div>
            <div class="signature-title">ผู้รับเงิน / นักกายภาพบำบัด</div>
          </div>
        </div>
      </div>
    `;
  }

  function openReceiptModal(receipt) {
    if (!receipt || !receiptModal) return;
    currentActiveReceiptForPrint = receipt;

    const slipOriginal = document.getElementById('rec-slip-original');
    const slipCopy = document.getElementById('rec-slip-copy');

    if (slipOriginal) {
      slipOriginal.innerHTML = renderReceiptSlipHtml(receipt, 'original');
    }
    if (slipCopy) {
      slipCopy.innerHTML = renderReceiptSlipHtml(receipt, 'copy');
    }

    receiptModal.classList.add('open');
  }

  function closeReceiptModal() {
    if (receiptModal) receiptModal.classList.remove('open');
    currentActiveReceiptForPrint = null;
  }

  function printReceipt() {
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 1000);
  }

  function exportBillingCsv(yearMonth) {
    const monthReceipts = (allReceipts || []).filter(r => {
      if (r.monthKey) return r.monthKey === yearMonth;
      if (r.date) return r.date.startsWith(yearMonth);
      return false;
    });

    if (monthReceipts.length === 0) {
      showToast('ไม่พบข้อมูลใบเสร็จในเดือนนี้สำหรับส่งออก', 'info');
      return;
    }

    const headers = [
      'เลขที่ใบเสร็จ',
      'วันที่',
      'HN',
      'ชื่อคนไข้',
      'เบอร์โทร',
      'รายการรักษา',
      'ยอดรวมก่อนลด (บาท)',
      'ส่วนลด (บาท)',
      'ยอดสุทธิ (บาท)',
      'วิธีชำระเงิน',
      'ผู้รับเงิน',
      'หมายเหตุ'
    ];

    const rows = [headers];

    monthReceipts.forEach(r => {
      const itemsStr = (r.items || []).map(i => `${i.name} x${i.qty} (${i.total}B)`).join('; ');
      rows.push([
        r.receiptNo || '',
        r.date || '',
        api.formatHN(r.hn) || '',
        r.patientName || '',
        api.formatPhone(r.patientPhone) || '',
        itemsStr,
        r.subtotal || 0,
        r.discountAmount || 0,
        r.netTotal || 0,
        r.paymentMethod || '',
        r.cashierName || '',
        (r.notes || '').replace(/[\r\n]+/g, ' ')
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(row => 
      row.map(cell => {
        const cStr = String(cell == null ? '' : cell).replace(/"/g, '""');
        return `"${cStr}"`;
      }).join(',')
    ).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MeritClinic_Receipts_${yearMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`ส่งออกไฟล์ CSV ประจำเดือน ${yearMonth} สำเร็จ`, 'success');
  }

  // Kickstart Application
  init();
});
