<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAgo-fw-YwrvOq1ONO1Z5V7ElHZu41cndQ",
    authDomain: "progres-service.firebaseapp.com",
    projectId: "progres-service",
    storageBucket: "progres-service.firebasestorage.app",
    messagingSenderId: "726589505329",
    appId: "1:726589505329:web:af784eb2fe5e290fac3a10"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
</script>

const db = getFirestore(app);
const modalElement = new bootstrap.Modal(document.getElementById('modalUpdate'));
const imgKosong = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://w3.org' width='300' height='180'%3E%3Crect fill='%23EAE5D9' width='300' height='180'/%3E%3Ctext fill='%236C757D' font-family='sans-serif' font-size='14' dy='5' text-anchor='middle' x='150' y='90'%3EBelum Ada Foto%3C/text%3E%3C/svg%3E";
let semuaData = [];

function prosesFotoRingan(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 450;
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
}

document.getElementById('formTambah').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSimpanBaru');
  btn.disabled = true;
  btn.textContent = "Menyimpan...";

  try {
    const kodeNota = "SRV-" + Math.floor(100 + Math.random() * 900);
    const inputFileBefore = document.getElementById('fileBefore');
    const fileBefore = inputFileBefore.files.length > 0 ? inputFileBefore.files.item(0) : null;
    const base64Before = await prosesFotoRingan(fileBefore);

    await setDoc(doc(db, "pesanan", kodeNota), {
      kode_nota: kodeNota,
      nama_pelanggan: document.getElementById('namaPelanggan').value,
      no_wa: document.getElementById('noWa').value,
      nama_barang: document.getElementById('namaBarang').value,
      status: "Diterima",
      catatan_teknisi: "Barang telah diterima.",
      foto_before: base64Before,
      foto_after: "",
      waktu_update: Date.now()
    });

    document.getElementById('formTambah').reset();
    alert("Pesanan berhasil disimpan dengan Kode Nota: " + kodeNota);
  } catch (err) {
    alert("Gagal menyimpan (Pastikan Firestore Rules sudah dipublish): " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Simpan Pesanan";
  }
});

function renderDaftar(dataList) {
  const container = document.getElementById('daftarPesanan');
  if (dataList.length === 0) {
    container.innerHTML = `<div class="text-center text-muted py-4">Belum ada pesanan.</div>`;
    return;
  }

  container.innerHTML = dataList.map(item => {
    const badgeColor = item.status === 'Siap Diambil' ? 'bg-success' : (item.status === 'Diproses' ? 'bg-warning text-dark' : 'bg-secondary');
    const thumb = item.foto_before || imgKosong;
    const baseUrl = window.location.href.replace('admin.html', 'cek.html');
    const pesanWa = encodeURIComponent(`Halo Kak ${item.nama_pelanggan}, pesanan *${item.nama_barang}* (Nota: *${item.kode_nota}*) saat ini berstatus *${item.status.toUpperCase()}*. Cek detail & foto bukti di: ${baseUrl}?nota=${item.kode_nota}`);
    const linkWa = `https://wa.me/${item.no_wa}?text=${pesanWa}`;

    return `
      <div class="row-item p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div class="d-flex align-items-center gap-3">
          <img src="${thumb}" class="thumb-img" alt="Foto">
          <div>
            <span class="fw-bold d-block">${item.kode_nota} — ${item.nama_pelanggan}</span>
            <span class="small text-muted">${item.nama_barang}</span>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge ${badgeColor} px-3 py-2">${item.status}</span>
          <a href="${linkWa}" target="_blank" class="btn btn-outline-success btn-sm">Kirim Info WA</a>
          <button class="btn btn-outline-dark btn-sm btn-edit" data-id="${item.kode_nota}">Update Foto & Detail</button>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = semuaData.find(d => d.kode_nota === btn.dataset.id);
      document.getElementById('modalNotaTitle').textContent = item.kode_nota;
      document.getElementById('editNotaId').value = item.kode_nota;
      document.getElementById('modalFotoBefore').src = item.foto_before || imgKosong;
      document.getElementById('modalFotoAfter').src = item.foto_after || imgKosong;
      document.getElementById('editStatus').value = item.status;
      document.getElementById('editCatatan').value = item.catatan_teknisi || "";
      document.getElementById('fileAfter').value = "";
      modalElement.show();
    });
  });
}

const q = query(collection(db, "pesanan"), orderBy("waktu_update", "desc"));
onSnapshot(q, (snapshot) => {
  semuaData = snapshot.docs.map(doc => doc.data());
  renderDaftar(semuaData);
});

document.getElementById('cariNama').addEventListener('input', (e) => {
  const keyword = e.target.value.toLowerCase();
  const filtered = semuaData.filter(d => d.nama_pelanggan.toLowerCase().includes(keyword) || d.kode_nota.toLowerCase().includes(keyword));
  renderDaftar(filtered);
});

document.getElementById('btnSimpanUpdate').addEventListener('click', async () => {
  const btn = document.getElementById('btnSimpanUpdate');
  const kodeNota = document.getElementById('editNotaId').value;
  btn.disabled = true;
  btn.textContent = "Menyimpan...";

  try {
    const updateData = {
      status: document.getElementById('editStatus').value,
      catatan_teknisi: document.getElementById('editCatatan').value,
      waktu_update: Date.now()
    };

    const inputFileAfter = document.getElementById('fileAfter');
    const fileAfter = inputFileAfter.files.length > 0 ? inputFileAfter.files.item(0) : null;
    if (fileAfter) {
      updateData.foto_after = await prosesFotoRingan(fileAfter);
    }

    await updateDoc(doc(db, "pesanan", kodeNota), updateData);
    modalElement.hide();
  } catch (err) {
    alert("Gagal memperbarui: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Simpan Perubahan";
  }
});
