const SUPABASE_URL = 'https://cmekqeoqqjblktmllwjj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZWtxZW9xcWpibGt0bWxsd2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTYwNTIsImV4cCI6MjA4NjMzMjA1Mn0.ospjshYVQHgZ-kv-udiZGm66QncXzLO7_ED_mDccOh8'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isLoggedIn = false;
let allPosts = []; 
const postsPerPage = 5; 
let currentPage = 1;

// document.getElementById('year').textContent = new Date().getFullYear();
init();

async function init() {
    await checkSession();
    await fetchAllPosts();
}

async function checkSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    isLoggedIn = !!session;
    document.getElementById('admin-link').style.display = isLoggedIn ? 'inline-block' : 'none';
    document.getElementById('top-nav').style.display = isLoggedIn ? 'block' : 'none';
}

async function fetchAllPosts() {
    const { data, error } = await _supabase.from('posts').select('*').order('id', { ascending: false });
    if (error) return;
    allPosts = data;
    renderPosts();
}

function renderPosts() {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const paginatedPosts = allPosts.slice(start, end);

    paginatedPosts.forEach(p => {
        const date = new Date(p.created_at).toLocaleDateString('pt-BR');
        const adminButtons = isLoggedIn ? `
            <span class="admin-actions">
                <span onclick="openEdit(${p.id})">editar</span>
                <span onclick="deletePost(${p.id})">apagar</span>
            </span>` : '';

        container.innerHTML += `
            <article class="post">
                <h2 class="post-title">${p.title}</h2>
                <div class="post-content">${p.content}</div>
                <div class="post-meta">${date} // entry_${p.id} ${adminButtons}</div>
            </article>
        `;
    });

    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPagination() {
    const nav = document.getElementById('pagination');
    const totalPages = Math.ceil(allPosts.length / postsPerPage);
    nav.innerHTML = '';
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const span = document.createElement('span');
        span.innerText = i;
        span.className = `page-link ${i === currentPage ? 'active' : ''}`;
        span.onclick = () => { currentPage = i; renderPosts(); };
        nav.appendChild(span);
    }
}

// Interface
function showLogin() {
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('editor-form').style.display = 'none';
}

function closeOverlay() { document.getElementById('overlay').style.display = 'none'; }

function openEdit(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('editor-form').style.display = 'block';
    document.getElementById('edit-id').value = post.id;
    document.getElementById('post-title-input').value = post.title;
    document.getElementById('post-content-input').value = post.content;
    document.getElementById('editor-title').innerText = 'e p_';
}

function showEditor() {
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('editor-form').style.display = 'block';
    document.getElementById('edit-id').value = '';
    document.getElementById('post-title-input').value = '';
    document.getElementById('post-content-input').value = '';
    document.getElementById('editor-title').innerText = 'w d_';
}

// Auth & Database
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) alert("erro de identificação."); else location.reload();
}

async function logout() { await _supabase.auth.signOut(); location.reload(); }

async function savePost() {
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('post-title-input').value;
    const content = document.getElementById('post-content-input').value;
    if (!title || !content) return;

    if (id) {
        await _supabase.from('posts').update({ title, content }).eq('id', id);
    } else {
        await _supabase.from('posts').insert([{ title, content }]);
    }
    location.reload();
}

async function deletePost(id) {
    if (confirm("apagar permanentemente?")) {
        await _supabase.from('posts').delete().eq('id', id);
        location.reload();
    }
}