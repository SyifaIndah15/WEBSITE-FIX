(() => {
  const searchInput = document.getElementById("prestasi-search");
  const tableBody = document.getElementById("prestasi-rows");
  const emptyRow = document.getElementById("prestasi-empty");

  if (!searchInput || !tableBody) {
    return;
  }

  const rows = Array.from(tableBody.querySelectorAll(".prestasi-row"));
  const filterInputs = document.querySelectorAll(
    'input[name="filter-jenis"], input[name="filter-status"]'
  );

  if (emptyRow) {
    const emptyCell = emptyRow.querySelector("td");

    if (emptyCell) {
      emptyCell.textContent = "Data tidak ditemukan";
    }
  }

  const getCheckedValue = (name) => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);

    return checked ? checked.value : "all";
  };

  const applyFilters = () => {
    const keyword = searchInput.value.trim().toLowerCase();
    const jenis = getCheckedValue("filter-jenis");
    const status = getCheckedValue("filter-status");
    let visibleCount = 0;

    rows.forEach((row) => {
      const name = row.querySelector(".prestasi-name");
      const npm = row.querySelector(".prestasi-npm");
      const competition = row.querySelector(".prestasi-competition");
      const searchableText = [
        name ? name.textContent : "",
        npm ? npm.textContent : "",
        competition ? competition.textContent : "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesKeyword = !keyword || searchableText.includes(keyword);
      const matchesJenis = jenis === "all" || row.dataset.jenis === jenis;
      const matchesStatus = status === "all" || row.dataset.status === status;
      const isVisible = matchesKeyword && matchesJenis && matchesStatus;

      row.hidden = !isVisible;

      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (emptyRow) {
      emptyRow.hidden = visibleCount > 0;
    }
  };

  searchInput.addEventListener("input", applyFilters);
  filterInputs.forEach((input) => input.addEventListener("change", applyFilters));
  applyFilters();
})();
