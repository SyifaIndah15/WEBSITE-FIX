// file ini digunakan untuk memvalidasi formulir pengajuan prestasi mahasiswa.
// Membuat fungsi utama yang langsung dijalankan ketika file JavaScript dibaca.
(() => {

  // Mengambil formulir pengajuan prestasi berdasarkan ID achievement-form.
  const form = document.querySelector("#achievement-form");

  // Memeriksa apakah formulir ditemukan. Jika tidak, hentikan seluruh proses.
  if (!form) return;

  // Memeriksa apakah validasi sudah pernah dipasang pada formulir ini.
  // Tujuannya agar event listener tidak dipasang berulang kali.
  if (form.dataset.validationBound === "true") return;

  // Memberikan tanda bahwa validasi sudah dipasang pada formulir.
  form.dataset.validationBound = "true";

  // Menentukan ukuran maksimal dokumen yang boleh diunggah, yaitu 5 MB.
  // 1024 * 1024 digunakan untuk menghitung ukuran 1 MB dalam satuan byte.
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Menyiapkan akses ke penyimpanan data bersama SIPRESMA.
  const DATA_STORE_URL = new URL("../core/sipresma-data.js", document.currentScript.src).href;
  let dataStorePromise = null;

  function getDataStore() {
    if (!dataStorePromise) {
      dataStorePromise = import(DATA_STORE_URL);
    }
    return dataStorePromise;
  }

  // Mengambil kolom input nama kompetisi berdasarkan ID HTML.
  const nameInput = form.querySelector("#nama-kompetisi");

  // Mengambil elemen HTML untuk menampilkan pesan kesalahan nama kompetisi.
  const nameError = form.querySelector("#nama-kompetisi-error");

  // Mengambil kolom input instansi atau lembaga penyelenggara.
  const institutionInput = form.querySelector("#instansi");

  // Mengambil elemen HTML untuk menampilkan pesan kesalahan instansi.
  const institutionError = form.querySelector("#instansi-error");

  // Mengambil kolom input untuk mengunggah dokumen sertifikat.
  const evidenceInput = form.querySelector("#evidence-file");

  // Mengambil elemen HTML untuk menampilkan judul kesalahan dokumen.
  const evidenceErrorTitle = form.querySelector("#evidence-file-error-title");

  // Mengambil elemen HTML untuk menampilkan penjelasan kesalahan dokumen.
  const evidenceErrorDetail = form.querySelector("#evidence-file-error-detail");

  // Mengambil tombol yang digunakan untuk mengunggah dokumen sertifikat.
  const uploadButton = form.querySelector(".upload-button");

  // Memastikan kolom nama kompetisi, instansi, dan dokumen berhasil ditemukan.
  // Jika salah satu tidak ditemukan, hentikan proses validasi.
  if (!nameInput || !institutionInput || !evidenceInput) return;

  // Membuat pesan kesalahan jika nama kompetisi kosong atau hanya berisi spasi.
  const nameMessage = "Nama kompetisi atau kegiatan wajib diisi dan tidak boleh hanya berisi spasi.";

  // Membuat pesan kesalahan jika instansi kosong atau hanya berisi spasi.
  const institutionMessage =
    "Instansi atau lembaga penyelenggara wajib diisi dan tidak boleh hanya berisi spasi.";

  // Menentukan judul pesan kesalahan bawaan ketika dokumen belum diunggah.
  const defaultEvidenceTitle = "Dokumen sertifikat wajib diunggah!";

  // Menentukan penjelasan pesan kesalahan bawaan untuk dokumen sertifikat.
  const defaultEvidenceDetail =
    "Pilih dokumen sertifikat atau bukti prestasi dalam format PDF.";

  // Menonaktifkan validasi bawaan browser ketika formulir dikirim.
  // Selanjutnya, pemeriksaan input dilakukan menggunakan JavaScript.
  form.noValidate = true;

  // Membuat fungsi untuk menampilkan pesan kesalahan pada input teks.
  // input adalah kolom yang mengalami kesalahan.
  // error adalah tempat menampilkan pesan kesalahan.
  // message adalah isi pesan yang ingin ditampilkan.
  const showTextError = (input, error, message) => {

    // Menambahkan class is-invalid agar kolom input ditandai tidak valid.
    input.classList.add("is-invalid");

    // Memberikan atribut yang menandakan bahwa input memiliki kesalahan.
    input.setAttribute("aria-invalid", "true");

    // Memeriksa apakah elemen pesan kesalahan berhasil ditemukan.
    if (error) {

      // Mengisi elemen pesan kesalahan dengan teks yang sudah ditentukan.
      error.textContent = message;
    }
  };

  // Membuat fungsi untuk menghapus tanda kesalahan pada input teks.
  const clearTextError = (input) => {

    // Menghapus class is-invalid ketika input sudah benar.
    input.classList.remove("is-invalid");

    // Menghapus atribut aria-invalid dari kolom input.
    input.removeAttribute("aria-invalid");
  };

  // Membuat fungsi untuk menampilkan pesan kesalahan pada dokumen yang diunggah.
  // title berisi judul kesalahan.
  // detail berisi penjelasan kesalahan.
  const showFileError = (title, detail) => {

    // Menambahkan tanda bahwa input dokumen memiliki kesalahan.
    evidenceInput.classList.add("is-invalid");

    // Memberikan atribut yang menandakan dokumen tidak valid.
    evidenceInput.setAttribute("aria-invalid", "true");

    // Memberikan pesan kesalahan khusus pada input dokumen.
    // Pesan ini juga dapat dibaca oleh validasi bawaan browser.
    evidenceInput.setCustomValidity(`${title} ${detail}`);

    // Memeriksa apakah tombol unggah berhasil ditemukan.
    if (uploadButton) {

      // Menambahkan class is-invalid pada tombol unggah.
      uploadButton.classList.add("is-invalid");
    }

    // Memeriksa apakah elemen judul kesalahan berhasil ditemukan.
    if (evidenceErrorTitle) {

      // Menampilkan judul kesalahan pada halaman.
      evidenceErrorTitle.textContent = title;
    }

    // Memeriksa apakah elemen penjelasan kesalahan berhasil ditemukan.
    if (evidenceErrorDetail) {

      // Menampilkan penjelasan kesalahan pada halaman.
      evidenceErrorDetail.textContent = detail;
    }
  };

  // Membuat fungsi untuk menghapus seluruh pesan kesalahan dokumen.
  const clearFileError = () => {

    // Menghapus class is-invalid dari input dokumen.
    evidenceInput.classList.remove("is-invalid");

    // Menghapus atribut yang menandakan dokumen tidak valid.
    evidenceInput.removeAttribute("aria-invalid");

    // Menghapus pesan kesalahan khusus pada input dokumen.
    evidenceInput.setCustomValidity("");

    // Memeriksa apakah tombol unggah berhasil ditemukan.
    if (uploadButton) {

      // Menghapus class is-invalid dari tombol unggah.
      uploadButton.classList.remove("is-invalid");
    }

    // Memeriksa apakah elemen judul kesalahan berhasil ditemukan.
    if (evidenceErrorTitle) {

      // Mengembalikan judul kesalahan ke teks bawaan.
      evidenceErrorTitle.textContent = defaultEvidenceTitle;
    }

    // Memeriksa apakah elemen penjelasan kesalahan berhasil ditemukan.
    if (evidenceErrorDetail) {

      // Mengembalikan penjelasan kesalahan ke teks bawaan.
      evidenceErrorDetail.textContent = defaultEvidenceDetail;
    }
  };

  // Membuat fungsi untuk memeriksa apakah kolom teks sudah diisi dengan benar.
  // input adalah kolom yang akan diperiksa.
  // error adalah tempat menampilkan pesan kesalahan.
  // message adalah pesan yang ditampilkan jika input salah.
  const validateText = (input, error, message) => {

    // Mengambil isi input dan menghapus spasi di awal serta akhir menggunakan trim().
    // Jika setelah dihapus tidak ada isi, berarti input kosong.
    if (!input.value.trim()) {

      // Menampilkan pesan kesalahan karena input belum diisi dengan benar.
      showTextError(input, error, message);

      // Mengembalikan false karena input tidak valid.
      return false;
    }

    // Menghapus tanda kesalahan jika input sudah diisi dengan benar.
    clearTextError(input);

    // Mengembalikan true karena input sudah valid.
    return true;
  };

  // Membuat fungsi untuk memeriksa dokumen sertifikat yang diunggah.
  const validateEvidence = () => {

    // Mengambil file pertama yang dipilih oleh pengguna.
    // Jika tidak ada file, nilai variabel file menjadi kosong.
    const file = evidenceInput.files && evidenceInput.files[0];

    // Memeriksa apakah pengguna belum memilih dokumen.
    if (!file) {

      // Menampilkan pesan bahwa dokumen sertifikat wajib diunggah.
      showFileError(defaultEvidenceTitle, defaultEvidenceDetail);

      // Mengembalikan false karena dokumen belum tersedia.
      return false;
    }

    // Memeriksa apakah file memiliki tipe PDF atau nama file berakhiran .pdf.
    // file.type memeriksa tipe file, sedangkan regex memeriksa ekstensi nama file.
    // Huruf i berarti pemeriksaan ekstensi tidak membedakan huruf besar dan kecil.
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

    // Memeriksa apakah dokumen yang dipilih bukan berformat PDF.
    if (!isPdf) {

      // Menampilkan pesan bahwa format dokumen tidak sesuai.
      showFileError(
        "Format berkas tidak sesuai!",
        "Dokumen sertifikat wajib menggunakan format PDF."
      );

      // Mengembalikan false karena format dokumen tidak sesuai.
      return false;
    }

    // Memeriksa apakah ukuran dokumen melebihi batas maksimal 5 MB.
    if (file.size > MAX_FILE_SIZE) {

      // Menampilkan pesan bahwa ukuran dokumen terlalu besar.
      showFileError(
        "Ukuran berkas terlalu besar!",
        "Ukuran sertifikat maksimal 5 MB."
      );

      // Mengembalikan false karena ukuran dokumen melebihi batas.
      return false;
    }

    // Menghapus pesan kesalahan jika dokumen sudah memenuhi semua ketentuan.
    clearFileError();

    // Mengembalikan true karena dokumen sudah valid.
    return true;
  };

  // Membuat fungsi untuk memeriksa kembali input teks ketika pengguna mengetik.
  // input adalah kolom yang diperiksa.
  // error adalah elemen pesan kesalahan.
  // message adalah pesan yang ditampilkan jika input masih salah.
  const revalidateTextOnInput = (input, error, message) => {

    // Menambahkan event input yang berjalan ketika isi kolom berubah.
    input.addEventListener("input", () => {

      // Memeriksa apakah kolom sebelumnya sudah memiliki tanda kesalahan.
      // Jika belum, hentikan proses pemeriksaan ulang.
      if (!input.classList.contains("is-invalid")) return;

      // Menjalankan kembali validasi untuk memeriksa apakah input sudah benar.
      validateText(input, error, message);
    });
  };

  // Memasang pemeriksaan ulang pada kolom nama kompetisi ketika pengguna mengetik.
  revalidateTextOnInput(nameInput, nameError, nameMessage);

  // Memasang pemeriksaan ulang pada kolom instansi ketika pengguna mengetik.
  revalidateTextOnInput(institutionInput, institutionError, institutionMessage);

  // Menambahkan event change yang berjalan ketika pengguna memilih atau mengganti file.
  evidenceInput.addEventListener("change", () => {

    // Memeriksa apakah dokumen sebelumnya sudah ditandai memiliki kesalahan.
    // Jika belum, hentikan pemeriksaan ulang.
    if (!evidenceInput.classList.contains("is-invalid")) return;

    // Memeriksa kembali format, ukuran, dan keberadaan dokumen yang dipilih.
    validateEvidence();
  });

  function selectedValue(name) {
    const checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : "";
  }

  function showErrorToast() {
    const toast = document.getElementById("error-toast");
    if (toast) toast.hidden = false;
  }

  const errorToastClose = document.getElementById("error-toast-close");
  if (errorToastClose) {
    errorToastClose.addEventListener("click", function () {
      const toast = document.getElementById("error-toast");
      if (toast) toast.hidden = true;
    });
  }

  // Menjalankan proses validasi dan menyimpan pengajuan ketika formulir dikirim.
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Memeriksa apakah nama kompetisi sudah diisi dengan benar.
    // Hasil pemeriksaan disimpan dalam variabel nameValid.
    const nameValid = validateText(nameInput, nameError, nameMessage);

    // Memeriksa apakah instansi atau lembaga penyelenggara sudah diisi dengan benar.
    // Hasil pemeriksaan disimpan dalam variabel institutionValid.
    const institutionValid = validateText(
      institutionInput,
      institutionError,
      institutionMessage
    );

    // Memeriksa apakah dokumen sertifikat sudah sesuai ketentuan.
    // Hasil pemeriksaan disimpan dalam variabel evidenceValid.
    const evidenceValid = validateEvidence();

    // Mencegah formulir dikirim jika masih terdapat input yang tidak valid.
    if (!nameValid || !institutionValid || !evidenceValid) {
      if (!nameValid) {
        nameInput.focus();
      } else if (!institutionValid) {
        institutionInput.focus();
      } else {
        evidenceInput.focus();
      }
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const store = await getDataStore();
      const student = store.resolveMahasiswa();

      if (!student) {
        showErrorToast();
        return;
      }

      const jenis = selectedValue("jenis_prestasi") === "Non-Akademik"
        ? "Nonakademik"
        : "Akademik";
      const tingkat = selectedValue("tingkat_kejuaraan").replace(/^Tingkat\s+/i, "");
      const peringkat = selectedValue("peringkat");
      const capaianLainnya = form.querySelector("#capaian-lainnya");
      const namaKompetisi = nameInput.value.trim();

      store.addPrestasi({
        nim: String(student.nim || ""),
        namaMahasiswa: student.name || student.nama || "",
        namaKompetisi: namaKompetisi,
        namaPrestasi: namaKompetisi,
        penyelenggara: institutionInput.value.trim(),
        jenis: jenis,
        tingkat: tingkat,
        peringkat: peringkat === "Lainnya" && capaianLainnya
          ? capaianLainnya.value.trim() || peringkat
          : peringkat,
        tahun: selectedValue("tahun_pelaksanaan"),
        status: "Menunggu Verifikasi",
        bukti: null,
        tanggalPengajuan: new Date().toISOString().slice(0, 10)
      });

      const successName = document.getElementById("success-competition-name");
      if (successName) successName.textContent = namaKompetisi;

      form.reset();
      window.location.hash = "success-panel";

      const successTitle = document.getElementById("success-title");
      if (successTitle) {
        window.requestAnimationFrame(function () {
          successTitle.focus();
        });
      }
    } catch (error) {
      console.error("Pengajuan prestasi gagal disimpan:", error);
      showErrorToast();
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

// Menutup fungsi utama sekaligus langsung menjalankannya.
})();
