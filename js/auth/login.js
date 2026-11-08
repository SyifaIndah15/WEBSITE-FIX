
(() => {
  // 1. FITUR TAMPIL / SEMBUNYIKAN PASSWORD
  const toggles = document.querySelectorAll(".password-toggle");

  toggles.forEach((toggle) => {
    const field = toggle.closest(".input-field");
    const input = field ? field.querySelector("input.input-control") : null;

    if (!input) return;

    toggle.style.pointerEvents = "auto";
    toggle.style.cursor = "pointer";
    toggle.removeAttribute("aria-hidden");
    toggle.setAttribute("role", "button");
    toggle.setAttribute("tabindex", "0");
    toggle.setAttribute("aria-controls", input.id);
    toggle.setAttribute("aria-label", "Tampilkan password");
    toggle.setAttribute("aria-pressed", "false");

    const togglePassword = () => {
      const showPassword = input.type === "password";
      input.type = showPassword ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(showPassword));
      toggle.setAttribute(
        "aria-label",
        showPassword ? "Sembunyikan password" : "Tampilkan password"
      );
    };

    toggle.addEventListener("click", togglePassword);

    toggle.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      togglePassword();
    });
  });

  // 2. FUNGSI BANTU VALIDASI
  const showError = (input, error, message) => {
    input.setAttribute("aria-invalid", "true");
    error.textContent = message;
    error.hidden = false;
  };

  const clearError = (input, error) => {
    input.removeAttribute("aria-invalid");
    error.textContent = "";
    error.hidden = true;
  };

  const revalidateOnInput = (input, validate) => {
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") !== "true") return;
      validate();
    });
  };

  // 3. VALIDASI LOGIN MAHASISWA
  const NPM_LENGTH = 11;
  const mahasiswaForm = document.querySelector(".login-form--mahasiswa");

  if (mahasiswaForm) {
    const npmInput = mahasiswaForm.querySelector("#identity-mahasiswa");
    const passwordInput = mahasiswaForm.querySelector("#password-mahasiswa");
    const npmError = mahasiswaForm.querySelector("#error-identity-mahasiswa");
    const passwordError = mahasiswaForm.querySelector("#error-password-mahasiswa");

    if (npmInput && passwordInput && npmError && passwordError) {
      mahasiswaForm.noValidate = true;

      const validateNpm = () => {
        const value = npmInput.value;

        if (!value) {
          showError(npmInput, npmError, "NPM wajib diisi.");
          return false;
        }

        if (!/^[0-9]+$/.test(value)) {
          showError(npmInput, npmError, "NPM hanya boleh berisi angka 0–9.");
          return false;
        }

        if (value.length !== NPM_LENGTH) {
          showError(npmInput, npmError, `NPM harus terdiri dari ${NPM_LENGTH} angka.`);
          return false;
        }

        clearError(npmInput, npmError);
        return true;
      };

      const validatePassword = () => {
        if (!passwordInput.value) {
          showError(passwordInput, passwordError, "Password wajib diisi.");
          return false;
        }

        clearError(passwordInput, passwordError);
        return true;
      };

      revalidateOnInput(npmInput, validateNpm);
      revalidateOnInput(passwordInput, validatePassword);

      mahasiswaForm.addEventListener("submit", (event) => {
        const npmValid = validateNpm();
        const passwordValid = validatePassword();

        event.preventDefault();

        if (!npmValid || !passwordValid) {
          if (!npmValid) {
            npmInput.focus();
          } else {
            passwordInput.focus();
          }
          return;
        }

        const params = new URLSearchParams();

        new FormData(mahasiswaForm).forEach((value, key) => {
          if (key !== passwordInput.name) {
            params.append(key, value);
          }
        });

        const action = mahasiswaForm.getAttribute("action") || "";
        const query = params.toString();

        window.location.assign(query ? `${action}?${query}` : action);
      });
    }
  }

  // 4. VALIDASI LOGIN DOSEN
  const NIDN_LENGTH = 10;
  const dosenForm = document.querySelector(".login-form--dosen");

  if (dosenForm) {
    const nidnInput = dosenForm.querySelector("#nidn");
    const dosenPasswordInput = dosenForm.querySelector("#password-dosen");
    const nidnError = dosenForm.querySelector("#error-nidn");
    const dosenPasswordError = dosenForm.querySelector("#error-password-dosen");

    if (nidnInput && dosenPasswordInput && nidnError && dosenPasswordError) {
      dosenForm.noValidate = true;

      const validateNidn = () => {
        const value = nidnInput.value;

        if (!value) {
          showError(nidnInput, nidnError, "NIDN wajib diisi.");
          return false;
        }

        if (!/^[0-9]+$/.test(value)) {
          showError(nidnInput, nidnError, "NIDN hanya boleh berisi angka 0–9.");
          return false;
        }

        if (value.length !== NIDN_LENGTH) {
          showError(nidnInput, nidnError, `NIDN harus terdiri dari ${NIDN_LENGTH} digit.`);
          return false;
        }

        clearError(nidnInput, nidnError);
        return true;
      };

      const validateDosenPassword = () => {
        if (!dosenPasswordInput.value) {
          showError(dosenPasswordInput, dosenPasswordError, "Password wajib diisi.");
          return false;
        }

        clearError(dosenPasswordInput, dosenPasswordError);
        return true;
      };

      revalidateOnInput(nidnInput, validateNidn);
      revalidateOnInput(dosenPasswordInput, validateDosenPassword);

      dosenForm.addEventListener("submit", (event) => {
        const nidnValid = validateNidn();
        const passwordValid = validateDosenPassword();

        if (!nidnValid || !passwordValid) {
          event.preventDefault();

          if (!nidnValid) {
            nidnInput.focus();
          } else {
            dosenPasswordInput.focus();
          }
        }
      });
    }
  }

  // 5. RINGKASAN IDENTITAS PEMULIHAN MAHASISWA
  const forgotIdentityMahasiswa = document.getElementById("forgot-identity-mahasiswa");
  const forgotSummaryIdentityMahasiswa = document.getElementById("forgot-summary-identity-mahasiswa");
  const forgotMahasiswaSuccess = document.getElementById("forgot-mahasiswa-success");

  const updateForgotSummaryIdentityMahasiswa = () => {
    if (!forgotIdentityMahasiswa || !forgotSummaryIdentityMahasiswa) return;

    forgotSummaryIdentityMahasiswa.textContent =
      forgotIdentityMahasiswa.value.trim();
  };

  if (forgotMahasiswaSuccess) {
    forgotMahasiswaSuccess.addEventListener(
      "change",
      updateForgotSummaryIdentityMahasiswa
    );
  }

  // 6. RINGKASAN IDENTITAS PEMULIHAN DOSEN
  const forgotIdentityDosen = document.getElementById("forgot-identity-dosen");
  const forgotSummaryIdentityDosen = document.getElementById("forgot-summary-identity-dosen");
  const forgotDosenSuccess = document.getElementById("forgot-dosen-success");

  const updateForgotSummaryIdentityDosen = () => {
    if (!forgotIdentityDosen || !forgotSummaryIdentityDosen) return;

    forgotSummaryIdentityDosen.textContent =
      forgotIdentityDosen.value.trim();
  };

  if (forgotDosenSuccess) {
    forgotDosenSuccess.addEventListener(
      "change",
      updateForgotSummaryIdentityDosen
    );
  }
})();
