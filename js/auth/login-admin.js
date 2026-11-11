(() => {
  const { showError, clearError, revalidateOnInput, validatePassword } = window.LoginUtils;

  // 5. AUTENTIKASI LOGIN ADMIN
  const DATA_STORE_URL = new URL("../core/sipresma-data.js", document.currentScript.src).href;

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

      // Mencegah proses autentikasi dijalankan lebih dari satu kali.
      let isSubmitting = false;

      // Mengubah nilai menjadi teks tanpa spasi di awal dan akhir.
      function normalize(value) {
        return String(value == null ? "" : value).trim();
      }

      // Membuat fungsi untuk memeriksa apakah username Admin sudah diisi.
      function validateAdminUsername() {

        // Memeriksa apakah kolom username masih kosong atau hanya berisi spasi.
        if (!normalize(adminUsernameInput.value)) {

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

      // Menampilkan pesan kegagalan login tanpa membocorkan detail kredensial.
      function showLoginError(message) {
        showError(adminPasswordInput, adminPasswordError, message);
      }

      // Memeriksa username, password, role, dan status melalui store bersama.
      async function authenticateAdmin(username, password) {
        const store = await import(DATA_STORE_URL);

        if (store.getInitializationError()) {
          throw new Error("Data akun Admin tidak dapat dibaca.");
        }

        const result = store.authenticate("admin", username, password);
        if (!result.ok) return false;

        store.saveSession("admin", result.account);
        return true;
      }

      // Memeriksa kembali username ketika Admin mengetik jika sebelumnya salah.
      revalidateOnInput(adminUsernameInput, validateAdminUsername);

      // Memeriksa kembali password ketika Admin mengetik jika sebelumnya salah.
      revalidateOnInput(adminPasswordInput, validateAdminPassword);

      // Menjalankan proses autentikasi ketika formulir Login Admin dikirim.
      adminForm.addEventListener("submit", (event) => {

        // Selalu mencegah pengiriman form GET standar agar kredensial tidak masuk URL.
        event.preventDefault();

        // Menghentikan proses jika autentikasi sebelumnya masih berjalan.
        if (isSubmitting) return;

        // Memeriksa apakah username Admin sudah diisi dengan benar.
        const usernameValid = validateAdminUsername();

        // Memeriksa apakah password Admin sudah memenuhi aturan.
        const passwordValid = validateAdminPassword();

        // Memeriksa apakah username atau password masih tidak valid.
        if (!usernameValid || !passwordValid) {

          // Jika username salah, arahkan kursor ke kolom username.
          if (!usernameValid) adminUsernameInput.focus();

          // Jika username benar tetapi password salah, arahkan kursor ke kolom password.
          else adminPasswordInput.focus();

          // Menghentikan proses karena input belum lengkap.
          return;
        }

        // Mengambil nilai yang sudah lolos validasi input.
        const username = normalize(adminUsernameInput.value);
        const password = adminPasswordInput.value;

        // Menandai bahwa proses autentikasi sedang berjalan.
        isSubmitting = true;

        // Menjalankan autentikasi menggunakan data akun dari JSON.
        authenticateAdmin(username, password)
          .then((authenticated) => {

            // Menolak login jika akun tidak valid.
            if (!authenticated) {
              showLoginError("Username atau password salah.");
              adminPasswordInput.focus();
              return;
            }

            // Mengambil alamat Dashboard dari formulir yang sudah tersedia.
            const action = adminForm.getAttribute("action") || "pages/admin/dashboard.html";

            // Menuju Dashboard tanpa menyertakan username atau password pada URL.
            window.location.assign(action);
          })
          .catch(() => {

            // Menolak login jika JSON gagal dibaca atau diproses.
            showLoginError("Login gagal. Data akun Admin tidak dapat dibaca.");
            adminPasswordInput.focus();
          })
          .finally(() => {

            // Mengizinkan percobaan login berikutnya.
            isSubmitting = false;
          });
      });
    }
  }

})();
