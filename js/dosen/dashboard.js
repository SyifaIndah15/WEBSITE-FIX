(() => {
  // Mengambil NIDN dari parameter URL yang dikirim saat proses login dosen.
  const nidn = new URLSearchParams(window.location.search).get("nidn");

  // Mengambil elemen teks NIDN pada header banner dashboard.
  const nidnElement = document.querySelector(".banner-meta span");

  // Menampilkan NIDN dari URL jika tersedia, tanpa mengubah nama dosen.
  if (nidn && nidnElement) {
    nidnElement.textContent = `NIDN: ${nidn}`;
  }

  const tableBody = document.querySelector(".achievement-table tbody");

  if (!tableBody) {
    return;
  }

  const rows = Array.from(tableBody.querySelectorAll("tr"));

  rows.sort((rowA, rowB) => {
    const nameA = rowA.querySelector(".student-name");
    const nameB = rowB.querySelector(".student-name");
    const textA = nameA ? nameA.textContent.trim() : "";
    const textB = nameB ? nameB.textContent.trim() : "";

    return textA.localeCompare(textB, "id", { sensitivity: "base" });
  });

  rows.forEach((row, index) => {
    const rowIndex = row.querySelector(".row-index");

    if (rowIndex) {
      rowIndex.textContent = `${index + 1}.`;
    }

    tableBody.appendChild(row);
  });

  const totalCard = document.querySelector(".stat-card--total");
  const highCard = document.querySelector(".stat-card--high");
  const mediumCard = document.querySelector(".stat-card--medium");
  const lowCard = document.querySelector(".stat-card--low");

  const filterCards = [
    { card: totalCard, kategori: "Semua" },
    { card: highCard, kategori: "Tinggi" },
    { card: mediumCard, kategori: "Sedang" },
    { card: lowCard, kategori: "Rendah" },
  ];

  const tampilkanMahasiswa = (kategori) => {
    let nomor = 0;

    rows.forEach((row) => {
      const badge = row.querySelector(".result-badge");
      const hasilKlasifikasi = badge ? badge.textContent.trim() : "";
      const tampil =
        kategori === "Semua" || hasilKlasifikasi === kategori;

      row.hidden = !tampil;

      if (tampil) {
        nomor += 1;

        const rowIndex = row.querySelector(".row-index");

        if (rowIndex) {
          rowIndex.textContent = `${nomor}.`;
        }
      }
    });
  };

  filterCards.forEach((item) => {
    if (item.card) {
      item.card.addEventListener("click", () => {
        tampilkanMahasiswa(item.kategori);
      });
    }
  });

  tampilkanMahasiswa("Semua");
})();
