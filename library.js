/**
 * A&V STUDIO — Dynamic Home Grid Engine (Fixed for Xzzz GitHub Updates)
 */

class HomeGridEngine {
    constructor() {
        this.booksGrid = document.getElementById("mainBooksGrid");
        this.books = [];
    }

    init() {
        this.fetchLibraryData();
    }

    async fetchLibraryData() {
        try {
            // FIXED: Pointed directly to your fresh Xzzz repository endpoint
            const response = await fetch("https://raw.githubusercontent.com/Devilakv/Xzzz/main/library.json?t=" + Date.now());
            if (!response.ok) throw new Error("Database rejected connection request.");
            
            this.books = await response.json();
            this.renderGrid(this.books);
        } catch (error) {
            console.error("[Home Grid Engine Fault]:", error);
            if (this.booksGrid) {
                this.booksGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b; font-size: 13px;">
                        <i class="fa-solid fa-triangle-exclamation" style="color: #eab308; font-size: 24px; margin-bottom: 10px; display: block;"></i>
                        Failed to synchronize library data from Xzzz repository.
                    </div>`;
            }
        }
    }

    renderGrid(data) {
        if (!this.booksGrid) return;
        this.booksGrid.innerHTML = "";

        data.forEach(book => {
            const card = document.createElement("div");
            card.className = "book-card";

            const userBookStates = JSON.parse(localStorage.getItem("akv-book-states")) || {};
            const activeStatus = userBookStates[book.id] || book.status || "Reading";
            
            const currentChap = book.currentChapter || book.chapter || "Chap 1";
            const formattedChap = typeof currentChap === "number" ? `Chap ${currentChap}` : currentChap;
            const commentsCount = book.metrics?.comments || 0;
            const likesCount = book.metrics?.likes || 0;
            
            const favorites = JSON.parse(localStorage.getItem("akv-favorites")) || [];
            const isBookmarked = favorites.includes(book.id);

            card.innerHTML = `
                <div class="card-cover-wrap">
                    <img src="${book.cover}" alt="${book.title}" loading="lazy">
                    <span class="card-badge">${book.category || "Manhwa"}</span>
                    ${isBookmarked ? `<div class="bookmark-indicator"><i class="fa-solid fa-bookmark"></i></div>` : ""}
                </div>
                <div class="card-content">
                    <h3>${book.title}</h3>
                    <div class="card-meta-line">
                        <span>${formattedChap}</span>
                        <div class="card-metrics">
                            <span><i class="fa-solid fa-comment"></i>${commentsCount}</span>
                            <span><i class="fa-solid fa-heart"></i>${likesCount}</span>
                        </div>
                    </div>
                </div>
            `;

            card.onclick = () => {
                const bookSnapshot = { ...book, status: activeStatus };
                localStorage.setItem("akv-current-book", JSON.stringify(bookSnapshot));
                window.location.href = "details.html";
            };

            this.booksGrid.appendChild(card);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const homeEngineInstance = new HomeGridEngine();
    homeEngineInstance.init();
});
