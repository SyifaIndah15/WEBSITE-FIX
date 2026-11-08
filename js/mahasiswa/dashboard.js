// Membuat fungsi utama yang langsung dijalankan ketika file JavaScript dibaca.
(() => {

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
