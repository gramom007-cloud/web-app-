/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT BACKEND FOR MERIT PHYSIOTHERAPY CLINIC
 * ==============================================================================
 * โค้ดส่วนหลังบ้าน (Google Apps Script) สำหรับเชื่อมต่อเว็บแอปพลิเคชันเข้ากับ
 * 1. Google Sheets: จัดเก็บประวัติคนไข้ การวินิจฉัย และรายการไฟล์แบบเรียลไทม์
 * 2. Google Drive: จัดเก็บรูปภาพ X-ray, MRI, รูปท่าทาง และเอกสารเวชระเบียนอัตโนมัติ
 * 3. Google Calendar: ซิงค์และจัดการตารางนัดหมายคนไข้เข้ากับปฏิทินของ Gmail โดยตรง
 * 
 * ------------------------------------------------------------------------------
 * คู่มือการติดตั้งและอัปเดต (Setup & Update Guide):
 * 1. ไปที่ https://sheets.google.com และเปิดสเปรดชีตของคลินิก
 * 2. ที่แถบเมนูด้านบน เลือก "ส่วนขยาย" (Extensions) -> "Apps Script"
 * 3. วางโค้ดนี้ทั้งหมดแทนที่โค้ดเดิม แล้วกดปุ่มบันทึก (รูปแผ่นดิสก์)
 * 4. หากเคย Deploy แล้ว ให้กด "การใช้งานจริง" (Deploy) -> "จัดการการใช้งานจริง" (Manage deployments)
 *    -> กดไอคอนดินสอแก้ไข -> เลือกเวอร์ชัน "เวอร์ชันใหม่" (New version) -> กด "การใช้งานจริง" (Deploy)
 * 5. กดยืนยันสิทธิ์การเข้าถึง (Authorize access) สำหรับ Google Sheets, Google Drive และ Google Calendar
 * 6. คัดลอก "URL ของเว็บแอป" (Web app URL) ไปใส่ในเว็บแอปของคลินิก
 * ------------------------------------------------------------------------------
 */

/**
 * ==============================================================================
 * ⚠️ ฟังก์ชันสำหรับกดยืนยันสิทธิ์ (Authorize Permissions) - สำคัญมาก!
 * ==============================================================================
 * หากพบข้อความสีแดงแจ้งว่า: "The script does not have permission to perform that action"
 * ให้ทำตามขั้นตอนนี้ในหน้า Apps Script:
 * 1. ที่แถบเครื่องมือด้านบน ตรงดรอปดาวน์เลือกฟังก์ชัน ให้เลือก: "authorizeCalendarAndSheets"
 * 2. กดปุ่ม "เรียกใช้" (Run) (ปุ่มรูปสามเหลี่ยม Run)
 * 3. จะมีหน้าต่างเด้งขึ้นมา: "ต้องได้รับสิทธิ์การเข้าถึง" (Authorization Required)
 * 4. กดปุ่ม "ตรวจสอบสิทธิ์" (Review permissions)
 * 5. เลือกบัญชี Google ของคุณ
 * 6. หากขึ้นหน้าเตือนสีเทา "Google hasn't verified this app" ให้กดคำว่า "ขั้นสูง" (Advanced) ด้านล่างซ้าย
 * 7. กดคลิกลิงก์ "ไปที่ ... (ไม่ปลอดภัย)" (Go to ... (unsafe))
 * 8. เลื่อนลงมากดปุ่ม "อนุญาต" (Allow)
 * 9. เมื่อรันสำเร็จแล้ว ให้กลับมาที่หน้าเว็บแอปแล้วกดปุ่ม "ลองใหม่อีกครั้ง"
 * ==============================================================================
 */
function authorizeCalendarAndSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const drive = DriveApp.getRootFolder();
  const cal = CalendarApp.getDefaultCalendar();
  Logger.log("✅ ยืนยันสิทธิ์ Google Sheets, Drive และ Calendar สำเร็จเรียบร้อยแล้ว!");
  Logger.log("Spreadsheet Name: " + ss.getName());
  Logger.log("Drive Root: " + drive.getName());
  Logger.log("Calendar Name: " + (cal ? cal.getName() : "ไม่พบปฏิทิน"));
  return "Authorized Successfully!";
}

/**
 * ==============================================================================
 * 🔐 ตั้งค่ารหัสคลินิก (Clinic API Key) - ต้องทำ 1 ครั้งก่อนใช้งาน
 * ==============================================================================
 * ทุกคำขอจากเว็บแอปต้องแนบรหัสคลินิกมาด้วย คนที่มีแค่ลิงก์ Web App จะดึงหรือลบข้อมูลคนไข้ไม่ได้
 * 1. ที่ดรอปดาวน์เลือกฟังก์ชัน ให้เลือก: "setupClinicApiKey" แล้วกด "เรียกใช้" (Run)
 * 2. เปิด "บันทึกการดำเนินการ" (Execution log) ด้านล่าง จะเห็นรหัสคลินิกที่สร้างขึ้น
 * 3. คัดลอกรหัสนั้นไปวางในช่อง "รหัสคลินิก (Clinic API Key)" ในหน้าตั้งค่าของเว็บแอป ทุกเครื่อง
 * - รันซ้ำเมื่อต้องการเปลี่ยนรหัสใหม่ (เช่น รหัสหลุด) เครื่องที่ใช้รหัสเก่าจะเชื่อมต่อไม่ได้ทันที
 * - รหัสถูกเก็บใน Script Properties ไม่ได้อยู่ในโค้ด จึงวางโค้ดเวอร์ชันใหม่ทับได้โดยรหัสไม่หาย
 * ==============================================================================
 */
const API_KEY_PROPERTY = "CLINIC_API_KEY";

function setupClinicApiKey() {
  const key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "");
  PropertiesService.getScriptProperties().setProperty(API_KEY_PROPERTY, key);
  Logger.log("✅ สร้างรหัสคลินิกใหม่เรียบร้อย คัดลอกรหัสด้านล่างไปใส่ในหน้าตั้งค่าของเว็บแอป:");
  Logger.log(key);
  return key;
}

/**
 * ตรวจสอบรหัสคลินิกที่แนบมากับคำขอ
 * คืนค่า null ถ้าผ่าน หรือ JSON response สำหรับปฏิเสธคำขอ
 */
function checkApiKey(providedKey) {
  const expected = PropertiesService.getScriptProperties().getProperty(API_KEY_PROPERTY);
  if (!expected) {
    return createJsonResponse({
      status: "error",
      code: "API_KEY_NOT_SET",
      message: "ยังไม่ได้ตั้งรหัสคลินิกใน Apps Script: โปรดรันฟังก์ชัน setupClinicApiKey ก่อนใช้งาน"
    });
  }
  if (!providedKey || String(providedKey) !== expected) {
    return createJsonResponse({
      status: "error",
      code: "UNAUTHORIZED",
      message: "รหัสคลินิก (Clinic API Key) ไม่ถูกต้อง: โปรดตรวจสอบรหัสในหน้าตั้งค่าของเว็บแอป"
    });
  }
  return null;
}

// ชื่อโฟลเดอร์หลักใน Google Drive สำหรับจัดเก็บไฟล์ของคลินิก
const ROOT_DRIVE_FOLDER_NAME = "Merit_Physiotherapy_Clinic_Records";

// รายชื่อหัวคอลัมน์มาตรฐานสำหรับแผ่นงาน "Patients"
const PATIENT_COLUMNS = [
  "HN",
  "วันที่รักษา",
  "รหัสบัตรประชาชน",
  "ชื่อ",
  "นามสกุล",
  "เพศ",
  "วันเกิด_วัน",
  "วันเกิด_เดือน",
  "วันเกิด_ปี_พศ",
  "อายุ",
  "เชื้อชาติ",
  "เบอร์โทร",
  "ที่อยู่",
  "ชื่อผู้ติดต่อฉุกเฉิน",
  "เบอร์โทรฉุกเฉิน",
  "ความสัมพันธ์ฉุกเฉิน",
  "ความดันโลหิต_BP",
  "ชีพจร_PR",
  "น้ำหนัก_kg",
  "ส่วนสูง_cm",
  "BMI",
  "ผลแปล_BMI",
  "โรคประจำตัว",
  "ประวัติปัจจุบัน_PI_CC",
  "Subjective_Exam",
  "แพ้ยา",
  "ข้อห้าม_ควรระวัง",
  "Observation_การสังเกต",
  "Palpation_การคลำ",
  "Measurement_การวัด",
  "Physical_Exam_ตรวจร่างกาย",
  "Active_Test",
  "Passive_Test",
  "Special_Test",
  "Diagnosis_การวินิจฉัย",
  "Treatment_การรักษา",
  "Drive_Folder_URL",
  "วันที่บันทึก",
  "วันที่แก้ไขล่าสุด"
];

// รายชื่อหัวคอลัมน์มาตรฐานสำหรับแผ่นงาน "Patient_Files"
const FILE_COLUMNS = [
  "HN",
  "ชื่อคนไข้",
  "ชื่อไฟล์",
  "ประเภทไฟล์",
  "คำอธิบาย",
  "Drive_View_URL",
  "Drive_Download_URL",
  "Drive_File_ID",
  "วันที่อัปโหลด"
];

// ==============================================================================
// ข้อมูลสำหรับไฟล์แยก: ระบบคิดเงินและออกใบเสร็จ (Billing & Receipts)
// ==============================================================================
const BILLING_SPREADSHEET_NAME = "Merit_Physiotherapy_Clinic_Billing";

const RECEIPT_COLUMNS = [
  "เลขที่ใบเสร็จ",
  "วันที่",
  "เวลา",
  "HN",
  "ชื่อ_นามสกุลคนไข้",
  "เบอร์โทร",
  "รายการรักษา_สรุป",
  "รายการละเอียด_JSON",
  "ยอดรวมก่อนลด",
  "ประเภทส่วนลด",
  "ส่วนลดที่ระบุ",
  "จำนวนเงินส่วนลด",
  "ยอดสุทธิ",
  "วิธีชำระเงิน",
  "ผู้รับเงิน",
  "หมายเหตุ",
  "วันเวลาที่บันทึก"
];

/**
 * แปลงและจัดรูปแบบรหัส HN ให้เป็นข้อความ 5 หลักมาตรฐานเสมอ (เช่น 00001, 00002)
 * ป้องกันปัญหาระบบ Google Sheets แปลงเป็นตัวเลข 1, 2 หรือตัดเลข 0 นำหน้าออก
 */
function formatHN(hn) {
  if (hn === null || hn === undefined || hn === "") return "";
  const cleaned = String(hn).trim().replace(/^'/, "");
  if (/^\d+$/.test(cleaned)) {
    return cleaned.padStart(5, "0");
  }
  return cleaned;
}

/**
 * แปลงและจัดรูปแบบเบอร์โทรศัพท์ให้มีเลข 0 นำหน้าเสมอ และเป็นตัวเลขติดกันตามมาตรฐาน (เช่น 0804113195, 043859253)
 * ป้องกันและกู้คืนปัญหา Google Sheets ตัดเลข 0 นำหน้าออกเมื่อถูกบันทึกเป็น Number
 */
function formatPhone(phone) {
  if (phone === null || phone === undefined || phone === "") return "";
  let str = String(phone).trim().replace(/^'/, "");
  if (!str || str === "-") return "";

  // ลบอักขระที่ไม่ใช่ตัวเลขออกเพื่อตรวจสอบจำนวนหลัก
  const digits = str.replace(/\D/g, "");
  if (!digits) return str;

  // กรณีขึ้นต้นด้วย 0 อยู่แล้ว
  if (digits.startsWith("0")) {
    return digits;
  }

  // กรณีเบอร์มือถือ 9 หลักที่ขาดเลข 0 หน้าสุด (เช่น 804113195 -> 0804113195, 922554692 -> 0922554692)
  if (digits.length === 9 && /^[689]/.test(digits)) {
    return "0" + digits;
  }

  // กรณีเบอร์บ้าน/สำนักงาน 8 หลักที่ขาดเลข 0 หน้าสุด (เช่น 43859253 -> 043859253, 21234567 -> 021234567)
  if (digits.length === 8 && /^[23457]/.test(digits)) {
    return "0" + digits;
  }

  // กรณีขึ้นต้นด้วยรหัสประเทศไทย 66 (เช่น 66804113195 -> 0804113195)
  if (digits.startsWith("66") && digits.length >= 10) {
    return "0" + digits.substring(2);
  }

  return digits;
}

/**
 * แปลงและจัดรูปแบบวันที่รักษาให้เป็น วัน/เดือน/ปี (พ.ศ.) เท่านั้น (เช่น 09/07/2566)
 * ปราศจากเวลา (ไม่มี 00:00:00 GMT+0700)
 */
function formatTreatmentDateValue(val) {
  if (val === null || val === undefined || val === "") return "";
  if (val instanceof Date) {
    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(val.getDate());
    const month = pad(val.getMonth() + 1);
    let year = val.getFullYear();
    if (year < 2400) year += 543;
    return `${day}/${month}/${year}`;
  }
  let str = String(val).trim().replace(/^'/, "");
  if (!str || str === "-") return "";

  // กรณีเป็นข้อความ Date เช่น Wed Jul 09 2566 00:00:00 GMT+0700 (Indochina Time)
  if (/[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d+/.test(str)) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const pad = (n) => String(n).padStart(2, "0");
      const day = pad(parsed.getDate());
      const month = pad(parsed.getMonth() + 1);
      let year = parsed.getFullYear();
      if (year < 2400) year += 543;
      return `${day}/${month}/${year}`;
    }
  }

  // ตัดเวลาถ้าติดมาด้วย เช่น "09/07/2566 00:00:00" หรือ "2023-07-09T00:00:00"
  if (str.includes("T")) {
    str = str.split("T")[0];
  } else if (str.includes(" ")) {
    str = str.split(" ")[0];
  }

  // รูปแบบ ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (isoMatch) {
    let y = parseInt(isoMatch[1], 10);
    if (y < 2400) y += 543;
    const m = String(isoMatch[2]).padStart(2, "0");
    const d = String(isoMatch[3]).padStart(2, "0");
    return `${d}/${m}/${y}`;
  }

  // รูปแบบ DD/MM/YYYY หรือ D/M/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, "0");
    const m = String(dmyMatch[2]).padStart(2, "0");
    let y = parseInt(dmyMatch[3], 10);
    if (y < 2400) y += 543;
    return `${d}/${m}/${y}`;
  }

  return str;
}

// ==============================================================================
// WEB APP ENTRY POINTS (doGet & doPost)
// ==============================================================================

function doGet(e) {
  const action = e ? e.parameter.action : null;

  // เปิดลิงก์ตรงๆ โดยไม่มี action -> ตอบแค่สถานะ ไม่เปิดเผยข้อมูลใดๆ
  if (!action) {
    return createJsonResponse({
      status: "success",
      message: "Merit Physiotherapy Clinic Apps Script Backend API is Running Successfully.",
      timestamp: new Date().toISOString()
    });
  }

  const authError = checkApiKey(e.parameter.apiKey);
  if (authError) return authError;

  if (action === "test" || action === "ping") {
    return handleTestConnection();
  }

  if (action === "getPatients") {
    const query = e.parameter.query || "";
    return handleGetPatients(query);
  }

  if (action === "getPatientFiles") {
    const hn = e.parameter.hn || "";
    return handleGetPatientFiles(hn);
  }

  if (action === "getFileBase64") {
    const fileId = e.parameter.fileId || "";
    return handleGetFileBase64(fileId);
  }

  if (action === "fixHN") {
    fixSheetHNFormatting();
    return createJsonResponse({
      status: "success",
      message: "ซ่อมแซมและจัดรูปแบบรหัส HN เป็น 5 หลัก (00001) ทุกชีตเรียบร้อยแล้ว"
    });
  }

  if (action === "getCalendarEvents") {
    const startDate = e.parameter.startDate || "";
    const endDate = e.parameter.endDate || "";
    const calendarId = e.parameter.calendarId || "";
    return handleGetCalendarEvents(startDate, endDate, calendarId);
  }

  if (action === "getCalendarInfo") {
    const calendarId = e.parameter.calendarId || "";
    return handleGetCalendarInfo(calendarId);
  }

  if (action === "getReceipts") {
    const monthKey = e.parameter.monthKey || "";
    return handleGetReceipts(monthKey);
  }

  // ค่าเริ่มต้นถ้าเปิดลิงก์ผ่านเบราว์เซอร์ตรงๆ
  return createJsonResponse({
    status: "success",
    message: "Merit Physiotherapy Clinic Apps Script Backend API is Running Successfully.",
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || (e ? e.parameter.action : "");

    const authError = checkApiKey(payload.apiKey || (e ? e.parameter.apiKey : ""));
    if (authError) return authError;

    if (action === "savePatient") {
      return handleSavePatient(payload.data || payload);
    }

    if (action === "deletePatient") {
      return handleDeletePatient(payload.hn || (e ? e.parameter.hn : ""));
    }

    if (action === "saveReceipt") {
      return handleSaveReceipt(payload.data || payload.receipt || payload);
    }

    if (action === "deleteReceipt") {
      const receiptNo = payload.receiptNo || (e ? e.parameter.receiptNo : "");
      const monthKey = payload.monthKey || (e ? e.parameter.monthKey : "");
      return handleDeleteReceipt(receiptNo, monthKey);
    }

    if (action === "uploadFile") {
      return handleUploadFileToDrive(payload);
    }

    if (action === "deleteFile") {
      return handleDeleteDriveFile(payload);
    }

    if (action === "saveMedicalRecordDoc") {
      return handleSaveMedicalRecordDoc(payload);
    }

    if (action === "getFileBase64") {
      return handleGetFileBase64(payload.fileId || payload.id || (e ? e.parameter.fileId : ""));
    }

    if (action === "getCalendarEvents") {
      return handleGetCalendarEvents(
        payload.startDate || (e ? e.parameter.startDate : ""),
        payload.endDate || (e ? e.parameter.endDate : ""),
        payload.calendarId || (e ? e.parameter.calendarId : "")
      );
    }

    if (action === "createCalendarEvent") {
      return handleCreateCalendarEvent(payload.data || payload);
    }

    if (action === "deleteCalendarEvent") {
      return handleDeleteCalendarEvent(
        payload.eventId || (e ? e.parameter.eventId : ""),
        payload.calendarId || (e ? e.parameter.calendarId : "")
      );
    }

    if (action === "getCalendarInfo") {
      return handleGetCalendarInfo(payload.calendarId || (e ? e.parameter.calendarId : ""));
    }

    if (action === "fixHN") {
      fixSheetHNFormatting();
      return createJsonResponse({
        status: "success",
        message: "ซ่อมแซมและจัดรูปแบบรหัส HN เป็น 5 หลัก (00001) ทุกชีตเรียบร้อยแล้ว"
      });
    }

    return createJsonResponse({
      status: "error",
      message: "ไม่พบคำสั่ง (Action) ที่ระบุ: " + action
    });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "เกิดข้อผิดพลาดในการประมวลผลคำขอ: " + error.toString()
    });
  }
}

// ==============================================================================
// 1. GOOGLE SHEETS PATIENT CRUD HANDLERS
// ==============================================================================

/**
 * ดึงรายการคนไข้ทั้งหมดจากชีต Patients
 */
function handleGetPatients(query) {
  try {
    const sheet = getOrCreatePatientsSheet();
    const rows = sheet.getDataRange().getValues();

    if (rows.length <= 1) {
      return createJsonResponse({ status: "success", data: [] });
    }

    const patients = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue; // ถ้าไม่มี HN ให้ข้าม

      const patient = mapRowToPatientObject(row);
      patient.hn = formatHN(patient.hn);
      patients.push(patient);
    }

    if (!query) {
      return createJsonResponse({ status: "success", data: patients });
    }

    const q = String(query).toLowerCase().trim();
    const filtered = patients.filter(p => {
      const fullName = (p.firstName + " " + p.lastName).toLowerCase();
      const phone = String(p.phone || "").toLowerCase();
      const hn = String(p.hn || "").toLowerCase();
      const diag = String(p.diagnosis || "").toLowerCase();
      return fullName.includes(q) || phone.includes(q) || hn.includes(q) || diag.includes(q);
    });

    return createJsonResponse({ status: "success", data: filtered });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

/**
 * บันทึกหรืออัปเดตข้อมูลคนไข้ลง Google Sheets
 */
function handleSavePatient(patientData) {
  // ล็อกให้บันทึกได้ทีละคำขอ ป้องกันหลายเครื่องได้ HN เดียวกันพร้อมกันแล้วเขียนทับกัน
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return createJsonResponse({ status: "error", message: "ระบบกำลังบันทึกข้อมูลจากเครื่องอื่นอยู่ โปรดลองใหม่อีกครั้ง" });
  }

  try {
    if (!patientData || !patientData.hn) {
      return createJsonResponse({ status: "error", message: "กรุณาระบุเลข HN คนไข้" });
    }

    patientData.hn = formatHN(patientData.hn);
    const requestedHn = patientData.hn;
    const sheet = getOrCreatePatientsSheet();
    const rows = sheet.getDataRange().getValues();
    let rowIndexToUpdate = findPatientRowIndex(rows, patientData.hn);

    // คนไข้ใหม่แต่ HN นี้มีคนใช้แล้ว (เช่น อีกเครื่องเพิ่งบันทึกไป) -> ออก HN ใหม่ แทนการเขียนทับคนไข้เดิม
    if (patientData.isNew && rowIndexToUpdate > 0) {
      patientData.hn = getNextHNFromRows(rows);
      rowIndexToUpdate = -1;
    }
    delete patientData.isNew;

    // สร้างหรือตรวจสอบโฟลเดอร์ Google Drive ของคนไข้รายนี้
    const patientDriveFolder = getOrCreatePatientDriveFolder(patientData.hn, patientData.firstName + " " + patientData.lastName);
    patientData.driveFolderUrl = patientDriveFolder ? patientDriveFolder.getUrl() : "";

    const nowStr = formatThaiDateTime(new Date());
    const hnChanged = patientData.hn !== requestedHn;
    const rowValues = mapPatientObjectToRow(patientData, nowStr);

    if (rowIndexToUpdate > 0) {
      // อัปเดตแถวเดิม
      const existingCreatedAt = rows[rowIndexToUpdate - 1][37];
      if (existingCreatedAt) rowValues[37] = existingCreatedAt;
      rowValues[38] = nowStr; // วันที่แก้ไขล่าสุด

      sheet.getRange(rowIndexToUpdate, 1, 1, rowValues.length).setValues([rowValues]);
      sheet.getRange(rowIndexToUpdate, 1).setNumberFormat("@");
      sheet.getRange(rowIndexToUpdate, 1).setHorizontalAlignment("center");
      sheet.getRange(rowIndexToUpdate, 2).setNumberFormat("@"); // วันที่รักษา
      sheet.getRange(rowIndexToUpdate, 3).setNumberFormat("@"); // รหัสบัตรประชาชน
      sheet.getRange(rowIndexToUpdate, 12).setNumberFormat("@"); // เบอร์โทรศัพท์
      sheet.getRange(rowIndexToUpdate, 15).setNumberFormat("@"); // เบอร์โทรฉุกเฉิน

      return createJsonResponse({
        status: "success",
        message: "อัปเดตข้อมูลคนไข้ใน Google Sheets สำเร็จ",
        data: patientData
      });
    } else {
      // เพิ่มแถวใหม่
      rowValues[37] = nowStr; // วันที่บันทึก
      rowValues[38] = nowStr; // วันที่แก้ไขล่าสุด
      sheet.appendRow(rowValues);

      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 1).setNumberFormat("@");
      sheet.getRange(lastRow, 1).setHorizontalAlignment("center");
      sheet.getRange(lastRow, 2).setNumberFormat("@"); // วันที่รักษา
      sheet.getRange(lastRow, 3).setNumberFormat("@"); // รหัสบัตรประชาชน
      sheet.getRange(lastRow, 12).setNumberFormat("@"); // เบอร์โทรศัพท์
      sheet.getRange(lastRow, 15).setNumberFormat("@"); // เบอร์โทรฉุกเฉิน

      return createJsonResponse({
        status: "success",
        message: hnChanged
          ? "HN " + requestedHn + " ถูกใช้แล้ว ระบบบันทึกคนไข้ใหม่เป็น HN " + patientData.hn
          : "บันทึกคนไข้ใหม่ลง Google Sheets สำเร็จ",
        data: patientData,
        hnChanged: hnChanged,
        previousHn: requestedHn
      });
    }
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

/**
 * หาแถว (1-indexed) ของคนไข้ตาม HN ในข้อมูลชีต คืนค่า -1 ถ้าไม่พบ
 */
function findPatientRowIndex(rows, hn) {
  const hnTarget = formatHN(hn).toLowerCase();
  const hnTargetNum = parseInt(hnTarget, 10);
  for (let i = 1; i < rows.length; i++) {
    const rawVal = rows[i][0];
    const rowHnStr = formatHN(rawVal).toLowerCase();
    const rowHnNum = parseInt(String(rawVal), 10);
    if (rowHnStr === hnTarget || (!isNaN(hnTargetNum) && !isNaN(rowHnNum) && rowHnNum === hnTargetNum)) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * คำนวณ HN ถัดไปจากค่าสูงสุดในชีต (รูปแบบ 5 หลัก เช่น 00126)
 */
function getNextHNFromRows(rows) {
  let maxNum = 0;
  for (let i = 1; i < rows.length; i++) {
    const nums = String(rows[i][0] || "").match(/\d+/g);
    if (!nums) continue;
    const num = parseInt(nums[nums.length - 1], 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }
  return String(maxNum + 1).padStart(5, "0");
}

/**
 * ลบข้อมูลคนไข้ตามรหัส HN
 */
function handleDeletePatient(hn) {
  try {
    if (!hn) return createJsonResponse({ status: "error", message: "ไม่ได้ระบุ HN" });

    const sheet = getOrCreatePatientsSheet();
    const rows = sheet.getDataRange().getValues();
    const hnTarget = formatHN(hn).toLowerCase();
    const hnTargetNum = parseInt(hnTarget, 10);

    for (let i = 1; i < rows.length; i++) {
      const rawVal = rows[i][0];
      const rowHnStr = formatHN(rawVal).toLowerCase();
      const rowHnNum = parseInt(String(rawVal), 10);
      if (rowHnStr === hnTarget || (!isNaN(hnTargetNum) && !isNaN(rowHnNum) && rowHnNum === hnTargetNum)) {
        sheet.deleteRow(i + 1);
        return createJsonResponse({ status: "success", message: "ลบข้อมูลคนไข้จาก Google Sheets สำเร็จ" });
      }
    }

    return createJsonResponse({ status: "error", message: "ไม่พบข้อมูล HN ที่ระบุในระบบ" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

// ==============================================================================
// 2. GOOGLE DRIVE ATTACHMENT & FILE STORAGE HANDLERS
// ==============================================================================

/**
 * อัปโหลดไฟล์ภาพ / เอกสารคนไข้เข้า Google Drive
 */
function handleUploadFileToDrive(payload) {
  try {
    const hn = formatHN(payload.hn || "");
    const patientName = payload.patientName || "Patient";
    const fileName = payload.fileName || ("file_" + Date.now() + ".jpg");
    const mimeType = payload.mimeType || "image/jpeg";
    const base64Data = payload.fileData || "";
    const description = payload.description || "-";

    if (!hn || !base64Data) {
      return createJsonResponse({ status: "error", message: "ข้อมูลไฟล์หรือ HN ไม่ครบถ้วน" });
    }

    // แปลง Base64 เป็น Blob
    const decodedBytes = Utilities.base64Decode(base64Data.replace(/^data:[^;]+;base64,/, ""));
    const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

    // ดึงโฟลเดอร์ของคนไข้ใน Google Drive
    const patientFolder = getOrCreatePatientDriveFolder(hn, patientName);
    const driveFile = patientFolder.createFile(blob);

    // ตั้งสิทธิ์การเข้าถึงให้สามารถเปิดดูผ่านลิงก์ได้
    try {
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      // ใช้สิทธิ์ปกติถ้าตั้งค่าโดเมนไม่อนุญาต
    }

    const fileId = driveFile.getId();
    const viewUrl = driveFile.getUrl();
    const downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
    const nowStr = formatThaiDateTime(new Date());

    // บันทึกรายการไฟล์ลงชีต Patient_Files
    const filesSheet = getOrCreateFilesSheet();
    filesSheet.appendRow([
      "'" + hn, // บังคับให้เป็นข้อความ 5 หลักคงที่ (เช่น '00001) ไม่ให้ชีตแปลงเป็นเลข 1
      patientName,
      fileName,
      mimeType,
      description,
      viewUrl,
      downloadUrl,
      fileId,
      nowStr
    ]);

    const lastRow = filesSheet.getLastRow();
    filesSheet.getRange(lastRow, 1).setNumberFormat("@");
    filesSheet.getRange(lastRow, 1).setHorizontalAlignment("center");

    return createJsonResponse({
      status: "success",
      message: "อัปโหลดไฟล์เข้า Google Drive เรียบร้อยแล้ว",
      fileId: fileId,
      viewUrl: viewUrl,
      downloadUrl: downloadUrl,
      fileName: fileName,
      folderUrl: patientFolder.getUrl()
    });
  } catch (err) {
    return createJsonResponse({ status: "error", message: "อัปโหลดเข้า Drive ล้มเหลว: " + err.toString() });
  }
}

/**
 * ดึงรายการไฟล์ของคนไข้รายหนึ่ง (ทั้งจากชีต Patient_Files และจากโฟลเดอร์ Google Drive โดยตรง)
 */
function handleGetPatientFiles(hn) {
  try {
    if (!hn) return createJsonResponse({ status: "error", message: "กรุณาระบุ HN" });

    // ตรวจสอบและจัดระเบียบ HN ในชีตให้ถูกต้องอัตโนมัติ
    fixSheetHNFormatting();

    const targetHn = formatHN(hn).toLowerCase();
    const targetHnNum = parseInt(targetHn, 10);
    const files = [];
    const seenFileIds = {};

    // 1. ดึงจากชีต Patient_Files
    try {
      const filesSheet = getOrCreateFilesSheet();
      const rows = filesSheet.getDataRange().getValues();

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rawHn = row[0];
        if (rawHn === null || rawHn === undefined || rawHn === "") continue;

        const rowHnStr = formatHN(rawHn).toLowerCase();
        const rowHnNum = parseInt(String(rawHn), 10);

        // ตรวจสอบทั้งรูปแบบ 00001 และรูปแบบตัวเลข 1 === 1 เพื่อความเข้ากันได้ 100%
        const isMatch = (rowHnStr === targetHn) ||
                        (!isNaN(targetHnNum) && !isNaN(rowHnNum) && rowHnNum === targetHnNum);

        if (isMatch) {
          const fileId = String(row[7] || "");
          if (fileId) seenFileIds[fileId] = true;

          let dateStr = row[8];
          if (dateStr instanceof Date) {
            dateStr = formatThaiDateTime(dateStr);
          } else if (typeof dateStr === "string" && dateStr.includes("T")) {
            try {
              dateStr = formatThaiDateTime(new Date(dateStr));
            } catch (e) {}
          }

          files.push({
            hn: formatHN(targetHn),
            patientName: String(row[1] || ""),
            fileName: String(row[2] || "file"),
            mimeType: String(row[3] || "image/jpeg"),
            description: String(row[4] || "-"),
            viewUrl: String(row[5] || ""),
            downloadUrl: String(row[6] || ("https://drive.google.com/uc?export=download&id=" + fileId)),
            thumbnailUrl: "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w800",
            previewUrl: "https://lh3.googleusercontent.com/d/" + fileId,
            fileId: fileId,
            uploadedAt: String(dateStr || "")
          });
        }
      }
    } catch (e) {
      console.warn("Sheet read error: " + e.toString());
    }

    // 2. ตรวจสอบในโฟลเดอร์ Google Drive ของคนไข้รายนี้โดยตรง (ค้นหาไฟล์ทั้งหมดที่อยู่ในโฟลเดอร์)
    try {
      const root = getOrCreateRootDriveFolder();
      const cleanHn = formatHN(hn);
      const numHn = parseInt(cleanHn, 10);
      const prefixFormatted = ("HN_" + cleanHn).toLowerCase();
      const prefixNumeric = ("HN_" + (isNaN(numHn) ? cleanHn : String(numHn))).toLowerCase();

      const subFolders = root.getFolders();
      while (subFolders.hasNext()) {
        const sub = subFolders.next();
        const folderNameLower = sub.getName().toLowerCase();

        // รองรับทั้งโฟลเดอร์ชื่อ HN_00001 และ HN_1
        if (folderNameLower.startsWith(prefixFormatted) || folderNameLower.startsWith(prefixNumeric)) {
          const driveFiles = sub.getFiles();
          while (driveFiles.hasNext()) {
            const df = driveFiles.next();
            const dfId = df.getId();
            if (!seenFileIds[dfId]) {
              seenFileIds[dfId] = true;

              try {
                df.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
              } catch (e) {}

              files.push({
                hn: cleanHn,
                patientName: sub.getName().replace(/^HN_[0-9]+_?/i, "").replace(/_/g, " "),
                fileName: df.getName(),
                mimeType: df.getMimeType(),
                description: "ไฟล์ใน Google Drive",
                viewUrl: df.getUrl(),
                downloadUrl: "https://drive.google.com/uc?export=download&id=" + dfId,
                thumbnailUrl: "https://drive.google.com/thumbnail?id=" + dfId + "&sz=w800",
                previewUrl: "https://lh3.googleusercontent.com/d/" + dfId,
                fileId: dfId,
                uploadedAt: formatThaiDateTime(df.getDateCreated())
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("Drive folder scan error: " + e.toString());
    }

    return createJsonResponse({ status: "success", data: files });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

/**
 * ดึงข้อมูล Base64 ของไฟล์ภาพใน Google Drive (เพื่อรองรับการแสดงผลทุกเบราว์เซอร์ 100%)
 */
function handleGetFileBase64(fileId) {
  try {
    if (!fileId) return createJsonResponse({ status: "error", message: "ไม่ได้ระบุ File ID" });
    const file = DriveApp.getFileById(fileId);
    const mimeType = file.getMimeType();
    const bytes = file.getBlob().getBytes();
    const base64 = Utilities.base64Encode(bytes);
    const dataUrl = "data:" + mimeType + ";base64," + base64;
    return createJsonResponse({
      status: "success",
      fileId: fileId,
      fileName: file.getName(),
      mimeType: mimeType,
      dataUrl: dataUrl
    });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

/**
 * ลบไฟล์ออกจาก Google Drive และชีตบันทึก
 */
function handleDeleteDriveFile(payload) {
  try {
    const fileId = payload.fileId || "";
    if (!fileId) return createJsonResponse({ status: "error", message: "ไม่ได้ระบุ File ID" });

    // ย้ายลงถังขยะใน Drive
    try {
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
    } catch (e) {
      console.warn("Could not trash Drive file: " + e.toString());
    }

    // ลบรายการในชีต Patient_Files
    const filesSheet = getOrCreateFilesSheet();
    const rows = filesSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][7]) === String(fileId)) {
        filesSheet.deleteRow(i + 1);
        break;
      }
    }

    return createJsonResponse({ status: "success", message: "ลบไฟล์ออกจาก Google Drive เรียบร้อย" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

/**
 * บันทึกรายงานเวชระเบียน A4 (HTML/PDF) ลง Google Drive
 */
function handleSaveMedicalRecordDoc(payload) {
  try {
    const hn = formatHN(payload.hn || "Unknown");
    const patientName = payload.patientName || "Patient";
    const htmlContent = payload.htmlContent || "";
    const fileName = "OPD_Record_HN_" + hn + "_" + (new Date().toISOString().split('T')[0]) + ".html";

    if (!htmlContent) {
      return createJsonResponse({ status: "error", message: "ไม่มีเนื้อหาเอกสาร" });
    }

    const patientFolder = getOrCreatePatientDriveFolder(hn, patientName);
    const blob = Utilities.newBlob(htmlContent, "text/html", fileName);
    const driveFile = patientFolder.createFile(blob);

    try {
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    const fileId = driveFile.getId();
    const viewUrl = driveFile.getUrl();
    const downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
    const nowStr = formatThaiDateTime(new Date());

    // บันทึกรายการลงชีต Patient_Files
    const filesSheet = getOrCreateFilesSheet();
    filesSheet.appendRow([
      "'" + hn, // บังคับให้เป็นข้อความ 5 หลัก (เช่น '00001)
      patientName,
      fileName,
      "text/html",
      "เวชระเบียน A4 (Medical Record)",
      viewUrl,
      downloadUrl,
      fileId,
      nowStr
    ]);

    const lastRow = filesSheet.getLastRow();
    filesSheet.getRange(lastRow, 1).setNumberFormat("@");
    filesSheet.getRange(lastRow, 1).setHorizontalAlignment("center");

    return createJsonResponse({
      status: "success",
      message: "บันทึกเวชระเบียนเข้า Google Drive เรียบร้อย",
      fileId: fileId,
      viewUrl: viewUrl
    });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

// ==============================================================================
// 3. SYSTEM TEST & CONNECTION VALIDATION
// ==============================================================================

function handleTestConnection() {
  try {
    // ซ่อมแซมและจัดระเบียบรูปแบบรหัส HN เป็น 5 หลักในทุกชีตอัตโนมัติ
    fixSheetHNFormatting();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const patientsSheet = getOrCreatePatientsSheet();
    const filesSheet = getOrCreateFilesSheet();
    const rootFolder = getOrCreateRootDriveFolder();

    // ตรวจสอบสถานะการเชื่อมต่อ Google Calendar
    let calendarStatus = "connected";
    let calendarName = "";
    let calendarId = "";
    let calendarError = "";
    try {
      const cal = CalendarApp.getDefaultCalendar();
      if (cal) {
        calendarName = cal.getName();
        calendarId = cal.getId();
      } else {
        calendarStatus = "warning";
        calendarError = "ไม่พบคลังปฏิทินเริ่มต้น";
      }
    } catch (calErr) {
      calendarStatus = "error";
      calendarError = calErr.toString();
    }

    return createJsonResponse({
      status: "success",
      message: calendarStatus === "connected"
        ? "เชื่อมต่อ Google Sheets, Google Drive และ Google Calendar สำเร็จสมบูรณ์"
        : "เชื่อมต่อ Sheets & Drive สำเร็จ แต่ Calendar ติดปัญหา: " + calendarError + " (โปรดยืนยันสิทธิ์เข้าถึง Calendar ใน Apps Script)",
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      driveFolderName: rootFolder.getName(),
      driveFolderUrl: rootFolder.getUrl(),
      calendarStatus: calendarStatus,
      calendarName: calendarName,
      calendarId: calendarId,
      calendarError: calendarError,
      patientRecordsCount: Math.max(0, patientsSheet.getLastRow() - 1),
      patientFilesCount: Math.max(0, filesSheet.getLastRow() - 1),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "การทดสอบเชื่อมต่อล้มเหลว: " + err.toString()
    });
  }
}

// ==============================================================================
// 4. HELPER FUNCTIONS (SHEETS & DRIVE MANAGEMENT)
// ==============================================================================

function getOrCreatePatientsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Patients");

  if (!sheet) {
    sheet = ss.insertSheet("Patients");
    sheet.appendRow(PATIENT_COLUMNS);
    formatHeaderRow(sheet, PATIENT_COLUMNS.length, "#162c54", "#ffffff");
  } else {
    // ถ้าชีตมีอยู่แล้วแต่ไม่มีหัวตาราง ให้ใส่หัวตาราง
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(PATIENT_COLUMNS);
      formatHeaderRow(sheet, PATIENT_COLUMNS.length, "#162c54", "#ffffff");
    }
  }

  // กำหนดคอลัมน์ A (HN), B (วันที่รักษา), C (รหัสบัตรประชาชน), L (เบอร์โทร), O (เบอร์โทรฉุกเฉิน) ให้เป็นรูปแบบ Plain Text ("@") เสมอ
  try {
    sheet.getRange("A:B").setNumberFormat("@");
    sheet.getRange("A:B").setHorizontalAlignment("center");
    sheet.getRange("C:C").setNumberFormat("@");
    sheet.getRange("L:L").setNumberFormat("@");
    sheet.getRange("O:O").setNumberFormat("@");
  } catch (e) {}

  return sheet;
}

function getOrCreateFilesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Patient_Files");

  if (!sheet) {
    sheet = ss.insertSheet("Patient_Files");
    sheet.appendRow(FILE_COLUMNS);
    formatHeaderRow(sheet, FILE_COLUMNS.length, "#b89223", "#ffffff");
  } else {
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(FILE_COLUMNS);
      formatHeaderRow(sheet, FILE_COLUMNS.length, "#b89223", "#ffffff");
    }
  }

  // กำหนดคอลัมน์ A (HN) ให้เป็นรูปแบบ Plain Text ("@") เสมอ
  try {
    sheet.getRange("A:A").setNumberFormat("@");
    sheet.getRange("A:A").setHorizontalAlignment("center");
  } catch (e) {}

  return sheet;
}

function formatHeaderRow(sheet, numCols, bgColor, textColor) {
  const range = sheet.getRange(1, 1, 1, numCols);
  range.setBackground(bgColor);
  range.setFontColor(textColor);
  range.setFontWeight("bold");
  range.setFontFamily("Sarabun");
  range.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

function getOrCreateRootDriveFolder() {
  const folders = DriveApp.getFoldersByName(ROOT_DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(ROOT_DRIVE_FOLDER_NAME);
}

function getOrCreatePatientDriveFolder(hn, patientName) {
  const root = getOrCreateRootDriveFolder();
  const cleanHn = formatHN(hn);
  const numHn = parseInt(cleanHn, 10);

  // ค้นหาโฟลเดอร์เดิมที่มีอยู่แล้ว (รองรับทั้ง HN_00001_... และ HN_1_...)
  const prefix1 = ("HN_" + cleanHn).toLowerCase();
  const prefix2 = ("HN_" + (isNaN(numHn) ? cleanHn : String(numHn))).toLowerCase();

  const subFolders = root.getFolders();
  while (subFolders.hasNext()) {
    const sub = subFolders.next();
    const nameLower = sub.getName().toLowerCase();
    if (nameLower.startsWith(prefix1) || nameLower.startsWith(prefix2)) {
      return sub;
    }
  }

  // ถ้ายังไม่มี ให้สร้างโฟลเดอร์ใหม่ในรูปแบบ 5 หลักมาตรฐานเสมอ
  const folderName = "HN_" + cleanHn + "_" + (patientName ? patientName.replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, "_") : "");
  return root.createFolder(folderName);
}

function mapRowToPatientObject(row) {
  return {
    hn: formatHN(row[0]),
    treatmentDate: formatTreatmentDateValue(row[1]),
    nationalId: String(row[2] || "").trim().replace(/^'/, ""),
    firstName: String(row[3] || ""),
    lastName: String(row[4] || ""),
    gender: String(row[5] || ""),
    dobDay: String(row[6] || ""),
    dobMonth: String(row[7] || ""),
    dobYear: String(row[8] || ""),
    age: row[9] || "",
    ethnicity: String(row[10] || ""),
    phone: formatPhone(row[11]),
    address: String(row[12] || ""),
    emergencyContactName: String(row[13] || ""),
    emergencyContactPhone: formatPhone(row[14]),
    emergencyRelation: String(row[15] || ""),
    bp: String(row[16] || ""),
    pr: String(row[17] || ""),
    weight: row[18] || "",
    height: row[19] || "",
    bmi: String(row[20] || ""),
    bmiInterpretation: String(row[21] || ""),
    underlyingDisease: String(row[22] || ""),
    chiefComplaint: String(row[23] || ""),
    subjectiveExam: String(row[24] || ""),
    drugAllergy: String(row[25] || ""),
    contraindications: String(row[26] || ""),
    observation: String(row[27] || ""),
    palpation: String(row[28] || ""),
    measurement: String(row[29] || ""),
    physicalExam: String(row[30] || ""),
    activeTest: String(row[31] || ""),
    passiveTest: String(row[32] || ""),
    specialTest: String(row[33] || ""),
    diagnosis: String(row[34] || ""),
    treatment: String(row[35] || ""),
    driveFolderUrl: String(row[36] || ""),
    createdAt: String(row[37] || ""),
    updatedAt: String(row[38] || "")
  };
}

function mapPatientObjectToRow(p, nowStr) {
  const cleanHn = formatHN(p.hn);
  const cleanDate = formatTreatmentDateValue(p.treatmentDate);
  const cleanNationalId = p.nationalId ? String(p.nationalId).trim().replace(/^'/, "") : "";
  const cleanPhone = formatPhone(p.phone);
  const cleanEmerPhone = formatPhone(p.emergencyContactPhone);
  return [
    "'" + cleanHn, // บังคับเก็บเป็นข้อความ 5 หลักคงที่ (เช่น '00001)
    cleanDate ? "'" + cleanDate : "", // บังคับเก็บเป็นข้อความ วัน/เดือน/ปี เท่านั้น ป้องกัน Google Sheets แปลงเป็น Date Object
    cleanNationalId ? "'" + cleanNationalId : "", // บังคับเก็บเป็นข้อความ ป้องกันแปลงเป็นตัวเลข/scientific notation
    p.firstName || "",
    p.lastName || "",
    p.gender || "",
    p.dobDay || "",
    p.dobMonth || "",
    p.dobYear || "",
    p.age || "",
    p.ethnicity || "",
    cleanPhone ? "'" + cleanPhone : "", // บังคับเก็บเป็นข้อความ ป้องกันตัดเลข 0 นำหน้า
    p.address || "",
    p.emergencyContactName || "",
    cleanEmerPhone ? "'" + cleanEmerPhone : "", // บังคับเก็บเป็นข้อความ ป้องกันตัดเลข 0 นำหน้า
    p.emergencyRelation || "",
    p.bp || "",
    p.pr || "",
    p.weight || "",
    p.height || "",
    p.bmi || "",
    p.bmiInterpretation || "",
    p.underlyingDisease || "",
    p.chiefComplaint || "",
    p.subjectiveExam || "",
    p.drugAllergy || "",
    p.contraindications || "",
    p.observation || "",
    p.palpation || "",
    p.measurement || "",
    p.physicalExam || "",
    p.activeTest || "",
    p.passiveTest || "",
    p.specialTest || "",
    p.diagnosis || "",
    p.treatment || "",
    p.driveFolderUrl || "",
    p.createdAt || nowStr,
    p.updatedAt || nowStr
  ];
}

/**
 * ฟังก์ชันซ่อมแซมและจัดรูปแบบรหัส HN ในชีต Patients และ Patient_Files ทั้งหมดให้เป็นรูปแบบ 5 หลัก (เช่น 00001)
 * แก้ไขปัญหากรณีข้อมูลเดิมเคยถูกแปลงเป็นตัวเลข 1, 2, 3
 */
function fixSheetHNFormatting() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. ซ่อมแซมชีต Patient_Files
    const filesSheet = ss.getSheetByName("Patient_Files");
    if (filesSheet && filesSheet.getLastRow() > 1) {
      filesSheet.getRange("A:A").setNumberFormat("@");
      filesSheet.getRange("A:A").setHorizontalAlignment("center");
      const numRows = filesSheet.getLastRow() - 1;
      const range = filesSheet.getRange(2, 1, numRows, 1);
      const values = range.getValues();
      let hasChanges = false;

      for (let i = 0; i < values.length; i++) {
        const raw = values[i][0];
        if (raw !== null && raw !== undefined && raw !== "") {
          const formatted = formatHN(raw);
          if (formatted && String(raw) !== formatted) {
            values[i][0] = "'" + formatted;
            hasChanges = true;
          }
        }
      }
      if (hasChanges) {
        range.setValues(values);
      }
    }

    // 2. ซ่อมแซมชีต Patients (HN, วันที่รักษา, รหัสบัตรประชาชน, เบอร์โทรศัพท์, เบอร์โทรฉุกเฉิน)
    const patientsSheet = ss.getSheetByName("Patients");
    if (patientsSheet && patientsSheet.getLastRow() > 1) {
      patientsSheet.getRange("A:B").setNumberFormat("@");
      patientsSheet.getRange("A:B").setHorizontalAlignment("center");
      patientsSheet.getRange("C:C").setNumberFormat("@");
      patientsSheet.getRange("L:L").setNumberFormat("@");
      patientsSheet.getRange("O:O").setNumberFormat("@");

      const numRows = patientsSheet.getLastRow() - 1;
      const range = patientsSheet.getRange(2, 1, numRows, 15);
      const values = range.getValues();
      let hasChanges = false;

      for (let i = 0; i < values.length; i++) {
        // HN (Col A / idx 0)
        const rawHn = values[i][0];
        if (rawHn !== null && rawHn !== undefined && rawHn !== "") {
          const formattedHn = formatHN(rawHn);
          if (formattedHn && String(rawHn) !== formattedHn) {
            values[i][0] = "'" + formattedHn;
            hasChanges = true;
          }
        }

        // วันที่รักษา (Col B / idx 1)
        const rawDate = values[i][1];
        if (rawDate !== null && rawDate !== undefined && rawDate !== "") {
          const formattedDate = formatTreatmentDateValue(rawDate);
          if (formattedDate && (rawDate instanceof Date || String(rawDate) !== formattedDate)) {
            values[i][1] = "'" + formattedDate;
            hasChanges = true;
          }
        }

        // รหัสบัตรประชาชน (Col C / idx 2)
        const rawNationalId = values[i][2];
        if (rawNationalId !== null && rawNationalId !== undefined && rawNationalId !== "") {
          const cleanNationalId = String(rawNationalId).trim().replace(/^'/, "");
          if (cleanNationalId && (typeof rawNationalId === "number" || !String(rawNationalId).startsWith("'"))) {
            values[i][2] = "'" + cleanNationalId;
            hasChanges = true;
          }
        }

        // เบอร์โทรศัพท์ (Col L / idx 11)
        const rawPhone = values[i][11];
        if (rawPhone !== null && rawPhone !== undefined && rawPhone !== "") {
          const formattedPhone = formatPhone(rawPhone);
          if (formattedPhone && (typeof rawPhone === "number" || String(rawPhone) !== formattedPhone)) {
            values[i][11] = "'" + formattedPhone;
            hasChanges = true;
          }
        }

        // เบอร์โทรฉุกเฉิน (Col O / idx 14)
        const rawEmerPhone = values[i][14];
        if (rawEmerPhone !== null && rawEmerPhone !== undefined && rawEmerPhone !== "") {
          const formattedEmerPhone = formatPhone(rawEmerPhone);
          if (formattedEmerPhone && (typeof rawEmerPhone === "number" || String(rawEmerPhone) !== formattedEmerPhone)) {
            values[i][14] = "'" + formattedEmerPhone;
            hasChanges = true;
          }
        }
      }
      if (hasChanges) {
        range.setValues(values);
      }
    }

    // 3. ซ่อมแซมชีตรายเดือนในไฟล์ Merit_Physiotherapy_Clinic_Billing (คอลัมน์ D: HN และ คอลัมน์ F: เบอร์โทร)
    try {
      const billingSS = getOrCreateBillingSpreadsheet();
      if (billingSS) {
        const billingSheets = billingSS.getSheets();
        billingSheets.forEach(bSheet => {
          if (bSheet.getLastRow() > 1) {
            bSheet.getRange("A:D").setNumberFormat("@");
            bSheet.getRange("D:D").setHorizontalAlignment("center");
            bSheet.getRange("F:F").setNumberFormat("@");
            const numRows = bSheet.getLastRow() - 1;
            const bRange = bSheet.getRange(2, 4, numRows, 3);
            const bValues = bRange.getValues();
            let changed = false;
            for (let j = 0; j < bValues.length; j++) {
              // HN (Col D / idx 0)
              const rawHn = bValues[j][0];
              if (rawHn !== null && rawHn !== undefined && rawHn !== "") {
                const formatted = formatHN(rawHn);
                if (formatted && String(rawHn) !== formatted) {
                  bValues[j][0] = "'" + formatted;
                  changed = true;
                }
              }
              // เบอร์โทรศัพท์ (Col F / idx 2)
              const rawPhone = bValues[j][2];
              if (rawPhone !== null && rawPhone !== undefined && rawPhone !== "") {
                const formattedPhone = formatPhone(rawPhone);
                if (formattedPhone && (typeof rawPhone === "number" || String(rawPhone) !== formattedPhone)) {
                  bValues[j][2] = "'" + formattedPhone;
                  changed = true;
                }
              }
            }
            if (changed) {
              bRange.setValues(bValues);
            }
          }
        });
      }
    } catch (billingFixErr) {
      console.warn("fixSheetHNFormatting billing warning: " + billingFixErr.toString());
    }
  } catch (e) {
    console.warn("fixSheetHNFormatting warning: " + e.toString());
  }
}

/**
 * ฟังก์ชันช่วยเรียกซ่อมแซมข้อมูลเบอร์โทรศัพท์และรหัส HN ทั้งระบบ (One-Click Migration)
 */
function fixExistingPhoneNumbers() {
  fixSheetHNFormatting();
}

function fixSheetPhoneAndHNFormatting() {
  fixSheetHNFormatting();
}

function formatThaiDateTime(d) {
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const yearBe = d.getFullYear() + 543;
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${day}/${month}/${yearBe} ${hours}:${minutes}`;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// 4. GOOGLE CALENDAR APPOINTMENT HANDLERS
// ==============================================================================

/**
 * ดึงคลังปฏิทินที่ต้องการใช้งาน (รองรับระบุ Calendar ID / Gmail หรือใช้ Default Calendar)
 */
function getTargetCalendar(calendarId) {
  if (calendarId && String(calendarId).trim()) {
    try {
      const cal = CalendarApp.getCalendarById(String(calendarId).trim());
      if (cal) return cal;
    } catch (e) {
      console.warn("Could not find calendar by ID: " + calendarId + ", fallback to default: " + e.toString());
    }
  }
  return CalendarApp.getDefaultCalendar();
}

/**
 * ดึงข้อมูลภาพรวมของปฏิทิน (Default หรือ Custom Calendar)
 */
function handleGetCalendarInfo(calendarId) {
  try {
    const cal = getTargetCalendar(calendarId);
    if (!cal) {
      return createJsonResponse({
        status: "error",
        message: "ไม่พบคลังปฏิทินในบัญชี Google (Default หรือ ID: " + (calendarId || "-") + ")"
      });
    }
    return createJsonResponse({
      status: "success",
      calendarName: cal.getName(),
      calendarId: cal.getId(),
      timeZone: cal.getTimeZone()
    });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "เกิดข้อผิดพลาดในการตรวจสอบปฏิทิน: " + error.toString()
    });
  }
}

/**
 * ดึงรายการนัดหมายทั้งหมดจาก Google Calendar ในช่วงเวลาที่ระบุ
 * พร้อมสร้างลิงก์สำหรับเปิดหน้าแก้ไขบน Google Calendar โดยตรง
 */
function handleGetCalendarEvents(startDateStr, endDateStr, calendarId) {
  try {
    const cal = getTargetCalendar(calendarId);
    if (!cal) {
      return createJsonResponse({
        status: "error",
        message: "ไม่พบคลังปฏิทินในบัญชี Google"
      });
    }

    // กำหนดช่วงเวลา (ค่าเริ่มต้น: ย้อนหลัง 7 วัน ถึง อนาคต 60 วัน)
    const now = new Date();
    let start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let end = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    if (startDateStr) {
      const pStart = new Date(startDateStr);
      if (!isNaN(pStart.getTime())) start = pStart;
    }
    if (endDateStr) {
      const pEnd = new Date(endDateStr);
      if (!isNaN(pEnd.getTime())) {
        pEnd.setHours(23, 59, 59, 999);
        end = pEnd;
      }
    }

    const events = cal.getEvents(start, end);
    const calId = cal.getId();
    const eventList = events.map(ev => {
      const rawId = ev.getId();
      const cleanId = rawId.split("@")[0];
      const editToken = Utilities.base64Encode(cleanId + " " + calId).replace(/=/g, "");
      const editUrl = "https://calendar.google.com/calendar/r/eventedit/" + editToken;

      const evStart = ev.getStartTime();
      const evEnd = ev.getEndTime();
      const year = evStart.getFullYear();
      const month = String(evStart.getMonth() + 1).padStart(2, "0");
      const day = String(evStart.getDate()).padStart(2, "0");
      const dayViewUrl = "https://calendar.google.com/calendar/r/day/" + year + "/" + month + "/" + day;

      return {
        id: rawId,
        title: ev.getTitle() || "(ไม่มีชื่อหัวข้อ)",
        description: ev.getDescription() || "",
        location: ev.getLocation() || "",
        startTime: evStart.toISOString(),
        endTime: evEnd.toISOString(),
        isAllDay: ev.isAllDayEvent(),
        editUrl: editUrl,
        dayViewUrl: dayViewUrl,
        status: ev.getMyStatus() ? String(ev.getMyStatus()) : "CONFIRMED"
      };
    });

    // เรียงตามเวลาเริ่มต้น
    eventList.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return createJsonResponse({
      status: "success",
      calendarName: cal.getName(),
      calendarId: calId,
      events: eventList,
      count: eventList.length
    });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "ไม่สามารถดึงข้อมูลตารางนัดหมายจาก Google Calendar ได้: " + error.toString()
    });
  }
}

/**
 * ยกเลิก/ลบนัดหมายจาก Google Calendar ตาม Event ID
 */
function handleDeleteCalendarEvent(eventId, calendarId) {
  try {
    if (!eventId) {
      return createJsonResponse({
        status: "error",
        message: "กรุณาระบุรหัสนัดหมาย (Event ID) ที่ต้องการยกเลิก"
      });
    }

    const cal = getTargetCalendar(calendarId);
    const event = cal.getEventById(eventId);
    if (!event) {
      return createJsonResponse({
        status: "error",
        message: "ไม่พบนัดหมายรหัสนี้ใน Google Calendar หรืออาจถูกลบไปแล้ว"
      });
    }

    event.deleteEvent();
    return createJsonResponse({
      status: "success",
      message: "ยกเลิกนัดหมายใน Google Calendar เรียบร้อยแล้ว",
      deletedId: eventId
    });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "เกิดข้อผิดพลาดในการยกเลิกนัดหมาย: " + error.toString()
    });
  }
}

/**
 * สร้างนัดหมายใหม่ลงใน Google Calendar
 */
function handleCreateCalendarEvent(payload) {
  try {
    if (!payload || !payload.title || !payload.startTime || !payload.endTime) {
      return createJsonResponse({
        status: "error",
        message: "ข้อมูลนัดหมายไม่ครบถ้วน (ต้องระบุ หัวข้อนัดหมาย, เวลาเริ่มต้น และเวลาสิ้นสุด)"
      });
    }

    const cal = getTargetCalendar(payload.calendarId);
    if (!cal) {
      return createJsonResponse({
        status: "error",
        message: "ไม่พบคลังปฏิทินในบัญชี Google"
      });
    }

    const start = new Date(payload.startTime);
    const end = new Date(payload.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return createJsonResponse({
        status: "error",
        message: "รูปแบบวันเวลาเริ่มต้นหรือสิ้นสุดไม่ถูกต้อง"
      });
    }

    const options = {
      description: payload.description || "",
      location: payload.location || ""
    };

    const event = cal.createEvent(payload.title, start, end, options);
    const rawId = event.getId();
    const calId = cal.getId();
    const cleanId = rawId.split("@")[0];
    const editToken = Utilities.base64Encode(cleanId + " " + calId).replace(/=/g, "");
    const editUrl = "https://calendar.google.com/calendar/r/eventedit/" + editToken;

    return createJsonResponse({
      status: "success",
      message: "สร้างนัดหมายใน Google Calendar เรียบร้อยแล้ว",
      event: {
        id: rawId,
        title: event.getTitle(),
        description: event.getDescription(),
        location: event.getLocation(),
        startTime: event.getStartTime().toISOString(),
        endTime: event.getEndTime().toISOString(),
        isAllDay: event.isAllDayEvent(),
        editUrl: editUrl,
        status: "CONFIRMED"
      }
    });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "เกิดข้อผิดพลาดในการสร้างนัดหมายใน Google Calendar: " + error.toString()
    });
  }
}

// ==============================================================================
// 5. BILLING & RECEIPTS SYSTEM (ไฟล์แยก: Merit_Physiotherapy_Clinic_Billing)
// ==============================================================================

/**
 * ค้นหาหรือสร้างไฟล์ Google Sheets ใหม่สำหรับระบบคิดเงินและออกใบเสร็จ (แยกจากเวชระเบียนเดิม)
 * ไฟล์จะถูกจัดเก็บไว้ในโฟลเดอร์หลัก Merit_Physiotherapy_Clinic_Records บน Google Drive
 */
function getOrCreateBillingSpreadsheet() {
  const root = getOrCreateRootDriveFolder();
  const files = root.getFilesByName(BILLING_SPREADSHEET_NAME);
  if (files.hasNext()) {
    const file = files.next();
    return SpreadsheetApp.openById(file.getId());
  }

  // หากไฟล์อยู่นอกโฟลเดอร์ ให้ดึงเข้ามาในโฟลเดอร์หลัก
  const globalFiles = DriveApp.getFilesByName(BILLING_SPREADSHEET_NAME);
  if (globalFiles.hasNext()) {
    const file = globalFiles.next();
    try {
      root.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    } catch (e) {}
    return SpreadsheetApp.openById(file.getId());
  }

  // สร้างไฟล์ Google Sheets ใหม่
  const newSS = SpreadsheetApp.create(BILLING_SPREADSHEET_NAME);
  const newFile = DriveApp.getFileById(newSS.getId());
  root.addFile(newFile);
  try {
    DriveApp.getRootFolder().removeFile(newFile);
  } catch (e) {}

  return newSS;
}

/**
 * ค้นหาหรือสร้างแผ่นงาน (Tab) รายเดือนในไฟล์ Billing เช่น "2569-09"
 */
function getOrCreateMonthlyReceiptSheet(billingSS, monthKey) {
  let cleanMonth = String(monthKey || "").trim();
  if (!cleanMonth) {
    const now = new Date();
    const y = now.getFullYear() + 543;
    const m = String(now.getMonth() + 1).padStart(2, "0");
    cleanMonth = `${y}-${m}`;
  }

  let sheet = billingSS.getSheetByName(cleanMonth);
  if (sheet) {
    return sheet;
  }

  // สร้างแท็บเดือนใหม่
  sheet = billingSS.insertSheet(cleanMonth);
  sheet.appendRow(RECEIPT_COLUMNS);
  formatHeaderRow(sheet, RECEIPT_COLUMNS.length, "#162c54", "#ffffff");
  sheet.setFrozenRows(1);

  // จัดรูปแบบคอลัมน์
  try {
    sheet.getRange("A:A").setNumberFormat("@"); // เลขที่ใบเสร็จ
    sheet.getRange("B:B").setNumberFormat("@"); // วันที่
    sheet.getRange("C:C").setNumberFormat("@"); // เวลา
    sheet.getRange("D:D").setNumberFormat("@"); // HN (ป้องกันตัดเลข 0)
    sheet.getRange("D:D").setHorizontalAlignment("center");
    sheet.getRange("E:E").setNumberFormat("@"); // ชื่อ
    sheet.getRange("F:F").setNumberFormat("@"); // เบอร์โทร
    sheet.getRange("I:I").setNumberFormat("#,##0.00"); // ยอดรวมก่อนลด
    sheet.getRange("K:K").setNumberFormat("#,##0.00"); // ส่วนลดที่ระบุ
    sheet.getRange("L:L").setNumberFormat("#,##0.00"); // จำนวนเงินส่วนลด
    sheet.getRange("M:M").setNumberFormat("#,##0.00"); // ยอดสุทธิ
  } catch (e) {}

  // หากมีแท็บเริ่มต้นเปล่าๆ (Sheet1 หรือ แผ่นงาน1) ให้ลบออก
  const allSheets = billingSS.getSheets();
  if (allSheets.length > 1) {
    const defaultSheet = billingSS.getSheetByName("Sheet1") || billingSS.getSheetByName("แผ่นงาน1");
    if (defaultSheet && defaultSheet.getLastRow() === 0) {
      try {
        billingSS.deleteSheet(defaultSheet);
      } catch (e) {}
    }
  }

  return sheet;
}

/**
 * บันทึกหรืออัปเดตใบเสร็จลงแท็บรายเดือนในไฟล์ Billing
 */
function handleSaveReceipt(receiptData) {
  // ล็อกให้บันทึกได้ทีละคำขอ ป้องกันเลขใบเสร็จซ้ำเมื่อหลายเครื่องออกบิลพร้อมกัน
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return createJsonResponse({ status: "error", message: "ระบบกำลังบันทึกใบเสร็จจากเครื่องอื่นอยู่ โปรดลองใหม่อีกครั้ง" });
  }

  try {
    if (!receiptData) {
      return createJsonResponse({ status: "error", message: "ไม่พบข้อมูลใบเสร็จ" });
    }

    const billingSS = getOrCreateBillingSpreadsheet();

    // กำหนด monthKey ในรูปแบบ พ.ศ. เช่น 2569-09
    let monthKey = receiptData.monthKey || "";
    if (!monthKey && receiptData.date) {
      const parts = receiptData.date.split("-");
      if (parts.length === 3) {
        let y = parseInt(parts[0], 10);
        if (y < 2400) y += 543;
        monthKey = `${y}-${parts[1]}`;
      }
    }
    if (!monthKey) {
      const now = new Date();
      const y = now.getFullYear() + 543;
      const m = String(now.getMonth() + 1).padStart(2, "0");
      monthKey = `${y}-${m}`;
    }

    const sheet = getOrCreateMonthlyReceiptSheet(billingSS, monthKey);
    const requestedReceiptNo = String(receiptData.receiptNo || "").trim();
    let receiptNo = requestedReceiptNo;
    const rows = sheet.getDataRange().getValues();

    // ใบเสร็จใหม่แต่เลขนี้มีอยู่แล้ว (อีกเครื่องเพิ่งออกบิล) -> ออกเลขถัดไป แทนการเขียนทับใบเสร็จเดิม
    if (receiptData.isNew && receiptNo && findReceiptRowIndex(rows, receiptNo) > 0) {
      receiptNo = getNextReceiptNoFromRows(rows, receiptNo);
      receiptData.receiptNo = receiptNo;
    }
    delete receiptData.isNew;
    const receiptNoChanged = receiptNo !== requestedReceiptNo;

    // รายการรักษา
    const itemsSummary = (receiptData.items || []).map(i => `${i.name} (x${i.qty})`).join(", ");
    const itemsJson = JSON.stringify(receiptData.items || []);

    // เวลา
    let timeStr = "";
    if (receiptData.createdAt) {
      const d = new Date(receiptData.createdAt);
      if (!isNaN(d.getTime())) {
        timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }
    }
    if (!timeStr) {
      const now = new Date();
      timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }

    const cleanHn = formatHN(receiptData.hn);
    const cleanPhone = formatPhone(receiptData.patientPhone);
    const rowData = [
      receiptNo ? "'" + receiptNo : "",
      receiptData.date ? "'" + String(receiptData.date) : "",
      timeStr ? "'" + String(timeStr) : "",
      "'" + cleanHn, // บังคับเก็บเป็นข้อความ 5 หลักคงที่ (เช่น '00001) ป้องกัน Google Sheets ตัด 0
      receiptData.patientName || "",
      cleanPhone ? "'" + cleanPhone : "",
      itemsSummary,
      itemsJson,
      Number(receiptData.subtotal) || 0,
      receiptData.discountType || "baht",
      Number(receiptData.discountValue) || 0,
      Number(receiptData.discountAmount) || 0,
      Number(receiptData.netTotal) || 0,
      receiptData.paymentMethod || "เงินสด",
      receiptData.cashierName || "นักกายภาพบำบัด",
      receiptData.notes || "",
      receiptData.createdAt || new Date().toISOString()
    ];

    // ตรวจสอบว่ามีใบเสร็จเลขที่นี้อยู่แล้วหรือไม่ (ถ้ามีให้อัปเดต)
    const existingRowIndex = findReceiptRowIndex(rows, receiptNo);

    if (existingRowIndex > 0) {
      sheet.getRange(existingRowIndex, 4).setNumberFormat("@");
      sheet.getRange(existingRowIndex, 6).setNumberFormat("@"); // เบอร์โทรศัพท์
      sheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 4).setNumberFormat("@");
      sheet.getRange(lastRow, 6).setNumberFormat("@"); // เบอร์โทรศัพท์
    }

    return createJsonResponse({
      status: "success",
      message: "บันทึกใบเสร็จเลขที่ " + receiptNo + " ลงใน Google Sheets สำเร็จ",
      receipt: receiptData,
      receiptNoChanged: receiptNoChanged,
      previousReceiptNo: requestedReceiptNo,
      spreadsheetUrl: billingSS.getUrl()
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "เกิดข้อผิดพลาดในการบันทึกใบเสร็จ: " + err.toString()
    });
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

/**
 * หาแถว (1-indexed) ของใบเสร็จตามเลขที่ในข้อมูลชีต คืนค่า -1 ถ้าไม่พบ
 */
function findReceiptRowIndex(rows, receiptNo) {
  const target = String(receiptNo).trim();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().replace(/^'/, "") === target) return i + 1;
  }
  return -1;
}

/**
 * คำนวณเลขใบเสร็จถัดไปที่มี prefix เดียวกัน (เช่น REC-256911-007 -> REC-256911-008)
 */
function getNextReceiptNoFromRows(rows, sampleReceiptNo) {
  const prefixMatch = String(sampleReceiptNo).match(/^(.*-)\d+$/);
  const prefix = prefixMatch ? prefixMatch[1] : String(sampleReceiptNo) + "-";
  let maxSeq = 0;
  for (let i = 1; i < rows.length; i++) {
    const no = String(rows[i][0]).trim().replace(/^'/, "");
    if (!no.startsWith(prefix)) continue;
    const seq = parseInt(no.substring(prefix.length), 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }
  return prefix + String(maxSeq + 1).padStart(3, "0");
}

/**
 * ดึงรายการใบเสร็จจากไฟล์ Billing ตามเดือนที่ระบุ (หรือทั้งหมด)
 */
function handleGetReceipts(monthKey) {
  try {
    const billingSS = getOrCreateBillingSpreadsheet();
    let sheetsToRead = [];

    if (monthKey && monthKey !== "all") {
      let cleanMonth = String(monthKey).trim();
      const sheet = billingSS.getSheetByName(cleanMonth);
      if (sheet) sheetsToRead.push(sheet);
    } else {
      sheetsToRead = billingSS.getSheets();
    }

    const receipts = [];

    sheetsToRead.forEach(sheet => {
      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) return;

      const sheetName = sheet.getName();

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue;

        let items = [];
        try {
          if (row[7]) {
            items = JSON.parse(row[7]);
          }
        } catch (e) {
          items = [];
        }

        receipts.push({
          receiptNo: String(row[0]),
          date: String(row[1] || ""),
          time: String(row[2] || ""),
          monthKey: sheetName,
          hn: formatHN(row[3]),
          patientName: String(row[4] || ""),
          patientPhone: formatPhone(row[5]),
          itemsSummary: String(row[6] || ""),
          items: items,
          subtotal: Number(row[8]) || 0,
          discountType: String(row[9] || "baht"),
          discountValue: Number(row[10]) || 0,
          discountAmount: Number(row[11]) || 0,
          netTotal: Number(row[12]) || 0,
          paymentMethod: String(row[13] || "เงินสด"),
          cashierName: String(row[14] || ""),
          notes: String(row[15] || ""),
          createdAt: String(row[16] || ""),
          id: String(row[0])
        });
      }
    });

    receipts.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

    return createJsonResponse({
      status: "success",
      data: receipts,
      spreadsheetUrl: billingSS.getUrl()
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลใบเสร็จ: " + err.toString()
    });
  }
}

/**
 * ลบใบเสร็จออกจากแท็บรายเดือนในไฟล์ Billing
 */
function handleDeleteReceipt(receiptNo, monthKey) {
  try {
    if (!receiptNo) {
      return createJsonResponse({ status: "error", message: "กรุณาระบุเลขที่ใบเสร็จ" });
    }

    const billingSS = getOrCreateBillingSpreadsheet();
    let sheetsToSearch = [];

    if (monthKey) {
      const sheet = billingSS.getSheetByName(String(monthKey).trim());
      if (sheet) sheetsToSearch.push(sheet);
    }
    if (sheetsToSearch.length === 0) {
      sheetsToSearch = billingSS.getSheets();
    }

    let deleted = false;
    for (const sheet of sheetsToSearch) {
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === String(receiptNo).trim()) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }
      if (deleted) break;
    }

    if (deleted) {
      return createJsonResponse({
        status: "success",
        message: "ลบใบเสร็จเลขที่ " + receiptNo + " สำเร็จ"
      });
    } else {
      return createJsonResponse({
        status: "error",
        message: "ไม่พบใบเสร็จเลขที่ " + receiptNo
      });
    }
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "เกิดข้อผิดพลาดในการลบใบเสร็จ: " + err.toString()
    });
  }
}


