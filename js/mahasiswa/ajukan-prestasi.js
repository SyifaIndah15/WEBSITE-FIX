// Validasi formulir pengajuan prestasi mahasiswa.
(() => {
  const form = document.querySelector("#achievement-form");
  if (!form) return;

  // Cegah pemasangan event listener ganda pada formulir yang sama.
  if (form.dataset.validationBound === "true") return;
  form.dataset.validationBound = "true";

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const nameInput = form.querySelector("#nama-kompetisi");
  const nameError = form.querySelector("#nama-kompetisi-error");
  const institutionInput = form.querySelector("#instansi");
  const institutionError = form.querySelector("#instansi-error");
  const evidenceInput = form.querySelector("#evidence-file");
  const evidenceErrorTitle = form.querySelector("#evidence-file-error-title");
  const evidenceErrorDetail = form.querySelector("#evidence-file-error-detail");
  const uploadButton = form.querySelector(".upload-button");

  if (!nameInput || !institutionInput || !evidenceInput) return;

  const nameMessage = "Nama kompetisi atau kegiatan wajib diisi dan tidak boleh hanya berisi spasi.";
  const institutionMessage =
    "Instansi atau lembaga penyelenggara wajib diisi dan tidak boleh hanya berisi spasi.";

  const defaultEvidenceTitle = "Dokumen sertifikat wajib diunggah!";
  const defaultEvidenceDetail =
    "Pilih dokumen sertifikat atau bukti prestasi dalam format PDF.";

  form.noValidate = true;

  const showTextError = (input, error, message) => {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");

    if (error) {
      error.textContent = message;
    }
  };

  const clearTextError = (input) => {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
  };

  const showFileError = (title, detail) => {
    evidenceInput.classList.add("is-invalid");
    evidenceInput.setAttribute("aria-invalid", "true");
    evidenceInput.setCustomValidity(`${title} ${detail}`);

    if (uploadButton) {
      uploadButton.classList.add("is-invalid");
    }

    if (evidenceErrorTitle) {
      evidenceErrorTitle.textContent = title;
    }

    if (evidenceErrorDetail) {
      evidenceErrorDetail.textContent = detail;
    }
  };

  const clearFileError = () => {
    evidenceInput.classList.remove("is-invalid");
    evidenceInput.removeAttribute("aria-invalid");
    evidenceInput.setCustomValidity("");

    if (uploadButton) {
      uploadButton.classList.remove("is-invalid");
    }

    if (evidenceErrorTitle) {
      evidenceErrorTitle.textContent = defaultEvidenceTitle;
    }

    if (evidenceErrorDetail) {
      evidenceErrorDetail.textContent = defaultEvidenceDetail;
    }
  };

  const validateText = (input, error, message) => {
    if (!input.value.trim()) {
      showTextError(input, error, message);
      return false;
    }

    clearTextError(input);
    return true;
  };

  const validateEvidence = () => {
    const file = evidenceInput.files && evidenceInput.files[0];

    if (!file) {
      showFileError(defaultEvidenceTitle, defaultEvidenceDetail);
      return false;
    }

    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

    if (!isPdf) {
      showFileError(
        "Format berkas tidak sesuai!",
        "Dokumen sertifikat wajib menggunakan format PDF."
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      showFileError(
        "Ukuran berkas terlalu besar!",
        "Ukuran sertifikat maksimal 5 MB."
      );
      return false;
    }

    clearFileError();
    return true;
  };

  const revalidateTextOnInput = (input, error, message) => {
    input.addEventListener("input", () => {
      if (!input.classList.contains("is-invalid")) return;
      validateText(input, error, message);
    });
  };

  revalidateTextOnInput(nameInput, nameError, nameMessage);
  revalidateTextOnInput(institutionInput, institutionError, institutionMessage);

  evidenceInput.addEventListener("change", () => {
    if (!evidenceInput.classList.contains("is-invalid")) return;
    validateEvidence();
  });

  form.addEventListener("submit", (event) => {
    const nameValid = validateText(nameInput, nameError, nameMessage);
    const institutionValid = validateText(
      institutionInput,
      institutionError,
      institutionMessage
    );
    const evidenceValid = validateEvidence();

    if (nameValid && institutionValid && evidenceValid) return;

    event.preventDefault();

    if (!nameValid) {
      nameInput.focus();
    } else if (!institutionValid) {
      institutionInput.focus();
    } else {
      evidenceInput.focus();
    }
  });
})();
