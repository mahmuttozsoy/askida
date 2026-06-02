import './style.css';

// Dynamic API URL resolution
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5024/api'
  : 'http://172.20.10.5:5024/api';

// App State
let state = {
  isAuthenticated: !!localStorage.getItem('admin_session'),
  adminUser: JSON.parse(localStorage.getItem('admin_user') || 'null'),
  activeTab: 'pending', // 'pending' or 'all'
  usersList: [],
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
  state.isListLoading = true;
  renderApp();
  
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Kullanıcı listesi alınamadı.');
    const users = await response.json();
    // Exclude the logged-in admin from verification listings
    state.usersList = users.filter(u => u.role !== 'Admin');
  } catch (e) {
    showToast(e.message || 'Sunucuyla bağlantı kurulamadı.', 'error');
  } finally {
    state.isListLoading = false;
    renderApp();
  }
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
    
    const userData = result.data;
    if (!userData || userData.role !== 'Admin') {
      throw new Error('Yetkisiz erişim. Sadece Yöneticiler giriş yapabilir.');
    }
    
    // Save Auth State
    localStorage.setItem('admin_session', 'true');
    localStorage.setItem('admin_user', JSON.stringify(userData));
    state.isAuthenticated = true;
    state.adminUser = userData;
    
    showToast('Giriş başarılı! Yönetim paneline yönlendiriliyorsunuz.', 'success');
    
    // Fetch user data
    fetchUsers();
    
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

// Main Render Function
function renderApp() {
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
                <input type="email" id="email" class="input-control" placeholder="admin@askida.org" required value="admin@askida.org">
              </div>
            </div>
            <div class="form-group">
              <label for="password">ŞİFRE</label>
              <div class="input-wrapper">
                <i class="fas fa-lock"></i>
                <input type="password" id="password" class="input-control" placeholder="••••••••" required value="admin">
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

// Initial Fetch on startup
if (state.isAuthenticated) {
  fetchUsers();
} else {
  renderApp();
}
