/**
 * API & Local Database Engine for Merit Physiotherapy Clinic
 * Robust offline-first storage with optional Google Sheets syncing.
 */

const LOCAL_STORAGE_KEY = 'merit_clinic_patients';
const API_URL_KEY = 'merit_clinic_api_url';
const API_KEY_STORAGE_KEY = 'merit_clinic_api_key';

const api = {
  // Set & Get Google Apps Script URL
  setApiUrl(url) {
    if (url) {
      localStorage.setItem(API_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(API_URL_KEY);
    }
  },

  getApiUrl() {
    return localStorage.getItem(API_URL_KEY) || '';
  },

  isOnline() {
    return Boolean(this.getApiUrl());
  },

  // Set & Get รหัสคลินิก (Clinic API Key) ที่ได้จากการรัน setupClinicApiKey ใน Apps Script
  setApiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  },

  getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  },

  /**
   * fetch ไปยัง Apps Script พร้อมแนบรหัสคลินิกอัตโนมัติ
   * POST: ใส่ apiKey ใน JSON body / GET: ใส่เป็น query parameter
   */
  _apiFetch(input, init = {}, apiKey = this.getApiKey()) {
    if (init.method === 'POST' && typeof init.body === 'string') {
      const body = JSON.parse(init.body);
      body.apiKey = apiKey;
      return fetch(input, { ...init, body: JSON.stringify(body) });
    }
    const url = new URL(String(input));
    url.searchParams.set('apiKey', apiKey);
    return fetch(url.toString(), init);
  },

  /**
   * จัดรูปแบบ HN ให้เป็นข้อความ 5 หลักมาตรฐานเสมอ (เช่น 00001, 00002)
   */
  formatHN(hn) {
    if (hn === null || hn === undefined || hn === '') return '';
    const cleaned = String(hn).trim().replace(/^'/, '');
    if (/^\d+$/.test(cleaned)) {
      return cleaned.padStart(5, '0');
    }
    return cleaned;
  },

  /**
   * จัดรูปแบบวันที่รักษาให้เป็น วัน/เดือน/ปี พ.ศ. เสมอ (ไม่ระบุเวลา)
   * ตัวอย่าง: 09/07/2566
   */
  formatTreatmentDate(val) {
    if (!val) return '';
    const str = String(val).trim();
    if (!str || str === '-') return '';

    // กรณีอยู่ในรูปแบบ วัน/เดือน/ปี หรือ วัน-เดือน-ปี อยู่แล้ว
    const dm = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dm) {
      const d = dm[1].padStart(2, '0');
      const m = dm[2].padStart(2, '0');
      let y = parseInt(dm[3], 10);
      if (y < 2400) y += 543;
      return `${d}/${m}/${y}`;
    }

    // กรณีเป็น Date String (เช่น "Wed Jul 09 2566 00:00:00 GMT+0700..." หรือ ISO String)
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      let y = parsed.getFullYear();
      if (y < 2400) y += 543;
      return `${d}/${m}/${y}`;
    }

    return str;
  },

  /**
   * จัดรูปแบบเบอร์โทรศัพท์ให้มีเลข 0 นำหน้าเสมอ และเป็นตัวเลขติดกันตามมาตรฐาน (เช่น 0804113195, 043859253)
   * ป้องกันและกู้คืนปัญหา Google Sheets ตัดเลข 0 นำหน้าออกเมื่อถูกบันทึกเป็น Number
   */
  formatPhone(phone) {
    if (phone === null || phone === undefined || phone === '') return '';
    let str = String(phone).trim().replace(/^'/, '');
    if (!str || str === '-') return '';

    // ลบอักขระที่ไม่ใช่ตัวเลขออกเพื่อตรวจสอบจำนวนหลัก
    const digits = str.replace(/\D/g, '');
    if (!digits) return str;

    // กรณีขึ้นต้นด้วย 0 อยู่แล้ว
    if (digits.startsWith('0')) {
      return digits;
    }

    // กรณีเบอร์มือถือ 9 หลักที่ขาดเลข 0 หน้าสุด (เช่น 804113195 -> 0804113195, 922554692 -> 0922554692)
    if (digits.length === 9 && /^[689]/.test(digits)) {
      return '0' + digits;
    }

    // กรณีเบอร์บ้าน/สำนักงาน 8 หลักที่ขาดเลข 0 หน้าสุด (เช่น 43859253 -> 043859253, 21234567 -> 021234567)
    if (digits.length === 8 && /^[23457]/.test(digits)) {
      return '0' + digits;
    }

    // กรณีขึ้นต้นด้วยรหัสประเทศไทย 66 (เช่น 66804113195 -> 0804113195)
    if (digits.startsWith('66') && digits.length >= 10) {
      return '0' + digits.substring(2);
    }

    return digits;
  },

  // ----------------------------------------------------
  // PATIENT DATABASE OPERATIONS (CRUD)
  // ----------------------------------------------------

  async getPatients(query = '') {
    if (this.isOnline()) {
      try {
        const url = new URL(this.getApiUrl());
        url.searchParams.append('action', 'getPatients');
        if (query) url.searchParams.append('query', query);
        
        const response = await this._apiFetch(url);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        if (data && data.status === 'success') {
          const normalized = (data.data || []).map(p => ({
            ...p,
            hn: this.formatHN(p.hn),
            treatmentDate: this.formatTreatmentDate(p.treatmentDate),
            phone: this.formatPhone(p.phone),
            emergencyContactPhone: this.formatPhone(p.emergencyContactPhone)
          }));
          this._mergeLocalPatients(normalized);
          return normalized;
        }
      } catch (err) {
        console.warn('API fetch failed, falling back to LocalStorage:', err);
      }
    }
    return this._getLocalPatients(query);
  },

  async savePatient(patientData) {
    if (patientData) {
      if (patientData.hn) patientData.hn = this.formatHN(patientData.hn);
      if (patientData.treatmentDate) patientData.treatmentDate = this.formatTreatmentDate(patientData.treatmentDate);
      if (patientData.phone) patientData.phone = this.formatPhone(patientData.phone);
      if (patientData.emergencyContactPhone) patientData.emergencyContactPhone = this.formatPhone(patientData.emergencyContactPhone);
    }

    // Online: ให้ Google Sheets เป็นผู้ยืนยัน HN ก่อน (อาจออก HN ใหม่ถ้าเลขนี้ถูกเครื่องอื่นใช้ไปแล้ว)
    // แล้วจึงบันทึกลง LocalStorage ด้วย HN สุดท้าย เพื่อไม่ให้ทับคนไข้เดิมในเครื่อง
    if (this.isOnline()) {
      try {
        const response = await this._apiFetch(this.getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'savePatient',
            data: patientData
          })
        });
        if (response.ok) {
          const res = await response.json();
          if (res && res.status === 'success') {
            if (res.data && res.data.hn) patientData.hn = this.formatHN(res.data.hn);
            delete patientData.isNew;
            const localResult = this._saveLocalPatient(patientData);
            return {
              status: 'success',
              message: res.hnChanged ? res.message : 'บันทึกข้อมูลเรียบร้อย (ซิงก์ Google Sheets สำเร็จ)',
              data: localResult,
              hnChanged: !!res.hnChanged,
              previousHn: res.previousHn || ''
            };
          }
          const serverErr = new Error((res && res.message) || 'บันทึกลง Google Sheets ไม่สำเร็จ');
          serverErr.fromServer = true;
          throw serverErr;
        }
      } catch (err) {
        // เซิร์ฟเวอร์ตอบกลับ error ชัดเจน (เช่น ระบบล็อกไม่ว่าง) -> แจ้งผู้ใช้ ไม่บันทึกเงียบๆ
        if (err && err.fromServer) throw err;
        console.warn('Online sync failed, saved locally:', err);
      }
    }

    delete patientData.isNew;
    const localResult = this._saveLocalPatient(patientData);
    return { status: 'success', message: 'บันทึกข้อมูลลงในระบบเรียบร้อย (Offline / Local)', data: localResult };
  },

  async deletePatient(hn) {
    hn = this.formatHN(hn);
    this._deleteLocalPatient(hn);

    if (this.isOnline()) {
      try {
        await this._apiFetch(this.getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'deletePatient',
            hn: hn
          })
        });
      } catch (err) {
        console.warn('Online delete failed:', err);
      }
    }

    return { status: 'success', message: 'ลบเวชระเบียนเรียบร้อย' };
  },

  // ----------------------------------------------------
  // GOOGLE DRIVE & ATTACHMENT INTEGRATIONS
  // ----------------------------------------------------

  /**
   * ทดสอบการเชื่อมต่อกับ Google Apps Script, Google Sheets, และ Google Drive
   */
  async testConnection(customUrl = null, customKey = null) {
    const urlStr = (customUrl || this.getApiUrl() || '').trim();
    const apiKey = (customKey !== null ? customKey : this.getApiKey()).trim();
    if (!urlStr) {
      return { status: 'error', message: 'กรุณากรอก Web App URL ของ Google Apps Script ก่อนทดสอบ' };
    }
    try {
      const url = new URL(urlStr);
      url.searchParams.append('action', 'test');
      url.searchParams.append('_t', Date.now());

      const startTime = performance.now();
      const response = await this._apiFetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }, apiKey);
      const durationMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.status === 'success') {
        return {
          status: 'success',
          message: data.message || 'เชื่อมต่อ Google Sheets และ Google Drive สำเร็จสมบูรณ์',
          data: {
            ...data,
            latencyMs: durationMs
          }
        };
      } else {
        return {
          status: 'error',
          message: (data && data.message) || 'ระบบปลายทางตอบกลับข้อผิดพลาด'
        };
      }
    } catch (err) {
      return {
        status: 'error',
        message: 'ไม่สามารถเชื่อมต่อ Google Apps Script ได้ (' + (err.message || 'Network / CORS Error') + ') กรุณาตรวจสอบว่าตั้งค่า Who has access เป็น "Anyone" แล้วหรือยัง'
      };
    }
  },

  /**
   * อัปโหลดไฟล์เอกสาร / รูปภาพคนไข้ เข้าโฟลเดอร์ใน Google Drive
   */
  async uploadFileToDrive({ hn, patientName, fileName, mimeType, fileData, description }) {
    if (!this.isOnline()) {
      return { status: 'error', message: 'กรุณาเชื่อมต่อ Google Sheets & Drive ในการตั้งค่าก่อนอัปโหลดไฟล์' };
    }

    const cleanHn = this.formatHN(hn);

    try {
      const response = await this._apiFetch(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'uploadFile',
          hn: cleanHn,
          patientName,
          fileName,
          mimeType,
          fileData,
          description
        })
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);
      const res = await response.json();
      if (res && res.status === 'success' && res.fileId && fileData) {
        this.setThumbCache(res.fileId, fileData);
      }
      return res;
    } catch (err) {
      console.error('File upload failed:', err);
      return { status: 'error', message: 'อัปโหลดไฟล์ล้มเหลว: ' + err.message };
    }
  },

  // In-memory cache for uploaded file thumbnails / data URLs
  _thumbCache: {},

  setThumbCache(fileId, dataUrl) {
    if (fileId && dataUrl) {
      this._thumbCache[fileId] = dataUrl;
      try {
        sessionStorage.setItem('thumb_' + fileId, dataUrl.substring(0, 500000));
      } catch (e) {}
    }
  },

  getThumbCache(fileId) {
    if (!fileId) return null;
    if (this._thumbCache[fileId]) return this._thumbCache[fileId];
    try {
      return sessionStorage.getItem('thumb_' + fileId);
    } catch (e) {
      return null;
    }
  },

  /**
   * ดึงข้อมูล Base64 ของไฟล์จาก Google Drive เพื่อแสดงผลในเบราว์เซอร์
   */
  async getFileBase64(fileId) {
    if (!fileId || !this.isOnline()) return null;
    const cached = this.getThumbCache(fileId);
    if (cached) return cached;

    try {
      const url = new URL(this.getApiUrl());
      url.searchParams.append('action', 'getFileBase64');
      url.searchParams.append('fileId', fileId);
      url.searchParams.append('_t', Date.now());

      const res = await this._apiFetch(url.toString());
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.status === 'success' && data.dataUrl) {
        this.setThumbCache(fileId, data.dataUrl);
        return data.dataUrl;
      }
      return null;
    } catch (e) {
      console.warn('Get base64 error:', e);
      return null;
    }
  },

  /**
   * ดึงรายการไฟล์ทั้งหมดของคนไข้ตาม HN จากชีต Patient_Files
   */
  async getPatientFiles(hn) {
    const cleanHn = this.formatHN(hn);
    if (!cleanHn || !this.isOnline()) return [];

    try {
      const url = new URL(this.getApiUrl());
      url.searchParams.append('action', 'getPatientFiles');
      url.searchParams.append('hn', cleanHn);
      url.searchParams.append('_t', Date.now());

      const response = await this._apiFetch(url.toString());
      if (!response.ok) throw new Error('Fetch error: ' + response.status);
      const data = await response.json();
      if (data && data.status === 'success') {
        return (data.data || []).map(f => ({
          ...f,
          hn: this.formatHN(f.hn)
        }));
      }
      return [];
    } catch (err) {
      console.warn('Failed to get patient files:', err);
      return [];
    }
  },

  /**
   * ลบไฟล์ออกจาก Google Drive และชีต Patient_Files
   */
  async deleteFileFromDrive(fileId, hn) {
    if (!this.isOnline()) {
      return { status: 'error', message: 'กรุณาเชื่อมต่อระบบก่อนดำเนินการ' };
    }

    const cleanHn = this.formatHN(hn);

    try {
      const response = await this._apiFetch(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteFile',
          fileId,
          hn: cleanHn
        })
      });

      if (!response.ok) throw new Error('Delete failed: ' + response.status);
      return await response.json();
    } catch (err) {
      return { status: 'error', message: 'ลบไฟล์ล้มเหลว: ' + err.message };
    }
  },

  /**
   * บันทึกเอกสารเวชระเบียน A4 ไปยังโฟลเดอร์ของคนไข้ใน Google Drive
   */
  async saveMedicalRecordToDrive(hn, patientName, htmlContent) {
    if (!this.isOnline()) {
      return { status: 'error', message: 'กรุณาเชื่อมต่อ Google Sheets & Drive ก่อนบันทึกเวชระเบียนเข้า Drive' };
    }

    const cleanHn = this.formatHN(hn);

    try {
      const response = await this._apiFetch(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveMedicalRecordDoc',
          hn: cleanHn,
          patientName,
          htmlContent
        })
      });

      if (!response.ok) throw new Error('Save record error: ' + response.status);
      return await response.json();
    } catch (err) {
      return { status: 'error', message: 'บันทึกเอกสารเข้า Drive ล้มเหลว: ' + err.message };
    }
  },

  /**
   * ซ่อมแซมและจัดรูปแบบรหัส HN ในชีต Google Sheets เป็น 5 หลักมาตรฐาน ('00001') ทั้งหมด
   */
  async fixHN() {
    if (!this.isOnline()) {
      return { status: 'error', message: 'กรุณาเชื่อมต่อ Google Sheets ก่อนดำเนินการ' };
    }
    try {
      const url = new URL(this.getApiUrl());
      url.searchParams.append('action', 'fixHN');
      url.searchParams.append('_t', Date.now());

      const response = await this._apiFetch(url.toString());
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } catch (err) {
      return { status: 'error', message: 'ซ่อมแซม HN ไม่สำเร็จ: ' + err.message };
    }
  },
  // ----------------------------------------------------

  _getLocalPatients(query = '') {
    let raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      // ข้อมูลตัวอย่างเริ่มต้นสำหรับคลินิกกายภาพบำบัด
      const initialMock = [
        {
          hn: '00001',
          treatmentDate: '18/09/2569',
          nationalId: '1103702345678',
          firstName: 'สมชาย',
          lastName: 'เมตตาธรรม',
          gender: 'ชาย',
          dobDay: '15',
          dobMonth: '5',
          dobYear: '2535',
          age: 34,
          ethnicity: 'ไทย',
          phone: '0812345678',
          address: '99/12 หมู่ 4 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
          emergencyContactName: 'สมศรี เมตตาธรรม',
          emergencyContactPhone: '0898765432',
          emergencyRelation: 'ภรรยา',
          bp: '124/82',
          pr: '74',
          weight: 68.5,
          height: 172,
          bmi: '23.2',
          bmiInterpretation: 'น้ำหนักเกิน / ท้วม',
          underlyingDisease: 'ความดันโลหิตสูง (รับประทานยาสม่ำเสมอ)',
          chiefComplaint: 'ปวดหลังส่วนล่างร้าวลงสะโพกขวา เป็นมา 3 สัปดาห์ นั่งทำงานนานกว่า 1 ชม. อาการกำเริบ',
          subjectiveExam: 'อาการปวดเริ่มเป็นหลังยกของหนัก VAS 6/10 ไม่มีอาการชาบริเวณฝ่าเท้า ขับถ่ายปกติ ปวดมากเมื่อก้มตัวไปข้างหน้า',
          drugAllergy: 'แพ้ยา Penicillin (ผื่นลมพิษ หายใจลำบาก)',
          contraindications: 'ข้อห้าม: หลีกเลี่ยง Lumbar manipulation แรงๆ และระวังท่า High Impact / งดเครื่องกระตุ้นไฟฟ้าบริเวณหัวใจ',
          observation: 'Gait: Antalgic gait ด้านขวา, Lumbar lordosis ลดลงเล็กน้อย, Trunk shift ไปทางซ้าย',
          palpation: 'Tender point และ Taut band ชัดเจนที่ Right Quadratus Lumborum & Gluteus Medius, อุณหภูมิผิวหนังปกติ',
          measurement: 'Lumbar Flexion: 45° (จำกัดเนื่องจากปวด), Extension: 15°, Side bending ขวา: 20°, ซ้าย: 28°',
          physicalExam: 'Slump test: Positive (Right), Straight Leg Raise (SLR): 55° (Right with radicular pain), DTR: Knee jerk 2+, Ankle jerk 2+ ทั้งสองข้าง',
          activeTest: 'Active Trunk Flexion ปวดหลังร้าวลงสะโพก VAS 6/10, Extension ไม่ปวด',
          passiveTest: 'Passive SLR ข้างขวาจำกัดที่ 55 องศา End-feel: Empty due to pain',
          specialTest: 'SLR test (+), Slump test (+), FABER test (-)',
          diagnosis: 'Lumbar Disc Herniation L4-L5 with Right Radiculopathy & Myofascial Pain Syndrome',
          treatment: 'Hot pack 15 นาที, Ultrasound therapy (1 MHz, 1.2 W/cm²) บริเวณ Lumbar & Gluteal, Gentle Lumbar Traction, Core stabilization exercise'
        },
        {
          hn: '00002',
          treatmentDate: '18/09/2569',
          nationalId: '3100209876543',
          firstName: 'วรัญญา',
          lastName: 'เจริญสุข',
          gender: 'หญิง',
          dobDay: '20',
          dobMonth: '11',
          dobYear: '2542',
          age: 27,
          ethnicity: 'ไทย',
          phone: '0895551234',
          address: '45/8 อาคารสุขุมวิททาวเวอร์ ซอยสุขุมวิท 21 วัฒนา กทม.',
          emergencyContactName: 'เกรียงศักดิ์ เจริญสุข',
          emergencyContactPhone: '0814449876',
          emergencyRelation: 'บิดา',
          bp: '112/75',
          pr: '68',
          weight: 52,
          height: 162,
          bmi: '19.8',
          bmiInterpretation: 'สมส่วน / ปกติ',
          underlyingDisease: '-',
          chiefComplaint: 'ปวดตึงคอบ่าและท้ายทอย สะสมจากการทำงานหน้าคอมพิวเตอร์วันละ 8-10 ชม.',
          subjectiveExam: 'VAS 5/10 มีอาการปวดร้าวขึ้นศีรษะบางครั้ง (Tension headache) พักแล้วดีขึ้นแต่ทำงานแล้วกลับมาปวดใหม่',
          drugAllergy: '-',
          contraindications: '-',
          observation: 'Forward head posture, Rounded shoulders ทั้งสองข้าง',
          palpation: 'Taut band & Active Trigger points ที่ Bilateral Upper Trapezius และ Levator Scapulae',
          measurement: 'Cervical Rotation ขวา 65°, ซ้าย 70°, Cervical Lateral Flexion 35° ทั้งสองข้าง',
          physicalExam: 'Myotome C1-T1 Grade 5, Sensation intact, Spurling test Negative',
          activeTest: 'Active Cervical Flexion & Rotation ตึงบ่าทั้งสองข้าง',
          passiveTest: 'Passive Cervical Stretch ตึง Upper Trapezius End-feel: Firm',
          specialTest: 'Spurling test (-), Cervical distraction test (+ อาการตึงลดลง)',
          diagnosis: 'Myofascial Pain Syndrome (MPS) of Upper Trapezius & Cervicogenic Tension',
          treatment: 'High Power Laser Therapy (Upper Trapezius Bilateral), Deep tissue release, Trigger point release, Postural re-education & Ergonomic advice'
        }
      ];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialMock));
      raw = JSON.stringify(initialMock);
    }

    try {
      const rawPatients = JSON.parse(raw);
      if (!Array.isArray(rawPatients)) return [];

      const patients = rawPatients.map(p => ({
        ...p,
        hn: this.formatHN(p.hn),
        treatmentDate: this.formatTreatmentDate(p.treatmentDate),
        phone: this.formatPhone(p.phone),
        emergencyContactPhone: this.formatPhone(p.emergencyContactPhone)
      }));

      if (!query) return patients;

      const q = String(query).toLowerCase().trim();
      return patients.filter(p => {
        const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
        const phone = String(p.phone || '').toLowerCase();
        const hn = String(p.hn || '').toLowerCase();
        const id = String(p.nationalId || '').toLowerCase();
        const diag = String(p.diagnosis || '').toLowerCase();
        return fullName.includes(q) || phone.includes(q) || hn.includes(q) || id.includes(q) || diag.includes(q);
      });
    } catch (e) {
      console.error('Failed to parse patients data:', e);
      return [];
    }
  },

  _saveLocalPatient(patientData) {
    if (patientData) {
      if (patientData.hn) patientData.hn = this.formatHN(patientData.hn);
      if (patientData.treatmentDate) patientData.treatmentDate = this.formatTreatmentDate(patientData.treatmentDate);
      if (patientData.phone) patientData.phone = this.formatPhone(patientData.phone);
      if (patientData.emergencyContactPhone) patientData.emergencyContactPhone = this.formatPhone(patientData.emergencyContactPhone);
    }
    const targetHn = this.formatHN(patientData ? patientData.hn : '');
    const patients = this._getLocalPatients();
    const index = patients.findIndex(p => this.formatHN(p.hn) === targetHn);
    const now = new Date().toISOString();

    const normalized = {
      ...patientData,
      hn: targetHn,
      treatmentDate: this.formatTreatmentDate(patientData ? patientData.treatmentDate : ''),
      phone: this.formatPhone(patientData ? patientData.phone : ''),
      emergencyContactPhone: this.formatPhone(patientData ? patientData.emergencyContactPhone : ''),
      updatedAt: now
    };

    if (index >= 0) {
      patients[index] = { ...patients[index], ...normalized };
    } else {
      normalized.createdAt = now;
      patients.push(normalized);
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(patients));
    return normalized;
  },

  _deleteLocalPatient(hn) {
    const targetHn = this.formatHN(hn);
    let patients = this._getLocalPatients();
    patients = patients.filter(p => this.formatHN(p.hn) !== targetHn);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(patients));
  },

  _mergeLocalPatients(serverPatients) {
    if (!Array.isArray(serverPatients)) return;
    const local = this._getLocalPatients();
    const map = new Map();

    local.forEach(p => {
      const clean = this.formatHN(p.hn);
      if (clean) {
        map.set(clean, {
          ...p,
          hn: clean,
          phone: this.formatPhone(p.phone),
          emergencyContactPhone: this.formatPhone(p.emergencyContactPhone)
        });
      }
    });
    serverPatients.forEach(p => {
      const clean = this.formatHN(p.hn);
      if (clean) {
        map.set(clean, {
          ...map.get(clean),
          ...p,
          hn: clean,
          phone: this.formatPhone(p.phone),
          emergencyContactPhone: this.formatPhone(p.emergencyContactPhone)
        });
      }
    });

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(map.values())));
  },

  // ----------------------------------------------------
  // GOOGLE CALENDAR APPOINTMENT OPERATIONS (100% ONLINE)
  // ----------------------------------------------------

  /**
   * ล้างแคชตารางนัดหมายเดิมใน LocalStorage เพื่อให้เป็น Online 100%
   */
  clearLocalCalendarCache() {
    try {
      localStorage.removeItem('merit_clinic_calendar_events');
    } catch (e) {}
  },

  async getCalendarInfo() {
    if (!this.isOnline()) {
      return {
        status: 'offline',
        message: 'ยังไม่ได้ระบุ Web App URL หรือไม่ได้เชื่อมต่อ Google Apps Script'
      };
    }

    const calId = this.getCustomCalendarId();

    // 1. ลองส่งคำขอ POST (ไม่ติดปัญหา CORS redirect)
    try {
      const response = await this._apiFetch(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'getCalendarInfo',
          calendarId: calId
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data) return data;
      }
    } catch (postErr) {
      console.warn('POST getCalendarInfo failed, trying GET fallback:', postErr);
    }

    // 2. ลองส่งคำขอ GET สำรอง
    try {
      const url = new URL(this.getApiUrl());
      url.searchParams.append('action', 'getCalendarInfo');
      if (calId) url.searchParams.append('calendarId', calId);
      const response = await this._apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data) return data;
      }
    } catch (err) {
      console.warn('API getCalendarInfo GET failed:', err);
    }

    return {
      status: 'error',
      message: 'ไม่สามารถเชื่อมต่อ Google Apps Script ได้ (โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือ Web App URL)'
    };
  },

  async getCalendarEvents(startDate = '', endDate = '') {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'ยังไม่ได้ระบุ Web App URL ในหน้าตั้งค่า (ระบบทำงานในโหมด Online 100%)',
        events: []
      };
    }

    const calId = this.getCustomCalendarId();

    // 1. ลองส่งคำขอ POST
    try {
      const response = await this._apiFetch(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'getCalendarEvents',
          startDate: startDate,
          endDate: endDate,
          calendarId: calId
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success') {
          return {
            success: true,
            events: data.events || [],
            calendarName: data.calendarName || '',
            calendarId: data.calendarId || ''
          };
        } else if (data && data.status === 'error') {
          return {
            success: false,
            error: data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลตารางนัดหมาย',
            events: []
          };
        }
      }
    } catch (postErr) {
      console.warn('POST getCalendarEvents failed, trying GET fallback:', postErr);
    }

    // 2. ลองส่งคำขอ GET สำรอง
    try {
      const url = new URL(this.getApiUrl());
      url.searchParams.append('action', 'getCalendarEvents');
      if (startDate) url.searchParams.append('startDate', startDate);
      if (endDate) url.searchParams.append('endDate', endDate);
      if (calId) url.searchParams.append('calendarId', calId);

      const response = await this._apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success') {
          return {
            success: true,
            events: data.events || [],
            calendarName: data.calendarName || '',
            calendarId: data.calendarId || ''
          };
        } else if (data && data.status === 'error') {
          return {
            success: false,
            error: data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลตารางนัดหมาย',
            events: []
          };
        }
      }
    } catch (err) {
      console.warn('API getCalendarEvents GET failed:', err);
    }

    return {
      success: false,
      error: 'ไม่สามารถติดต่อ Google Apps Script เพื่อดึงตารางนัดหมายได้',
      events: []
    };
  },

  async createCalendarEvent(eventData) {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'ไม่สามารถสร้างนัดหมายได้: ยังไม่ได้เชื่อมต่อ Google Apps Script (ระบบทำงานในโหมด Online 100%)'
      };
    }

    const calId = this.getCustomCalendarId();

    try {
      const response = await this._apiFetch(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'createCalendarEvent',
          data: {
            ...eventData,
            calendarId: calId
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.status === 'success') {
          return {
            success: true,
            message: result.message || 'สร้างนัดหมายใน Google Calendar เรียบร้อยแล้ว',
            event: result.event
          };
        } else {
          return {
            success: false,
            error: result.message || 'ไม่สามารถสร้างนัดหมายใน Google Calendar ได้'
          };
        }
      } else {
        return {
          success: false,
          error: `เซิร์ฟเวอร์ตอบกลับรหัสข้อผิดพลาด HTTP ${response.status}`
        };
      }
    } catch (err) {
      console.error('API createCalendarEvent error:', err);
      return {
        success: false,
        error: 'การเชื่อมต่อล้มเหลว: ' + err.message
      };
    }
  },

  async deleteCalendarEvent(eventId) {
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'ไม่สามารถยกเลิกนัดหมายได้: ยังไม่ได้เชื่อมต่อ Google Apps Script'
      };
    }

    const calId = this.getCustomCalendarId();

    try {
      const response = await this._apiFetch(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteCalendarEvent',
          eventId: eventId,
          calendarId: calId
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.status === 'success') {
          return {
            success: true,
            message: result.message || 'ยกเลิกนัดหมายใน Google Calendar เรียบร้อยแล้ว'
          };
        } else {
          return {
            success: false,
            error: result.message || 'ไม่สามารถยกเลิกนัดหมายใน Google Calendar ได้'
          };
        }
      } else {
        return {
          success: false,
          error: `เซิร์ฟเวอร์ตอบกลับรหัสข้อผิดพลาด HTTP ${response.status}`
        };
      }
    } catch (err) {
      console.error('API deleteCalendarEvent error:', err);
      return {
        success: false,
        error: 'การเชื่อมต่อล้มเหลว: ' + err.message
      };
    }
  },

  setCustomCalendarId(calId) {
    if (calId) {
      localStorage.setItem('merit_clinic_calendar_id', calId.trim());
    } else {
      localStorage.removeItem('merit_clinic_calendar_id');
    }
  },

  getCustomCalendarId() {
    return localStorage.getItem('merit_clinic_calendar_id') || '';
  },

  getCalendarEmbedUrl(calendarId = '') {
    const targetId = this.getCustomCalendarId() || calendarId;
    let url = 'https://calendar.google.com/calendar/embed?ctz=Asia%2FBangkok&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1';
    if (targetId && targetId !== 'offline-calendar') {
      url += `&src=${encodeURIComponent(targetId)}`;
    }
    return url;
  },

  // =========================================================================
  // BILLING & RECEIPTS ENGINE
  // =========================================================================
  /**
   * แปลงจำนวนเงิน (ตัวเลข) เป็นตัวหนังสือภาษาไทย (Thai Baht Text)
   * ตัวอย่าง: 1500 -> "หนึ่งพันห้าร้อยบาทถ้วน", 1250.50 -> "หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์"
   */
  convertNumberToThaiBahtText(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return 'ศูนย์บาทถ้วน';
    const num = parseFloat(amount);
    if (num === 0) return 'ศูนย์บาทถ้วน';

    const thaiDigits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const thaiPositions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

    function convertGroup(nStr) {
      let result = '';
      const len = nStr.length;
      for (let i = 0; i < len; i++) {
        const digit = parseInt(nStr[i], 10);
        const pos = len - i - 1;
        if (digit !== 0) {
          if (pos === 1 && digit === 1) {
            result += 'สิบ';
          } else if (pos === 1 && digit === 2) {
            result += 'ยี่สิบ';
          } else if (pos === 0 && digit === 1 && len > 1 && nStr[len - 2] !== '0') {
            result += 'เอ็ด';
          } else {
            result += thaiDigits[digit] + thaiPositions[pos];
          }
        }
      }
      return result;
    }

    const isNegative = num < 0;
    const absNum = Math.abs(num);
    const parts = absNum.toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    let bahtText = '';
    if (integerPart.length > 6) {
      const millions = integerPart.slice(0, -6);
      const remainder = integerPart.slice(-6);
      bahtText = convertGroup(millions) + 'ล้าน' + convertGroup(remainder);
    } else {
      bahtText = convertGroup(integerPart);
    }

    if (!bahtText) bahtText = 'ศูนย์';
    bahtText += 'บาท';

    if (decimalPart === '00') {
      bahtText += 'ถ้วน';
    } else {
      let satangText = '';
      const s0 = parseInt(decimalPart[0], 10);
      const s1 = parseInt(decimalPart[1], 10);
      if (s0 === 1) satangText += 'สิบ';
      else if (s0 === 2) satangText += 'ยี่สิบ';
      else if (s0 > 2) satangText += thaiDigits[s0] + 'สิบ';

      if (s1 === 1 && s0 > 0) satangText += 'เอ็ด';
      else if (s1 > 0) satangText += thaiDigits[s1];

      bahtText += satangText + 'สตางค์';
    }

    return (isNegative ? 'ลบ' : '') + bahtText;
  },

  // ----------------------------------------------------
  // BILLING & RECEIPTS ENGINE (100% ONLINE GOOGLE SHEETS)
  // ----------------------------------------------------

  async getReceipts(monthKey = '') {
    if (this.isOnline()) {
      try {
        const url = new URL(this.getApiUrl());
        url.searchParams.append('action', 'getReceipts');
        if (monthKey && monthKey !== 'all') {
          url.searchParams.append('monthKey', monthKey);
        }
        url.searchParams.append('_t', Date.now());

        const response = await this._apiFetch(url);
        if (response.ok) {
          const res = await response.json();
          if (res && res.status === 'success' && Array.isArray(res.data)) {
            const formattedList = res.data.map(r => ({
              ...r,
              hn: this.formatHN(r.hn),
              patientPhone: this.formatPhone(r.patientPhone)
            }));
            // Sync with local memory cache
            try {
              localStorage.setItem('merit_clinic_receipts', JSON.stringify(formattedList));
            } catch (e) {}
            return formattedList;
          }
        }
      } catch (err) {
        console.error('Failed to fetch receipts from Google Sheets:', err);
      }
    }

    // Fallback if offline or connection fails
    try {
      const raw = localStorage.getItem('merit_clinic_receipts');
      const all = raw ? JSON.parse(raw) : [];
      const formattedAll = all.map(r => ({
        ...r,
        hn: this.formatHN(r.hn),
        patientPhone: this.formatPhone(r.patientPhone)
      }));
      if (monthKey && monthKey !== 'all') {
        return formattedAll.filter(r => r.monthKey === monthKey || (r.date && r.date.startsWith(monthKey)));
      }
      return formattedAll;
    } catch (err) {
      console.error('Failed to parse receipts from storage:', err);
      return [];
    }
  },

  async saveReceipt(receipt) {
    if (!receipt.id) {
      receipt.id = 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
    if (receipt.hn) {
      receipt.hn = this.formatHN(receipt.hn);
    }
    if (receipt.patientPhone) {
      receipt.patientPhone = this.formatPhone(receipt.patientPhone);
    }

    if (this.isOnline()) {
      try {
        const response = await this._apiFetch(this.getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'saveReceipt',
            data: receipt
          })
        });

        if (response.ok) {
          const res = await response.json();
          if (res && res.status === 'success') {
            // ใช้เลขใบเสร็จที่เซิร์ฟเวอร์ยืนยัน (อาจถูกเปลี่ยนถ้าเลขเดิมถูกเครื่องอื่นใช้ไปแล้ว)
            if (res.receipt && res.receipt.receiptNo) receipt.receiptNo = res.receipt.receiptNo;
            delete receipt.isNew;
            // Also update local cache
            try {
              const raw = localStorage.getItem('merit_clinic_receipts');
              const receipts = raw ? JSON.parse(raw) : [];
              const idx = receipts.findIndex(r => r.receiptNo === receipt.receiptNo || r.id === receipt.id);
              if (idx >= 0) receipts[idx] = receipt;
              else receipts.unshift(receipt);
              localStorage.setItem('merit_clinic_receipts', JSON.stringify(receipts));
            } catch (e) {}

            return { success: true, receipt: receipt, receiptNoChanged: !!res.receiptNoChanged, spreadsheetUrl: res.spreadsheetUrl };
          }
          return { success: false, error: (res && res.message) || 'บันทึกข้อมูลลง Google Sheets ไม่สำเร็จ' };
        }
        return { success: false, error: `HTTP error ${response.status}` };
      } catch (err) {
        console.error('Failed to save receipt to Google Sheets:', err);
        return { success: false, error: err.message };
      }
    }

    // Offline mode fallback
    delete receipt.isNew;
    try {
      const raw = localStorage.getItem('merit_clinic_receipts');
      const receipts = raw ? JSON.parse(raw) : [];
      const idx = receipts.findIndex(r => r.id === receipt.id || r.receiptNo === receipt.receiptNo);
      if (idx >= 0) receipts[idx] = receipt;
      else receipts.unshift(receipt);
      localStorage.setItem('merit_clinic_receipts', JSON.stringify(receipts));
      return { success: true, receipt: receipt };
    } catch (err) {
      console.error('Failed to save receipt locally:', err);
      return { success: false, error: err.message };
    }
  },

  async deleteReceipt(receiptNo, monthKey = '') {
    if (this.isOnline()) {
      try {
        const response = await this._apiFetch(this.getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'deleteReceipt',
            receiptNo: receiptNo,
            monthKey: monthKey
          })
        });

        // Remove from local cache
        try {
          const raw = localStorage.getItem('merit_clinic_receipts');
          let receipts = raw ? JSON.parse(raw) : [];
          receipts = receipts.filter(r => r.receiptNo !== receiptNo && r.id !== receiptNo);
          localStorage.setItem('merit_clinic_receipts', JSON.stringify(receipts));
        } catch (e) {}

        if (response.ok) {
          const res = await response.json();
          if (res && res.status === 'success') {
            return { success: true };
          }
          return { success: false, error: res && res.message };
        }
        return { success: false, error: `HTTP error ${response.status}` };
      } catch (err) {
        console.error('Failed to delete receipt from Google Sheets:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const raw = localStorage.getItem('merit_clinic_receipts');
      let receipts = raw ? JSON.parse(raw) : [];
      receipts = receipts.filter(r => r.receiptNo !== receiptNo && r.id !== receiptNo);
      localStorage.setItem('merit_clinic_receipts', JSON.stringify(receipts));
      return { success: true };
    } catch (err) {
      console.error('Failed to delete receipt locally:', err);
      return { success: false, error: err.message };
    }
  },

  // Export / Import Database for Clinic Backup
  exportDataJSON() {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY) || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Merit_Clinic_Patients_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importDataJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return { success: true, count: data.length };
      }
      throw new Error('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
