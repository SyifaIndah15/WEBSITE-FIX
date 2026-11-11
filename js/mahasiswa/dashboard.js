(() => {
  const ready = window.SIPRESMA_READY || Promise.resolve(window.SIPRESMA);

  ready.then(function (prestasi) {
    if (!prestasi || typeof prestasi.getPrestasiMahasiswa !== "function") {
      return;
    }

    const mahasiswa = prestasi.mahasiswaAktif || {};
    const metaItems = document.querySelectorAll(".banner-meta span");
    const npm = String(mahasiswa.npm || "");
    const name = mahasiswa.nama || "";

    if (metaItems[0] && npm) {
      metaItems[0].textContent = `NPM: ${npm}`;
    }

    if (metaItems[1] && mahasiswa.programStudi) {
      metaItems[1].textContent = /^program studi\b/i.test(mahasiswa.programStudi)
        ? mahasiswa.programStudi
        : `Program Studi ${mahasiswa.programStudi}`;
    }

    if (metaItems[2]) {
      const year = mahasiswa.year || (npm.length >= 6 ? `20${npm.slice(4, 6)}` : "");
      if (year) {
        metaItems[2].textContent = `Angkatan ${year}`;
      }
    }

    const greeting = document.getElementById("banner-greeting");
    if (greeting && name) {
      greeting.textContent = `Selamat Datang, ${name}`;
    }

    const pengajuan = prestasi.getPrestasiMahasiswa();
    const setStatValue = function (id, value) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = String(value);
      }
    };

    setStatValue("stat-total", pengajuan.length);
    setStatValue("stat-verified", prestasi.hitungStatus("Terverifikasi"));
    setStatValue("stat-revision", prestasi.hitungStatus("Perlu Perbaikan"));

    const categoryPill = document.querySelector(".stat-card--category .category-pill");
    if (categoryPill && mahasiswa.klasifikasi) {
      categoryPill.textContent = mahasiswa.klasifikasi;
    }

    const ipkElement = document.querySelector(".stat-card--category .stat-ipk");
    if (ipkElement && mahasiswa.ipk != null && mahasiswa.ipk !== "") {
      ipkElement.textContent = `IPK: ${mahasiswa.ipk}`;
    }
  }).catch(function (error) {
    console.error("Dashboard Mahasiswa gagal dimuat:", error);
  });
})();
