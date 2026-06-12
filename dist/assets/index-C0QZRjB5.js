(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`https://api.askidagmtid.com/api`,t={isAuthenticated:!!localStorage.getItem(`admin_session`),adminUser:JSON.parse(localStorage.getItem(`admin_user`)||`null`),activeTab:`pending`,usersList:[],productsList:[],requestsList:[],donationsList:[],searchQuery:``,selectedUser:null,isActionLoading:!1,isListLoading:!1},n=document.getElementById(`app`),r=document.createElement(`div`);r.className=`bg-glow-1`;var i=document.createElement(`div`);i.className=`bg-glow-2`,document.body.appendChild(r),document.body.appendChild(i);var a=document.createElement(`div`);a.className=`toast-container`,document.body.appendChild(a);function o(e,t=`success`){let n=document.createElement(`div`);n.className=`toast ${t}`;let r=`fa-check-circle`;t===`error`&&(r=`fa-exclamation-circle`),t===`info`&&(r=`fa-info-circle`),n.innerHTML=`<i class="fas ${r}"></i> <span>${e}</span>`,a.appendChild(n),setTimeout(()=>{n.style.animation=`slideIn 0.3s reverse forwards`,setTimeout(()=>n.remove(),300)},4e3)}function s(e){if(!e)return`-`;try{return new Date(e).toLocaleString(`tr-TR`,{day:`2-digit`,month:`2-digit`,year:`numeric`,hour:`2-digit`,minute:`2-digit`})}catch{return e}}async function c(){if(t.isAuthenticated)try{let n=await fetch(`${e}/users`);if(!n.ok)throw Error(`Kullanıcı listesi alınamadı.`);t.usersList=(await n.json()).filter(e=>e.role!==`Admin`)}catch(e){o(e.message||`Sunucuyla bağlantı kurulamadı.`,`error`)}}async function l(){try{let n=await fetch(`${e}/products`);if(!n.ok)throw Error(`Ürünler alınamadı.`);t.productsList=await n.json()}catch(e){o(e.message,`error`)}}async function u(){try{let n=await fetch(`${e}/requests`);if(!n.ok)throw Error(`Talepler alınamadı.`);t.requestsList=await n.json()}catch(e){o(e.message,`error`)}}async function d(){try{let n=await fetch(`${e}/donations`);if(!n.ok)throw Error(`Bağışlar alınamadı.`);t.donationsList=await n.json()}catch(e){o(e.message,`error`)}}async function f(){t.isAuthenticated&&(t.isListLoading=!0,D(),await Promise.all([c(),l(),u(),d()]),t.isListLoading=!1,D())}async function p(n,r){let i=document.getElementById(`btn-login-submit`);i&&(i.disabled=!0,i.innerHTML=`<i class="fas fa-spinner fa-spin"></i> Giriş Yapılıyor...`);try{let i=await fetch(`${e}/auth/login`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({email:n,password:r,role:`Admin`})}),a=await i.json();if(!i.ok||!a.success)throw Error(a.message||`E-posta veya şifre hatalı.`);let s=a.data;if(!s||s.role!==`Admin`)throw Error(`Yetkisiz erişim. Sadece Yöneticiler giriş yapabilir.`);localStorage.setItem(`admin_session`,`true`),localStorage.setItem(`admin_user`,JSON.stringify(s)),t.isAuthenticated=!0,t.adminUser=s,o(`Giriş başarılı! Yönetim paneline yönlendiriliyorsunuz.`,`success`),f()}catch(e){o(e.message,`error`),i&&(i.disabled=!1,i.innerHTML=`Yönetici Girişi <i class="fas fa-arrow-right"></i>`)}}function m(){localStorage.removeItem(`admin_session`),localStorage.removeItem(`admin_user`),t.isAuthenticated=!1,t.adminUser=null,t.usersList=[],o(`Oturum kapatıldı.`,`info`),D()}async function h(n){t.isActionLoading=!0,D();try{let r=await fetch(`${e}/users/${n}/approve`,{method:`POST`}),i=await r.json();if(!r.ok||!i.success)throw Error(i.message||`Kullanıcı onaylanamadı.`);o(`Kullanıcı başarıyla onaylandı!`,`success`),t.selectedUser=null,c()}catch(e){o(e.message,`error`)}finally{t.isActionLoading=!1,D()}}async function g(n){t.isActionLoading=!0,D();try{let r=await fetch(`${e}/users/${n}/reject`,{method:`POST`}),i=await r.json();if(!r.ok||!i.success)throw Error(i.message||`İşlem gerçekleştirilemedi.`);o(`Öğrenci belgesi reddedildi.`,`info`),t.selectedUser=null,c()}catch(e){o(e.message,`error`)}finally{t.isActionLoading=!1,D()}}async function _(n){t.isActionLoading=!0,D();try{let r=await fetch(`${e}/users/${n}/unverify`,{method:`POST`}),i=await r.json();if(!r.ok||!i.success)throw Error(i.message||`Durum güncellenemedi.`);o(`Kullanıcı doğrulama durumu sıfırlandı (Onaysız yapıldı).`,`info`),t.selectedUser=null,c()}catch(e){o(e.message,`error`)}finally{t.isActionLoading=!1,D()}}async function v(n){if(confirm(`Bu kullanıcıyı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)){t.isActionLoading=!0,D();try{let r=await fetch(`${e}/users/${n}`,{method:`DELETE`}),i=await r.json();if(!r.ok||!i.success)throw Error(i.message||`Kullanıcı silinemedi.`);o(`Kullanıcı başarıyla silindi.`,`success`),t.selectedUser=null,c()}catch(e){o(e.message,`error`)}finally{t.isActionLoading=!1,D()}}}async function y(n){n.preventDefault();let r=document.getElementById(`btn-submit-product`);r&&(r.disabled=!0,r.innerHTML=`<i class="fas fa-spinner fa-spin"></i> Yükleniyor...`);try{let n=new FormData;n.append(`Title`,document.getElementById(`prod-title`).value),n.append(`Description`,document.getElementById(`prod-desc`).value),n.append(`CategoryId`,document.getElementById(`prod-category`).value),n.append(`Price`,document.getElementById(`prod-price`).value),n.append(`Location`,document.getElementById(`prod-location`).value),n.append(`Quantity`,1),n.append(`CreatorId`,t.adminUser?.id||`mock-supporter-id`);let r=document.getElementById(`prod-image`);if(r.files.length>0&&n.append(`Image`,r.files[0]),!(await fetch(`${e}/products`,{method:`POST`,body:n})).ok)throw Error(`Ürün eklenirken bir hata oluştu.`);o(`Ürün başarıyla eklendi!`,`success`),document.getElementById(`add-product-form`).reset(),document.getElementById(`upload-content`).style.display=`flex`,document.getElementById(`prod-image-preview`).style.display=`none`,document.getElementById(`btn-remove-image`).style.display=`none`}catch(e){o(e.message,`error`)}finally{r&&(r.disabled=!1,r.innerHTML=`<i class="fas fa-check"></i> İlanı Yayınla`)}}async function b(n){if(confirm(`Bu ilanı silmek istediğinize emin misiniz?`)){t.isActionLoading=!0,D();try{if(!(await fetch(`${e}/products/${n}`,{method:`DELETE`})).ok)throw Error(`İlan silinemedi.`);o(`İlan başarıyla silindi.`,`success`),f()}catch(e){o(e.message,`error`)}finally{t.isActionLoading=!1,D()}}}async function x(n){t.isActionLoading=!0,D();try{let t=await fetch(`${e}/requests/${n}/approve`,{method:`POST`}),r=await t.json();if(!t.ok||!r.success)throw Error(r.message||`Onaylama başarısız.`);o(`Talep onaylandı.`,`success`),f()}catch(e){o(e.message,`error`)}finally{t.isActionLoading=!1,D()}}async function S(n){t.isActionLoading=!0,D();try{let t=await fetch(`${e}/requests/${n}/reject`,{method:`POST`}),r=await t.json();if(!t.ok||!r.success)throw Error(r.message||`Reddetme başarısız.`);o(`Talep reddedildi.`,`info`),f()}catch(e){o(e.message,`error`)}finally{t.isActionLoading=!1,D()}}function C(){n.innerHTML=`
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
  `,w()}async function w(){try{let[t,n,r]=await Promise.all([fetch(`${e}/products`),fetch(`${e}/donations`),fetch(`${e}/users`)]);if(t.ok){let e=await t.json(),n=document.getElementById(`stat-products`);n&&(n.innerText=e.length+`+`)}if(n.ok){let e=await n.json(),t=document.getElementById(`stat-donations`);t&&(t.innerText=e.length+`+`)}if(r.ok){let e=await r.json(),t=e.filter(e=>e.role===`Student`).length,n=e.filter(e=>e.role===`Supporter`).length,i=e.filter(e=>e.role===`Business`).length,a=document.getElementById(`stat-students`);a&&(a.innerText=t+`+`);let o=document.getElementById(`stat-supporters`);o&&(o.innerText=n+`+`);let s=document.getElementById(`stat-businesses`);s&&(s.innerText=i+`+`)}}catch(e){console.error(`Failed to fetch public stats`,e);let t=document.getElementById(`stat-products`);t&&t.innerText===`...`&&(t.innerText=`100+`);let n=document.getElementById(`stat-donations`);n&&n.innerText===`...`&&(n.innerText=`500+`);let r=document.getElementById(`stat-students`);r&&r.innerText===`...`&&(r.innerText=`2000+`);let i=document.getElementById(`stat-supporters`);i&&i.innerText===`...`&&(i.innerText=`300+`);let a=document.getElementById(`stat-businesses`);a&&a.innerText===`...`&&(a.innerText=`50+`)}}function T(){if(!t.isAuthenticated){n.innerHTML=`
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
    `;let e=document.getElementById(`login-form`);e&&e.addEventListener(`submit`,e=>{e.preventDefault();let t=document.getElementById(`email`).value,n=document.getElementById(`password`).value;p(t,n)});return}let e=t.usersList.filter(e=>e.role===`Student`).length,r=t.usersList.filter(e=>e.role===`Student`&&e.verificationStatus===`Pending`).length,i=t.usersList.filter(e=>e.role===`Business`||e.role===`Supporter`).length,a=t.usersList.filter(e=>{let n=!1;t.activeTab===`pending`?n=e.role===`Student`&&e.verificationStatus===`Pending`:t.activeTab===`students`?n=e.role===`Student`:t.activeTab===`partners`&&(n=e.role===`Business`||e.role===`Supporter`);let r=e.fullName.toLowerCase().includes(t.searchQuery.toLowerCase())||e.email.toLowerCase().includes(t.searchQuery.toLowerCase());return n&&r});if(n.innerHTML=`
    <div class="dashboard-wrapper">
      <!-- Sidebar -->
      <aside class="sidebar">
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
            <i class="fas fa-hand-holding-heart"></i>
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
          <li class="menu-item ${t.activeTab===`add_product`?`active`:``}" id="tab-add-product" style="display:none;">
            <i class="fas fa-plus-circle"></i>
            <span>Ürün / İlan Ekle</span>
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
          ${t.activeTab===`add_product`?`
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
                  <label for="prod-price">PİYASA DEĞERİ (₺)</label>
                  <div class="input-wrapper">
                    <i class="fas fa-lira-sign"></i>
                    <input type="number" id="prod-price" class="input-control" placeholder="0.00" step="0.01" min="0" required>
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
          `:t.activeTab===`products`?`
            <div class="panel-header">
              <h3 class="panel-title">Ürün Yönetimi</h3>
              <button class="btn-glowing" style="padding: 8px 16px; font-size: 14px;" id="btn-add-product">
                <i class="fas fa-plus"></i> Yeni Ürün / İlan Ekle
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
                    <i class="fas fa-trash"></i> İlanı Kaldır
                  </button>
                </div>
              `).join(``)}
              ${t.productsList.length===0?`<p style="color: var(--text-secondary); text-align: center; width: 100%;">Henüz yayınlanan bir ilan bulunmuyor.</p>`:``}
            </div>
          `:t.activeTab===`requests`?`
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
                </div>
              `).join(``)}
              ${t.requestsList.length===0?`<p style="color: var(--text-secondary); text-align: center; width: 100%;">Henüz talep bulunmuyor.</p>`:``}
            </div>
          `:t.activeTab===`donations`?`
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
              ${t.donationsList.length===0?`<p style="color: var(--text-secondary); text-align: center; width: 100%;">Henüz bağış bulunmuyor.</p>`:``}
            </div>
          `:`
            <div class="panel-header">
              <h3 class="panel-title">${t.activeTab===`pending`?`Onay Bekleyen Başvurular`:t.activeTab===`students`?`Tüm Öğrenci Listesi`:`İşletme & Destekçi Ortaklarımız`}</h3>
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="search-input" placeholder="Öğrenci adı veya e-posta..." value="${t.searchQuery}">
              </div>
            </div>
          
          ${t.isListLoading?`
            <div class="empty-state">
              <i class="fas fa-spinner fa-spin" style="font-size: 2.5rem; color: var(--primary)"></i>
              <h3 style="margin-top: 15px">Yükleniyor...</h3>
              <p>Öğrenci verileri sunucudan çekiliyor.</p>
            </div>
          `:a.length===0?`
            <div class="empty-state">
              <i class="fas fa-folder-open"></i>
              <h3>Hiç Sonuç Bulunamadı</h3>
              <p>${t.searchQuery?`Arama kriterlerinize uyan kayıt bulunamadı.`:`Onay bekleyen herhangi bir öğrenci kaydı bulunmuyor.`}</p>
            </div>
          `:`
            <div class="user-grid">
              ${a.map(e=>`
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
          `}
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
  `,E(),t.selectedUser){let e=t.selectedUser.verificationDocumentUrl||``,n=e.toLowerCase();if(!n.includes(`.pdf`)&&e){let t=document.getElementById(`document-preview-img`),r=document.getElementById(`heic-loader`),i=document.getElementById(`preview-error-box`);t&&r&&i&&(n.includes(`.heic`)||n.includes(`.heif`)?(r.style.display=`flex`,t.style.display=`none`,i.style.display=`none`,fetch(e).then(e=>{if(!e.ok)throw Error(`File download failed`);return e.blob()}).then(e=>{if(typeof heic2any<`u`)return heic2any({blob:e,toType:`image/jpeg`,quality:.6});throw Error(`heic2any library not loaded`)}).then(e=>{let n=Array.isArray(e)?e[0]:e;t.src=URL.createObjectURL(n),t.style.display=`block`,r.style.display=`none`}).catch(e=>{console.error(`HEIF conversion error:`,e),r.style.display=`none`,i.style.display=`flex`})):(t.src=e,t.style.display=`block`,t.onerror=()=>{t.style.display=`none`,i.style.display=`flex`}))}}}function E(){let n=document.getElementById(`tab-pending`),r=document.getElementById(`tab-students`),i=document.getElementById(`tab-partners`);n&&n.addEventListener(`click`,()=>{t.activeTab=`pending`,D()}),r&&r.addEventListener(`click`,()=>{t.activeTab=`students`,D()}),i&&i.addEventListener(`click`,()=>{t.activeTab=`partners`,D()});let a=document.getElementById(`tab-products`);a&&a.addEventListener(`click`,()=>{t.activeTab=`products`,D()});let s=document.getElementById(`tab-requests`);s&&s.addEventListener(`click`,()=>{t.activeTab=`requests`,D()});let c=document.getElementById(`tab-donations`);c&&c.addEventListener(`click`,()=>{t.activeTab=`donations`,D()});let l=document.getElementById(`tab-add-product`);l&&l.addEventListener(`click`,()=>{t.activeTab=`add_product`,D()});let u=document.getElementById(`btn-add-product`);u&&u.addEventListener(`click`,()=>{t.activeTab=`add_product`,D()});let d=document.getElementById(`btn-back-to-products`);if(d&&d.addEventListener(`click`,()=>{t.activeTab=`products`,D()}),t.activeTab===`add_product`){let e=document.getElementById(`add-product-form`);e&&e.addEventListener(`submit`,y);let t=document.getElementById(`prod-image-zone`),n=document.getElementById(`prod-image`),r=document.getElementById(`prod-image-preview`),i=document.getElementById(`upload-content`),a=document.getElementById(`btn-remove-image`);t&&n&&(t.addEventListener(`click`,e=>{e.target.id!==`btn-remove-image`&&e.target.closest(`#btn-remove-image`)==null&&n.click()}),n.addEventListener(`change`,()=>{if(n.files&&n.files[0]){let e=new FileReader;e.onload=e=>{r.src=e.target.result,r.style.display=`block`,i.style.display=`none`,a.style.display=`flex`},e.readAsDataURL(n.files[0])}}),a.addEventListener(`click`,e=>{e.stopPropagation(),n.value=``,r.src=``,r.style.display=`none`,i.style.display=`flex`,a.style.display=`none`}))}let f=document.getElementById(`search-input`);f&&f.addEventListener(`input`,e=>{t.searchQuery=e.target.value,D();let n=document.getElementById(`search-input`);n&&(n.focus(),n.setSelectionRange(n.value.length,n.value.length))});let p=document.getElementById(`btn-logout`);p&&p.addEventListener(`click`,m),document.querySelectorAll(`.btn-review`).forEach(e=>{e.addEventListener(`click`,()=>{let n=e.getAttribute(`data-id`),r=t.usersList.find(e=>e.id===n);r&&(t.selectedUser=r,D())})}),document.querySelectorAll(`.btn-delete-product`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation(),b(e.getAttribute(`data-id`))})}),document.querySelectorAll(`.btn-approve-request`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation(),x(e.getAttribute(`data-id`))})}),document.querySelectorAll(`.btn-reject-request`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation(),S(e.getAttribute(`data-id`))})}),document.querySelectorAll(`.btn-delete-user`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation(),v(e.getAttribute(`data-id`))})});let C=document.getElementById(`modal-close-btn`);C&&C.addEventListener(`click`,()=>{t.selectedUser=null,D()});let w=document.getElementById(`action-approve-btn`);w&&t.selectedUser&&w.addEventListener(`click`,()=>{h(t.selectedUser.id)});let T=document.getElementById(`action-reject-btn`);T&&t.selectedUser&&T.addEventListener(`click`,()=>{g(t.selectedUser.id)});let E=document.getElementById(`action-unverify-btn`);E&&t.selectedUser&&E.addEventListener(`click`,()=>{_(t.selectedUser.id)});let O=document.getElementById(`action-delete-modal-btn`);O&&t.selectedUser&&O.addEventListener(`click`,()=>{v(t.selectedUser.id)});let k=document.getElementById(`btn-open-doc`);k&&t.selectedUser&&k.addEventListener(`click`,async()=>{let n=t.selectedUser.verificationDocumentUrl||``,r=n.toLowerCase();if(r.includes(`.heic`)||r.includes(`.heif`)){o(`HEIF görseli dönüştürülüyor ve açılıyor...`,`info`);try{let e=await fetch(n);if(!e.ok)throw Error(`File download failed`);let t=await e.blob();if(typeof heic2any<`u`){let e=await heic2any({blob:t,toType:`image/jpeg`,quality:.8}),n=Array.isArray(e)?e[0]:e,r=URL.createObjectURL(n);window.open(r,`_blank`)}else throw Error(`heic2any library not loaded`)}catch(e){console.error(`HEIF open error, falling back:`,e),window.open(n,`_blank`)}}else{let n=`${e}/users/${t.selectedUser.id}/view-document`;window.open(n,`_blank`)}});let A=document.getElementById(`btn-download-doc`);A&&t.selectedUser&&A.addEventListener(`click`,()=>{let n=`${e}/users/${t.selectedUser.id}/download-document`;o(`Dosya indiriliyor...`,`info`);let r=document.createElement(`a`);r.href=n,document.body.appendChild(r),r.click(),document.body.removeChild(r)})}function D(){(window.location.hash||`#/`)===`#/admin`?T():C()}window.addEventListener(`hashchange`,D),t.isAuthenticated?f():D();