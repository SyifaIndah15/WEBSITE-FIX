// Membuat fungsi utama yang langsung dijalankan ketika file JavaScript dibaca.
window.LoginUtils = (() => {

  // 1. FITUR TAMPIL / SEMBUNYIKAN PASSWORD
  
  // Mengambil semua elemen HTML yang memiliki class "password-toggle" (ikon mata).
  const toggles = document.querySelectorAll(".password-toggle");

  // Mengulangi proses untuk setiap ikon mata yang ditemukan.
  toggles.forEach((toggle) => {

    // Mencari elemen pembung kus terdekat dari ikon mata, yaitu input-field.
    const field = toggle.closest(".input-field");

    // Mengambil kolom input password di dalam pembungkus tersebut.
    // Jika field ditemukan, cari input dengan class input-control.
    // Jika tidak ditemukan, isi variabel input dengan null.
    const input = field ? field.querySelector("input.input-control") : null;

    // Memeriksa apakah kolom input berhasil ditemukan.
    // Jika tidak ditemukan, hentikan proses untuk ikon mata tersebut.
    if (!input) return;

    // Mengaktifkan fungsi klik pada ikon mata.
    toggle.style.pointerEvents = "auto";

    // Mengubah bentuk kursor menjadi tangan ketika diarahkan ke ikon mata.
    toggle.style.cursor = "pointer";

    // Menghapus atribut aria-hidden agar ikon dapat dikenali pembaca layar.
    toggle.removeAttribute("aria-hidden");

    // Memberikan peran button agar ikon dikenali sebagai tombol.
    toggle.setAttribute("role", "button");

    // Membuat ikon mata dapat dipilih menggunakan tombol Tab pada keyboard.
    toggle.setAttribute("tabindex", "0");

    // Menghubungkan ikon mata dengan kolom password berdasarkan ID input.
    toggle.setAttribute("aria-controls", input.id);

    // Memberikan keterangan bahwa ikon digunakan untuk menampilkan password.
    toggle.setAttribute("aria-label", "Tampilkan password");

    // Menandakan bahwa kondisi awal password masih tersembunyi.
    toggle.setAttribute("aria-pressed", "false");

    // Membuat fungsi untuk mengatur tampilan password.
    function togglePassword() {

      // Memeriksa apakah tipe input saat ini adalah password.
      if (input.type === "password") {

        // Mengubah tipe input menjadi text agar password dapat terlihat.
        input.type = "text";

        // Mengubah status menjadi true karena password sedang ditampilkan.
        toggle.setAttribute("aria-pressed", "true");

        // Mengubah keterangan ikon menjadi sembunyikan password.
        toggle.setAttribute("aria-label", "Sembunyikan password");

      } else {

        // Mengubah kembali tipe input menjadi password agar karakter tersembunyi.
        input.type = "password";

        // Mengubah status menjadi false karena password sudah disembunyikan.
        toggle.setAttribute("aria-pressed", "false");

        // Mengembalikan keterangan ikon menjadi tampilkan password.
        toggle.setAttribute("aria-label", "Tampilkan password");
      }
    }

    // Menjalankan fungsi togglePassword ketika ikon mata diklik menggunakan mouse.
    toggle.addEventListener("click", togglePassword);

    // Menambahkan event ketika pengguna menekan tombol pada keyboard.
    toggle.addEventListener("keydown", (event) => {

      // Memeriksa apakah tombol yang ditekan adalah Enter atau Spasi.
      if (event.key === "Enter" || event.key === " ") {

        // Mencegah fungsi bawaan tombol, seperti menggulir halaman ketika Spasi ditekan.
        event.preventDefault();

        // Menjalankan fungsi untuk menampilkan atau menyembunyikan password.
        togglePassword();
      }
    });
  });


  // ==========================================
  // 2. FUNGSI BANTU VALIDASI
  // ==========================================

  // Membuat fungsi untuk menampilkan pesan kesalahan pada kolom input.
  // input = kolom yang mengalami kesalahan.
  // error = tempat untuk menampilkan pesan kesalahan.
  // message = isi pesan kesalahan yang akan ditampilkan.
  function showError(input, error, message) {

    // Memberikan tanda bahwa kolom input memiliki kesalahan.
    input.setAttribute("aria-invalid", "true");

    // Memasukkan teks pesan kesalahan ke dalam elemen HTML.
    error.textContent = message;

    // Menampilkan pesan kesalahan yang sebelumnya disembunyikan.
    error.hidden = false;
  }

  // Membuat fungsi untuk menghapus pesan kesalahan ketika input sudah benar.
  function clearError(input, error) {

    // Menghapus tanda bahwa kolom input memiliki kesalahan.
    input.removeAttribute("aria-invalid");

    // Mengosongkan tulisan pesan kesalahan.
    error.textContent = "";

    // Menyembunyikan kembali elemen pesan kesalahan.
    error.hidden = true;
  }

  // Membuat fungsi untuk memeriksa kembali input ketika pengguna mengetik.
  // input = kolom yang akan diperiksa.
  // validate = fungsi validasi yang akan dijalankan.
  function revalidateOnInput(input, validate) {

    // Menjalankan proses ketika pengguna mengetik atau mengubah isi input.
    input.addEventListener("input", () => {

      // Memeriksa apakah input sebelumnya sudah ditandai memiliki kesalahan.
      // Jika iya, jalankan kembali fungsi validasi.
      if (input.getAttribute("aria-invalid") === "true") validate();
    });
  }

  // Menentukan aturan minimal panjang password untuk Mahasiswa, Dosen, dan Admin.
  // Nilai 6 berarti password harus memiliki minimal 6 karakter.
  const PASSWORD_MIN_LENGTH = 6;

  // Membuat fungsi untuk memeriksa apakah password sudah sesuai aturan.
  function validatePassword(input, error) {

    // Mengambil isi password yang dimasukkan oleh pengguna.
    const value = input.value;

    // Memeriksa apakah kolom password masih kosong.
    if (!value) {

      // Menampilkan pesan bahwa password wajib diisi.
      showError(input, error, "Password wajib diisi.");

      // Mengembalikan nilai false karena password belum valid.
      return false;
    }

    // Memeriksa apakah isi password hanya terdiri dari spasi.
    if (!value.trim()) {

      // Menampilkan pesan bahwa password tidak boleh hanya berisi spasi.
      showError(input, error, "Password tidak boleh hanya berisi spasi.");

      // Mengembalikan nilai false karena password tidak valid.
      return false;
    }

    // Memeriksa apakah panjang password kurang dari 6 karakter.
    if (value.length < PASSWORD_MIN_LENGTH) {

      // Menampilkan pesan bahwa password minimal harus 6 karakter.
      showError(input, error, `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`);

      // Mengembalikan nilai false karena password terlalu pendek.
      return false;
    }

    // Menghapus pesan kesalahan jika password sudah memenuhi semua aturan.
    clearError(input, error);

    // Mengembalikan nilai true karena password sudah valid.
    return true;
  }

  // ==========================================
  // 3. LABEL STATUS PERMINTAAN RESET PASSWORD
  // ==========================================

  // Pemetaan status permintaan reset password ke teks yang ditampilkan ke pengguna.
  const RESET_STATUS_LABELS = {
    Menunggu: "Menunggu Konfirmasi Admin",
    Diproses: "Sedang Diproses Admin",
    Selesai: "Selesai - Password Telah Direset",
    Ditolak: "Ditolak - Hubungi Admin"
  };

  // Mengubah kode status menjadi label yang mudah dipahami pengguna.
  function resetStatusLabel(status) {
    const value = String(status == null ? "" : status).trim();
    return RESET_STATUS_LABELS[value] || "Menunggu Konfirmasi Admin";
  }

  return {
    showError: showError,
    clearError: clearError,
    revalidateOnInput: revalidateOnInput,
    validatePassword: validatePassword,
    resetStatusLabel: resetStatusLabel,
    PASSWORD_MIN_LENGTH: PASSWORD_MIN_LENGTH
  };
})();
