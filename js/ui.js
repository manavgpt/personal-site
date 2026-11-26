import { PROJECTS } from './data.js';
import { toggleTheme } from './theme.js';
import { playStarshipTakeoffAudio } from './audio.js';

let toastTimeout = null;

export function showToast(message) {
    const toastEl = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    if (!toastEl || !toastText) return;

    clearTimeout(toastTimeout);
    toastText.textContent = message;
    toastEl.classList.remove('opacity-0', 'translate-y-2');
    toastEl.classList.add('opacity-100', 'translate-y-0');

    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('opacity-100', 'translate-y-0');
        toastEl.classList.add('opacity-0', 'translate-y-2');
    }, 2400);
}

export function openModal({ kicker, title, html, footerNote }) {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalPanel = document.getElementById('modalPanel');
    const modalKicker = document.getElementById('modalKicker');
    const modalHeading = document.getElementById('modalHeading');
    const modalContent = document.getElementById('modalContent');
    const modalFooterNote = document.getElementById('modalFooterNote');

    if (!modalOverlay || !modalPanel) return;
    if (modalKicker) modalKicker.textContent = kicker;
    if (modalHeading) modalHeading.textContent = title;
    if (modalContent) modalContent.innerHTML = html;
    if (modalFooterNote) modalFooterNote.textContent = footerNote || 'manav.here';

    modalOverlay.classList.remove('hidden');
    modalOverlay.classList.add('flex');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        modalOverlay.classList.remove('opacity-0');
        modalPanel.classList.remove('scale-95', 'opacity-0');
        modalPanel.classList.add('scale-100', 'opacity-100');
    });
}

export function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalPanel = document.getElementById('modalPanel');
    if (!modalOverlay || !modalPanel) return;

    modalOverlay.classList.add('opacity-0');
    modalPanel.classList.remove('scale-100', 'opacity-100');
    modalPanel.classList.add('scale-95', 'opacity-0');
    document.body.style.overflow = '';

    setTimeout(() => {
        modalOverlay.classList.add('hidden');
        modalOverlay.classList.remove('flex');
    }, 200);
}

export function initModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalDoneBtn = document.getElementById('modalDoneBtn');

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalDoneBtn) modalDoneBtn.addEventListener('click', closeModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay && !modalOverlay.classList.contains('hidden')) {
            closeModal();
        }
    });

    document.addEventListener('click', (e) => {
        const mockEl = e.target.closest('[data-mock-action]');
        if (!mockEl) return;
        e.preventDefault();
        showToast(mockEl.dataset.mockAction);
    });
}

export function initResumeAndCopy() {
    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            openModal({
                kicker: 'DOCUMENT PREVIEW · UPDATED NOV 2026',
                title: 'Manav Chaudhari',
                footerNote: 'Manav_Chaudhari_Resume.pdf · 1 page',
                html: `
                    <div class="p-4 rounded-lg border theme-border theme-surface space-y-3 text-[13px]">
                        <div class="flex items-center justify-between flex-wrap gap-2 pb-2 border-b theme-border">
                            <span class="font-semibold text-[var(--text)]">B.S. Computer Science (Systems Track)</span>
                            <span class="font-mono text-[11px] text-[var(--muted)]">GPA 3.92 / 4.00</span>
                        </div>
                        <p><strong class="text-[var(--text)]">Core Focus:</strong> Distributed Systems, Backend Architecture, AI Retrieval Pipelines, Web Performance.</p>
                        <p><strong class="text-[var(--text)]">Recent Roles:</strong> Core Systems SWE @ Linearity Cloud · Full-Stack Intern @ Verve Analytics.</p>
                        <p><strong class="text-[var(--text)]">Highlights:</strong> Built PulseDB (64k events/sec Go log engine) &amp; Vektor (1.4k+ star Rust semantic code search).</p>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" data-mock-action="Downloading Manav_Chaudhari_Resume.pdf" class="px-3.5 py-2 rounded-lg font-mono text-xs cursor-pointer transition-opacity hover:opacity-90" style="background-color: var(--text); color: var(--bg);">
                            Download PDF ↓
                        </button>
                    </div>
                `,
            });
        });
    }

    const copyEmailBtn = document.getElementById('copyEmailBtn');
    if (copyEmailBtn) {
        const copyIconSvg = copyEmailBtn.innerHTML;
        const checkIconSvg = `
            <svg class="w-3.5 h-3.5" style="color: var(--accent);" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        let copyResetTimer = null;

        copyEmailBtn.addEventListener('click', () => {
            const markCopied = () => {
                clearTimeout(copyResetTimer);
                copyEmailBtn.innerHTML = checkIconSvg;
                copyEmailBtn.setAttribute('aria-label', 'Email copied');
                copyResetTimer = setTimeout(() => {
                    copyEmailBtn.innerHTML = copyIconSvg;
                    copyEmailBtn.setAttribute('aria-label', 'Copy email address');
                }, 1800);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText('hello@manav.here').then(markCopied).catch(markCopied);
            } else {
                markCopied();
            }
        });
    }
}

/* ---------------------------------------------------------------------
 * 13. INTERSECTION OBSERVERS: SCROLL-REVEAL & DESKTOP SCROLL-SPY RAIL
 * ------------------------------------------------------------------- */
export function initObservers() {
    const revealEls = document.querySelectorAll('.reveal');

    if (typeof IntersectionObserver === 'function') {
        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
        );

        revealEls.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.95) {
                el.classList.add('is-visible');
            } else {
                revealObserver.observe(el);
            }
        });
    } else {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    const sections = ['hero', 'projects', 'experience', 'stack', 'notes', 'reads', 'connect'];
    const spyLinks = document.querySelectorAll('.spy-link');
    const mobileSpyWrap = document.getElementById('mobileSpyWrap');
    const mobileSpyBtn = document.getElementById('mobileSpyBtn');
    const mobileSpyMenu = document.getElementById('mobileSpyMenu');
    const mobileSpyLabel = document.getElementById('mobileSpyLabel');
    const mobileSpyChevron = document.getElementById('mobileSpyChevron');
    const mobileSpyLinks = document.querySelectorAll('.mobile-spy-link');

    const SECTION_LABELS = {
        hero: '00 / Intro',
        projects: '01 / Projects',
        experience: '02 / Experience',
        stack: '03 / Stack',
        notes: '04 / Notes',
        reads: '05 / Reads',
        connect: '06 / Connect',
    };

    function setMobileMenuOpen(open) {
        if (!mobileSpyMenu || !mobileSpyBtn) return;
        mobileSpyMenu.classList.toggle('hidden', !open);
        mobileSpyBtn.setAttribute('aria-expanded', String(open));
        if (mobileSpyChevron) {
            mobileSpyChevron.style.transform = open ? 'rotate(180deg)' : '';
        }
    }

    if (mobileSpyBtn && mobileSpyMenu) {
        mobileSpyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !mobileSpyMenu.classList.contains('hidden');
            setMobileMenuOpen(!isOpen);
        });

        mobileSpyLinks.forEach((link) => {
            link.addEventListener('click', () => setMobileMenuOpen(false));
        });

        document.addEventListener('click', (e) => {
            if (mobileSpyWrap && !mobileSpyWrap.contains(e.target)) {
                setMobileMenuOpen(false);
            }
        });
    }

    function setActiveSpy(id) {
        // Desktop rail
        spyLinks.forEach((link) => {
            const isMatch = link.dataset.spy === id;
            const bar = link.querySelector('.spy-bar');
            if (isMatch) {
                link.style.color = 'var(--text)';
                if (bar) {
                    bar.style.background = 'var(--accent)';
                    bar.style.height = '18px';
                }
            } else {
                link.style.color = 'var(--muted)';
                if (bar) {
                    bar.style.background = 'var(--border)';
                    bar.style.height = '14px';
                }
            }
        });

        // Mobile floating pill + active dot
        if (mobileSpyLabel && SECTION_LABELS[id]) {
            mobileSpyLabel.textContent = SECTION_LABELS[id];
        }
        mobileSpyLinks.forEach((link) => {
            const isMatch = link.dataset.mobileSpy === id;
            const dot = link.querySelector('.mobile-spy-dot');
            link.style.color = isMatch ? 'var(--text)' : 'var(--muted)';
            if (dot) {
                dot.style.backgroundColor = isMatch ? 'var(--accent)' : 'transparent';
            }
        });
    }

    if (typeof IntersectionObserver === 'function') {
        const spyObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSpy(entry.target.id);
                    }
                });
            },
            { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
        );

        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) spyObserver.observe(el);
        });
    }

    setActiveSpy('hero');
}


/* ---------------------------------------------------------------------
 * 14. DYNAMIC FAVICON CONTROLLER (ROBUST DOM-REPLACEMENT SWAP)
 * ------------------------------------------------------------------- */
export function initDynamicFavicon() {
    let currentState = null;

    function setFavicon(src) {
        try {
            document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());

            const link = document.createElement('link');
            link.id = 'favicon';
            link.rel = 'icon';
            link.type = 'image/png';

            const isHttp = location.protocol === 'http:' || location.protocol === 'https:';
            link.href = isHttp ? `${src}?v=${Date.now()}` : src;
            document.head.appendChild(link);
        } catch (err) {
            // Silently ignore favicon update errors in restricted environments
        }
    }

    function updateFavicon() {
        const isInactive = document.hidden || !document.hasFocus();
        const target = isInactive ? 'images/inactive.png' : 'images/active.png';
        if (target === currentState) return;
        currentState = target;
        setFavicon(target);
    }

    document.addEventListener('visibilitychange', updateFavicon);
    window.addEventListener('focus', updateFavicon);
    window.addEventListener('blur', updateFavicon);

    updateFavicon();
}


/* ---------------------------------------------------------------------
 * 17. MORPHING NAVBAR SCROLL CONTROLLER (FULL-WIDTH -> FLOATING 780px)
 * ------------------------------------------------------------------- */
export function initMorphingNavbar() {
    const navWrap = document.getElementById('siteNavWrap');
    if (!navWrap) return;

    let lastScrolled = null;

    function updateNavState() {
        const isScrolled = window.scrollY > 8;
        if (isScrolled === lastScrolled) return;
        lastScrolled = isScrolled;
        navWrap.classList.toggle('is-scrolled', isScrolled);
    }

    window.addEventListener('scroll', updateNavState, { passive: true });
    updateNavState();
}


/* ---------------------------------------------------------------------
* 18C. COMMAND PALETTE (⌘K / Ctrl+K)
* ------------------------------------------------------------------- */
export function initCommandPalette(openProjectModal) {
    const overlay = document.getElementById('cmdOverlay');
    const panel = document.getElementById('cmdPanel');
    const input = document.getElementById('cmdInput');
    const listEl = document.getElementById('cmdList');
    const triggerBtn = document.getElementById('cmdPaletteBtn');
    if (!overlay || !panel || !input || !listEl) return;

    let activeIdx = 0;
    let filtered = [];

    const jumpTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const COMMANDS = [
        { group: 'Navigate', label: 'About & Intro', hint: 'Section', run: () => jumpTo('hero') },
        { group: 'Navigate', label: 'Projects', hint: 'Section', run: () => jumpTo('projects') },
        { group: 'Navigate', label: 'Experience', hint: 'Section', run: () => jumpTo('experience') },
        { group: 'Navigate', label: 'Tech Stack', hint: 'Section', run: () => jumpTo('stack') },
        { group: 'Navigate', label: 'Technical Notes', hint: 'Section', run: () => jumpTo('notes') },
        { group: 'Navigate', label: 'Reading Bookshelf', hint: 'Section', run: () => jumpTo('reads') },
        { group: 'Navigate', label: 'Socials & Contact', hint: 'Section', run: () => jumpTo('connect') },
    ];

    function renderList() {
        const q = input.value.trim().toLowerCase();
        filtered = q
            ? COMMANDS.filter((c) => `${c.label} ${c.group} ${c.hint}`.toLowerCase().includes(q))
            : COMMANDS;

        if (activeIdx >= filtered.length) activeIdx = 0;

        if (!filtered.length) {
            listEl.innerHTML = `<div class="px-3 py-6 text-center font-mono text-xs text-[var(--muted)]">No matching commands</div>`;
            return;
        }

        listEl.innerHTML = filtered
            .map(
                (cmd, i) => `
                       <button type="button" data-cmd-idx="${i}" role="option" aria-selected="${i === activeIdx}"
                           class="w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-3 transition-colors cursor-pointer ${i === activeIdx ? 'bg-[var(--surface-hover)] text-[var(--text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}">
                           <span class="text-[13px] truncate">${cmd.label}</span>
                           <span class="font-mono text-[10.5px] text-[var(--muted)] shrink-0">${cmd.hint}</span>
                       </button>
                   `
            )
            .join('');

        const activeBtn = listEl.querySelector(`[data-cmd-idx="${activeIdx}"]`);
        if (activeBtn) activeBtn.scrollIntoView({ block: 'nearest' });
    }

    function openPalette() {
        input.value = '';
        activeIdx = 0;
        renderList();
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            overlay.classList.remove('opacity-0');
            panel.classList.remove('scale-95', 'opacity-0');
            panel.classList.add('scale-100', 'opacity-100');
            input.focus();
        });
    }

    function closePalette() {
        if (overlay.classList.contains('hidden')) return;
        overlay.classList.add('opacity-0');
        panel.classList.remove('scale-100', 'opacity-100');
        panel.classList.add('scale-95', 'opacity-0');
        document.body.style.overflow = '';
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }, 180);
    }

    function runCommand(idx) {
        const cmd = filtered[idx];
        if (!cmd) return;
        closePalette();
        setTimeout(() => cmd.run(), 190);
    }

    if (triggerBtn) triggerBtn.addEventListener('click', openPalette);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePalette();
    });

    listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-cmd-idx]');
        if (btn) runCommand(Number(btn.dataset.cmdIdx));
    });

    input.addEventListener('input', () => {
        activeIdx = 0;
        renderList();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIdx = (activeIdx + 1) % Math.max(1, filtered.length);
            renderList();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIdx = (activeIdx - 1 + filtered.length) % Math.max(1, filtered.length);
            renderList();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            runCommand(activeIdx);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closePalette();
        }
    });

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (overlay.classList.contains('hidden')) openPalette();
            else closePalette();
        }
    });
}
