// Membuat fungsi utama yang langsung dijalankan ketika file JavaScript dibaca.
(() => {

  // Menentukan elemen HTML yang boleh menerima fokus keyboard.
  // Contohnya tombol, input, dropdown, textarea, tautan, dan elemen dengan tabindex.
  // Selector ini digunakan untuk mengatur perpindahan fokus di dalam popup (modal).
  const focusableSelector =
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

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

      // Menambahkan event submit ketika formulir dikirim.
      form.addEventListener("submit", function (event) {

        // Mencegah formulir dikirim secara otomatis oleh browser.
        event.preventDefault();

        // Memeriksa apakah seluruh input sudah memenuhi aturan validasi HTML.
        // Jika tidak valid, hentikan proses.
        if (!form.reportValidity()) return;

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
  setupFormModal({
    formId: "dm-account-form",
    triggerId: "dm-create-account-button",
    modalId: "dm-account-modal",
    closeSelector: "[data-dm-account-close]"
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
    resetOnOpen: true
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
    editForm.addEventListener("submit", (event) => {

      // Mencegah formulir dikirim secara otomatis oleh browser.
      event.preventDefault();

      // Memeriksa apakah seluruh input memenuhi aturan validasi HTML.
      // Jika tidak valid, hentikan proses penyimpanan perubahan.
      if (!editForm.reportValidity()) return;

      // Mengambil kembali baris tabel mahasiswa yang sedang diedit.
      const row = editingRow;

      // Memeriksa apakah terdapat baris mahasiswa yang sedang diedit.
      if (row) {

        // Mengambil nama baru dan menghapus spasi di awal serta akhir.
        const name = editName.value.trim();

        // Mengambil NIM baru dan menghapus spasi di awal serta akhir.
        const nim = editNim.value.trim();

        // Mengambil tahun angkatan baru dan menghapus spasi di awal serta akhir.
        const year = editYear.value.trim();

        // Mengambil nilai IPK baru, menghapus spasi,
        // kemudian mengganti tanda koma menjadi tanda titik.
        const ipk = editIpk.value.trim().replace(",", ".");

        // Mengambil elemen nama mahasiswa pada baris tabel yang sedang diedit.
        const nameElement = row.querySelector(".dm-student-name");

        // Mengambil elemen informasi NIM dan angkatan pada baris tabel.
        const metaElement = row.querySelector(".dm-student-meta");

        // Mengambil elemen nilai IPK pada baris tabel.
        const ipkElement = row.querySelector(".dm-ipk");

        // Mengambil tombol untuk mengedit data mahasiswa.
        const editButton = row.querySelector(".dm-icon-button--edit");

        // Mengambil tombol untuk menghapus data mahasiswa.
        const deleteButton = row.querySelector(".dm-icon-button--delete");

        // Jika elemen nama tersedia, ubah teksnya dengan nama yang baru.
        if (nameElement) nameElement.textContent = name;

        // Jika elemen informasi tersedia, perbarui NIM dan tahun angkatan.
        // \u00b7 digunakan untuk menampilkan simbol titik tengah sebagai pemisah.
        if (metaElement) metaElement.textContent = `NIM: ${nim} \u00b7 Angkatan ${year}`;

        // Jika elemen IPK tersedia, ubah nilainya dengan IPK yang baru.
        if (ipkElement) ipkElement.textContent = ipk;

        // Jika tombol edit tersedia, perbarui keterangan aksesibilitasnya.
        if (editButton) editButton.setAttribute("aria-label", `Edit data ${name}`);

        // Jika tombol hapus tersedia, perbarui keterangan aksesibilitasnya.
        if (deleteButton) deleteButton.setAttribute("aria-label", `Hapus data ${name}`);
      }

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
    confirmDeleteButton.addEventListener("click", function () {

      // Mengambil baris mahasiswa yang sebelumnya dipilih untuk dihapus.
      const row = deletingRow;

      // Memeriksa apakah baris mahasiswa tersedia.
      // Jika tidak tersedia, hentikan proses.
      if (!row) return;

      // Menghapus baris mahasiswa dari tampilan tabel HTML.
      row.remove();

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

      // Mengubah teks kategori yang ditampilkan pada dropdown.
      // Menggunakan dataset.value jika tersedia.
      // Jika tidak tersedia, gunakan teks dari elemen pilihan.
      categoryValue.textContent = option.dataset.value || option.textContent.trim();

      // Menutup dropdown setelah kategori dipilih.
      setOpen(false);

      // Mengembalikan fokus keyboard ke tombol utama dropdown.
      categoryTrigger.focus({ preventScroll: true });
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

// Menutup fungsi utama sekaligus langsung menjalankannya.
})();
