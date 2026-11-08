(() => {
  const mahasiswaAktif = {
    nama: "Devanka Shankara",
    npm: "07352411036",
  };

  const dataPrestasi = [
    {
      id: 1,
      namaMahasiswa: "Devanka Shankara",
      npm: "07352411036",
      namaPrestasi: "Gemastik XVI - Divisi Smart City",
      penyelenggara: "Puspresnas Kemendikbudristek & UB",
      jenis: "Akademik",
      tingkat: "Tingkat Nasional",
      peringkat: "Juara 1",
      tahun: "2025",
      status: "Terverifikasi",
      bukti: "../../assets/dokumen/sertifikat-gemastik-xvi-smart-city.pdf",
    },
    {
      id: 2,
      namaMahasiswa: "Devanka Shankara",
      npm: "07352411036",
      namaPrestasi: "National Hackathon Data Science 2025",
      penyelenggara: "Institut Teknologi Bandung",
      jenis: "Akademik",
      tingkat: "Tingkat Nasional",
      peringkat: "Juara 2",
      tahun: "2025",
      status: "Terverifikasi",
      bukti: "../../assets/dokumen/sertifikat-national-hackathon-data-science-2025.pdf",
    },
    {
      id: 3,
      namaMahasiswa: "Devanka Shankara",
      npm: "07352411036",
      namaPrestasi: "Turnamen Catur Mahasiswa Wilayah Jawa Barat",
      penyelenggara: "BAPOMI Jawa Barat",
      jenis: "Non-Akademik",
      tingkat: "Tingkat Provinsi",
      peringkat: "Juara 3",
      tahun: "2025",
      status: "Terverifikasi",
      bukti: "../../assets/dokumen/sertifikat-turnamen-catur-jawa-barat-2025.pdf",
    },
    {
      id: 4,
      namaMahasiswa: "Devanka Shankara",
      npm: "07352411036",
      namaPrestasi: "International Youth AI Innovation Forum 2026",
      penyelenggara: "IEEE Computer Society Chapter",
      jenis: "Akademik",
      tingkat: "Tingkat Internasional",
      peringkat: "Peserta / Penyaji",
      tahun: "2026",
      status: "Diajukan",
      bukti: "../../assets/dokumen/sertifikat-international-youth-ai-innovation-forum-2026.pdf",
    },
    {
      id: 5,
      namaMahasiswa: "Devanka Shankara",
      npm: "07352411036",
      namaPrestasi: "Lomba Karya Tulis Ilmiah Nasional 2024",
      penyelenggara: "Kementerian Pendidikan Tinggi, Sains, dan Teknologi",
      jenis: "Akademik",
      tingkat: "Tingkat Nasional",
      peringkat: "Juara Harapan 1",
      tahun: "2024",
      status: "Perlu Perbaikan",
      bukti: null,
    },
  ];

  const getPrestasiMahasiswa = (npm = mahasiswaAktif.npm) =>
    dataPrestasi.filter((item) => item.npm === npm);

  const hitungStatus = (status, npm = mahasiswaAktif.npm) =>
    getPrestasiMahasiswa(npm).filter((item) => item.status === status).length;

  window.SIPRESMA = window.SIPRESMA || {};
  window.SIPRESMA.mahasiswaAktif = mahasiswaAktif;
  window.SIPRESMA.dataPrestasi = dataPrestasi;
  window.SIPRESMA.getPrestasiMahasiswa = getPrestasiMahasiswa;
  window.SIPRESMA.hitungStatus = hitungStatus;
})();
