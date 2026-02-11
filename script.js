const SUPABASE_URL = 'https://cmekqeoqqjblktmllwjj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZWtxZW9xcWpibGt0bWxsd2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTYwNTIsImV4cCI6MjA4NjMzMjA1Mn0.ospjshYVQHgZ-kv-udiZGm66QncXzLO7_ED_mDccOh8'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isLoggedIn = false;
let allPosts = []; 
const postsPerPage = 5; 
let currentPage = 1;

let mediaRecorder, audioChunks = [], isRecording = false, recordedBlob = null, timerInterval;

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
        const imgTag = p.image_url ? `<img src="${p.image_url}" class="post-image" onclick="openLightbox('${p.image_url}')">` : '';
        
        let audioTag = '';
        if (p.audio_url) {
            audioTag = `
            <div class="audio-wrapper">
                <audio class="hidden-player" id="audio-${p.id}" src="${p.audio_url}" 
                    onloadedmetadata="initAudioTime(${p.id})" 
                    ontimeupdate="updateProgress(${p.id})"></audio>
                <span class="play-btn" id="btn-${p.id}" onclick="toggleAudio(${p.id})">play</span>
                <div class="progress-container" onclick="seekAudio(event, ${p.id})">
                    <div class="progress-track">
                        <div class="progress-fill" id="fill-${p.id}"></div>
                    </div>
                </div>
                <span class="audio-time" id="time-${p.id}">-00:00</span>
            </div>`;
        }

        const contentTag = p.content ? `<div class="post-content">${p.content}</div>` : '';
        const adminButtons = isLoggedIn ? `<span class="admin-actions"><span onclick="openEdit(${p.id})">editar</span><span onclick="deletePost(${p.id})">apagar</span></span>` : '';
        
        container.innerHTML += `
            <article class="post">
                <h2 class="post-title">${p.title}</h2>
                ${imgTag}
                ${audioTag}
                ${contentTag}
                <div class="post-meta">${date} // entry_${p.id} ${adminButtons}</div>
            </article>`;
    });
    renderPagination();
}

// Lightbox Logic Centralizada
function openLightbox(url) {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    img.src = url;
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.body.style.overflow = 'auto'; 
}

// Audio Player Logic
function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    let m = Math.floor(seconds / 60);
    let s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function initAudioTime(id) {
    const audio = document.getElementById(`audio-${id}`);
    const timeDisplay = document.getElementById(`time-${id}`);
    if (audio && audio.duration) {
        timeDisplay.innerText = `-${formatTime(audio.duration)}`;
    }
}

function toggleAudio(id) {
    const audio = document.getElementById(`audio-${id}`);
    const btn = document.getElementById(`btn-${id}`);
    document.querySelectorAll('.hidden-player').forEach(el => { 
        if(el.id !== `audio-${id}`) { 
            el.pause(); 
            const oid = el.id.split('-')[1]; 
            const obtn = document.getElementById(`btn-${oid}`);
            if(obtn) obtn.innerText = 'play'; 
        } 
    });
    if (audio.paused) { audio.play(); btn.innerText = 'pause'; } else { audio.pause(); btn.innerText = 'play'; }
}

function updateProgress(id) {
    const audio = document.getElementById(`audio-${id}`);
    const fill = document.getElementById(`fill-${id}`);
    const timeDisplay = document.getElementById(`time-${id}`);
    if (!audio || !audio.duration) return;
    fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    let remaining = audio.duration - audio.currentTime;
    timeDisplay.innerText = `-${formatTime(remaining)}`;
    if (audio.ended) {
        document.getElementById(`btn-${id}`).innerText = 'play';
        fill.style.width = '0%';
        timeDisplay.innerText = `-${formatTime(audio.duration)}`;
    }
}

function seekAudio(e, id) {
    const audio = document.getElementById(`audio-${id}`);
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    audio.currentTime = (x / width) * audio.duration;
}

// Editor Media Previews
function previewImage(event) {
    const reader = new FileReader();
    reader.onload = () => { 
        document.getElementById('image-preview').src = reader.result; 
        document.getElementById('image-preview-container').style.display = 'block'; 
    };
    if (event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function previewAudioUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('audio-preview-player').src = URL.createObjectURL(file);
        document.getElementById('audio-preview-container').style.display = 'block';
    }
}

async function toggleRecording() {
    const btn = document.getElementById('record-btn'), status = document.getElementById('recording-status'), timer = document.getElementById('recording-timer');
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => { 
                recordedBlob = new Blob(audioChunks, { type: 'audio/webm' }); 
                document.getElementById('audio-preview-player').src = URL.createObjectURL(recordedBlob); 
                document.getElementById('audio-preview-container').style.display = 'block'; 
            };
            mediaRecorder.start();
            isRecording = true; btn.classList.add('active'); status.style.display = 'block';
            let sec = 0; timerInterval = setInterval(() => { sec++; timer.innerText = formatTime(sec); }, 1000);
        } catch (e) { alert("Mic error"); }
    } else {
        mediaRecorder.stop(); mediaRecorder.stream.getTracks().forEach(t => t.stop());
        isRecording = false; btn.classList.remove('active'); status.style.display = 'none'; clearInterval(timerInterval);
    }
}

async function savePost() {
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('post-title-input').value;
    const content = document.getElementById('post-content-input').value;
    const imgFile = document.getElementById('image-input').files[0];
    const audFile = document.getElementById('audio-input').files[0];
    if (!title) return alert("o título é obrigatório.");
    let image_url = null, audio_url = null;
    if (imgFile) {
        const name = `img_${Date.now()}.jpg`;
        const { error } = await _supabase.storage.from('images').upload(name, imgFile);
        if (!error) image_url = _supabase.storage.from('images').getPublicUrl(name).data.publicUrl;
    }
    const finalAud = recordedBlob || audFile;
    if (finalAud) {
        const ext = recordedBlob ? 'webm' : audFile.name.split('.').pop();
        const name = `aud_${Date.now()}.${ext}`;
        const { error } = await _supabase.storage.from('audio').upload(name, finalAud);
        if (!error) audio_url = _supabase.storage.from('audio').getPublicUrl(name).data.publicUrl;
    }
    const postData = { title, content };
    if (image_url) postData.image_url = image_url;
    if (audio_url) postData.audio_url = audio_url;
    if (id) await _supabase.from('posts').update(postData).eq('id', id);
    else await _supabase.from('posts').insert([postData]);
    location.reload();
}

function openEdit(id) {
    const post = allPosts.find(p => p.id === id); if (!post) return;
    showEditor(); 
    document.getElementById('edit-id').value = post.id; 
    document.getElementById('post-title-input').value = post.title; 
    document.getElementById('post-content-input').value = post.content || '';
    if (post.image_url) { 
        document.getElementById('image-preview').src = post.image_url; 
        document.getElementById('image-preview-container').style.display = 'block'; 
    }
    if (post.audio_url) { 
        document.getElementById('audio-preview-player').src = post.audio_url; 
        document.getElementById('audio-preview-container').style.display = 'block'; 
    }
}

function showEditor() {
    document.getElementById('overlay').style.display = 'flex'; document.getElementById('login-form').style.display = 'none'; document.getElementById('editor-form').style.display = 'block';
    document.getElementById('edit-id').value = ''; document.getElementById('post-title-input').value = ''; document.getElementById('post-content-input').value = '';
    document.getElementById('image-input').value = ''; document.getElementById('audio-input').value = ''; 
    document.getElementById('image-preview-container').style.display = 'none'; document.getElementById('audio-preview-container').style.display = 'none'; 
    recordedBlob = null;
}

function renderPagination() {
    const nav = document.getElementById('pagination'), total = Math.ceil(allPosts.length / postsPerPage); nav.innerHTML = '';
    if (total <= 1) return;
    for (let i = 1; i <= total; i++) {
        const s = document.createElement('span'); s.innerText = i; s.className = `page-link ${i === currentPage ? 'active' : ''}`;
        s.onclick = () => { currentPage = i; renderPosts(); window.scrollTo({top:0, behavior:'smooth'}); }; nav.appendChild(s);
    }
}

async function login() { 
    const e = document.getElementById('email').value, p = document.getElementById('password').value;
    const { error } = await _supabase.auth.signInWithPassword({ email: e, password: p });
    if (error) alert("!"); else location.reload();
}
async function logout() { await _supabase.auth.signOut(); location.reload(); }
function showLogin() { document.getElementById('overlay').style.display = 'flex'; document.getElementById('login-form').style.display = 'block'; document.getElementById('editor-form').style.display = 'none'; }
function closeOverlay() { document.getElementById('overlay').style.display = 'none'; }
async function deletePost(id) { if (confirm("?")) { await _supabase.from('posts').delete().eq('id', id); location.reload(); } }