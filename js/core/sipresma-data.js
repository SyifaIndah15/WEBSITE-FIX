const DATA_ROOT = new URL("../../data/", import.meta.url);
const SEED_VERSION = 5;
const STATUS_SYNC_VERSION = 2;

const LEGACY_SHARED_BUKTI = Object.freeze([
  "../../assets/dokumen/sertifikat-gemastik-xvi-smart-city.pdf",
  "../../assets/dokumen/sertifikat-international-youth-ai-innovation-forum-2026.pdf",
  "../../assets/dokumen/sertifikat-national-hackathon-data-science-2025.pdf",
  "../../assets/dokumen/sertifikat-turnamen-catur-jawa-barat-2025.pdf"
]);

export const KEYS = Object.freeze({
  admin: "sipresma_admin_accounts",
  dosen: "sipresma_dosen_accounts",
  mahasiswa: "sipresma_mahasiswa_accounts",
  prestasi: "sipresma_prestasi",
  arsip: "sipresma_prestasi_arsip",
  reset: "sipresma_reset_password",
  meta: "sipresma_data_meta",
  adminSession: "sipresma_admin_session",
  dosenSession: "sipresma_dosen_session",
  mahasiswaSession: "sipresma_mahasiswa_session"
});

const FILES = Object.freeze({
  admin: "data-akun-admin.json",
  dosen: "data-akun-dosen.json",
  mahasiswa: "data-akun-mahasiswa.json",
  mahasiswaData: "data-mahasiswa.json",
  prestasi: "data-prestasi.json",
  reset: "data-reset-password.json"
});

let initializationError = null;

function normalize(value) {
  return String(value == null ? "" : value).trim();
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (error) {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("sipresma:data-changed", {
      detail: { key: key }
    }));
    return true;
  } catch (error) {
    return false;
  }
}

function readArray(key) {
  const value = read(key, []);
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function mergeRecord(seed, existing) {
  const merged = Object.assign({}, seed);

  if (isRecord(existing)) {
    Object.keys(existing).forEach(function (key) {
      const value = existing[key];
      if (value === undefined || value === null) return;
      if (typeof value === "string" && value.trim() === "") return;
      merged[key] = value;
    });
  }

  return merged;
}

function mergeCollection(existing, seeds, keySelector) {
  const result = existing.map(clone);
  const indexByKey = new Map();

  result.forEach(function (item, index) {
    indexByKey.set(String(keySelector(item)), index);
  });

  seeds.forEach(function (seed) {
    const key = String(keySelector(seed));
    const existingIndex = indexByKey.get(key);

    if (existingIndex === undefined) {
      result.push(clone(seed));
      indexByKey.set(key, result.length - 1);
      return;
    }

    result[existingIndex] = mergeRecord(seed, result[existingIndex]);
  });

  return result;
}

function repairSharedBukti(records, seeds) {
  const seedBukti = new Map();
  seeds.forEach(function (seed) {
    seedBukti.set(normalize(seed.id), normalize(seed.bukti));
  });

  let changed = false;
  const repaired = records.map(function (item) {
    const current = normalize(item.bukti);
    if (LEGACY_SHARED_BUKTI.indexOf(current) === -1) return item;

    const canonical = seedBukti.get(normalize(item.id));
    if (!canonical || canonical === current) return item;

    changed = true;
    return Object.assign({}, item, { bukti: canonical });
  });

  return changed ? repaired : records;
}

function arsipKey(item) {
  return normalize(item.nim) + "|" + normalize(item.namaKompetisi || item.namaPrestasi);
}

function repairArsipBukti(items, seeds) {
  const seedBukti = new Map();
  seeds.forEach(function (seed) {
    seedBukti.set(arsipKey(seed), normalize(seed.bukti));
  });

  let changed = false;
  const repaired = items.map(function (item) {
    const canonical = seedBukti.get(arsipKey(item));
    if (!canonical || normalize(item.bukti) === canonical) return item;
    changed = true;
    return Object.assign({}, item, { bukti: canonical });
  });

  return changed ? repaired : items;
}

function isActiveStatus(status) {
  const value = normalize(status).toLowerCase();
  return !value || value === "aktif";
}

function isRole(role, expected) {
  const value = normalize(role).toLowerCase();
  return !value || value === normalize(expected).toLowerCase();
}

function accountKeyFor(role, account) {
  if (role === "admin") return normalize(account.username || account.id);
  if (role === "dosen") return normalize(account.nidn || account.username || account.id);
  return normalize(account.nim || account.username || account.id);
}

function normalizeAdminSeed(account) {
  const username = normalize(account.username);
  return Object.assign({}, account, {
    id: account.id || "ADM-" + username,
    username: username,
    nama: normalize(account.nama),
    name: normalize(account.name || account.nama),
    role: "Administrator Sistem",
    statusAkun: normalize(account.statusAkun) || "Aktif",
    password: normalize(account.password)
  });
}

function normalizeDosenSeed(account) {
  const nidn = normalize(account.nidn || account.username);
  return Object.assign({}, account, {
    id: account.id || "DOS-" + nidn,
    nidn: nidn,
    username: normalize(account.username || nidn),
    nama: normalize(account.nama),
    name: normalize(account.name || account.nama),
    role: "Dosen",
    statusAkun: normalize(account.statusAkun) || "Aktif",
    password: normalize(account.password) || nidn
  });
}

function defaultPasswordFor(role, account) {
  if (role === "dosen") return normalize(account.nidn || account.username);
  if (role === "mahasiswa") return normalize(account.nim || account.username);
  return "";
}

function applyDefaultPasswords() {
  [
    { key: KEYS.mahasiswa, role: "mahasiswa" },
    { key: KEYS.dosen, role: "dosen" }
  ].forEach(function (entry) {
    const accounts = readArray(entry.key);
    let changed = false;
    const updated = accounts.map(function (account) {
      if (normalize(account.password)) return account;

      const password = defaultPasswordFor(entry.role, account);
      if (!password) return account;

      changed = true;
      return Object.assign({}, account, { password: password });
    });

    if (changed) write(entry.key, updated);
  });
}

function normalizeAcademicRecord(record) {
  const total = record.totalPrestasi;
  return {
    id: record.id || "",
    nim: normalize(record.nim),
    nama: normalize(record.nama),
    angkatan: record.angkatan == null ? null : Number(record.angkatan),
    year: record.angkatan == null ? "" : String(record.angkatan),
    programStudi: normalize(record.programStudi) || "Teknik Informatika",
    fakultas: normalize(record.fakultas) || "Fakultas Teknologi Informasi",
    email: normalize(record.email),
    ipk: record.ipk == null ? null : Number(record.ipk),
    jumlahPrestasiAkademik: record.jumlahPrestasiAkademik == null ? null : Number(record.jumlahPrestasiAkademik),
    tingkatPrestasiAkademik: normalize(record.tingkatPrestasiAkademik),
    jumlahPrestasiNonAkademik: record.jumlahPrestasiNonAkademik == null ? null : Number(record.jumlahPrestasiNonAkademik),
    tingkatPrestasiNonAkademik: normalize(record.tingkatPrestasiNonAkademik),
    totalPrestasi: total == null ? null : Number(total),
    klasifikasi: normalize(record.klasifikasi),
    category: normalize(record.klasifikasi) || "Rendah",
    tahunData: record.tahunData == null ? null : Number(record.tahunData),
    status: normalize(record.status) || "Aktif",
    konflikData: record.konflikData == null ? null : record.konflikData,
    hasAcademicData: Boolean(record.id || record.ipk != null || record.klasifikasi)
  };
}

function buildMahasiswaSeeds(accountPayload, dataPayload) {
  const accounts = Array.isArray(accountPayload.data) ? accountPayload.data : [];
  const academicRecords = Array.isArray(dataPayload.data) ? dataPayload.data : [];
  const academicByNim = new Map();

  academicRecords.forEach(function (record) {
    const nim = normalize(record.nim);
    if (nim) academicByNim.set(nim, record);
  });

  const seeds = accounts.map(function (account) {
    const nim = normalize(account.nim || account.username);
    const academicSource = academicByNim.get(nim) || {};
    const academic = normalizeAcademicRecord(Object.assign({}, academicSource, { nim: nim }));
    const name = normalize(account.nama || academic.nama);
    const statusAkun = normalize(account.statusAkun) || academic.status || "Aktif";

    academicByNim.delete(nim);

    return Object.assign({}, academic, account, {
      id: account.id || academic.id || "MHS-" + nim,
      nim: nim,
      username: normalize(account.username || nim),
      nama: name,
      name: name,
      email: normalize(account.email || academic.email),
      role: "Mahasiswa",
      programStudi: normalize(account.programStudi) || academic.programStudi || "Teknik Informatika",
      fakultas: normalize(account.fakultas) || academic.fakultas || "Fakultas Teknologi Informasi",
      statusAkun: statusAkun,
      status: normalize(academic.status) || statusAkun,
      password: normalize(account.password) || nim,
      year: academic.year,
      angkatan: academic.angkatan,
      ipk: academic.ipk,
      category: academic.category,
      klasifikasi: academic.klasifikasi,
      hasAcademicData: academic.hasAcademicData
    });
  });

  academicByNim.forEach(function (record, nim) {
    const academic = normalizeAcademicRecord(record);
    seeds.push(Object.assign({}, academic, {
      id: academic.id || "MHS-" + nim,
      nim: nim,
      username: nim,
      nama: academic.nama,
      name: academic.nama,
      role: "Mahasiswa",
      statusAkun: academic.status || "Aktif",
      password: nim
    }));
  });

  return seeds;
}

function normalizeStatus(status) {
  const value = normalize(status).toLowerCase();
  if (value === "terverifikasi" || value === "diverifikasi" || value === "verified") return "Terverifikasi";
  if (value.includes("perbaikan") || value === "revision") return "Perlu Perbaikan";
  if (value === "ditolak" || value === "rejected") return "Ditolak";
  return "Menunggu Verifikasi";
}

function normalizePrestasiSeed(record, index) {
  const status = normalizeStatus(record.status || record.statusSumber);
  return Object.assign({}, record, {
    id: normalize(record.id) || "PRS-" + String(index + 1).padStart(3, "0"),
    namaMahasiswa: normalize(record.namaMahasiswa),
    nim: normalize(record.nim),
    namaKompetisi: normalize(record.namaKompetisi || record.namaPrestasi),
    namaPrestasi: normalize(record.namaPrestasi || record.namaKompetisi),
    penyelenggara: normalize(record.penyelenggara),
    jenis: normalize(record.jenis) || "Akademik",
    tingkat: normalize(record.tingkat),
    peringkat: normalize(record.peringkat),
    tahun: record.tahun == null ? "" : String(record.tahun),
    status: status,
    statusSumber: normalize(record.statusSumber) || status,
    tanggalPengajuan: record.tanggalPengajuan || null,
    bukti: record.bukti || null
  });
}

function normalizeArsip(record, index) {
  const normalized = normalizePrestasiSeed(record, index);
  return Object.assign({}, normalized, {
    id: normalize(record.id) || "ARSIP-" + String(index + 1).padStart(3, "0"),
    arsip: true
  });
}


function conflictRecordKey(nim, competition) {
  const key = normalize(nim) + "|" + normalize(competition);
  return key === "|" ? "" : key;
}

function prestasiRecordKey(item) {
  if (!isRecord(item)) return "";

  const id = normalize(item.id);
  if (id) return "id:" + id;

  const key = [
    normalize(item.nim),
    normalize(item.namaKompetisi || item.namaPrestasi),
    normalize(item.tahun)
  ].join("|");

  return key === "||" ? "" : "record:" + key;
}

function uniquePrestasiRecords(items) {
  const seen = new Set();

  return (Array.isArray(items) ? items : []).filter(function (item) {
    if (!isRecord(item)) return false;

    const key = prestasiRecordKey(item);
    if (!key) return true;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function emptyPrestasiSummary() {
  return {
    academic: { count: 0, level: "", rank: 0 },
    nonAcademic: { count: 0, level: "", rank: 0 },
    total: 0
  };
}

function jenisPrestasiKey(value) {
  const jenis = normalize(value).toLowerCase();
  return /non[\s-]*akademik/.test(jenis) ? "nonAcademic" : "academic";
}

function tingkatPrestasi(value) {
  const raw = normalize(value);
  const label = raw.replace(/^tingkat\s+/i, "") || raw;
  const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  let rank = 0;

  if (key.includes("internasional")) rank = 5;
  else if (key.includes("nasional")) rank = 4;
  else if (key.includes("provinsi")) rank = 3;
  else if (key.includes("kabupaten") || key.includes("kota")) rank = 2;
  else if (key.includes("kampus") || key.includes("internal")) rank = 1;

  return { label: label, rank: rank };
}

function isVerifiedPrestasi(item) {
  if (!isRecord(item) || getStatusView(item.status).key !== "verified") return false;

  const sourceStatus = normalize(item.statusSumber);
  if (!sourceStatus) return true;

  return getStatusView(sourceStatus).key === "verified";
}

function buildVerifiedPrestasiSummaries(records) {
  const summaries = new Map();

  uniquePrestasiRecords(records).forEach(function (item) {
    if (!isVerifiedPrestasi(item)) return;

    const nim = normalize(item.nim);
    if (!nim) return;

    if (!summaries.has(nim)) summaries.set(nim, emptyPrestasiSummary());

    const summary = summaries.get(nim);
    const key = jenisPrestasiKey(item.jenis);
    const level = tingkatPrestasi(item.tingkat);

    summary[key].count += 1;
    summary.total += 1;

    if (level.rank > summary[key].rank) {
      summary[key].level = level.label;
      summary[key].rank = level.rank;
    }
  });

  return summaries;
}

function syncVerifiedPrestasiCounts() {
  const accounts = readArray(KEYS.mahasiswa);
  const summaries = buildVerifiedPrestasiSummaries(readArray(KEYS.prestasi));
  let changed = false;

  const updated = accounts.map(function (student) {
    const nim = normalize(student.nim || student.username);
    const summary = summaries.get(nim) || emptyPrestasiSummary();
    const fields = {
      jumlahPrestasiAkademik: summary.academic.count,
      tingkatPrestasiAkademik: summary.academic.level,
      jumlahPrestasiNonAkademik: summary.nonAcademic.count,
      tingkatPrestasiNonAkademik: summary.nonAcademic.level,
      totalPrestasi: summary.total
    };
    const needsUpdate = Object.keys(fields).some(function (key) {
      return student[key] !== fields[key];
    });

    if (!needsUpdate) return student;

    changed = true;
    return Object.assign({}, student, fields);
  });

  if (changed) write(KEYS.mahasiswa, updated);
  return updated;
}

function syncSourcePendingStatuses(records, sourceRecords) {
  if (!Array.isArray(sourceRecords) || sourceRecords.length === 0) return records;

  const pendingIds = new Set();
  const pendingKeys = new Set();

  sourceRecords.forEach(function (source) {
    if (!isRecord(source)) return;
    if (normalizeStatus(source.status || source.statusSumber) !== "Menunggu Verifikasi") return;

    const id = normalize(source.id);
    if (id) pendingIds.add(id);

    const key = conflictRecordKey(source.nim, source.namaKompetisi || source.namaPrestasi);
    if (key) pendingKeys.add(key);
  });

  if (pendingIds.size === 0 && pendingKeys.size === 0) return records;

  return records.map(function (record) {
    const id = normalize(record.id);
    const key = conflictRecordKey(record.nim, record.namaKompetisi || record.namaPrestasi);
    const isSourcePending = (id && pendingIds.has(id)) || (key && pendingKeys.has(key));
    if (!isSourcePending) return record;

    const statusIsPending = normalizeStatus(record.status) === "Menunggu Verifikasi";
    const sourceIsPending = normalize(record.statusSumber) &&
      normalizeStatus(record.statusSumber) === "Menunggu Verifikasi";
    if (statusIsPending && sourceIsPending) return record;

    const updated = Object.assign({}, record, {
      status: "Menunggu Verifikasi",
      statusSumber: "Menunggu Verifikasi"
    });
    delete updated.keteranganVerifikasi;
    delete updated.diverifikasiPada;
    return updated;
  });
}

function normalizeResetSeed(record, index) {
  const role = normalize(record.role) || "Mahasiswa";
  const isDosen = role.toLowerCase().indexOf("dosen") !== -1;
  return {
    id: normalize(record.id) || "RST-" + String(index + 1).padStart(3, "0"),
    role: isDosen ? "Dosen" : "Mahasiswa",
    identifier: normalize(record.identifier || (isDosen ? record.nidn : record.nim)),
    nama: normalize(record.nama),
    email: normalize(record.email),
    tanggalPengajuan: normalize(record.tanggalPengajuan),
    waktuPengajuan: normalize(record.waktuPengajuan),
    status: normalize(record.status) || "Menunggu",
    catatan: normalize(record.catatan),
    statusChangedAt: record.statusChangedAt || null,
    createdAt: record.createdAt || null
  };
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatResetDate(date) {
  return date.getFullYear() + "-" + padNumber(date.getMonth() + 1) + "-" + padNumber(date.getDate());
}

function formatResetTime(date) {
  return padNumber(date.getHours()) + ":" + padNumber(date.getMinutes()) + " WIB";
}

async function fetchPayload(fileName) {
  const response = await fetch(new URL(fileName, DATA_ROOT), {
    cache: "no-store",
    headers: { Accept: "application/json" }
  });

  if (!response.ok) throw new Error("Data " + fileName + " tidak dapat diambil.");

  const payload = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new Error("Struktur " + fileName + " tidak valid.");
  }

  return payload;
}

function hasRequiredStores() {
  return [KEYS.admin, KEYS.dosen, KEYS.mahasiswa, KEYS.prestasi, KEYS.arsip, KEYS.reset].every(function (key) {
    return window.localStorage.getItem(key) != null;
  });
}

async function initializeStore() {
  let meta = read(KEYS.meta, null);
  const metaVersion = meta && Number(meta.seedVersion);
  const statusSyncVersion = meta && Number(meta.statusSyncVersion);
  const needsSeed = !meta || !Number.isFinite(metaVersion) || metaVersion < SEED_VERSION || !hasRequiredStores();
  const needsStatusSync = !Number.isFinite(statusSyncVersion) || statusSyncVersion < STATUS_SYNC_VERSION;

  if (!needsSeed && !needsStatusSync) return;


  let prestasi = readArray(KEYS.prestasi);
  let prestasiPayload = null;
  let adminAccounts = [];
  let dosenAccounts = [];
  let mahasiswaAccounts = [];
  let resetRequests = readArray(KEYS.reset);

  if (needsSeed) {
    const payloads = await Promise.all([
      fetchPayload(FILES.admin),
      fetchPayload(FILES.dosen),
      fetchPayload(FILES.mahasiswa),
      fetchPayload(FILES.mahasiswaData),
      fetchPayload(FILES.prestasi),
      fetchPayload(FILES.reset)
    ]);

    const adminSeeds = payloads[0].data.map(normalizeAdminSeed);
    const dosenSeeds = payloads[1].data.map(normalizeDosenSeed);
    const mahasiswaSeeds = buildMahasiswaSeeds(payloads[2], payloads[3]);
    const prestasiSeeds = payloads[4].data.map(normalizePrestasiSeed);
    const resetSeeds = Array.isArray(payloads[5].data)
      ? payloads[5].data.map(normalizeResetSeed)
      : [];

    const arsipSeeds = {
      riwayatNonTarget: Array.isArray(payloads[4].riwayatNonTarget)
        ? payloads[4].riwayatNonTarget.map(normalizeArsip)
        : [],
      pengajuanSumberLain: Array.isArray(payloads[4].pengajuanSumberLain)
        ? payloads[4].pengajuanSumberLain.map(normalizeArsip)
        : [],
      konflikRelasi: Array.isArray(payloads[4].konflikRelasi)
        ? payloads[4].konflikRelasi
        : [],
      konflikStatus: Array.isArray(payloads[4].konflikStatus)
        ? payloads[4].konflikStatus
        : []
    };

    const existingArsip = getArsip();

    const arsip = {
      riwayatNonTarget: repairArsipBukti(
        Array.isArray(existingArsip.riwayatNonTarget)
          ? existingArsip.riwayatNonTarget
          : arsipSeeds.riwayatNonTarget,
        arsipSeeds.riwayatNonTarget
      ),
      pengajuanSumberLain: repairArsipBukti(
        Array.isArray(existingArsip.pengajuanSumberLain)
          ? existingArsip.pengajuanSumberLain
          : arsipSeeds.pengajuanSumberLain,
        arsipSeeds.pengajuanSumberLain
      ),
      konflikRelasi: Array.isArray(existingArsip.konflikRelasi)
        ? existingArsip.konflikRelasi
        : arsipSeeds.konflikRelasi,
      konflikStatus: Array.isArray(existingArsip.konflikStatus)
        ? existingArsip.konflikStatus
        : arsipSeeds.konflikStatus
    };

    adminAccounts = mergeCollection(
      readArray(KEYS.admin),
      adminSeeds,
      function (item) {
        return accountKeyFor("admin", item);
      }
    );

    dosenAccounts = mergeCollection(
      readArray(KEYS.dosen),
      dosenSeeds,
      function (item) {
        return accountKeyFor("dosen", item);
      }
    );

    mahasiswaAccounts = mergeCollection(
      readArray(KEYS.mahasiswa),
      mahasiswaSeeds,
      function (item) {
        return accountKeyFor("mahasiswa", item);
      }
    );

    prestasi = repairSharedBukti(
      mergeCollection(
        readArray(KEYS.prestasi),
        prestasiSeeds,
        function (item) {
          return normalize(item.id) ||
            normalize(item.nim) + "|" + normalize(item.namaKompetisi);
        }
      ),
      prestasiSeeds
    );

    resetRequests = mergeCollection(
      readArray(KEYS.reset),
      resetSeeds,
      function (item) {
        return normalize(item.id) ||
          normalize(item.role) + "|" + normalize(item.identifier);
      }
    );

    prestasiPayload = payloads[4];

    write(KEYS.admin, adminAccounts);
    write(KEYS.dosen, dosenAccounts);
    write(KEYS.mahasiswa, mahasiswaAccounts);
    write(KEYS.arsip, arsip);
    write(KEYS.reset, resetRequests);

  } else if (needsStatusSync) {
    prestasiPayload = await fetchPayload(FILES.prestasi);
  }

  if (needsStatusSync) {
    if (!needsSeed && prestasiPayload) {
      const prestasiSeeds = Array.isArray(prestasiPayload.data)
        ? prestasiPayload.data.map(normalizePrestasiSeed)
        : [];

      prestasi = repairSharedBukti(
        mergeCollection(
          prestasi,
          prestasiSeeds,
          function (item) {
            return normalize(item.id) ||
              normalize(item.nim) + "|" + normalize(item.namaKompetisi);
          }
        ),
        prestasiSeeds
      );
    }

    prestasi = syncSourcePendingStatuses(
      prestasi,
      prestasiPayload && prestasiPayload.data
    );
  }

  if (needsSeed || needsStatusSync) {
    write(KEYS.prestasi, prestasi);
  }

  if (needsSeed) {
    write(KEYS.meta, {
      seedVersion: SEED_VERSION,
      statusSyncVersion: STATUS_SYNC_VERSION,
      seededAt: new Date().toISOString(),
      counts: {
        admin: adminAccounts.length,
        dosen: dosenAccounts.length,
        mahasiswa: mahasiswaAccounts.length,
        prestasi: prestasi.length,
        reset: resetRequests.length
      },
      sources: Object.values(FILES)
    });
  } else if (needsStatusSync) {
    write(KEYS.meta, Object.assign({}, isRecord(meta) ? meta : {}, {
      statusSyncVersion: STATUS_SYNC_VERSION
    }));
  }
}

const ready = initializeStore()
  .then(function () {
    applyDefaultPasswords();
    syncVerifiedPrestasiCounts();
  })
  .catch(function (error) {
    initializationError = error;
    console.error("SIPRESMA data initialization failed:", error);
  });

await ready;

export function whenReady() {
  return ready;
}

export function getInitializationError() {
  return initializationError;
}

export function getAdminAccounts() {
  return readArray(KEYS.admin);
}

export function getDosenAccounts() {
  return readArray(KEYS.dosen);
}

export function getMahasiswaAccounts() {
  return readArray(KEYS.mahasiswa);
}

export function getPrestasi() {
  return uniquePrestasiRecords(readArray(KEYS.prestasi));
}

export function getArsip() {
  const value = read(KEYS.arsip, {});
  return isRecord(value) ? value : {};
}

export function getPrestasiById(id) {
  const key = normalize(id);
  return getPrestasi().find(function (item) {
    return normalize(item.id) === key;
  }) || null;
}

export function findAdmin(identifier) {
  const key = normalize(identifier);
  return getAdminAccounts().find(function (item) {
    return normalize(item.username).toLowerCase() === key.toLowerCase();
  }) || null;
}

export function findDosen(identifier) {
  const key = normalize(identifier);
  return getDosenAccounts().find(function (item) {
    return normalize(item.nidn || item.username) === key;
  }) || null;
}

export function findMahasiswa(identifier) {
  const key = normalize(identifier);
  return getMahasiswaAccounts().find(function (item) {
    return normalize(item.nim || item.username) === key;
  }) || null;
}

export function authenticate(role, identifier, password) {
  let account = null;

  if (role === "admin") account = findAdmin(identifier);
  else if (role === "dosen") account = findDosen(identifier);
  else account = findMahasiswa(identifier);

  if (!account) {
    return { ok: false, message: "Akun tidak ditemukan atau kredensial tidak sesuai." };
  }

  const expectedRole = role === "admin"
    ? "Administrator Sistem"
    : role === "dosen"
      ? "Dosen"
      : "Mahasiswa";

  if (!isRole(account.role, expectedRole)) {
    return { ok: false, message: "Akun tidak ditemukan atau kredensial tidak sesuai." };
  }

  if (!isActiveStatus(account.statusAkun)) {
    return { ok: false, message: "Akun tidak aktif. Hubungi Administrator." };
  }

  const fallbackPassword = defaultPasswordFor(role, account);
  const storedPassword = normalize(account.password) || fallbackPassword;

  if (!storedPassword || String(password) !== storedPassword) {
    return { ok: false, message: "Akun tidak ditemukan atau kredensial tidak sesuai." };
  }

  return { ok: true, account: account, message: "" };
}

export function getSession(role) {
  const key = role === "admin"
    ? KEYS.adminSession
    : role === "dosen"
      ? KEYS.dosenSession
      : KEYS.mahasiswaSession;

  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return isRecord(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

export function saveSession(role, account) {
  if (!isRecord(account)) return;

  const key = role === "admin"
    ? KEYS.adminSession
    : role === "dosen"
      ? KEYS.dosenSession
      : KEYS.mahasiswaSession;

  const session = Object.assign({}, account, {
    loginAt: new Date().toISOString()
  });

  delete session.password;
  delete session.bukti;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(session));
  } catch (error) {
    return;
  }
}

export function clearSession(role) {
  const key = role === "admin"
    ? KEYS.adminSession
    : role === "dosen"
      ? KEYS.dosenSession
      : KEYS.mahasiswaSession;

  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    return;
  }
}

export function resolveMahasiswa() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("npm") || params.get("nim");
  const session = getSession("mahasiswa");
  const sessionNim = session ? normalize(session.nim) : "";
  return (requested && findMahasiswa(requested)) ||
    (sessionNim && findMahasiswa(sessionNim)) ||
    getMahasiswaAccounts()[0] ||
    null;
}

export function resolveDosen() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("nidn");
  const session = getSession("dosen");
  const sessionNidn = session ? normalize(session.nidn) : "";
  return (requested && findDosen(requested)) ||
    (sessionNidn && findDosen(sessionNidn)) ||
    getDosenAccounts()[0] ||
    null;
}

export function getMahasiswaPrestasi(nim) {
  const key = normalize(nim);
  if (!key) return [];

  const main = getPrestasi().filter(function (item) {
    return normalize(item.nim) === key;
  });
  const arsip = getArsip();
  const history = Array.isArray(arsip.riwayatNonTarget) ? arsip.riwayatNonTarget : [];

  return uniquePrestasiRecords(main.concat(history.filter(function (item) {
    return normalize(item.nim) === key;
  })));
}

export function getStatusView(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "Terverifikasi") {
    return {
      status: normalized,
      key: "verified",
      label: "Diverifikasi",
      adminLabel: "diverifikasi",
      dosenValue: "diverifikasi"
    };
  }

  if (normalized === "Perlu Perbaikan") {
    return {
      status: normalized,
      key: "revision",
      label: "Perlu Perbaikan",
      adminLabel: "Perlu Perbaikan",
      dosenValue: "perlu-perbaikan"
    };
  }

  if (normalized === "Ditolak") {
    return {
      status: normalized,
      key: "rejected",
      label: "Ditolak",
      adminLabel: "Ditolak",
      dosenValue: "ditolak"
    };
  }

  return {
    status: "Menunggu Verifikasi",
    key: "pending",
    label: "Menunggu Verifikasi",
    adminLabel: "Menunggu Verifikasi",
    dosenValue: "diajukan"
  };
}

export function getCounts(items) {
  const counts = {
    total: 0,
    verified: 0,
    pending: 0,
    revision: 0,
    rejected: 0
  };

  uniquePrestasiRecords(items).forEach(function (item) {
    const view = getStatusView(item.status);
    counts.total += 1;
    counts[view.key] += 1;
  });

  return counts;
}

export function getPrestasiCounts() {
  return getCounts(getPrestasi());
}

export function getMahasiswaPrestasiCounts(nim) {
  return getCounts(getMahasiswaPrestasi(nim));
}

export function getClassificationCounts() {
  const counts = { total: 0, Tinggi: 0, Sedang: 0, Rendah: 0 };

  getMahasiswaAccounts().forEach(function (student) {
    const category = normalize(student.klasifikasi || student.category) || "Rendah";
    counts.total += 1;
    counts[category] = (counts[category] || 0) + 1;
  });

  return counts;
}

export function getLevelCounts() {
  const counts = {
    Internasional: 0,
    Nasional: 0,
    Provinsi: 0,
    "Kabupaten/Kota": 0,
    Kampus: 0
  };

  getPrestasi().forEach(function (item) {
    const level = normalize(item.tingkat).toLowerCase();
    if (level.includes("internasional")) counts.Internasional += 1;
    else if (level.includes("nasional")) counts.Nasional += 1;
    else if (level.includes("provinsi")) counts.Provinsi += 1;
    else if (level.includes("kota") || level.includes("kabupaten")) counts["Kabupaten/Kota"] += 1;
    else counts.Kampus += 1;
  });

  return counts;
}

export function savePrestasiStatus(id, status, note) {
  const records = getPrestasi();
  const index = records.findIndex(function (item) {
    return normalize(item.id) === normalize(id);
  });

  if (index === -1) return null;

  const view = getStatusView(status);

  records[index] = Object.assign({}, records[index], {
    status: view.status,
    statusSumber: view.status === "Terverifikasi" ? "diverifikasi" : view.status,
    keteranganVerifikasi: normalize(note) || records[index].keteranganVerifikasi || "",
    diverifikasiPada: new Date().toISOString()
  });

  write(KEYS.prestasi, records);
  syncVerifiedPrestasiCounts();
  return records[index];
}

export function addPrestasi(payload) {
  const records = getPrestasi();
  const maxId = records.reduce(function (maximum, item) {
    const match = normalize(item.id).match(/(\d+)$/);
    return match ? Math.max(maximum, Number(match[1])) : maximum;
  }, 0);
  const id = normalize(payload.id) || "PRS-" + String(maxId + 1).padStart(3, "0");
  const student = findMahasiswa(payload.nim);
  const view = getStatusView(payload.status || "Menunggu Verifikasi");

  const record = Object.assign({}, payload, {
    id: id,
    namaMahasiswa: normalize(payload.namaMahasiswa) || normalize(student && (student.name || student.nama)),
    nim: normalize(payload.nim),
    namaKompetisi: normalize(payload.namaKompetisi || payload.namaPrestasi),
    namaPrestasi: normalize(payload.namaPrestasi || payload.namaKompetisi),
    status: view.status,
    statusSumber: view.status === "Terverifikasi" ? "diverifikasi" : view.status,
    tanggalPengajuan: payload.tanggalPengajuan || new Date().toISOString().slice(0, 10)
  });

  records.push(record);
  write(KEYS.prestasi, records);
  syncVerifiedPrestasiCounts();
  return record;
}

export function saveMahasiswa(payload, originalNim) {
  const accounts = getMahasiswaAccounts();
  const oldNim = normalize(originalNim || payload.nim);
  const index = accounts.findIndex(function (item) {
    return normalize(item.nim) === oldNim;
  });
  const nim = normalize(payload.nim);
  const year = normalize(payload.year || payload.angkatan);
  const name = normalize(payload.name || payload.nama);
  const category = normalize(payload.category || payload.klasifikasi) || "Rendah";
  const base = index === -1 ? {} : accounts[index];
  const oldIdentifier = normalize(base.nim || base.username);
  const basePassword = normalize(base.password);
  const password = normalize(payload.password) ||
    (basePassword && basePassword !== oldIdentifier ? basePassword : nim);

  const student = Object.assign({}, base, payload, {
    id: payload.id || base.id || "MHS-" + nim,
    nim: nim,
    username: normalize(payload.username || base.username || nim),
    name: name,
    nama: name,
    year: year,
    angkatan: year ? Number(year) : base.angkatan,
    email: normalize(payload.email || base.email),
    programStudi: normalize(payload.programStudi || base.programStudi) || "Teknik Informatika",
    fakultas: normalize(payload.fakultas || base.fakultas) || "Fakultas Teknologi Informasi",
    password: password,
    role: "Mahasiswa",
    category: category,
    klasifikasi: normalize(payload.klasifikasi || base.klasifikasi || category),
    status: normalize(payload.status || base.status) || "Aktif",
    statusAkun: normalize(payload.statusAkun || base.statusAkun) || "Aktif",
    hasAcademicData: payload.hasAcademicData === true || base.hasAcademicData === true
  });

  if (student.ipk != null) student.ipk = Number(student.ipk);

  if (index === -1) accounts.push(student);
  else accounts[index] = student;

  if (oldNim && oldNim !== nim) {
    const deduplicated = accounts.filter(function (item, itemIndex) {
      return itemIndex === index || normalize(item.nim) !== nim;
    });
    write(KEYS.mahasiswa, deduplicated);
  } else {
    write(KEYS.mahasiswa, accounts);
  }

  return student;
}

export function deleteMahasiswa(nim) {
  const key = normalize(nim);
  const accounts = getMahasiswaAccounts().filter(function (item) {
    return normalize(item.nim) !== key;
  });
  write(KEYS.mahasiswa, accounts);
}

export function saveDosen(payload, originalNidn) {
  const accounts = getDosenAccounts();
  const oldNidn = normalize(originalNidn || payload.nidn);
  const index = accounts.findIndex(function (item) {
    return normalize(item.nidn || item.username) === oldNidn;
  });
  const nidn = normalize(payload.nidn || payload.username);
  const name = normalize(payload.name || payload.nama);
  const base = index === -1 ? {} : accounts[index];
  const oldIdentifier = normalize(base.nidn || base.username);
  const basePassword = normalize(base.password);
  const password = normalize(payload.password) ||
    (basePassword && basePassword !== oldIdentifier ? basePassword : nidn);

  const lecturer = Object.assign({}, base, payload, {
    id: payload.id || base.id || "DOS-" + nidn,
    nidn: nidn,
    username: normalize(payload.username || base.username || nidn),
    nama: name,
    name: name,
    email: normalize(payload.email || base.email),
    role: "Dosen",
    jabatan: normalize(payload.jabatan || base.jabatan),
    programStudi: normalize(payload.programStudi || base.programStudi) || "Teknik Informatika",
    fakultas: normalize(payload.fakultas || base.fakultas) || "Fakultas Teknologi Informasi",
    statusAkun: normalize(payload.statusAkun || payload.status || base.statusAkun) || "Aktif",
    password: password
  });

  if (index === -1) accounts.push(lecturer);
  else accounts[index] = lecturer;

  if (oldNidn && oldNidn !== nidn) {
    const deduplicated = accounts.filter(function (item, itemIndex) {
      return itemIndex === index || normalize(item.nidn) !== nidn;
    });
    write(KEYS.dosen, deduplicated);
  } else {
    write(KEYS.dosen, accounts);
  }

  return lecturer;
}

export function deleteDosen(nidn) {
  const key = normalize(nidn);
  const accounts = getDosenAccounts().filter(function (item) {
    return normalize(item.nidn || item.username) !== key;
  });
  write(KEYS.dosen, accounts);
}

export function changePassword(role, identifier, oldPassword, newPassword) {
  const key = normalize(identifier);
  const accounts = role === "admin"
    ? getAdminAccounts()
    : role === "dosen"
      ? getDosenAccounts()
      : getMahasiswaAccounts();
  const index = accounts.findIndex(function (item) {
    return role === "admin"
      ? normalize(item.username).toLowerCase() === key.toLowerCase()
      : role === "dosen"
        ? normalize(item.nidn || item.username) === key
        : normalize(item.nim || item.username) === key;
  });

  if (index === -1) return { ok: false, message: "Akun tidak ditemukan." };

  const stored = normalize(accounts[index].password) ||
    defaultPasswordFor(role, accounts[index]) ||
    key;
  if (String(oldPassword) !== stored) {
    return { ok: false, message: "Password lama tidak sesuai." };
  }

  if (String(newPassword).length < 6) {
    return { ok: false, message: "Password baru minimal 6 karakter." };
  }

  accounts[index] = Object.assign({}, accounts[index], {
    password: String(newPassword),
    passwordChangedAt: new Date().toISOString()
  });

  if (role === "admin") write(KEYS.admin, accounts);
  else if (role === "dosen") write(KEYS.dosen, accounts);
  else write(KEYS.mahasiswa, accounts);

  return { ok: true, message: "Password berhasil diperbarui." };
}

export function getResetRequests() {
  return readArray(KEYS.reset);
}

export function getResetRequestCounts() {
  const requests = getResetRequests();
  const counts = { total: requests.length, Menunggu: 0, Diproses: 0, Selesai: 0, Ditolak: 0 };

  requests.forEach(function (item) {
    const status = normalize(item.status) || "Menunggu";
    if (counts[status] == null) counts[status] = 0;
    counts[status] += 1;
  });

  return counts;
}

export function saveResetRequestStatus(id, status, note) {
  const requests = getResetRequests();
  const index = requests.findIndex(function (item) {
    return normalize(item.id) === normalize(id);
  });

  if (index === -1) return { ok: false, message: "Permintaan reset tidak ditemukan." };

  const record = Object.assign({}, requests[index], {
    status: normalize(status) || requests[index].status,
    statusChangedAt: new Date().toISOString()
  });

  if (note != null) record.catatan = normalize(note);

  requests[index] = record;
  write(KEYS.reset, requests);

  return { ok: true, request: record };
}

export function resetAccountPassword(role, identifier) {
  const key = normalize(identifier);
  const isDosen = normalize(role).toLowerCase().indexOf("dosen") !== -1;
  const accounts = isDosen ? getDosenAccounts() : getMahasiswaAccounts();
  const index = accounts.findIndex(function (item) {
    return isDosen
      ? normalize(item.nidn || item.username) === key
      : normalize(item.nim || item.username) === key;
  });

  if (index === -1) return { ok: false, message: "Akun tidak ditemukan." };

  const password = defaultPasswordFor(isDosen ? "dosen" : "mahasiswa", accounts[index]) || key;
  accounts[index] = Object.assign({}, accounts[index], {
    password: password,
    passwordChangedAt: new Date().toISOString()
  });

  write(isDosen ? KEYS.dosen : KEYS.mahasiswa, accounts);

  return { ok: true, password: password };
}

export function getLatestResetRequest(role, identifier) {
  const roleLabel = normalize(role).toLowerCase().indexOf("dosen") !== -1 ? "Dosen" : "Mahasiswa";
  const key = normalize(identifier);
  const matches = getResetRequests().filter(function (item) {
    return normalize(item.role) === roleLabel && normalize(item.identifier) === key;
  });
  return matches.length ? matches[matches.length - 1] : null;
}

export function submitResetRequest(role, identifier) {
  const isDosen = normalize(role).toLowerCase().indexOf("dosen") !== -1;
  const roleLabel = isDosen ? "Dosen" : "Mahasiswa";
  const idLabel = isDosen ? "NIDN" : "NPM";
  const key = normalize(identifier);

  if (!key) return { ok: false, message: idLabel + " wajib diisi." };

  const account = isDosen ? findDosen(key) : findMahasiswa(key);
  if (!account) {
    return { ok: false, message: idLabel + " tidak terdaftar pada basis data resmi." };
  }

  const requests = getResetRequests();
  const existing = requests.find(function (item) {
    return normalize(item.role) === roleLabel && normalize(item.identifier) === key;
  });

  if (existing) return { ok: true, request: existing, reused: true };

  let max = 0;
  requests.forEach(function (item) {
    const match = /^RST-(\d+)$/.exec(normalize(item.id));
    if (match) max = Math.max(max, Number(match[1]));
  });

  const now = new Date();
  const request = {
    id: "RST-" + String(max + 1).padStart(3, "0"),
    role: roleLabel,
    identifier: key,
    nama: normalize(account.nama || account.name),
    email: normalize(account.email),
    tanggalPengajuan: formatResetDate(now),
    waktuPengajuan: formatResetTime(now),
    status: "Menunggu",
    catatan: "",
    statusChangedAt: null,
    createdAt: now.toISOString()
  };

  requests.push(request);
  write(KEYS.reset, requests);

  return { ok: true, request: request, reused: false };
}
