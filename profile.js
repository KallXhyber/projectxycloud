// profile.js
document.addEventListener("DOMContentLoaded", () => {
    const profileImg = document.getElementById('profile-img');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileForm = document.getElementById('profile-form');
    const logoutBtn = document.getElementById('logout-btn');
    const resetPasswordBtn = document.getElementById('reset-password-btn');
    
    // --- Avatar Upload ---
    const avatarUpload = document.getElementById('avatar-upload');
    const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
    const uploadStatus = document.getElementById('upload-status');
    let selectedFile = null;

    let currentUser = null;

    // 1. Proteksi Halaman: Cek status login
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User login, ambil datanya
            currentUser = user;
            
            // Ambil data DARI FIRESTORE (bukan cuma dari Auth)
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                profileName.value = userData.name;
                profileEmail.value = userData.email;
                profileImg.src = userData.avatarUrl;
            } else {
                // Dokumen tidak ada, mungkin user baru?
                // Kita paksakan buat dokumennya.
                console.warn("Dokumen user tidak ditemukan, membuat data...");
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random&color=fff`;
                await db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    name: user.displayName || "User Baru",
                    email: user.email,
                    avatarUrl: avatarUrl
                });
                window.location.reload();
            }

        } else {
            // User tidak login, lempar ke halaman login
            console.log("Tidak ada user, mengarahkan ke login...");
            window.location.href = 'login.html';
        }
    });

    // 2. Tombol Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'index.html'; // Balik ke beranda
        } catch (error) {
            console.error("Error logging out:", error);
        }
    });

    // 3. Tombol Reset Password
    resetPasswordBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        try {
            await auth.sendPasswordResetEmail(currentUser.email);
            alert("Link reset password telah dikirim ke email Anda.");
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // 4. Update Profil (Nama)
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = profileName.value;
        if (!currentUser || !newName) return;

        try {
            // Update di Firestore
            await db.collection('users').doc(currentUser.uid).update({
                name: newName
            });
            // Update di Firebase Auth
            await currentUser.updateProfile({ displayName: newName });
            alert("Profil berhasil diupdate!");
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // --- Logika Upload Avatar (Hybrid) ---

    // 5. Saat user memilih file
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Tampilkan preview
            const reader = new FileReader();
            reader.onload = (event) => {
                profileImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
            
            selectedFile = file;
            uploadAvatarBtn.style.display = 'block'; // Tampilkan tombol Simpan
            uploadStatus.textContent = '';
        }
    });

    // 6. Saat tombol "Simpan Foto" diklik (INI BAGIAN UTAMANYA)
    uploadAvatarBtn.addEventListener('click', async () => {
        if (!selectedFile || !currentUser) {
            uploadStatus.textContent = "Pilih file dulu.";
            return;
        }

        uploadStatus.textContent = "Mengupload... ☁️";
        uploadAvatarBtn.disabled = true;

        try {
            // Ini adalah pemanggilan "jembatan" Cloud Function kita
            const updateAvatarFunction = functions.httpsCallable('updateAvatar');

            // Kita perlu mengirim file dalam format base64
            const fileReader = new FileReader();
            fileReader.readAsDataURL(selectedFile);

            fileReader.onload = async () => {
                const base64Data = fileReader.result.split(',')[1]; // Ambil data base64-nya saja
                
                // Panggil Cloud Function dengan data file
                const result = await updateAvatarFunction({ 
                    fileData: base64Data,
                    contentType: selectedFile.type
                });
                
                // Cloud Function akan mengembalikan URL Supabase yang baru
                const newAvatarUrl = result.data.avatarUrl;

                // Tampilkan URL baru di gambar profil
                profileImg.src = newAvatarUrl;
                uploadStatus.textContent = "Avatar berhasil diupdate! ✅";
                uploadAvatarBtn.style.display = 'none';
                uploadAvatarBtn.disabled = false;
                selectedFile = null;
            };

            fileReader.onerror = (error) => {
                throw new Error("Gagal membaca file: " + error);
            };

        } catch (error) {
            console.error("Error updating avatar:", error);
            uploadStatus.textContent = `Error: ${error.message}`;
            uploadAvatarBtn.disabled = false;
        }
    });
});