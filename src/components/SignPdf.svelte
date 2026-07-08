<script>
  import { PDFDocument } from 'pdf-lib';
  import { getTranslation } from '../lib/i18n.js';
  import { tick } from 'svelte';

  export let goBack;
  const t = getTranslation();

  let selectedPdf = null;
  let selectedImage = null;
  let originalPdfBytes = null;
  let imgBytes = null;
  let imgMimeType = '';
  let imgRatio = 1; // aspect ratio gambar (height / width)

  // PDF.js State
  let pdfDocJs = null;
  let canvasElement;
  let currentPage = 1;
  let totalPages = 1;
  let isRendering = false;

  // Signature State (Penyimpanan per halaman)
  // Format: { 1: { x: 0.1, y: 0.1, w: 0.3, active: true }, 2: {...} }
  // Semua nilai adalah persentase (0 - 1)
  let sigs = {};
  
  // Drag & Drop State
  let containerRef;
  let isDragging = false;
  let isResizing = false;
  let isProcessing = false;

  async function handlePdfChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    selectedPdf = file;
    
    originalPdfBytes = await file.arrayBuffer();
    
    // Load ke PDF.js
    const loadingTask = pdfjsLib.getDocument({ data: originalPdfBytes });
    pdfDocJs = await loadingTask.promise;
    totalPages = pdfDocJs.numPages;
    currentPage = 1;
    sigs = {}; // Reset signatures

    await renderPage(currentPage);
  }

  async function handleImageChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    selectedImage = file;
    imgMimeType = file.type;
    imgBytes = await file.arrayBuffer();

    // Dapatkan aspect ratio gambar
    const blob = new Blob([imgBytes], { type: imgMimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      imgRatio = img.height / img.width;
      // Inisialisasi posisi di tengah halaman saat ini
      if (!sigs[currentPage]) {
        sigs[currentPage] = { x: 0.35, y: 0.4, w: 0.3, active: true };
      } else {
        sigs[currentPage].active = true;
      }
      sigs = { ...sigs }; // trigger reaktivitas
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function renderPage(num) {
    if (!pdfDocJs || !canvasElement) return;
    isRendering = true;
    
    try {
      const page = await pdfDocJs.getPage(num);
      
      const viewport = page.getViewport({ scale: 1.5 });
      canvasElement.width = viewport.width;
      canvasElement.height = viewport.height;
      
      const renderContext = {
        canvasContext: canvasElement.getContext('2d'),
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    } catch (error) {
      console.log("Proses render dibatalkan / direset:", error);
    } finally {
      isRendering = false;
    }
  }

  function changePage(delta) {
    let newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
      currentPage = newPage;
      renderPage(currentPage);
    }
  }

  function applyToAll() {
    if (!sigs[currentPage] || !sigs[currentPage].active) {
      alert("Letakkan tanda tangan di halaman ini terlebih dahulu.");
      return;
    }
    const currentSig = { ...sigs[currentPage] };
    for (let i = 1; i <= totalPages; i++) {
      sigs[i] = { ...currentSig };
    }
    sigs = { ...sigs };
    alert(t.applyToAll + " Berhasil!");
  }

  function resetAll() {
    // 1. Bersihkan File & Memori
    selectedPdf = null;
    selectedImage = null;
    originalPdfBytes = null;
    imgBytes = null;
    imgMimeType = '';
    imgRatio = 1;

    // 2. Bersihkan PDF.js
    pdfDocJs = null;
    currentPage = 1;
    totalPages = 1;
    sigs = {};

    // 3. Bersihkan State UI
    isRendering = false;
    isDragging = false;
    isResizing = false;
    isProcessing = false;
  }

  // --- LOGIKA DRAG & RESIZE ---
  function onMouseDownDrag(e) {
    if (isResizing) return;
    isDragging = true;
  }

  function onMouseDownResize(e) {
    e.stopPropagation();
    isResizing = true;
  }

  function onMouseMove(e) {
    if (!sigs[currentPage] || !sigs[currentPage].active) return;

    const rect = containerRef.getBoundingClientRect();
    // Konversi pergerakan pixel mouse menjadi persentase dari lebar/tinggi container
    const dx = e.movementX / rect.width;
    const dy = e.movementY / rect.height;

    if (isDragging) {
      sigs[currentPage].x = Math.max(0, Math.min(1 - sigs[currentPage].w, sigs[currentPage].x + dx));
      // height persentase bergantung pada width dan rasio container
      const hPercent = (sigs[currentPage].w * rect.width * imgRatio) / rect.height;
      sigs[currentPage].y = Math.max(0, Math.min(1 - hPercent, sigs[currentPage].y + dy));
      sigs = { ...sigs };
    } else if (isResizing) {
      sigs[currentPage].w = Math.max(0.05, Math.min(1 - sigs[currentPage].x, sigs[currentPage].w + dx));
      sigs = { ...sigs };
    }
  }

  function onMouseUp() {
    isDragging = false;
    isResizing = false;
  }

  // --- LOGIKA PDF-LIB (FINALISASI) ---
  async function handleDownload() {
    if (!selectedPdf) return;
    isProcessing = true;

    try {
      // PERBAIKAN 1: Baca ulang file sebagai buffer baru yang segar
      const freshPdfBytes = await selectedPdf.arrayBuffer();
      const pdfDoc = await PDFDocument.load(freshPdfBytes);
      
      let pdfImage;
      if (selectedImage) {
        // PERBAIKAN 2: Baca ulang gambar dan cek MIME type lebih aman
        const freshImgBytes = await selectedImage.arrayBuffer();
        if (selectedImage.type.includes('png')) {
          pdfImage = await pdfDoc.embedPng(freshImgBytes);
        } else {
          pdfImage = await pdfDoc.embedJpg(freshImgBytes);
        }
      }

      const pages = pdfDoc.getPages();

      // Looping semua halaman untuk menempelkan gambar
      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        const sig = sigs[pageNum];
        
        if (sig && sig.active && pdfImage) {
          const page = pages[i];
          const { width: pdfW, height: pdfH } = page.getSize();
          
          // Kalkulasi ukuran & kordinat dari persentase UI ke Point PDF
          const drawW = sig.w * pdfW;
          const drawH = drawW * imgRatio;
          
          const drawX = sig.x * pdfW;
          // Di PDF-lib, sumbu Y (0) ada di BAWAH, sedangkan di HTML sumbu Y (0) ada di ATAS
          const drawY = pdfH - (sig.y * pdfH) - drawH;

          page.drawImage(pdfImage, {
            x: drawX,
            y: drawY,
            width: drawW,
            height: drawH,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Signed_${selectedPdf.name}`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Detail Error pdf-lib:", error);
      alert(t.errorGeneral);
    } finally {
      isProcessing = false;
    }
  }
</script>

<svelte:window on:mouseup={onMouseUp} on:mousemove={onMouseMove} />

<main class="flex-1 flex flex-col h-full fade-in">
  <div class="mb-8 flex flex-col items-center">
      <button on:click={goBack} class="mb-6 flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors group bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/10 cursor-pointer">
          <i data-lucide="arrow-left" class="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"></i>
          {t.backBtn}
      </button>
      
      <div class="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-4">
          <i data-lucide="image-plus" class="w-8 h-8 text-blue-400"></i>
      </div>
      <h2 class="text-3xl font-bold mb-2 text-white">{t.featSign}</h2>
      <p class="text-slate-400 text-center">{t.featSignDesc}</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start max-w-6xl w-full mx-auto pb-12">
      <!-- Kontrol Kiri -->
      <div class="lg:col-span-4 flex flex-col gap-6 sticky top-8">
          <div class="glass-panel rounded-3xl p-6">
              <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
                  <i data-lucide="upload-cloud" class="w-5 h-5 mr-2 text-blue-400"></i> {t.uploadTitle}
              </h3>
              <div class="flex flex-col gap-4">
                  <!-- Upload PDF -->
                  <div class="glass-input rounded-2xl p-4 flex flex-col items-center justify-center text-center h-24 relative overflow-hidden group border transition-colors {selectedPdf ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/30'}">
                      <input type="file" accept=".pdf" on:change={handlePdfChange} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Click to change PDF" />
                      
                      <div class="flex flex-col items-center justify-center w-full relative z-0 pointer-events-none">
                          {#if !selectedPdf}
                              <!-- BUNGKUS ICON DENGAN SPAN -->
                              <span><i data-lucide="file-text" class="w-6 h-6 text-slate-400 mb-1 group-hover:text-blue-400 transition-colors"></i></span>
                              <p class="text-slate-300 text-xs font-medium">Upload PDF</p>
                          {:else}
                              <!-- BUNGKUS ICON DENGAN SPAN -->
                              <span><i data-lucide="check-circle" class="w-6 h-6 text-blue-400 mb-1"></i></span>
                              <span class="text-xs text-white truncate w-full px-4">{selectedPdf.name}</span>
                          {/if}
                      </div>
                  </div>

                  <!-- Upload Image -->
                  <div class="glass-input rounded-2xl p-4 flex flex-col items-center justify-center text-center h-24 relative overflow-hidden group border transition-colors {selectedImage ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-green-500/30'} {!selectedPdf ? 'opacity-50 pointer-events-none' : ''}">
                      <input type="file" accept="image/png, image/jpeg" on:change={handleImageChange} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Click to change Image" />
                      
                      <div class="flex flex-col items-center justify-center w-full relative z-0 pointer-events-none">
                          {#if !selectedImage}
                              <span><i data-lucide="image" class="w-6 h-6 text-slate-400 mb-1 group-hover:text-green-400 transition-colors"></i></span>
                              <p class="text-slate-300 text-xs font-medium">{t.uploadImage}</p>
                          {:else}
                              <span><i data-lucide="check-circle" class="w-6 h-6 text-green-400 mb-1"></i></span>
                              <span class="text-xs text-white truncate w-full px-4">{selectedImage.name}</span>
                          {/if}
                      </div>
                  </div>
                  
                  {#if selectedPdf || selectedImage}
                    <button on:click={resetAll} class="text-xs text-red-400 hover:text-red-300 underline cursor-pointer text-center py-1 transition-colors relative z-20">
                        {t.remove} All
                    </button>
                  {/if}
              </div>
          </div>

          <!-- Aksi (Hanya aktif jika PDF ada) -->
          <div class="glass-panel rounded-3xl p-6 transition-all duration-300 {selectedPdf ? '' : 'opacity-50 pointer-events-none'}">
              <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
                  <i data-lucide="settings-2" class="w-5 h-5 mr-2 text-blue-400"></i> Action
              </h3>
              
              <div class="space-y-4">
                  {#if selectedImage}
                    <button on:click={applyToAll} class="w-full bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-all border border-white/10 flex justify-center items-center cursor-pointer">
                        <i data-lucide="copy-check" class="w-4 h-4 mr-2 text-blue-400"></i>
                        {t.applyToAll || "Apply to All Pages"}
                    </button>
                  {/if}

                  <button on:click={handleDownload} disabled={isProcessing || !selectedPdf} class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex justify-center items-center">
                      <i data-lucide="download" class="w-5 h-5 mr-2"></i>
                      {isProcessing ? t.processing : t.embedBtn}
                  </button>
              </div>
          </div>
      </div>

      <!-- Preview Workspace -->
      <div class="lg:col-span-8">
          <div class="glass-panel rounded-3xl p-6 flex flex-col shadow-2xl relative overflow-hidden bg-slate-900/50">
              
              <!-- Kontrol Navigasi Halaman -->
              <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <h3 class="text-lg font-semibold text-white flex items-center">
                      <i data-lucide="layout-template" class="w-5 h-5 mr-2 text-blue-400"></i> Workspace
                  </h3>
                  
                  {#if selectedPdf}
                    <div class="flex items-center gap-4 bg-black/30 rounded-lg p-1 border border-white/5">
                        <button on:click={() => changePage(-1)} disabled={currentPage === 1 || isRendering} class="px-3 py-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer">
                            <i data-lucide="chevron-left" class="w-5 h-5"></i>
                        </button>
                        <span class="text-sm font-medium text-white min-w-[80px] text-center">
                            {t.pageText} {currentPage} / {totalPages}
                        </span>
                        <button on:click={() => changePage(1)} disabled={currentPage === totalPages || isRendering} class="px-3 py-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer">
                            <i data-lucide="chevron-right" class="w-5 h-5"></i>
                        </button>
                    </div>
                  {/if}
              </div>
              
              <!-- Area Kanvas & Drag -->
              <div class="flex-1 flex justify-center bg-black/20 rounded-xl overflow-auto p-4 custom-scrollbar relative border border-white/5" style="min-height: 500px;">
                  
                  {#if !selectedPdf}
                      <div class="flex flex-col items-center justify-center text-slate-500 my-auto">
                          <i data-lucide="file-signature" class="w-12 h-12 mb-3 opacity-50"></i>
                          <p>{t.noPreview}</p>
                      </div>
                  {:else}
                      <!-- Wrapper Relative untuk menumpuk Canvas dan Image Overlay -->
                      <div 
                          bind:this={containerRef}
                          class="relative inline-block shadow-lg"
                          style="max-width: 100%; height: fit-content;"
                      >
                          <!-- Canvas PDF Background -->
                          <canvas 
                              bind:this={canvasElement} 
                              class="bg-white rounded max-w-full h-auto block transition-opacity {isRendering ? 'opacity-50' : 'opacity-100'}"
                          ></canvas>

                          <!-- Tanda Tangan / Image Overlay yang bisa didrag -->
                          {#if selectedImage && sigs[currentPage] && sigs[currentPage].active && !isRendering}
                              <!-- svelte-ignore a11y-no-static-element-interactions -->
                              <div 
                                  class="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 cursor-move group"
                                  style="
                                    left: {sigs[currentPage].x * 100}%; 
                                    top: {sigs[currentPage].y * 100}%; 
                                    width: {sigs[currentPage].w * 100}%; 
                                    aspect-ratio: {1 / imgRatio};
                                  "
                                  on:mousedown={onMouseDownDrag}
                              >
                                  <div class="w-full h-full flex items-center justify-center text-blue-600/50 font-bold opacity-30 pointer-events-none">
                                      SIGN HERE
                                  </div>
                                  
                                  <!-- Handle Resize (Pojok Kanan Bawah) -->
                                  <div 
                                      class="absolute -right-2 -bottom-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100"
                                      on:mousedown={onMouseDownResize}
                                  ></div>

                                  <!-- Tombol Hapus Sign di halaman ini -->
                                  <button 
                                      class="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
                                      on:mousedown|stopPropagation={() => { sigs[currentPage].active = false; sigs = {...sigs}; }}
                                  >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                  </button>
                              </div>
                          {/if}
                      </div>
                  {/if}
              </div>
          </div>
      </div>
  </div>
</main>

<style>
  /* Mencegah teks ter-highlight saat kita mendrag gambar */
  .cursor-move {
    user-select: none;
    -webkit-user-select: none;
  }
</style>