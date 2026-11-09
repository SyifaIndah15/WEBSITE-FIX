(() => {
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
})();
