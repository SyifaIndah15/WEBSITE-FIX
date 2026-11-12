// Interaksi halaman Manajemen Reset Password: render dinamis, pencarian, proses, dan penolakan.
(() => {
  const tableBody = document.querySelector(".rp-table tbody");

  if (!tableBody) return;

  const searchInput = document.getElementById("rp-search-input");
  const processModal = document.getElementById("rp-process-modal");
  const rejectModal = document.getElementById("rp-reject-modal");
  const DATA_STORE_URL = new URL("../core/sipresma-data.js", document.currentScript.src).href;

  const STATUS_META = {
    Menunggu: {
      row: "rp-row--menunggu",
      badge: "rp-status--pending",
      label: "Menunggu",
      icon: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7.5V12l3 1.8\"/>"
    },
    Diproses: {
      row: "rp-row--diproses",
      badge: "rp-status--process",
      label: "Diproses",
      icon: "<path d=\"M4 11a8.1 8.1 0 0 1 14.8-4M20 5v4h-4\"/><path d=\"M20 13a8.1 8.1 0 0 1-14.8 4M4 19v-4h4\"/>"
    },
    Selesai: {
      row: "rp-row--selesai",
      badge: "rp-status--done",
      label: "Selesai",
      icon: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"m8.4 12.2 2.4 2.4 4.8-5\"/>"
    },
    Ditolak: {
      row: "rp-row--ditolak",
      badge: "rp-status--rejected",
      label: "Ditolak",
      icon: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"m9.4 9.4 5.2 5.2M14.6 9.4l-5.2 5.2\"/>"
    }
  };

  const ROLE_META = {
    Mahasiswa: {
      row: "rp-row--mahasiswa",
      roleClass: "rp-role--student",
      avatarClass: "rp-avatar--student",
      modalRoleClass: "rp-modal-role--student",
      idLabel: "NPM",
      avatar: "<circle cx=\"12\" cy=\"8\" r=\"3.4\"/><path d=\"M5.7 20c.5-3.7 2.9-5.8 6.3-5.8s5.8 2.1 6.3 5.8\"/>"
    },
    Dosen: {
      row: "rp-row--dosen",
      roleClass: "rp-role--lecturer",
      avatarClass: "rp-avatar--lecturer",
      modalRoleClass: "rp-modal-role--lecturer",
      idLabel: "NIDN",
      avatar: "<path d=\"m3 8 9-5 9 5-9 5-9-5Z\"/><path d=\"M7 10v5c3 3 7 3 10 0v-5\"/><path d=\"M21 8v7\"/>"
    }
  };

  const PROCESS_ICON = "<path d=\"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z\"/><circle cx=\"16.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"/>";
  const REJECT_ICON = "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"m8.25 8.25 7.5 7.5M15.75 8.25l-7.5 7.5\"/>";

  const DEFAULT_REJECT_NOTE = "Permintaan ditolak: Identitas pengaju tidak dapat diverifikasi atau alamat email tidak terdaftar pada basis data resmi.";

  let storeRef = null;
  let requestById = {};
  let searchIndex = {};

  function normalize(value) {
    return String(value == null ? "" : value).toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function normalizeStatus(value) {
    const text = String(value == null ? "" : value).trim();
    if (STATUS_META[text]) return text;
    const lower = text.toLowerCase();
    if (lower.indexOf("tolak") !== -1) return "Ditolak";
    if (lower.indexOf("selesai") !== -1 || lower.indexOf("done") !== -1) return "Selesai";
    if (lower.indexOf("proses") !== -1) return "Diproses";
    return "Menunggu";
  }

  function roleMeta(role) {
    return ROLE_META[role] || ROLE_META.Mahasiswa;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function badgeMarkup(status) {
    const meta = STATUS_META[status];
    return "<span class=\"rp-status " + meta.badge + "\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">" + meta.icon + "</svg><span>" + meta.label + "</span></span>";
  }

  function actionMarkup(id) {
    return "<div class=\"rp-actions\">"
      + "<button type=\"button\" class=\"rp-action rp-action--process\" data-rp-action=\"process\" data-reset-id=\"" + escapeHtml(id) + "\">"
      + "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">" + PROCESS_ICON + "</svg>"
      + "<span>Proses</span></button>"
      + "<button type=\"button\" class=\"rp-action rp-action--reject\" data-rp-action=\"reject\" data-reset-id=\"" + escapeHtml(id) + "\">"
      + "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">" + REJECT_ICON + "</svg>"
      + "<span>Tolak</span></button>"
      + "</div>";
  }

  function rowMarkup(request) {
    const status = normalizeStatus(request.status);
    const role = roleMeta(request.role);
    const canAct = status === "Menunggu" || status === "Diproses";

    return "<tr class=\"rp-row " + STATUS_META[status].row + " " + role.row + "\" data-reset-id=\"" + escapeHtml(request.id) + "\">"
      + "<td><div class=\"rp-user\">"
      + "<span class=\"rp-avatar " + role.avatarClass + "\" aria-hidden=\"true\">"
      + "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\">" + role.avatar + "</svg>"
      + "</span>"
      + "<span class=\"rp-user-copy\"><span class=\"rp-name\">" + escapeHtml(request.nama) + "</span>"
      + "<span class=\"rp-role " + role.roleClass + "\">" + escapeHtml(request.role) + "</span></span>"
      + "</div></td>"
      + "<td><span class=\"rp-identity-code\">" + role.idLabel + ": " + escapeHtml(request.identifier) + "</span>"
      + "<span class=\"rp-email\">" + escapeHtml(request.email) + "</span></td>"
      + "<td><span class=\"rp-date\">" + escapeHtml(request.tanggalPengajuan) + "</span>"
      + "<span class=\"rp-time\">" + escapeHtml(request.waktuPengajuan) + "</span></td>"
      + "<td>" + badgeMarkup(status) + "</td>"
      + "<td>" + (canAct ? actionMarkup(request.id) : "") + "</td>"
      + "</tr>";
  }

  function updateCounts(counts) {
    const labels = {
      "rp-status-all": "Semua (" + (counts.total || 0) + ")",
      "rp-status-menunggu": "Menunggu (" + (counts.Menunggu || 0) + ")",
      "rp-status-diproses": "Diproses (" + (counts.Diproses || 0) + ")",
      "rp-status-selesai": "Selesai (" + (counts.Selesai || 0) + ")",
      "rp-status-ditolak": "Ditolak (" + (counts.Ditolak || 0) + ")"
    };

    Object.keys(labels).forEach(function (id) {
      const label = document.querySelector('label[for="' + id + '"]');
      if (label) label.textContent = labels[id];
    });
  }

  function applySearch() {
    if (!searchInput) return;
    const term = normalize(searchInput.value);

    tableBody.querySelectorAll("tr[data-reset-id]").forEach(function (row) {
      const text = searchIndex[row.getAttribute("data-reset-id")] || "";
      row.hidden = term.length > 0 && text.indexOf(term) === -1;
    });
  }

  function render(store) {
    const requests = store.getResetRequests().slice();
    requestById = {};
    searchIndex = {};

    tableBody.innerHTML = requests.map(function (request) {
      requestById[request.id] = request;
      searchIndex[request.id] = normalize([request.nama, request.identifier, request.email, request.role].join(" "));
      return rowMarkup(request);
    }).join("");
  }

  function refresh() {
    if (!storeRef) return;
    render(storeRef);
    updateCounts(storeRef.getResetRequestCounts());
    applySearch();
  }

  function showModal(modal) {
    if (modal) modal.style.display = "grid";
  }

  function hideModal(modal) {
    if (modal) modal.style.display = "";
  }

  function openProcessModal(request) {
    if (!processModal) return;
    const role = roleMeta(request.role);
    const avatar = document.getElementById("rp-process-avatar");
    const roleEl = document.getElementById("rp-process-role");

    processModal.dataset.resetId = request.id;
    avatar.className = "rp-modal-avatar " + role.avatarClass;
    avatar.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\">" + role.avatar + "</svg>";
    document.getElementById("rp-process-name").textContent = request.nama || "-";
    document.getElementById("rp-process-meta").textContent = role.idLabel + ": " + request.identifier + " \u00b7 " + (request.email || "");
    roleEl.textContent = request.role;
    roleEl.className = "rp-modal-role " + role.modalRoleClass;
    document.getElementById("rp-process-password-note").innerHTML = "Reset " + role.idLabel + " Akun (Default): <strong>" + escapeHtml(request.identifier) + "</strong>";
    document.getElementById("rp-process-note").value = "Password " + String(request.role).toLowerCase() + " telah direset menggunakan " + role.idLabel + " (" + request.identifier + "). " + request.role + " dapat langsung masuk.";
    document.getElementById("rp-process-done").checked = true;

    showModal(processModal);
  }

  function openRejectModal(request) {
    if (!rejectModal) return;
    const role = roleMeta(request.role);

    rejectModal.dataset.resetId = request.id;
    document.getElementById("rp-reject-name").textContent = request.nama || "-";
    document.getElementById("rp-reject-meta").textContent = role.idLabel + ": " + request.identifier + " \u00b7 " + (request.email || "");
    document.getElementById("rp-reject-note").value = DEFAULT_REJECT_NOTE;

    showModal(rejectModal);
  }

  function handleTableClick(event) {
    const button = event.target.closest("[data-rp-action]");
    if (!button) return;

    const request = requestById[button.getAttribute("data-reset-id")];
    if (!request) return;

    if (button.getAttribute("data-rp-action") === "process") openProcessModal(request);
    else if (button.getAttribute("data-rp-action") === "reject") openRejectModal(request);
  }

  function confirmProcess() {
    if (!storeRef || !processModal) return;
    const id = processModal.dataset.resetId;
    if (!id) return;

    const progress = document.getElementById("rp-process-progress");
    const status = progress && progress.checked ? "Diproses" : "Selesai";
    const note = document.getElementById("rp-process-note");
    const result = storeRef.saveResetRequestStatus(id, status, note ? note.value : "");
    if (!result.ok) return;

    if (status === "Selesai") {
      storeRef.resetAccountPassword(result.request.role, result.request.identifier);
    }

    hideModal(processModal);
    refresh();
  }

  function confirmReject() {
    if (!storeRef || !rejectModal) return;
    const id = rejectModal.dataset.resetId;
    if (!id) return;

    const note = document.getElementById("rp-reject-note");
    const result = storeRef.saveResetRequestStatus(id, "Ditolak", note ? note.value : "");
    if (!result.ok) return;

    hideModal(rejectModal);
    refresh();
  }

  document.querySelectorAll("[data-rp-close]").forEach(function (element) {
    element.addEventListener("click", function () {
      hideModal(element.closest(".rp-modal"));
    });
  });

  tableBody.addEventListener("click", handleTableClick);

  const processConfirm = document.getElementById("rp-process-confirm");
  if (processConfirm) processConfirm.addEventListener("click", confirmProcess);

  const rejectConfirm = document.getElementById("rp-reject-confirm");
  if (rejectConfirm) rejectConfirm.addEventListener("click", confirmReject);

  import(DATA_STORE_URL)
    .then(function (store) {
      storeRef = store;

      if (searchInput) {
        searchInput.addEventListener("input", applySearch);
        searchInput.addEventListener("search", applySearch);
      }

      refresh();
    })
    .catch(function (error) {
      console.error("Data permintaan reset password gagal dimuat:", error);
    });
})();
