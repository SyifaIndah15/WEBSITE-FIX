
// Membuat fungsi utama yang langsung dijalankan ketika file JavaScript dibaca.
(() => {

  // Mengambil formulir ganti password berdasarkan ID password-form.
  const form = document.getElementById("password-form");

  // Memeriksa apakah formulir berhasil ditemukan.
  // Jika tidak ditemukan, hentikan seluruh proses.
  if (!form) {
    return;
  }

  // Membuat array bernama fields yang berisi tiga kelompok input password.
  // Setiap kelompok memiliki kolom input dan tempat pesan kesalahan.
  const fields = [

    // Mengambil kolom password lama dan tempat pesan kesalahannya.
    {
      input: document.getElementById("old-password"),
      error: document.getElementById("old-password-error"),
    },

    // Mengambil kolom password baru dan tempat pesan kesalahannya.
    {
      input: document.getElementById("new-password"),
      error: document.getElementById("new-password-error"),
    },

    // Mengambil kolom konfirmasi password dan tempat pesan kesalahannya.
    {
      input: document.getElementById("confirm-password"),
      error: document.getElementById("confirm-password-error"),
    },
  ];

  // Mengambil seluruh elemen ikon mata pada formulir.
  // Array.from() mengubah hasil querySelectorAll menjadi array biasa.
  const toggles = Array.from(form.querySelectorAll(".password-toggle"));

  // Membuat fungsi untuk mengambil kolom input yang berpasangan dengan ikon mata.
  const getToggleInput = (toggle) => {

    // Mencari elemen pembungkus terdekat yang memiliki class password-control.
    const control = toggle.closest(".password-control");

    // Jika pembungkus ditemukan, ambil input dengan class password-input.
    // Jika tidak ditemukan, kembalikan nilai null.
    return control ? control.querySelector(".password-input") : null;
  };

  // Membuat fungsi untuk menampilkan pesan kesalahan pada suatu kolom password.
  // field berisi informasi kolom input dan tempat pesan kesalahannya.
  // message berisi teks pesan kesalahan yang ingin ditampilkan.
  const setFieldError = (field, message) => {

    // Memeriksa apakah kolom input atau tempat pesan kesalahan tidak ditemukan.
    if (!field.input || !field.error) {
      return;
    }

    // Menambahkan class is-invalid untuk menandai input yang salah.
    field.input.classList.add("is-invalid");

    // Memberikan atribut yang menandakan bahwa input memiliki kesalahan.
    field.input.setAttribute("aria-invalid", "true");

    // Menampilkan pesan kesalahan sesuai dengan kondisi input.
    field.error.textContent = message;

    // Mengatur agar elemen pesan kesalahan terlihat pada halaman.
    field.error.style.display = "block";
  };

  // Membuat fungsi untuk menghapus pesan kesalahan pada suatu kolom password.
  const clearFieldError = (field) => {

    // Memeriksa apakah kolom input atau tempat pesan kesalahan tidak ditemukan.
    if (!field.input || !field.error) {
      return;
    }

    // Menghapus class is-invalid karena kesalahan input sudah diperbaiki.
    field.input.classList.remove("is-invalid");

    // Menghapus atribut yang menandakan bahwa input memiliki kesalahan.
    field.input.removeAttribute("aria-invalid");

    // Mengembalikan pengaturan tampilan pesan kesalahan ke kondisi awal.
    field.error.style.display = "";
  };

  // Membuat fungsi untuk mengembalikan semua password ke kondisi tersembunyi.
  const resetPasswordVisibility = () => {

    // Mengulangi proses untuk setiap ikon mata yang tersedia.
    toggles.forEach((toggle) => {

      // Mengambil kolom password yang berpasangan dengan ikon mata.
      const input = getToggleInput(toggle);

      // Memeriksa apakah kolom password berhasil ditemukan.
      // Jika tidak ditemukan, lanjutkan ke ikon mata berikutnya.
      if (!input) {
        return;
      }

      // Mengubah tipe input menjadi password agar karakter disembunyikan.
      input.type = "password";

      // Mengubah status ikon mata menjadi false karena password tersembunyi.
      toggle.setAttribute("aria-pressed", "false");

      // Mengatur keterangan ikon mata menjadi tampilkan password.
      toggle.setAttribute("aria-label", "Tampilkan password");
    });
  };

  // Mengulangi proses untuk setiap kelompok input password dalam array fields.
  fields.forEach((field) => {

    // Memeriksa apakah kolom input berhasil ditemukan.
    // Jika tidak ditemukan, hentikan proses untuk kolom tersebut.
    if (!field.input) {
      return;
    }

    // Menambahkan event input yang berjalan ketika pengguna mengetik.
    field.input.addEventListener("input", () => {

      // Menghapus pesan kesalahan ketika pengguna mulai mengubah isi input.
      clearFieldError(field);
    });
  });

  // Mengulangi proses untuk setiap ikon mata pada formulir ganti password.
  toggles.forEach((toggle) => {

    // Mengambil kolom password yang berpasangan dengan ikon mata.
    const input = getToggleInput(toggle);

    // Memeriksa apakah kolom password berhasil ditemukan.
    // Jika tidak ditemukan, hentikan proses untuk ikon tersebut.
    if (!input) {
      return;
    }

    // Menghapus class password-toggle--static agar ikon dapat digunakan.
    toggle.classList.remove("password-toggle--static");

    // Mengembalikan pengaturan pointerEvents ke nilai bawaan CSS.
    toggle.style.pointerEvents = "";

    // Mengembalikan bentuk kursor ke pengaturan bawaan CSS.
    toggle.style.cursor = "";

    // Menghapus atribut aria-hidden agar ikon dapat dikenali pembaca layar.
    toggle.removeAttribute("aria-hidden");

    // Memberikan peran button agar ikon mata dikenali sebagai tombol.
    toggle.setAttribute("role", "button");

    // Membuat ikon mata dapat dipilih menggunakan tombol Tab pada keyboard.
    toggle.setAttribute("tabindex", "0");

    // Menghubungkan ikon mata dengan kolom password berdasarkan ID input.
    toggle.setAttribute("aria-controls", input.id);

    // Memberikan keterangan bahwa ikon digunakan untuk menampilkan password.
    toggle.setAttribute("aria-label", "Tampilkan password");

    // Menentukan kondisi awal bahwa password masih disembunyikan.
    toggle.setAttribute("aria-pressed", "false");

    // Membuat fungsi untuk menampilkan atau menyembunyikan password.
    const togglePassword = () => {

      // Memeriksa apakah tipe input saat ini adalah password.
      // Jika benar, berarti password masih disembunyikan.
      const showPassword = input.type === "password";

      // Jika showPassword bernilai true, ubah input menjadi text.
      // Jika false, ubah kembali menjadi password.
      input.type = showPassword ? "text" : "password";

      // Mengubah status ikon mata menjadi teks true atau false.
      toggle.setAttribute("aria-pressed", String(showPassword));

      // Mengubah keterangan ikon sesuai kondisi password.
      // Jika ditampilkan, tulis Sembunyikan password.
      // Jika disembunyikan, tulis Tampilkan password.
      toggle.setAttribute("aria-label", showPassword ? "Sembunyikan password" : "Tampilkan password");
    };

    // Menjalankan fungsi togglePassword ketika ikon mata diklik menggunakan mouse.
    toggle.addEventListener("click", togglePassword);

    // Menambahkan event ketika pengguna menekan tombol pada keyboard.
    toggle.addEventListener("keydown", (event) => {

      // Memeriksa apakah tombol yang ditekan bukan Enter dan bukan Spasi.
      // Jika keduanya tidak ditekan, hentikan proses.
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      // Mencegah fungsi bawaan tombol keyboard, seperti menggulir halaman.
      event.preventDefault();

      // Menjalankan fungsi untuk menampilkan atau menyembunyikan password.
      togglePassword();
    });
  });

  // Membuat fungsi utama untuk memeriksa seluruh input password.
  const validate = () => {

    // Mengambil isi password lama dari kolom pertama.
    // Jika kolom tidak ditemukan, gunakan teks kosong.
    const oldPassword = fields[0].input ? fields[0].input.value : "";

    // Mengambil isi password baru dari kolom kedua.
    // Jika kolom tidak ditemukan, gunakan teks kosong.
    const newPassword = fields[1].input ? fields[1].input.value : "";

    // Mengambil isi konfirmasi password dari kolom ketiga.
    // Jika kolom tidak ditemukan, gunakan teks kosong.
    const confirmPassword = fields[2].input ? fields[2].input.value : "";

    // Menyiapkan variabel untuk menyimpan kolom pertama yang mengalami kesalahan.
    // Nilai awal null berarti belum ada input yang dinyatakan salah.
    let firstInvalidInput = null;

    // Memeriksa apakah password lama kosong atau hanya berisi spasi.
    if (oldPassword.trim() === "") {

      // Menampilkan pesan kesalahan bahwa password lama wajib diisi.
      setFieldError(fields[0], "Password lama wajib diisi.");

      // Menyimpan kolom password lama sebagai input pertama yang salah.
      // Operator || mempertahankan input salah pertama yang sudah ditemukan.
      firstInvalidInput = firstInvalidInput || fields[0].input;

    } else {

      // Menghapus pesan kesalahan jika password lama sudah diisi.
      clearFieldError(fields[0]);
    }

    // Memeriksa apakah password baru kosong atau hanya berisi spasi.
    if (newPassword.trim() === "") {

      // Menampilkan pesan bahwa password baru wajib diisi.
      setFieldError(fields[1], "Password baru wajib diisi.");

      // Menyimpan kolom password baru jika belum ada input salah sebelumnya.
      firstInvalidInput = firstInvalidInput || fields[1].input;

    // Jika password baru tidak kosong, periksa panjang karakternya.
    } else if (newPassword.length < 6) {

      // Menampilkan pesan bahwa password baru minimal harus 6 karakter.
      setFieldError(fields[1], "Password baru minimal 6 karakter.");

      // Menyimpan kolom password baru jika menjadi input pertama yang salah.
      firstInvalidInput = firstInvalidInput || fields[1].input;

    } else {

      // Menghapus pesan kesalahan jika password baru sudah memenuhi aturan.
      clearFieldError(fields[1]);
    }

    // Memeriksa apakah kolom konfirmasi password kosong atau hanya berisi spasi.
    if (confirmPassword.trim() === "") {

      // Menampilkan pesan bahwa konfirmasi password wajib diisi.
      setFieldError(fields[2], "Konfirmasi password wajib diisi.");

      // Menyimpan kolom konfirmasi password jika belum ada input salah sebelumnya.
      firstInvalidInput = firstInvalidInput || fields[2].input;

    // Jika konfirmasi tidak kosong, periksa apakah isinya sama dengan password baru.
    } else if (confirmPassword !== newPassword) {

      // Menampilkan pesan bahwa konfirmasi password tidak cocok.
      setFieldError(fields[2], "Konfirmasi password baru tidak cocok.");

      // Menyimpan kolom konfirmasi password jika menjadi input pertama yang salah.
      firstInvalidInput = firstInvalidInput || fields[2].input;

    } else {

      // Menghapus pesan kesalahan jika konfirmasi password sudah sesuai.
      clearFieldError(fields[2]);
    }

    // Mengembalikan kolom pertama yang mengalami kesalahan.
    // Jika tidak ada kesalahan, nilai yang dikembalikan adalah null.
    return firstInvalidInput;
  };

  // Membuat fungsi untuk menampilkan pemberitahuan bahwa validasi berhasil.
  const showValidationNotice = () => {

    // Mengambil elemen pemberitahuan berhasil berdasarkan ID password-success.
    const notice = document.getElementById("password-success");

    // Memeriksa apakah elemen pemberitahuan berhasil ditemukan.
    // Jika tidak ditemukan, hentikan fungsi.
    if (!notice) {
      return;
    }

    // Mengambil elemen strong yang digunakan untuk menampilkan judul pemberitahuan.
    const title = notice.querySelector(".profile-success-copy strong");

    // Mengambil elemen paragraf yang digunakan untuk menampilkan penjelasan pemberitahuan.
    const description = notice.querySelector(".profile-success-copy p");

    // Memeriksa apakah elemen judul berhasil ditemukan.
    if (title) {

      // Mengubah judul pemberitahuan menjadi Validasi input berhasil.
      title.textContent = "Validasi input berhasil.";
    }

    // Memeriksa apakah elemen penjelasan berhasil ditemukan.
    if (description) {

      // Menampilkan penjelasan bahwa input sudah lolos validasi frontend.
      // Verifikasi password lama dan penyimpanan password baru masih memerlukan backend.
      description.textContent = "Seluruh input telah lolos validasi frontend. Verifikasi password lama dan penyimpanan password baru memerlukan integrasi backend pada tahap berikutnya.";
    }

    // Mengubah alamat bagian halaman agar mengarah ke elemen password-success.
    window.location.hash = "password-success";

    // Menjalankan fungsi berikutnya setelah browser menyelesaikan proses rendering.
    window.requestAnimationFrame(() => {

      // Mengarahkan fokus ke elemen pemberitahuan tanpa menggulir halaman secara otomatis.
      notice.focus({ preventScroll: true });
    });
  };

  // Menonaktifkan validasi bawaan browser ketika formulir dikirim.
  // Pemeriksaan input akan dilakukan menggunakan fungsi JavaScript sendiri.
  form.noValidate = true;

  // Menjalankan proses ketika pengguna mengirim formulir ganti password.
  form.addEventListener("submit", (event) => {

    // Mencegah formulir dikirim secara otomatis oleh browser.
    // Selanjutnya, JavaScript akan melakukan pemeriksaan input sendiri.
    event.preventDefault();

    // Memanggil fungsi validate() untuk memeriksa ketiga kolom password.
    // Hasilnya berupa kolom pertama yang salah atau null jika semuanya benar.
    const firstInvalidInput = validate();

    // Memeriksa apakah terdapat input yang tidak valid.
    if (firstInvalidInput) {

      // Mengarahkan kursor ke kolom pertama yang mengalami kesalahan.
      firstInvalidInput.focus();

      // Menghentikan proses karena masih ada input yang tidak valid.
      return;
    }

    // Mengosongkan kembali seluruh kolom formulir ke nilai awalnya.
    form.reset();

    // Mengembalikan semua kolom password ke kondisi tersembunyi.
    resetPasswordVisibility();

    // Menampilkan pemberitahuan bahwa seluruh input berhasil melewati validasi.
    showValidationNotice();

  });

// Menutup fungsi utama sekaligus langsung menjalankannya.
})();
