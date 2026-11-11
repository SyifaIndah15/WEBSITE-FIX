// Membuat fungsi utama yang langsung dijalankan ketika file JavaScript dibaca.
(() => {

  // Menentukan elemen HTML yang boleh menerima fokus keyboard.
  // Contohnya tombol, input, dropdown, textarea, tautan, dan elemen dengan tabindex.
  // Selector ini digunakan untuk mengatur perpindahan fokus di dalam popup (modal).
  const focusableSelector =
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

  // Menyiapkan akses ke pusat data SIPRESMA.
  // Seluruh pembacaan dan penyimpanan data mahasiswa dilakukan melalui modul ini.
  const DATA_STORE_URL = new URL("../core/sipresma-data.js", document.currentScript.src).href;
  let dataStorePromise = null;
  let dataStore = null;

  function getDataStore() {
    if (!dataStorePromise) {
      dataStorePromise = import(DATA_STORE_URL).then(function (store) {
        if (store.getInitializationError()) {
          throw store.getInitializationError();
        }
        dataStore = store;
        return store;
      });
    }
    return dataStorePromise;
  }

  // Membuat fungsi untuk mengatur cara kerja popup (modal).
  // Parameter options berisi pengaturan modal seperti elemen modal dan tombol penutup.
  function setupModal(options) {

    // Mengambil elemen modal dari pengaturan yang diberikan.
    const modal = options.modal;

    // Mencari bagian dialog di dalam modal.
    // Jika modal tidak ditemukan, nilai dialog akan menjadi null.
    const dialog = modal ? modal.querySelector(".dm-modal__dialog") : null;

    // Memeriksa apakah bagian dialog berhasil ditemukan.
    // Jika tidak ditemukan, fungsi dihentikan dan mengembalikan null.
    if (!dialog) return null;

    // Menyimpan elemen terakhir yang sedang mendapatkan fokus sebelum modal dibuka.
    let lastFocusedElement = null;

    // Membuat fungsi untuk membuka modal.
    // trigger merupakan tombol atau elemen yang digunakan untuk membuka modal.
    function open(trigger) {

      // Memeriksa apakah modal sudah terbuka.
      // Jika modal tidak tersembunyi, hentikan fungsi agar tidak membuka ulang.
      if (!modal.hidden) return;

      // Menyimpan elemen yang digunakan untuk membuka modal.
      // Jika trigger bukan elemen HTML, gunakan elemen yang sedang aktif.
      lastFocusedElement = trigger instanceof HTMLElement ? trigger : document.activeElement;

      // Memeriksa apakah terdapat fungsi onOpen.
      // Jika ada, jalankan fungsi tersebut ketika modal dibuka.
      if (typeof options.onOpen === "function") options.onOpen();

      // Menampilkan modal dengan mengubah hidden menjadi false.
      modal.hidden = false;

      // Menambahkan class dm-modal-open pada body untuk mengatur tampilan halaman saat modal terbuka.
      document.body.classList.add("dm-modal-open");

      // Menunggu browser menyelesaikan proses rendering sebelum mengatur fokus.
      window.requestAnimationFrame(function () {

        // Mengarahkan fokus keyboard ke bagian dialog modal.
        // preventScroll mencegah halaman bergeser secara otomatis.
        dialog.focus({ preventScroll: true });
      });
    }

    // Membuat fungsi untuk menutup modal.
    function close() {

      // Memeriksa apakah modal sudah tertutup.
      // Jika sudah tersembunyi, hentikan fungsi.
      if (modal.hidden) return;

      // Menyembunyikan modal.
      modal.hidden = true;

      // Memeriksa apakah masih ada modal lain yang sedang terbuka.
      if (!document.querySelector(".dm-modal:not([hidden])")) {

        // Jika tidak ada modal lain yang terbuka, hapus class dm-modal-open dari body.
        document.body.classList.remove("dm-modal-open");
      }

      // Memeriksa apakah terdapat fungsi onClose.
      // Jika ada, jalankan fungsi tersebut ketika modal ditutup.
      if (typeof options.onClose === "function") options.onClose();

      // Menentukan kembali elemen yang akan mendapatkan fokus setelah modal ditutup.
      // Awalnya menggunakan elemen yang terakhir mendapatkan fokus.
      let focusTarget = lastFocusedElement;

      // Memeriksa apakah elemen fokus tidak tersedia, sudah tidak ada di halaman,
      // atau merupakan elemen body.
      if (!focusTarget || !focusTarget.isConnected || focusTarget === document.body) {

        // Jika kondisi tersebut terjadi, gunakan elemen cadangan dari options.
        focusTarget = options.fallbackFocus;
      }

      // Memeriksa apakah elemen tujuan fokus tersedia dan masih berada di halaman.
      if (focusTarget && focusTarget.isConnected) {

        // Mengembalikan fokus ke elemen tersebut tanpa menggulir halaman.
        focusTarget.focus({ preventScroll: true });
      }
    }

    // Menambahkan event click pada modal.
    // Event ini digunakan untuk mendeteksi klik pada bagian yang berfungsi menutup modal.
    modal.addEventListener("click", function (event) {

      // Memeriksa apakah elemen yang diklik berada di dalam elemen dengan closeSelector.
      // Jika ditemukan, jalankan fungsi untuk menutup modal.
      if (event.target.closest(options.closeSelector)) close();
    });

    // Menambahkan event keydown pada seluruh dokumen untuk mendeteksi tombol keyboard.
    document.addEventListener("keydown", function (event) {

      // Jika modal sedang tertutup, hentikan pemeriksaan tombol keyboard.
      if (modal.hidden) return;

      // Memeriksa apakah pengguna menekan tombol Escape.
      if (event.key === "Escape") {

        // Mencegah tindakan bawaan tombol Escape.
        event.preventDefault();

        // Menutup modal.
        close();

        // Menghentikan proses selanjutnya.
        return;
      }

      // Memeriksa apakah tombol yang ditekan bukan Tab.
      // Jika bukan Tab, hentikan pemeriksaan fokus keyboard.
      if (event.key !== "Tab") return;

      // Mengambil seluruh elemen yang dapat menerima fokus di dalam dialog.
      // Array.from() mengubah hasil querySelectorAll menjadi array.
      // filter() hanya mengambil elemen yang sedang terlihat.
      const focusableElements = Array.from(dialog.querySelectorAll(focusableSelector)).filter(

        // Memeriksa setiap elemen yang ditemukan.
        function (element) {

          // Elemen dengan offsetParent tidak null dianggap sedang terlihat.
          return element.offsetParent !== null;
        }
      );

      // Memeriksa apakah tidak ada elemen yang dapat menerima fokus.
      if (focusableElements.length === 0) {

        // Mencegah perpindahan fokus jika tidak ada elemen yang tersedia.
        event.preventDefault();

        // Menghentikan proses.
        return;
      }

      // Mengambil elemen pertama yang dapat menerima fokus.
      const firstElement = focusableElements[0];

      // Mengambil elemen terakhir yang dapat menerima fokus.
      const lastElement = focusableElements[focusableElements.length - 1];

      // Memeriksa apakah fokus saat ini berada pada bagian dialog modal.
      if (document.activeElement === dialog) {

        // Mencegah perpindahan fokus bawaan browser.
        event.preventDefault();

        // Jika pengguna menekan Shift + Tab, arahkan fokus ke elemen terakhir.
        if (event.shiftKey) lastElement.focus();

        // Jika hanya menekan Tab, arahkan fokus ke elemen pertama.
        else firstElement.focus();

      // Memeriksa apakah pengguna menekan Shift + Tab saat berada di elemen pertama.
      } else if (event.shiftKey && document.activeElement === firstElement) {

        // Mencegah fokus berpindah keluar dari modal.
        event.preventDefault();

        // Mengarahkan fokus kembali ke elemen terakhir.
        lastElement.focus();

      // Memeriksa apakah pengguna menekan Tab saat berada di elemen terakhir.
      } else if (!event.shiftKey && document.activeElement === lastElement) {

        // Mencegah fokus berpindah keluar dari modal.
        event.preventDefault();

        // Mengarahkan fokus kembali ke elemen pertama.
        firstElement.focus();
      }
    });

    // Mengembalikan dua fungsi agar dapat digunakan untuk membuka dan menutup modal.
    return { open: open, close: close };
  }

  // Mengambil elemen pembungkus tabel yang memiliki class dm-table-scroll.
  // Elemen ini nantinya digunakan sebagai tujuan fokus setelah modal edit atau hapus ditutup.
  const tableScroll = document.querySelector(".dm-table-scroll");

  // Membuat fungsi untuk mengatur modal yang memiliki formulir di dalamnya.
  // Fungsi ini dapat digunakan kembali untuk modal tambah akun dan tambah mahasiswa.
  function setupFormModal(options) {

    // Mengambil formulir berdasarkan ID yang diberikan pada options.
    const form = document.getElementById(options.formId);

    // Menonaktifkan validasi bawaan browser jika formulir memiliki validasi khusus.
    // Dengan begitu pesan kesalahan dari JavaScript dapat ditampilkan.
    if (form && typeof options.onSubmit === "function") form.noValidate = true;

    // Mengambil tombol yang digunakan untuk membuka modal.
    const trigger = document.getElementById(options.triggerId);

    // Mengatur modal menggunakan fungsi setupModal yang sudah dibuat sebelumnya.
    const modal = setupModal({

      // Mengambil elemen modal berdasarkan ID yang diberikan.
      modal: document.getElementById(options.modalId),

      // Menentukan selector elemen yang dapat digunakan untuk menutup modal.
      closeSelector: options.closeSelector,

      // Menentukan tindakan yang dilakukan ketika modal dibuka.
      onOpen: function () {

        // Jika resetOnOpen bernilai true dan formulir tersedia,
        // kosongkan formulir setiap kali modal dibuka.
        if (options.resetOnOpen && form) form.reset();

        // Menghapus pesan kesalahan lama saat modal dibuka kembali.
        if (form) {
          form.querySelectorAll(".dm-account-error").forEach(function (error) {
            error.textContent = "";
            error.hidden = true;
          });

          form.querySelectorAll("[aria-invalid='true']").forEach(function (input) {
            input.removeAttribute("aria-invalid");
          });
        }
      }
    });

    // Memeriksa apakah modal dan tombol pembuka berhasil ditemukan.
    if (modal && trigger) {

      // Menambahkan event click pada tombol pembuka modal.
      trigger.addEventListener("click", function () {

        // Membuka modal ketika tombol diklik.
        modal.open(trigger);
      });
    }

    // Memeriksa apakah modal dan formulir berhasil ditemukan.
    if (modal && form) {

      // Mencegah pengiriman ganda ketika proses penyimpanan sedang berjalan.
      let isSubmitting = false;

      // Menambahkan event submit ketika formulir dikirim.
      form.addEventListener("submit", async function (event) {

        // Mencegah formulir dikirim secara otomatis oleh browser.
        event.preventDefault();

        // Mengabaikan pengiriman baru selama proses sebelumnya belum selesai.
        if (isSubmitting) return;

        // Jika formulir memiliki proses simpan khusus, jalankan proses tersebut.
        // Proses dianggap berhasil jika fungsi mengembalikan nilai true.
        if (typeof options.onSubmit === "function") {
          isSubmitting = true;

          try {
            const result = await options.onSubmit(form);
            if (!result) return;
          } catch (error) {
            console.error("Form submission failed:", error);
            return;
          } finally {
            isSubmitting = false;
          }
        } else if (!form.reportValidity()) {
          // Memeriksa apakah seluruh input sudah memenuhi aturan validasi HTML.
          // Jika tidak valid, hentikan proses.
          return;
        }

        // Menutup modal jika formulir sudah lolos validasi.
        modal.close();

        // Mengosongkan kembali seluruh input formulir.
        form.reset();
      });
    }

    // Mengembalikan objek modal agar dapat digunakan oleh bagian kode lainnya.
    return modal;
  }

  // Mengatur modal untuk fitur tambah akun.
  // formId adalah ID formulir tambah akun.
  // triggerId adalah ID tombol pembuka modal.
  // modalId adalah ID elemen popup tambah akun.
  // closeSelector adalah selector tombol untuk menutup popup.
  // onSubmit menjalankan validasi, penyimpanan, dan penambahan baris tabel.
  setupFormModal({
    formId: "dm-account-form",
    triggerId: "dm-create-account-button",
    modalId: "dm-account-modal",
    closeSelector: "[data-dm-account-close]",
    onSubmit: submitAccountForm
  });

  // Mengatur modal untuk fitur tambah mahasiswa.
  // Formulir yang digunakan adalah dm-student-form.
  // Tombol pembukanya adalah dm-add-student-button.
  // Modal yang ditampilkan adalah dm-student-modal.
  // resetOnOpen true berarti formulir dikosongkan setiap kali modal dibuka.
  setupFormModal({
    formId: "dm-student-form",
    triggerId: "dm-add-student-button",
    modalId: "dm-student-modal",
    closeSelector: "[data-dm-student-close]",
    resetOnOpen: true,
    onSubmit: submitStudentForm
  });

  // Membuat variabel untuk menyimpan baris tabel mahasiswa yang sedang diedit.
  // Nilai awal null berarti belum ada baris yang dipilih.
  let editingRow = null;

  // Mengambil formulir untuk mengedit data mahasiswa.
  const editForm = document.getElementById("dm-edit-form");

  // Mengambil kolom input NIM pada formulir edit.
  const editNim = document.getElementById("dm-edit-nim");

  // Mengambil kolom input tahun angkatan pada formulir edit.
  const editYear = document.getElementById("dm-edit-year");

  // Mengambil kolom input nama mahasiswa pada formulir edit.
  const editName = document.getElementById("dm-edit-name");

  // Mengambil kolom input IPK pada formulir edit.
  const editIpk = document.getElementById("dm-edit-ipk");

  // Mengatur modal khusus untuk mengedit data mahasiswa.
  const editModal = setupModal({

    // Mengambil elemen modal edit berdasarkan ID dm-edit-modal.
    modal: document.getElementById("dm-edit-modal"),

    // Menentukan elemen yang digunakan untuk menutup modal edit.
    closeSelector: "[data-dm-edit-close]",

    // Menentukan elemen cadangan untuk menerima fokus setelah modal ditutup.
    fallbackFocus: tableScroll,

    // Menentukan tindakan yang dijalankan ketika modal edit ditutup.
    onClose: function () {

      // Mengosongkan penanda baris yang sedang diedit.
      editingRow = null;
    }
  });

  // Membuat fungsi untuk mengambil data mahasiswa dari satu baris tabel.
  // Parameter row merupakan baris tabel mahasiswa yang akan dibaca.
  function getRowData(row) {

    // Mengambil elemen yang berisi nama mahasiswa.
    const nameElement = row.querySelector(".dm-student-name");

    // Mengambil elemen yang berisi informasi NIM dan angkatan mahasiswa.
    const metaElement = row.querySelector(".dm-student-meta");

    // Mengambil elemen yang berisi nilai IPK mahasiswa.
    const ipkElement = row.querySelector(".dm-ipk");

    // Mengambil teks informasi NIM dan angkatan.
    // Jika elemen tidak ditemukan, gunakan teks kosong.
    const meta = metaElement ? metaElement.textContent.trim() : "";

    // Mencari nomor NIM menggunakan regular expression.
    // Pola ini mencari tulisan NIM: yang diikuti oleh satu atau lebih angka.
    // i berarti pencarian tidak membedakan huruf besar dan kecil.
    const nimMatch = meta.match(/NIM:\s*([0-9]+)/i);

    // Mencari tahun angkatan yang terdiri dari empat angka.
    const yearMatch = meta.match(/Angkatan\s+([0-9]{4})/i);

    // Mengembalikan data mahasiswa dalam bentuk objek.
    return {

      // Mengambil nama mahasiswa dan menghapus spasi di awal serta akhir.
      // Jika elemen nama tidak ditemukan, gunakan teks kosong.
      name: nameElement ? nameElement.textContent.trim() : "",

      // Mengambil hasil pencarian NIM.
      // Jika NIM ditemukan, ambil angka yang berada pada kelompok pertama.
      // Jika tidak ditemukan, gunakan teks kosong.
      nim: nimMatch ? nimMatch[1] : "",

      // Mengambil hasil pencarian tahun angkatan.
      // Jika ditemukan, ambil tahun yang berada pada kelompok pertama.
      // Jika tidak ditemukan, gunakan teks kosong.
      year: yearMatch ? yearMatch[1] : "",

      // Mengambil nilai IPK dan menghapus spasi di awal serta akhir.
      // Jika elemen IPK tidak ditemukan, gunakan teks kosong.
      ipk: ipkElement ? ipkElement.textContent.trim() : ""
    };
  }

  // Membuat fungsi untuk membuka modal edit mahasiswa.
  // row adalah baris mahasiswa yang akan diedit.
  // trigger adalah tombol yang digunakan untuk membuka modal.
  function openEditModal(row, trigger) {

    // Memeriksa apakah modal, formulir, dan baris mahasiswa tersedia.
    // Jika salah satunya tidak tersedia, hentikan fungsi.
    if (!editModal || !editForm || !row) return;

    // Mengambil data mahasiswa dari baris tabel menggunakan fungsi getRowData().
    const data = getRowData(row);

    // Menyimpan baris tabel yang sedang diedit.
    editingRow = row;

    // Mengosongkan formulir sebelum mengisinya dengan data mahasiswa.
    editForm.reset();

    // Mengisi kolom NIM dengan data NIM mahasiswa yang dipilih.
    editNim.value = data.nim;

    // Mengisi kolom tahun angkatan dengan data yang ditemukan.
    editYear.value = data.year;

    // Mengisi kolom nama dengan nama mahasiswa yang dipilih.
    editName.value = data.name;

    // Mengisi kolom IPK dengan nilai IPK mahasiswa yang dipilih.
    editIpk.value = data.ipk;

    // Membuka modal edit dengan mengingat tombol yang digunakan untuk membukanya.
    editModal.open(trigger);
  }

  // Memeriksa apakah modal edit dan formulir edit berhasil ditemukan.
  if (editModal && editForm) {

    // Menambahkan event submit ketika formulir edit dikirim.
    editForm.addEventListener("submit", async (event) => {

      // Mencegah formulir dikirim secara otomatis oleh browser.
      event.preventDefault();

      // Memeriksa apakah seluruh input memenuhi aturan validasi HTML.
      // Jika tidak valid, hentikan proses penyimpanan perubahan.
      if (!editForm.reportValidity()) return;

      // Mengambil kembali baris tabel mahasiswa yang sedang diedit.
      const row = editingRow;
      if (!row) return;

      // Menunggu pusat data SIPRESMA selesai diinisialisasi sebelum menyimpan.
      try {
        await getDataStore();
      } catch (error) {
        console.error("Data mahasiswa gagal dimuat:", error);
        return;
      }

      // Menyimpan NIM lama sebelum data pada baris diubah.
      const oldNim = getRowNim(row);

      // Mengambil nilai baru dari formulir edit.
      const name = editName.value.trim();
      const nim = editNim.value.trim();
      const year = editYear.value.trim();
      const ipk = editIpk.value.trim().replace(",", ".");

      // Mempertahankan password yang sudah diubah, tetapi memperbarui
      // password default agar tetap sama dengan NIM terbaru.
      const storedStudent = getStoredStudent(oldNim);
      const storedPassword = storedStudent ? String(storedStudent.password || "") : "";
      const password = storedPassword && storedPassword !== oldNim ? storedPassword : nim;

      // Menyimpan perubahan ke pusat data SIPRESMA.
      // NIM lama dipakai agar perubahan NIM tidak membuat akun baru.
      const student = updateStoredStudent(oldNim, {
        name: name,
        nim: nim,
        year: year,
        ipk: ipk,
        password: password
      });

      // Memperbarui baris tabel dengan data yang sudah tersimpan.
      updateStudentRow(row, student ? toDisplayStudent(student) : {
        name: name,
        nim: nim,
        year: year,
        ipk: ipk,
        email: row.dataset.email || "",
        category: row.dataset.category || "Rendah"
      });

      // Menerapkan kembali pencarian dan filter setelah data diperbarui.
      applyFilters();

      // Menutup modal setelah proses perubahan data selesai.
      editModal.close();

      // Mengosongkan kembali formulir edit.
      editForm.reset();
    });
  }

  // Membuat variabel untuk menyimpan baris mahasiswa yang akan dihapus.
  // Nilai awal null berarti belum ada baris yang dipilih.
  let deletingRow = null;

  // Mengambil elemen untuk menampilkan identitas mahasiswa pada konfirmasi hapus.
  const deleteIdentity = document.getElementById("dm-delete-identity");

  // Mengambil tombol konfirmasi untuk menghapus data mahasiswa.
  const confirmDeleteButton = document.getElementById("dm-confirm-delete-button");

  // Mengatur modal konfirmasi penghapusan data mahasiswa.
  const deleteModal = setupModal({

    // Mengambil elemen modal penghapusan berdasarkan ID.
    modal: document.getElementById("dm-delete-modal"),

    // Menentukan elemen yang digunakan untuk menutup modal penghapusan.
    closeSelector: "[data-dm-delete-close]",

    // Menentukan elemen cadangan untuk menerima fokus setelah modal ditutup.
    fallbackFocus: tableScroll,

    // Menentukan tindakan yang dilakukan ketika modal penghapusan ditutup.
    onClose: function () {

      // Mengosongkan penanda baris mahasiswa yang akan dihapus.
      deletingRow = null;
    }
  });

  // Membuat fungsi untuk membuka modal konfirmasi penghapusan mahasiswa.
  // row adalah baris mahasiswa yang akan dihapus.
  // trigger adalah tombol yang digunakan untuk membuka modal.
  function openDeleteModal(row, trigger) {

    // Memeriksa apakah modal penghapusan dan baris mahasiswa tersedia.
    // Jika tidak tersedia, hentikan fungsi.
    if (!deleteModal || !row) return;

    // Mengambil data mahasiswa dari baris tabel.
    const data = getRowData(row);

    // Menyimpan baris mahasiswa yang akan dihapus.
    deletingRow = row;

    // Jika elemen identitas tersedia, tampilkan nama dan NIM mahasiswa.
    // Simbol \u00b7 digunakan sebagai pemisah antara nama dan NIM.
    if (deleteIdentity) deleteIdentity.textContent = `${data.name} \u00b7 NIM ${data.nim}`;

    // Membuka modal konfirmasi penghapusan.
    deleteModal.open(trigger);
  }

  // Memeriksa apakah modal hapus dan tombol konfirmasi berhasil ditemukan.
  if (deleteModal && confirmDeleteButton) {

    // Menambahkan event click pada tombol konfirmasi hapus.
    confirmDeleteButton.addEventListener("click", async function () {

      // Mengambil baris mahasiswa yang sebelumnya dipilih untuk dihapus.
      const row = deletingRow;

      // Memeriksa apakah baris mahasiswa tersedia.
      // Jika tidak tersedia, hentikan proses.
      if (!row) return;

      // Menunggu pusat data SIPRESMA selesai diinisialisasi sebelum menghapus.
      try {
        await getDataStore();
      } catch (error) {
        console.error("Data mahasiswa gagal dimuat:", error);
        return;
      }

      // Menyimpan NIM sebelum baris dihapus dari tabel.
      const nim = getRowNim(row);

      // Menghapus akun mahasiswa melalui pusat data SIPRESMA.
      if (nim) removeStoredStudent(nim);

      // Menghapus baris mahasiswa dari tampilan tabel HTML.
      row.remove();

      // Menerapkan kembali pencarian dan filter setelah data dihapus.
      applyFilters();

      // Mengosongkan kembali variabel baris yang akan dihapus.
      deletingRow = null;

      // Menutup modal konfirmasi penghapusan.
      deleteModal.close();
    });
  }

  // Mengambil elemen tabel mahasiswa berdasarkan class dm-table.
  const table = document.querySelector(".dm-table");

  // Memeriksa apakah tabel berhasil ditemukan.
  if (table) {

    // Menambahkan event click pada tabel untuk menangani tombol edit dan hapus.
    // Cara ini memungkinkan satu event listener menangani banyak baris tabel.
    table.addEventListener("click", function (event) {

      // Memeriksa apakah elemen yang diklik merupakan tombol edit
      // atau berada di dalam tombol edit.
      const editButton = event.target.closest(".dm-icon-button--edit");

      // Jika tombol edit ditemukan, jalankan proses membuka modal edit.
      if (editButton) {

        // Mengambil baris tabel tempat tombol edit berada.
        // Kemudian membuka modal edit dengan tombol tersebut sebagai pemicu.
        openEditModal(editButton.closest("tr"), editButton);

        // Menghentikan proses agar tidak dilanjutkan ke pemeriksaan tombol hapus.
        return;
      }

      // Memeriksa apakah elemen yang diklik merupakan tombol hapus
      // atau berada di dalam tombol hapus.
      const deleteButton = event.target.closest(".dm-icon-button--delete");

      // Jika tombol hapus ditemukan, buka modal konfirmasi penghapusan.
      // Baris tabel tempat tombol berada akan dikirim ke fungsi openDeleteModal().
      if (deleteButton) openDeleteModal(deleteButton.closest("tr"), deleteButton);
    });
  }

  // ==================== AKUN MAHASISWA BARU ====================

  // Mengambil formulir Buat Akun Mahasiswa Baru dan seluruh kolom inputnya.
  const accountNim = document.getElementById("dm-account-nim");
  const accountYear = document.getElementById("dm-account-year");
  const accountName = document.getElementById("dm-account-name");
  const accountEmail = document.getElementById("dm-account-email");

  // Mengambil formulir Tambah Data Mahasiswa dan seluruh kolom inputnya.
  const studentNim = document.getElementById("dm-student-nim");
  const studentYear = document.getElementById("dm-student-year");
  const studentName = document.getElementById("dm-student-name");
  const studentIpk = document.getElementById("dm-student-ipk");

  // Mengambil tabel mahasiswa dan menyimpan satu baris sebagai contoh struktur.
  // Baris contoh digunakan untuk membuat baris baru tanpa mengubah struktur HTML.
  const studentTableBody = document.querySelector(".dm-table tbody");
  const studentRowTemplate = studentTableBody ? studentTableBody.querySelector("tr") : null;

  // Mengambil daftar akun mahasiswa dari pusat data SIPRESMA.
  function getStoredStudents() {
    return dataStore ? dataStore.getMahasiswaAccounts() : [];
  }

  // Mencari akun mahasiswa berdasarkan NPM pada pusat data SIPRESMA.
  function getStoredStudent(nim) {
    return getStoredStudents().find(function (student) {
      return String(student.nim) === String(nim);
    });
  }

  // Memperbarui data akun mahasiswa melalui pusat data SIPRESMA.
  function updateStoredStudent(oldNim, updatedData) {
    if (!dataStore) return null;

    const existing = getStoredStudent(oldNim);
    if (!existing) return null;

    return dataStore.saveMahasiswa(Object.assign({}, existing, updatedData), oldNim);
  }

  // Menghapus data akun mahasiswa melalui pusat data SIPRESMA.
  function removeStoredStudent(nim) {
    if (!dataStore) return;
    dataStore.deleteMahasiswa(nim);
  }

  // Mengambil NIM dari satu baris tabel.
  function getRowNim(row) {
    const metaElement = row.querySelector(".dm-student-meta");
    const meta = metaElement ? metaElement.textContent : "";
    const match = meta.match(/NIM:\s*([0-9]+)/i);

    return row.dataset.nim || (match ? match[1] : "");
  }

  // Memeriksa apakah NIM sudah digunakan pada tabel yang sedang ditampilkan.
  function isNimInTable(nim) {
    const rows = Array.from(document.querySelectorAll(".dm-table tbody tr"));

    return rows.some(function (row) {
      return getRowNim(row) === nim;
    });
  }

  // Memeriksa apakah NIM sudah terdaftar pada tabel atau pusat data SIPRESMA.
  function isNimRegistered(nim) {
    const stored = getStoredStudents();

    return (
      isNimInTable(nim) ||
      stored.some(function (student) {
        return String(student.nim) === nim;
      })
    );
  }

  // Membuat elemen pesan kesalahan pada kolom input terkait.
  function getFieldError(input) {
    const field = input.closest(".dm-account-field");

    if (!field) return null;

    let error = field.querySelector(".dm-account-error");

    if (!error) {
      error = document.createElement("p");
      error.className = "dm-account-helper dm-account-error";
      error.setAttribute("role", "alert");
      error.hidden = true;
      error.style.color = "#b3261e";
      field.appendChild(error);
    }

    return error;
  }

  // Menampilkan pesan kesalahan pada kolom input.
  function showFieldError(input, message) {
    const error = getFieldError(input);

    input.setAttribute("aria-invalid", "true");

    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  }

  // Menghapus pesan kesalahan pada kolom input.
  function clearFieldError(input) {
    const error = getFieldError(input);

    input.removeAttribute("aria-invalid");

    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  }

  // Menghapus pesan kesalahan ketika pengguna memperbaiki isi input.
  [accountNim, accountYear, accountName, accountEmail, studentNim, studentYear, studentName, studentIpk].forEach(function (input) {
    if (!input) return;

    input.addEventListener("input", function () {
      clearFieldError(input);
    });
  });

  // Memeriksa seluruh input formulir Buat Akun Mahasiswa Baru.
  function validateAccountForm() {
    let isValid = true;
    let firstInvalidInput = null;

    function markInvalid(input, message) {
      if (!input) return;

      showFieldError(input, message);
      isValid = false;

      if (!firstInvalidInput) firstInvalidInput = input;
    }

    const nim = accountNim ? accountNim.value.trim() : "";
    const year = accountYear ? accountYear.value.trim() : "";
    const name = accountName ? accountName.value.trim() : "";
    const email = accountEmail ? accountEmail.value.trim() : "";

    // Validasi NIM: wajib diisi, hanya angka, 11 digit, dan belum terdaftar.
    if (!nim) {
      markInvalid(accountNim, "NIM wajib diisi.");
    } else if (!/^[0-9]+$/.test(nim)) {
      markInvalid(accountNim, "NIM hanya boleh berisi angka.");
    } else if (nim.length !== 11) {
      markInvalid(accountNim, "NIM harus terdiri dari 11 angka.");
    } else if (isNimRegistered(nim)) {
      markInvalid(accountNim, "NIM sudah terdaftar.");
    } else {
      clearFieldError(accountNim);
    }

    // Validasi angkatan: wajib diisi dan terdiri dari 4 angka.
    if (!year) {
      markInvalid(accountYear, "Angkatan wajib diisi.");
    } else if (!/^[0-9]{4}$/.test(year)) {
      markInvalid(accountYear, "Angkatan harus terdiri dari 4 angka.");
    } else {
      clearFieldError(accountYear);
    }

    // Validasi nama: wajib diisi dan hanya boleh berisi huruf serta spasi.
    if (!name) {
      markInvalid(accountName, "Nama lengkap wajib diisi.");
    } else if (!/^[A-Za-z\u00C0-\u024F\s]+$/.test(name)) {
      markInvalid(accountName, "Nama lengkap hanya boleh berisi huruf dan spasi.");
    } else {
      clearFieldError(accountName);
    }

    // Validasi email: wajib diisi dan harus memiliki format email yang benar.
    if (!email) {
      markInvalid(accountEmail, "Email wajib diisi.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      markInvalid(accountEmail, "Masukkan alamat email yang valid.");
    } else {
      clearFieldError(accountEmail);
    }

    // Mengarahkan fokus ke input pertama yang belum valid.
    if (firstInvalidInput) firstInvalidInput.focus();

    return isValid;
  }

  // Mengambil akun yang sesuai dengan NPM pada formulir Tambah Data Mahasiswa.
  function getStudentFormAccount() {
    const nim = studentNim ? studentNim.value.trim() : "";

    if (!/^[0-9]{11}$/.test(nim)) return null;

    return getStoredStudent(nim) || null;
  }

  // Mengisi identitas mahasiswa dari data akun yang sudah tersedia.
  function syncStudentIdentity() {
    if (!dataStore) return;

    const account = getStudentFormAccount();

    if (studentYear) studentYear.value = account ? String(account.year || account.angkatan || "") : "";
    if (studentName) studentName.value = account ? String(account.name || account.nama || "") : "";
  }

  // Menampilkan status akun ketika NPM sudah lengkap diketik.
  function updateStudentNimStatus() {
    if (!dataStore) return;

    const nim = studentNim ? studentNim.value.trim() : "";

    if (!/^[0-9]{11}$/.test(nim)) return;

    const account = getStoredStudent(nim);

    if (!account) {
      showFieldError(studentNim, "Akun mahasiswa belum dibuat. Buat akun terlebih dahulu.");
    } else if (account.hasAcademicData === true) {
      showFieldError(studentNim, "Data akademik untuk NPM ini sudah diisi.");
    } else {
      clearFieldError(studentNim);
    }
  }

  // Memperbarui identitas dan status akun saat NPM diubah.
  if (studentNim) {
    studentNim.addEventListener("input", function () {
      syncStudentIdentity();
      updateStudentNimStatus();
    });

    studentNim.addEventListener("blur", updateStudentNimStatus);
  }

  // Memeriksa seluruh input formulir Tambah Data Mahasiswa.
  function validateStudentForm() {
    let isValid = true;
    let firstInvalidInput = null;

    function markInvalid(input, message) {
      if (!input) return;

      showFieldError(input, message);
      isValid = false;

      if (!firstInvalidInput) firstInvalidInput = input;
    }

    const nim = studentNim ? studentNim.value.trim() : "";
    const year = studentYear ? studentYear.value.trim() : "";
    const name = studentName ? studentName.value.trim() : "";
    const ipk = studentIpk ? studentIpk.value.trim() : "";
    const account = getStudentFormAccount();

    // Validasi NIM: wajib diisi, hanya angka, 11 digit, dan harus memiliki akun.
    if (!nim) {
      markInvalid(studentNim, "NIM wajib diisi.");
    } else if (!/^[0-9]+$/.test(nim)) {
      markInvalid(studentNim, "NIM hanya boleh berisi angka.");
    } else if (nim.length !== 11) {
      markInvalid(studentNim, "NIM harus terdiri dari 11 angka.");
    } else if (!account) {
      markInvalid(studentNim, "Akun mahasiswa belum dibuat. Buat akun terlebih dahulu.");
    } else if (account.hasAcademicData === true) {
      markInvalid(studentNim, "Data akademik untuk NPM ini sudah diisi.");
    } else {
      clearFieldError(studentNim);
    }

    // Identitas diambil dari akun, sehingga hanya diperiksa jika akun ditemukan.
    if (account) {
      // Validasi angkatan: wajib diisi dan terdiri dari 4 angka.
      if (!year) {
        markInvalid(studentYear, "Angkatan wajib diisi.");
      } else if (!/^[0-9]{4}$/.test(year)) {
        markInvalid(studentYear, "Angkatan harus terdiri dari 4 angka.");
      } else {
        clearFieldError(studentYear);
      }

      // Validasi nama: wajib diisi dan hanya boleh berisi huruf serta spasi.
      if (!name) {
        markInvalid(studentName, "Nama lengkap wajib diisi.");
      } else if (!/^[A-Za-z\u00C0-\u024F\s]+$/.test(name)) {
        markInvalid(studentName, "Nama lengkap hanya boleh berisi huruf dan spasi.");
      } else {
        clearFieldError(studentName);
      }
    } else {
      clearFieldError(studentYear);
      clearFieldError(studentName);
    }

    // Validasi IPK: wajib diisi, berupa angka, maksimal 2 desimal, dan 0.00-4.00.
    if (!ipk) {
      markInvalid(studentIpk, "IPK wajib diisi.");
    } else if (!/^[0-9]+(?:[.,][0-9]{1,2})?$/.test(ipk)) {
      markInvalid(studentIpk, "IPK harus berupa angka dengan maksimal 2 angka desimal.");
    } else {
      const ipkValue = Number(ipk.replace(",", "."));

      if (ipkValue < 0 || ipkValue > 4) {
        markInvalid(studentIpk, "IPK harus berada di antara 0.00 dan 4.00.");
      } else {
        clearFieldError(studentIpk);
      }
    }

    // Mengarahkan fokus ke input pertama yang belum valid.
    if (firstInvalidInput) firstInvalidInput.focus();

    return isValid;
  }

  // Mengubah data akun dari pusat data menjadi data tampilan tabel.
  function toDisplayStudent(student) {
    const ipk = student.ipk == null ? 0 : Number(student.ipk);

    return {
      name: student.name || student.nama || "",
      nim: String(student.nim || ""),
      year: String(student.year || student.angkatan || ""),
      email: student.email || "",
      programStudi: student.programStudi || "Teknik Informatika",
      password: student.password || String(student.nim || ""),
      category: student.category || student.klasifikasi || "Rendah",
      ipk: Number.isFinite(ipk) ? ipk.toFixed(2) : "0.00",
      jumlahPrestasiAkademik: achievementCount(student.jumlahPrestasiAkademik),
      tingkatPrestasiAkademik: String(student.tingkatPrestasiAkademik || "").trim(),
      jumlahPrestasiNonAkademik: achievementCount(student.jumlahPrestasiNonAkademik),
      tingkatPrestasiNonAkademik: String(student.tingkatPrestasiNonAkademik || "").trim()
    };
  }

  // Mengubah nilai jumlah prestasi menjadi angka yang aman ditampilkan.
  function achievementCount(value) {
    const count = Number(value);
    return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  }

  // Menampilkan jumlah dan tingkat prestasi yang sudah terverifikasi pada baris.
  function updateAchievementCells(row, student) {
    const cells = row.querySelectorAll(".dm-achievement");
    const values = [
      { count: student.jumlahPrestasiAkademik, level: student.tingkatPrestasiAkademik },
      { count: student.jumlahPrestasiNonAkademik, level: student.tingkatPrestasiNonAkademik }
    ];

    cells.forEach(function (cell, index) {
      const entry = values[index] || {};
      const count = achievementCount(entry.count);
      const level = String(entry.level || "").trim();
      const value = cell.querySelector("strong");
      const label = cell.querySelector("small");

      if (value) value.textContent = String(count);
      if (label) label.textContent = level || "-";
    });
  }

  // Membuat baris tabel untuk akun mahasiswa baru.
  function createStudentRow(student) {
    if (!studentTableBody || !studentRowTemplate) return null;

    const row = studentRowTemplate.cloneNode(true);
    const nameElement = row.querySelector(".dm-student-name");
    const metaElement = row.querySelector(".dm-student-meta");
    const ipkElement = row.querySelector(".dm-ipk");
    const badgeElement = row.querySelector(".dm-badge");
    const editButton = row.querySelector(".dm-icon-button--edit");
    const deleteButton = row.querySelector(".dm-icon-button--delete");

    // Memastikan baris baru tidak ikut tersembunyi oleh filter sebelumnya.
    row.hidden = false;

    if (nameElement) nameElement.textContent = student.name;
    if (metaElement) metaElement.textContent = `NIM: ${student.nim} \u00b7 Angkatan ${student.year}`;
    if (ipkElement) ipkElement.textContent = student.ipk || "0.00";
    updateAchievementCells(row, student);

    if (badgeElement) {
      badgeElement.className = "dm-badge";
      badgeElement.textContent = student.category || "Rendah";
    }

    // Menyimpan data pencarian pada atribut baris.
    row.dataset.name = student.name;
    row.dataset.nim = student.nim;
    row.dataset.email = student.email;
    row.dataset.category = student.category || "Rendah";

    if (editButton) editButton.setAttribute("aria-label", `Edit data ${student.name}`);
    if (deleteButton) deleteButton.setAttribute("aria-label", `Hapus data ${student.name}`);

    return row;
  }

  // Menambahkan baris akun mahasiswa baru ke tabel.
  function addStudentRow(student) {
    const row = createStudentRow(student);

    if (row) studentTableBody.appendChild(row);
  }

  // Memperbarui baris tabel yang sudah ada berdasarkan data akun terbaru.
  function updateStudentRow(row, student) {
    const nameElement = row.querySelector(".dm-student-name");
    const metaElement = row.querySelector(".dm-student-meta");
    const ipkElement = row.querySelector(".dm-ipk");
    const editButton = row.querySelector(".dm-icon-button--edit");
    const deleteButton = row.querySelector(".dm-icon-button--delete");

    row.hidden = false;

    if (nameElement) nameElement.textContent = student.name;
    if (metaElement) metaElement.textContent = `NIM: ${student.nim} \u00b7 Angkatan ${student.year}`;
    if (ipkElement) ipkElement.textContent = student.ipk || "0.00";
    updateAchievementCells(row, student);

    row.dataset.name = student.name;
    row.dataset.nim = student.nim;
    row.dataset.email = student.email || "";
    row.dataset.category = student.category || "Rendah";

    if (editButton) editButton.setAttribute("aria-label", `Edit data ${student.name}`);
    if (deleteButton) deleteButton.setAttribute("aria-label", `Hapus data ${student.name}`);
  }

  // Memperbarui baris yang sudah ada atau menambahkan baris baru bila belum ada.
  function upsertStudentRow(student) {
    if (!studentTableBody) return;

    const nim = String(student.nim);
    const rows = Array.from(studentTableBody.querySelectorAll("tr"));
    const row = rows.find(function (item) {
      return getRowNim(item) === nim;
    });

    if (row) {
      updateStudentRow(row, student);
    } else {
      addStudentRow(student);
    }
  }

  // Menghapus baris statis yang akunnya sudah tidak ada di penyimpanan.
  function removeMissingStoredRows() {
    if (!studentTableBody) return;

    const storedNims = new Set(getStoredStudents().map(function (student) {
      return String(student.nim);
    }));

    Array.from(studentTableBody.querySelectorAll("tr")).forEach(function (row) {
      const nim = getRowNim(row);
      if (nim && !storedNims.has(nim)) row.remove();
    });
  }

  // Menampilkan kembali seluruh akun mahasiswa dari pusat data SIPRESMA.
  function loadStoredStudents() {
    getStoredStudents().forEach(function (student) {
      if (!student || !student.nim) return;

      // Memperbarui baris yang sudah ada atau menambahkan baris baru.
      upsertStudentRow(toDisplayStudent(student));
    });
  }

  // Menyimpan akun baru dan menambahkannya ke tabel.
  async function submitAccountForm() {
    // Menunggu pusat data SIPRESMA selesai diinisialisasi sebelum menyimpan.
    try {
      await getDataStore();
    } catch (error) {
      console.error("Data mahasiswa gagal dimuat:", error);
      showFieldError(accountNim, "Data mahasiswa belum siap. Muat ulang halaman.");
      return false;
    }

    if (!validateAccountForm()) return false;

    const nim = accountNim.value.trim();
    const year = accountYear.value.trim();
    const name = accountName.value.trim();

    // Membuat akun baru tanpa data akademik.
    const student = dataStore.saveMahasiswa({
      id: "MHS-" + nim,
      nim: nim,
      username: nim,
      name: name,
      nama: name,
      year: year,
      angkatan: year ? Number(year) : null,
      email: accountEmail.value.trim(),
      programStudi: "Teknik Informatika",
      password: nim,
      role: "Mahasiswa",
      status: "Aktif",
      statusAkun: "Aktif",
      category: "Rendah",
      klasifikasi: "Rendah",
      ipk: "0.00",
      hasAcademicData: false
    });

    // Menambahkan baris baru ke tabel agar langsung terlihat.
    upsertStudentRow(toDisplayStudent(student));

    // Memperbarui hasil pencarian dan filter bila sedang digunakan.
    applyFilters();

    return true;
  }

  // Menyimpan data akademik untuk akun mahasiswa yang sudah dibuat.
  async function submitStudentForm() {
    // Menunggu pusat data SIPRESMA selesai diinisialisasi sebelum menyimpan.
    try {
      await getDataStore();
    } catch (error) {
      console.error("Data mahasiswa gagal dimuat:", error);
      showFieldError(studentNim, "Data mahasiswa belum siap. Muat ulang halaman.");
      return false;
    }

    // Mengambil identitas dari akun sebelum data diperiksa.
    syncStudentIdentity();

    if (!validateStudentForm()) return false;

    const nim = studentNim.value.trim();
    const account = getStoredStudent(nim);

    // Memastikan akun masih tersedia dan data akademik belum pernah diisi.
    if (!account) {
      showFieldError(studentNim, "Akun mahasiswa belum dibuat. Buat akun terlebih dahulu.");
      return false;
    }

    if (account.hasAcademicData === true) {
      showFieldError(studentNim, "Data akademik untuk NPM ini sudah diisi.");
      return false;
    }

    const ipk = Number(studentIpk.value.trim().replace(",", ".")).toFixed(2);

    // Memperbarui akun yang sama, bukan menambahkan akun baru.
    const student = dataStore.saveMahasiswa(Object.assign({}, account, {
      ipk: ipk,
      hasAcademicData: true
    }), nim);

    // Memperbarui baris yang sudah ada agar tidak terjadi duplikasi data.
    upsertStudentRow(toDisplayStudent(student));

    // Memperbarui hasil pencarian dan filter bila sedang digunakan.
    applyFilters();

    return true;
  }

  // Mengambil kolom pencarian data mahasiswa.
  const searchInput = document.querySelector(".dm-search input[type='search']");

  // Menyimpan kategori prestasi yang sedang dipilih.
  // Nilai awal Semua Kategori berarti seluruh data ditampilkan.
  let currentCategory = "Semua Kategori";

  // Membuat fungsi untuk menampilkan baris sesuai kata kunci dan kategori.
  // Pencarian mencakup nama mahasiswa, NIM, dan email.
  function applyFilters() {

    // Mengambil kata kunci pencarian dan mengubahnya menjadi huruf kecil.
    // Jika kolom pencarian tidak ditemukan, gunakan teks kosong.
    const term = searchInput ? searchInput.value.trim().toLowerCase() : "";

    // Mengambil seluruh baris tabel mahasiswa.
    const rows = Array.from(document.querySelectorAll(".dm-table tbody tr"));

    // Memeriksa setiap baris untuk menentukan apakah baris harus ditampilkan.
    rows.forEach(function (row) {

      // Mengambil elemen nama mahasiswa pada baris.
      const nameElement = row.querySelector(".dm-student-name");

      // Mengambil elemen NIM dan angkatan mahasiswa pada baris.
      const metaElement = row.querySelector(".dm-student-meta");

      // Mengambil elemen email jika tersedia, baik berupa class maupun data-email.
      const emailElement = row.querySelector(
        ".dm-student-email, .dm-email, [data-email], a[href^='mailto:']"
      );

      // Mengambil elemen kategori prestasi pada baris.
      const categoryElement = row.querySelector(".dm-badge");

      // Mengambil nama dari atribut data atau dari elemen nama.
      const name = (
        row.dataset.name || (nameElement ? nameElement.textContent : "")
      ).toLowerCase();

      // Mengambil NIM dari atribut data atau dari elemen informasi mahasiswa.
      const nim = (
        row.dataset.nim || (metaElement ? metaElement.textContent : "")
      ).toLowerCase();

      // Mengambil email dari atribut data atau dari elemen email.
      const email = (
        row.dataset.email ||
        (emailElement
          ? emailElement.dataset.email ||
            emailElement.getAttribute("href") ||
            emailElement.textContent
          : "")
      ).toLowerCase();

      // Mengambil kategori prestasi dari atribut data atau dari elemen kategori.
      const category = (
        row.dataset.category ||
        (categoryElement ? categoryElement.textContent : "")
      ).trim();

      // Memeriksa apakah baris cocok dengan kata kunci pencarian.
      // Kata kunci sebagian tetap dianggap cocok karena menggunakan includes().
      const matchesSearch =
        !term ||
        name.includes(term) ||
        nim.includes(term) ||
        email.includes(term);

      // Memeriksa apakah baris cocok dengan kategori yang dipilih.
      const matchesCategory =
        currentCategory === "Semua Kategori" || category === currentCategory;

      // Menyembunyikan baris yang tidak memenuhi kedua kondisi.
      row.hidden = !(matchesSearch && matchesCategory);
    });
  }

  // Menambahkan event input agar pencarian berjalan langsung saat pengguna mengetik.
  if (searchInput) searchInput.addEventListener("input", applyFilters);

  // Menerapkan kondisi awal tabel, termasuk jika kata kunci dipulihkan browser.
  applyFilters();

  // Mengambil elemen pembungkus dropdown kategori.
  const categoryRoot = document.getElementById("dm-category-select");

  // Mengambil tombol utama dropdown kategori.
  const categoryTrigger = document.getElementById("dm-category");

  // Mengambil elemen yang menampilkan kategori yang sedang dipilih.
  const categoryValue = document.getElementById("dm-category-value");

  // Mengambil daftar pilihan kategori yang ada di dalam dropdown.
  const categoryMenu = document.getElementById("dm-category-menu");

  // Memeriksa apakah seluruh elemen dropdown berhasil ditemukan.
  if (categoryRoot && categoryTrigger && categoryValue && categoryMenu) {

    // Mengambil semua pilihan kategori yang memiliki class dm-category-option.
    // Array.from() mengubah hasil querySelectorAll menjadi array.
    const options = Array.from(categoryMenu.querySelectorAll(".dm-category-option"));

    // Menentukan pilihan kategori yang pertama kali aktif.
    let selectedOption =

      // Mencari pilihan yang sudah memiliki class is-selected.
      options.find(function (option) {

        // Mengembalikan true jika pilihan memiliki class is-selected.
        return option.classList.contains("is-selected");

      // Jika tidak ada pilihan aktif, gunakan pilihan pertama.
      // Jika pilihan juga tidak tersedia, gunakan null.
      }) || options[0] || null;

    // Menyimpan status dropdown.
    // false berarti dropdown tertutup, sedangkan true berarti terbuka.
    let isOpen = false;

    // Membuat fungsi untuk membuka atau menutup dropdown.
    // open menentukan apakah dropdown akan dibuka atau ditutup.
    // focusOption menentukan apakah fokus diarahkan ke pilihan kategori.
    function setOpen(open, focusOption) {

      // Menyimpan status dropdown yang baru.
      isOpen = open;

      // Menambahkan atau menghapus class is-open sesuai status dropdown.
      categoryRoot.classList.toggle("is-open", open);

      // Mengubah atribut aria-expanded sesuai kondisi dropdown.
      // String(open) mengubah nilai boolean menjadi teks true atau false.
      categoryTrigger.setAttribute("aria-expanded", String(open));

      // Memeriksa apakah dropdown dibuka, fokus pilihan diminta,
      // dan sudah terdapat pilihan kategori yang aktif.
      if (open && focusOption && selectedOption) {

        // Menunggu browser menyelesaikan rendering sebelum mengatur fokus.
        window.requestAnimationFrame(function () {

          // Mengarahkan fokus ke pilihan kategori yang sedang aktif.
          selectedOption.focus({ preventScroll: true });
        });
      }
    }

    // Membuat fungsi untuk memilih salah satu kategori.
    // Parameter option merupakan pilihan kategori yang diklik pengguna.
    function selectOption(option) {

      // Jika pilihan kategori tidak ditemukan, hentikan fungsi.
      if (!option) return;

      // Mengulangi proses untuk semua pilihan kategori yang tersedia.
      options.forEach(function (item) {

        // Menambahkan class is-selected hanya pada pilihan yang dipilih.
        item.classList.toggle("is-selected", item === option);

        // Mengubah atribut aria-selected untuk menandai pilihan yang aktif.
        // Nilainya true jika pilihan tersebut dipilih dan false jika tidak.
        item.setAttribute("aria-selected", String(item === option));
      });

      // Menyimpan pilihan kategori yang baru dipilih.
      selectedOption = option;

      // Menyimpan kategori yang dipilih untuk proses penyaringan baris tabel.
      // Menggunakan dataset.value jika tersedia.
      // Jika tidak tersedia, gunakan teks dari elemen pilihan.
      currentCategory = option.dataset.value || option.textContent.trim();

      // Mengubah teks kategori yang ditampilkan pada dropdown.
      categoryValue.textContent = currentCategory;

      // Menutup dropdown setelah kategori dipilih.
      setOpen(false);

      // Mengembalikan fokus keyboard ke tombol utama dropdown.
      categoryTrigger.focus({ preventScroll: true });

      // Menampilkan baris tabel sesuai kategori dan kata kunci pencarian.
      applyFilters();
    }

    // Menambahkan event click pada tombol utama dropdown.
    categoryTrigger.addEventListener("click", function () {

      // Mengubah kondisi dropdown.
      // Jika sebelumnya tertutup, buka dropdown.
      // Jika sebelumnya terbuka, tutup dropdown.
      setOpen(!isOpen);
    });

    // Menambahkan event keydown untuk mengatur dropdown menggunakan keyboard.
    categoryTrigger.addEventListener("keydown", function (event) {

      // Memeriksa apakah pengguna menekan tombol panah bawah atau panah atas.
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {

        // Mencegah tindakan bawaan tombol panah pada browser.
        event.preventDefault();

        // Memeriksa apakah dropdown sebelumnya masih tertutup.
        if (!isOpen) {

          // Membuka dropdown sekaligus mengarahkan fokus ke pilihan aktif.
          setOpen(true, true);

          // Menghentikan proses selanjutnya.
          return;
        }

        // Memeriksa apakah sudah ada pilihan kategori yang aktif.
        if (selectedOption) {

          // Mengarahkan fokus ke pilihan kategori yang sedang aktif.
          selectedOption.focus({ preventScroll: true });
        }

      // Jika pengguna menekan Escape saat dropdown terbuka, jalankan bagian ini.
      } else if (event.key === "Escape" && isOpen) {

        // Mencegah tindakan bawaan tombol Escape.
        event.preventDefault();

        // Menutup dropdown.
        setOpen(false);
      }
    });

    // Mengulangi proses untuk setiap pilihan kategori yang tersedia.
    // index menunjukkan posisi setiap pilihan dalam array.
    options.forEach(function (option, index) {

      // Menambahkan event click pada setiap pilihan kategori.
      option.addEventListener("click", function () {

        // Memilih kategori yang diklik pengguna.
        selectOption(option);
      });

      // Menambahkan event keydown untuk mengatur pilihan menggunakan keyboard.
      option.addEventListener("keydown", function (event) {

        // Menyiapkan variabel untuk menyimpan posisi pilihan berikutnya.
        // Nilai awal null berarti belum ada pilihan berikutnya.
        let nextIndex = null;

        // Jika tombol panah bawah ditekan, pindah ke pilihan berikutnya.
        // Operator % membuat perpindahan kembali ke pilihan pertama
        // jika pengguna sudah berada pada pilihan terakhir.
        if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;

        // Jika tombol panah atas ditekan, pindah ke pilihan sebelumnya.
        // Perhitungan ini membuat perpindahan kembali ke pilihan terakhir
        // jika pengguna berada pada pilihan pertama.
        else if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;

        // Jika tombol Home ditekan, arahkan ke pilihan pertama.
        else if (event.key === "Home") nextIndex = 0;

        // Jika tombol End ditekan, arahkan ke pilihan terakhir.
        else if (event.key === "End") nextIndex = options.length - 1;

        // Jika tombol Enter atau Spasi ditekan, pilih kategori yang sedang aktif.
        else if (event.key === "Enter" || event.key === " ") {

          // Mencegah tindakan bawaan browser.
          event.preventDefault();

          // Menjalankan fungsi untuk memilih kategori.
          selectOption(option);

          // Menghentikan proses selanjutnya.
          return;

        // Jika tombol Escape ditekan, tutup dropdown.
        } else if (event.key === "Escape") {

          // Mencegah tindakan bawaan browser.
          event.preventDefault();

          // Menutup dropdown.
          setOpen(false);

          // Mengembalikan fokus ke tombol utama dropdown.
          categoryTrigger.focus({ preventScroll: true });

          // Menghentikan proses selanjutnya.
          return;

        // Jika tombol Tab ditekan, tutup dropdown.
        } else if (event.key === "Tab") {

          // Menutup dropdown ketika pengguna berpindah menggunakan Tab.
          setOpen(false);

          // Menghentikan proses selanjutnya.
          return;
        }

        // Memeriksa apakah posisi pilihan berikutnya sudah ditentukan.
        if (nextIndex !== null) {

          // Mencegah tindakan bawaan tombol keyboard.
          event.preventDefault();

          // Mengarahkan fokus ke pilihan kategori sesuai posisi berikutnya.
          options[nextIndex].focus({ preventScroll: true });
        }
      });
    });

    // Menambahkan event focusout pada pembungkus dropdown.
    // Event ini berjalan ketika fokus berpindah keluar dari suatu elemen.
    categoryRoot.addEventListener("focusout", function (event) {

      // Jika dropdown terbuka dan fokus berpindah ke luar pembungkus dropdown,
      // maka dropdown akan ditutup.
      if (isOpen && !categoryRoot.contains(event.relatedTarget)) setOpen(false);
    });

    // Menambahkan event pointerdown pada seluruh dokumen.
    // Event ini mendeteksi klik atau sentuhan pada halaman.
    document.addEventListener("pointerdown", function (event) {

      // Jika dropdown terbuka dan pengguna mengklik bagian di luar dropdown,
      // maka dropdown akan ditutup.
      if (isOpen && !categoryRoot.contains(event.target)) setOpen(false);
    });
  }

  // Memuat ulang baris tabel dari data pusat setelah data berubah.
  function refreshStoredRows() {
    if (!dataStore) return;

    removeMissingStoredRows();
    loadStoredStudents();
    applyFilters();
  }

  // Menyegarkan tabel ketika data mahasiswa atau prestasi berubah.
  function handleDataChange(event) {
    if (!dataStore) return;

    const key = event.type === "storage"
      ? event.key
      : event.detail && event.detail.key;

    if (key && key !== dataStore.KEYS.mahasiswa && key !== dataStore.KEYS.prestasi) return;

    refreshStoredRows();
  }

  window.addEventListener("storage", handleDataChange);
  window.addEventListener("sipresma:data-changed", handleDataChange);

  getDataStore()
    .then(function () {
      refreshStoredRows();

      // Menyesuaikan kembali formulir jika NPM sudah terisi sebelum data siap.
      if (studentNim && studentNim.value.trim()) {
        syncStudentIdentity();
        updateStudentNimStatus();
      }
    })
    .catch(function (error) {
      console.error("Data mahasiswa gagal dimuat:", error);
    });

// Menutup fungsi utama sekaligus langsung menjalankannya.
})();
