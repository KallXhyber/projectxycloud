// auth.js
document.addEventListener("DOMContentLoaded", () => {
    
    // Cek jika user sudah login, lempar ke profile
    auth.onAuthStateChanged(user => {
        if (user && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
            console.log("Sudah login, mengarahkan ke profile...");
            window.location.href = 'profile.html';
        }
    });

    const errorDiv = document.getElementById('auth-error');
    
    // --- Logika Halaman Register ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';

            try {
                // 1. Buat user di Firebase Auth
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // 2. Buat URL Avatar Otomatis
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

                // 3. Simpan data user ke Firestore (Ini penting!)
                // Kita set dokumen dengan ID = UID user
                await db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    name: name,
                    email: email,
                    avatarUrl: avatarUrl,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // 4. Update nama di Firebase Auth (opsional tapi bagus)
                await user.updateProfile({ displayName: name, photoURL: avatarUrl });
                
                // 5. Arahkan ke halaman profil
                window.location.href = 'profile.html';

            } catch (error) {
                console.error("Error registering:", error);
                errorDiv.textContent = `Error: ${error.message}`;
                errorDiv.style.display = 'block';
            }
        });
    }

    // --- Logika Halaman Login ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            errorDiv.style.display = 'none';
            errorDiv.textContent = '';

            try {
                // 1. Login dengan Firebase Auth
                await auth.signInWithEmailAndPassword(email, password);
                
                // 2. Arahkan ke halaman profil
                window.location.href = 'profile.html';

            } catch (error) {
                console.error("Error logging in:", error);
                errorDiv.textContent = `Error: ${error.message}`;
                errorDiv.style.display = 'block';
            }
        });
    }
});