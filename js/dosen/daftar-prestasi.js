
// Membuat fungsi utama yang langsung dijalankan ketika file JavaScript dibaca.
(() => {

  // Mengambil kolom pencarian berdasarkan ID prestasi-search.
  const searchInput = document.getElementById("prestasi-search");

  // Mengambil bagian tbody yang berisi seluruh data prestasi.
  const tableBody = document.getElementById("prestasi-rows");

  // Mengambil baris pemberitahuan ketika data tidak ditemukan.
  const emptyRow = document.getElementById("prestasi-empty");

  // Memeriksa apakah elemen pencarian dan tabel berhasil ditemukan.
  if (!searchInput || !tableBody) {
    return;
  }

  // Mengambil seluruh baris data prestasi dari tabel.
  const rows = Array.from(tableBody.querySelectorAll(".prestasi-row"));

  // Mengambil seluruh input radio untuk filter jenis dan status.
  const filterInputs = document.querySelectorAll(
    'input[name="filter-jenis"], input[name="filter-status"]'
  );

  // Membuat fungsi untuk mengambil nilai radio yang sedang dipilih.
  const getCheckedValue = (name) => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);

    return checked ? checked.value : "all";
  };

  // Membuat fungsi utama untuk mencari dan menyaring data prestasi.
  const applyFilters = () => {

    // Mengambil kata kunci pencarian dan mengubahnya menjadi huruf kecil.
    const keyword = searchInput.value.trim().toLowerCase();

    // Mengambil jenis prestasi yang sedang dipilih.
    const jenis = getCheckedValue("filter-jenis");

    // Mengambil status prestasi yang sedang dipilih.
    const status = getCheckedValue("filter-status");

    // Menyiapkan penghitung jumlah data yang ditampilkan.
    let visibleCount = 0;

    // Memeriksa setiap baris data prestasi.
    rows.forEach((row) => {

      // Mengambil elemen nama mahasiswa.
      const name = row.querySelector(".prestasi-name");

      // Mengambil elemen NPM mahasiswa.
      const npm = row.querySelector(".prestasi-npm");

      // Mengambil elemen kegiatan kompetisi.
      const competition = row.querySelector(".prestasi-competition");

      // Menggabungkan teks nama, NPM, dan kompetisi untuk pencarian.
      const searchableText = [
        name ? name.textContent : "",
        npm ? npm.textContent : "",
        competition ? competition.textContent : "",
      ]
        .join(" ")
        .toLowerCase();

      // Memeriksa apakah kata kunci cocok dengan data mahasiswa.
      const matchesKeyword =
        !keyword || searchableText.includes(keyword);

      // Memeriksa apakah jenis prestasi sesuai dengan filter.
      const matchesJenis =
        jenis === "all" || row.dataset.jenis === jenis;

      // Memeriksa apakah status prestasi sesuai dengan filter.
      const matchesStatus =
        status === "all" || row.dataset.status === status;

      // Menampilkan data hanya jika seluruh kondisi pencarian terpenuhi.
      const isVisible =
        matchesKeyword && matchesJenis && matchesStatus;

      // Menyembunyikan baris yang tidak sesuai dengan pencarian dan filter.
      row.hidden = !isVisible;

      // Menghitung jumlah data yang berhasil ditampilkan.
      if (isVisible) {
        visibleCount += 1;
      }
    });

    // Menampilkan pemberitahuan jika tidak ada data yang sesuai.
    if (emptyRow) {
      emptyRow.hidden = visibleCount > 0;
    }
  };

  // Menjalankan pencarian ketika pengguna mengetik.
  searchInput.addEventListener("input", applyFilters);

  // Menjalankan pencarian ketika tombol hapus pada kolom pencarian digunakan.
  searchInput.addEventListener("search", applyFilters);

  // Menjalankan filter ketika pengguna memilih jenis atau status prestasi.
  filterInputs.forEach((input) => {
    input.addEventListener("change", applyFilters);
  });

  // Menampilkan seluruh data sesuai kondisi filter awal.
  applyFilters();

})();
