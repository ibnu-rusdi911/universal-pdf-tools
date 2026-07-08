<script>
  import { PDFDocument } from 'pdf-lib';
  import { getTranslation } from '../lib/i18n.js';

  export let goBack;
  const t = getTranslation();

  let fileList = []; 
  let isProcessing = false;

  // Handle multiple uploads
  function handleFileChange(event) {
    const inputFiles = Array.from(event.target.files);
    if (!inputFiles || inputFiles.length === 0) return;
    
    // Tambahkan file baru ke array yang sudah ada
    fileList = [...fileList, ...inputFiles];
    
    // Reset nilai input agar file yang sama bisa di-upload lagi jika perlu
    event.target.value = '';
  }

  function removeFile(index) {
    fileList = fileList.filter((_, i) => i !== index);
  }

  function moveUp(index) {
    if (index > 0) {
      const newList = [...fileList];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      fileList = newList;
    }
  }

  function moveDown(index) {
    if (index < fileList.length - 1) {
      const newList = [...fileList];
      [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
      fileList = newList;
    }
  }

  async function handleMerge() {
    if (fileList.length < 2) {
      alert(t.errorMinFiles);
      return;
    }

    isProcessing = true;
    try {
      const mergedPdf = await PDFDocument.create();

      // Loop semua file PDF di list secara berurutan
      for (const file of fileList) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        
        // Dapatkan semua halaman dari PDF saat ini
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        // Tambahkan halaman-halaman tersebut ke PDF hasil gabungan
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Merged_${fileList.length}_Files.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert(t.errorGeneral);
    } finally {
      isProcessing = false;
    }
  }
</script>

<main class="flex-1 flex flex-col h-full fade-in">
  <!-- Header -->
  <div class="mb-8 flex flex-col items-center">
      <button on:click={goBack} class="mb-6 flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors group bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/10 cursor-pointer">
          <i data-lucide="arrow-left" class="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"></i>
          {t.backBtn}
      </button>
      
      <div class="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-4">
          <i data-lucide="layers-3" class="w-8 h-8 text-blue-400"></i>
      </div>
      <h2 class="text-3xl font-bold mb-2 text-white">{t.featMerge}</h2>
      <p class="text-slate-400 text-center">{t.featMergeDesc}</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start max-w-6xl w-full mx-auto pb-12">
      <!-- Kolom Kontrol -->
      <div class="lg:col-span-4 flex flex-col gap-6 sticky top-8">
          <div class="glass-panel rounded-3xl p-6">
              <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
                  <i data-lucide="upload-cloud" class="w-5 h-5 mr-2 text-blue-400"></i> {t.uploadTitle}
              </h3>
              <!-- Input multi-file -->
              <div class="glass-input rounded-2xl p-6 flex flex-col items-center justify-center text-center h-32 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                  <input type="file" accept=".pdf" multiple on:change={handleFileChange} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div class="group-hover:scale-110 transition-transform duration-300 mb-2">
                      <i data-lucide="file-plus-2" class="w-10 h-10 text-slate-400 group-hover:text-blue-400 transition-colors"></i>
                  </div>
                  <p class="text-slate-300 font-medium">{t.addMoreFiles}</p>
              </div>
          </div>

          <div class="glass-panel rounded-3xl p-6">
              <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
                  <i data-lucide="settings-2" class="w-5 h-5 mr-2 text-blue-400"></i> Action
              </h3>
              <div class="space-y-4">
                  <div class="flex justify-between text-sm text-slate-400 mb-2">
                      <span>Total Files:</span>
                      <span class="text-white font-bold">{fileList.length}</span>
                  </div>
                  <button on:click={handleMerge} disabled={isProcessing || fileList.length < 2} class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex justify-center items-center">
                      <i data-lucide="layers" class="w-5 h-5 mr-2"></i>
                      {isProcessing ? t.processing : t.mergeBtn}
                  </button>
              </div>
          </div>
      </div>

      <!-- Kolom Daftar File (Sequence Builder) -->
      <div class="lg:col-span-8 h-full min-h-[500px]">
          <div class="glass-panel rounded-3xl p-6 h-full flex flex-col shadow-2xl relative overflow-hidden">
              <h3 class="text-lg font-semibold mb-4 text-white flex items-center border-b border-white/10 pb-4">
                  <i data-lucide="list-ordered" class="w-5 h-5 mr-2 text-blue-400"></i> Sequence Order
              </h3>
              
              <div class="flex-1 bg-black/20 border border-white/5 rounded-2xl p-4 overflow-y-auto custom-scrollbar relative">
                  {#if fileList.length === 0}
                      <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 fade-in">
                          <i data-lucide="layout-list" class="w-12 h-12 mb-3 opacity-50"></i>
                          <p>{t.emptyList}</p>
                      </div>
                  {:else}
                      <div class="space-y-3 fade-in">
                          {#each fileList as file, index}
                              <div class="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors group">
                                  
                                  <!-- Info File -->
                                  <div class="flex items-center flex-1 overflow-hidden mr-4">
                                      <div class="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mr-3 shrink-0">
                                          {index + 1}
                                      </div>
                                      <i data-lucide="file-text" class="w-5 h-5 text-slate-400 mr-2 shrink-0"></i>
                                      <span class="text-slate-200 truncate font-medium text-sm" title={file.name}>
                                          {file.name}
                                      </span>
                                  </div>

                                  <!-- Tombol Aksi -->
                                  <div class="flex items-center gap-1 shrink-0">
                                      <button on:click={() => moveUp(index)} disabled={index === 0} class="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title={t.moveUp}>
                                          <i data-lucide="chevron-up" class="w-5 h-5"></i>
                                      </button>
                                      <button on:click={() => moveDown(index)} disabled={index === fileList.length - 1} class="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title={t.moveDown}>
                                          <i data-lucide="chevron-down" class="w-5 h-5"></i>
                                      </button>
                                      <div class="w-px h-5 bg-white/10 mx-1"></div>
                                      <button on:click={() => removeFile(index)} class="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors" title={t.remove}>
                                          <i data-lucide="trash-2" class="w-5 h-5"></i>
                                      </button>
                                  </div>

                              </div>
                          {/each}
                      </div>
                  {/if}
              </div>
          </div>
      </div>
  </div>
</main>