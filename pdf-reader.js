import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.mjs";

let pdfDoc = null;
let currentZoom = 1.0; // Base Zoom scale tracking parameter
const viewer = document.getElementById("pdfViewer");
const loader = document.getElementById("loadingScreen");

async function init() {
    try {
        const targetBookUrl = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf";
        
        document.getElementById("readerTitle").textContent = "The 100th Regression";
        pdfDoc = await pdfjsLib.getDocument({ url: targetBookUrl }).promise;
        document.getElementById("totalPages").textContent = pdfDoc.numPages;

        await renderPages();
        loader.style.display = "none";
    } catch (err) {
        console.error(err);
        loader.innerHTML = `<div style='padding:20px;color:white;text-align:center;'><h2>Failed to Load Document</h2><p>${err.message}</p></div>`;
    }
}

async function renderPages() {
    viewer.innerHTML = "";
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        // Base viewport scaling set to constant to avoid repeated asynchronous canvas re-renders
        const viewport = page.getViewport({ scale: 1.5 }); 
        
        const canvas = document.createElement("canvas");
        canvas.className = "pdf-page";
        const ctx = canvas.getContext("2d");
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        viewer.appendChild(canvas);
    }
}

/* --- FIXED WORKING ZOOM FEATURE --- */
function applyZoom() {
    document.getElementById("zoomValue").textContent = Math.round(currentZoom * 100) + "%";
    // Applies dynamic CSS transformation properties to the viewport container smoothly
    viewer.style.transform = `scale(${currentZoom})`;
}

document.getElementById("zoomIn")?.addEventListener("click", () => {
    if (currentZoom >= 2.0) return; // Cap maximum magnification limit to 200%
    currentZoom += 0.1;
    applyZoom();
});

document.getElementById("zoomOut")?.addEventListener("click", () => {
    if (currentZoom <= 0.6) return; // Cap minimum scale limits to 60%
    currentZoom -= 0.1;
    applyZoom();
});

/* --- FIXED LIGHT / DARK WORKING SWITCH --- */
const themeBtn = document.getElementById("themeBtn");
themeBtn?.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-theme");
    // Dynamically swaps icon layers depending on active background states
    const icon = themeBtn.querySelector("i");
    if(isLight) {
        icon.className = "fa-solid fa-sun";
    } else {
        icon.className = "fa-solid fa-moon";
    }
});

document.getElementById("tocBtn")?.addEventListener("click", () => document.getElementById("tocSidebar").classList.toggle("active"));
document.getElementById("closeTOC")?.addEventListener("click", () => document.getElementById("tocSidebar").classList.remove("active"));
document.getElementById("backBtn")?.addEventListener("click", () => history.back());

init();
