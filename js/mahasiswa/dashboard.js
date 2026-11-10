// Membuat fungsi utama yang langsung dijalankan ketika file JavaScript dibaca.
(() => {

  // Mengambil NPM dari parameter URL yang dikirim saat proses login mahasiswa.
  const npm = new URLSearchParams(window.location.search).get("npm");

  // Mengambil elemen teks NPM pada header banner dashboard.
  const npmElement = document.querySelector(".banner-meta span");

  // Menampilkan NPM dari URL jika tersedia, tanpa mengubah nama mahasiswa.
  if (npm && npmElement) {
    npmElement.textContent = `NPM: ${npm}`;
  }

  // Mengambil elemen teks Angkatan pada header banner dashboard.
  const angkatanElement = document.querySelectorAll(".banner-meta span")[2];

  // Menentukan tahun angkatan dari angka ke-5 dan ke-6 NPM dengan awalan "20".
  if (npm && npm.length >= 6 && angkatanElement) {
    angkatanElement.textContent = `Angkatan 20${npm.slice(4, 6)}`;
  }

  // Mengambil objek SIPRESMA yang tersedia secara global pada window.
  const prestasi = window.SIPRESMA; //objek digunakan untuk akses fungsi pengelolaan data prestasi

  // Memeriksa apakah objek SIPRESMA tersedia dan memiliki fungsi getPrestasiMahasiswa.
  // Jika objek atau fungsi tersebut tidak ditemukan, hentikan proses.
  if (!prestasi || typeof prestasi.getPrestasiMahasiswa !== "function") {
    return;
  }

  // Mengambil seluruh data pengajuan prestasi mahasiswa melalui fungsi getPrestasiMahasiswa().
  const pengajuan = prestasi.getPrestasiMahasiswa();

  // Membuat fungsi untuk menampilkan nilai statistik pada elemen HTML.
  const setStatValue = (id, value) => { //id == yang akan di isi; value == nilai yang ditampilkan

    // Mengambil elemen HTML berdasarkan ID yang diberikan.
    const element = document.getElementById(id);

    // Memeriksa apakah elemen HTML berhasil ditemukan.
    // Jika tidak ditemukan, hentikan fungsi.
    if (!element) {
      return;
    }

    // Mengubah nilai menjadi teks menggunakan String() dan menampilkan nilai pada elemen html (ID)
    element.textContent = String(value);
  };

  // Menampilkan jumlah seluruh pengajuan prestasi pada elemen dengan ID stat-total.
  // pengajuan.length digunakan untuk menghitung jumlah data pengajuan.
  setStatValue("stat-total", pengajuan.length);

  // Menghitung jumlah prestasi dengan status Terverifikasi.
  // Hasil perhitungan ditampilkan pada elemen dengan ID stat-verified.
  setStatValue("stat-verified", prestasi.hitungStatus("Terverifikasi"));

  // Menghitung jumlah prestasi dengan status Perlu Perbaikan.
  // Hasil perhitungan ditampilkan pada elemen dengan ID stat-revision.
  setStatValue("stat-revision", prestasi.hitungStatus("Perlu Perbaikan"));

// Menutup fungsi utama sekaligus langsung menjalankannya.
})();
