// /public/js/auth.js
import { sb } from './supabase.js';

function goProfile(){ location.href='/views/pages/profile.html'; }
function goLogin(){ location.href='/views/pages/login.html'; }

// Helper: ensure user row exists and has a role
async function ensureUserProfile(user, defaults = {}) {
  if (!user) return;
  const email = user.email;
  const fullname = defaults.fullname || '';
  const role = defaults.role || 'user';
  const { error } = await sb.from('users').upsert({
    id: user.id, email, fullname, role
  });
  if (error) console.warn('ensureUserProfile:', error.message);
}

export async function renderLogin(rootId='authRoot') {
  const root = document.getElementById(rootId);
  root.innerHTML = `
    <section class="card"><div class="body list">
      <h2 class="page-title">Login</h2>
      <input class="input" id="lEmail" type="email" placeholder="Email" required>
      <div class="password-toggle">
        <input class="input" id="lPassword" type="password" placeholder="Password" required>
        <i id="toggleLoginPass" class="fa fa-eye"></i>
      </div>
      <div class="toolbar">
        <button class="btn" id="lBtn"><i class="fa-solid fa-right-to-bracket"></i> Login</button>
      </div>
      <div>
        <span>Don't have an account?</span>
        <a href="/views/pages/register.html">Register</a>
      </div>
      <div>
        <a href="/views/pages/forgot.html">Forgot your password?</a>
      </div>
      <div id="lMsg" class="muted"></div>
    </div></section>
  `;

  const loginPass = document.getElementById('lPassword');
  const toggleLoginPass = document.getElementById('toggleLoginPass');
  if(toggleLoginPass && loginPass){
    toggleLoginPass.addEventListener('click',()=>{
      const type = loginPass.type === 'password' ? 'text' : 'password';
      loginPass.type = type;
      toggleLoginPass.className = type==='password' ? 'fa fa-eye' : 'fa fa-eye-slash';
    });
  }

  document.getElementById('lBtn').addEventListener('click', async () => {
    const email = document.getElementById('lEmail').value.trim();
    const password = loginPass.value;
    const msg = document.getElementById('lMsg');

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { msg.textContent = error.message; return; }

    await ensureUserProfile(data.user);
    msg.textContent = 'Logged in.';
    setTimeout(goProfile, 700);
  });
}

export async function renderRegister(rootId='authRoot') {
  const root = document.getElementById(rootId);
  root.innerHTML = `
    <section class="card"><div class="body list">
      <h2 class="page-title">Create account</h2>
      <input class="input" id="rFullname" placeholder="Full name" required>
      <input class="input" id="rEmail" type="email" placeholder="Email" required>
      <div class="password-toggle">
        <input class="input" id="rPassword" type="password" placeholder="Password" required>
        <i id="toggleRegPass" class="fa fa-eye"></i>
      </div>
      <div class="password-toggle">
        <input class="input" id="rConfirm" type="password" placeholder="Confirm password" required>
        <i id="toggleRegConfirm" class="fa fa-eye"></i>
      </div>
      <div class="toolbar">
        <button class="btn" id="rBtn"><i class="fa-solid fa-user-plus"></i> Register</button>
      </div>
      <div>
        <span>Already have an account?</span>
        <a href="/views/pages/login.html">Login</a>
      </div>
      <div id="rMsg" class="muted"></div>
    </div></section>
  `;

  const regPass = document.getElementById('rPassword');
  const regConfirm = document.getElementById('rConfirm');
  const toggleRegPass = document.getElementById('toggleRegPass');
  const toggleRegConfirm = document.getElementById('toggleRegConfirm');

  if(toggleRegPass && regPass){
    toggleRegPass.addEventListener('click',()=>{
      const type = regPass.type === 'password' ? 'text' : 'password';
      regPass.type = type;
      toggleRegPass.className = type==='password' ? 'fa fa-eye' : 'fa fa-eye-slash';
    });
  }
  if(toggleRegConfirm && regConfirm){
    toggleRegConfirm.addEventListener('click',()=>{
      const type = regConfirm.type === 'password' ? 'text' : 'password';
      regConfirm.type = type;
      toggleRegConfirm.className = type==='password' ? 'fa fa-eye' : 'fa fa-eye-slash';
    });
  }

  document.getElementById('rBtn').addEventListener('click', async () => {
    const fullname = document.getElementById('rFullname').value.trim();
    const email = document.getElementById('rEmail').value.trim();
    const password = regPass.value;
    const confirm = regConfirm.value;
    const msg = document.getElementById('rMsg');

    if(password!==confirm){ msg.textContent='Passwords do not match'; return; }

    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) { msg.textContent = error.message; return; }

    if (data.user) {
      const { error: upErr } = await sb.from('users').upsert({
        id: data.user.id, email, fullname, role: 'user'
      });
      if (upErr) { msg.textContent = upErr.message; return; }
    }

    msg.textContent = 'Registration successful. Verify your email and login.';
    setTimeout(goLogin, 1000);
  });
}

export async function renderForgot(rootId='authRoot') {
  const root = document.getElementById(rootId);
  root.innerHTML = `
    <section class="card"><div class="body list">
      <h2 class="page-title">Reset password</h2>
      <input class="input" id="fEmail" type="email" placeholder="Email" required>
      <div class="toolbar">
        <button class="btn" id="fBtn"><i class="fa-solid fa-key"></i> Send reset link</button>
      </div>
      <div>
        <a href="/views/pages/login.html">Back to login</a>
      </div>
      <div id="fMsg" class="muted"></div>
    </div></section>
  `;

  document.getElementById('fBtn').addEventListener('click', async () => {
    const email = document.getElementById('fEmail').value.trim();
    const msg = document.getElementById('fMsg');

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/views/pages/login.html'
    });
    if (error) { msg.textContent = error.message; return; }
    msg.textContent = 'Reset link sent.';
  });
}

// Attach existing register.html form
export function attachRegisterForm(opts){
  const { formId, fullNameId, emailId, passwordId, confirmId,
          statusId, modalId, onSuccessRedirect } = opts;

  const form = document.getElementById(formId);
  const nameEl = document.getElementById(fullNameId);
  const emailEl = document.getElementById(emailId);
  const passEl = document.getElementById(passwordId);
  const confirmEl = document.getElementById(confirmId);
  const statusMsg = document.getElementById(statusId);
  const modal = document.getElementById(modalId);

  const togglePass = document.getElementById('togglePass');
  const toggleConfirm = document.getElementById('toggleConfirm');
  if(togglePass && passEl){
    togglePass.addEventListener('click',()=>{
      const type = passEl.type === 'password' ? 'text' : 'password';
      passEl.type = type;
      togglePass.className = type==='password' ? 'fa fa-eye' : 'fa fa-eye-slash';
    });
  }
  if(toggleConfirm && confirmEl){
    toggleConfirm.addEventListener('click',()=>{
      const type = confirmEl.type === 'password' ? 'text' : 'password';
      confirmEl.type = type;
      toggleConfirm.className = type==='password' ? 'fa fa-eye' : 'fa fa-eye-slash';
    });
  }

  function setStatus(text, cls='muted'){
    if(!statusMsg) return;
    statusMsg.textContent = text;
    statusMsg.className = cls;
  }
    function isStrongPassword(pw){ return pw.length>=6; }

  if(!form) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = nameEl?.value.trim() || '';
    const email = emailEl?.value.trim() || '';
    const password = passEl?.value.trim() || '';
    const confirm = confirmEl?.value.trim() || '';

    if(!name || !email || !password || !confirm){
      setStatus('Please fill all fields.', 'danger'); return;
    }
    if(!isStrongPassword(password)){
      setStatus('Password must be at least 6 characters.', 'danger'); return;
    }
    if(password!==confirm){
      setStatus('Passwords do not match.', 'danger'); return;
    }

    try {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options:{ data:{ full_name:name } }
      });
      if(error){ setStatus(error.message, 'danger'); return; }

      try {
        await sb.from('users').upsert({
          id: data.user?.id,
          email,
          fullname: name,
          role: 'user',
          status: 'active'
        }, { onConflict: 'id' });
      } catch(upErr){ console.warn('Upsert error:', upErr?.message); }

      setStatus('', 'muted');
      if(modal) modal.style.display='flex';
      setTimeout(()=>{ window.location.href = onSuccessRedirect || '/'; }, 2000);
    } catch(err){
      setStatus('Registration failed. Please try again.', 'danger');
    }
  });
}
