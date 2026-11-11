(async () => {
  const searchInput = document.getElementById("prestasi-search");
  const tableBody = document.getElementById("prestasi-rows");

  if (!searchInput || !tableBody) return;

  const filterInputs = document.querySelectorAll(
    'input[name="filter-jenis"], input[name="filter-status"]'
  );
  const emptyTemplate = document.getElementById("prestasi-empty") || null;
  const DATA_STORE_URL = new URL("../core/sipresma-data.js", document.currentScript.src).href;

  let rows = [];
  let emptyRow = null;

  function normalize(value) {
    return String(value == null ? "" : value).toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
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
    const href = String(value == null ? "" : value).trim();
    if (!href || /^(javascript|data|vbscript):/i.test(href)) return "";
    return href;
  }

  function statusInfo(status) {
    const value = normalize(status);

    if (value === "terverifikasi" || value === "diverifikasi" || value === "verified") {
      return {
        css: "verified",
        filter: "diverifikasi",
        label: "diverifikasi",
        icon: "<circle cx=\"8\" cy=\"8\" r=\"6.2\"/><path d=\"m5.2 8.1 1.8 1.8 3.9-4\"/>"
      };
    }

    if (value === "perluperbaikan" || value === "revision") {
      return {
        css: "revision",
        filter: "perlu-perbaikan",
        label: "Perlu Perbaikan",
        icon: "<circle cx=\"8\" cy=\"8\" r=\"6.2\"/><path d=\"M8 4.7v3.7\"/><path d=\"M8 11.4h.01\"/>"
      };
    }

    if (value === "ditolak" || value === "rejected") {
      return {
        css: "rejected",
        filter: "ditolak",
        label: "Ditolak",
        icon: "<circle cx=\"8\" cy=\"8\" r=\"6.2\"/><path d=\"m5.8 5.8 4.4 4.4M10.2 5.8 5.8 10.2\"/>"
      };
    }

    return {
      css: "pending",
      filter: "diajukan",
      label: "diajukan",
      icon: "<circle cx=\"8\" cy=\"8\" r=\"6.2\"/><path d=\"M8 4.7v3.7l2.5 1.5\"/>"
    };
  }

  function certificateMarkup(item) {
    const href = safeHref(item.bukti);
    const icon = "<svg viewBox=\"0 0 20 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 1.5h8l4 4V22.5H4z\"/><path d=\"M12 1.5v4h4\"/><path d=\"M6.8 10.2h6.4M6.8 13.3h6.4M6.8 16.4h4.5\"/></svg>";

    if (!href) return "<span class=\"certificate-link certificate-link--empty\">Tidak tersedia</span>";

    return "<a class=\"certificate-link\" href=\"" + escapeHtml(href) + "\" target=\"_blank\" rel=\"noopener\" aria-label=\"Buka sertifikat " + escapeHtml(item.namaKompetisi || item.namaPrestasi) + " milik " + escapeHtml(item.namaMahasiswa) + "\">" + icon + "</a>";
  }

  function getCheckedValue(name) {
    const checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : "all";
  }

  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();
    const jenis = getCheckedValue("filter-jenis");
    const status = getCheckedValue("filter-status");
    let visibleCount = 0;

    rows.forEach(function (row) {
      const searchableText = normalize(row.textContent).toLowerCase();
      const matchesKeyword = !keyword || searchableText.includes(normalize(keyword));
      const matchesJenis = jenis === "all" || row.dataset.jenis === jenis;
      const matchesStatus = status === "all" || row.dataset.status === status;
      const visible = matchesKeyword && matchesJenis && matchesStatus;

      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyRow) emptyRow.hidden = visibleCount > 0;
  }

  function render(store) {
    const records = store.getPrestasi().slice().sort(function (left, right) {
      return String(left.namaMahasiswa || "").localeCompare(String(right.namaMahasiswa || ""), "id", {
        sensitivity: "base"
      });
    });

    tableBody.innerHTML = "";
    rows = records.map(function (item) {
      const status = statusInfo(item.status);
      const row = document.createElement("tr");
      row.className = "prestasi-row";
      row.dataset.jenis = normalize(item.jenis);
      row.dataset.status = status.filter;
      row.innerHTML =
        "<td class=\"prestasi-cell-student\"><span class=\"prestasi-name\">" + escapeHtml(item.namaMahasiswa) + "</span><span class=\"prestasi-npm\">NPM: " + escapeHtml(item.nim) + "</span></td>" +
        "<td class=\"prestasi-cell-activity\"><span class=\"prestasi-competition\">" + escapeHtml(item.namaKompetisi || item.namaPrestasi) + "</span><span class=\"prestasi-organizer\">" + escapeHtml(item.penyelenggara) + "</span></td>" +
        "<td class=\"prestasi-cell-type\"><span class=\"prestasi-type\">" + escapeHtml(item.jenis) + "</span><span class=\"prestasi-level\">" + escapeHtml(item.tingkat) + "</span></td>" +
        "<td class=\"prestasi-cell-rank\">" + escapeHtml(item.peringkat) + "</td>" +
        "<td class=\"prestasi-cell-year\">" + escapeHtml(item.tahun) + "</td>" +
        "<td class=\"prestasi-cell-status\"><span class=\"verify-badge verify-badge--" + status.css + "\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">" + status.icon + "</svg>" + status.label + "</span></td>" +
        "<td class=\"prestasi-cell-certificate\">" + certificateMarkup(item) + "</td>";
      tableBody.appendChild(row);
      return row;
    });

    if (emptyTemplate) {
      emptyRow = emptyTemplate.cloneNode(true);
      emptyRow.hidden = true;
      tableBody.appendChild(emptyRow);
    }

    applyFilters();
  }

  searchInput.addEventListener("input", applyFilters);
  searchInput.addEventListener("search", applyFilters);
  filterInputs.forEach(function (input) {
    input.addEventListener("change", applyFilters);
  });

  try {
    const store = await import(DATA_STORE_URL);
    render(store);
  } catch (error) {
    console.error("Data prestasi Dosen gagal dimuat:", error);
  }
})();
