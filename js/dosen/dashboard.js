(() => {
  const DATA_STORE_URL = new URL("../core/sipresma-data.js", document.currentScript.src).href;
  const tableBody = document.querySelector(".achievement-table tbody");
  const nidnElement = document.querySelector(".banner-meta span");
  const greeting = document.querySelector(".banner-greeting");

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function categoryClass(category) {
    const value = String(category || "").toLowerCase();
    if (value === "tinggi") return "high";
    if (value === "sedang") return "medium";
    return "low";
  }

  function updateLectureIdentity(store) {
    const lecturer = store.resolveDosen();
    if (!lecturer) return;

    const nidn = String(lecturer.nidn || lecturer.username || "");
    const name = String(lecturer.name || lecturer.nama || "");

    if (nidnElement) nidnElement.textContent = "NIDN: " + nidn;
    if (greeting && name) greeting.textContent = "Selamat Datang, " + name + "!";
  }

  function render(store) {
    updateLectureIdentity(store);

    if (!tableBody) return;

    const students = store.getMahasiswaAccounts().slice().sort(function (left, right) {
      return String(left.name || left.nama || "").localeCompare(String(right.name || right.nama || ""), "id", {
        sensitivity: "base"
      });
    });

    tableBody.innerHTML = students.map(function (student, index) {
      const category = student.klasifikasi || student.category || "Rendah";
      const ipk = student.ipk == null ? "-" : Number(student.ipk).toFixed(2);
      const year = student.year || student.angkatan || "-";

      return "<tr>" +
        "<td class=\"student-cell\"><div class=\"student-line\"><span class=\"row-index\" aria-hidden=\"true\">" + (index + 1) + ".</span><span class=\"student-name\">" + escapeHtml(student.name || student.nama) + "</span></div><div class=\"student-npm\">NPM: " + escapeHtml(student.nim) + "</div></td>" +
        "<td class=\"year-cell\">" + escapeHtml(year) + "</td>" +
        "<td class=\"ipk-cell\">" + escapeHtml(ipk) + "</td>" +
        "<td class=\"result-cell\"><span class=\"result-badge result-badge--" + categoryClass(category) + "\">" + escapeHtml(category) + "</span></td>" +
        "</tr>";
    }).join("");

    const counts = store.getClassificationCounts();
    const total = counts.total || 1;
    const cards = [
      { selector: ".stat-card--total", value: counts.total + " Mahasiswa", note: "Data akademik terpantau" },
      { selector: ".stat-card--high", value: (counts.Tinggi || 0) + " Mahasiswa", note: Math.round(((counts.Tinggi || 0) / total) * 100) + "% dari prodi" },
      { selector: ".stat-card--medium", value: (counts.Sedang || 0) + " Mahasiswa", note: Math.round(((counts.Sedang || 0) / total) * 100) + "% dari prodi" },
      { selector: ".stat-card--low", value: (counts.Rendah || 0) + " Mahasiswa", note: Math.round(((counts.Rendah || 0) / total) * 100) + "% dari prodi" }
    ];

    cards.forEach(function (item) {
      const card = document.querySelector(item.selector);
      if (!card) return;
      const value = card.querySelector(".stat-value");
      const note = card.querySelector(".stat-note");
      if (value) value.textContent = item.value;
      if (note) note.textContent = item.note;
    });

    const countPill = document.querySelector(".data-count-pill");
    const scrollHint = document.querySelector(".scroll-hint");
    if (countPill) countPill.textContent = students.length + " Data Mahasiswa";
    if (scrollHint) scrollHint.textContent = "Scroll ke bawah untuk melihat baris 1 \u2013 " + students.length;

    const rows = Array.from(tableBody.querySelectorAll("tr"));
    const filterCards = [
      { card: document.querySelector(".stat-card--total"), kategori: "Semua" },
      { card: document.querySelector(".stat-card--high"), kategori: "Tinggi" },
      { card: document.querySelector(".stat-card--medium"), kategori: "Sedang" },
      { card: document.querySelector(".stat-card--low"), kategori: "Rendah" }
    ];

    function showCategory(category) {
      let number = 0;

      rows.forEach(function (row) {
        const badge = row.querySelector(".result-badge");
        const visible = category === "Semua" || (badge && badge.textContent.trim() === category);
        row.hidden = !visible;

        if (visible) {
          number += 1;
          const rowIndex = row.querySelector(".row-index");
          if (rowIndex) rowIndex.textContent = number + ".";
        }
      });
    }

    filterCards.forEach(function (item) {
      if (!item.card) return;
      item.card.addEventListener("click", function () {
        showCategory(item.kategori);
      });
    });

    showCategory("Semua");
  }

  import(DATA_STORE_URL)
    .then(render)
    .catch(function (error) {
      console.error("Data dashboard Dosen gagal dimuat:", error);
    });
})();
