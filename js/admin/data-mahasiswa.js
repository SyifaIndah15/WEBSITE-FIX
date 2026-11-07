
    (() => {
      const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

      const setupModal = ({ modal, closeSelector, onOpen, onClose, fallbackFocus }) => {
        if (!modal) {
          return null;
        }

        const dialog = modal.querySelector(".dm-modal__dialog");

        if (!dialog) {
          return null;
        }

        let lastFocusedElement = null;

        const getFocusableElements = () => {
          return Array.from(dialog.querySelectorAll(focusableSelector)).filter(
            (element) => element.offsetParent !== null
          );
        };

        const open = (trigger) => {
          if (!modal.hidden) {
            return;
          }

          lastFocusedElement = trigger instanceof HTMLElement ? trigger : document.activeElement;

          if (typeof onOpen === "function") {
            onOpen();
          }

          modal.hidden = false;
          document.body.classList.add("dm-modal-open");
          window.requestAnimationFrame(() => dialog.focus({ preventScroll: true }));
        };

        const close = ({ restoreFocus = true } = {}) => {
          if (modal.hidden) {
            return;
          }

          modal.hidden = true;

          if (!document.querySelector(".dm-modal:not([hidden])")) {
            document.body.classList.remove("dm-modal-open");
          }

          if (typeof onClose === "function") {
            onClose();
          }

          if (!restoreFocus) {
            return;
          }

          const fallback =
            fallbackFocus instanceof HTMLElement && fallbackFocus.isConnected ? fallbackFocus : null;
          const focusTarget =
            lastFocusedElement instanceof HTMLElement &&
              lastFocusedElement.isConnected &&
              lastFocusedElement !== document.body
              ? lastFocusedElement
              : fallback;

          if (focusTarget) {
            focusTarget.focus({ preventScroll: true });
          }
        };

        modal.addEventListener("click", (event) => {
          if (event.target.closest(closeSelector)) {
            close();
          }
        });

        document.addEventListener("keydown", (event) => {
          if (modal.hidden) {
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            close();
            return;
          }

          if (event.key !== "Tab") {
            return;
          }

          const focusableElements = getFocusableElements();

          if (focusableElements.length === 0) {
            event.preventDefault();
            return;
          }

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (document.activeElement === dialog) {
            event.preventDefault();
            (event.shiftKey ? lastElement : firstElement).focus();
          } else if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        });

        return { modal, dialog, open, close };
      };

      const tableScroll = document.querySelector(".dm-table-scroll");

      const accountForm = document.getElementById("dm-account-form");
      const accountTrigger = document.getElementById("dm-create-account-button");
      const accountModal = setupModal({
        modal: document.getElementById("dm-account-modal"),
        closeSelector: "[data-dm-account-close]"
      });

      if (accountModal && accountTrigger) {
        accountTrigger.addEventListener("click", () => accountModal.open(accountTrigger));
      }

      if (accountModal && accountForm) {
        accountForm.addEventListener("submit", (event) => {
          event.preventDefault();

          if (!accountForm.reportValidity()) {
            return;
          }

          accountModal.close();
          accountForm.reset();
        });
      }

      const studentForm = document.getElementById("dm-student-form");
      const studentTrigger = document.getElementById("dm-add-student-button");
      const studentModal = setupModal({
        modal: document.getElementById("dm-student-modal"),
        closeSelector: "[data-dm-student-close]",
        onOpen: () => {
          if (studentForm) {
            studentForm.reset();
          }
        }
      });

      if (studentModal && studentTrigger) {
        studentTrigger.addEventListener("click", () => studentModal.open(studentTrigger));
      }

      if (studentModal && studentForm) {
        studentForm.addEventListener("submit", (event) => {
          event.preventDefault();

          if (!studentForm.reportValidity()) {
            return;
          }

          studentModal.close();
          studentForm.reset();
        });
      }

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
        onClose: () => {
          editingRow = null;
        }
      });

      const getRowData = (row) => {
        const name = row.querySelector(".dm-student-name")?.textContent.trim() || "";
        const meta = row.querySelector(".dm-student-meta")?.textContent.trim() || "";
        const nim = meta.match(/NIM:\s*([0-9]+)/i)?.[1] || "";
        const year = meta.match(/Angkatan\s+([0-9]{4})/i)?.[1] || "";
        const ipk = row.querySelector(".dm-ipk")?.textContent.trim() || "";

        return { name, nim, year, ipk };
      };

      const openEditModal = (row, trigger) => {
        if (!editModal || !editForm || !row) {
          return;
        }

        const data = getRowData(row);

        editingRow = row;
        editForm.reset();
        editNim.value = data.nim;
        editYear.value = data.year;
        editName.value = data.name;
        editIpk.value = data.ipk;
        editModal.open(trigger);
      };

      if (editModal && editForm) {
        editForm.addEventListener("submit", (event) => {
          event.preventDefault();

          if (!editForm.reportValidity()) {
            return;
          }

          const row = editingRow;
          const name = editName.value.trim();
          const nim = editNim.value.trim();
          const year = editYear.value.trim();
          const ipk = editIpk.value.trim().replace(",", ".");

          if (row) {
            const nameElement = row.querySelector(".dm-student-name");
            const metaElement = row.querySelector(".dm-student-meta");
            const ipkElement = row.querySelector(".dm-ipk");

            if (nameElement) {
              nameElement.textContent = name;
            }

            if (metaElement) {
              metaElement.textContent = `NIM: ${nim} \u00b7 Angkatan ${year}`;
            }

            if (ipkElement) {
              ipkElement.textContent = ipk;
            }

            const editButton = row.querySelector(".dm-icon-button--edit");
            const deleteButton = row.querySelector(".dm-icon-button--delete");

            if (editButton) {
              editButton.setAttribute("aria-label", `Edit data ${name}`);
            }

            if (deleteButton) {
              deleteButton.setAttribute("aria-label", `Hapus data ${name}`);
            }
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
        onClose: () => {
          deletingRow = null;
        }
      });

      const openDeleteModal = (row, trigger) => {
        if (!deleteModal || !row) {
          return;
        }

        const data = getRowData(row);
        deletingRow = row;

        if (deleteIdentity) {
          deleteIdentity.textContent = `${data.name} \u00b7 NIM ${data.nim}`;
        }

        deleteModal.open(trigger);
      };

      if (deleteModal && confirmDeleteButton) {
        confirmDeleteButton.addEventListener("click", () => {
          const row = deletingRow;

          if (!row) {
            return;
          }

          row.remove();
          deletingRow = null;
          deleteModal.close();
        });
      }

      const table = document.querySelector(".dm-table");

      if (table) {
        table.addEventListener("click", (event) => {
          const editButton = event.target.closest(".dm-icon-button--edit");

          if (editButton) {
            openEditModal(editButton.closest("tr"), editButton);
            return;
          }

          const deleteButton = event.target.closest(".dm-icon-button--delete");

          if (deleteButton) {
            openDeleteModal(deleteButton.closest("tr"), deleteButton);
          }
        });
      }

      const categoryRoot = document.getElementById("dm-category-select");
      const categoryTrigger = document.getElementById("dm-category");
      const categoryValue = document.getElementById("dm-category-value");
      const categoryMenu = document.getElementById("dm-category-menu");

      if (categoryRoot && categoryTrigger && categoryValue && categoryMenu) {
        const options = Array.from(categoryMenu.querySelectorAll(".dm-category-option"));
        let selectedOption = options.find((option) => option.classList.contains("is-selected")) || options[0] || null;
        let isOpen = false;

        const setOpen = (open, focusOption = false) => {
          isOpen = open;
          categoryRoot.classList.toggle("is-open", open);
          categoryTrigger.setAttribute("aria-expanded", String(open));

          if (open && focusOption && selectedOption) {
            window.requestAnimationFrame(() => selectedOption.focus({ preventScroll: true }));
          }
        };

        const selectOption = (option) => {
          if (!option) {
            return;
          }

          options.forEach((item) => {
            const isSelected = item === option;
            item.classList.toggle("is-selected", isSelected);
            item.setAttribute("aria-selected", String(isSelected));
          });

          selectedOption = option;
          categoryValue.textContent = option.dataset.value || option.textContent.trim();
          setOpen(false);
          categoryTrigger.focus({ preventScroll: true });
        };

        categoryTrigger.addEventListener("click", () => {
          setOpen(!isOpen);
        });

        categoryTrigger.addEventListener("keydown", (event) => {
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

        options.forEach((option, index) => {
          option.addEventListener("click", () => selectOption(option));

          option.addEventListener("keydown", (event) => {
            let nextIndex = null;

            if (event.key === "ArrowDown") {
              nextIndex = (index + 1) % options.length;
            } else if (event.key === "ArrowUp") {
              nextIndex = (index - 1 + options.length) % options.length;
            } else if (event.key === "Home") {
              nextIndex = 0;
            } else if (event.key === "End") {
              nextIndex = options.length - 1;
            } else if (event.key === "Enter" || event.key === " ") {
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

        categoryRoot.addEventListener("focusout", (event) => {
          if (isOpen && !categoryRoot.contains(event.relatedTarget)) {
            setOpen(false);
          }
        });

        document.addEventListener("pointerdown", (event) => {
          if (isOpen && !categoryRoot.contains(event.target)) {
            setOpen(false);
          }
        });
      }
    })();
  