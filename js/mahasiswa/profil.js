(() => {
  const form = document.getElementById("password-form");

  if (!form) {
    return;
  }

  const fields = [
    {
      input: document.getElementById("old-password"),
      error: document.getElementById("old-password-error"),
    },
    {
      input: document.getElementById("new-password"),
      error: document.getElementById("new-password-error"),
    },
    {
      input: document.getElementById("confirm-password"),
      error: document.getElementById("confirm-password-error"),
    },
  ];

  const toggles = Array.from(form.querySelectorAll(".password-toggle"));

  const getToggleInput = (toggle) => {
    const control = toggle.closest(".password-control");
    return control ? control.querySelector(".password-input") : null;
  };

  const setFieldError = (field, message) => {
    if (!field.input || !field.error) {
      return;
    }

    field.input.classList.add("is-invalid");
    field.input.setAttribute("aria-invalid", "true");
    field.error.textContent = message;
    field.error.style.display = "block";
  };

  const clearFieldError = (field) => {
    if (!field.input || !field.error) {
      return;
    }

    field.input.classList.remove("is-invalid");
    field.input.removeAttribute("aria-invalid");
    field.error.style.display = "";
  };

  const resetPasswordVisibility = () => {
    toggles.forEach((toggle) => {
      const input = getToggleInput(toggle);

      if (!input) {
        return;
      }

      input.type = "password";
      toggle.classList.remove("is-visible");
      toggle.setAttribute("aria-pressed", "false");
      toggle.setAttribute("aria-label", "Tampilkan password");
    });
  };

  fields.forEach((field) => {
    if (!field.input) {
      return;
    }

    field.input.addEventListener("input", () => {
      clearFieldError(field);
    });
  });

  toggles.forEach((toggle) => {
    const input = getToggleInput(toggle);

    if (!input) {
      return;
    }

    toggle.classList.remove("password-toggle--static");
    toggle.style.pointerEvents = "";
    toggle.style.cursor = "";
    toggle.removeAttribute("aria-hidden");
    toggle.setAttribute("role", "button");
    toggle.setAttribute("tabindex", "0");
    toggle.setAttribute("aria-controls", input.id);
    toggle.setAttribute("aria-label", "Tampilkan password");
    toggle.setAttribute("aria-pressed", "false");

    const togglePassword = () => {
      const showPassword = input.type === "password";

      input.type = showPassword ? "text" : "password";
      toggle.classList.toggle("is-visible", showPassword);
      toggle.setAttribute("aria-pressed", String(showPassword));
      toggle.setAttribute("aria-label", showPassword ? "Sembunyikan password" : "Tampilkan password");
    };

    toggle.addEventListener("click", togglePassword);
    toggle.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      togglePassword();
    });
  });

  const validate = () => {
    const oldPassword = fields[0].input ? fields[0].input.value : "";
    const newPassword = fields[1].input ? fields[1].input.value : "";
    const confirmPassword = fields[2].input ? fields[2].input.value : "";
    let firstInvalidInput = null;

    if (oldPassword.trim() === "") {
      setFieldError(fields[0], "Password lama wajib diisi.");
      firstInvalidInput = firstInvalidInput || fields[0].input;
    } else {
      clearFieldError(fields[0]);
    }

    if (newPassword.trim() === "") {
      setFieldError(fields[1], "Password baru wajib diisi.");
      firstInvalidInput = firstInvalidInput || fields[1].input;
    } else if (newPassword.length < 6) {
      setFieldError(fields[1], "Password baru minimal 6 karakter.");
      firstInvalidInput = firstInvalidInput || fields[1].input;
    } else {
      clearFieldError(fields[1]);
    }

    if (confirmPassword.trim() === "") {
      setFieldError(fields[2], "Konfirmasi password wajib diisi.");
      firstInvalidInput = firstInvalidInput || fields[2].input;
    } else if (confirmPassword !== newPassword) {
      setFieldError(fields[2], "Konfirmasi password baru tidak cocok.");
      firstInvalidInput = firstInvalidInput || fields[2].input;
    } else {
      clearFieldError(fields[2]);
    }

    return firstInvalidInput;
  };

  const showValidationNotice = () => {
    const notice = document.getElementById("password-success");

    if (!notice) {
      return;
    }

    const title = notice.querySelector(".profile-success-copy strong");
    const description = notice.querySelector(".profile-success-copy p");

    if (title) {
      title.textContent = "Validasi input berhasil.";
    }

    if (description) {
      description.textContent = "Seluruh input telah lolos validasi frontend. Verifikasi password lama dan penyimpanan password baru memerlukan integrasi backend pada tahap berikutnya.";
    }

    window.location.hash = "password-success";
    window.requestAnimationFrame(() => {
      notice.focus({ preventScroll: true });
    });
  };

  form.noValidate = true;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const firstInvalidInput = validate();

    if (firstInvalidInput) {
      firstInvalidInput.focus();
      return;
    }

    form.reset();
    resetPasswordVisibility();
    showValidationNotice();
  });
})();
