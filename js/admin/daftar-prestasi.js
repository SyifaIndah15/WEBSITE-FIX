// Interaksi halaman data prestasi mahasiswa: pencarian, filter, dan pengurutan.
(() => {
  // Mengambil kolom pencarian dan badan tabel yang sudah tersedia pada HTML.
  const searchInput = document.querySelector(".dp-search input");
  const tableBody = document.querySelector(".dp-table tbody");

  // Hentikan proses jika elemen utama halaman tidak ditemukan.
  if (!searchInput || !tableBody) return;

  // Mengambil seluruh input radio filter jenis, tingkat, dan status.
  const filterInputs = document.querySelectorAll(
    'input[name="dp-jenis"], input[name="dp-tingkat"], input[name="dp-status"]'
  );

  // Menyeragamkan teks untuk perbandingan: huruf kecil tanpa spasi/tanda baca.
  function normalize(value) {
    return (value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  // Membaca data penting dari satu baris tabel yang sudah dirender.
  function readRow(row, index) {
    const nameElement = row.querySelector(".dp-student-name");
    const metaElement = row.querySelector(".dp-student-meta");
    const competitionElement = row.querySelector(".dp-competition-name");
    const typeElement = row.querySelector(".dp-type-name");
    const levelElement = row.querySelector(".dp-type-level");
    const statusElement = row.querySelector(".dp-status");

    // NIM diambil dari teks "NIM: ..." tanpa menyertakan labelnya.
    const nimText = metaElement ? metaElement.textContent.trim() : "";
    const nim = nimText.replace(/^NIM\s*:\s*/i, "").trim();

    // Tingkat dibaca dari kolom Jenis & Tingkat, bukan dari nama kompetisi.
    const levelText = levelElement ? levelElement.textContent.trim() : "";
    const level = normalize(levelText.replace(/^tingkat\s*/i, ""));
    const levelValue = level === "kabupatenkota" ? "kabupaten" : level;

    // Status internal dibaca dari kelas badge, bukan dari teks tampilannya.
    let statusValue = "";
    if (statusElement) {
      const statusClass = Array.from(statusElement.classList).find(function (className) {
        return className.indexOf("dp-status--") === 0;
      });
      if (statusClass) statusValue = statusClass.slice("dp-status--".length);
    }

    return {
      row: row,
      index: index,
      name: nameElement ? nameElement.textContent.trim() : "",
      nim: nim,
      competition: competitionElement ? competitionElement.textContent.trim() : "",
      jenis: normalize(typeElement ? typeElement.textContent : ""),
      tingkat: levelValue,
      status: normalize(statusValue)
    };
  }

  // Menyimpan data seluruh baris agar pencarian dan filter konsisten.
  const entries = Array.from(tableBody.querySelectorAll("tr")).map(readRow);

  // Mengambil nilai filter yang sedang dipilih berdasarkan id input radio.
  function getCheckedFilter(name, prefix, fallback) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    if (!checked || !checked.id) return fallback;

    if (checked.id.indexOf(prefix) !== 0) return fallback;
    return checked.id.slice(prefix.length);
  }

  // Mengurutkan baris berdasarkan nama mahasiswa lalu nama kompetisi (A-Z).
  function sortRows() {
    entries.sort(function (first, second) {
      const byName = first.name.localeCompare(second.name, "id", {
        sensitivity: "base"
      });
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

  // Menerapkan pencarian dan ketiga filter secara bersamaan.
  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    const jenis = getCheckedFilter("dp-jenis", "dp-jenis-", "all");
    const tingkat = getCheckedFilter("dp-tingkat", "dp-tingkat-", "all");
    const status = getCheckedFilter("dp-status", "dp-status-", "all");

    // Pastikan urutan A-Z selalu diterapkan sebelum menampilkan hasil.
    sortRows();

    entries.forEach(function (entry) {
      const searchableText = [entry.name, entry.nim, entry.competition]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchableText.includes(term);
      const matchesJenis = jenis === "all" || entry.jenis === jenis;
      const matchesTingkat = tingkat === "all" || entry.tingkat === tingkat;
      const matchesStatus = status === "all" || entry.status === status;

      entry.row.hidden = !(
        matchesSearch &&
        matchesJenis &&
        matchesTingkat &&
        matchesStatus
      );
    });
  }

  // Menjalankan pencarian saat pengguna mengetik atau menghapus kata kunci.
  searchInput.addEventListener("input", applyFilters);
  searchInput.addEventListener("search", applyFilters);

  // Menjalankan filter saat pilihan jenis, tingkat, atau status berubah.
  filterInputs.forEach(function (input) {
    input.addEventListener("change", applyFilters);
  });

  // Tampilkan data dalam urutan A-Z sesuai kondisi awal halaman.
  sortRows();
  applyFilters();
})();
