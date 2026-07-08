<script>
  export let changeView;

  // Daftar semua fitur
  const tools = [
    { id: 'split', title: 'Split PDF', desc: 'Extract specific pages into a new document.', icon: 'scissors', active: true },
    { id: 'merge', title: 'Merge PDF', desc: 'Combine multiple PDFs into one unified file.', icon: 'layers-3', active: true },
    { id: 'rotate', title: 'Rotate PDF', desc: 'Rotate pages to any angle.', icon: 'rotate-cw', active: true },
    { id: 'sign', title: 'Add Image & Sign', desc: 'Insert PNG/JPG images or signatures securely.', icon: 'image-plus', active: true },
    { id: 'compress', title: 'Compress PDF', desc: 'Reduce file size while keeping quality.', icon: 'shrink', active: true },
    { 
      id: 'support', 
      title: 'Support Me', 
      desc: 'Love the tools? Consider buying me a coffee to keep this project alive.', 
      icon: 'heart', 
      active: true, 
      url: 'https://ko-fi.com/toiletmandev' // Ganti dengan link Ko-fi kamu
    }
  ];

  function handleToolClick(tool) {
    if (!tool.active) return;
    
    if (tool.url) {
      window.open(tool.url, '_blank');
    } else {
      changeView(tool.id);
    }
  }
</script>

<main class="flex-1 flex flex-col justify-center fade-in">
  <header class="text-center mb-16">
      <div class="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-6 shadow-lg">
          <i data-lucide="layout-grid" class="w-8 h-8 text-blue-400"></i>
      </div>
      <h1 class="text-5xl md:text-6xl font-bold mb-4 tracking-tight text-gradient">Universal PDF Tools</h1>
      <p class="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
          Professional grade tools. 100% Client-side. Privacy first.
      </p>
  </header>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
      {#each tools as tool}
        <button 
          on:click={() => handleToolClick(tool)} 
          class="glass-card rounded-3xl p-8 text-left group flex flex-col h-full focus:outline-none {tool.active ? 'cursor-pointer hover:border-blue-500/50' : 'opacity-60 cursor-not-allowed'}"
          disabled={!tool.active}
        >
          <div class="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl {tool.id === 'support' ? 'bg-red-500/10 text-red-400' : (tool.active ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400')} group-hover:scale-110 transition-all duration-300">
              <i data-lucide={tool.icon} class="w-7 h-7"></i>
          </div>
          <h3 class="text-2xl font-semibold mb-2 text-white">{tool.title}</h3>
          <p class="text-slate-400 text-sm leading-relaxed flex-1">{tool.desc}</p>
          
          {#if tool.active}
            <div class="mt-6 flex items-center text-sm font-medium {tool.id === 'support' ? 'text-red-400' : 'text-blue-400'} opacity-0 group-hover:opacity-100 transition-opacity">
                {tool.id === 'support' ? 'Buy Coffee' : 'Open Tool'} <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
            </div>
          {:else}
            <div class="mt-6 inline-block bg-white/5 px-3 py-1 rounded-full text-xs font-medium text-slate-300 border border-white/5">Coming Soon</div>
          {/if}
        </button>
      {/each}
  </div>
</main>