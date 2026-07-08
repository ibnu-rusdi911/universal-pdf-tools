<script>
  import { PDFDocument } from 'pdf-lib';
  import { getTranslation } from '../lib/i18n.js'; // Memanggil file bahasa

  export let goBack;
  const t = getTranslation(); // Inisialisasi kamus

  let selectedFile = null;
  let pageRangeInput = ""; 
  let isProcessing = false;

  function handleFileChange(event) {
    const inputFiles = event.target.files;
    if (!inputFiles || inputFiles.length === 0) return;
    selectedFile = inputFiles[0];
  }

  function resetUpload() {
    selectedFile = null;
    pageRangeInput = "";
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

  async function handleSplit() {
    if (!selectedFile) return;
    const pagesToExtract = parsePageRange(pageRangeInput);
    
    if (pagesToExtract.length === 0) {
      alert(t.errorInvalidRange); // Menggunakan bahasa dari i18n
      return;
    }

    isProcessing = true;
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const copiedPages = await newPdf.copyPages(originalPdf, pagesToExtract);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const cleanRange = pageRangeInput.replace(/[^a-zA-Z0-9]/g, '_'); 
      const newFileName = `Split_${cleanRange}_${selectedFile.name}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = newFileName;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert(t.errorGeneral); // Menggunakan bahasa dari i18n
    } finally {
      isProcessing = false;
    }
  }
</script>

<main class="flex-1 flex flex-col h-full fade-in">
  <div class="mb-8 flex flex-col items-center">
      <button on:click={goBack} class="mb-6 flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors group bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/10">
          <i data-lucide="arrow-left" class="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"></i>
          {t.backBtn}
      </button>
      
      <div class="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-4">
          <i data-lucide="scissors" class="w-8 h-8 text-blue-400"></i>
      </div>
      <h2 class="text-3xl font-bold mb-2 text-white">{t.featSplit}</h2>
      <p class="text-slate-400 text-center">{t.featSplitDesc}</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start max-w-6xl w-full mx-auto pb-12">
      <!-- Kontrol -->
      <div class="lg:col-span-4 flex flex-col gap-6">
          <div class="glass-panel rounded-3xl p-6">
              <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
                  <i data-lucide="upload-cloud" class="w-5 h-5 mr-2 text-blue-400"></i> {t.uploadTitle}
              </h3>
              <div class="glass-input rounded-2xl p-6 flex flex-col items-center justify-center text-center h-32 relative overflow-hidden group">
                  {#if !selectedFile}
                      <input type="file" accept=".pdf" on:change={handleFileChange} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <p class="text-slate-300 font-medium">{t.clickUpload}</p>
                  {:else}
                      <span class="text-sm text-white truncate w-full">{selectedFile.name}</span>
                      <button on:click={resetUpload} class="mt-2 text-xs text-red-400 underline cursor-pointer">{t.remove}</button>
                  {/if}
              </div>
          </div>

          <div class="glass-panel rounded-3xl p-6">
              <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
                  <i data-lucide="settings-2" class="w-5 h-5 mr-2 text-blue-400"></i> {t.settings}
              </h3>
              <div class="space-y-4">
                  <!-- svelte-ignore a11y-label-has-associated-control -->
                  <label class="block text-sm font-medium text-slate-300" for="range-input">{t.pageRange}</label>
                  <input 
                      id="range-input"
                      type="text" 
                      placeholder={t.pageRangePlaceholder} 
                      bind:value={pageRangeInput}
                      class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <button on:click={handleSplit} disabled={isProcessing || !selectedFile} class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer">
                      {isProcessing ? t.processing : t.processBtn}
                  </button>
              </div>
          </div>
      </div>

      <!-- Preview -->
      <div class="lg:col-span-8 h-[600px]">
          <div class="glass-panel rounded-3xl p-6 h-full flex flex-col shadow-2xl relative overflow-hidden">
              <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
                  <i data-lucide="eye" class="w-5 h-5 mr-2 text-blue-400"></i> {t.previewTitle}
              </h3>
              <!-- PERUBAHAN UI: bg-white diganti jadi bg-black/20 agar dark mode -->
              <div class="flex-1 bg-black/20 border border-white/5 rounded-2xl overflow-hidden shadow-inner relative">
                  {#if selectedFile}
                      <!-- Iframe diberi bg-white murni agar teks PDF tetap kontras & terbaca -->
                      <iframe 
                          src="{URL.createObjectURL(selectedFile)}#toolbar=1&navpanes=1&view=FitH" 
                          class="w-full h-full border-none bg-white"
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