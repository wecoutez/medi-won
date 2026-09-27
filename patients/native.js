/* ============================================================
   MediWon — native layer
   Persistence (Capacitor Preferences), QR scanning (Camera),
   and record export (Filesystem + Share).
   Every feature degrades to a browser equivalent so the same
   file works on Netlify and inside the iOS app.
   ============================================================ */
(function () {
  'use strict';

  var C = window.Capacitor || {};
  var P = C.Plugins || {};
  var isNative = !!(C.isNativePlatform && C.isNativePlatform());

  /* ---------- Storage ---------- */

  var Store = {
    set: function (key, value) {
      var raw = JSON.stringify(value);
      if (isNative && P.Preferences) {
        return P.Preferences.set({ key: key, value: raw }).catch(function (e) {
          console.warn('Preferences.set failed', e);
        });
      }
      try { window.localStorage.setItem(key, raw); } catch (e) { console.warn(e); }
      return Promise.resolve();
    },
    get: function (key) {
      if (isNative && P.Preferences) {
        return P.Preferences.get({ key: key })
          .then(function (r) { return r && r.value ? JSON.parse(r.value) : null; })
          .catch(function () { return null; });
      }
      try {
        var raw = window.localStorage.getItem(key);
        return Promise.resolve(raw ? JSON.parse(raw) : null);
      } catch (e) { return Promise.resolve(null); }
    },
    remove: function (key) {
      if (isNative && P.Preferences) return P.Preferences.remove({ key: key });
      try { window.localStorage.removeItem(key); } catch (e) {}
      return Promise.resolve();
    }
  };
  window.MediWonStore = Store;

  var K_RECORDS = 'mediwon.records.v1';
  var K_PHOTO   = 'mediwon.photo.v1';
  var K_LANG    = 'mediwon.lang.v1';

  /* ---------- Helpers ---------- */

  var TYPE_COLORS = {
    'Lab': '#028090', 'Imaging': '#F6C90E', 'Surgery': '#E05C6A',
    'Consultation': '#02C39A', 'Vaccine': '#a78bfa', 'Preventive': '#00A896',
    'Emergency': '#DC2626', 'Medication': '#0891B2', 'Other': '#6B7E96'
  };

  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function prettyDate(iso) {
    if (!iso) {
      return new Date().toLocaleDateString('en-US',
        { month: 'short', day: 'numeric', year: 'numeric' });
    }
    var parts = iso.split('-');
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return isNaN(d) ? iso
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function t(en, ko) {
    return (window.currentLang === 'ko') ? ko : en;
  }

  function toast(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
    else console.log(msg);
  }

  /* ---------- Save a record (replaces the demo stub) ---------- */

  function buildRecord() {
    var event = val('add-event');
    if (!event) return null;

    var type = val('add-type') || 'Other';
    var hospital = val('add-hospital') || t('Unspecified', '미지정');
    var country = (val('add-country').match(/\p{Extended_Pictographic}+/u) || ['🏳️'])[0];

    return {
      date: prettyDate(val('add-date')),
      event: { en: event, ko: event },
      type: { en: type, ko: type },
      color: TYPE_COLORS[type] || '#6B7E96',
      hospital: { en: hospital, ko: hospital },
      doctor: val('add-doctor') || '—',
      country: country,
      patientId: val('add-patient-id') || '',
      specialty: val('add-specialty') || '',
      tags: val('add-tags') || '',
      notes: val('add-notes') || '',
      savedAt: new Date().toISOString(),
      userCreated: true
    };
  }

  function clearForm() {
    ['add-patient-id', 'add-event', 'add-date', 'add-hospital',
     'add-doctor', 'add-specialty', 'add-tags', 'add-notes'
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  window.saveAndGo = function () {
    var rec = buildRecord();
    if (!rec) {
      toast(t('Enter an event or diagnosis first.', '항목 또는 진단명을 입력해 주세요.'));
      var f = document.getElementById('add-event');
      if (f) f.focus();
      return;
    }

    window.allRecordsData.unshift(rec);

    var mine = window.allRecordsData.filter(function (r) { return r.userCreated; });
    Store.set(K_RECORDS, mine).then(function () {
      toast(t('Record saved to this device.', '기록이 이 기기에 저장되었습니다.'));
      clearForm();
      setTimeout(function () {
        if (typeof window.goPage === 'function') window.goPage('records');
        if (typeof window.renderRecordsTable === 'function') window.renderRecordsTable();
      }, 400);
    });
  };

  /* ---------- QR scanning ---------- */

  window.scanPatientQR = function () {
    var target = document.getElementById('add-patient-id');

    function apply(value) {
      if (!value) return;
      var id = String(value).trim();
      var m = id.match(/MW-\d{3,}/i);
      if (m) id = m[0].toUpperCase();
      if (target) target.value = id;
      toast(t('Patient ' + id + ' loaded.', '환자 ' + id + ' 불러옴'));
    }

    var scanner = P.CapacitorBarcodeScanner;
    if (isNative && scanner) {
      scanner.scanBarcode({
        hint: 0,
        scanInstructions: t('Point the camera at the patient QR card',
                            '환자 QR 카드를 카메라에 비춰주세요'),
        scanButton: false
      }).then(function (res) {
        apply(res && res.ScanResult);
      }).catch(function (e) {
        console.warn('scan cancelled', e);
      });
      return;
    }

    // Browser / simulator fallback so the flow stays testable
    var typed = window.prompt(
      t('Camera unavailable here — enter the patient ID manually.',
        '이 환경에서는 카메라를 쓸 수 없습니다. 환자 ID를 직접 입력하세요.'),
      'MW-00142');
    apply(typed);
  };

  /* ---------- Export & share ---------- */

  function toCSV(rows) {
    var head = ['Date', 'Event', 'Type', 'Hospital', 'Doctor', 'Country',
                'Patient ID', 'Specialty', 'Tags', 'Notes'];
    function esc(v) {
      return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    }
    var lines = [head.map(esc).join(',')];
    rows.forEach(function (r) {
      lines.push([
        r.date, r.event.en, r.type.en, r.hospital.en, r.doctor, r.country,
        r.patientId || '', r.specialty || '', r.tags || '', r.notes || ''
      ].map(esc).join(','));
    });
    return lines.join('\n');
  }

  window.exportRecords = function () {
    var rows = window.allRecordsData || [];
    if (!rows.length) {
      toast(t('No records to export.', '내보낼 기록이 없습니다.'));
      return;
    }

    var csv = toCSV(rows);
    var name = 'mediwon-records-' + new Date().toISOString().slice(0, 10) + '.csv';

    if (isNative && P.Filesystem && P.Share) {
      P.Filesystem.writeFile({
        path: name,
        data: csv,
        directory: 'CACHE',
        encoding: 'utf8'
      }).then(function (res) {
        return P.Share.share({
          title: 'MediWon records',
          text: t('Health records exported from MediWon.',
                  'MediWon에서 내보낸 건강 기록입니다.'),
          url: res.uri,
          dialogTitle: t('Share records', '기록 공유')
        });
      }).catch(function (e) {
        console.warn('export failed', e);
        toast(t('Export failed.', '내보내기에 실패했습니다.'));
      });
      return;
    }

    // Browser fallback — download the file
    try {
      var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      toast(t('Records exported.', '기록을 내보냈습니다.'));
    } catch (e) {
      toast(t('Export failed.', '내보내기에 실패했습니다.'));
    }
  };

  /* ---------- Persist the patient photo ---------- */

  function paintPhoto(src) {
    if (!src) return;
    var av = document.querySelector('.sidebar-profile .avatar-fallback');
    if (av) av.outerHTML = '<img class="avatar-img" src="' + src + '">';
    var pc = document.getElementById('patient-avatar');
    if (pc && pc.tagName !== 'IMG') {
      pc.outerHTML = '<img class="patient-photo" id="patient-avatar" src="' + src + '">';
    } else if (pc) {
      pc.src = src;
    }
  }

  var originalLoadPhoto = window.loadPhoto;
  window.loadPhoto = function (input) {
    if (typeof originalLoadPhoto === 'function') originalLoadPhoto(input);
    if (!input.files || !input.files[0]) return;
    var reader = new FileReader();
    reader.onload = function (e) { Store.set(K_PHOTO, e.target.result); };
    reader.readAsDataURL(input.files[0]);
  };

  /* ---------- Remember the language choice ---------- */

  var originalSetLang = window.setLang;
  if (typeof originalSetLang === 'function') {
    window.setLang = function (lang) {
      originalSetLang(lang);
      Store.set(K_LANG, lang);
    };
  }

  /* ---------- Restore on boot ---------- */

  function restore() {
    Store.get(K_RECORDS).then(function (saved) {
      if (saved && saved.length && window.allRecordsData) {
        window.allRecordsData = saved.concat(window.allRecordsData);
        if (typeof window.renderRecordsTable === 'function') window.renderRecordsTable();
      }
    });

    Store.get(K_PHOTO).then(paintPhoto);

    Store.get(K_LANG).then(function (lang) {
      if (lang && lang !== window.currentLang && typeof originalSetLang === 'function') {
        originalSetLang(lang);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restore);
  } else {
    restore();
  }

  /* ---------- Records search ---------- */

  window.filterRecords = function (q) {
    q = String(q || '').toLowerCase().trim();
    var rows = document.querySelectorAll('#all-tbody tr');
    Array.prototype.forEach.call(rows, function (tr) {
      tr.style.display = (!q || tr.textContent.toLowerCase().indexOf(q) > -1) ? '' : 'none';
    });
  };

  /* ---------- Reset (used by the settings/logout flow) ---------- */

  window.clearLocalData = function () {
    return Promise.all([
      Store.remove(K_RECORDS), Store.remove(K_PHOTO), Store.remove(K_LANG)
    ]).then(function () {
      toast(t('Local data cleared.', '기기 저장 데이터를 삭제했습니다.'));
    });
  };
})();
