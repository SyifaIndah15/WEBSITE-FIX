// Membuat fungsi utama yang langsung dijalankan ketika file JavaScript dibaca.
(() => {

  // Mengambil formulir ganti password berdasarkan ID password-form.
  const form = document.getElementById("password-form");

  // Memeriksa apakah formulir berhasil ditemukan.
  // Jika tidak ditemukan, hentikan seluruh proses.
  if (!form) {
    return;
  }

  // Mengambil kolom password lama dan tempat pesan kesalahannya.
  const oldPassword = {
    input: document.getElementById("old-password"),
    error: document.getElementById("old-password-error"),
  };

  // Mengambil kolom password baru dan tempat pesan kesalahannya.
  const newPassword = {
    input: document.getElementById("new-password"),
    error: document.getElementById("new-password-error"),
  };

  // Mengambil kolom konfirmasi password dan tempat pesan kesalahannya.
  const confirmPassword = {
    input: document.getElementById("confirm-password"),
    error: document.getElementById("confirm-password-error"),
  };

  // Mengumpulkan ketiga kelompok input agar dapat diproses bersama.
  const fields = [oldPassword, newPassword, confirmPassword];

  // Membuat fungsi untuk menampilkan pesan kesalahan pada suatu kolom.
  const showError = (field, message) => {

    // Memeriksa apakah kolom input atau tempat pesan kesalahan tidak ditemukan.
    if (!field.input || !field.error) {
      return;
    }

    // Menandai input agar tampil dengan border merah.
    field.input.classList.add("is-invalid");

    // Memberikan atribut yang menandakan input memiliki kesalahan.
    field.input.setAttribute("aria-invalid", "true");

    // Mengambil pembungkus kolom password.
    const fieldWrapper = field.input.closest(".password-field");

    // Menandai pembungkus agar pesan kesalahan dapat ditampilkan oleh CSS.
    if (fieldWrapper) {
      fieldWrapper.classList.add("is-invalid");
    }

    // Memasukkan pesan kesalahan sesuai kondisi input.
    field.error.textContent = message;

    // Membuat pesan kesalahan terlihat.
    field.error.hidden = false;
  };

  // Membuat fungsi untuk menghapus pesan kesalahan pada suatu kolom.
  const clearError = (field) => {

    // Memeriksa apakah kolom input atau tempat pesan kesalahan tidak ditemukan.
    if (!field.input || !field.error) {
      return;
    }

    // Menghapus tanda kesalahan pada input.
    field.input.classList.remove("is-invalid");

    // Menghapus atribut kesalahan pada input.
    field.input.removeAttribute("aria-invalid");

    // Mengambil pembungkus kolom password.
    const fieldWrapper = field.input.closest(".password-field");

    // Menghapus tanda kesalahan pada pembungkus.
    if (fieldWrapper) {
      fieldWrapper.classList.remove("is-invalid");
    }

    // Mengosongkan pesan kesalahan.
    field.error.textContent = "";

    // Menyembunyikan kembali pesan kesalahan.
    field.error.hidden = true;
  };

  // Menghapus pesan kesalahan ketika pengguna memperbaiki isi input.
  fields.forEach((field) => {

    // Memastikan kolom input berhasil ditemukan.
    if (!field.input) {
      return;
    }

    // Menjalankan proses ketika pengguna mengetik pada kolom tersebut.
    field.input.addEventListener("input", () => {
      clearError(field);
    });
  });

  // ==========================================
  // FITUR TAMPIL / SEMBUNYIKAN PASSWORD
  // ==========================================

  // Mengambil seluruh ikon mata di dalam formulir ganti password.
  const toggles = Array.from(form.querySelectorAll(".password-toggle"));

  // Mengulangi proses untuk setiap ikon mata yang ditemukan.
  toggles.forEach((toggle) => {

    // Mencari pembungkus kolom password terdekat dari ikon mata.
    const control = toggle.closest(".password-control");

    // Mengambil kolom password di dalam pembungkus tersebut.
    // Dengan cara ini, setiap ikon hanya mengontrol kolomnya sendiri.
    const input = control ? control.querySelector(".password-input") : null;

    // Jika kolom password tidak ditemukan, lanjutkan ke ikon berikutnya.
    if (!input) {
      return;
    }

    // Menghapus class yang membuat ikon tidak dapat diklik.
    toggle.classList.remove("password-toggle--static");

    // Menghapus aria-hidden agar ikon dapat dikenali pembaca layar.
    toggle.removeAttribute("aria-hidden");

    // Menjadikan ikon mata sebagai tombol.
    toggle.setAttribute("role", "button");

    // Membuat ikon mata dapat dipilih menggunakan tombol Tab.
    toggle.setAttribute("tabindex", "0");

    // Menghubungkan ikon mata dengan kolom password yang dikontrolnya.
    toggle.setAttribute("aria-controls", input.id);

    // Memberikan keterangan awal bahwa password masih tersembunyi.
    toggle.setAttribute("aria-label", "Tampilkan password");

    // Menandakan bahwa password sedang tidak ditampilkan.
    toggle.setAttribute("aria-pressed", "false");

    // Membuat fungsi untuk menampilkan atau menyembunyikan password.
    const togglePassword = () => {

      // Memeriksa apakah password saat ini masih tersembunyi.
      const showPassword = input.type === "password";

      // Mengubah tipe input agar password terlihat atau kembali tersembunyi.
      input.type = showPassword ? "text" : "password";

      // Memperbarui status tombol sesuai kondisi password.
      toggle.setAttribute("aria-pressed", String(showPassword));

      // Memperbarui keterangan tombol sesuai kondisi password.
      toggle.setAttribute(
        "aria-label",
        showPassword ? "Sembunyikan password" : "Tampilkan password"
      );
    };

    // Menjalankan fungsi ketika ikon mata diklik menggunakan mouse.
    toggle.addEventListener("click", togglePassword);

    // Menjalankan fungsi ketika ikon mata diaktifkan menggunakan keyboard.
    toggle.addEventListener("keydown", (event) => {

      // Memeriksa apakah tombol yang ditekan adalah Enter atau Spasi.
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      // Mencegah fungsi bawaan browser, seperti menggulir halaman.
      event.preventDefault();

      // Menjalankan fungsi untuk menampilkan atau menyembunyikan password.
      togglePassword();
    });
  });

  // Membuat fungsi untuk memeriksa seluruh input ganti password.
  const validate = () => {

    // Mengambil isi masing-masing kolom password.
    const oldValue = oldPassword.input ? oldPassword.input.value : "";
    const newValue = newPassword.input ? newPassword.input.value : "";
    const confirmValue = confirmPassword.input ? confirmPassword.input.value : "";

    // Menyiapkan tempat untuk kolom pertama yang mengalami kesalahan.
    let firstInvalidInput = null;

    // 1. Memeriksa apakah password lama kosong atau hanya berisi spasi.
    if (oldValue.trim() === "") {
      showError(oldPassword, "Password lama wajib diisi.");
      firstInvalidInput = firstInvalidInput || oldPassword.input;
    } else {
      clearError(oldPassword);
    }

    // 2. Memeriksa apakah password baru kosong atau hanya berisi spasi.
    if (newValue.trim() === "") {
      showError(newPassword, "Password baru wajib diisi.");
      firstInvalidInput = firstInvalidInput || newPassword.input;

    // 3. Memeriksa apakah password baru memiliki minimal 6 karakter.
    } else if (newValue.length < 6) {
      showError(newPassword, "Password baru minimal 6 karakter.");
      firstInvalidInput = firstInvalidInput || newPassword.input;
    } else {
      clearError(newPassword);
    }

    // 4. Memeriksa apakah konfirmasi password kosong atau hanya berisi spasi.
    if (confirmValue.trim() === "") {
      showError(confirmPassword, "Konfirmasi password wajib diisi.");
      firstInvalidInput = firstInvalidInput || confirmPassword.input;

    // 5. Memeriksa apakah konfirmasi password sama dengan password baru.
    } else if (confirmValue !== newValue) {
      showError(confirmPassword, "Konfirmasi password baru tidak cocok.");
      firstInvalidInput = firstInvalidInput || confirmPassword.input;
    } else {
      clearError(confirmPassword);
    }

    // Mengembalikan kolom pertama yang salah, atau null jika semua valid.
    return firstInvalidInput;
  };

  // Menonaktifkan validasi bawaan browser agar pesan diatur oleh JavaScript.
  form.noValidate = true;

  // Menjalankan validasi sebelum formulir diproses lebih lanjut.
  form.addEventListener("submit", (event) => {

    // Memeriksa seluruh input dan menyimpan kolom pertama yang salah.
    const firstInvalidInput = validate();

    // Jika ada input yang salah, hentikan proses pengiriman formulir.
    if (firstInvalidInput) {

      // Mencegah formulir diproses dan halaman berpindah ke tampilan berhasil.
      event.preventDefault();

      // Mengarahkan kursor ke kolom pertama yang mengalami kesalahan.
      firstInvalidInput.focus();
    }
  });

})();
