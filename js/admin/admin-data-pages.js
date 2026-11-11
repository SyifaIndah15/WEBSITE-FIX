import {
  KEYS,
  getPrestasi,
  getMahasiswaAccounts,
  getPrestasiCounts,
  getClassificationCounts,
  savePrestasiStatus,
  getStatusView
} from "../core/sipresma-data.js";

const LEVEL_KEYS = [
  { key: "international", label: "Internasional", className: "international" },
  { key: "national", label: "Nasional", className: "national" },
  { key: "province", label: "Provinsi", className: "province" },
  { key: "city", label: "Kabupaten/Kota", className: "city" },
  { key: "campus", label: "Kampus", className: "campus" }
];

function normalize(value) {
  return String(value == null ? "" : value).trim();
}

function escapeHtml(value) {
  return normalize(value).replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character];
  });
}

function safeHref(value) {
  const href = normalize(value);
  if (!href) return "";
  if (/^(javascript|data|vbscript):/i.test(href)) return "";
  return href;
}

function certificateHref(item) {
  const uploaded = safeHref(item && item.bukti);
  if (uploaded) return uploaded;

  const id = normalize(item && item.id).toLowerCase();
  if (!/^prs-\d{3}$/.test(id)) return "";
  return "../../assets/dokumen/sertifikat-dummy-" + id + ".pdf";
}

function verificationStatus(item) {
  const statusView = getStatusView(item.status);
  const sourceStatus = normalize(item.statusSumber);

  if (statusView.key === "verified" && sourceStatus && getStatusView(sourceStatus).key === "pending") {
    return "Menunggu Verifikasi";
  }

  return item.status;
}

function levelKey(value) {
  const level = normalize(value).toLowerCase();
  if (level.includes("internasional")) return "international";
  if (level.includes("nasional")) return "national";
  if (level.includes("provinsi")) return "province";
  if (level.includes("kota") || level.includes("kabupaten")) return "city";
  return "campus";
}

function studentYear(student) {
  return normalize(student && (student.year || student.angkatan));
}

function studentName(item) {
  return normalize(item.namaMahasiswa || item.name || item.nama);
}

function proofIcon() {
  return "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z\"/><path d=\"M14 3v5h5\"/><path d=\"M9 13h6M9 17h6\"/></svg>";
}

function proofCell(item) {
  const href = certificateHref(item);
  const name = escapeHtml(studentName(item));

  if (!href) {
    return "<span class=\"proof-link proof-link--empty\" aria-label=\"Bukti sertifikat tidak tersedia\">" + proofIcon() + "</span>";
  }

  return "<a class=\"proof-link\" href=\"" + escapeHtml(href) + "\" target=\"_blank\" rel=\"noopener\" aria-label=\"Lihat bukti sertifikat " + name + "\">" + proofIcon() + "</a>";
}

function initializeDashboard() {
  const students = getMahasiswaAccounts();
  const prestasi = getPrestasi();
  const counts = getPrestasiCounts();
  const categories = getClassificationCounts();

  const totalStudent = document.querySelector(".stat-card--total .stat-value");
  const totalSubmission = document.querySelector(".stat-card--submissions .stat-value");
  const pendingSubmission = document.querySelector(".stat-card--pending .stat-value");
  const validatedNote = document.querySelector(".stat-card--submissions .stat-note span");
  const categoryNumbers = document.querySelectorAll(".stat-card--categories .category-number");
  const countPill = document.querySelector(".data-count-pill");

  if (totalStudent) totalStudent.textContent = String(students.length);
  if (totalSubmission) totalSubmission.textContent = String(counts.total);
  if (pendingSubmission) pendingSubmission.textContent = String(counts.pending);
  if (validatedNote) validatedNote.textContent = counts.verified + " Berkas Tervalidasi";
  if (countPill) countPill.textContent = "Total " + counts.total + " Berkas Masuk";

  if (categoryNumbers.length >= 3) {
    categoryNumbers[0].textContent = String(categories.Tinggi || 0);
    categoryNumbers[1].textContent = String(categories.Sedang || 0);
    categoryNumbers[2].textContent = String(categories.Rendah || 0);
  }

  const studentsByNim = new Map();
  students.forEach(function (student) {
    const nim = normalize(student.nim);
    if (nim) studentsByNim.set(nim, student);
  });

  const emptyLevel = function () {
    return { international: 0, national: 0, province: 0, city: 0, campus: 0 };
  };

  const chartCounts = { all: emptyLevel() };

  prestasi.forEach(function (item) {
    if (getStatusView(item.status).key !== "verified") return;

    const student = studentsByNim.get(normalize(item.nim));
    const year = studentYear(student);
    if (!student || !year) return;

    const key = levelKey(item.tingkat);
    chartCounts.all[key] += 1;

    if (!chartCounts[year]) chartCounts[year] = emptyLevel();
    chartCounts[year][key] += 1;
  });

  students.forEach(function (student) {
    const year = studentYear(student);
    if (year && !chartCounts[year]) chartCounts[year] = emptyLevel();
  });

  const chartNumbers = document.querySelectorAll(".chart-number");
  chartNumbers.forEach(function (element) {
    const modeClass = Array.from(element.classList).find(function (className) {
      return className.startsWith("chart-number--");
    });
    if (!modeClass) return;
    const mode = modeClass.replace("chart-number--", "");
    const values = chartCounts[mode] || emptyLevel();
    const level = LEVEL_KEYS.find(function (entry) {
      return element.closest(".chart-card") &&
        element.closest(".chart-card").querySelector(".chart-bar--" + entry.className);
    });
    if (level) element.textContent = String(values[level.key] || 0);
  });

  const chartGrid = document.querySelector(".chart-grid");

  function updateBars() {
    if (!chartGrid) return;
    const selected = document.querySelector('input[name="angkatan"]:checked');
    const mode = selected ? selected.id.replace("angkatan-", "") : "all";
    const values = chartCounts[mode] || emptyLevel();
    const maxValue = Math.max(1, values.international, values.national, values.province, values.city, values.campus);
    const denominator = Math.max(30, maxValue);

    LEVEL_KEYS.forEach(function (entry) {
      const percentage = Math.max(3.333, (values[entry.key] / denominator) * 100);
      chartGrid.style.setProperty("--bar-" + entry.className, percentage.toFixed(3) + "%");
    });
  }

  updateBars();
  document.querySelectorAll('input[name="angkatan"]').forEach(function (input) {
    input.addEventListener("change", updateBars);
  });

  const tbody = document.querySelector(".submission-table tbody");
  if (!tbody) return;

  const recent = prestasi.slice().sort(function (left, right) {
    return normalize(right.tanggalPengajuan).localeCompare(normalize(left.tanggalPengajuan)) ||
      normalize(right.id).localeCompare(normalize(left.id));
  }).slice(0, 18);

  tbody.innerHTML = recent.map(function (item) {
    const view = getStatusView(item.status);
    const statusClass = view.key === "verified" ? "submission-status--verified" : "submission-status--pending";
    const statusLabel = view.key === "verified" ? "diverifikasi" : view.adminLabel;

    return "<tr>" +
      "<td><div class=\"student-name\">" + escapeHtml(studentName(item)) + "</div><div class=\"student-npm\">NPM: " + escapeHtml(item.nim) + "</div></td>" +
      "<td><div class=\"competition-title\">" + escapeHtml(item.namaKompetisi || item.namaPrestasi) + "</div><div class=\"competition-type\">" + escapeHtml(item.jenis) + "</div></td>" +
      "<td><div class=\"level-name\">" + escapeHtml(item.peringkat) + "</div><div class=\"level-type\">" + escapeHtml(item.tingkat) + "</div></td>" +
      "<td class=\"year-cell\">" + escapeHtml(item.tahun) + "</td>" +
      "<td class=\"status-cell\"><span class=\"submission-status " + statusClass + "\">" + escapeHtml(statusLabel) + "</span></td>" +
      "<td class=\"proof-cell\">" + proofCell(item) + "</td>" +
      "</tr>";
  }).join("");
}

function initializeClassification() {
  const summaryValues = document.querySelectorAll(".hk-summary-value");
  const tbody = document.querySelector(".hk-table tbody");
  if (!tbody) return;

  const search = document.querySelector(".hk-search input");
  const footer = document.querySelector(".hk-table-bottom span");
  let ordered = [];

  function updateSummary() {
    const categories = getClassificationCounts();

    if (summaryValues.length >= 3) {
      summaryValues[0].textContent = (categories.Tinggi || 0) + " Mahasiswa";
      summaryValues[1].textContent = (categories.Sedang || 0) + " Mahasiswa";
      summaryValues[2].textContent = (categories.Rendah || 0) + " Mahasiswa";
    }
  }

  function orderedStudents() {
    return getMahasiswaAccounts().slice().sort(function (left, right) {
      const leftName = normalize(left.name || left.nama);
      const rightName = normalize(right.name || right.nama);
      const byName = leftName.localeCompare(rightName, "id", { sensitivity: "base" });
      if (byName !== 0) return byName;
      return normalize(left.nim).localeCompare(normalize(right.nim));
    });
  }

  function applyFilter() {
    const selected = document.querySelector('input[name="hk-kategori"]:checked');
    const category = selected ? selected.id.replace("hk-kategori-", "") : "all";
    const query = normalize(search && search.value).toLowerCase();
    let visible = 0;

    tbody.querySelectorAll("tr").forEach(function (row) {
      const rowCategory = normalize(row.dataset.category).toLowerCase();
      const matchesCategory = category === "all" || rowCategory === category;
      const matchesSearch = !query || normalize(row.textContent).toLowerCase().includes(query);
      row.hidden = !(matchesCategory && matchesSearch);

      if (row.hidden) return;

      visible += 1;
      row.dataset.number = String(visible);
      const rowNumber = row.querySelector(".row-index");
      if (rowNumber) rowNumber.textContent = visible + ".";
    });

    if (footer) footer.textContent = "Menampilkan " + visible + " dari " + ordered.length + " mahasiswa";
  }

  function renderRows() {
    ordered = orderedStudents();
    updateSummary();

    tbody.innerHTML = ordered.map(function (student, index) {
      const category = normalize(student.klasifikasi || student.category) || "Rendah";
      const categoryClass = category.toLowerCase() === "tinggi"
        ? "high"
        : category.toLowerCase() === "sedang"
          ? "medium"
          : "low";
      const ipk = student.ipk == null ? "-" : Number(student.ipk).toFixed(2);
      const number = index + 1;

      return "<tr data-category=\"" + escapeHtml(category) + "\" data-number=\"" + number + "\">" +
        "<td><span class=\"hk-student-name\">" + escapeHtml(student.name || student.nama) + "</span><span class=\"hk-student-nim\"><span class=\"row-index\" aria-hidden=\"true\">" + number + ".</span> NIM: " + escapeHtml(student.nim) + "</span></td>" +
        "<td class=\"hk-ipk\">" + escapeHtml(ipk) + "</td>" +
        "<td><span class=\"hk-category hk-category--" + categoryClass + "\">" + escapeHtml(category) + "</span></td>" +
        "</tr>";
    }).join("");

    applyFilter();
  }

  function handleDataChange(event) {
    const key = event.type === "storage"
      ? event.key
      : event.detail && event.detail.key;

    if (key && key !== KEYS.mahasiswa) return;
    renderRows();
  }

  document.querySelectorAll('input[name="hk-kategori"]').forEach(function (input) {
    input.addEventListener("change", applyFilter);
  });

  if (search) search.addEventListener("input", applyFilter);
  window.addEventListener("storage", handleDataChange);
  window.addEventListener("sipresma:data-changed", handleDataChange);

  renderRows();
}

function verificationStatusMarkup(status) {
  const view = getStatusView(status);
  let icon = "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7.5V12l3 1.8\"/>";

  if (view.key === "verified") {
    icon = "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m8.4 12.2 2.4 2.4 4.8-5\"/>";
  } else if (view.key === "revision") {
    icon = "<path d=\"M12 8v5\"/><path d=\"M12 16.5h.01\"/><circle cx=\"12\" cy=\"12\" r=\"9\"/>";
  } else if (view.key === "rejected") {
    icon = "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m9 9 6 6M15 9l-6 6\"/>";
  }

  return "<span class=\"vs-status vs-status--" + view.key + "\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">" + icon + "</svg><span>" + escapeHtml(view.label) + "</span></span>";
}

function verificationDecisionMarkup(status) {
  const view = getStatusView(status);
  let icon = "<path d=\"m5 12.5 4.2 4.2L19 6.8\"/>";
  let label = "Disetujui";

  if (view.key === "revision") {
    icon = "<path d=\"M4 12a8 8 0 1 0 2.34-5.66\"/><path d=\"M4 4v5h5\"/>";
    label = "Perlu Perbaikan";
  } else if (view.key === "rejected") {
    icon = "<path d=\"m6 6 12 12M18 6 6 18\"/>";
    label = "Ditolak";
  }

  return "<span class=\"vs-decision vs-decision--" + (view.key === "verified" ? "approved" : view.key) + "\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">" + icon + "</svg><span>" + label + "</span></span>";
}

function verificationDocumentMarkup(item) {
  const href = certificateHref(item);
  const icon = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z\"/><path d=\"M14 3v5h5\"/><path d=\"M9 13h6M9 17h6\"/></svg>";

  if (!href) return "<span class=\"vs-document-empty\">Tidak tersedia</span>";
  return "<a class=\"vs-document-link\" href=\"" + escapeHtml(href) + "\" target=\"_blank\" rel=\"noopener\">" + icon + "<span>Lihat Sertifikat</span></a>";
}

function initializeVerification() {
  const tbody = document.querySelector(".vs-table tbody");
  if (!tbody) return;

  let selectedId = "";

  const pendingSummary = document.querySelector(".vs-pending-summary span:last-child");
  const pendingTab = document.querySelector('.vs-tab[for="vs-tab-pending"]');
  const historyTab = document.querySelector('.vs-tab[for="vs-tab-history"]');
  const pendingFooter = document.querySelector(".vs-table-footer--pending");
  const historyFooter = document.querySelector(".vs-table-footer--history");
  const search = document.querySelector(".vs-search input");

  function applySearch() {
    const query = normalize(search && search.value).toLowerCase();
    let visiblePending = 0;
    let visibleHistory = 0;

    tbody.querySelectorAll(".vs-row").forEach(function (row) {
      const matches = !query || normalize(row.dataset.search).toLowerCase().includes(query);
      row.hidden = !matches;
      if (!matches) return;
      if (row.classList.contains("vs-row--pending")) visiblePending += 1;
      visibleHistory += 1;
    });

    if (pendingFooter) pendingFooter.textContent = "Menampilkan " + visiblePending + " pengajuan yang menunggu verifikasi";
    if (historyFooter) {
      const totalHistory = tbody.querySelectorAll(".vs-row").length;
      historyFooter.textContent = "Menampilkan " + visibleHistory + " dari " + totalHistory + " pengajuan";
    }
  }

  function compareStudentName(left, right) {
    return normalize(studentName(left)).localeCompare(normalize(studentName(right)), "id", { sensitivity: "base" }) ||
      normalize(left.nim).localeCompare(normalize(right.nim)) ||
      normalize(left.id).localeCompare(normalize(right.id));
  }

  function render() {
    const records = getPrestasi();
    const sorted = records.slice().sort(compareStudentName);
    const pending = sorted.filter(function (item) {
      return getStatusView(verificationStatus(item)).key === "pending";
    });

    tbody.innerHTML = sorted.map(function (item) {
      const status = verificationStatus(item);
      const isPending = getStatusView(status).key === "pending";
      const rowClass = isPending ? "vs-row vs-row--pending" : "vs-row vs-row--history";
      const decision = isPending
        ? "<div class=\"vs-actions\"><label class=\"vs-action vs-action--approve\" for=\"vs-modal-approve\" data-id=\"" + escapeHtml(item.id) + "\">Setujui</label><label class=\"vs-action vs-action--revision\" for=\"vs-modal-revision\" data-id=\"" + escapeHtml(item.id) + "\">Minta Perbaikan</label><label class=\"vs-action vs-action--reject\" for=\"vs-modal-reject\" data-id=\"" + escapeHtml(item.id) + "\">Tolak</label></div>"
        : verificationDecisionMarkup(status);
      const searchText = [studentName(item), item.nim, item.namaKompetisi || item.namaPrestasi].join(" ");

      return "<tr class=\"" + rowClass + "\" data-id=\"" + escapeHtml(item.id) + "\" data-search=\"" + escapeHtml(searchText) + "\">" +
        "<td><span class=\"vs-student-name\">" + escapeHtml(studentName(item)) + "</span><span class=\"vs-student-npm\">NPM: " + escapeHtml(item.nim) + "</span></td>" +
        "<td><span class=\"vs-competition-name\">" + escapeHtml(item.namaKompetisi || item.namaPrestasi) + "</span><span class=\"vs-competition-org\">" + escapeHtml(item.penyelenggara) + "</span><span class=\"vs-competition-date\">Tgl Pengajuan: " + escapeHtml(item.tanggalPengajuan || "-") + "</span></td>" +
        "<td><span class=\"vs-rank\">" + escapeHtml(item.peringkat) + "</span><span class=\"vs-level\">" + escapeHtml(item.jenis) + " &middot; " + escapeHtml(item.tingkat) + "</span></td>" +
        "<td class=\"vs-document-cell\">" + verificationDocumentMarkup(item) + "</td>" +
        "<td class=\"vs-status-cell\">" + verificationStatusMarkup(status) + "</td>" +
        "<td class=\"vs-decision-cell\">" + decision + "</td>" +
        "</tr>";
    }).join("");

    if (pendingSummary) pendingSummary.textContent = pending.length + " Menunggu Verifikasi";
    if (pendingTab) pendingTab.textContent = "Menunggu Verifikasi (" + pending.length + ")";
    if (historyTab) historyTab.textContent = "Semua Riwayat Pengajuan (" + records.length + ")";

    applySearch();
  }

  function updateModalSummary(id) {
    const item = getPrestasi().find(function (record) {
      return normalize(record.id) === normalize(id);
    });
    if (!item) return;

    selectedId = item.id;
    document.querySelectorAll(".vs-modal").forEach(function (modal) {
      const competition = modal.querySelector(".vs-modal-competition");
      const student = modal.querySelector(".vs-modal-student");
      const meta = modal.querySelector(".vs-modal-meta");
      if (competition) competition.textContent = item.namaKompetisi || item.namaPrestasi || "";
      if (student) student.textContent = studentName(item) + " (NIM: " + item.nim + ")";
      if (meta) meta.textContent = [item.peringkat, item.jenis, item.tingkat].filter(Boolean).join(" \u00b7 ");
    });
  }

  tbody.addEventListener("click", function (event) {
    const action = event.target.closest(".vs-action");
    if (!action) return;
    updateModalSummary(action.dataset.id);
  });

  const decisionMap = [
    [".vs-modal-btn--approve", "Terverifikasi"],
    [".vs-modal-btn--revision", "Perlu Perbaikan"],
    [".vs-modal-btn--reject", "Ditolak"]
  ];

  decisionMap.forEach(function (entry) {
    document.querySelectorAll(entry[0]).forEach(function (button) {
      button.addEventListener("click", function () {
        if (!selectedId) return;
        savePrestasiStatus(selectedId, entry[1]);
        selectedId = "";
        document.querySelectorAll('.vs-state[type="checkbox"]').forEach(function (input) {
          input.checked = false;
        });
        render();
      });
    });
  });

  if (search) search.addEventListener("input", applySearch);
  render();
}

if (document.querySelector(".submission-table")) initializeDashboard();
if (document.querySelector(".hk-table")) initializeClassification();
if (document.querySelector(".vs-table")) initializeVerification();
