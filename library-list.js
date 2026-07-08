/*========================================================================
 A&V STUDIO — Dynamic Synchronization & Layout List Rendering Engine
========================================================================*/

let books = [];

const libraryBody = document.getElementById("libraryBody");
const searchBox = document.getElementById("librarySearch");
const categoryBox = document.getElementById("libraryCategory");
const sortBox = document.getElementById("librarySort");

function getFavorites() {
    return JSON.parse(localStorage.getItem("akv-favorites")) || [];
}

async function loadLibrary() {
    try {
        const response = await fetch("https://raw.githubusercontent.com/Devilakv/Xzzz/refs/heads/main/library.json?t=" + Date.now());

        if (!response.ok) throw new Error("Database rejected connection request: " + response.status);
        
        books = await response.json();
        renderLibrary(books);
    } catch (err) {
        console.error("Failed to parse library data context:", err);
        if (libraryBody) {
            libraryBody.innerHTML = `
                <div class="empty-msg">
                    <i class="fa-solid fa-triangle-exclamation"></i> 
                    Could not synchronize library listings from GitHub database repository.
                </div>`;
        }
    }
}

function renderLibrary(data) {
    if (!libraryBody) return;
    libraryBody.innerHTML = "";
    
    const favorites = getFavorites();
    const userBookStates = JSON.parse(localStorage.getItem("akv-book-states")) || {};
    let renderedCount = 0;

    data.forEach(book => {
        const isFav = favorites.includes(book.id);
        
        if (!isFav) return;
        renderedCount++;

        const activeStatus = userBookStates[book.id] || book.status || "Reading";

        const row = document.createElement("div");
        row.className = "library-row";

        const current = book.currentChapter || book.chapter || 169;
        const total = book.totalChapters || 2334;
        
        const pubStatus = book.publicationStatus || "Completed";
        const pubIcon = pubStatus.toLowerCase().includes("completed") ? "📘" : "📖";

        const customStatusClass = String(activeStatus).toLowerCase().replace(/\s+/g, '-');

        row.innerHTML = `
            <div class="col-title flex-align">
                <div class="library-cover">
                    <img src="${book.cover}" alt="${book.title}" style="width: 46px; height: 46px; object-fit: cover; border-radius: 8px;">
                </div>
                <div class="library-details">
                    <h3>${book.title}</h3>
                    <p>${book.author || "Gu Zhen Ren"} <span class="tag-cat">${book.category || "Action"}</span></p>
                </div>
            </div>

            <div class="col-continue">
                <button class="read-btn progress-pill">
                    <span class="txt-green">${current}</span> / ${total}
                </button>
            </div>

            <div class="col-rating">
                <span class="rating-badge">${book.rating || "9.8"} <i class="fa-solid fa-chevron-down score-arrow"></i></span>
            </div>

            <div class="col-status">
                <span class="status-pill status-${customStatusClass}">
                    ${activeStatus}
                </span>
            </div>

            <div class="col-pub">
                <span class="pub-text">${pubIcon} ${pubStatus}</span>
            </div>

            <div class="col-meta">
                <span class="meta-item">${book.lastRead || "1m"}</span>
                <span class="meta-item">${book.updated || "2h"}</span>
                <span class="meta-item">${book.added || "6mo"}</span>
            </div>

            <div class="col-action">
                <button class="fav-btn-action">❤️</button>
            </div>
        `;

        const triggerRedirect = () => {
            const updatedBookSnapshot = { ...book, status: activeStatus };
            localStorage.setItem("akv-current-book", JSON.stringify(updatedBookSnapshot));
            window.location.href = "details.html";
        };

        row.querySelector(".library-cover").onclick = triggerRedirect;
        row.querySelector(".read-btn").onclick = triggerRedirect;

        row.querySelector(".fav-btn-action").onclick = (e) => {
            e.stopPropagation();
            let favs = getFavorites();
            favs = favs.filter(id => id !== book.id);
            localStorage.setItem("akv-favorites", JSON.stringify(favs));
            renderLibrary(data); 
        };

        libraryBody.appendChild(row);
    });

    if (renderedCount === 0) {
        libraryBody.innerHTML = `
            <div class="empty-msg">
                <i class="fa-solid fa-bookmark" style="display: block; font-size: 24px; margin-bottom: 10px; color: #475569;"></i> 
                No saved titles in your library list yet.
            </div>`;
    }
}

function filterLibrary() {
    const keyword = (searchBox?.value || "").toLowerCase();
    const category = categoryBox?.value || "All";
    
    let filtered = books.filter(book => {
        const titleMatch = (book.title || "").toLowerCase().includes(keyword);
        const catMatch = category === "All" || book.category === category;
        return titleMatch && catMatch;
    });

    if (sortBox?.value === "A-Z") filtered.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBox?.value === "Z-A") filtered.sort((a, b) => b.title.localeCompare(a.title));
    
    renderLibrary(filtered);
}

if (searchBox) searchBox.oninput = filterLibrary;
if (categoryBox) categoryBox.onchange = filterLibrary;
if (sortBox) sortBox.onchange = filterLibrary;

document.addEventListener("DOMContentLoaded", loadLibrary);
