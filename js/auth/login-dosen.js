(() => {
  const { showError, clearError, revalidateOnInput, validatePassword } = window.LoginUtils;

  // 4. VALIDASI LOGIN DOSEN
  // Menentukan panjang NIDN yang diwajibkan, yaitu 10 angka.
  const NIDN_LENGTH = 10;

  const DATA_STORE_URL = new URL("../core/sipresma-data.js", document.currentScript.src).href;

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

      let isSubmitting = false;

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

        // Mencegah formulir dikirim otomatis oleh browser.
        // Pengiriman diatur sendiri agar password tidak masuk ke URL.
        event.preventDefault();

        if (isSubmitting) return;

        // Memeriksa apakah NIDN sudah valid.
        const nidnValid = validateNidn();

        // Memeriksa apakah password Dosen sudah valid.
        const passwordValid = validateDosenPassword();

        // Memeriksa apakah terdapat NIDN atau password yang tidak valid.
        if (!nidnValid || !passwordValid) {

          // Jika NIDN salah, arahkan kursor ke kolom NIDN.
          if (!nidnValid) nidnInput.focus();

          // Jika NIDN benar tetapi password salah, arahkan kursor ke kolom password.
          else dosenPasswordInput.focus();

          // Menghentikan proses karena masih ada input yang tidak valid.
          return;
        }

        const nidn = nidnInput.value.trim();
        const password = dosenPasswordInput.value;
        isSubmitting = true;

        import(DATA_STORE_URL)
          .then((store) => {
            if (store.getInitializationError()) {
              throw new Error("Data akun Dosen tidak dapat dibaca.");
            }

            const result = store.authenticate("dosen", nidn, password);
            if (!result.ok) {
              showError(dosenPasswordInput, dosenPasswordError, result.message || "NIDN atau password salah.");
              dosenPasswordInput.focus();
              return;
            }

            store.saveSession("dosen", result.account);

            const params = new URLSearchParams();
            const formData = new FormData(dosenForm);

            formData.forEach((value, key) => {
              if (key !== dosenPasswordInput.name) params.append(key, value);
            });

            const action = dosenForm.getAttribute("action") || "";
            const query = params.toString();
            window.location.assign(query ? `${action}?${query}` : action);
          })
          .catch(() => {
            showError(dosenPasswordInput, dosenPasswordError, "Login gagal. Data akun Dosen tidak dapat dibaca.");
            dosenPasswordInput.focus();
          })
          .finally(() => {
            isSubmitting = false;
          });
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

  // ==========================================
  // 8. VALIDASI NIDN PADA LUPA PASSWORD DOSEN
  // ==========================================

  // Menentukan jumlah angka NIDN yang diwajibkan, yaitu 10 angka.
  const FORGOT_NIDN_LENGTH = 10;

  // Mengambil elemen pesan kesalahan NIDN pada formulir Lupa Password Dosen.
  const forgotIdentityErrorDosen = document.getElementById("forgot-identity-error-dosen");

  // Mengambil tombol Lanjutkan pada formulir Lupa Password Dosen.
  const forgotContinueDosen = document.querySelector(
    "#forgot-dosen .forgot-form .forgot-button--primary"
  );

  // Membuat fungsi untuk menampilkan pesan kesalahan NIDN Dosen.
  function showForgotNidnError(message) {

    // Menandai kolom NIDN memiliki kesalahan.
    forgotIdentityDosen.setAttribute("aria-invalid", "true");

    // Memasukkan pesan kesalahan yang sesuai dengan kondisi NIDN.
    forgotIdentityErrorDosen.textContent = message;

    // Menampilkan pesan kesalahan di bawah kolom NIDN.
    forgotIdentityErrorDosen.style.display = "block";
  }

  // Membuat fungsi untuk menghapus pesan kesalahan NIDN Dosen.
  function clearForgotNidnError() {

    // Menghapus tanda kesalahan pada kolom NIDN.
    forgotIdentityDosen.removeAttribute("aria-invalid");

    // Mengosongkan pesan kesalahan.
    forgotIdentityErrorDosen.textContent = "";

    // Menyembunyikan kembali pesan kesalahan.
    forgotIdentityErrorDosen.style.display = "none";
  }

  // Membuat fungsi untuk memeriksa NIDN pada formulir Lupa Password Dosen.
  function validateForgotIdentityDosen() {

    // Memastikan kolom NIDN dan pesan kesalahan berhasil ditemukan.
    if (!forgotIdentityDosen || !forgotIdentityErrorDosen) return false;

    // Mengambil isi NIDN yang dimasukkan pengguna.
    const value = forgotIdentityDosen.value;

    // 1. Memeriksa apakah NIDN kosong atau hanya berisi spasi.
    if (!value.trim()) {

      // Menampilkan pesan bahwa NIDN Dosen wajib diisi.
      showForgotNidnError("NIDN Dosen wajib diisi.");

      // Mengembalikan false karena NIDN belum valid.
      return false;
    }

    // 2. Memeriksa apakah seluruh karakter NIDN adalah angka 0 sampai 9.
    if (!/^[0-9]+$/.test(value)) {

      // Menampilkan pesan bahwa NIDN hanya boleh berisi angka.
      showForgotNidnError("NIDN hanya boleh berisi angka 0–9.");

      // Mengembalikan false karena NIDN mengandung karakter selain angka.
      return false;
    }

    // 3. Memeriksa apakah jumlah angka NIDN tepat 10 digit.
    if (value.length !== FORGOT_NIDN_LENGTH) {

      // Menampilkan pesan bahwa NIDN harus terdiri dari 10 angka.
      showForgotNidnError("NIDN harus terdiri dari 10 angka.");

      // Mengembalikan false karena jumlah angka NIDN tidak sesuai.
      return false;
    }

    // Menghapus pesan kesalahan jika NIDN sudah memenuhi semua aturan.
    clearForgotNidnError();

    // Mengembalikan true karena NIDN sudah valid.
    return true;
  }

  // Menjalankan validasi jika kolom NIDN dan pesan kesalahan berhasil ditemukan.
  if (forgotIdentityDosen && forgotIdentityErrorDosen) {

    // Memperbarui pesan kesalahan ketika pengguna memperbaiki input.
    revalidateOnInput(forgotIdentityDosen, validateForgotIdentityDosen);

    // Memeriksa NIDN ketika pengguna selesai mengisi kolom.
    forgotIdentityDosen.addEventListener("blur", () => {

      // Validasi hanya dijalankan jika kolom NIDN sudah berisi sesuatu.
      if (forgotIdentityDosen.value !== "") validateForgotIdentityDosen();
    });

    // Mencegah perpindahan ke tampilan berhasil jika NIDN belum valid.
    if (forgotContinueDosen) {
      forgotContinueDosen.addEventListener("click", (event) => {

        // Memeriksa NIDN sebelum pengguna melanjutkan proses.
        if (!validateForgotIdentityDosen()) {

          // Membatalkan perpindahan tampilan ketika NIDN tidak valid.
          event.preventDefault();

          // Mengarahkan kursor kembali ke kolom NIDN.
          forgotIdentityDosen.focus();
        }
      });
    }
  }

})();
