<script>
  import Home from './components/Home.svelte';
  import SplitPdf from './components/SplitPdf.svelte';
  import MergePdf from './components/MergePdf.svelte';
  import RotatePdf from './components/RotatePdf.svelte'; // Import komponen baru
  import SignPdf from './components/SignPdf.svelte'; // Tambah ini
  import CompressPdf from './components/CompressPdf.svelte'; // Tambah ini

  let currentView = 'home';
  // Di dalam script tag App.svelte
  function openInFullTab() {
      // Ini API Chrome untuk membuka halaman ekstensi di tab baru
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  }
  import { onMount } from 'svelte';
    let isPopup = false;

    onMount(() => {
        // Jika kita di popup, window.innerWidth biasanya kecil
        // Cara simpel deteksi:
        if (window.innerWidth < 500) {
            isPopup = true;
        }
    });
</script>
{#if isPopup}
    <button on:click={openInFullTab} class="...">
        <i data-lucide="maximize-2"></i>
    </button>
{/if}
<div class="max-w-6xl mx-auto px-4 py-12 relative z-10 flex flex-col min-h-screen">
  {#if currentView === 'home'}
    <Home changeView={(view) => (currentView = view)} />
  {:else if currentView === 'split'}
    <SplitPdf goBack={() => (currentView = 'home')} />
  {:else if currentView === 'merge'}
    <MergePdf goBack={() => (currentView = 'home')} />
  {:else if currentView === 'rotate'} 
    <!-- Tambahkan kondisi routing ini -->
    <RotatePdf goBack={() => (currentView = 'home')} />
  {:else if currentView === 'sign'} 
    <SignPdf goBack={() => (currentView = 'home')} />
  {:else if currentView === 'compress'} 
    <CompressPdf goBack={() => (currentView = 'home')} />
  {/if}
</div>