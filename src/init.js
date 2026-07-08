// src/init.js

// 1. Inisialisasi PDF.js Worker
if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

// 2. Inisialisasi Lucide Icon dengan MutationObserver
if (window.lucide) {
    const observer = new MutationObserver((mutations, obs) => {
        // Matikan pantauan sementara untuk menghindari loop
        obs.disconnect(); 
        
        // Render ikon
        window.lucide.createIcons(); 
        
        // Nyalakan lagi pantauannya
        obs.observe(document.body, { childList: true, subtree: true });
    });

    // Jalankan pertama kali
    window.lucide.createIcons();
    // Mulai pantau perubahan DOM
    observer.observe(document.body, { childList: true, subtree: true });
}