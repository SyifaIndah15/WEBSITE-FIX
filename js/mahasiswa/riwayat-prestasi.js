// Membuat fungsi utama yang langsung dijalankan ketika file JavaScript dibaca.
(() => {

  // 1. MENGAMBIL ELEMEN HTML DAN SUMBER DATA

  // Mengambil bagian tabel yang akan diisi dengan data prestasi.
  const tbody = document.getElementById("history-rows");

  // Mengambil objek SIPRESMA yang menyediakan data prestasi mahasiswa.
  const prestasi = window.SIPRESMA;

  // Memeriksa apakah elemen tabel dan sumber data tersedia.
  // Selain itu, memeriksa apakah fungsi getPrestasiMahasiswa dapat digunakan.
  // Jika salah satu tidak tersedia, program langsung dihentikan.
  if (!tbody || !prestasi || typeof prestasi.getPrestasiMahasiswa !== "function") {
    return;
  }


  // 2. MEMBUAT IKON PDF

  // Membuat variabel pdfIcon untuk menyimpan gambar ikon dokumen PDF.
  const pdfIcon = `

    <!-- Membuat gambar ikon dokumen PDF menggunakan SVG. -->
    <svg viewBox="0 0 16 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">

      <!-- Membuat bentuk utama dokumen PDF. -->
      <path d="M4 2.5h5.3l2.7 2.7v8.3H4z"/>

      <!-- Membuat bagian lipatan pada sudut dokumen. -->
      <path d="M9.3 2.5v2.7h2.7"/>

      <!-- Membuat garis-garis di dalam gambar dokumen. -->
      <path d="M6 8h4M6 10.4h4"/>

    </svg>
  `;


  // 3. MENGATUR TAMPILAN STATUS PRESTASI

  // Membuat objek statusView untuk menyimpan tampilan setiap status prestasi.
  const statusView = {

    // Mengatur tampilan jika status prestasi sudah Terverifikasi.
    Terverifikasi: {

      // Menentukan nama class CSS untuk status Terverifikasi.
      className: "verified",

      // Membuat ikon centang sebagai tanda bahwa prestasi sudah diverifikasi.
      icon: `

        <!-- Membuat ikon lingkaran dengan tanda centang. -->
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">

          <!-- Membuat lingkaran sebagai bagian luar ikon. -->
          <circle cx="8" cy="8" r="6.2"/>

          <!-- Membuat tanda centang di dalam lingkaran. -->
          <path d="m5.2 8.1 1.8 1.8 3.9-4"/>

        </svg>
      `,
    },

    // Mengatur tampilan jika status prestasi masih Diajukan.
    Diajukan: {

      // Menentukan nama class CSS untuk status Diajukan.
      className: "submitted",

      // Membuat ikon jam sebagai tanda bahwa pengajuan masih menunggu proses.
      icon: `

        <!-- Membuat ikon lingkaran dengan penunjuk waktu. -->
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">

          <!-- Membuat lingkaran sebagai bagian luar ikon. -->
          <circle cx="8" cy="8" r="6.2"/>

          <!-- Membuat jarum jam di dalam lingkaran. -->
          <path d="M8 4.6V8l2.2 1.3"/>

        </svg>
      `,
    },

    // Mengatur tampilan jika status prestasi Perlu Perbaikan.
    "Perlu Perbaikan": {

      // Menentukan nama class CSS untuk status Perlu Perbaikan.
      className: "revision",

      // Membuat ikon tanda seru sebagai penanda bahwa pengajuan perlu diperbaiki.
      icon: `

        <!-- Membuat ikon lingkaran dengan tanda seru. -->
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">

          <!-- Membuat lingkaran sebagai bagian luar ikon. -->
          <circle cx="8" cy="8" r="6.2"/>

          <!-- Membuat tanda seru di dalam lingkaran. -->
          <path d="M8 4.6v4M8 11.4h.01"/>

        </svg>
      `,
    },

  };


  // 4. MENGAMANKAN TEKS HTML

  // Membuat fungsi untuk mengamankan teks sebelum dimasukkan ke HTML.
  // Parameter value berisi teks yang akan diperiksa.
  function escapeHtml(value) {

    // Membuat objek yang berisi karakter khusus dan penggantinya.
    const entities = {

      // Mengganti karakter & dengan kode HTML yang aman.
      "&": "&amp;",

      // Mengganti karakter < dengan kode HTML yang aman.
      "<": "&lt;",

      // Mengganti karakter > dengan kode HTML yang aman.
      ">": "&gt;",

      // Mengganti tanda kutip dua dengan kode HTML yang aman.
      '"': "&quot;",

      // Mengganti tanda kutip satu dengan kode HTML yang aman.
      "'": "&#39;",
    };

    // Mengubah nilai menjadi teks menggunakan String().
    // replace() mencari karakter khusus dan menggantinya sesuai objek entities.
    // function(character) menerima karakter yang sedang ditemukan.
    return String(value).replace(/[&<>"']/g, function(character) {

      // Mengembalikan kode pengganti berdasarkan karakter yang ditemukan.
      return entities[character];
    });
  }


  // 5. MEMBUAT TAMPILAN STATUS PRESTASI

  // Membuat fungsi untuk menampilkan status beserta ikon yang sesuai.
  // Parameter status berisi status prestasi mahasiswa.
  function buildStatus(status) {

    // Mengambil pengaturan tampilan berdasarkan status yang diterima.
    let view = statusView[status];

    // Jika status tidak ditemukan, gunakan tampilan status Diajukan.
    if (!view) {
      view = statusView.Diajukan;
    }

    // Mengembalikan HTML untuk menampilkan status prestasi.
    return `

      <!-- Membuat wadah untuk menampilkan status prestasi. -->
      <span class="history-status history-status--${view.className}">

        <!-- Menampilkan ikon sesuai dengan status prestasi. -->
        ${view.icon}

        <!-- Menampilkan nama status yang sudah diamankan menggunakan escapeHtml(). -->
        <span>${escapeHtml(status)}</span>

      </span>
    `;
  }


  // 6. MENAMPILKAN DOKUMEN BUKTI PRESTASI

  // Membuat fungsi untuk memeriksa dan menampilkan dokumen bukti prestasi.
  // Parameter item berisi data dari satu pengajuan prestasi.
  function buildEvidence(item) {

    // Memeriksa apakah data prestasi belum memiliki dokumen bukti.
    if (!item.bukti) {

      // Jika tidak ada dokumen, tampilkan keterangan Belum Tersedia.
      return `

        <!-- Membuat wadah untuk tombol atau keterangan dokumen. -->
        <div class="row-actions">

          <!-- Menampilkan informasi bahwa dokumen belum tersedia. -->
          <span class="action-button action-button--pdf" aria-disabled="true" title="Dokumen bukti belum tersedia">

            <!-- Menampilkan ikon PDF. -->
            ${pdfIcon}

            <!-- Menampilkan tulisan Belum Tersedia. -->
            <span>Belum Tersedia</span>

          </span>
        </div>
      `;
    }

    // Jika dokumen tersedia, tampilkan tautan untuk membuka file PDF.
    return `

      <!-- Membuat wadah untuk tombol dokumen PDF. -->
      <div class="row-actions">

        <!-- Membuat tautan untuk membuka dokumen PDF pada tab baru. -->
        <!-- escapeHtml() digunakan untuk mengamankan alamat dokumen. -->
        <a class="action-button action-button--pdf" href="${escapeHtml(item.bukti)}" target="_blank" rel="noopener" title="Buka dokumen bukti PDF">

          <!-- Menampilkan ikon PDF. -->
          ${pdfIcon}

          <!-- Menampilkan tulisan Lihat PDF. -->
          <span>Lihat PDF</span>

        </a>
      </div>
    `;
  }


  // 7. MEMBUAT BARIS TABEL PRESTASI

  // Membuat fungsi untuk mengubah satu data prestasi menjadi satu baris tabel.
  // Parameter item berisi data prestasi mahasiswa.
  // Parameter index berisi nomor urut data dalam array.
  function buildRow(item, index) {

    // Mengembalikan struktur HTML untuk satu baris tabel prestasi.
    return `

      <!-- Membuat satu baris tabel menggunakan elemen tr. -->
      <tr>

        <!-- Membuat kolom nomor urut prestasi. -->
        <td class="history-cell history-cell--number" data-label="No">

          <!-- Menampilkan nomor urut yang dimulai dari angka 1. -->
          <!-- padStart(2, "0") membuat nomor selalu memiliki dua digit. -->
          <span class="row-number">${String(index + 1).padStart(2, "0")}</span>

        </td>

        <!-- Membuat kolom nama prestasi dan nama penyelenggara. -->
        <td class="history-cell history-cell--achievement" data-label="Nama Prestasi &amp; Penyelenggara">

          <!-- Menampilkan nama prestasi mahasiswa. -->
          <span class="history-name">${escapeHtml(item.namaPrestasi)}</span>

          <!-- Menampilkan nama instansi atau penyelenggara prestasi. -->
          <span class="history-organizer">${escapeHtml(item.penyelenggara)}</span>

        </td>

        <!-- Membuat kolom jenis dan tingkat prestasi. -->
        <td class="history-cell history-cell--type" data-label="Jenis &amp; Tingkat">

          <!-- Menampilkan jenis prestasi. -->
          <span class="cell-primary">${escapeHtml(item.jenis)}</span>

          <!-- Menampilkan tingkat prestasi. -->
          <span class="cell-secondary">${escapeHtml(item.tingkat)}</span>

        </td>

        <!-- Membuat kolom peringkat prestasi. -->
        <td class="history-cell history-cell--rank" data-label="Peringkat">

          <!-- Menampilkan peringkat yang diperoleh mahasiswa. -->
          <span class="cell-primary">${escapeHtml(item.peringkat)}</span>

        </td>

        <!-- Membuat kolom tahun perolehan prestasi. -->
        <td class="history-cell history-cell--year" data-label="Tahun">

          <!-- Menampilkan tahun perolehan prestasi. -->
          <span class="cell-primary">${escapeHtml(item.tahun)}</span>

        </td>

        <!-- Membuat kolom status prestasi. -->
        <td class="history-cell history-cell--status" data-label="Status">

          <!-- Memanggil buildStatus() untuk menampilkan status dan ikonnya. -->
          ${buildStatus(item.status)}

        </td>

        <!-- Membuat kolom dokumen bukti prestasi. -->
        <td class="history-cell history-cell--actions" data-label="Bukti">

          <!-- Memanggil buildEvidence() untuk menampilkan dokumen PDF. -->
          ${buildEvidence(item)}

        </td>

      <!-- Menutup baris tabel. -->
      </tr>
    `;
  }


  // 8. MENGAMBIL DATA PRESTASI MAHASISWA

  // Mengambil seluruh data pengajuan prestasi dari objek SIPRESMA.
  const pengajuan = prestasi.getPrestasiMahasiswa();

  // Mengambil elemen HTML untuk menampilkan pesan ketika data kosong.
  const emptyState = document.getElementById("history-empty");

  // Mengambil elemen HTML tabel riwayat prestasi.
  const table = document.getElementById("history-table");


  // 9. MENAMPILKAN DATA KE DALAM TABEL

  // Membuat variabel kosong untuk menampung seluruh baris tabel.
  let isiTabel = "";

  // Mengulang proses untuk setiap data pengajuan prestasi.
  // Nilai i dimulai dari 0 dan bertambah satu setiap pengulangan.
  // Perulangan berhenti ketika seluruh data sudah diproses.
  for (let i = 0; i < pengajuan.length; i++) {

    // Mengambil satu data prestasi berdasarkan posisi i.
    // Kemudian mengubahnya menjadi baris tabel menggunakan buildRow().
    isiTabel += buildRow(pengajuan[i], i);
  }

  // Memasukkan seluruh baris tabel yang sudah dibuat ke dalam elemen tbody.
  tbody.innerHTML = isiTabel;


  // 10. MENGATUR PESAN KETIKA DATA KOSONG

  // Memeriksa apakah elemen pemberitahuan data kosong berhasil ditemukan.
  if (emptyState) {

    // Memeriksa apakah jumlah data pengajuan sama dengan nol.
    if (pengajuan.length === 0) {

      // Jika tidak ada pengajuan, tampilkan pemberitahuan data kosong.
      emptyState.hidden = false;

    } else {

      // Jika terdapat pengajuan, sembunyikan pemberitahuan data kosong.
      emptyState.hidden = true;
    }
  }


  // 11. MENGATUR TAMPILAN TABEL

  // Memeriksa apakah elemen tabel berhasil ditemukan.
  if (table) {

    // Memeriksa apakah jumlah pengajuan sama dengan nol.
    if (pengajuan.length === 0) {

      // Jika tidak ada data, sembunyikan tabel.
      table.hidden = true;

      // Mengatur display menjadi none agar tabel tidak ditampilkan.
      table.style.display = "none";

    } else {

      // Jika terdapat data, tampilkan tabel.
      table.hidden = false;

      // Mengembalikan pengaturan display sesuai dengan CSS.
      table.style.display = "";
    }
  }

// Menutup fungsi utama sekaligus langsung menjalankannya.
})();
