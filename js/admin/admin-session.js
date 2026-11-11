(() => {
  // Kunci session khusus Admin. Kunci ini tidak digunakan oleh Role lain.
  const ADMIN_SESSION_KEY = "sipresma_admin_session";

  // Role Admin mengikuti nilai yang tersimpan pada data-akun-admin.json.
  const ADMIN_ROLE = "Administrator Sistem";

  // Alamat halaman login dihitung dari halaman Admin yang sedang dibuka.
  const LOGIN_URL = new URL("../../index.html", window.location.href).href;

  // Mengubah nilai menjadi teks tanpa spasi di awal dan akhir.
  function normalize(value) {
    return String(value == null ? "" : value).trim();
  }

  // Memeriksa apakah role session merupakan Role Admin yang sah.
  function isAdminRole(role) {
    return normalize(role).toLowerCase() === ADMIN_ROLE.toLowerCase();
  }

  // Memeriksa apakah status akun pada session masih aktif.
  function isActiveStatus(status) {
    return normalize(status).toLowerCase() === "aktif";
  }

  // Mengambil dan memeriksa session Admin.
  function getAdminSession() {
    try {
      const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (!stored) return null;

      const session = JSON.parse(stored);
      if (!session || typeof session !== "object" || Array.isArray(session)) {
        return null;
      }

      // Memastikan identitas dan hak akses Admin tersedia dan valid.
      if (
        !normalize(session.id) ||
        !normalize(session.username) ||
        !normalize(session.nama) ||
        !isAdminRole(session.role) ||
        !isActiveStatus(session.statusAkun)
      ) {
        return null;
      }

      return session;
    } catch (error) {
      return null;
    }
  }

  // Menghapus session Admin yang tidak valid lalu kembali ke halaman login.
  function redirectToLogin() {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (error) {
      // Abaikan jika sessionStorage tidak dapat diakses.
    }

    window.location.replace(LOGIN_URL);
  }

  // Memeriksa session sebelum halaman Admin digunakan.
  function protectAdminPage() {
    if (getAdminSession()) return true;
    redirectToLogin();
    return false;
  }

  // Hentikan proses jika session tidak valid.
  if (!protectAdminPage()) return;

  // Menangani logout menggunakan tombol logout yang sudah tersedia.
  function handleLogout(event) {
    const target = event.target;
    if (!target || typeof target.closest !== "function") return;

    const logoutLink = target.closest(".logout-link");
    if (!logoutLink) return;

    // Mencegah perpindahan halaman sebelum session Admin dihapus.
    event.preventDefault();

    // Hapus hanya session Admin, tanpa menyentuh data Role lain.
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (error) {
      // Abaikan jika sessionStorage tidak dapat diakses.
    }

    // Kembali ke halaman login menggunakan alamat tombol yang sudah ada.
    window.location.replace(logoutLink.href || LOGIN_URL);
  }

  // Gunakan event delegation agar seluruh tombol logout Admin tertangani.
  document.addEventListener("click", handleLogout);

  // Periksa kembali session ketika halaman dipulihkan dari back-forward cache.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) protectAdminPage();
  });

  const source = document.currentScript
    ? new URL("admin-data-pages.js", document.currentScript.src)
    : new URL("../admin/admin-data-pages.js", window.location.href);

  function loadPageData() {
    import(source.href).catch((error) => {
      console.error("Halaman data Admin gagal dimuat:", error);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadPageData, { once: true });
  } else {
    loadPageData();
  }
})();
