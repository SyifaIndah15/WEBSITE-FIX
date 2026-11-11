// Validasi dan interaksi ganti password pada halaman profil Administrator.
(() => {
  // Mengambil formulir ganti password yang sudah tersedia pada HTML.
  const form = document.getElementById("password-form");

  // Hentikan proses jika formulir tidak ditemukan pada halaman.
  if (!form) return;

  // Menyiapkan akses ke penyimpanan data bersama SIPRESMA.
  const DATA_STORE_URL = new URL("../core/sipresma-data.js", document.currentScript.src).href;
  let dataStorePromise = null;

  function getDataStore() {
    if (!dataStorePromise) {
      dataStorePromise = import(DATA_STORE_URL);
    }
    return dataStorePromise;
  }

  // Mengelompokkan setiap kolom password beserta tempat pesan kesalahannya.
  const oldPassword = {
    input: document.getElementById("old-password"),
    error: document.getElementById("old-password-error"),
  };

  const newPassword = {
    input: document.getElementById("new-password"),
    error: document.getElementById("new-password-error"),
  };

  const confirmPassword = {
    input: document.getElementById("confirm-password"),
    error: document.getElementById("confirm-password-error"),
  };

  // Menampilkan pesan kesalahan pada kolom yang bermasalah.
  function showError(field, message) {
    if (!field.input || !field.error) return;

    field.input.classList.add("is-invalid");
    field.input.setAttribute("aria-invalid", "true");

    const wrapper = field.input.closest(".password-field");
    if (wrapper) wrapper.classList.add("is-invalid");

    field.error.textContent = message;
    field.error.hidden = false;
  }

  // Menghapus pesan kesalahan ketika isi kolom sudah diperbaiki.
  function clearError(field) {
    if (!field.input || !field.error) return;

    field.input.classList.remove("is-invalid");
    field.input.removeAttribute("aria-invalid");

    const wrapper = field.input.closest(".password-field");
    if (wrapper) wrapper.classList.remove("is-invalid");

    field.error.textContent = "";
    field.error.hidden = true;
  }

  // Memeriksa password lama: wajib diisi dan tidak boleh hanya berisi spasi.
  function validateOldPassword() {
    const value = oldPassword.input ? oldPassword.input.value : "";

    if (value.trim() === "") {
      showError(oldPassword, "Password lama wajib diisi.");
      return oldPassword.input;
    }

    clearError(oldPassword);
    return null;
  }

  // Memeriksa password baru: wajib diisi dan minimal 6 karakter.
  function validateNewPassword() {
    const value = newPassword.input ? newPassword.input.value : "";

    if (value.trim() === "") {
      showError(newPassword, "Password baru wajib diisi.");
      return newPassword.input;
    }

    if (value.length < 6) {
      showError(newPassword, "Password baru minimal 6 karakter.");
      return newPassword.input;
    }

    clearError(newPassword);
    return null;
  }

  // Memeriksa konfirmasi: wajib diisi dan harus sama persis dengan password baru.
  function validateConfirmPassword() {
    const newValue = newPassword.input ? newPassword.input.value : "";
    const value = confirmPassword.input ? confirmPassword.input.value : "";

    if (value.trim() === "") {
      showError(confirmPassword, "Konfirmasi password wajib diisi.");
      return confirmPassword.input;
    }

    if (value !== newValue) {
      showError(confirmPassword, "Konfirmasi password baru tidak cocok.");
      return confirmPassword.input;
    }

    clearError(confirmPassword);
    return null;
  }

  // Memeriksa seluruh kolom dan mengembalikan kolom pertama yang salah.
  function validateAll() {
    const oldInvalid = validateOldPassword();
    const newInvalid = validateNewPassword();
    const confirmInvalid = validateConfirmPassword();

    return oldInvalid || newInvalid || confirmInvalid;
  }

  // Validasi live saat pengguna mengetik pada masing-masing kolom.
  if (oldPassword.input) {
    oldPassword.input.addEventListener("input", validateOldPassword);
  }

  if (newPassword.input) {
    newPassword.input.addEventListener("input", () => {
      validateNewPassword();

      // Periksa ulang konfirmasi jika sudah diisi agar kecocokan selalu terbaru.
      if (confirmPassword.input && confirmPassword.input.value !== "") {
        validateConfirmPassword();
      }
    });
  }

  if (confirmPassword.input) {
    confirmPassword.input.addEventListener("input", validateConfirmPassword);
  }

  // Mengaktifkan seluruh ikon mata yang tersedia pada formulir.
  const toggles = Array.from(form.querySelectorAll(".password-toggle"));

  toggles.forEach((toggle) => {
    const control = toggle.closest(".password-control");
    const input = control ? control.querySelector(".password-input") : null;

    // Ikon hanya mengontrol kolom password di pembungkus yang sama.
    if (!input) return;

    // Mengaktifkan ikon mata dan atribut aksesibilitasnya.
    toggle.classList.remove("password-toggle--static");
    toggle.removeAttribute("aria-hidden");
    toggle.setAttribute("role", "button");
    toggle.setAttribute("tabindex", "0");
    toggle.setAttribute("aria-controls", input.id);
    toggle.setAttribute("aria-label", "Tampilkan password");
    toggle.setAttribute("aria-pressed", "false");

    // Menampilkan atau menyembunyikan password pada kolom terkait saja.
    function togglePassword() {
      const showPassword = input.type === "password";

      input.type = showPassword ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(showPassword));
      toggle.setAttribute(
        "aria-label",
        showPassword ? "Sembunyikan password" : "Tampilkan password"
      );
    }

    // Klik ikon mata tidak boleh memicu pengiriman formulir.
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      togglePassword();
    });

    // Mendukung penggunaan tombol Enter dan Spasi dari keyboard.
    toggle.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      togglePassword();
    });
  });

  // Validasi JavaScript menggantikan validasi bawaan browser.
  form.noValidate = true;

  function showSuccessNotice() {
    const notice = document.getElementById("password-success");
    if (!notice) return;

    const title = notice.querySelector(".profile-success-copy strong");
    const description = notice.querySelector(".profile-success-copy p");

    if (title) title.textContent = "Password Berhasil Diperbarui!";
    if (description) {
      description.textContent = "Password akun Administrator Anda telah diperbarui dan dapat digunakan pada proses login berikutnya.";
    }

    window.location.hash = "password-success";
    window.requestAnimationFrame(function () {
      notice.focus({ preventScroll: true });
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const firstInvalidInput = validateAll();

    // Hentikan pengiriman jika masih ada kolom yang tidak valid.
    if (firstInvalidInput) {
      firstInvalidInput.focus();
      return;
    }

    const oldValue = oldPassword.input ? oldPassword.input.value : "";
    const newValue = newPassword.input ? newPassword.input.value : "";
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const store = await getDataStore();
      const session = store.getSession("admin");
      const username = session && session.username ? session.username : "admin";
      const result = store.changePassword("admin", username, oldValue, newValue);

      if (!result.ok) {
        showError(oldPassword, result.message);
        oldPassword.input.focus();
        return;
      }

      form.reset();
      showSuccessNotice();
    } catch (error) {
      console.error("Gagal memperbarui password Admin:", error);
      showError(oldPassword, "Password gagal diperbarui. Silakan coba lagi.");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
  getDataStore().then(function (store) {
    const session = store.getSession("admin");
    if (!session) return;

    const nameElement = document.querySelector(".profile-name");
    const metaItems = document.querySelectorAll(".profile-meta span:not(.profile-meta-dot)");
    const emailElement = document.querySelector(".profile-email");

    if (nameElement && (session.name || session.nama)) {
      nameElement.textContent = session.name || session.nama;
    }
    if (metaItems[0] && session.username) {
      metaItems[0].textContent = `Username: ${session.username}`;
    }
    if (emailElement && session.email) {
      emailElement.textContent = session.email;
    }
  }).catch(function (error) {
    console.error("Identitas profil Admin gagal dimuat:", error);
  });

})();
