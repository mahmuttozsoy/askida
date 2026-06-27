import './style.css';

// Dynamic API URL resolution
// NOT: Geliştirme sürecinde yaşanan localhost hatasını önlemek amacıyla, 
// buradaki adres kalıcı olarak canlı sunucu (api.askidagmtid.com) şeklinde sabitlendi.
const API_BASE_URL = 'https://api.askidagmtid.com/api';

// Session expiry: 2 hours (in milliseconds)
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

// Check if the stored session has expired
function isSessionValid() {
  const session = localStorage.getItem('admin_session');
  const loginTime = localStorage.getItem('admin_login_time');
  if (!session || !loginTime) return false;
  const elapsed = Date.now() - parseInt(loginTime, 10);
  if (elapsed > SESSION_DURATION_MS) {
    // Session expired — clear it
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_login_time');
    return false;
  }
  return true;
}

// App State
let state = {
  isAuthenticated: isSessionValid(),
  adminUser: isSessionValid() ? JSON.parse(localStorage.getItem('admin_user') || 'null') : null,
  activeTab: 'pending', // 'pending' or 'all'
  usersList: [],
  productsList: [],
  requestsList: [],
  donationsList: [],
  searchQuery: '',
  selectedUser: null,
  isActionLoading: false,
  isListLoading: false
};

// Initial App Mounting
const appRoot = document.getElementById('app');

// Add background lights once
const bg1 = document.createElement('div');
bg1.className = 'bg-glow-1';
const bg2 = document.createElement('div');
bg2.className = 'bg-glow-2';
document.body.appendChild(bg1);
document.body.appendChild(bg2);

// Toast notification container
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';
  if (type === 'info') icon = 'fa-info-circle';
  
  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Format date helper
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

// Fetch Users List from .NET API
async function fetchUsers() {
  if (!state.isAuthenticated) return;
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Kullanıcı listesi alınamadı.');
    const users = await response.json();
    state.usersList = users.filter(u => u.role !== 'Admin');
  } catch (e) {
    showToast(e.message || 'Sunucuyla bağlantı kurulamadı.', 'error');
  }
}

async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error('Ürünler alınamadı.');
    const allProducts = await response.json();
    state.productsList = allProducts.filter(p => !p.parentId || p.parentId === "" || p.parentId === "00000000-0000-0000-0000-000000000000");
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function fetchRequests() {
  try {
    const response = await fetch(`${API_BASE_URL}/requests`);
    if (!response.ok) throw new Error('Talepler alınamadı.');
    state.requestsList = await response.json();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function fetchDonations() {
  try {
    const response = await fetch(`${API_BASE_URL}/donations`);
    if (!response.ok) throw new Error('Bağışlar alınamadı.');
    state.donationsList = await response.json();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function fetchAllData() {
  if (!state.isAuthenticated) return;
  state.isListLoading = true;
  renderApp();
  await Promise.all([fetchUsers(), fetchProducts(), fetchRequests(), fetchDonations()]);
  state.isListLoading = false;
  renderApp();
}

// Login action
async function handleLogin(email, password) {
  const loginButton = document.getElementById('btn-login-submit');
  if (loginButton) {
    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş Yapılıyor...';
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'Admin' })
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'E-posta veya şifre hatalı.');
    }
    
    const userData = result.data?.user;
    if (!userData || userData.role !== 'Admin') {
      throw new Error('Yetkisiz erişim. Sadece Yöneticiler giriş yapabilir.');
    }
    
    // Save Auth State with login timestamp
    localStorage.setItem('admin_session', 'true');
    localStorage.setItem('admin_login_time', Date.now().toString());
    localStorage.setItem('admin_user', JSON.stringify(userData));
    state.isAuthenticated = true;
    state.adminUser = userData;
    
    showToast('Giriş başarılı! Yönetim paneline yönlendiriliyorsunuz.', 'success');
    
    // Fetch user data
    fetchAllData();
    
  } catch (e) {
    showToast(e.message, 'error');
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.innerHTML = 'Yönetici Girişi <i class="fas fa-arrow-right"></i>';
    }
  }
}

// Logout action
function handleLogout() {
  localStorage.removeItem('admin_session');
  localStorage.removeItem('admin_user');
  localStorage.removeItem('admin_login_time');
  state.isAuthenticated = false;
  state.adminUser = null;
  state.usersList = [];
  showToast('Oturum kapatıldı.', 'info');
  renderApp();
}

// Approve action
async function handleApprove(userId) {
  state.isActionLoading = true;
  renderApp();
  
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/approve`, { method: 'POST' });
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Kullanıcı onaylanamadı.');
    }
    
    showToast('Kullanıcı başarıyla onaylandı!', 'success');
    state.selectedUser = null; // Close modal
    fetchUsers(); // Refresh list
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    state.isActionLoading = false;
    renderApp();
  }
}

// Reject action
async function handleReject(userId) {
  state.isActionLoading = true;
  renderApp();
  
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/reject`, { method: 'POST' });
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'İşlem gerçekleştirilemedi.');
    }
    
    showToast('Öğrenci belgesi reddedildi.', 'info');
    state.selectedUser = null; // Close modal
    fetchUsers(); // Refresh list
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    state.isActionLoading = false;
    renderApp();
  }
}

// Unverify action
async function handleUnverify(userId) {
  state.isActionLoading = true;
  renderApp();
  
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/unverify`, { method: 'POST' });
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Durum güncellenemedi.');
    }
    
    showToast('Kullanıcı doğrulama durumu sıfırlandı (Onaysız yapıldı).', 'info');
    state.selectedUser = null; // Close modal
    fetchUsers(); // Refresh list
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    state.isActionLoading = false;
    renderApp();
  }
}

// Delete user action
async function handleDeleteUser(userId) {
  if (!confirm('Bu kullanıcıyı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
    return;
  }
  
  state.isActionLoading = true;
  renderApp();
  
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, { method: 'DELETE' });
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Kullanıcı silinemedi.');
    }
    
    showToast('Kullanıcı başarıyla silindi.', 'success');
    state.selectedUser = null; // Close modal
    fetchUsers(); // Refresh list
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    state.isActionLoading = false;
    renderApp();
  }
}

// Add Product Action
async function handleAddProduct(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-submit-product');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
  }

  try {
    const formData = new FormData();
    formData.append('Title', document.getElementById('prod-title').value);
    formData.append('Description', document.getElementById('prod-desc').value);
    formData.append('CategoryId', document.getElementById('prod-category').value);
    formData.append('Price', document.getElementById('prod-price').value);
    formData.append('Location', document.getElementById('prod-location').value);
    formData.append('GooglePlayProductId', document.getElementById('prod-play-id').value);
    formData.append('SubscriptionType', document.getElementById('prod-sub-type').value);
    
    // NOT: Kullanıcının isteği doğrultusunda "MİKTAR / KİŞİ SAYISI" alanı arayüzden 
    // kaldırıldığı için, API'ye gönderilen miktar varsayılan olarak her zaman 1'e sabitlendi.
    formData.append('Quantity', 1);
    
    formData.append('CreatorId', state.adminUser?.id || 'mock-supporter-id');

    const fileInput = document.getElementById('prod-image');
    if (fileInput.files.length > 0) {
      formData.append('Image', fileInput.files[0]);
    }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let errText = 'Ürün eklenirken bir hata oluştu.';
      try {
        const serverErr = await response.text();
        if (serverErr) errText += ` (${response.status}: ${serverErr.substring(0, 50)})`;
        else errText += ` (HTTP ${response.status})`;
      } catch(e) {}
      throw new Error(errText);
    }

    showToast('Ürün başarıyla eklendi!', 'success');
    
    // Reset Form
    document.getElementById('add-product-form').reset();
    document.getElementById('upload-content').style.display = 'flex';
    document.getElementById('prod-image-preview').style.display = 'none';
    document.getElementById('btn-remove-image').style.display = 'none';
    
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-check"></i> İlanı Yayınla';
    }
  }
}

async function handleDeleteProduct(productId) {
  if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
  state.isActionLoading = true;
  renderApp();
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('İlan silinemedi.');
    showToast('İlan başarıyla silindi.', 'success');
    fetchAllData();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    state.isActionLoading = false;
    renderApp();
  }
}

async function handleApproveRequest(requestId) {
  state.isActionLoading = true;
  renderApp();
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/approve`, { method: 'POST' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Onaylama başarısız.');
    showToast('Talep onaylandı.', 'success');
    fetchAllData();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    state.isActionLoading = false;
    renderApp();
  }
}

async function handleRejectRequest(requestId) {
  state.isActionLoading = true;
  renderApp();
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/reject`, { method: 'POST' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Reddetme başarısız.');
    showToast('Talep reddedildi.', 'info');
    fetchAllData();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    state.isActionLoading = false;
    renderApp();
  }
}

// Landing Page Render Function
function renderLandingPage() {
  appRoot.innerHTML = `
    <div class="landing-wrapper">
      <header class="landing-header">
        <div class="landing-brand">
          <i class="fas fa-hand-holding-heart"></i> Askıda
        </div>
      </header>
      
      <main class="landing-main">
        <div class="landing-hero">
          <div class="hero-badge">Yeni Versiyon Yayında 🎉</div>
          <h1 class="hero-title">İyilik Paylaştıkça Çoğalır</h1>
          <p class="hero-subtitle">Askıda, yardımsever işletmeler ve destekçiler ile ihtiyacı olan öğrencileri bir araya getiren sosyal dayanışma platformudur. Bir yemek, bir kitap veya sadece ufak bir destek; hepsi askıda sizi bekliyor.</p>
          
          <div class="hero-stats">
            <div class="stat-item glass-panel">
              <i class="fas fa-box-open" style="color: #38bdf8;"></i>
              <div class="stat-info">
                <h3 id="stat-products">...</h3>
                <span>Aktif İlan</span>
              </div>
            </div>
            <div class="stat-item glass-panel">
              <i class="fas fa-hand-holding-dollar" style="color: #4ade80;"></i>
              <div class="stat-info">
                <h3 id="stat-donations">...</h3>
                <span>Yapılan Bağış</span>
              </div>
            </div>
            <div class="stat-item glass-panel">
              <i class="fas fa-graduation-cap" style="color: #fb923c;"></i>
              <div class="stat-info">
                <h3 id="stat-students">...</h3>
                <span>Kayıtlı Öğrenci</span>
              </div>
            </div>
            <div class="stat-item glass-panel">
              <i class="fas fa-heart" style="color: #f43f5e;"></i>
              <div class="stat-info">
                <h3 id="stat-supporters">...</h3>
                <span>Aktif Destekçi</span>
              </div>
            </div>
            <div class="stat-item glass-panel">
              <i class="fas fa-store" style="color: #a855f7;"></i>
              <div class="stat-info">
                <h3 id="stat-businesses">...</h3>
                <span>Kayıtlı İşletme</span>
              </div>
            </div>
          </div>
          
          <div class="download-section">
            <h3 class="download-title">Uygulamamızı Hemen İndirin</h3>
            <div class="download-buttons">
              <a href="#" class="btn-store apple" onclick="alert('Yakında App Store\\'da!'); return false;">
                <i class="fab fa-apple"></i>
                <div class="btn-store-text">
                  <span>Download on the</span>
                  <strong>App Store</strong>
                </div>
              </a>
              <a href="#" class="btn-store google" onclick="alert('Yakında Google Play\\'de!'); return false;">
                <i class="fab fa-google-play"></i>
                <div class="btn-store-text">
                  <span>GET IT ON</span>
                  <strong>Google Play</strong>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <footer class="landing-footer">
        <p>&copy; ${new Date().getFullYear()} Askıda Uygulaması. Tüm Hakları Saklıdır.</p>
        <div class="footer-links">
          <a href="/privacy-policy.html" target="_blank">Gizlilik Politikası</a>
          <a href="/delete-account.html" target="_blank">Hesap Silme</a>
        </div>
      </footer>
    </div>
  `;
  
  fetchPublicStats();
}

async function fetchPublicStats() {
  try {
    const [productsRes, donationsRes, usersRes] = await Promise.all([
      fetch(`${API_BASE_URL}/products`),
      fetch(`${API_BASE_URL}/donations`),
      fetch(`${API_BASE_URL}/users`)
    ]);
    
    if(productsRes.ok) {
      const products = await productsRes.json();
      const el = document.getElementById('stat-products');
      if(el) el.innerText = products.length + '+';
    }
    
    if(donationsRes.ok) {
      const donations = await donationsRes.json();
      const el = document.getElementById('stat-donations');
      if(el) el.innerText = donations.length + '+';
    }
    
    if(usersRes.ok) {
      const users = await usersRes.json();
      const studentCount = users.filter(u => u.role === 'Student').length;
      const supporterCount = users.filter(u => u.role === 'Supporter').length;
      const businessCount = users.filter(u => u.role === 'Business').length;
      
      const sEl = document.getElementById('stat-students');
      if(sEl) sEl.innerText = studentCount + '+';
      
      const supEl = document.getElementById('stat-supporters');
      if(supEl) supEl.innerText = supporterCount + '+';
      
      const bEl = document.getElementById('stat-businesses');
      if(bEl) bEl.innerText = businessCount + '+';
    }
  } catch (err) {
    console.error('Failed to fetch public stats', err);
    // Fallback if API is down
    const pEl = document.getElementById('stat-products');
    if(pEl && pEl.innerText === '...') pEl.innerText = '100+';
    const dEl = document.getElementById('stat-donations');
    if(dEl && dEl.innerText === '...') dEl.innerText = '500+';
    const sEl = document.getElementById('stat-students');
    if(sEl && sEl.innerText === '...') sEl.innerText = '2000+';
    const supEl = document.getElementById('stat-supporters');
    if(supEl && supEl.innerText === '...') supEl.innerText = '300+';
    const bEl = document.getElementById('stat-businesses');
    if(bEl && bEl.innerText === '...') bEl.innerText = '50+';
  }
}

// Main Render Function
function renderAdminApp() {
  if (!state.isAuthenticated) {
    appRoot.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card glass-panel">
          <div class="brand-container">
            <i class="fas fa-shield-halved brand-icon"></i>
            <h1 class="brand-title">Askıda</h1>
            <p class="brand-subtitle">Yönetici Giriş Paneli</p>
          </div>
          <form id="login-form">
            <div class="form-group">
              <label for="email">E-POSTA</label>
              <div class="input-wrapper">
                <i class="fas fa-envelope"></i>
                <input type="email" id="email" class="input-control" placeholder="E-posta adresinizi girin" required>
              </div>
            </div>
            <div class="form-group">
              <label for="password">ŞİFRE</label>
              <div class="input-wrapper">
                <i class="fas fa-lock"></i>
                <input type="password" id="password" class="input-control" placeholder="••••••••" required>
              </div>
            </div>
            <button type="submit" id="btn-login-submit" class="btn-glowing">
              Yönetici Girişi <i class="fas fa-arrow-right"></i>
            </button>
          </form>
        </div>
      </div>
    `;
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        handleLogin(email, password);
      });
    }
    return;
  }
  
  // Stats calculations
  const totalStudents = state.usersList.filter(u => u.role === 'Student').length;
  const pendingCount = state.usersList.filter(u => u.role === 'Student' && u.verificationStatus === 'Pending').length;
  const partnersCount = state.usersList.filter(u => u.role === 'Business' || u.role === 'Supporter').length;
  
  // Filter and Search logic
  const filteredUsers = state.usersList.filter(u => {
    let matchesTab = false;
    if (state.activeTab === 'pending') {
      matchesTab = u.role === 'Student' && u.verificationStatus === 'Pending';
    } else if (state.activeTab === 'students') {
      matchesTab = u.role === 'Student';
    } else if (state.activeTab === 'partners') {
      matchesTab = u.role === 'Business' || u.role === 'Supporter';
    }
    
    const matchesSearch = u.fullName.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  appRoot.innerHTML = `
    <div class="dashboard-wrapper">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <i class="fas fa-hand-holding-heart sidebar-brand-icon"></i>
          <span class="sidebar-brand-name">Askıda Admin</span>
        </div>
        
        <ul class="sidebar-menu">
          <li class="menu-item ${state.activeTab === 'pending' ? 'active' : ''}" id="tab-pending">
            <i class="fas fa-clock-rotate-left"></i>
            <span>Onay Bekleyenler</span>
          </li>
          <li class="menu-item ${state.activeTab === 'students' ? 'active' : ''}" id="tab-students">
            <i class="fas fa-graduation-cap"></i>
            <span>Tüm Öğrenciler</span>
          </li>
          <li class="menu-item ${state.activeTab === 'partners' ? 'active' : ''}" id="tab-partners">
            <i class="fas fa-hand-holding-heart"></i>
            <span>İşletme & Destekçiler</span>
          </li>
          <li class="menu-item ${state.activeTab === 'products' ? 'active' : ''}" id="tab-products">
            <i class="fas fa-box-open"></i>
            <span>Ürün Yönetimi</span>
          </li>
          <li class="menu-item ${state.activeTab === 'requests' ? 'active' : ''}" id="tab-requests">
            <i class="fas fa-hand-holding"></i>
            <span>Öğrenci Talepleri</span>
          </li>
          <li class="menu-item ${state.activeTab === 'donations' ? 'active' : ''}" id="tab-donations">
            <i class="fas fa-hand-holding-dollar"></i>
            <span>Yapılan Bağışlar</span>
          </li>
          <li class="menu-item ${state.activeTab === 'add_product' ? 'active' : ''}" id="tab-add-product" style="display:none;">
            <i class="fas fa-plus-circle"></i>
            <span>Ürün / İlan Ekle</span>
          </li>
        </ul>
        
        <div class="sidebar-footer">
          <div class="admin-profile">
            <div class="admin-avatar">
              ${state.adminUser?.fullName?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div class="admin-info">
              <div class="name">${state.adminUser?.fullName || 'Yönetici'}</div>
              <div class="role">Sistem Yöneticisi</div>
            </div>
          </div>
          <a href="/privacy-policy.html" target="_blank" style="display: flex; align-items: center; gap: 10px; color: var(--text-secondary); text-decoration: none; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; font-weight: 500; font-size: 0.95rem; transition: all 0.3s ease; background: rgba(255,255,255,0.03);" onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.color='var(--text-secondary)';">
            <i class="fas fa-shield-halved" style="color: #38bdf8;"></i>
            <span>Gizlilik Politikası</span>
          </a>
          <a href="/delete-account.html" target="_blank" style="display: flex; align-items: center; gap: 10px; color: var(--text-secondary); text-decoration: none; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; font-weight: 500; font-size: 0.95rem; transition: all 0.3s ease; background: rgba(255,255,255,0.03);" onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.color='var(--text-secondary)';">
            <i class="fas fa-user-xmark" style="color: #f43f5e;"></i>
            <span>Hesap Silme</span>
          </a>
          <button id="btn-logout" class="btn-logout">
            <i class="fas fa-right-from-bracket"></i>
            <span>Güvenli Çıkış</span>
          </button>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="main-content">
        <header class="page-header">
          <div class="page-title">
            <h2>Öğrenci Doğrulama Masası</h2>
            <p>Sisteme yüklenen aktif öğrenci belgelerini onaylayın veya reddedin.</p>
          </div>
        </header>
        
        <!-- Stats Grid -->
        <section class="stats-grid">
          <div class="stat-card glass-panel purple">
            <div class="stat-info">
              <div class="stat-value">${totalStudents}</div>
              <div class="stat-label">Kayıtlı Öğrenci</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas fa-graduation-cap"></i>
            </div>
          </div>
          
          <div class="stat-card glass-panel orange">
            <div class="stat-info">
              <div class="stat-value">${pendingCount}</div>
              <div class="stat-label">Onay Bekleyen</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas fa-hourglass-half"></i>
            </div>
          </div>
          
          <div class="stat-card glass-panel green">
            <div class="stat-info">
              <div class="stat-value">${partnersCount}</div>
              <div class="stat-label">Destekçi & İşletme</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas fa-hand-holding-heart"></i>
            </div>
          </div>
        </section>
        
        <!-- Main Content Panel -->
        <section class="content-panel glass-panel">
          ${state.activeTab === 'add_product' ? `
            <div class="panel-header">
              <h3 class="panel-title">Yeni Ürün / İlan Ekle</h3>
              <button class="btn-action" id="btn-back-to-products" style="background: rgba(255,255,255,0.1); border:none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                <i class="fas fa-arrow-left"></i> İlanlara Dön
              </button>
            </div>
            <div class="add-product-container">
              <form id="add-product-form" class="product-form">
                <div class="form-row">
                  <div class="form-group half">
                    <label for="prod-title">BAŞLIK / İLAN ADI</label>
                    <div class="input-wrapper">
                      <i class="fas fa-heading"></i>
                      <input type="text" id="prod-title" class="input-control" placeholder="Örn: 2 Kişilik Karışık Izgara" required>
                    </div>
                  </div>
                  <div class="form-group half">
                    <label for="prod-category">KATEGORİ</label>
                    <div class="input-wrapper">
                      <i class="fas fa-list"></i>
                      <select id="prod-category" class="input-control" required>
                        <option value="cat-yemek">Yemek / Gıda</option>
                        <option value="cat-barinma">Barınma / Ev</option>
                        <option value="cat-kirtasiye">Kırtasiye / Eğitim</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label for="prod-desc">AÇIKLAMA</label>
                  <div class="input-wrapper textarea-wrapper">
                    <i class="fas fa-align-left" style="align-self: flex-start; margin-top: 15px;"></i>
                    <textarea id="prod-desc" class="input-control" rows="3" placeholder="Ürün veya yardımın detayları..." required></textarea>
                  </div>
                </div>

                <div class="form-group">
                  <label for="prod-price">PİYASA DEĞERİ / GÖRÜNEN FİYAT (₺)</label>
                  <div class="input-wrapper">
                    <i class="fas fa-lira-sign"></i>
                    <input type="number" id="prod-price" class="input-control" placeholder="0.00" step="0.01" min="0" required>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group half">
                    <label for="prod-play-id">GOOGLE PLAY ÜRÜN ID (Zorunlu)</label>
                    <div class="input-wrapper">
                      <i class="fab fa-google-play"></i>
                      <input type="text" id="prod-play-id" class="input-control" placeholder="Örn: meal_sub_weekly" required>
                    </div>
                  </div>
                  <div class="form-group half">
                    <label for="prod-sub-type">ABONELİK TÜRÜ</label>
                    <div class="input-wrapper">
                      <i class="fas fa-sync"></i>
                      <select id="prod-sub-type" class="input-control" required>
                        <option value="OneTime">Tek Seferlik Ödeme</option>
                        <option value="Weekly">Haftalık Abonelik</option>
                        <option value="Monthly">Aylık Abonelik</option>
                        <option value="Yearly">Yıllık Abonelik</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label for="prod-location">KONUM (İsteğe Bağlı)</label>
                  <div class="input-wrapper">
                    <i class="fas fa-map-marker-alt"></i>
                    <input type="text" id="prod-location" class="input-control" placeholder="Örn: Bandırma Merkez">
                  </div>
                </div>

                <div class="form-group">
                  <label>ÜRÜN GÖRSELİ</label>
                  <div class="file-upload-zone" id="prod-image-zone">
                    <input type="file" id="prod-image" accept="image/*" style="display: none;">
                    <div class="upload-content" id="upload-content">
                      <i class="fas fa-cloud-upload-alt"></i>
                      <p>Görsel Seçin veya Sürükleyin</p>
                      <span class="upload-hint">Sadece JPG, PNG formatları</span>
                    </div>
                    <img id="prod-image-preview" class="upload-preview" src="" alt="Önizleme" style="display: none;">
                    <button type="button" class="btn-remove-image" id="btn-remove-image" style="display: none;">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>

                <button type="submit" id="btn-submit-product" class="btn-glowing" style="margin-top: 20px; width: 100%;">
                  <i class="fas fa-check"></i> İlanı Yayınla
                </button>
              </form>
            </div>
          ` : state.activeTab === 'products' ? `
            <div class="panel-header">
              <h3 class="panel-title">Ürün Yönetimi</h3>
              <button class="btn-glowing" style="padding: 8px 16px; font-size: 14px;" id="btn-add-product">
                <i class="fas fa-plus"></i> Yeni Ürün / İlan Ekle
              </button>
            </div>
            <div class="user-grid">
              ${state.productsList.map(e => `
                <div class="user-card glass-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h4 class="user-name" style="margin-bottom: 5px;">${e.title}</h4>
                    <div style="color: var(--secondary); font-weight: bold; font-size: 1.2rem; margin-bottom: 10px;">${e.price} TL</div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px;">${e.description}</p>
                  </div>
                  <button class="btn-card-action btn-delete-product" data-id="${e.id}" style="background: rgba(231, 76, 60, 0.15); color: var(--danger); border: 1px solid rgba(231, 76, 60, 0.3);">
                    <i class="fas fa-trash"></i> İlanı Kaldır
                  </button>
                </div>
              `).join('')}
              ${state.productsList.length === 0 ? '<p style="color: var(--text-secondary); text-align: center; width: 100%;">Henüz yayınlanan bir ilan bulunmuyor.</p>' : ''}
            </div>
          ` : state.activeTab === 'requests' ? `
            <div class="panel-header">
              <h3 class="panel-title">Öğrenci Talepleri (${state.requestsList.filter(e => e.status === 'Pending').length} Bekleyen)</h3>
            </div>
            <div class="user-grid">
              ${state.requestsList.map(e => `
                <div class="user-card glass-panel">
                  <div class="user-card-header">
                    <div>
                      <h4 class="user-name">${e.studentName}</h4>
                      <span class="user-email" style="color: var(--primary); font-weight: bold;">${e.productName}</span>
                    </div>
                    <span class="status-badge ${e.status === 'Pending' ? 'pending' : e.status === 'Approved' ? 'verified' : e.status === 'Rejected' ? 'rejected' : 'verified'}">
                      ${e.status === 'Pending' ? 'Onay Bekliyor' : e.status === 'Approved' ? 'Onaylandı (Eşleştirme Bekliyor)' : e.status === 'Rejected' ? 'Reddedildi' : 'Teslim Edildi'}
                    </span>
                  </div>
                  <div class="user-card-body">
                    <div class="info-row"><i class="fas fa-calendar"></i><span>${formatDate(e.createdAt)}</span></div>
                  </div>
                  
                  ${e.status === 'Pending' ? `
                    <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; display: flex; gap: 10px;">
                      <button class="btn-card-action btn-approve-request" data-id="${e.id}" style="background: rgba(46, 204, 113, 0.15); color: var(--success); border: 1px solid rgba(46, 204, 113, 0.3); flex: 1;">
                        <i class="fas fa-check"></i> Onayla
                      </button>
                      <button class="btn-card-action btn-reject-request" data-id="${e.id}" style="background: rgba(231, 76, 60, 0.15); color: var(--danger); border: 1px solid rgba(231, 76, 60, 0.3); flex: 1;">
                        <i class="fas fa-times"></i> Reddet
                      </button>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
              ${state.requestsList.length === 0 ? '<p style="color: var(--text-secondary); text-align: center; width: 100%;">Henüz talep bulunmuyor.</p>' : ''}
            </div>
          ` : state.activeTab === 'donations' ? `
            <div class="panel-header">
              <h3 class="panel-title">Yapılan Bağışlar</h3>
            </div>
            <div class="user-grid">
              ${state.donationsList.map(e => {
                let p = state.productsList.find(t => t.id === e.productId);
                return `
                <div class="user-card glass-panel">
                  <div class="user-card-header">
                    <div>
                      <h4 class="user-name">Bağış: ${p ? p.title : 'Bilinmeyen Ürün'}</h4>
                      <span class="user-email" style="font-size: 1.1rem; font-weight: bold; color: var(--secondary);">${e.amount} TL</span>
                    </div>
                    <span class="status-badge ${e.status === 'Completed' ? 'verified' : 'pending'}">${e.status === 'Completed' ? 'Havuzda Bekliyor' : 'Kullanıldı (Teslim Edildi)'}</span>
                  </div>
                  <div class="user-card-body">
                    <div class="info-row"><i class="fas fa-calendar"></i><span>${formatDate(e.createdAt)}</span></div>
                    <div class="info-row"><i class="fas fa-user-heart"></i><span>Destekçi ID: ${e.supporterId.substring(0,8)}...</span></div>
                  </div>
                </div>
              `}).join('')}
              ${state.donationsList.length === 0 ? '<p style="color: var(--text-secondary); text-align: center; width: 100%;">Henüz bağış bulunmuyor.</p>' : ''}
            </div>
          ` : `
            <div class="panel-header">
              <h3 class="panel-title">${state.activeTab === 'pending' ? 'Onay Bekleyen Başvurular' : (state.activeTab === 'students' ? 'Tüm Öğrenci Listesi' : 'İşletme & Destekçi Ortaklarımız')}</h3>
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="search-input" placeholder="Öğrenci adı veya e-posta..." value="${state.searchQuery}">
              </div>
            </div>
          
          ${state.isListLoading ? `
            <div class="empty-state">
              <i class="fas fa-spinner fa-spin" style="font-size: 2.5rem; color: var(--primary)"></i>
              <h3 style="margin-top: 15px">Yükleniyor...</h3>
              <p>Öğrenci verileri sunucudan çekiliyor.</p>
            </div>
          ` : filteredUsers.length === 0 ? `
            <div class="empty-state">
              <i class="fas fa-folder-open"></i>
              <h3>Hiç Sonuç Bulunamadı</h3>
              <p>${state.searchQuery ? 'Arama kriterlerinize uyan kayıt bulunamadı.' : 'Onay bekleyen herhangi bir öğrenci kaydı bulunmuyor.'}</p>
            </div>
          ` : `
            <div class="user-grid">
              ${filteredUsers.map(user => `
                <div class="user-card glass-panel">
                  <div class="user-card-header">
                    <div>
                      <h4 class="user-name">${user.fullName}</h4>
                      <span class="user-email">${user.email}</span>
                    </div>
                    <span class="status-badge ${user.verificationStatus.toLowerCase()}">${
                      user.verificationStatus === 'None' ? 'Belge Yok' :
                      user.verificationStatus === 'Pending' ? 'Onay Bekliyor' :
                      user.verificationStatus === 'Verified' ? 'Onaylandı' : 'Reddedildi'
                    }</span>
                  </div>
                  
                  <div class="user-card-body">
                    <div class="info-row">
                      <i class="fas fa-calendar-alt"></i>
                      <span>Kayıt: ${formatDate(user.createdAt)}</span>
                    </div>
                    ${user.studentCategory ? `
                      <div class="info-row" style="color: var(--primary)">
                        <i class="fas fa-graduation-cap"></i>
                        <span>${user.studentCategory} - ${user.schoolName}</span>
                      </div>
                    ` : ''}
                    ${user.phone ? `
                      <div class="info-row" style="color: var(--text-secondary); opacity: 0.85;">
                        <i class="fas fa-phone"></i>
                        <span>${user.phone}</span>
                      </div>
                    ` : ''}
                    ${user.verificationDocumentUrl ? `
                      <div class="info-row" style="color: var(--success)">
                        <i class="fas fa-paperclip"></i>
                        <span>Öğrenci Belgesi Yüklü</span>
                      </div>
                    ` : `
                      <div class="info-row" style="color: var(--text-secondary)">
                        <i class="fas fa-times-circle"></i>
                        <span>Belge Yüklenmemiş</span>
                      </div>
                    `}
                  </div>
                  
                  ${user.verificationDocumentUrl ? `
                    <button class="btn-card-action btn-review" data-id="${user.id}">
                      <i class="fas fa-magnifying-glass"></i>
                      <span>Belgeyi İncele</span>
                    </button>
                  ` : `
                    <div style="padding: 10px; text-align: center; border-radius: 8px; font-weight: bold; background: rgba(255,255,255,0.03); color: var(--text-secondary); margin-bottom: 8px; font-size: 0.85rem;">
                      ${user.role === 'Business' ? '<i class="fas fa-store"></i> İşletme Hesabı' : (user.role === 'Supporter' ? '<i class="fas fa-volunteer-activism"></i> Destekçi Hesabı' : '<i class="fas fa-user"></i> Öğrenci (Belge Yok)')}
                    </div>
                  `}
                  <button class="btn-card-action btn-delete-user" data-id="${user.id}" style="background: rgba(231, 76, 60, 0.15); color: var(--danger); border: 1px solid rgba(231, 76, 60, 0.3); margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-trash-can"></i>
                    <span>Kullanıcıyı Sil</span>
                  </button>
                </div>
              `).join('')}
            </div>
          `}
          `}
        </section>
      </main>
    </div>

    <!-- Dynamic Image Verification Modal -->
    <div class="modal-backdrop ${state.selectedUser ? 'open' : ''}" id="verification-modal">
      ${state.selectedUser ? `
        <div class="modal-content glass-panel">
          <button class="modal-close" id="modal-close-btn">
            <i class="fas fa-times"></i>
          </button>
          
          <div class="modal-header-section">
            <h3>Öğrenci Belgesi Doğrulama</h3>
            <p>Lütfen aşağıdaki resmi ve bilgileri dikkatlice inceleyin.</p>
          </div>
          
          <div class="modal-grid">
            <!-- Left Info Panel -->
            <div class="detail-section">
              <div class="detail-card">
                <div class="detail-label">ÖĞRENCİ ADI SOYADI</div>
                <div class="detail-value">${state.selectedUser.fullName}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">E-POSTA ADRESİ</div>
                <div class="detail-value">${state.selectedUser.email}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">TELEFON NUMARASI</div>
                <div class="detail-value">${state.selectedUser.phone || 'Belirtilmemiş'}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">EĞİTİM KADEMESİ</div>
                <div class="detail-value">${state.selectedUser.studentCategory || 'Belirtilmemiş'}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">OKUL / ÜNİVERSİTE ADI</div>
                <div class="detail-value">${state.selectedUser.schoolName || 'Belirtilmemiş'}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">${state.selectedUser.studentCategory === 'Üniversite' ? 'FAKÜLTE / BÖLÜM' : 'SINIF / ŞUBE'}</div>
                <div class="detail-value">${state.selectedUser.grade || 'Belirtilmemiş'}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">BAŞVURU ZAMANI</div>
                <div class="detail-value">${formatDate(state.selectedUser.createdAt)}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">DOĞRULAMA DURUMU</div>
                <div class="detail-value">
                  <span class="status-badge ${state.selectedUser.verificationStatus.toLowerCase()}">${
                    state.selectedUser.verificationStatus === 'Pending' ? 'Onay Bekliyor' :
                    state.selectedUser.verificationStatus === 'Verified' ? 'Onaylandı' : 'Reddedildi'
                  }</span>
                </div>
              </div>
            </div>
            
            <!-- Right Document Preview -->
            <div class="document-preview-section">
              <div class="detail-label" style="width: 100%; margin-bottom: 8px">
                YÜKLENEN BELGE / GÖRSEL
              </div>
              <div class="preview-actions-bar">
                <button class="btn-preview-action" id="btn-open-doc" type="button" title="Belgeyi yeni sekmede açar">
                  <i class="fas fa-external-link-alt" style="color: var(--success);"></i> Dosyayı Aç / İncele
                </button>
                <button class="btn-preview-action" id="btn-download-doc" type="button" title="Belgeyi kullanıcı adı ile indirir">
                  <i class="fas fa-download" style="color: var(--primary);"></i> Dosyayı İndir
                </button>
              </div>
              <div class="document-preview-box" 
                   onclick="window.open('${state.selectedUser.verificationDocumentUrl}', '_blank')"
                   style="width: 100%; height: 350px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer;"
                   title="Belgeyi yeni sekmede açmak için tıklayın">
                ${(() => {
                  const url = state.selectedUser.verificationDocumentUrl || '';
                  const lowerUrl = url.toLowerCase();
                  if (lowerUrl.includes('.pdf')) {
                    return `<iframe src="${url}" width="100%" height="100%" style="border: none; border-radius: 11px;"></iframe>`;
                  } else {
                    return `
                      <img src="" alt="Öğrenci Belgesi" id="document-preview-img" style="max-width: 100%; max-height: 100%; object-fit: contain; display: none;">
                      <div id="heic-loader" style="display: none; flex-direction: column; align-items: center; justify-content: center; gap: 15px; text-align: center; padding: 20px;">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 3rem; color: var(--primary);"></i>
                        <h4 style="margin: 0; color: var(--text-primary); font-size: 1.1rem;">HEIF Görseli Dönüştürülüyor</h4>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); max-width: 240px; margin: 0; line-height: 1.4;">
                          iOS formatındaki yüksek kaliteli görsel önizleme için dönüştürülüyor, lütfen bekleyin...
                        </p>
                      </div>
                      <div id="preview-error-box" style="display: none; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center;">
                        <i class="fas fa-triangle-exclamation" style="font-size: 3rem; color: var(--danger); filter: drop-shadow(0 0 10px rgba(231, 76, 60, 0.2));"></i>
                        <h4 style="margin:0; color: var(--text-primary);">Görsel Yüklenemedi</h4>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); max-width: 240px; margin:0; line-height:1.4;">Dosya formatı veya tarayıcı kısıtlaması nedeniyle belge önizlenemiyor.</p>
                      </div>
                    `;
                  }
                })()}
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            ${state.isActionLoading ? `
              <div style="display:flex; align-items:center; gap: 10px; color: var(--text-secondary)">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem"></i>
                <span>İşlem yapılıyor, lütfen bekleyin...</span>
              </div>
            ` : `
              <button class="btn-action" id="action-delete-modal-btn" style="background: rgba(231, 76, 60, 0.15); color: var(--danger); border: 1px solid rgba(231, 76, 60, 0.3); border-radius: 8px; padding: 10px 16px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600;">
                <i class="fas fa-trash-can"></i>
                <span>Kullanıcıyı Sil</span>
              </button>
              <button class="btn-action" id="action-unverify-btn" style="background: rgba(241, 196, 15, 0.15); color: #f39c12; border: 1px solid rgba(241, 196, 15, 0.3); border-radius: 8px; padding: 10px 16px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600;">
                <i class="fas fa-rotate-left"></i>
                <span>Onaysız Yap</span>
              </button>
              <button class="btn-action btn-reject" id="action-reject-btn">
                <i class="fas fa-user-xmark"></i>
                <span>Başvuruyu Reddet</span>
              </button>
              <button class="btn-action btn-approve" id="action-approve-btn">
                <i class="fas fa-user-check"></i>
                <span>Başvuruyu Onayla</span>
              </button>
            `}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Attach Event Listeners
  attachDashboardEvents();

  // HEIF/HEIC dynamically loaded conversion logic
  if (state.selectedUser) {
    const url = state.selectedUser.verificationDocumentUrl || '';
    const lowerUrl = url.toLowerCase();
    
    if (!lowerUrl.includes('.pdf') && url) {
      const img = document.getElementById('document-preview-img');
      const loader = document.getElementById('heic-loader');
      const errorBox = document.getElementById('preview-error-box');
      
      if (img && loader && errorBox) {
        if (lowerUrl.includes('.heic') || lowerUrl.includes('.heif')) {
          loader.style.display = 'flex';
          img.style.display = 'none';
          errorBox.style.display = 'none';
          
          fetch(url)
            .then(res => {
              if (!res.ok) throw new Error('File download failed');
              return res.blob();
            })
            .then(blob => {
              if (typeof heic2any !== 'undefined') {
                return heic2any({
                  blob: blob,
                  toType: 'image/jpeg',
                  quality: 0.6
                });
              } else {
                throw new Error('heic2any library not loaded');
              }
            })
            .then(resultBlob => {
              const finalBlob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
              const localUrl = URL.createObjectURL(finalBlob);
              img.src = localUrl;
              img.style.display = 'block';
              loader.style.display = 'none';
            })
            .catch(err => {
              console.error('HEIF conversion error:', err);
              loader.style.display = 'none';
              errorBox.style.display = 'flex';
            });
        } else {
          // Standard Image
          img.src = url;
          img.style.display = 'block';
          img.onerror = () => {
            img.style.display = 'none';
            errorBox.style.display = 'flex';
          };
        }
      }
    }
  }
}

function attachDashboardEvents() {
  // Sidebar Tabs
  const tabPending = document.getElementById('tab-pending');
  const tabStudents = document.getElementById('tab-students');
  const tabPartners = document.getElementById('tab-partners');
  
  if (tabPending) {
    tabPending.addEventListener('click', () => {
      state.activeTab = 'pending';
      renderApp();
    });
  }
  
  if (tabStudents) {
    tabStudents.addEventListener('click', () => {
      state.activeTab = 'students';
      renderApp();
    });
  }
  
  if (tabPartners) {
    tabPartners.addEventListener('click', () => {
      state.activeTab = 'partners';
      renderApp();
    });
  }
  
  const tabProducts = document.getElementById('tab-products');
  if (tabProducts) {
    tabProducts.addEventListener('click', () => {
      state.activeTab = 'products';
      renderApp();
    });
  }

  const tabRequests = document.getElementById('tab-requests');
  if (tabRequests) {
    tabRequests.addEventListener('click', () => {
      state.activeTab = 'requests';
      renderApp();
    });
  }

  const tabDonations = document.getElementById('tab-donations');
  if (tabDonations) {
    tabDonations.addEventListener('click', () => {
      state.activeTab = 'donations';
      renderApp();
    });
  }
  
  const tabAddProduct = document.getElementById('tab-add-product');
  if (tabAddProduct) {
    tabAddProduct.addEventListener('click', () => {
      state.activeTab = 'add_product';
      renderApp();
    });
  }

  const btnAddProduct = document.getElementById('btn-add-product');
  if (btnAddProduct) {
    btnAddProduct.addEventListener('click', () => {
      state.activeTab = 'add_product';
      renderApp();
    });
  }

  const btnBackToProducts = document.getElementById('btn-back-to-products');
  if (btnBackToProducts) {
    btnBackToProducts.addEventListener('click', () => {
      state.activeTab = 'products';
      renderApp();
    });
  }

  // Add Product Form Events
  if (state.activeTab === 'add_product') {
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
      addProductForm.addEventListener('submit', handleAddProduct);
    }

    const imageZone = document.getElementById('prod-image-zone');
    const imageInput = document.getElementById('prod-image');
    const imagePreview = document.getElementById('prod-image-preview');
    const uploadContent = document.getElementById('upload-content');
    const removeBtn = document.getElementById('btn-remove-image');

    if (imageZone && imageInput) {
      imageZone.addEventListener('click', (e) => {
        if (e.target.id !== 'btn-remove-image' && e.target.closest('#btn-remove-image') == null) {
          imageInput.click();
        }
      });

      imageInput.addEventListener('change', () => {
        if (imageInput.files && imageInput.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            uploadContent.style.display = 'none';
            removeBtn.style.display = 'flex';
          };
          reader.readAsDataURL(imageInput.files[0]);
        }
      });

      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        imageInput.value = '';
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        uploadContent.style.display = 'flex';
        removeBtn.style.display = 'none';
      });
    }
  }

  // Search box
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      // Re-render only grid part if possible, or fully re-render for simplicity
      // For vanilla SPA, fully re-rendering is fine and avoids sync bugs
      renderApp();
      // Keep focus on input after re-render
      const input = document.getElementById('search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
  }
  
  // Logout
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Review buttons
  const reviewButtons = document.querySelectorAll('.btn-review');
  reviewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const user = state.usersList.find(u => u.id === id);
      if (user) {
        state.selectedUser = user;
        renderApp();
      }
    });
  });

  const deleteProductButtons = document.querySelectorAll('.btn-delete-product');
  deleteProductButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      handleDeleteProduct(id);
    });
  });

  const approveRequestButtons = document.querySelectorAll('.btn-approve-request');
  approveRequestButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      handleApproveRequest(id);
    });
  });

  const rejectRequestButtons = document.querySelectorAll('.btn-reject-request');
  rejectRequestButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      handleRejectRequest(id);
    });
  });

  // Card delete buttons
  const cardDeleteButtons = document.querySelectorAll('.btn-delete-user');
  cardDeleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      handleDeleteUser(id);
    });
  });
  
  // Modal handlers
  const modalCloseBtn = document.getElementById('modal-close-btn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      state.selectedUser = null;
      renderApp();
    });
  }
  
  const approveBtn = document.getElementById('action-approve-btn');
  if (approveBtn && state.selectedUser) {
    approveBtn.addEventListener('click', () => {
      handleApprove(state.selectedUser.id);
    });
  }
  
  const rejectBtn = document.getElementById('action-reject-btn');
  if (rejectBtn && state.selectedUser) {
    rejectBtn.addEventListener('click', () => {
      handleReject(state.selectedUser.id);
    });
  }

  const unverifyBtn = document.getElementById('action-unverify-btn');
  if (unverifyBtn && state.selectedUser) {
    unverifyBtn.addEventListener('click', () => {
      handleUnverify(state.selectedUser.id);
    });
  }

  const deleteModalBtn = document.getElementById('action-delete-modal-btn');
  if (deleteModalBtn && state.selectedUser) {
    deleteModalBtn.addEventListener('click', () => {
      handleDeleteUser(state.selectedUser.id);
    });
  }

  // Open / View document in a new tab
  const openDocBtn = document.getElementById('btn-open-doc');
  if (openDocBtn && state.selectedUser) {
    openDocBtn.addEventListener('click', async () => {
      const url = state.selectedUser.verificationDocumentUrl || '';
      const lowerUrl = url.toLowerCase();
      
      // Since browsers cannot natively render HEIF/HEIC, convert it on the fly to a JPEG blob and open that blob in a new tab
      if (lowerUrl.includes('.heic') || lowerUrl.includes('.heif')) {
        showToast('HEIF görseli dönüştürülüyor ve açılıyor...', 'info');
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error('File download failed');
          const blob = await res.blob();
          
          if (typeof heic2any !== 'undefined') {
            const converted = await heic2any({
              blob: blob,
              toType: 'image/jpeg',
              quality: 0.8
            });
            const finalBlob = Array.isArray(converted) ? converted[0] : converted;
            const localUrl = URL.createObjectURL(finalBlob);
            window.open(localUrl, '_blank');
          } else {
            throw new Error('heic2any library not loaded');
          }
        } catch (err) {
          console.error('HEIF open error, falling back:', err);
          window.open(url, '_blank');
        }
      } else {
        // For non-HEIF documents (PDF, standard images), open via the backend view-document endpoint in a new tab
        const viewUrl = `${API_BASE_URL}/users/${state.selectedUser.id}/view-document`;
        window.open(viewUrl, '_blank');
      }
    });
  }

  // Download document with a clean username and matching extension via C# backend endpoint
  const downloadDocBtn = document.getElementById('btn-download-doc');
  if (downloadDocBtn && state.selectedUser) {
    downloadDocBtn.addEventListener('click', () => {
      const downloadUrl = `${API_BASE_URL}/users/${state.selectedUser.id}/download-document`;
      showToast('Dosya indiriliyor...', 'info');
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }
}

function renderApp() {
  const path = window.location.pathname;
  if (path === '/admin' || path === '/admin/') {
    renderAdminApp();
  } else {
    renderLandingPage();
  }
}

window.addEventListener('popstate', renderApp);

// Initial Fetch on startup
if (state.isAuthenticated) {
  fetchAllData();
} else {
  renderApp();
}
