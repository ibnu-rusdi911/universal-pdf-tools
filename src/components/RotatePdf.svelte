<script>
  import { PDFDocument, degrees } from 'pdf-lib';
  import { getTranslation } from '../lib/i18n.js';

  export let goBack;
  const t = getTranslation();

  let selectedFile = null;
  let pageRangeInput = ""; 
  let rotationAngle = 0; // Default diubah jadi 0 agar saat upload tidak langsung muter
  let previewUrl = null;
  let isPreviewing = false; // State untuk animasi loading preview

  function handleFileChange(event) {
    const inputFiles = event.target.files;
    if (!inputFiles || inputFiles.length === 0) return;
    
    selectedFile = inputFiles[0];
    rotationAngle = 0;
    pageRangeInput = "";
  }

  function resetUpload() {
    selectedFile = null;
    pageRangeInput = "";
    rotationAngle = 0;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }

  function parsePageRange(input) {
    const pages = [];
    const parts = input.split(',');
    parts.forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end; i++) pages.push(i - 1); 
      } else if (part) {
        pages.push(Number(part) - 1);
      }
    });
    return [...new Set(pages)].filter(p => !isNaN(p) && p >= 0);
  }

  // BLOK REAKTIF: Akan otomatis jalan jika selectedFile, pageRangeInput, atau rotationAngle berubah
  let debounceTimer;
  $: if (selectedFile !== null || rotationAngle !== null || pageRangeInput !== null) {
    if (selectedFile) {
      clearTimeout(debounceTimer);
      // Diberi delay 500ms agar tidak spam proses saat user sedang mengetik
      debounceTimer = setTimeout(() => {
        generateLivePreview(selectedFile, pageRangeInput, rotationAngle);
      }, 500);
    }
  }

  // Fungsi untuk memproses PDF dan menampilkan Live Preview
  async function generateLivePreview(file, rangeStr, angle) {
    isPreviewing = true;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();
      
      let pagesToRotate = [];
      if (rangeStr.trim() === "") {
        pagesToRotate = Array.from({ length: totalPages }, (_, i) => i);
      } else {
        pagesToRotate = parsePageRange(rangeStr);
      }

      const validPagesToRotate = pagesToRotate.filter(p => p >= 0 && p < totalPages);
      
      // Hanya putar jika angle tidak 0 dan ada halaman yang valid
      if (validPagesToRotate.length > 0 && angle !== 0) {
        const pages = pdfDoc.getPages();
        validPagesToRotate.forEach(pageIndex => {
          const page = pages[pageIndex];
          const currentRotation = page.getRotation().angle || 0;
          page.setRotation(degrees(currentRotation + angle));
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(blob);
    } catch (error) {
      console.error("Preview error", error);
    } finally {
      isPreviewing = false;
    }
  }

  // Fungsi Download Instan (Karena file sudah diproses di Preview)
  function handleDownload() {
    if (!previewUrl || !selectedFile) return;
    
    const cleanRange = pageRangeInput.trim() === "" ? "All" : pageRangeInput.replace(/[^a-zA-Z0-9]/g, '_'); 
    const newFileName = `Rotated_${cleanRange}_${selectedFile.name}`;

    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = newFileName;
    link.click();
  }
</script>

<main class="flex-1 flex flex-col h-full fade-in">
  <div class="mb-8 flex flex-col items-center">
      <button on:click={goBack} class="mb-6 flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors group bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/10 cursor-pointer">
          <i data-lucide="arrow-left" class="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"></i>
          {t.backBtn}
      </button>
      
      <div class="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-4">
          <i data-lucide="rotate-cw" class="w-8 h-8 text-blue-400"></i>
      </div>
      <h2 class="text-3xl font-bold mb-2 text-white">{t.featRotate}</h2>
      <p class="text-slate-400 text-center">{t.featRotateDesc}</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start max-w-6xl w-full mx-auto pb-12">
      <!-- Kontrol Kiri -->
      <div class="lg:col-span-4 flex flex-col gap-6 sticky top-8">
          <div class="glass-panel rounded-3xl p-6">
              <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
                  <i data-lucide="upload-cloud" class="w-5 h-5 mr-2 text-blue-400"></i> {t.uploadTitle}
              </h3>
              <div class="glass-input rounded-2xl p-6 flex flex-col items-center justify-center text-center h-32 relative overflow-hidden group">
                  {#if !selectedFile}
                      <input type="file" accept=".pdf" on:change={handleFileChange} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <p class="text-slate-300 font-medium">{t.clickUpload}</p>
                  {:else}
                      <span class="text-sm text-white truncate w-full px-2">{selectedFile.name}</span>
                      <button on:click={resetUpload} class="mt-2 text-xs text-red-400 underline cursor-pointer">{t.remove}</button>
                  {/if}
              </div>
          </div>

          <div class="glass-panel rounded-3xl p-6 transition-all duration-300 {selectedFile ? '' : 'opacity-50 pointer-events-none'}">
              <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
                  <i data-lucide="settings-2" class="w-5 h-5 mr-2 text-blue-400"></i> {t.rotateSettings}
              </h3>
              <div class="space-y-5">
                  <div>
                      <!-- svelte-ignore a11y-label-has-associated-control -->
                      <label class="block text-sm font-medium text-slate-300 mb-2">{t.rotatePagesLabel}</label>
                      <!-- Input ini sekarang akan mentrigger preview otomatis saat diketik -->
                      <input 
                          type="text" 
                          placeholder={t.rotatePagesPlaceholder} 
                          bind:value={pageRangeInput}
                          class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600/70"
                      />
                  </div>

                  <div>
                      <label class="block text-sm font-medium text-slate-300 mb-2">{t.rotateDirection}</label>
                      <div class="grid grid-cols-2 gap-2">
                          <button 
                              on:click={() => rotationAngle = 0}
                              class="py-2 px-1 text-xs font-medium rounded-lg border transition-all flex justify-center items-center gap-2 {rotationAngle === 0 ? 'bg-slate-500/30 border-slate-400 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}"
                          >
                              <i data-lucide="power" class="w-4 h-4"></i> Reset (0°)
                          </button>
                          <button 
                              on:click={() => rotationAngle = -90}
                              class="py-2 px-1 text-xs font-medium rounded-lg border transition-all flex justify-center items-center gap-2 {rotationAngle === -90 ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-white/10 text-slate-400 hover:bg-white/5'}"
                          >
                              <i data-lucide="rotate-ccw" class="w-4 h-4"></i> {t.rotateLeft}
                          </button>
                          <button 
                              on:click={() => rotationAngle = 90}
                              class="py-2 px-1 text-xs font-medium rounded-lg border transition-all flex justify-center items-center gap-2 {rotationAngle === 90 ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-white/10 text-slate-400 hover:bg-white/5'}"
                          >
                              <i data-lucide="rotate-cw" class="w-4 h-4"></i> {t.rotateRight}
                          </button>
                          <button 
                              on:click={() => rotationAngle = 180}
                              class="py-2 px-1 text-xs font-medium rounded-lg border transition-all flex justify-center items-center gap-2 {rotationAngle === 180 ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-white/10 text-slate-400 hover:bg-white/5'}"
                          >
                              <i data-lucide="arrow-down-up" class="w-4 h-4"></i> {t.rotateFlip}
                          </button>
                      </div>
                  </div>

                  <button on:click={handleDownload} disabled={!previewUrl} class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex justify-center items-center mt-2">
                      <i data-lucide="download" class="w-5 h-5 mr-2"></i>
                      {t.rotateBtn}
                  </button>
              </div>
          </div>
      </div>

      <!-- Preview Kanan -->
      <div class="lg:col-span-8 h-[600px]">
          <div class="glass-panel rounded-3xl p-6 h-full flex flex-col shadow-2xl relative overflow-hidden">
              <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
                  <i data-lucide="eye" class="w-5 h-5 mr-2 text-blue-400"></i> {t.previewTitle}
              </h3>
              
              <div class="flex-1 bg-black/20 border border-white/5 rounded-2xl overflow-hidden shadow-inner relative">
                  
                  <!-- Overlay Loading saat sedang memproses rotasi -->
                  {#if isPreviewing}
                    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                        <i data-lucide="loader-2" class="w-10 h-10 text-blue-400 animate-spin mb-2"></i>
                        <span class="text-white font-medium text-sm">Applying Rotation...</span>
                    </div>
                  {/if}

                  {#if previewUrl}
                      <iframe 
                          src="{previewUrl}#toolbar=1&navpanes=1&view=FitH" 
                          class="w-full h-full border-none bg-white relative z-10"
                          title="PDF Preview"
                      ></iframe>
                  {:else}
                      <div class="h-full flex items-center justify-center text-slate-400">{t.noPreview}</div>
                  {/if}
              </div>
          </div>
      </div>
  </div>
</main>