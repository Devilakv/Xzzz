/**
 * A&V STUDIO — Progressive Ultra-Fast CBZ Stream Reader Runtime
 * Optimized for instant mobile rendering, background unzipping, and global chapter navigation.
 */

class CBZReaderEngine {
    constructor() {
        this.domStream = document.getElementById("imageStream");
        this.loaderHud = document.getElementById("loaderHud");
        this.mangaTitle = document.getElementById("mangaTitle");
        this.chapterLabel = document.getElementById("chapterLabel");
        this.pageProgress = document.getElementById("pageProgress");
        this.filePicker = document.getElementById("filePicker");
        this.btnBack = document.getElementById("btnBack");
        
        // Navigation buttons components
        this.prevChapBtn = document.getElementById("prevChapBtn");
        this.nextChapBtn = document.getElementById("nextChapBtn");

        this.objectUrls = []; 
        this.currentBookData = null;
    }

    init() {
        this.setupEventListeners();
        this.loadFromUrlOrStorage();
    }

    setupEventListeners() {
        if (this.btnBack) {
            this.btnBack.addEventListener("click", () => {
                window.location.href = "details.html";
            });
        }

        if (this.filePicker) {
            this.filePicker.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.mangaTitle.textContent = file.name.replace(/\.[^/.]+$/, "");
                    this.chapterLabel.textContent = "Local Archive File";
                    
                    // Lock down navigational controls if reading an independent local file instance
                    if (this.prevChapBtn) this.prevChapBtn.disabled = true;
                    if (this.nextChapBtn) this.nextChapBtn.disabled = true;

                    this.processCBZBuffer(file);
                }
            });
        }

        if (this.prevChapBtn) {
            this.prevChapBtn.addEventListener("click", () => this.navigateChapter(-1));
        }
        if (this.nextChapBtn) {
            this.nextChapBtn.addEventListener("click", () => this.navigateChapter(1));
        }

        window.addEventListener("scroll", () => this.updatePageProgressOnScroll(), { passive: true });
    }

    async loadFromUrlOrStorage() {
        const urlParams = new URLSearchParams(window.location.search);
        let cbzUrl = urlParams.get("file");

        try {
            this.currentBookData = JSON.parse(localStorage.getItem("akv-current-book"));
        } catch (e) { console.error("[Cache Load Error]:", e); }

        if (this.currentBookData) {
            this.mangaTitle.textContent = this.currentBookData.title || "Manhwa Stream";
            this.chapterLabel.textContent = this.currentBookData.currentChapter || this.currentBookData.chapter || "Active Chapter";
            if (!cbzUrl) cbzUrl = this.currentBookData.documentUrl || this.currentBookData.url;
            
            this.updateChapterButtonStates();
        }

        if (cbzUrl) {
            if (cbzUrl.includes("github.com") && cbzUrl.includes("/blob/")) {
                cbzUrl = cbzUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
            }
            await this.fetchAndProcessRemoteCBZ(cbzUrl);
        } else {
            this.updateLoaderStatus("fa-folder-open", "No File Loaded", "Tap the folder icon above to load a local .cbz file.");
            if (this.prevChapBtn) this.prevChapBtn.disabled = true;
            if (this.nextChapBtn) this.nextChapBtn.disabled = true;
        }
    }

    updateChapterButtonStates() {
        if (!this.currentBookData) return;

        // Isolate numerical pointers safely from tracked strings
        const currentChapText = this.currentBookData.currentChapter || "Chap 1";
        const currentNum = parseInt(currentChapText.replace(/[^\d]/g, ""), 10) || 1;
        
        const rawTotal = this.currentBookData.totalChapters || this.currentBookData.chapters || "96";
        const totalNum = parseInt(String(rawTotal).replace(/[^\d]/g, ""), 10) || 1;

        // Apply state blocks conditionally to match boundary metrics safely
        if (this.prevChapBtn) this.prevChapBtn.disabled = (currentNum <= 1);
        if (this.nextChapBtn) this.nextChapBtn.disabled = (currentNum >= totalNum);
    }

    async navigateChapter(direction) {
        if (!this.currentBookData) return;

        const currentChapText = this.currentBookData.currentChapter || "Chap 1";
        let currentNum = parseInt(currentChapText.replace(/[^\d]/g, ""), 10) || 1;
        const targetNum = currentNum + direction;

        const rawTotal = this.currentBookData.totalChapters || this.currentBookData.chapters || "96";
        const totalNum = parseInt(String(rawTotal).replace(/[^\d]/g, ""), 10) || 1;

        if (targetNum < 1 || targetNum > totalNum) return;

        // Mutate target state references values smoothly
        this.currentBookData.currentChapter = `Chap ${targetNum}`;

        // Swap target reference string locations against indexing paths matches mapped in JSON arrays
        if (this.currentBookData.chapterLinks && this.currentBookData.chapterLinks[targetNum]) {
            this.currentBookData.documentUrl = this.currentBookData.chapterLinks[targetNum];
        } else {
            this.currentBookData.documentUrl = this.currentBookData.url; 
        }

        // Save progress tracking snapshot instantly to hardware states before refreshing tracking threads
        localStorage.setItem("akv-current-book", JSON.stringify(this.currentBookData));
        window.location.reload();
    }

    async fetchAndProcessRemoteCBZ(url) {
        try {
            this.updateLoaderStatus("fa-spinner fa-spin", "Streaming Chapter...", "Fetching binary matrix stream instantly...");
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);

            const arrayBuffer = await response.arrayBuffer();
            await this.processCBZBuffer(arrayBuffer);

        } catch (error) {
            console.error("[CBZ Engine Error]:", error);
            this.updateLoaderStatus("fa-circle-xmark", "Failed to Load File", error.message || "Could not fetch remote archive file.");
        }
    }

    async processCBZBuffer(bufferOrFile) {
        try {
            // Load Zip Archive via JSZip Engine
            const zip = await JSZip.loadAsync(bufferOrFile);
            const imageEntries = [];

            zip.forEach((relativePath, fileNode) => {
                if (!fileNode.dir && /\.(webp|jpg|jpeg|png|gif|jfif)$/i.test(relativePath)) {
                    imageEntries.push(fileNode);
                }
            });

            imageEntries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

            if (imageEntries.length === 0) {
                throw new Error("No readable image formats found inside the zip container.");
            }

            this.revokeMemoryBlobs();
            
            // Clear loader UI early to show instant action
            this.loaderHud.style.display = "none";
            this.domStream.innerHTML = "";
            this.domStream.style.display = "flex";
            this.pageProgress.textContent = `1 / ${imageEntries.length} Pages`;

            // PERFORMANCE BOOSTER: Split loading into two distinct tiers
            const initialBatchSize = 3; 
            const initialEntries = imageEntries.slice(0, initialBatchSize);
            const remainingEntries = imageEntries.slice(initialBatchSize);

            // Tier 1: Extract and append the first 3 pages immediately so the user can start reading
            for (const entry of initialEntries) {
                const blob = await entry.async("blob");
                const objectUrl = URL.createObjectURL(blob);
                this.objectUrls.push(objectUrl);

                const img = document.createElement("img");
                img.src = objectUrl;
                img.alt = entry.name;
                this.domStream.appendChild(img);
            }

            // Tier 2: Defer unzipping the remaining pages asynchronously in the background
            setTimeout(async () => {
                for (const entry of remainingEntries) {
                    const blob = await entry.async("blob");
                    const objectUrl = URL.createObjectURL(blob);
                    this.objectUrls.push(objectUrl);

                    const img = document.createElement("img");
                    img.src = objectUrl;
                    img.alt = entry.name;
                    img.loading = "lazy"; // Conserves phone GPU memory blocks
                    this.domStream.appendChild(img);
                }
            }, 50);

        } catch (err) {
            console.error("[CBZ Extraction Fault]:", err);
            this.updateLoaderStatus("fa-circle-xmark", "Extraction Error", err.message);
        }
    }

    updatePageProgressOnScroll() {
        const images = this.domStream.querySelectorAll("img");
        if (images.length === 0) return;

        let currentActiveIndex = 1;
        images.forEach((img, index) => {
            const rect = img.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                currentActiveIndex = index + 1;
            }
        });

        this.pageProgress.textContent = `${currentActiveIndex} / ${images.length} Pages`;
    }

    revokeMemoryBlobs() {
        this.objectUrls.forEach(url => URL.revokeObjectURL(url));
        this.objectUrls = [];
    }

    updateLoaderStatus(iconClass, title, subtitle) {
        this.loaderHud.style.display = "block";
        this.domStream.style.display = "none";
        this.loaderHud.innerHTML = `
            <i class="fa-solid ${iconClass} loader-icon"></i>
            <h3>${title}</h3>
            <p>${subtitle}</p>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const readerInstance = new CBZReaderEngine();
    readerInstance.init();
});
