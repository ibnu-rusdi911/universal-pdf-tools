# Universal PDF Tools 🛠️📄

A professional-grade, **100% client-side** Browser Extension built to handle your daily PDF manipulations with absolute privacy. No servers, no tracking, no data leaks.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![Svelte](https://img.shields.io/badge/Svelte-v4-FF3E00?logo=svelte)
![Vite](https://img.shields.io/badge/Vite-v5-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-06B6D4?logo=tailwindcss)

---

## 🌟 Key Features

* ✂️ **Split PDF:** Extract specific pages into a brand new document instantly.
* 🥞 **Merge PDF:** Combine multiple PDF files into one unified, clean document.
* 🔄 **Rotate PDF:** Adjust page orientations to any angle with live preview.
* ✍️ **Add Image & Sign:** Insert PNG/JPG images or signatures securely onto your document layout.
* 📉 **Aggressive Compression:** Compress large PDFs down using high-efficiency client-side rasterization to save space without losing critical clarity.
* 🚀 **Instant Full-Tab Launcher:** Clicking the extension icon automatically launches the workspace in a full browser tab for maximum visual comfort.

---

## 🛡️ Security & Privacy First

Unlike traditional online PDF converters that upload your confidential documents to third-party servers, this extension operates under a **Strict Zero-Server Policy**:
* **100% Local Processing:** All heavy-lifting parsing, rendering, and rebuilding of PDFs are executed directly inside your browser using `pdf.js` and `pdf-lib`.
* **Strict Content Security Policy (CSP):** Fully compliant with Chrome Manifest V3. No remote code execution (`script-src 'self'`), protecting you against supply chain injections.
* **Zero Host Permissions:** The extension requires `[]` host permissions, meaning it cannot read, modify, or track your browsing data across any website.

---

## 🧰 Tech Stack

* **Frontend Framework:** Svelte
* **Bundler:** Vite
* **Styling:** TailwindCSS (Glassmorphism UI design)
* **PDF Engines:** `pdf-lib` & `pdfjs-dist` (Mozilla)
* **Icons:** Lucide Icons (Automated mutation rendering)

---

## 🚀 Getting Started (Development)

### 1. Clone & Install
```bash
git clone [https://github.com/yourusername/universal-pdf-tools.git](https://github.com/yourusername/universal-pdf-tools.git)
cd universal-pdf-tools
npm install