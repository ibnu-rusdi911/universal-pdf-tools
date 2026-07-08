<script>
  import { PDFDocument } from 'pdf-lib';
  import { getTranslation } from '../lib/i18n.js';
  import { tick } from 'svelte';

  export let goBack;
  const t = getTranslation();

  let selectedFile = null;
  let qualityValue = 50; 
  let isProcessing = false;
  let currentProcessingPage = 0;
  let totalPages = 0;
  let originalSize = 0;

  // Rumus estimasi: ukuran asli * faktor kualitas (linear)
  $: estimatedSize = (originalSize * (qualityValue / 100 + 0.1)).toFixed(2);

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    selectedFile = file;
    originalSize = (file.size / 1024 / 1024); // dalam MB
  }

  function resetUpload() {
    selectedFile = null;
    originalSize = 0;
    qualityValue = 50;
  }

  async function handleCompress() {
    if (!selectedFile || isProcessing) return;
    
    isProcessing = true;
    currentProcessingPage = 0;

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfJsDoc = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      totalPages = pdfJsDoc.numPages;
      const newPdf = await PDFDocument.create();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      for (let i = 1; i <= totalPages; i++) {
        currentProcessingPage = i;
        const page = await pdfJsDoc.getPage(i);
        const scale = 0.5 + (qualityValue / 100) * 1.5; 
        const viewport = page.getViewport({ scale: scale });
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        const jpegQuality = Math.max(0.1, qualityValue / 100);
        const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
        const imgResponse = await fetch(dataUrl);
        const imgBuffer = await imgResponse.arrayBuffer();
        const jpgImage = await newPdf.embedJpg(imgBuffer);
        
        const newPage = newPdf.addPage([viewport.width, viewport.height]);
        newPage.drawImage(jpgImage, { x: 0, y: 0, width: viewport.width, height: viewport.height });
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Compressed_${qualityValue}Q_${selectedFile.name}`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
      alert(t.errorGeneral || "Error!");
    } finally {
      isProcessing = false;
      currentProcessingPage = 0;
      await tick(); // <--- INI KUNCI: Memaksa UI Svelte update setelah status false
    }
  }
</script>

<main class="flex-1 flex flex-col h-full fade-in">
  <div class="mb-8 flex flex-col items-center">
      <button on:click={goBack} class="mb-6 flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors group bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/10 cursor-pointer">
          <i data-lucide="arrow-left" class="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"></i>
          {t.backBtn}
      </button>
      
      <div class="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-4">
          <i data-lucide="shrink" class="w-8 h-8 text-blue-400"></i>
      </div>
      <h2 class="text-3xl font-bold mb-2 text-white">{t.featCompress}</h2>
      <p class="text-slate-400 text-center">{t.featCompressDesc}</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start max-w-4xl w-full mx-auto pb-12">
      
      <div class="lg:col-span-12 flex flex-col gap-6">
          
          <!-- Upload Box -->
          <div class="glass-panel rounded-3xl p-6 md:p-10 border border-white/10 relative overflow-hidden transition-all duration-300 {selectedFile ? 'border-blue-500/50 bg-blue-500/5' : ''}">
              <input type="file" accept=".pdf" on:change={handleFileChange} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Click to upload/change PDF" />
              
              <div class="flex flex-col items-center justify-center text-center relative z-0 pointer-events-none min-h-[150px]">
                  {#if !selectedFile}
                      <span><i data-lucide="file-archive" class="w-16 h-16 text-slate-400 mb-4 group-hover:text-blue-400 transition-colors"></i></span>
                      <h3 class="text-xl font-bold text-white mb-2">Drop your PDF here</h3>
                      <p class="text-slate-400 text-sm">or click to browse</p>
                  {:else}
                      <span><i data-lucide="check-circle-2" class="w-16 h-16 text-blue-400 mb-4"></i></span>
                      <h3 class="text-xl font-bold text-white mb-1">{selectedFile.name}</h3>
                      <p class="text-slate-400 text-sm bg-black/20 px-3 py-1 rounded-full mt-2">Original Size: <span class="font-bold text-blue-300">{originalSize.toFixed(2)} MB</span></p>
                  {/if}
              </div>
          </div>

          <!-- Controls Box -->
          <div class="glass-panel rounded-3xl p-6 md:p-10 transition-all duration-300 {selectedFile ? '' : 'opacity-50 pointer-events-none'}">
            <div class="max-w-2xl mx-auto space-y-8">
                <div class="text-center">
                    <h3 class="text-lg font-semibold text-white mb-2">{t.compressionLevel}</h3>
                    <p class="text-slate-400 text-sm">Target size: ~{estimatedSize} MB</p> <!-- ESTIMASI REALTIME -->
                </div>

                <div class="space-y-4">
                    <input type="range" min="10" max="100" step="5" bind:value={qualityValue} class="w-full h-2 bg-slate-700 rounded-full cursor-pointer" />
                    <div class="text-center text-3xl font-bold text-white mt-2">{qualityValue}%</div>
                </div>

                <!-- Action Button -->
                <div class="pt-4">
                    <button on:click={handleCompress} disabled={isProcessing || !selectedFile} class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 cursor-pointer flex justify-center items-center shadow-lg shadow-blue-500/20 text-lg relative overflow-hidden">
                        
                        {#if isProcessing}
                            <!-- Progress Bar Background -->
                            <div class="absolute left-0 top-0 bottom-0 bg-blue-600 transition-all duration-300" style="width: {(currentProcessingPage / totalPages) * 100}%"></div>
                            
                            <span class="relative z-10 flex items-center">
                                <i data-lucide="loader-2" class="w-5 h-5 mr-3 animate-spin"></i>
                                {t.processingPage} {currentProcessingPage}/{totalPages}...
                            </span>
                        {:else}
                            <!-- Tombol Normal -->
                            <span class="relative z-10 flex items-center">
                                <i data-lucide="minimize-2" class="w-5 h-5 mr-3"></i>
                                {t.compressBtn}
                            </span>
                        {/if}
                    </button>
                    
                    {#if selectedFile && !isProcessing}
                    <div class="text-center mt-4">
                        <button on:click={resetUpload} class="text-sm text-red-400 hover:text-red-300 underline cursor-pointer">{t.remove} File</button>
                    </div>
                    {/if}
                </div>
            </div>
          </div>
      </div>
  </div>
</main>