(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=window.location.hostname===`localhost`||window.location.hostname===`127.0.0.1`?`http://195.35.56.82:5024/api`:`https://api.askidagmtid.com/api`,t={isAuthenticated:!!localStorage.getItem(`admin_session`),adminUser:JSON.parse(localStorage.getItem(`admin_user`)||`null`),activeTab:`pending`,usersList:[],productsList:[],requestsList:[],donationsList:[],searchQuery:``,selectedUser:null,isActionLoading:!1,isListLoading:!1},n=document.getElementById(`app`),r=document.createElement(`div`);r.className=`bg-glow-1`;var i=document.createElement(`div`);i.className=`bg-glow-2`,document.body.appendChild(r),document.body.appendChild(i);var a=document.createElement(`div`);a.className=`toast-container`,document.body.appendChild(a);function o(e,t=`success`){let n=document.createElement(`div`);n.className=`toast ${t}`;let r=`fa-check-circle`;t===`error`&&(r=`fa-exclamation-circle`),t===`info`&&(r=`fa-info-circle`),n.innerHTML=`<i class="fas ${r}"></i> <span>${e}</span>`,a.appendChild(n),setTimeout(()=>{n.style.animation=`slideIn 0.3s reverse forwards`,setTimeout(()=>n.remove(),300)},4e3)}function s(e){if(!e)return`-`;try{return new Date(e).toLocaleString(`tr-TR`,{day:`2-digit`,month:`2-digit`,year:`numeric`,hour:`2-digit`,minute:`2-digit`})}catch{return e}}async function c(){if(t.isAuthenticated){t.isListLoading=!0,y();try{let n=await fetch(`${e}/users`);if(!n.ok)throw Error(`Kullanıcı listesi alınamadı.`);t.usersList=(await n.json()).filter(e=>e.role!==`Admin`)}catch(e){o(e.message||`Sunucuyla bağlantı kurulamadı.`,`error`)}finally{t.isListLoading=!1,y()}}}async function l(){try{let n=await fetch(`${e}/products`);if(!n.ok)throw Error(`Ürünler alınamadı.`);t.productsList=await n.json()}catch(e){o(e.message,`error`)}}async function u(){try{let n=await fetch(`${e}/requests`);if(!n.ok)throw Error(`Talepler alınamadı.`);t.requestsList=await n.json()}catch(e){o(e.message,`error`)}}async function d(){try{let n=await fetch(`${e}/donations`);if(!n.ok)throw Error(`Bağışlar alınamadı.`);t.donationsList=await n.json()}catch(e){o(e.message,`error`)}}async function f(){t.isListLoading=!0,y(),await Promise.all([c(),l(),u(),d()]),t.isListLoading=!1,y()}async function p(n,r){let i=document.getElementById(`btn-login-submit`);i&&(i.disabled=!0,i.innerHTML=`<i class="fas fa-spinner fa-spin"></i> Giriş Yapılıyor...`);try{let i=await fetch(`${e}/auth/login`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({email:n,password:r,role:`Admin`})}),a=await i.json();if(!i.ok||!a.success)throw Error(a.message||`E-posta veya şifre hatalı.`);let s=a.data.user;if(!s||s.role!==`Admin`)throw Error(`Yetkisiz erişim. Sadece Yöneticiler giriş yapabilir.`);localStorage.setItem(`admin_session`,`true`),localStorage.setItem(`admin_user`,JSON.stringify(s)),localStorage.setItem(`admin_token`,a.data.token),t.isAuthenticated=!0,t.adminUser=s,o(`Giriş başarılı! Yönetim paneline yönlendiriliyorsunuz.`,`success`),f()}catch(e){o(e.message,`error`),i&&(i.disabled=!1,i.innerHTML=`Yönetici Girişi <i class="fas fa-arrow-right"></i>`)}}function m(){localStorage.removeItem(`admin_session`),localStorage.removeItem(`admin_user`),t.isAuthenticated=!1,t.adminUser=null,t.usersList=[],o(`Oturum kapatıldı.`,`info`),y()}async function h(n){t.isActionLoading=!0,y();try{let r=await fetch(`${e}/users/${n}/approve`,{method:`POST`}),i=await r.json();if(!r.ok||!i.success)throw Error(i.message||`Kullanıcı onaylanamadı.`);o(`Kullanıcı başarıyla onaylandı!`,`success`),t.selectedUser=null,c()}catch(e){o(e.message,`error`)}finally{t.isActionLoading=!1,y()}}async function g(n){t.isActionLoading=!0,y();try{let r=await fetch(`${e}/users/${n}/reject`,{method:`POST`}),i=await r.json();if(!r.ok||!i.success)throw Error(i.message||`İşlem gerçekleştirilemedi.`);o(`Öğrenci belgesi reddedildi.`,`info`),t.selectedUser=null,c()}catch(e){o(e.message,`error`)}finally{t.isActionLoading=!1,y()}}async function _(n){t.isActionLoading=!0,y();try{let r=await fetch(`${e}/users/${n}/unverify`,{method:`POST`}),i=await r.json();if(!r.ok||!i.success)throw Error(i.message||`Durum güncellenemedi.`);o(`Kullanıcı doğrulama durumu sıfırlandı (Onaysız yapıldı).`,`info`),t.selectedUser=null,c()}catch(e){o(e.message,`error`)}finally{t.isActionLoading=!1,y()}}async function v(n){if(confirm(`Bu kullanıcıyı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)){t.isActionLoading=!0,y();try{let r=await fetch(`${e}/users/${n}`,{method:`DELETE`}),i=await r.json();if(!r.ok||!i.success)throw Error(i.message||`Kullanıcı silinemedi.`);o(`Kullanıcı başarıyla silindi.`,`success`),t.selectedUser=null,c()}catch(e){o(e.message,`error`)}finally{t.isActionLoading=!1,y()}}}function y(){if(!t.isAuthenticated){n.innerHTML=`
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
    `;let e=document.getElementById(`login-form`);e&&e.addEventListener(`submit`,e=>{e.preventDefault();let t=document.getElementById(`email`).value,n=document.getElementById(`password`).value;p(t,n)});return}let e=t.usersList.filter(e=>e.role===`Student`).length,r=t.usersList.filter(e=>e.role===`Student`&&e.verificationStatus===`Pending`).length,i=t.usersList.filter(e=>e.role===`Business`||e.role===`Supporter`).length;t.usersList.filter(e=>{let n=!1;t.activeTab===`pending`?n=e.role===`Student`&&e.verificationStatus===`Pending`:t.activeTab===`students`?n=e.role===`Student`:t.activeTab===`partners`&&(n=e.role===`Business`||e.role===`Supporter`);let r=e.fullName.toLowerCase().includes(t.searchQuery.toLowerCase())||e.email.toLowerCase().includes(t.searchQuery.toLowerCase());return n&&r}),n.innerHTML=`
    <div class="dashboard-wrapper">
      <!-- Mobile Header -->
      <div class="mobile-header">
        <div class="sidebar-header" style="margin-bottom: 0; padding-left: 0;">
          <i class="fas fa-hand-holding-heart sidebar-brand-icon"></i>
          <span class="sidebar-brand-name">Askıda</span>
        </div>
        <button id="mobile-menu-btn" class="mobile-menu-btn">
          <i class="fas fa-bars"></i>
        </button>
      </div>
      
      <!-- Mobile Overlay -->
      <div id="mobile-overlay" class="mobile-overlay"></div>
      
      <!-- Sidebar -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <i class="fas fa-hand-holding-heart sidebar-brand-icon"></i>
          <span class="sidebar-brand-name">Askıda Admin</span>
        </div>
        
        <ul class="sidebar-menu">
          <li class="menu-item ${t.activeTab===`pending`?`active`:``}" id="tab-pending">
            <i class="fas fa-clock-rotate-left"></i>
            <span>Onay Bekleyenler</span>
          </li>
          <li class="menu-item ${t.activeTab===`students`?`active`:``}" id="tab-students">
            <i class="fas fa-graduation-cap"></i>
            <span>Tüm Öğrenciler</span>
          </li>
          <li class="menu-item ${t.activeTab===`partners`?`active`:``}" id="tab-partners">
            <i class="fas fa-users"></i>
            <span>İşletme & Destekçiler</span>
          </li>
          <li class="menu-item ${t.activeTab===`products`?`active`:``}" id="tab-products">
            <i class="fas fa-box-open"></i>
            <span>Ürün Yönetimi</span>
          </li>
          <li class="menu-item ${t.activeTab===`requests`?`active`:``}" id="tab-requests">
            <i class="fas fa-hand-holding"></i>
            <span>Öğrenci Talepleri</span>
          </li>
          <li class="menu-item ${t.activeTab===`donations`?`active`:``}" id="tab-donations">
            <i class="fas fa-hand-holding-dollar"></i>
            <span>Yapılan Bağışlar</span>
          </li>
        </ul>
        
        <div class="sidebar-footer">
          <div class="admin-profile">
            <div class="admin-avatar">
              ${t.adminUser?.fullName?.substring(0,2).toUpperCase()||`AD`}
            </div>
            <div class="admin-info">
              <div class="name">${t.adminUser?.fullName||`Yönetici`}</div>
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
        <header class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div class="page-title">
            <h2>Askıda Yönetim Paneli</h2>
            <p>Sistem verilerini ve talepleri yönetin.</p>
          </div>
          <button id="btn-refresh-data" class="btn-glowing" style="padding: 8px 16px; font-size: 14px; background: rgba(52, 152, 219, 0.2); color: var(--secondary); border: 1px solid rgba(52, 152, 219, 0.5);">
            <i class="fas fa-sync-alt"></i> Verileri Yenile
          </button>
        </header>
        
        <!-- Stats Grid -->
        <section class="stats-grid">
          <div class="stat-card glass-panel purple">
            <div class="stat-info">
              <div class="stat-value">${e}</div>
              <div class="stat-label">Kayıtlı Öğrenci</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas fa-graduation-cap"></i>
            </div>
          </div>
          
          <div class="stat-card glass-panel orange">
            <div class="stat-info">
              <div class="stat-value">${r}</div>
              <div class="stat-label">Onay Bekleyen</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas fa-hourglass-half"></i>
            </div>
          </div>
          
          <div class="stat-card glass-panel green">
            <div class="stat-info">
              <div class="stat-value">${i}</div>
              <div class="stat-label">Destekçi & İşletme</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas fa-hand-holding-heart"></i>
            </div>
          </div>
        </section>
        
        <!-- Main Content Panel -->
        <section class="content-panel glass-panel">
          ${b()}
        </section>
        </section>
      </main>
    </div>

    <!-- Dynamic Image Verification Modal -->
    <div class="modal-backdrop ${t.selectedUser?`open`:``}" id="verification-modal">
      ${t.selectedUser?`
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
                <div class="detail-value">${t.selectedUser.fullName}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">E-POSTA ADRESİ</div>
                <div class="detail-value">${t.selectedUser.email}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">TELEFON NUMARASI</div>
                <div class="detail-value">${t.selectedUser.phone||`Belirtilmemiş`}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">EĞİTİM KADEMESİ</div>
                <div class="detail-value">${t.selectedUser.studentCategory||`Belirtilmemiş`}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">OKUL / ÜNİVERSİTE ADI</div>
                <div class="detail-value">${t.selectedUser.schoolName||`Belirtilmemiş`}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">${t.selectedUser.studentCategory===`Üniversite`?`FAKÜLTE / BÖLÜM`:`SINIF / ŞUBE`}</div>
                <div class="detail-value">${t.selectedUser.grade||`Belirtilmemiş`}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">BAŞVURU ZAMANI</div>
                <div class="detail-value">${s(t.selectedUser.createdAt)}</div>
              </div>
              <div class="detail-card">
                <div class="detail-label">DOĞRULAMA DURUMU</div>
                <div class="detail-value">
                  <span class="status-badge ${t.selectedUser.verificationStatus.toLowerCase()}">${t.selectedUser.verificationStatus===`Pending`?`Onay Bekliyor`:t.selectedUser.verificationStatus===`Verified`?`Onaylandı`:`Reddedildi`}</span>
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
                   onclick="window.open('${t.selectedUser.verificationDocumentUrl}', '_blank')"
                   style="width: 100%; height: 350px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer;"
                   title="Belgeyi yeni sekmede açmak için tıklayın">
                ${(()=>{let e=t.selectedUser.verificationDocumentUrl||``;return e.toLowerCase().includes(`.pdf`)?`<iframe src="${e}" width="100%" height="100%" style="border: none; border-radius: 11px;"></iframe>`:`
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
                    `})()}
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            ${t.isActionLoading?`
              <div style="display:flex; align-items:center; gap: 10px; color: var(--text-secondary)">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem"></i>
                <span>İşlem yapılıyor, lütfen bekleyin...</span>
              </div>
            `:`
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
      `:``}
    </div>
  `,T();let a=document.getElementById(`btn-refresh-data`);a&&a.addEventListener(`click`,()=>{f()}),t.selectedUser}function b(){return t.isListLoading?`
      <div class="empty-state">
        <i class="fas fa-spinner fa-spin" style="font-size: 2.5rem; color: var(--primary)"></i>
        <h3 style="margin-top: 15px">Yükleniyor...</h3>
        <p>Veriler sunucudan çekiliyor.</p>
      </div>
    `:t.activeTab===`products`?S():t.activeTab===`requests`?C():t.activeTab===`donations`?w():x()}function x(){let e=t.usersList.filter(e=>{let n=!1;t.activeTab===`pending`?n=e.role===`Student`&&e.verificationStatus===`Pending`:t.activeTab===`students`?n=e.role===`Student`:t.activeTab===`partners`&&(n=e.role===`Business`||e.role===`Supporter`);let r=e.fullName.toLowerCase().includes(t.searchQuery.toLowerCase())||e.email.toLowerCase().includes(t.searchQuery.toLowerCase());return n&&r});return`
          <div class="panel-header">
            <h3 class="panel-title">${t.activeTab===`pending`?`Onay Bekleyen Başvurular`:t.activeTab===`students`?`Tüm Öğrenci Listesi`:`İşletme & Destekçi Ortaklarımız`}</h3>
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" id="search-input" placeholder="Öğrenci adı veya e-posta..." value="${t.searchQuery}">
            </div>
          </div>
          
          ${e.length===0?`
            <div class="empty-state">
              <i class="fas fa-folder-open"></i>
              <h3>Hiç Sonuç Bulunamadı</h3>
              <p>${t.searchQuery?`Arama kriterlerinize uyan kayıt bulunamadı.`:`Bu kategoride kullanıcı bulunmuyor.`}</p>
            </div>
          `:`
            <div class="user-grid">
              ${e.map(e=>`
                <div class="user-card glass-panel">
                  <div class="user-card-header">
                    <div>
                      <h4 class="user-name">${e.fullName}</h4>
                      <span class="user-email">${e.email}</span>
                    </div>
                    <span class="status-badge ${e.verificationStatus.toLowerCase()}">${e.verificationStatus===`None`?`Belge Yok`:e.verificationStatus===`Pending`?`Onay Bekliyor`:e.verificationStatus===`Verified`?`Onaylandı`:`Reddedildi`}</span>
                  </div>
                  
                  <div class="user-card-body">
                    <div class="info-row">
                      <i class="fas fa-calendar-alt"></i>
                      <span>Kayıt: ${s(e.createdAt)}</span>
                    </div>
                    ${e.studentCategory?`
                      <div class="info-row" style="color: var(--primary)">
                        <i class="fas fa-graduation-cap"></i>
                        <span>${e.studentCategory} - ${e.schoolName}</span>
                      </div>
                    `:``}
                    ${e.phone?`
                      <div class="info-row" style="color: var(--text-secondary); opacity: 0.85;">
                        <i class="fas fa-phone"></i>
                        <span>${e.phone}</span>
                      </div>
                    `:``}
                    ${e.verificationDocumentUrl?`
                      <div class="info-row" style="color: var(--success)">
                        <i class="fas fa-paperclip"></i>
                        <span>Öğrenci Belgesi Yüklü</span>
                      </div>
                    `:`
                      <div class="info-row" style="color: var(--text-secondary)">
                        <i class="fas fa-times-circle"></i>
                        <span>Belge Yüklenmemiş</span>
                      </div>
                    `}
                  </div>
                  
                  ${e.verificationDocumentUrl?`
                    <button class="btn-card-action btn-review" data-id="${e.id}">
                      <i class="fas fa-magnifying-glass"></i>
                      <span>Belgeyi İncele</span>
                    </button>
                  `:`
                    <div style="padding: 10px; text-align: center; border-radius: 8px; font-weight: bold; background: rgba(255,255,255,0.03); color: var(--text-secondary); margin-bottom: 8px; font-size: 0.85rem;">
                      ${e.role===`Business`?`<i class="fas fa-store"></i> İşletme Hesabı`:e.role===`Supporter`?`<i class="fas fa-volunteer-activism"></i> Destekçi Hesabı`:`<i class="fas fa-user"></i> Öğrenci (Belge Yok)`}
                    </div>
                  `}
                  <button class="btn-card-action btn-delete-user" data-id="${e.id}" style="background: rgba(231, 76, 60, 0.15); color: var(--danger); border: 1px solid rgba(231, 76, 60, 0.3); margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-trash-can"></i>
                    <span>Kullanıcıyı Sil</span>
                  </button>
                </div>
              `).join(``)}
            </div>
          `}
  `}function S(){return`
    <div class="panel-header">
      <h3 class="panel-title">Ürün Yönetimi</h3>
      <button class="btn-glowing" style="padding: 8px 16px; font-size: 14px;" id="btn-add-product">
        <i class="fas fa-plus"></i> Yeni Ürün Ekle
      </button>
    </div>
    <div class="user-grid">
      ${t.productsList.map(e=>`
        <div class="user-card glass-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 class="user-name" style="margin-bottom: 5px;">${e.title}</h4>
            <div style="color: var(--secondary); font-weight: bold; font-size: 1.2rem; margin-bottom: 10px;">${e.price} TL</div>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px;">${e.description}</p>
          </div>
          <button class="btn-card-action btn-delete-product" data-id="${e.id}" style="background: rgba(231, 76, 60, 0.15); color: var(--danger); border: 1px solid rgba(231, 76, 60, 0.3);">
            <i class="fas fa-trash"></i> Ürünü Sil
          </button>
        </div>
      `).join(``)}
    </div>
  `}function C(){return`
    <div class="panel-header">
      <h3 class="panel-title">Öğrenci Talepleri (${t.requestsList.filter(e=>e.status===`Pending`).length} Bekleyen)</h3>
    </div>
    <div class="user-grid">
      ${t.requestsList.map(e=>`
        <div class="user-card glass-panel">
          <div class="user-card-header">
            <div>
              <h4 class="user-name">${e.studentName}</h4>
              <span class="user-email" style="color: var(--primary); font-weight: bold;">${e.productName}</span>
            </div>
            <span class="status-badge ${e.status===`Pending`?`pending`:e.status===`Approved`?`verified`:e.status===`Rejected`?`rejected`:`verified`}">
              ${e.status===`Pending`?`Onay Bekliyor`:e.status===`Approved`?`Onaylandı (Eşleştirme Bekliyor)`:e.status===`Rejected`?`Reddedildi`:`Teslim Edildi`}
            </span>
          </div>
          <div class="user-card-body">
            <div class="info-row"><i class="fas fa-calendar"></i><span>${s(e.createdAt)}</span></div>
          </div>
          
          ${e.status===`Pending`?`
            <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; display: flex; gap: 10px;">
              <button class="btn-card-action btn-approve-request" data-id="${e.id}" style="background: rgba(46, 204, 113, 0.15); color: var(--success); border: 1px solid rgba(46, 204, 113, 0.3); flex: 1;">
                <i class="fas fa-check"></i> Onayla
              </button>
              <button class="btn-card-action btn-reject-request" data-id="${e.id}" style="background: rgba(231, 76, 60, 0.15); color: var(--danger); border: 1px solid rgba(231, 76, 60, 0.3); flex: 1;">
                <i class="fas fa-times"></i> Reddet
              </button>
            </div>
          `:``}

          ${e.status===`Approved`?`
            <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">Bu talebi karşılamak için bir bağışla eşleştirin:</p>
              ${t.donationsList.filter(t=>t.status===`Completed`&&t.productId===e.productId).length>0?`
                <select class="input-control select-donation-${e.id}" style="margin-bottom: 10px;">
                  <option value="">-- Uygun Bir Bağış Seçin --</option>
                  ${t.donationsList.filter(t=>t.status===`Completed`&&t.productId===e.productId).map(e=>`
                    <option value="${e.id}">${e.amount} TL Bağış (ID: ${e.id.substring(0,8)}...)</option>
                  `).join(``)}
                </select>
                <button class="btn-card-action btn-match-deliver" data-id="${e.id}" style="background: var(--success); color: white; border: none;">
                  <i class="fas fa-check-circle"></i> Eşleştir ve Teslim Et
                </button>
              `:`
                <div style="padding: 10px; border-radius: 8px; background: rgba(241, 196, 15, 0.1); border: 1px solid rgba(241, 196, 15, 0.3); color: #f1c40f; font-size: 0.85rem; text-align: center;">
                  <i class="fas fa-exclamation-triangle"></i> Havuzda bu ürün için uygun bir bağış bulunmuyor. Teslimat için önce bağış yapılması gereklidir.
                </div>
              `}
            </div>
          `:``}
        </div>
      `).join(``)}
    </div>
  `}function w(){return`
    <div class="panel-header">
      <h3 class="panel-title">Yapılan Bağışlar</h3>
    </div>
    <div class="user-grid">
      ${t.donationsList.map(e=>{let n=t.productsList.find(t=>t.id===e.productId);return`
        <div class="user-card glass-panel">
          <div class="user-card-header">
            <div>
              <h4 class="user-name">Bağış: ${n?n.title:`Bilinmeyen Ürün`}</h4>
              <span class="user-email" style="font-size: 1.1rem; font-weight: bold; color: var(--secondary);">${e.amount} TL</span>
            </div>
            <span class="status-badge ${e.status===`Completed`?`verified`:`pending`}">${e.status===`Completed`?`Havuzda Bekliyor`:`Kullanıldı (Teslim Edildi)`}</span>
          </div>
          <div class="user-card-body">
            <div class="info-row"><i class="fas fa-calendar"></i><span>${s(e.createdAt)}</span></div>
            <div class="info-row"><i class="fas fa-user-heart"></i><span>Destekçi ID: ${e.supporterId.substring(0,8)}...</span></div>
          </div>
        </div>
      `}).join(``)}
    </div>
  `}function T(){[`pending`,`students`,`partners`,`products`,`requests`,`donations`].forEach(e=>{let n=document.getElementById(`tab-${e}`);n&&n.addEventListener(`click`,()=>{t.activeTab=e,document.getElementById(`sidebar`)?.classList.remove(`open`),document.getElementById(`mobile-overlay`)?.classList.remove(`open`),y()})});let n=document.getElementById(`search-input`);n&&n.addEventListener(`input`,e=>{t.searchQuery=e.target.value,y();let n=document.getElementById(`search-input`);n&&(n.focus(),n.setSelectionRange(n.value.length,n.value.length))});let r=document.getElementById(`mobile-menu-btn`),i=document.getElementById(`mobile-overlay`),a=document.getElementById(`sidebar`);r&&r.addEventListener(`click`,()=>{a?.classList.toggle(`open`),i?.classList.toggle(`open`)}),i&&i.addEventListener(`click`,()=>{a?.classList.remove(`open`),i?.classList.remove(`open`)});let s=document.getElementById(`btn-logout`);s&&s.addEventListener(`click`,m),document.querySelectorAll(`.btn-review`).forEach(e=>{e.addEventListener(`click`,()=>{let n=e.getAttribute(`data-id`),r=t.usersList.find(e=>e.id===n);r&&(t.selectedUser=r,y())})}),document.querySelectorAll(`.btn-delete-user`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation(),v(e.getAttribute(`data-id`))})});let c=document.getElementById(`modal-close-btn`);c&&c.addEventListener(`click`,()=>{t.selectedUser=null,y()});let l=document.getElementById(`action-approve-btn`);l&&t.selectedUser&&l.addEventListener(`click`,()=>{h(t.selectedUser.id)});let u=document.getElementById(`action-reject-btn`);u&&t.selectedUser&&u.addEventListener(`click`,()=>{g(t.selectedUser.id)});let d=document.getElementById(`action-unverify-btn`);d&&t.selectedUser&&d.addEventListener(`click`,()=>{_(t.selectedUser.id)});let p=document.getElementById(`action-delete-modal-btn`);p&&t.selectedUser&&p.addEventListener(`click`,()=>{v(t.selectedUser.id)});let b=document.getElementById(`btn-open-doc`);b&&t.selectedUser&&b.addEventListener(`click`,async()=>{let n=t.selectedUser.verificationDocumentUrl||``,r=n.toLowerCase();if(r.includes(`.heic`)||r.includes(`.heif`)){o(`HEIF görseli dönüştürülüyor ve açılıyor...`,`info`);try{let e=await fetch(n);if(!e.ok)throw Error(`File download failed`);let t=await e.blob();if(typeof heic2any<`u`){let e=await heic2any({blob:t,toType:`image/jpeg`,quality:.8}),n=Array.isArray(e)?e[0]:e,r=URL.createObjectURL(n);window.open(r,`_blank`)}else throw Error(`heic2any library not loaded`)}catch(e){console.error(`HEIF open error, falling back:`,e),window.open(n,`_blank`)}}else{let n=`${e}/users/${t.selectedUser.id}/view-document`;window.open(n,`_blank`)}});let x=document.getElementById(`btn-download-doc`);x&&t.selectedUser&&x.addEventListener(`click`,()=>{let n=`${e}/users/${t.selectedUser.id}/download-document`;o(`Dosya indiriliyor...`,`info`);let r=document.createElement(`a`);r.href=n,document.body.appendChild(r),r.click(),document.body.removeChild(r)}),document.querySelectorAll(`.btn-match-deliver`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.getAttribute(`data-id`),r=document.querySelector(`.select-donation-${n}`),i=r?r.value:null;if(!i){o(`Lütfen teslimat için bir bağış seçin.`,`error`);return}t.disabled=!0,t.innerHTML=`<i class="fas fa-spinner fa-spin"></i> İşleniyor...`;try{let t=await fetch(`${e}/requests/${n}/deliver`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({donationId:i})}),r=await t.json();if(!t.ok||!r.success)throw Error(r.message||`Teslimat onaylanamadı.`);o(r.message,`success`),f()}catch(e){o(e.message,`error`),t.disabled=!1,t.innerHTML=`<i class="fas fa-check-circle"></i> Eşleştir ve Teslim Et`}})}),document.querySelectorAll(`.btn-approve-request`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.getAttribute(`data-id`);try{let t=await fetch(`${e}/requests/${n}/approve`,{method:`POST`}),r=await t.json();if(!t.ok||!r.success)throw Error(r.message||`Onaylanamadı.`);o(r.message,`success`),f()}catch(e){o(e.message,`error`)}})}),document.querySelectorAll(`.btn-reject-request`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.getAttribute(`data-id`);try{let t=await fetch(`${e}/requests/${n}/reject`,{method:`POST`}),r=await t.json();if(!t.ok||!r.success)throw Error(r.message||`Reddedilemedi.`);o(r.message,`success`),f()}catch(e){o(e.message,`error`)}})}),document.querySelectorAll(`.btn-delete-product`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!confirm(`Bu ürünü silmek istediğinize emin misiniz?`))return;let n=t.getAttribute(`data-id`);try{if(!(await fetch(`${e}/products/${n}`,{method:`DELETE`})).ok)throw Error(`Ürün silinemedi.`);o(`Ürün silindi.`,`success`),f()}catch(e){o(e.message,`error`)}})});let S=document.getElementById(`btn-add-product`);S&&S.addEventListener(`click`,async()=>{let t=prompt(`Ürün Adı:`);if(!t)return;let n=prompt(`Fiyat (TL):`);if(!n)return;let r=parseFloat(n);if(isNaN(r)){o(`Geçersiz fiyat`,`error`);return}let i=prompt(`Açıklama:`);try{if(!(await fetch(`${e}/products`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({title:t,price:r,description:i||``,categoryId:`cat-yemek`,imageUrl:`https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=200&auto=format&fit=crop`})})).ok)throw Error(`Ürün eklenemedi.`);o(`Ürün başarıyla eklendi.`,`success`),f()}catch(e){o(e.message,`error`)}})}t.isAuthenticated?f():y();