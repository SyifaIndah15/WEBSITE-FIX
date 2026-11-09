(() => {
  const { showError, clearError, revalidateOnInput, validatePassword } = window.LoginUtils;

  // 4. VALIDASI LOGIN DOSEN
  // Menentukan panjang NIDN yang diwajibkan, yaitu 10 angka.
  const NIDN_LENGTH = 10;

  // Mengambil formulir Login khusus Dosen berdasarkan class HTML-nya.
  const dosenForm = document.querySelector(".login-form--dosen");

  // Memeriksa apakah formulir Login Dosen berhasil ditemukan.
  if (dosenForm) {

    // Mengambil kolom input NIDN Dosen berdasarkan ID HTML.
    const nidnInput = dosenForm.querySelector("#nidn");

    // Mengambil kolom input password Dosen berdasarkan ID HTML.
    const dosenPasswordInput = dosenForm.querySelector("#password-dosen");

    // Mengambil elemen HTML untuk menampilkan pesan kesalahan NIDN.
    const nidnError = dosenForm.querySelector("#error-nidn");

    // Mengambil elemen HTML untuk menampilkan pesan kesalahan password Dosen.
    const dosenPasswordError = dosenForm.querySelector("#error-password-dosen");

    // Memastikan seluruh elemen yang diperlukan berhasil ditemukan.
    if (nidnInput && dosenPasswordInput && nidnError && dosenPasswordError) {

      // Menonaktifkan validasi bawaan browser ketika formulir dikirim.
      // Pemeriksaan input akan dilakukan menggunakan JavaScript.
      dosenForm.noValidate = true;

      // Membuat fungsi untuk memeriksa apakah NIDN sudah sesuai aturan.
      function validateNidn() {

        // Mengambil isi NIDN yang dimasukkan oleh Dosen.
        const value = nidnInput.value;

        // Memeriksa apakah kolom NIDN masih kosong.
        if (!value) {

          // Menampilkan pesan bahwa NIDN wajib diisi.
          showError(nidnInput, nidnError, "NIDN wajib diisi.");

          // Mengembalikan false karena NIDN belum valid.
          return false;
        }

        // Memeriksa apakah NIDN hanya terdiri dari angka 0 sampai 9.
        if (!/^[0-9]+$/.test(value)) {

          // Menampilkan pesan bahwa NIDN hanya boleh berisi angka.
          showError(nidnInput, nidnError, "NIDN hanya boleh berisi angka 0–9.");

          // Mengembalikan false karena NIDN mengandung karakter yang salah.
          return false;
        }

        // Memeriksa apakah panjang NIDN sudah tepat 10 digit.
        if (value.length !== NIDN_LENGTH) {

          // Menampilkan pesan bahwa NIDN harus terdiri dari 10 digit.
          showError(nidnInput, nidnError, `NIDN harus terdiri dari ${NIDN_LENGTH} digit.`);

          // Mengembalikan false karena jumlah digit NIDN tidak sesuai.
          return false;
        }

        // Menghapus pesan kesalahan jika NIDN sudah memenuhi semua aturan.
        clearError(nidnInput, nidnError);

        // Mengembalikan true karena NIDN sudah valid.
        return true;
      }

      // Membuat fungsi untuk memeriksa password Dosen.
      function validateDosenPassword() {

        // Menggunakan fungsi validasi password yang sudah dibuat sebelumnya.
        return validatePassword(dosenPasswordInput, dosenPasswordError);
      }

      // Memeriksa kembali NIDN ketika pengguna mengetik jika sebelumnya salah.
      revalidateOnInput(nidnInput, validateNidn);

      // Memeriksa kembali password Dosen ketika pengguna mengetik jika sebelumnya salah.
      revalidateOnInput(dosenPasswordInput, validateDosenPassword);

      // Menjalankan proses ketika formulir Login Dosen dikirim.
      dosenForm.addEventListener("submit", (event) => {

        // Memeriksa apakah NIDN sudah valid.
        const nidnValid = validateNidn();

        // Memeriksa apakah password Dosen sudah valid.
        const passwordValid = validateDosenPassword();

        // Memeriksa apakah terdapat NIDN atau password yang tidak valid.
        if (!nidnValid || !passwordValid) {

          // Mencegah formulir dikirim jika masih terdapat kesalahan.
          event.preventDefault();

          // Jika NIDN salah, arahkan kursor ke kolom NIDN.
          if (!nidnValid) nidnInput.focus();

          // Jika NIDN benar tetapi password salah, arahkan kursor ke kolom password.
          else dosenPasswordInput.focus();
        }
      });
    }
  }


  // ==========================================
  // 7. RINGKASAN IDENTITAS PEMULIHAN DOSEN
  // ==========================================

  // Mengambil kolom input NIDN pada formulir Lupa Password Dosen.
  const forgotIdentityDosen = document.getElementById("forgot-identity-dosen");

  // Mengambil elemen HTML tempat menampilkan NIDN pada ringkasan pemulihan.
  const forgotSummaryIdentityDosen = document.getElementById("forgot-summary-identity-dosen");

  // Mengambil elemen radio button yang menandakan tampilan pemulihan Dosen berhasil.
  const forgotDosenSuccess = document.getElementById("forgot-dosen-success");

  // Membuat fungsi untuk memperbarui NIDN pada ringkasan pemulihan Dosen.
  function updateForgotSummaryIdentityDosen() {

    // Memeriksa apakah kolom NIDN dan tempat ringkasan berhasil ditemukan.
    // Jika salah satunya tidak ditemukan, hentikan fungsi.
    if (!forgotIdentityDosen || !forgotSummaryIdentityDosen) return;

    // Mengambil NIDN yang dimasukkan pengguna.
    // trim() menghapus spasi di awal dan akhir NIDN.
    // textContent menampilkan NIDN tersebut pada bagian ringkasan pemulihan.
    forgotSummaryIdentityDosen.textContent = forgotIdentityDosen.value.trim();
  }

  // Memeriksa apakah elemen tampilan pemulihan Dosen berhasil ditemukan.
  if (forgotDosenSuccess) {

    // Menjalankan fungsi pembaruan ringkasan ketika kondisi radio button berubah.
    // Contohnya ketika pengguna memilih tampilan permintaan berhasil dikirim.
    forgotDosenSuccess.addEventListener(
      "change",
      updateForgotSummaryIdentityDosen
    );
  }

})();
