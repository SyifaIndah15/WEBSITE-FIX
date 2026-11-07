(() => {
  const toggles = document.querySelectorAll(".password-toggle");

  toggles.forEach((toggle) => {
    const field = toggle.closest(".input-field");
    const input = field ? field.querySelector("input.input-control") : null;

    if (!input) {
      return;
    }

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

  const forgotIdentityMahasiswa = document.getElementById("forgot-identity-mahasiswa");
  const forgotSummaryIdentityMahasiswa = document.getElementById("forgot-summary-identity-mahasiswa");
  const forgotMahasiswaSuccess = document.getElementById("forgot-mahasiswa-success");

  const updateForgotSummaryIdentityMahasiswa = () => {
    if (!forgotIdentityMahasiswa || !forgotSummaryIdentityMahasiswa) {
      return;
    }

    forgotSummaryIdentityMahasiswa.textContent = forgotIdentityMahasiswa.value.trim();
  };

  if (forgotMahasiswaSuccess) {
    forgotMahasiswaSuccess.addEventListener("change", updateForgotSummaryIdentityMahasiswa);
  }

  const forgotIdentityDosen = document.getElementById("forgot-identity-dosen");
  const forgotSummaryIdentityDosen = document.getElementById("forgot-summary-identity-dosen");
  const forgotDosenSuccess = document.getElementById("forgot-dosen-success");

  const updateForgotSummaryIdentityDosen = () => {
    if (!forgotIdentityDosen || !forgotSummaryIdentityDosen) {
      return;
    }

    forgotSummaryIdentityDosen.textContent = forgotIdentityDosen.value.trim();
  };

  if (forgotDosenSuccess) {
    forgotDosenSuccess.addEventListener("change", updateForgotSummaryIdentityDosen);
  }
})();
