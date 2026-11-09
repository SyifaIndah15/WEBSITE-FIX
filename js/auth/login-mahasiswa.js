(() => {
  const { showError, clearError, revalidateOnInput, validatePassword } = window.LoginUtils;

  // Menentukan panjang NPM yang diwajibkan, yaitu 11 angka.
  const NPM_LENGTH = 11;

  // Mengambil formulir Login khusus Mahasiswa berdasarkan class HTML-nya.
  const mahasiswaForm = document.querySelector(".login-form--mahasiswa");

  // Memeriksa apakah formulir Mahasiswa berhasil ditemukan.
  if (mahasiswaForm) {

    // Mengambil kolom input NPM Mahasiswa berdasarkan ID HTML.
    const npmInput = mahasiswaForm.querySelector("#identity-mahasiswa");

    // Mengambil kolom input password Mahasiswa berdasarkan ID HTML.
    const passwordInput = mahasiswaForm.querySelector("#password-mahasiswa");

    // Mengambil elemen HTML untuk menampilkan kesalahan NPM.
    const npmError = mahasiswaForm.querySelector("#error-identity-mahasiswa");

    // Mengambil elemen HTML untuk menampilkan kesalahan password.
    const passwordError = mahasiswaForm.querySelector("#error-password-mahasiswa");

    // Memastikan semua elemen yang dibutuhkan berhasil ditemukan.
    if (npmInput && passwordInput && npmError && passwordError) {

      // Menonaktifkan validasi bawaan browser ketika formulir dikirim.
      // Validasi akan dilakukan menggunakan fungsi JavaScript sendiri.
      mahasiswaForm.noValidate = true;

      // Membuat fungsi untuk memeriksa apakah NPM sudah sesuai aturan.
      function validateNpm() {

        // Mengambil isi NPM yang dimasukkan oleh pengguna.
        const value = npmInput.value;

        // Memeriksa apakah kolom NPM masih kosong.
        if (!value) {

          // Menampilkan pesan bahwa NPM wajib diisi.
          showError(npmInput, npmError, "NPM wajib diisi.");

          // Mengembalikan false karena NPM belum valid.
          return false;
        }

        // Memeriksa apakah NPM hanya berisi angka dari 0 sampai 9.
        // Regex digunakan untuk memeriksa pola karakter yang dimasukkan.
        if (!/^[0-9]+$/.test(value)) {

          // Menampilkan pesan bahwa NPM hanya boleh berisi angka.
          showError(npmInput, npmError, "NPM hanya boleh berisi angka 0–9.");

          // Mengembalikan false karena NPM mengandung karakter yang tidak diperbolehkan.
          return false;
        }

        // Memeriksa apakah jumlah angka NPM sudah tepat 11 digit.
        if (value.length !== NPM_LENGTH) {

          // Menampilkan pesan bahwa NPM harus terdiri dari 11 angka.
          showError(npmInput, npmError, `NPM harus terdiri dari ${NPM_LENGTH} angka.`);

          // Mengembalikan false karena panjang NPM tidak sesuai.
          return false;
        }

        // Menghapus pesan kesalahan jika NPM sudah memenuhi semua aturan.
        clearError(npmInput, npmError);

        // Mengembalikan true karena NPM sudah valid.
        return true;
      }

      // Membuat fungsi untuk memeriksa password Mahasiswa.
      function validateMahasiswaPassword() {

        // Memanggil fungsi validasi password yang sudah dibuat sebelumnya.
        // Input dan pesan kesalahan yang digunakan khusus milik Mahasiswa.
        return validatePassword(passwordInput, passwordError);
      }

      // Memeriksa kembali NPM ketika pengguna mengetik jika sebelumnya terjadi kesalahan.
      revalidateOnInput(npmInput, validateNpm);

      // Memeriksa kembali password Mahasiswa ketika pengguna mengetik jika sebelumnya salah.
      revalidateOnInput(passwordInput, validateMahasiswaPassword);

      // Menjalankan proses validasi ketika formulir Login Mahasiswa dikirim.
      mahasiswaForm.addEventListener("submit", (event) => {

        // Memanggil fungsi validasi NPM dan menyimpan hasilnya.
        const npmValid = validateNpm();

        // Memanggil fungsi validasi password dan menyimpan hasilnya.
        const passwordValid = validateMahasiswaPassword();

        // Mencegah formulir dikirim secara otomatis oleh browser.
        // Pengiriman akan diatur sendiri setelah proses validasi selesai.
        event.preventDefault();

        // Memeriksa apakah NPM atau password masih memiliki kesalahan.
        if (!npmValid || !passwordValid) {

          // Jika NPM salah, arahkan kursor langsung ke kolom NPM.
          if (!npmValid) npmInput.focus();

          // Jika NPM benar tetapi password salah, arahkan kursor ke kolom password.
          else passwordInput.focus();

          // Menghentikan proses karena masih ada input yang tidak valid.
          return;
        }

        // Membuat tempat untuk menyusun parameter yang akan dimasukkan ke URL.
        const params = new URLSearchParams();

        // Mengambil seluruh data yang memiliki atribut name di dalam formulir.
        const formData = new FormData(mahasiswaForm);

        // Mengulangi setiap data formulir yang terdiri dari nama dan nilainya.
        formData.forEach((value, key) => {

          // Memeriksa apakah nama data bukan password.
          // Jika bukan password, data dimasukkan ke dalam parameter URL.
          if (key !== passwordInput.name) params.append(key, value);
        });

        // Mengambil alamat halaman tujuan dari atribut action pada formulir.
        // Jika action tidak ditemukan, gunakan teks kosong.
        const action = mahasiswaForm.getAttribute("action") || "";

        // Mengubah seluruh parameter yang sudah disusun menjadi teks URL.
        const query = params.toString();

        // Memeriksa apakah terdapat parameter yang akan dikirim ke halaman tujuan.
        if (query) window.location.assign(`${action}?${query}`);

        // Jika tidak ada parameter, langsung menuju halaman tujuan tanpa tambahan URL.
        else window.location.assign(action);
      });
    }
  }


  // ==========================================
  // 6. RINGKASAN IDENTITAS PEMULIHAN MAHASISWA
  // ==========================================

  // Mengambil kolom input NPM pada formulir Lupa Password Mahasiswa.
  const forgotIdentityMahasiswa = document.getElementById("forgot-identity-mahasiswa");

  // Mengambil elemen HTML tempat menampilkan NPM pada ringkasan pemulihan.
  const forgotSummaryIdentityMahasiswa = document.getElementById("forgot-summary-identity-mahasiswa");

  // Mengambil elemen radio button yang menandakan tampilan pemulihan berhasil.
  const forgotMahasiswaSuccess = document.getElementById("forgot-mahasiswa-success");

  // Membuat fungsi untuk memperbarui NPM pada ringkasan pemulihan Mahasiswa.
  function updateForgotSummaryIdentityMahasiswa() {

    // Memeriksa apakah kolom NPM dan tempat ringkasan berhasil ditemukan.
    // Jika salah satunya tidak ditemukan, hentikan fungsi.
    if (!forgotIdentityMahasiswa || !forgotSummaryIdentityMahasiswa) return;

    // Mengambil NPM yang dimasukkan pengguna.
    // trim() menghapus spasi di awal dan akhir NPM.
    // textContent menampilkan NPM tersebut pada bagian ringkasan pemulihan.
    forgotSummaryIdentityMahasiswa.textContent = forgotIdentityMahasiswa.value.trim();
  }

  // Memeriksa apakah elemen tampilan pemulihan berhasil ditemukan.
  if (forgotMahasiswaSuccess) {

    // Menjalankan fungsi pembaruan ringkasan ketika kondisi radio button berubah.
    // Contohnya ketika pengguna memilih tampilan permintaan berhasil dikirim.
    forgotMahasiswaSuccess.addEventListener(
      "change",
      updateForgotSummaryIdentityMahasiswa
    );
  }

})();
