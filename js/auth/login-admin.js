(() => {
  const { showError, clearError, revalidateOnInput, validatePassword } = window.LoginUtils;

  // 5. VALIDASI LOGIN ADMIN
  // Mengambil formulir Login Admin berdasarkan class HTML-nya.
  const adminForm = document.querySelector(".login-form--admin");

  // Memeriksa apakah formulir Login Admin berhasil ditemukan.
  if (adminForm) {

    // Mengambil kolom input username Admin.
    const adminUsernameInput = adminForm.querySelector("#identity-admin");

    // Mengambil kolom input password Admin.
    const adminPasswordInput = adminForm.querySelector("#password-admin");

    // Mengambil elemen HTML untuk menampilkan pesan kesalahan username.
    const adminUsernameError = adminForm.querySelector("#error-identity-admin");

    // Mengambil elemen HTML untuk menampilkan pesan kesalahan password.
    const adminPasswordError = adminForm.querySelector("#error-password-admin");

    // Memastikan semua elemen yang diperlukan berhasil ditemukan.
    if (
      adminUsernameInput &&
      adminPasswordInput &&
      adminUsernameError &&
      adminPasswordError
    ) {

      // Menonaktifkan validasi bawaan browser ketika formulir dikirim.
      // Validasi akan dilakukan menggunakan fungsi JavaScript sendiri.
      adminForm.noValidate = true;

      // Membuat fungsi untuk memeriksa apakah username Admin sudah diisi.
      function validateAdminUsername() {

        // Memeriksa apakah kolom username masih kosong.
        if (!adminUsernameInput.value) {

          // Menampilkan pesan bahwa username wajib diisi.
          showError(adminUsernameInput, adminUsernameError, "Username wajib diisi.");

          // Mengembalikan false karena username belum valid.
          return false;
        }

        // Menghapus pesan kesalahan jika username sudah diisi.
        clearError(adminUsernameInput, adminUsernameError);

        // Mengembalikan true karena username sudah lolos pemeriksaan.
        return true;
      }

      // Membuat fungsi untuk memeriksa password Admin.
      function validateAdminPassword() {

        // Menggunakan fungsi validasi password yang sudah dibuat sebelumnya.
        return validatePassword(adminPasswordInput, adminPasswordError);
      }

      // Memeriksa kembali username ketika Admin mengetik jika sebelumnya salah.
      revalidateOnInput(adminUsernameInput, validateAdminUsername);

      // Memeriksa kembali password ketika Admin mengetik jika sebelumnya salah.
      revalidateOnInput(adminPasswordInput, validateAdminPassword);

      // Menjalankan proses validasi ketika formulir Login Admin dikirim.
      adminForm.addEventListener("submit", (event) => {

        // Memeriksa apakah username Admin sudah diisi dengan benar.
        const usernameValid = validateAdminUsername();

        // Memeriksa apakah password Admin sudah memenuhi aturan.
        const passwordValid = validateAdminPassword();

        // Memeriksa apakah username atau password masih tidak valid.
        if (!usernameValid || !passwordValid) {

          // Mencegah formulir dikirim jika terdapat kesalahan input.
          event.preventDefault();

          // Jika username salah, arahkan kursor ke kolom username.
          if (!usernameValid) adminUsernameInput.focus();

          // Jika username benar tetapi password salah, arahkan kursor ke kolom password.
          else adminPasswordInput.focus();
        }
      });
    }
  }

})();
