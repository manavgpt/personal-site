import { PROJECTS } from './data.js';
import { toggleTheme } from './theme.js';
import { playStarshipTakeoffAudio } from './audio.js';

let toastTimeout = null;
let focusSectionRef = null;
let toggleBlueprintRef = null;

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
    const copyEmailIcon = document.getElementById('copyEmailIcon');
    if (copyEmailBtn && copyEmailIcon) {
        const copyIconSvg = copyEmailIcon.innerHTML;
        const checkIconSvg = `
            <svg class="w-3 h-3" style="color: var(--accent);" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        let copyResetTimer = null;

        copyEmailBtn.addEventListener('click', () => {
            const markCopied = () => {
                clearTimeout(copyResetTimer);
                copyEmailIcon.innerHTML = checkIconSvg;
                copyEmailBtn.setAttribute('aria-label', 'Email copied');
                showToast('Copied hello@manav.here');
                copyResetTimer = setTimeout(() => {
                    copyEmailIcon.innerHTML = copyIconSvg;
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
    const spyIndicator = document.getElementById('spyIndicator');

    function moveSpyIndicator(activeLink) {
        if (!spyIndicator || !activeLink) return;
        const barHeight = spyIndicator.offsetHeight || 18;
        const targetY = activeLink.offsetTop + (activeLink.offsetHeight - barHeight) / 2;
        spyIndicator.style.transform = `translateY(${targetY}px)`;
        spyIndicator.style.opacity = '1';
    }


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
        let activeLink = null;

        // Desktop rail
        spyLinks.forEach((link) => {
            const isMatch = link.dataset.spy === id;
            link.classList.toggle('is-active', isMatch);
            link.style.color = isMatch ? 'var(--text)' : 'var(--muted)';
            if (isMatch) activeLink = link;
        });

        // Glide the single emerald indicator bar to the active section
        if (activeLink) moveSpyIndicator(activeLink);

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
    // Cursor-tracking radial border glow on project cards
    const projectsGrid = document.getElementById('projectsGrid');
    if (projectsGrid && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        projectsGrid.addEventListener('pointermove', (e) => {
            const card = e.target.closest('#projectsGrid > *');
            if (!card) return;
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
            card.style.setProperty('--my', `${e.clientY - rect.top}px`);
        });
    }
    // Hover-to-reveal Live IST Clock on Hero Location
    const locationClock = document.getElementById('locationClock');
    const istClockText = document.getElementById('istClockText');
    const istStatusDot = document.getElementById('istStatusDot');

    if (locationClock && istClockText) {
        const istFormatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        let clockTimer = null;

        const updateIstClock = () => {
            const now = new Date();
            const timeStr = istFormatter.format(now);
            istClockText.textContent = `${timeStr} IST`;

            if (istStatusDot) {
                const istHour = Number(timeStr.slice(0, 2));
                const isNight = istHour >= 0 && istHour < 8;
                istStatusDot.classList.toggle('is-night', isNight);
            }
        };

        const startClock = () => {
            updateIstClock();
            if (!clockTimer) clockTimer = setInterval(updateIstClock, 1000);
        };

        const stopClock = () => {
            if (locationClock.classList.contains('is-clock-open')) return;
            clearInterval(clockTimer);
            clockTimer = null;
        };

        locationClock.addEventListener('mouseenter', startClock);
        locationClock.addEventListener('mouseleave', stopClock);
        locationClock.addEventListener('focus', startClock);
        locationClock.addEventListener('blur', stopClock);

        // Mobile tap-to-toggle support
        locationClock.addEventListener('click', () => {
            const isOpen = locationClock.classList.toggle('is-clock-open');
            if (isOpen) startClock();
            else stopClock();
        });
    }
    // Hybrid Focused Section View on Navbar Click
    const primaryNavLinks = document.querySelectorAll('nav[aria-label="Primary Navigation"] a[href^="#"]');
    const brandHomeLink = document.querySelector('a[aria-label="Manav Chaudhari Home"]');
    const mainSections = document.querySelectorAll('main > section[id]');

    function showAllSections(updateHash = true) {
        setActiveSpy('hero');
        document.body.classList.remove('is-focused-view');
        mainSections.forEach((sec) => sec.classList.remove('is-focused-section'));
        primaryNavLinks.forEach((a) => {
            a.classList.toggle('is-nav-active', a.getAttribute('href') === '#hero');
        });
        if (updateHash && location.hash) {
            history.pushState(null, '', location.pathname + location.search);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function focusSection(id, updateHash = true) {
        const target = document.getElementById(id);
        if (!target) return;

        if (id === 'hero') {
            showAllSections(updateHash);
            return;
        }

        document.body.classList.add('is-focused-view');
        mainSections.forEach((sec) => {
            const isTarget = sec.id === id;
            sec.classList.toggle('is-focused-section', isTarget);
            if (isTarget) sec.classList.add('is-visible');
        });

        primaryNavLinks.forEach((a) => {
            a.classList.toggle('is-nav-active', a.getAttribute('href') === `#${id}`);
        });
        setActiveSpy(id);
        if (updateHash) {
            history.pushState({ focused: id }, '', `#${id}`);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    focusSectionRef = focusSection;

    primaryNavLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('href').slice(1);
            focusSection(id, true);
        });
    });

    mobileSpyLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.dataset.mobileSpy;
            setMobileMenuOpen(false);
            focusSection(id, true);
        });
    });

    if (brandHomeLink) {
        brandHomeLink.addEventListener('click', (e) => {
            e.preventDefault();
            showAllSections(true);
        });
    }

    window.addEventListener('popstate', () => {
        const id = location.hash ? location.hash.slice(1) : 'hero';
        focusSection(id, false);
    });

    // Live Blueprint / X-Ray DOM & Canvas Inspector
    let bpHud = null;
    let bpCrossX = null;
    let bpCrossY = null;
    let bpBox = null;
    let bpTag = null;
    let bpActive = false;

    function updateBlueprintSections() {
        document.querySelectorAll('main > section[id]').forEach((sec) => {
            const rect = sec.getBoundingClientRect();
            const nodes = sec.querySelectorAll('*').length;
            sec.dataset.bpMeta = `#${sec.id} · ${Math.round(rect.width)}×${Math.round(rect.height)} · ${nodes} nodes`;
        });
    }

    function ensureBpHud() {
        if (bpHud) return;
        bpHud = document.createElement('div');
        bpHud.className = 'bp-hud';
        bpHud.setAttribute('aria-hidden', 'true');
        bpHud.innerHTML = `
            <div class="bp-cross-x"></div>
            <div class="bp-cross-y"></div>
            <div class="bp-box"></div>
            <div class="bp-tag"></div>
        `;
        document.body.appendChild(bpHud);
        bpCrossX = bpHud.querySelector('.bp-cross-x');
        bpCrossY = bpHud.querySelector('.bp-cross-y');
        bpBox = bpHud.querySelector('.bp-box');
        bpTag = bpHud.querySelector('.bp-tag');
    }

    function onBpMove(e) {
        if (!bpHud) return;
        bpCrossX.style.transform = `translate3d(0, ${e.clientY}px, 0)`;
        bpCrossY.style.transform = `translate3d(${e.clientX}px, 0, 0)`;

        const el = e.target;
        if (!el || el === document.body || el === document.documentElement) {
            bpBox.style.opacity = '0';
            bpTag.style.opacity = '0';
            return;
        }

        const rect = el.getBoundingClientRect();
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';

        bpBox.style.opacity = '1';
        bpBox.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
        bpBox.style.width = `${rect.width}px`;
        bpBox.style.height = `${rect.height}px`;

        const extra =
            tag === 'canvas'
                ? ` · buf ${el.width}×${el.height}`
                : ` · x:${Math.round(rect.left)} y:${Math.round(rect.top + window.scrollY)}`;

        bpTag.style.opacity = '1';
        bpTag.innerHTML = `<em>${tag}${id}</em> · ${w}×${h}px${extra}`;

        const tagW = bpTag.offsetWidth || 180;
        const tx = Math.min(window.innerWidth - tagW - 10, Math.max(10, e.clientX + 14));
        const ty = e.clientY > 44 ? e.clientY - 30 : e.clientY + 16;
        bpTag.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    }

    function toggleBlueprint() {
        bpActive = document.body.classList.toggle('is-blueprint');
        if (bpActive) {
            ensureBpHud();
            updateBlueprintSections();
            window.addEventListener('pointermove', onBpMove, { passive: true });
            window.addEventListener('resize', updateBlueprintSections);
            showToast('X-Ray inspector: ON');
        } else {
            window.removeEventListener('pointermove', onBpMove);
            window.removeEventListener('resize', updateBlueprintSections);
            showToast('X-Ray inspector: OFF');
        }
    }
    toggleBlueprintRef = toggleBlueprint;


    // Deterministic 0–6, G & Esc Keyboard Shortcuts
    const KEY_SECTION_MAP = {
        '0': 'hero',
        '1': 'projects',
        '2': 'experience',
        '3': 'stack',
        '4': 'notes',
        '5': 'reads',
        '6': 'connect',
    };

    document.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const tag = e.target && e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

        const modalOpen = !document.getElementById('modalOverlay')?.classList.contains('hidden');
        const cmdOpen = !document.getElementById('cmdOverlay')?.classList.contains('hidden');
        if (modalOpen || cmdOpen) return;

        if (e.key === 'Escape' && document.body.classList.contains('is-focused-view')) {
            e.preventDefault();
            showAllSections(true);
            return;
        }

        if (e.key.toLowerCase() === 'g') {
            e.preventDefault();
            toggleBlueprint();
            return;
        }

        const targetId = KEY_SECTION_MAP[e.key];
        if (targetId) {
            e.preventDefault();
            focusSection(targetId, true);
        }
    });
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
    const topBlur = document.querySelector('.progressive-blur-top');
    const bottomBlur = document.querySelector('.progressive-blur-bottom');
    if (!navWrap) return;

    let lastScrolled = null;
    let lastAtBottom = null;

    function updateNavState() {
        const isScrolled = window.scrollY > 8;
        if (isScrolled !== lastScrolled) {
            lastScrolled = isScrolled;
            navWrap.classList.toggle('is-scrolled', isScrolled);
            if (topBlur) topBlur.classList.toggle('is-hidden', !isScrolled);
        }

        if (bottomBlur) {
            const distFromBottom =
                document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
            const isAtBottom = distFromBottom < 140;
            if (isAtBottom !== lastAtBottom) {
                lastAtBottom = isAtBottom;
                bottomBlur.classList.toggle('is-hidden', isAtBottom);
            }
        }
    }

    window.addEventListener('scroll', updateNavState, { passive: true });
    window.addEventListener('resize', updateNavState, { passive: true });
    updateNavState();
}

/* ---------------------------------------------------------------------
* 18C. COMMAND PALETTE (⌘K / Ctrl+K)
* ------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
 * 18C. COMMAND PALETTE (⌘K / Ctrl+K) — GROUPED SITE EXPLORER
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

    const go = (id) => {
        if (focusSectionRef) {
            focusSectionRef(id, true);
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const ICONS = {
        nav: `<svg class="w-3.5 h-3.5 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
        project: `<svg class="w-3.5 h-3.5 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>`,
        action: `<svg class="w-3.5 h-3.5 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    };

    const COMMANDS = [
        // 1. Navigate (mirrors 0–6 deterministic shortcuts)
        { group: 'Navigate', icon: ICONS.nav, label: 'Full Portfolio (Overview)', keywords: 'home intro about', kbd: '0', run: () => go('hero') },
        { group: 'Navigate', icon: ICONS.nav, label: 'Projects', keywords: 'work code builds', kbd: '1', run: () => go('projects') },
        { group: 'Navigate', icon: ICONS.nav, label: 'Experience', keywords: 'career jobs roles', kbd: '2', run: () => go('experience') },
        { group: 'Navigate', icon: ICONS.nav, label: 'Tech Stack', keywords: 'tools languages', kbd: '3', run: () => go('stack') },
        { group: 'Navigate', icon: ICONS.nav, label: 'Technical Notes', keywords: 'writing blog articles', kbd: '4', run: () => go('notes') },
        { group: 'Navigate', icon: ICONS.nav, label: 'Reading Bookshelf', keywords: 'books snow', kbd: '5', run: () => go('reads') },
        { group: 'Navigate', icon: ICONS.nav, label: 'Socials & Contact', keywords: 'email github twitter', kbd: '6', run: () => go('connect') },

        // 2. Dynamic Projects (auto-populated from data.js)
        ...PROJECTS.map((p) => ({
            group: 'Projects',
            icon: ICONS.project,
            label: p.title,
            sub: p.tagline,
            keywords: `${p.category} ${(p.tags || []).join(' ')}`,
            kbd: '↵',
            run: () => openProjectModal && openProjectModal(p.id),
        })),

        // 3. System & Actions
        {
            group: 'System',
            icon: ICONS.action,
            label: 'Toggle X-Ray DOM Inspector',
            keywords: 'blueprint grid caliper debug',
            kbd: 'G',
            run: () => toggleBlueprintRef && toggleBlueprintRef(),
        },
        {
            group: 'System',
            icon: ICONS.action,
            label: 'Toggle Light / Dark Theme',
            keywords: 'dark mode light appearance',
            kbd: 'T',
            run: () => toggleTheme(),
        },
        {
            group: 'System',
            icon: ICONS.action,
            label: 'Copy Email Address',
            sub: 'hello@manav.here',
            keywords: 'mail contact clipboard',
            kbd: '↵',
            run: () => document.getElementById('copyEmailBtn')?.click(),
        },
        {
            group: 'System',
            icon: ICONS.action,
            label: 'Open Resume Preview',
            keywords: 'cv pdf download',
            kbd: '↵',
            run: () => document.getElementById('resumeBtn')?.click(),
        },
    ];

    function renderList() {
        const q = input.value.trim().toLowerCase();
        filtered = q
            ? COMMANDS.filter((c) =>
                `${c.label} ${c.sub || ''} ${c.group} ${c.keywords || ''}`.toLowerCase().includes(q)
            )
            : COMMANDS;

        if (activeIdx >= filtered.length) activeIdx = 0;

        if (!filtered.length) {
            listEl.innerHTML = `<div class="px-3 py-8 text-center font-mono text-xs text-[var(--muted)]">No matching commands for "${q}"</div>`;
            return;
        }

        let html = '';
        let lastGroup = '';

        filtered.forEach((cmd, i) => {
            if (cmd.group !== lastGroup) {
                lastGroup = cmd.group;
                html += `<div class="cmd-group-label">${cmd.group}</div>`;
            }
            const subHtml = cmd.sub
                ? `<span class="text-[11.5px] text-[var(--muted)] truncate hidden sm:inline">— ${cmd.sub}</span>`
                : '';
            html += `
                <button type="button" data-cmd-idx="${i}" role="option" aria-selected="${i === activeIdx}" class="cmd-item">
                    <span class="flex items-center gap-2.5 min-w-0">
                        ${cmd.icon}
                        <span class="text-[13px] font-medium truncate">${cmd.label}</span>
                        ${subHtml}
                    </span>
                    <kbd class="cmd-kbd">${cmd.kbd}</kbd>
                </button>
            `;
        });

        listEl.innerHTML = html;

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
