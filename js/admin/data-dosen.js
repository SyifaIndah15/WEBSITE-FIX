// Interaksi halaman data dosen: modal, pencarian, filter status, dan aksi tabel.
(() => {
  // Elemen yang dapat menerima fokus di dalam modal.
  const focusableSelector =
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

  // Modal reusable: buka/tutup, kunci fokus, dan kembalikan fokus ke pemicu.
  function setupModal(options) {
    const modal = options.modal;
    const dialog = modal ? modal.querySelector(".dd-modal__dialog") : null;
    if (!dialog) return null;

    let lastFocusedElement = null;

    function open(trigger) {
      if (!modal.hidden) return;

      lastFocusedElement = trigger instanceof HTMLElement ? trigger : document.activeElement;
      if (typeof options.onOpen === "function") options.onOpen();

      modal.hidden = false;
      document.body.classList.add("dd-modal-open");
      window.requestAnimationFrame(function () {
        dialog.focus({ preventScroll: true });
      });
    }

    function close() {
      if (modal.hidden) return;

      modal.hidden = true;

      if (!document.querySelector(".dd-modal:not([hidden])")) {
        document.body.classList.remove("dd-modal-open");
      }

      if (typeof options.onClose === "function") options.onClose();

      let focusTarget = lastFocusedElement;
      if (!focusTarget || !focusTarget.isConnected || focusTarget === document.body) {
        focusTarget = options.fallbackFocus;
      }

      if (focusTarget && focusTarget.isConnected) {
        focusTarget.focus({ preventScroll: true });
      }
    }

    modal.addEventListener("click", function (event) {
      if (event.target.closest(options.closeSelector)) close();
    });

    // Esc menutup modal; Tab ditahan agar fokus tetap di dalam modal.
    document.addEventListener("keydown", function (event) {
      if (modal.hidden) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(dialog.querySelectorAll(focusableSelector)).filter(
        function (element) {
          return element.offsetParent !== null;
        }
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (document.activeElement === dialog) {
        event.preventDefault();
        if (event.shiftKey) lastElement.focus();
        else firstElement.focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    });

    return { open: open, close: close };
  }

  const tableBody = document.getElementById("dd-table-body");
  const tableScroll = document.querySelector(".dd-table-scroll");
  const searchInput = document.getElementById("dd-search-input");
  const tableInfo = document.getElementById("dd-table-info");
  const emptyState = document.getElementById("dd-empty-state");
  const statusTrigger = document.getElementById("dd-status-trigger");
  const statusValue = document.getElementById("dd-status-value");
  const statusMenu = document.getElementById("dd-status-menu");
  const statusRoot = document.getElementById("dd-status-select");

  let currentStatus = "Semua Status";

  // Menyimpan seluruh data dosen selama halaman masih dibuka.
  // Data awal diambil dari baris tabel yang sudah tersedia.
  const lecturerData = tableBody
    ? Array.from(tableBody.querySelectorAll("tr")).map(function (row) {
        return {
          row: row,
          nidn: row.dataset.nidn || "",
          name: row.dataset.name || "",
          email: row.dataset.email || "",
          status: row.dataset.status || "Aktif"
        };
      })
    : [];

  // Menyimpan contoh struktur baris tabel untuk membuat baris data dosen baru.
  const rowTemplate = tableBody ? tableBody.querySelector("tr") : null;

  // Mengurutkan data dosen berdasarkan nama lengkap A-Z.
  function sortLecturerRows() {
    if (!tableBody) return;

    lecturerData.sort(function (first, second) {
      return first.name.localeCompare(second.name, "id", {
        sensitivity: "base"
      });
    });

    lecturerData.forEach(function (item) {
      tableBody.appendChild(item.row);
    });
  }

  // Tampilkan baris yang cocok dengan kata kunci pencarian dan status terpilih.
  // Sumber data utama adalah lecturerData, bukan baris tabel yang sudah dirender.
  function applyFilters() {
    let term = "";
    if (searchInput) term = searchInput.value.trim().toLowerCase();

    let visibleCount = 0;

    lecturerData.forEach(function (item) {
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.nidn.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term);
      const matchesStatus =
        currentStatus === "Semua Status" || item.status === currentStatus;
      const visible = matchesSearch && matchesStatus;

      item.row.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyState) emptyState.hidden = visibleCount !== 0;

    if (tableInfo) {
      tableInfo.textContent = `Menampilkan ${visibleCount} dari ${lecturerData.length} dosen Program Studi Teknik Informatika`;
    }
  }

  // ==================== FILTER STATUS ====================
  if (statusRoot && statusTrigger && statusValue && statusMenu) {
    const options = Array.from(statusMenu.querySelectorAll(".dd-status-option"));
    let selectedOption =
      options.find(function (option) {
        return option.classList.contains("is-selected");
      }) || options[0] || null;
    let isOpen = false;

    function setOpen(open, focusOption) {
      isOpen = open;
      statusRoot.classList.toggle("is-open", open);
      statusTrigger.setAttribute("aria-expanded", String(open));

      if (open && focusOption && selectedOption) {
        window.requestAnimationFrame(function () {
          selectedOption.focus({ preventScroll: true });
        });
      }
    }

    function selectOption(option) {
      if (!option) return;

      options.forEach(function (item) {
        item.classList.toggle("is-selected", item === option);
        item.setAttribute("aria-selected", String(item === option));
      });

      selectedOption = option;
      currentStatus = option.dataset.value || option.textContent.trim();
      statusValue.textContent = currentStatus;
      setOpen(false);
      statusTrigger.focus({ preventScroll: true });
      applyFilters();
    }

    statusTrigger.addEventListener("click", function () {
      setOpen(!isOpen);
    });

    statusTrigger.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();

        if (!isOpen) {
          setOpen(true, true);
        } else if (selectedOption) {
          selectedOption.focus({ preventScroll: true });
        }
      } else if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setOpen(false);
      }
    });

    options.forEach(function (option, index) {
      option.addEventListener("click", function () {
        selectOption(option);
      });

      option.addEventListener("keydown", function (event) {
        let nextIndex = null;

        if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
        else if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = options.length - 1;
        else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectOption(option);
          return;
        } else if (event.key === "Escape") {
          event.preventDefault();
          setOpen(false);
          statusTrigger.focus({ preventScroll: true });
          return;
        } else if (event.key === "Tab") {
          setOpen(false);
          return;
        }

        if (nextIndex !== null) {
          event.preventDefault();
          options[nextIndex].focus({ preventScroll: true });
        }
      });
    });

    statusRoot.addEventListener("focusout", function (event) {
      if (isOpen && !statusRoot.contains(event.relatedTarget)) setOpen(false);
    });

    document.addEventListener("pointerdown", function (event) {
      if (isOpen && !statusRoot.contains(event.target)) setOpen(false);
    });
  }

  // ==================== PENCARIAN ====================
  if (searchInput) searchInput.addEventListener("input", applyFilters);

  // ==================== MODAL BUAT AKUN ====================
  const createForm = document.getElementById("dd-create-form");
  const createTrigger = document.getElementById("dd-create-account-button");
  const createNidn = document.getElementById("dd-create-nidn");
  const createName = document.getElementById("dd-create-name");
  const createEmail = document.getElementById("dd-create-email");
  const createStatus = document.getElementById("dd-create-status");
  const createModal = setupModal({
    modal: document.getElementById("dd-create-modal"),
    closeSelector: "[data-dd-create-close]",
    fallbackFocus: createTrigger,
    onOpen: function () {
      if (createForm) createForm.reset();
    }
  });

  if (createModal && createTrigger) {
    createTrigger.addEventListener("click", () => createModal.open(createTrigger));
  }

  // Menghapus pesan validasi duplikat ketika pengguna memperbaiki input.
  [createNidn, createEmail].forEach(function (input) {
    if (!input) return;

    input.addEventListener("input", function () {
      input.setCustomValidity("");
    });
  });

  if (createModal && createForm) {
    createForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!createNidn || !createName || !createEmail || !createStatus) return;

      createNidn.setCustomValidity("");
      createEmail.setCustomValidity("");

      if (!createForm.reportValidity()) return;

      const nidn = createNidn.value.trim();
      const name = createName.value.trim();
      const email = createEmail.value.trim();
      const status = createStatus.value || "Aktif";

      const duplicateNidn = lecturerData.some(function (item) {
        return item.nidn === nidn;
      });
      const duplicateEmail = lecturerData.some(function (item) {
        return item.email.toLowerCase() === email.toLowerCase();
      });

      if (duplicateNidn || duplicateEmail) {
        const duplicateInput = duplicateNidn ? createNidn : createEmail;
        duplicateInput.setCustomValidity(
          duplicateNidn
            ? "NIDN sudah terdaftar pada akun dosen lain."
            : "Email sudah terdaftar pada akun dosen lain."
        );
        duplicateInput.reportValidity();
        return;
      }

      const row = createLecturerRow({
        nidn: nidn,
        name: name,
        email: email,
        status: status
      });

      if (!row) return;

      tableBody.appendChild(row);
      lecturerData.push({
        row: row,
        nidn: nidn,
        name: name,
        email: email,
        status: status
      });

      sortLecturerRows();
      applyFilters();

      createModal.close();
      createForm.reset();
    });
  }

  // ==================== MODAL EDIT ====================
  let editingRow = null;
  const editForm = document.getElementById("dd-edit-form");
  const editNidn = document.getElementById("dd-edit-nidn");
  const editName = document.getElementById("dd-edit-name");
  const editEmail = document.getElementById("dd-edit-email");
  const editStatus = document.getElementById("dd-edit-status");
  const editModal = setupModal({
    modal: document.getElementById("dd-edit-modal"),
    closeSelector: "[data-dd-edit-close]",
    fallbackFocus: tableScroll,
    onClose: function () {
      editingRow = null;
    }
  });

  // Ikon badge status akun dosen.
  const statusIconMarkup = {
    Aktif:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.2 12.2 2.4 2.4 5.2-5.2"/></svg>',
    Nonaktif:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>'
  };

  // Membuat baris tabel baru dari struktur baris yang sudah tersedia.
  function createLecturerRow(data) {
    if (!rowTemplate) return null;

    const status = data.status === "Nonaktif" ? "Nonaktif" : "Aktif";
    const row = rowTemplate.cloneNode(true);
    const nameElement = row.querySelector(".dd-lecturer-name");
    const metaElement = row.querySelector(".dd-lecturer-meta");
    const emailElement = row.querySelector(".dd-email-cell");
    const badge = row.querySelector(".dd-status");
    const editButton = row.querySelector(".dd-icon-button--edit");
    const deleteButton = row.querySelector(".dd-icon-button--delete");

    row.hidden = false;
    row.dataset.nidn = data.nidn;
    row.dataset.name = data.name;
    row.dataset.email = data.email;
    row.dataset.status = status;

    if (nameElement) nameElement.textContent = data.name;
    if (metaElement) metaElement.textContent = `NIDN: ${data.nidn}`;
    if (emailElement) emailElement.textContent = data.email;
    if (editButton) editButton.setAttribute("aria-label", `Edit data ${data.name}`);
    if (deleteButton) deleteButton.setAttribute("aria-label", `Hapus akun ${data.name}`);

    if (badge) {
      badge.className =
        status === "Aktif" ? "dd-status dd-status--active" : "dd-status dd-status--inactive";
      badge.innerHTML = statusIconMarkup[status] + status;
    }

    return row;
  }

  function openEditModal(row, trigger) {
    if (!editModal || !editForm || !row) return;

    editingRow = row;
    editForm.reset();
    editNidn.value = row.dataset.nidn || "";
    editName.value = row.dataset.name || "";
    editEmail.value = row.dataset.email || "";
    editStatus.value = row.dataset.status || "Aktif";
    editModal.open(trigger);
  }

  if (editModal && editForm) {
    editForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!editForm.reportValidity()) return;

      const row = editingRow;

      if (row) {
        const nidn = editNidn.value.trim();
        const name = editName.value.trim();
        const email = editEmail.value.trim();
        const status = editStatus.value;
        const nameElement = row.querySelector(".dd-lecturer-name");
        const metaElement = row.querySelector(".dd-lecturer-meta");
        const emailElement = row.querySelector(".dd-email-cell");
        const editButton = row.querySelector(".dd-icon-button--edit");
        const deleteButton = row.querySelector(".dd-icon-button--delete");
        const badge = row.querySelector(".dd-status");

        row.dataset.nidn = nidn;
        row.dataset.name = name;
        row.dataset.email = email;
        row.dataset.status = status;

        const data = lecturerData.find(function (item) {
          return item.row === row;
        });

        if (data) {
          data.nidn = nidn;
          data.name = name;
          data.email = email;
          data.status = status;
        }

        if (nameElement) nameElement.textContent = name;
        if (metaElement) metaElement.textContent = `NIDN: ${nidn}`;
        if (emailElement) emailElement.textContent = email;
        if (editButton) editButton.setAttribute("aria-label", `Edit data ${name}`);
        if (deleteButton) deleteButton.setAttribute("aria-label", `Hapus akun ${name}`);

        if (badge) {
          if (status === "Aktif") badge.className = "dd-status dd-status--active";
          else badge.className = "dd-status dd-status--inactive";

          badge.innerHTML = statusIconMarkup[status] + status;
        }

        sortLecturerRows();
        applyFilters();
      }

      editModal.close();
      editForm.reset();
    });
  }

  // ==================== MODAL HAPUS ====================
  let deletingRow = null;
  const confirmDeleteButton = document.getElementById("dd-confirm-delete-button");
  const deleteModal = setupModal({
    modal: document.getElementById("dd-delete-modal"),
    closeSelector: "[data-dd-delete-close]",
    fallbackFocus: tableScroll,
    onClose: function () {
      deletingRow = null;
    }
  });

  function openDeleteModal(row, trigger) {
    if (!deleteModal || !row) return;

    deletingRow = row;
    deleteModal.open(trigger);
  }

  if (deleteModal && confirmDeleteButton) {
    confirmDeleteButton.addEventListener("click", function () {
      const row = deletingRow;
      if (!row) return;

      row.remove();

      const dataIndex = lecturerData.findIndex(function (item) {
        return item.row === row;
      });

      if (dataIndex !== -1) lecturerData.splice(dataIndex, 1);

      deleteModal.close();
      applyFilters();
    });
  }

  // ==================== AKSI TABEL ====================
  const table = document.querySelector(".dd-table");

  if (table) {
    table.addEventListener("click", function (event) {
      const editButton = event.target.closest(".dd-icon-button--edit");
      if (editButton) {
        openEditModal(editButton.closest("tr"), editButton);
        return;
      }

      const deleteButton = event.target.closest(".dd-icon-button--delete");
      if (deleteButton) openDeleteModal(deleteButton.closest("tr"), deleteButton);
    });
  }

  // Urutkan data dan tampilkan seluruhnya saat halaman pertama kali dimuat.
  sortLecturerRows();
  applyFilters();
})();
