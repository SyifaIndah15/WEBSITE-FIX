(() => {
  const focusableSelector =
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

  function setupModal(options) {
    const modal = options.modal;
    const dialog = modal ? modal.querySelector(".dm-modal__dialog") : null;
    if (!dialog) return null;

    let lastFocusedElement = null;

    function open(trigger) {
      if (!modal.hidden) return;

      lastFocusedElement = trigger instanceof HTMLElement ? trigger : document.activeElement;
      if (typeof options.onOpen === "function") options.onOpen();

      modal.hidden = false;
      document.body.classList.add("dm-modal-open");
      window.requestAnimationFrame(function () {
        dialog.focus({ preventScroll: true });
      });
    }

    function close() {
      if (modal.hidden) return;

      modal.hidden = true;

      if (!document.querySelector(".dm-modal:not([hidden])")) {
        document.body.classList.remove("dm-modal-open");
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

  const tableScroll = document.querySelector(".dm-table-scroll");

  function setupFormModal(options) {
    const form = document.getElementById(options.formId);
    const trigger = document.getElementById(options.triggerId);
    const modal = setupModal({
      modal: document.getElementById(options.modalId),
      closeSelector: options.closeSelector,
      onOpen: function () {
        if (options.resetOnOpen && form) form.reset();
      }
    });

    if (modal && trigger) {
      trigger.addEventListener("click", function () {
        modal.open(trigger);
      });
    }

    if (modal && form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!form.reportValidity()) return;

        modal.close();
        form.reset();
      });
    }

    return modal;
  }

  setupFormModal({
    formId: "dm-account-form",
    triggerId: "dm-create-account-button",
    modalId: "dm-account-modal",
    closeSelector: "[data-dm-account-close]"
  });

  setupFormModal({
    formId: "dm-student-form",
    triggerId: "dm-add-student-button",
    modalId: "dm-student-modal",
    closeSelector: "[data-dm-student-close]",
    resetOnOpen: true
  });

  let editingRow = null;
  const editForm = document.getElementById("dm-edit-form");
  const editNim = document.getElementById("dm-edit-nim");
  const editYear = document.getElementById("dm-edit-year");
  const editName = document.getElementById("dm-edit-name");
  const editIpk = document.getElementById("dm-edit-ipk");
  const editModal = setupModal({
    modal: document.getElementById("dm-edit-modal"),
    closeSelector: "[data-dm-edit-close]",
    fallbackFocus: tableScroll,
    onClose: function () {
      editingRow = null;
    }
  });

  function getRowData(row) {
    const nameElement = row.querySelector(".dm-student-name");
    const metaElement = row.querySelector(".dm-student-meta");
    const ipkElement = row.querySelector(".dm-ipk");
    const meta = metaElement ? metaElement.textContent.trim() : "";
    const nimMatch = meta.match(/NIM:\s*([0-9]+)/i);
    const yearMatch = meta.match(/Angkatan\s+([0-9]{4})/i);

    return {
      name: nameElement ? nameElement.textContent.trim() : "",
      nim: nimMatch ? nimMatch[1] : "",
      year: yearMatch ? yearMatch[1] : "",
      ipk: ipkElement ? ipkElement.textContent.trim() : ""
    };
  }

  function openEditModal(row, trigger) {
    if (!editModal || !editForm || !row) return;

    const data = getRowData(row);

    editingRow = row;
    editForm.reset();
    editNim.value = data.nim;
    editYear.value = data.year;
    editName.value = data.name;
    editIpk.value = data.ipk;
    editModal.open(trigger);
  }

  if (editModal && editForm) {
    editForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!editForm.reportValidity()) return;

      const row = editingRow;

      if (row) {
        const name = editName.value.trim();
        const nim = editNim.value.trim();
        const year = editYear.value.trim();
        const ipk = editIpk.value.trim().replace(",", ".");
        const nameElement = row.querySelector(".dm-student-name");
        const metaElement = row.querySelector(".dm-student-meta");
        const ipkElement = row.querySelector(".dm-ipk");
        const editButton = row.querySelector(".dm-icon-button--edit");
        const deleteButton = row.querySelector(".dm-icon-button--delete");

        if (nameElement) nameElement.textContent = name;
        if (metaElement) metaElement.textContent = `NIM: ${nim} \u00b7 Angkatan ${year}`;
        if (ipkElement) ipkElement.textContent = ipk;
        if (editButton) editButton.setAttribute("aria-label", `Edit data ${name}`);
        if (deleteButton) deleteButton.setAttribute("aria-label", `Hapus data ${name}`);
      }

      editModal.close();
      editForm.reset();
    });
  }

  let deletingRow = null;
  const deleteIdentity = document.getElementById("dm-delete-identity");
  const confirmDeleteButton = document.getElementById("dm-confirm-delete-button");
  const deleteModal = setupModal({
    modal: document.getElementById("dm-delete-modal"),
    closeSelector: "[data-dm-delete-close]",
    fallbackFocus: tableScroll,
    onClose: function () {
      deletingRow = null;
    }
  });

  function openDeleteModal(row, trigger) {
    if (!deleteModal || !row) return;

    const data = getRowData(row);
    deletingRow = row;

    if (deleteIdentity) deleteIdentity.textContent = `${data.name} \u00b7 NIM ${data.nim}`;
    deleteModal.open(trigger);
  }

  if (deleteModal && confirmDeleteButton) {
    confirmDeleteButton.addEventListener("click", function () {
      const row = deletingRow;
      if (!row) return;

      row.remove();
      deletingRow = null;
      deleteModal.close();
    });
  }

  const table = document.querySelector(".dm-table");

  if (table) {
    table.addEventListener("click", function (event) {
      const editButton = event.target.closest(".dm-icon-button--edit");
      if (editButton) {
        openEditModal(editButton.closest("tr"), editButton);
        return;
      }

      const deleteButton = event.target.closest(".dm-icon-button--delete");
      if (deleteButton) openDeleteModal(deleteButton.closest("tr"), deleteButton);
    });
  }

  const categoryRoot = document.getElementById("dm-category-select");
  const categoryTrigger = document.getElementById("dm-category");
  const categoryValue = document.getElementById("dm-category-value");
  const categoryMenu = document.getElementById("dm-category-menu");

  if (categoryRoot && categoryTrigger && categoryValue && categoryMenu) {
    const options = Array.from(categoryMenu.querySelectorAll(".dm-category-option"));
    let selectedOption =
      options.find(function (option) {
        return option.classList.contains("is-selected");
      }) || options[0] || null;
    let isOpen = false;

    function setOpen(open, focusOption) {
      isOpen = open;
      categoryRoot.classList.toggle("is-open", open);
      categoryTrigger.setAttribute("aria-expanded", String(open));

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
      categoryValue.textContent = option.dataset.value || option.textContent.trim();
      setOpen(false);
      categoryTrigger.focus({ preventScroll: true });
    }

    categoryTrigger.addEventListener("click", function () {
      setOpen(!isOpen);
    });

    categoryTrigger.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();

        if (!isOpen) {
          setOpen(true, true);
          return;
        }

        if (selectedOption) {
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
          categoryTrigger.focus({ preventScroll: true });
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

    categoryRoot.addEventListener("focusout", function (event) {
      if (isOpen && !categoryRoot.contains(event.relatedTarget)) setOpen(false);
    });

    document.addEventListener("pointerdown", function (event) {
      if (isOpen && !categoryRoot.contains(event.target)) setOpen(false);
    });
  }
})();
