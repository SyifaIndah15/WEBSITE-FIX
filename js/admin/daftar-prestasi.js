// Interaksi halaman data prestasi mahasiswa: pencarian, filter, dan pengurutan.
(() => {
  const searchInput = document.querySelector(".dp-search input");
  const tableBody = document.querySelector(".dp-table tbody");

  if (!searchInput || !tableBody) return;

  const filterInputs = document.querySelectorAll(
    'input[name="dp-jenis"], input[name="dp-tingkat"], input[name="dp-status"]'
  );
  const footer = document.querySelector(".dp-table-bottom span");
  const DATA_STORE_URL = new URL("../core/sipresma-data.js", document.currentScript.src).href;

  let entries = [];

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

  function statusMarkup(status) {
    let key = "pending";
    let label = "Menunggu Verifikasi";
    let icon = "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7.5V12l3 1.8\"/>";
    const value = normalize(status);

    if (value === "terverifikasi" || value === "diverifikasi" || value === "verified") {
      key = "verified";
      label = "diverifikasi";
      icon = "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m8.4 12.2 2.4 2.4 4.8-5\"/>";
    } else if (value === "perluperbaikan" || value === "revision") {
      key = "revision";
      label = "Perlu Perbaikan";
      icon = "<path d=\"M12 8v5\"/><path d=\"M12 16.5h.01\"/><circle cx=\"12\" cy=\"12\" r=\"9\"/>";
    } else if (value === "ditolak" || value === "rejected") {
      key = "rejected";
      label = "Ditolak";
      icon = "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m9 9 6 6M15 9l-6 6\"/>";
    }

    return {
      key: key,
      markup: "<span class=\"dp-status dp-status--" + key + "\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">" + icon + "</svg><span>" + label + "</span></span>"
    };
  }

  function proofMarkup(item) {
    const href = safeHref(item.bukti);
    const icon = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z\"/><path d=\"M14 3v5h5\"/><path d=\"M9 13h6M9 17h6\"/></svg>";

    if (!href) return "<span class=\"dp-proof-missing\">Tidak tersedia</span>";

    return "<a class=\"dp-proof-link\" href=\"" + escapeHtml(href) + "\" target=\"_blank\" rel=\"noopener\" aria-label=\"Lihat sertifikat " + escapeHtml(item.namaKompetisi || item.namaPrestasi) + " " + escapeHtml(item.namaMahasiswa) + "\">" + icon + "</a>";
  }

  function levelValue(level) {
    const value = normalize(String(level || "").replace(/^tingkat\s*/i, ""));
    return value === "kabupatenkota" || value === "kota" ? "kabupaten" : value;
  }

  function getCheckedFilter(name, prefix, fallback) {
    const checked = document.querySelector('input[name="' + name + '"]:checked');
    if (!checked || !checked.id) return fallback;
    if (checked.id.indexOf(prefix) !== 0) return fallback;
    return checked.id.slice(prefix.length);
  }

  function sortRows() {
    entries.sort(function (first, second) {
      const byName = first.name.localeCompare(second.name, "id", { sensitivity: "base" });
      if (byName !== 0) return byName;

      const byCompetition = first.competition.localeCompare(second.competition, "id", {
        sensitivity: "base"
      });
      if (byCompetition !== 0) return byCompetition;

      return first.index - second.index;
    });

    entries.forEach(function (entry) {
      tableBody.appendChild(entry.row);
    });
  }

  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    const jenis = getCheckedFilter("dp-jenis", "dp-jenis-", "all");
    const tingkat = getCheckedFilter("dp-tingkat", "dp-tingkat-", "all");
    const status = getCheckedFilter("dp-status", "dp-status-", "all");

    sortRows();
    let visible = 0;

    entries.forEach(function (entry) {
      const searchableText = [entry.name, entry.nim, entry.competition].join(" ").toLowerCase();
      const matchesSearch = !term || searchableText.includes(term);
      const matchesJenis = jenis === "all" || entry.jenis === jenis;
      const matchesTingkat = tingkat === "all" || entry.tingkat === tingkat;
      const matchesStatus = status === "all" || entry.status === status;
      const show = matchesSearch && matchesJenis && matchesTingkat && matchesStatus;

      entry.row.hidden = !show;
      if (show) visible += 1;
    });

    if (footer) {
      footer.textContent = "Menampilkan " + visible + " dari " + entries.length + " data prestasi mahasiswa Teknik Informatika";
    }
  }

  function render(store) {
    const records = store.getPrestasi().slice().sort(function (left, right) {
      return String(left.namaMahasiswa || "").localeCompare(String(right.namaMahasiswa || ""), "id", {
        sensitivity: "base"
      });
    });

    tableBody.innerHTML = "";
    entries = records.map(function (item, index) {
      const status = statusMarkup(item.status);
      const row = document.createElement("tr");
      row.innerHTML =
        "<td><span class=\"dp-student-name\">" + escapeHtml(item.namaMahasiswa) + "</span><span class=\"dp-student-meta\">NIM: " + escapeHtml(item.nim) + "</span></td>" +
        "<td><span class=\"dp-competition-name\">" + escapeHtml(item.namaKompetisi || item.namaPrestasi) + "</span><span class=\"dp-competition-org\">" + escapeHtml(item.penyelenggara) + "</span></td>" +
        "<td><span class=\"dp-type-name\">" + escapeHtml(item.jenis) + "</span><span class=\"dp-type-level\">" + escapeHtml(item.tingkat) + "</span></td>" +
        "<td class=\"dp-rank\">" + escapeHtml(item.peringkat) + "</td>" +
        "<td class=\"dp-year\">" + escapeHtml(item.tahun) + "</td>" +
        "<td class=\"dp-status-cell\">" + status.markup + "</td>" +
        "<td class=\"dp-proof-cell\">" + proofMarkup(item) + "</td>";
      tableBody.appendChild(row);

      return {
        row: row,
        index: index,
        name: String(item.namaMahasiswa || ""),
        nim: String(item.nim || ""),
        competition: String(item.namaKompetisi || item.namaPrestasi || ""),
        jenis: normalize(item.jenis),
        tingkat: levelValue(item.tingkat),
        status: normalize(status.key)
      };
    });

    applyFilters();
  }

  searchInput.addEventListener("input", applyFilters);
  searchInput.addEventListener("search", applyFilters);
  filterInputs.forEach(function (input) {
    input.addEventListener("change", applyFilters);
  });

  import(DATA_STORE_URL)
    .then(render)
    .catch(function (error) {
      console.error("Data prestasi Admin gagal dimuat:", error);
    });
})();
