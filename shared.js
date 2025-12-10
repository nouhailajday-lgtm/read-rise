import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ===== Firebase Config (Previous Project) =====
const firebaseConfig = {
  apiKey: "AIzaSyC9gHIP6d6B5PIpUoN55QcHAIuyukFdMm8",
  authDomain: "paper-and-echoes.firebaseapp.com",
  projectId: "paper-and-echoes",
  storageBucket: "paper-and-echoes.firebasestorage.app",
  messagingSenderId: "1018331287358",
  appId: "1:1018331287358:web:e28ef33b29e765e007266f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function el(html){ const template = document.createElement('template'); template.innerHTML = html.trim(); return template.content.firstChild; }

// ===== Auth Buttons =====
const authLinks = document.getElementById('auth-links');
if(authLinks){
  const loginBtn = el('<a href="#" id="btn-login">Login</a>');
  const signupBtn = el('<a href="#" id="btn-signup">Sign Up</a>');
  const logoutBtn = el('<a href="#" id="btn-logout" style="display:none">Logout</a>');
  authLinks.appendChild(loginBtn); authLinks.appendChild(signupBtn); authLinks.appendChild(logoutBtn);

  loginBtn.addEventListener('click', e=>{ e.preventDefault(); showAuthModal('login'); });
  signupBtn.addEventListener('click', e=>{ e.preventDefault(); showAuthModal('signup'); });
  logoutBtn.addEventListener('click', async e=>{ e.preventDefault(); await signOut(auth); });

  onAuthStateChanged(auth, user=>{
    if(user){
      loginBtn.style.display='none';
      signupBtn.style.display='none';
      logoutBtn.style.display='inline-block';
    } else {
      loginBtn.style.display='inline-block';
      signupBtn.style.display='inline-block';
      logoutBtn.style.display='none';
    }
  });
}

// ===== Realtime Updates =====
function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function setupRealtime(collectionName, listId, renderFn){
  const q = query(collection(db,collectionName), orderBy('createdAt','desc'));
  const listEl = document.getElementById(listId);
  if(!listEl) return;
  onSnapshot(q, snap=>{
    listEl.innerHTML='';
    snap.forEach(doc=>{
      const data = doc.data();
      listEl.appendChild(renderFn(data));
    });
  });
}

// ===== Example: Reading Club, Study Tips, Mentorship Stories =====
setupRealtime('reading-club','reading-club-list', data=>{
  const time = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : '';
  return el(`<div class="card"><strong>${escapeHtml(data.author||'Anonymous')}</strong>
    <small style="color:#888">${time}</small>
    <p style="margin-top:8px">${escapeHtml(data.text)}</p></div>`);
});

setupRealtime('study-tips','study-tips-list', data=>{
  const time = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : '';
  return el(`<div class="card"><strong>${escapeHtml(data.author||'Anonymous')}</strong>
    <small style="color:#888">${time}</small>
    <p style="margin-top:8px">${escapeHtml(data.text)}</p></div>`);
});

setupRealtime('mentorship-stories','mentorship-list', data=>{
  const time = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : '';
  return el(`<div class="card"><strong>${escapeHtml(data.author||'Anonymous')}</strong>
    <small style="color:#888">${time}</small>
    <p style="margin-top:8px">${escapeHtml(data.text)}</p></div>`);
});

// ===== Add new content =====
function addDocToCollection(formId, collectionName, fields){
  const form = document.getElementById(formId);
  if(!form) return;
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const user = auth.currentUser;
    if(!user){ alert('Please log in first'); return; }
    const data = {};
    for(const key in fields){ data[key] = document.getElementById(fields[key]).value.trim(); }
    data.uid = user.uid;
    data.author = user.email.split('@')[0];
    data.createdAt = serverTimestamp();
    try{
      await addDoc(collection(db,collectionName),data);
      for(const key in fields){ document.getElementById(fields[key]).value=''; }
      alert('Submitted successfully!');
    } catch(err){ alert('Error: '+err.message); }
  });
}

// ===== Example Forms =====
addDocToCollection('add-club-post-form','reading-club',{text:'club-text'});
addDocToCollection('add-study-tip-form','study-tips',{text:'tip-text'});
addDocToCollection('add-mentorship-form','mentorship-stories',{text:'story-text'});

// ===== Auth Modal =====
const authModal = el(`
  <div id="auth-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.4);display:none;align-items:center;justify-content:center;z-index:60">
    <div style="background:white;padding:20px;border-radius:12px;min-width:320px;max-width:92%;box-shadow:0 8px 30px rgba(0,0,0,0.2)">
      <h3 id="auth-title">Login</h3>
      <form id="auth-form">
        <label>Email<input id="auth-email" type="email" required style="width:100%;padding:8px;margin-top:6px;border-radius:8px;border:1px solid #ddd"></label>
        <label>Password<input id="auth-pass" type="password" required style="width:100%;padding:8px;margin-top:6px;border-radius:8px;border:1px solid #ddd"></label>
        <div style="margin-top:12px;text-align:right">
          <button type="button" id="auth-close" style="margin-right:8px;padding:8px 12px;border-radius:8px">Cancel</button>
          <button type="submit" id="auth-submit" class="button">Continue</button>
        </div>
      </form>
    </div>
  </div>
`);
document.body.appendChild(authModal);

function showAuthModal(mode='login'){
  document.getElementById('auth-title').textContent = mode==='login'?'Login':'Create Account';
  authModal.style.display='flex';
  authModal.dataset.mode = mode;
}

document.getElementById('auth-close').addEventListener('click', ()=> authModal.style.display='none');
document.getElementById('auth-modal').addEventListener('click', e=>{ if(e.target.id==='auth-modal') authModal.style.display='none'; });

document.getElementById('auth-form').addEventListener('submit', async e=>{
  e.preventDefault();
  const mode = authModal.dataset.mode||'login';
  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-pass').value;
  try{
    if(mode==='signup'){ await createUserWithEmailAndPassword(auth,email,pass); }
    else{ await signInWithEmailAndPassword(auth,email,pass); }
    authModal.style.display='none';
  } catch(err){ alert('Error: '+err.message); }
});
