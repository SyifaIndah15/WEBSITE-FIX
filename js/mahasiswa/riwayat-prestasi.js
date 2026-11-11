(() => {
  const tbody = document.getElementById("history-rows");
  const emptyState = document.getElementById("history-empty");
  const table = document.getElementById("history-table");

  if (!tbody) {
    return;
  }

  const pdfIcon = `
    <svg viewBox="0 0 16 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 2.5h5.3l2.7 2.7v8.3H4z"/>
      <path d="M9.3 2.5v2.7h2.7"/>
      <path d="M6 8h4M6 10.4h4"/>
    </svg>
  `;

  const statusView = {
    Terverifikasi: {
      className: "verified",
      icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="m5.2 8.1 1.8 1.8 3.9-4"/></svg>`
    },
    Diajukan: {
      className: "submitted",
      icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 4.6V8l2.2 1.3"/></svg>`
    },
    "Perlu Perbaikan": {
      className: "revision",
      icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 4.6v4M8 11.4h.01"/></svg>`
    },
    Ditolak: {
      className: "rejected",
      icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="m6 6 4 4M10 6l-4 4"/></svg>`
    }
  };

  function escapeHtml(value) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return entities[character];
    });
  }

  function buildStatus(status) {
    const view = statusView[status] || statusView.Diajukan;
    return `
      <span class="history-status history-status--${view.className}">
        ${view.icon}
        <span>${escapeHtml(status)}</span>
      </span>
    `;
  }

  function buildEvidence(item) {
    if (!item.bukti) {
      return `
        <div class="row-actions">
          <span class="action-button action-button--pdf" aria-disabled="true" title="Dokumen bukti belum tersedia">
            ${pdfIcon}
            <span>Belum Tersedia</span>
          </span>
        </div>
      `;
    }

    return `
      <div class="row-actions">
        <a class="action-button action-button--pdf" href="${escapeHtml(item.bukti)}" target="_blank" rel="noopener" title="Buka dokumen bukti PDF">
          ${pdfIcon}
          <span>Lihat PDF</span>
        </a>
      </div>
    `;
  }

  function buildRow(item, index) {
    return `
      <tr>
        <td class="history-cell history-cell--number" data-label="No">
          <span class="row-number">${String(index + 1).padStart(2, "0")}</span>
        </td>
        <td class="history-cell history-cell--achievement" data-label="Nama Prestasi &amp; Penyelenggara">
          <span class="history-name">${escapeHtml(item.namaPrestasi)}</span>
          <span class="history-organizer">${escapeHtml(item.penyelenggara)}</span>
        </td>
        <td class="history-cell history-cell--type" data-label="Jenis &amp; Tingkat">
          <span class="cell-primary">${escapeHtml(item.jenis)}</span>
          <span class="cell-secondary">${escapeHtml(item.tingkat)}</span>
        </td>
        <td class="history-cell history-cell--rank" data-label="Peringkat">
          <span class="cell-primary">${escapeHtml(item.peringkat)}</span>
        </td>
        <td class="history-cell history-cell--year" data-label="Tahun">
          <span class="cell-primary">${escapeHtml(item.tahun)}</span>
        </td>
        <td class="history-cell history-cell--status" data-label="Status">
          ${buildStatus(item.status)}
        </td>
        <td class="history-cell history-cell--actions" data-label="Bukti">
          ${buildEvidence(item)}
        </td>
      </tr>
    `;
  }

  const ready = window.SIPRESMA_READY || Promise.resolve(window.SIPRESMA);

  ready.then(function (prestasi) {
    if (!prestasi || typeof prestasi.getPrestasiMahasiswa !== "function") {
      return;
    }

    const pengajuan = prestasi.getPrestasiMahasiswa();
    tbody.innerHTML = pengajuan.map(buildRow).join("");

    if (emptyState) {
      emptyState.hidden = pengajuan.length !== 0;
    }

    if (table) {
      table.hidden = pengajuan.length === 0;
      table.style.display = pengajuan.length === 0 ? "none" : "";
    }
  }).catch(function (error) {
    console.error("Riwayat prestasi Mahasiswa gagal dimuat:", error);
  });
})();
