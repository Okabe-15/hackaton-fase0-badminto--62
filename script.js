/* ==========================================================
   TOP 30 PEMAIN BULUTANGKIS INDONESIA
   Data diambil langsung dari database.json. tunggal_putra dan
   tunggal_putri TETAP DIPISAH sebagai dua kategori berbeda,
   masing-masing ditampilkan & dicari di grid-nya sendiri.
========================================================== */

let allPutra = [];   // 15 pemain tunggal putra
let allPutri = [];   // 15 pemain tunggal putri

document.addEventListener('DOMContentLoaded', function () {

  let playerListPutra = document.getElementById('playerListPutra');
  let playerListPutri = document.getElementById('playerListPutri');

  /* ====== 0. AMBIL DATA DARI database.json ====== */
  async function loadDatabase() {
    playerListPutra.innerHTML = '<p class="no-result">Memuat data pemain...</p>';
    playerListPutri.innerHTML = '<p class="no-result">Memuat data pemain...</p>';
    try {
      let response = await fetch('database.json');
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      let db = await response.json();

      allPutra = (db.tunggal_putra || []).map(mapAtlet);
      allPutri = (db.tunggal_putri || []).map(mapAtlet);

      // Update judul & jumlah per kategori biar selalu sesuai isi json
      setText('sectionCount', allPutra.length + allPutri.length);
      setText('countPutra', allPutra.length);
      setText('countPutri', allPutri.length);

      renderPlayers(allPutra, playerListPutra);
      renderPlayers(allPutri, playerListPutri);
    } catch (error) {
      console.error('Gagal memuat database.json:', error);
      let pesanError =
        '<p class="no-result">Gagal memuat data pemain. ' +
        'Pastikan file dibuka lewat server lokal (Live Server), bukan langsung dari file, ' +
        'karena browser memblokir fetch() ke file JSON saat dibuka langsung dari folder.</p>';
      playerListPutra.innerHTML = pesanError;
      playerListPutri.innerHTML = pesanError;
    }
  }

  function setText(id, value) {
    let el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // Ubah struktur data mentah dari database.json jadi struktur yang dipakai tampilan
  function mapAtlet(p) {
    return {
      nama: p.nama_atlet,
      peringkat: p.peringkat_nasional,
      klub: p.klub_asal,
      status: p.status,
      sektor: p.sektor,
      foto: p.foto || null
    };
  }

  /* ====== 1. RENDER KARTU PROFIL PEMAIN ====== */
  function initials(name) {
    return name
      .trim()
      .split(' ')
      .map(function (w) { return w[0]; })
      .slice(0, 3)
      .join('')
      .toUpperCase();
  }

  function escapeHtml(str) {
    let div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function avatarHtml(p, sizeClass) {
    if (p.foto) {
      return '<img class="' + sizeClass + '-img" src="' + escapeHtml(p.foto) +
        '" alt="' + escapeHtml(p.nama) + '" data-fallback="' + escapeHtml(initials(p.nama)) + '">';
    }
    return initials(p.nama);
  }

  // Kalau file foto gagal dimuat (rusak/tidak ada), ganti otomatis jadi inisial nama
  function attachImageFallback(container) {
    container.querySelectorAll('img[data-fallback]').forEach(function (img) {
      img.addEventListener('error', function () {
        let wrapper = img.parentElement;
        wrapper.textContent = img.dataset.fallback;
      });
    });
  }

  function renderPlayers(list, container) {
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = '<p class="no-result">Pemain tidak ditemukan.</p>';
      return;
    }

    list.forEach(function (p) {
      let card = document.createElement('div');
      card.className = 'player-card';
      card.innerHTML =
        '<span class="player-rank-num">' + p.peringkat + '</span>' +
        '<div class="player-avatar">' + avatarHtml(p, 'player-avatar') + '</div>' +
        '<div class="player-body">' +
          '<p class="player-category">' + escapeHtml(p.sektor) + '</p>' +
          '<h3 class="player-name">' + escapeHtml(p.nama) + '</h3>' +
          '<p class="player-blurb">' + escapeHtml(p.klub) + '</p>' +
          '<span class="player-badge">' + escapeHtml(p.status) + '</span>' +
        '</div>';
      card.addEventListener('click', function () { openModal(p); });
      container.appendChild(card);
    });

    attachImageFallback(container);
  }

  /* ====== 1b. MODAL PROFIL LENGKAP ====== */
  let modalOverlay = document.getElementById('modalOverlay');
  let modalContent = document.getElementById('modalContent');
  let modalClose = document.getElementById('modalClose');

  function openModal(p) {
    modalContent.innerHTML =
      '<div class="modal-avatar">' + avatarHtml(p, 'modal-avatar') + '</div>' +
      '<div class="modal-text">' +
        '<p class="player-category">' + escapeHtml(p.sektor) + '</p>' +
        '<h3>' + escapeHtml(p.nama) + '</h3>' +
        '<span class="modal-badge">' + escapeHtml(p.status) + '</span>' +

        '<h4 class="modal-subhead">Data Pribadi</h4>' +
        '<table>' +
          '<tr><td>Peringkat Nasional</td><td>' + escapeHtml(p.peringkat) + '</td></tr>' +
          '<tr><td>Klub Asal</td><td>' + escapeHtml(p.klub) + '</td></tr>' +
          '<tr><td>Sektor</td><td>' + escapeHtml(p.sektor) + '</td></tr>' +
        '</table>' +
      '</div>';
    attachImageFallback(modalContent);
    modalOverlay.classList.add('open');
  }

  function closeModal() { modalOverlay.classList.remove('open'); }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ====== 2. FITUR PENCARIAN PEMAIN ====== */
  // Cari berdasarkan nama, klub, ATAU status — dijalankan terpisah untuk
  // kategori putra dan putri, jadi masing-masing grid tetap sesuai kategorinya.
  function cocok(p, keyword) {
    return (
      p.nama.toLowerCase().indexOf(keyword) !== -1 ||
      p.klub.toLowerCase().indexOf(keyword) !== -1 ||
      p.status.toLowerCase().indexOf(keyword) !== -1
    );
  }

  let searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', function () {
    let keyword = searchInput.value.trim().toLowerCase();

    if (keyword === '') {
      renderPlayers(allPutra, playerListPutra);
      renderPlayers(allPutri, playerListPutri);
      return;
    }

    renderPlayers(allPutra.filter(function (p) { return cocok(p, keyword); }), playerListPutra);
    renderPlayers(allPutri.filter(function (p) { return cocok(p, keyword); }), playerListPutri);
  });

  /* ====== 3. TOGGLE MENU HAMBURGER (MOBILE) ====== */
  let hamburger = document.getElementById('hamburger');
  let navMenu = document.getElementById('navMenu');

  hamburger.addEventListener('click', function () {
    navMenu.classList.toggle('open');
  });

  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      navMenu.classList.remove('open');
    });
  });

  /* ====== 4. FORM KONTAK SEDERHANA (TANPA BACKEND) ====== */
  let contactForm = document.getElementById('contactForm');
  let formStatus = document.getElementById('formStatus');

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let nama = document.getElementById('nama').value.trim();

    if (!nama) {
      formStatus.textContent = 'Mohon lengkapi nama terlebih dahulu.';
      formStatus.style.color = '#CE1126';
      return;
    }

    formStatus.textContent = 'Terima kasih, ' + nama + '! Pesan kamu sudah terkirim.';
    formStatus.style.color = '#0B3D2E';
    contactForm.reset();
  });

  /* ====== 5. TAHUN OTOMATIS DI FOOTER ====== */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ====== JALANKAN ====== */
  loadDatabase();

});