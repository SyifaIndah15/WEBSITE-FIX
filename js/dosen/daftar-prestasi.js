// Membuat fungsi utama yang langsung dijalankan ketika file JavaScript dibaca.
(() => {

  // Mengambil kolom pencarian berdasarkan ID prestasi-search.
  const searchInput = document.getElementById("prestasi-search");

  // Mengambil seluruh baris data prestasi yang sudah ada di dalam tabel.
  const rows = document.querySelectorAll("#prestasi-rows .prestasi-row");

  // Mengambil baris pemberitahuan ketika data tidak ditemukan.
  const emptyRow = document.getElementById("prestasi-empty");

  // Memeriksa apakah kolom pencarian atau baris data berhasil ditemukan.
  // Jika tidak ditemukan, hentikan seluruh proses.
  if (!searchInput || rows.length === 0) {
    return;
  }

  // Membuat fungsi untuk menyaring data prestasi berdasarkan kata kunci.
  const searchPrestasi = () => {

    // Mengambil kata kunci, menghapus spasi di awal dan akhir,
    // lalu mengubahnya menjadi huruf kecil agar pencarian tidak membedakan
    // huruf besar dan huruf kecil.
    const keyword = searchInput.value.trim().toLowerCase();

    // Menyiapkan penghitung jumlah baris yang cocok.
    let visibleCount = 0;

    // Memeriksa setiap baris data prestasi.
    rows.forEach((row) => {

      // Mengambil elemen nama mahasiswa pada baris tersebut.
      const nameElement = row.querySelector(".prestasi-name");

      // Mengambil elemen NPM mahasiswa pada baris tersebut.
      const npmElement = row.querySelector(".prestasi-npm");

      // Mengambil elemen kegiatan kompetisi pada baris tersebut.
      const competitionElement = row.querySelector(".prestasi-competition");

      // Mengambil teks nama mahasiswa dan mengubahnya menjadi huruf kecil.
      const name = nameElement ? nameElement.textContent.toLowerCase() : "";

      // Mengambil teks NPM, menghapus tulisan "NPM:", dan mengubahnya
      // menjadi huruf kecil agar hanya angka NPM yang ikut dicocokkan.
      const npm = npmElement
        ? npmElement.textContent.replace(/NPM\s*:/i, "").trim().toLowerCase()
        : "";

      // Mengambil teks kegiatan kompetisi dan mengubahnya menjadi huruf kecil.
      const competition = competitionElement
        ? competitionElement.textContent.toLowerCase()
        : "";

      // Memeriksa apakah kata kunci cocok dengan nama mahasiswa, NPM,
      // atau kegiatan kompetisi. Jika kata kunci kosong, semua data cocok.
      const isMatch =
        keyword === "" ||
        name.includes(keyword) ||
        npm.includes(keyword) ||
        competition.includes(keyword);

      // Menampilkan baris jika cocok dan menyembunyikannya jika tidak cocok.
      row.hidden = !isMatch;

      // Menambah jumlah data yang cocok untuk pengecekan baris kosong.
      if (isMatch) {
        visibleCount += 1;
      }
    });

    // Menampilkan baris pemberitahuan jika tidak ada data yang cocok.
    // Baris tersebut disembunyikan kembali ketika kata kunci kosong atau
    // ketika ada data yang cocok.
    if (emptyRow) {
      emptyRow.hidden = keyword === "" || visibleCount > 0;
    }
  };

  // Menjalankan pencarian secara langsung ketika pengguna mengetik.
  searchInput.addEventListener("input", searchPrestasi);

  // Menjalankan pencarian ketika tombol hapus (X) pada kolom pencarian dipakai.
  searchInput.addEventListener("search", searchPrestasi);

})();
