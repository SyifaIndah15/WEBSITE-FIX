(() => {
  const prestasi = window.SIPRESMA;

  if (!prestasi || typeof prestasi.getPrestasiMahasiswa !== "function") {
    return;
  }

  const pengajuan = prestasi.getPrestasiMahasiswa();

  const setStatValue = (id, value) => {
    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    element.textContent = String(value);
  };

  setStatValue("stat-total", pengajuan.length);
  setStatValue("stat-verified", prestasi.hitungStatus("Terverifikasi"));
  setStatValue("stat-revision", prestasi.hitungStatus("Perlu Perbaikan"));
})();
