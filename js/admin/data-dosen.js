// Interaksi halaman data dosen: modal, pencarian, filter status, dan aksi tabel.
(() => {
  // Elemen yang dapat menerima fokus di dalam modal.
  const focusableSelector =
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

  // Modal reusable: buka/tutup, kunci fokus, dan kembalikan fokus ke pemicu.
  const setupModal = ({ modal, closeSelector, onOpen, onClose, fallbackFocus }) => {
    if (!modal) return null;

    const dialog = modal.querySelector(".dd-modal__dialog");
    if (!dialog) return null;

    let lastFocusedElement = null;

    const getFocusableElements = () =>
      Array.from(dialog.querySelectorAll(focusableSelector)).filter(
        (element) => element.offsetParent !== null
      );

    const open = (trigger) => {
      if (!modal.hidden) return;

      lastFocusedElement = trigger instanceof HTMLElement ? trigger : document.activeElement;
      if (typeof onOpen === "function") onOpen();

      modal.hidden = false;
      document.body.classList.add("dd-modal-open");
      window.requestAnimationFrame(() => dialog.focus({ preventScroll: true }));
    };

    const close = ({ restoreFocus = true } = {}) => {
      if (modal.hidden) return;

      modal.hidden = true;

      if (!document.querySelector(".dd-modal:not([hidden])")) {
        document.body.classList.remove("dd-modal-open");
      }

      if (typeof onClose === "function") onClose();
      if (!restoreFocus) return;

      const fallback =
        fallbackFocus instanceof HTMLElement && fallbackFocus.isConnected ? fallbackFocus : null;
      const focusTarget =
        lastFocusedElement instanceof HTMLElement &&
        lastFocusedElement.isConnected &&
        lastFocusedElement !== document.body
          ? lastFocusedElement
          : fallback;

      if (focusTarget) focusTarget.focus({ preventScroll: true });
    };

    modal.addEventListener("click", (event) => {
      if (event.target.closest(closeSelector)) close();
    });

    // Esc menutup modal; Tab ditahan agar fokus tetap di dalam modal.
    document.addEventListener("keydown", (event) => {
      if (modal.hidden) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      let nextFocus = null;

      if (document.activeElement === dialog) {
        nextFocus = event.shiftKey ? lastElement : firstElement;
      } else if (event.shiftKey && document.activeElement === firstElement) {
        nextFocus = lastElement;
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        nextFocus = firstElement;
      }

      if (nextFocus) {
        event.preventDefault();
        nextFocus.focus();
      }
    });

    return { modal, dialog, open, close };
  };

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

  const getRows = () => (tableBody ? Array.from(tableBody.querySelectorAll("tr")) : []);

  // Tampilkan baris yang cocok dengan kata kunci pencarian dan status terpilih.
  const applyFilters = () => {
    const term = (searchInput?.value || "").trim().toLowerCase();
    let visibleCount = 0;

    getRows().forEach((row) => {
      const matchesSearch =
        !term ||
        (row.dataset.name || "").toLowerCase().includes(term) ||
        (row.dataset.nidn || "").includes(term) ||
        (row.dataset.email || "").toLowerCase().includes(term);
      const matchesStatus =
        currentStatus === "Semua Status" || row.dataset.status === currentStatus;
      const visible = matchesSearch && matchesStatus;

      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyState) emptyState.hidden = visibleCount !== 0;

    if (tableInfo) {
      tableInfo.textContent = `Menampilkan ${visibleCount} dari ${getRows().length} dosen Program Studi Teknik Informatika`;
    }
  };

  // ==================== FILTER STATUS ====================
  if (statusRoot && statusTrigger && statusValue && statusMenu) {
    const options = Array.from(statusMenu.querySelectorAll(".dd-status-option"));
    let selectedOption =
      options.find((option) => option.classList.contains("is-selected")) || options[0] || null;
    let isOpen = false;

    const setOpen = (open, focusOption = false) => {
      isOpen = open;
      statusRoot.classList.toggle("is-open", open);
      statusTrigger.setAttribute("aria-expanded", String(open));

      if (open && focusOption && selectedOption) {
        window.requestAnimationFrame(() => selectedOption.focus({ preventScroll: true }));
      }
    };

    const selectOption = (option) => {
      if (!option) return;

      options.forEach((item) => {
        const isSelected = item === option;
        item.classList.toggle("is-selected", isSelected);
        item.setAttribute("aria-selected", String(isSelected));
      });

      selectedOption = option;
      currentStatus = option.dataset.value || option.textContent.trim();
      statusValue.textContent = currentStatus;
      setOpen(false);
      statusTrigger.focus({ preventScroll: true });
      applyFilters();
    };

    statusTrigger.addEventListener("click", () => setOpen(!isOpen));

    statusTrigger.addEventListener("keydown", (event) => {
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

    options.forEach((option, index) => {
      option.addEventListener("click", () => selectOption(option));

      option.addEventListener("keydown", (event) => {
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

    statusRoot.addEventListener("focusout", (event) => {
      if (isOpen && !statusRoot.contains(event.relatedTarget)) setOpen(false);
    });

    document.addEventListener("pointerdown", (event) => {
      if (isOpen && !statusRoot.contains(event.target)) setOpen(false);
    });
  }

  // ==================== PENCARIAN ====================
  if (searchInput) searchInput.addEventListener("input", applyFilters);

  // ==================== MODAL BUAT AKUN ====================
  const createForm = document.getElementById("dd-create-form");
  const createTrigger = document.getElementById("dd-create-account-button");
  const createModal = setupModal({
    modal: document.getElementById("dd-create-modal"),
    closeSelector: "[data-dd-create-close]",
    fallbackFocus: createTrigger,
    onOpen: () => {
      if (createForm) createForm.reset();
    }
  });

  if (createModal && createTrigger) {
    createTrigger.addEventListener("click", () => createModal.open(createTrigger));
  }

  if (createModal && createForm) {
    createForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!createForm.reportValidity()) return;

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
    onClose: () => {
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

  const updateStatusBadge = (row, status) => {
    const badge = row.querySelector(".dd-status");
    if (!badge) return;

    badge.className = `dd-status dd-status--${status === "Aktif" ? "active" : "inactive"}`;
    badge.innerHTML = `${statusIconMarkup[status]}${status}`;
  };

  const openEditModal = (row, trigger) => {
    if (!editModal || !editForm || !row) return;

    editingRow = row;
    editForm.reset();
    editNidn.value = row.dataset.nidn || "";
    editName.value = row.dataset.name || "";
    editEmail.value = row.dataset.email || "";
    editStatus.value = row.dataset.status || "Aktif";
    editModal.open(trigger);
  };

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

        row.dataset.nidn = nidn;
        row.dataset.name = name;
        row.dataset.email = email;
        row.dataset.status = status;

        if (nameElement) nameElement.textContent = name;
        if (metaElement) metaElement.textContent = `NIDN: ${nidn}`;
        if (emailElement) emailElement.textContent = email;
        if (editButton) editButton.setAttribute("aria-label", `Edit data ${name}`);
        if (deleteButton) deleteButton.setAttribute("aria-label", `Hapus akun ${name}`);

        updateStatusBadge(row, status);
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
    onClose: () => {
      deletingRow = null;
    }
  });

  const openDeleteModal = (row, trigger) => {
    if (!deleteModal || !row) return;

    deletingRow = row;
    deleteModal.open(trigger);
  };

  if (deleteModal && confirmDeleteButton) {
    confirmDeleteButton.addEventListener("click", () => {
      const row = deletingRow;
      if (!row) return;

      row.remove();
      deletingRow = null;
      deleteModal.close();
      applyFilters();
    });
  }

  // ==================== AKSI TABEL ====================
  const table = document.querySelector(".dd-table");

  if (table) {
    table.addEventListener("click", (event) => {
      const editButton = event.target.closest(".dd-icon-button--edit");
      if (editButton) {
        openEditModal(editButton.closest("tr"), editButton);
        return;
      }

      const deleteButton = event.target.closest(".dd-icon-button--delete");
      if (deleteButton) openDeleteModal(deleteButton.closest("tr"), deleteButton);
    });
  }

  // Tampilkan seluruh data saat halaman pertama kali dimuat.
  applyFilters();
})();
