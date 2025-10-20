// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");
const bufferFrom = require("buffer-from");

admin.initializeApp();
const db = admin.firestore();

// --- Konfigurasi Rahasia Supabase ---
// SIMPAN INI DI ENVIRONMENT VARIABLES FIREBASE, BUKAN DI KODE!
// Jalankan perintah ini di terminal Anda:
// firebase functions:config:set supabase.url="https://URL_PROYEK_ANDA.supabase.co"
// firebase functions:config:set supabase.key="KUNCI_SERVICE_ROLE_RAHASIA_ANDA"

const supabaseUrl = functions.config().supabase.url;
const supabaseKey = functions.config().supabase.key;

// Periksa apakah konfigurasi ada
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "FATAL ERROR: Supabase URL/Key tidak diatur di Firebase Functions Config."
  );
  console.log("Jalankan 'firebase functions:config:set supabase.url=...'");
  console.log("Jalankan 'firebase functions:config:set supabase.key=...'");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Cloud Function "updateAvatar" (Jembatan) ---
// Ini adalah HttpsCallable function, artinya aman dan tahu siapa user yg memanggil
exports.updateAvatar = functions.https.onCall(async (data, context) => {
  // 1. Verifikasi Autentikasi: Pastikan user sudah login
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Kamu harus login untuk mengupload."
    );
  }

  const uid = context.auth.uid;
  const { fileData, contentType } = data; // Ambil data base64 dan tipe file

  if (!fileData || !contentType) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Data file tidak lengkap."
    );
  }

  try {
    // 2. Decode file dari base64
    const fileBuffer = bufferFrom(fileData, "base64");
    
    // Tentukan ekstensi file
    const extension = contentType.split("/")[1]; // "image/png" -> "png"
    const fileName = `avatars/${uid}.${extension}`; // Nama file: avatars/UID_USER.jpg

    // 3. Upload ke Supabase Storage
    // Kita gunakan { upsert: true } agar file lama otomatis tertimpa
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars") // Ganti "avatars" dengan nama Bucket Anda
      .upload(fileName, fileBuffer, {
        contentType: contentType,
        upsert: true, 
      });

    if (uploadError) {
      throw new Error(`Supabase upload error: ${uploadError.message}`);
    }

    // 4. Dapatkan URL Publik dari file yang baru di-upload
    const { data: publicUrlData } = supabase.storage
      .from("avatars") // Nama Bucket Anda
      .getPublicUrl(fileName);

    if (!publicUrlData) {
      throw new Error("Gagal mendapatkan public URL dari Supabase.");
    }

    const newAvatarUrl = publicUrlData.publicUrl;

    // 5. Update URL baru ke Firestore
    await db.collection("users").doc(uid).update({
      avatarUrl: newAvatarUrl,
    });

    // 6. Kembalikan URL baru ke klien (browser)
    return {
      success: true,
      avatarUrl: newAvatarUrl,
    };

  } catch (error) {
    console.error("Fungsi updateAvatar gagal:", error);
    throw new functions.https.HttpsError(
      "internal",
      `Gagal memproses upload: ${error.message}`
    );
  }
});
