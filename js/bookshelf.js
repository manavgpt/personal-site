import { BOOKS } from './data.js';
import { playBookSlideSound } from './audio.js';
import { openModal } from './ui.js';

export function initBookshelf() {
    const bookshelfRow = document.getElementById('bookshelfRow');
    if (!bookshelfRow) return;

    // All books start tucked inside the shelf
    let activeBookId = null;

    function renderBookshelf() {
        bookshelfRow.innerHTML = BOOKS.map((book) => {
            const isActive = book.id === activeBookId;
            const coverInner = book.coverImg
                ? `<img src="${book.coverImg}" alt="${book.title} cover" class="w-full h-full object-cover" onerror="this.style.display='none'" />`
                : book.coverHtml;

            return `
                <div
                    class="book-slot"
                    role="listitem"
                    tabindex="0"
                    data-book-id="${book.id}"
                    data-active="${isActive}"
                    aria-expanded="${isActive}"
                    aria-label="${book.title} by ${book.author}."
                >
                    <div class="book-shadow" aria-hidden="true"></div>
                    <div class="book-3d">
                        <div class="book-back" style="background-color: ${book.backBg};" aria-hidden="true"></div>
                        <div class="book-pages" aria-hidden="true"></div>
                        <div class="book-spine" style="background-color: ${book.spineBg}; color: ${book.spineInk};">
                            <div class="book-spine-cap" style="background-color: ${book.capBg}; color: ${book.capInk};">
                                ${book.num}
                            </div>
                            <div class="book-spine-title">${book.title}</div>
                            <div class="book-spine-author">${book.author}</div>
                        </div>
                        <div class="book-cover">
                            ${coverInner}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function setActiveBook(bookId) {
        const nextId = bookId || null;
        if (nextId === activeBookId) return;

        playBookSlideSound();
        activeBookId = nextId;

        bookshelfRow.querySelectorAll('.book-slot').forEach((slot) => {
            const isActive = slot.dataset.bookId === activeBookId;
            slot.dataset.active = String(isActive);
            slot.setAttribute('aria-expanded', String(isActive));
        });
    }

    function openBookModal(bookId) {
        const book = BOOKS.find((b) => b.id === bookId);
        if (!book) return;

        openModal({
            kicker: `READING NOTES · #${book.num} · ${book.category.toUpperCase()}`,
            title: `${book.title} — ${book.author}`,
            html: `
                <div class="space-y-5">
                    <blockquote class="p-4 rounded-lg border theme-border theme-surface italic text-[13.5px] leading-relaxed text-[var(--text)]">
                        “${book.quote}”
                    </blockquote>
                    <div>
                        <h4 class="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-2.5">
                            Key Takeaways
                        </h4>
                        <ul class="space-y-2">
                            ${book.takeaways
                    .map(
                        (t) => `
                                <li class="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
                                    <span class="font-mono text-xs mt-0.5 select-none" style="color: var(--accent);">→</span>
                                    <span>${t}</span>
                                </li>
                            `
                    )
                    .join('')}
                        </ul>
                    </div>
                </div>
            `,
        });
    }

    renderBookshelf();

    // Desktop: hover a spine to slide it out, leave the shelf to tuck all books back in
    bookshelfRow.addEventListener('pointerover', (e) => {
        if (e.pointerType !== 'mouse') return;
        const slot = e.target.closest('.book-slot');
        if (slot && slot.dataset.bookId !== activeBookId) {
            setActiveBook(slot.dataset.bookId);
        }
    });

    bookshelfRow.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        setActiveBook(null);
    });

    // Click / Touch: first tap opens spine, second tap opens reading notes modal
    bookshelfRow.addEventListener('click', (e) => {
        const slot = e.target.closest('.book-slot');
        if (!slot) return;
        const id = slot.dataset.bookId;
        if (id !== activeBookId) {
            setActiveBook(id);
        } else {
            openBookModal(id);
        }
    });

    // Touch / Click outside the shelf tucks any open book back in
    document.addEventListener('click', (e) => {
        if (activeBookId && !bookshelfRow.contains(e.target)) {
            setActiveBook(null);
        }
    });

    // Keyboard navigation
    bookshelfRow.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const slot = e.target.closest('.book-slot');
        if (!slot) return;
        e.preventDefault();
        const id = slot.dataset.bookId;
        if (id !== activeBookId) {
            setActiveBook(id);
        } else {
            openBookModal(id);
        }
    });
}
