(async () => {
  const DATA_STORE_URL = new URL("../core/sipresma-data.js", document.currentScript.src).href;

  let resolveReady;
  window.SIPRESMA_READY = new Promise(function (resolve) {
    resolveReady = resolve;
  });

  function normalizeStatus(status) {
    const value = String(status == null ? "" : status).toLowerCase();
    if (value === "terverifikasi" || value === "diverifikasi" || value === "verified") return "Terverifikasi";
    if (value.includes("perbaikan") || value === "revision") return "Perlu Perbaikan";
    if (value === "ditolak" || value === "rejected") return "Ditolak";
    return "Diajukan";
  }

  function mapRecord(item) {
    const status = normalizeStatus(item.status);
    return Object.assign({}, item, {
      npm: item.nim,
      namaPrestasi: item.namaKompetisi || item.namaPrestasi,
      status: status
    });
  }

  let store = null;
  let mahasiswaAktif = { nama: "", npm: "", year: "", programStudi: "Teknik Informatika" };

  try {
    store = await import(DATA_STORE_URL);
    const student = store.resolveMahasiswa();

    if (student) {
      mahasiswaAktif = {
        nama: student.name || student.nama || "",
        npm: String(student.nim || ""),
        year: String(student.year || student.angkatan || ""),
        programStudi: student.programStudi || "Teknik Informatika",
        ipk: student.ipk,
        klasifikasi: student.klasifikasi || student.category || ""
      };
    }
  } catch (error) {
    console.error("Data prestasi Mahasiswa gagal dimuat:", error);
  }

  function getPrestasiMahasiswa(npm) {
    const target = String(npm || mahasiswaAktif.npm);
    if (!store || !target) return [];

    return store.getMahasiswaPrestasi(target).map(mapRecord);
  }

  function hitungStatus(status, npm) {
    const target = normalizeStatus(status);
    return getPrestasiMahasiswa(npm).filter(function (item) {
      return item.status === target;
    }).length;
  }

  const dataPrestasi = getPrestasiMahasiswa();
  const api = {
    mahasiswaAktif: mahasiswaAktif,
    dataPrestasi: dataPrestasi,
    getPrestasiMahasiswa: getPrestasiMahasiswa,
    hitungStatus: hitungStatus
  };

  window.SIPRESMA = api;
  resolveReady(api);
})();
