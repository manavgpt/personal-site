import { PROJECTS, EXPERIENCE, STACK, NOTES } from './data.js';
import { openModal, showToast } from './ui.js';

let activeProjectFilter = 'All';
let activeStackFilter = 'All';
let openExperienceId = 'exp-1';

export function openProjectModal(projectId) {
    const p = PROJECTS.find((item) => item.id === projectId);
    if (!p) return;

    openModal({
        kicker: `CASE STUDY · ${p.category.toUpperCase()} · ${p.year}`,
        title: `${p.title} — ${p.tagline}`,
        footerNote: `manav.here / projects / ${p.id}`,
        html: `
            <div class="space-y-5">
                <div>
                    <h4 class="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1.5">Problem</h4>
                    <p>${p.problem}</p>
                </div>
                <div>
                    <h4 class="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1.5">Architecture</h4>
                    <p>${p.architecture}</p>
                </div>
                <div>
                    <h4 class="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-2">Key Metrics</h4>
                    <ul class="space-y-1.5">
                        ${p.metrics
                .map(
                    (m) => `
                            <li class="flex items-start gap-2 text-[13.5px] text-[var(--text)]">
                                <span class="font-mono text-xs mt-0.5" style="color: var(--accent);">→</span>
                                <span>${m}</span>
                            </li>
                        `
                )
                .join('')}
                    </ul>
                </div>
                <div class="pt-3 border-t theme-border flex items-center justify-between flex-wrap gap-3">
                    <div class="flex items-center flex-wrap gap-1.5">
                        ${p.tags
                .map(
                    (t) =>
                        `<span class="px-2.5 py-1 rounded-md border theme-border theme-surface font-mono text-[11px] text-[var(--text)]">${t}</span>`
                )
                .join('')}
                    </div>
                    <div class="flex items-center gap-4 font-mono text-xs text-[var(--text)]">
                        <a href="#live-${p.id}" data-mock-action="Launching ${p.title} live demo" class="hover:underline underline-offset-4">Live Preview ↗</a>
                        <a href="#repo-${p.id}" data-mock-action="Opening ${p.title} source code" class="hover:underline underline-offset-4">Source Code ↗</a>
                    </div>
                </div>
            </div>
        `,
    });
}

export function initProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;

    function renderProjects() {
        const list =
            activeProjectFilter === 'All'
                ? PROJECTS
                : PROJECTS.filter((p) => p.category === activeProjectFilter);

        projectsGrid.innerHTML = list
            .map((project) => {
                const isLive = project.status === 'LIVE';
                const badgeHtml = isLive
                    ? `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono tracking-wide" style="border-color: var(--border); background-color: var(--accent-soft); color: var(--accent);">
                        <span class="relative flex h-1.5 w-1.5" aria-hidden="true">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style="background-color: var(--accent);"></span>
                            <span class="relative inline-flex rounded-full h-1.5 w-1.5" style="background-color: var(--accent);"></span>
                        </span>
                        LIVE
                    </span>`
                    : `<span class="inline-flex items-center px-2 py-0.5 rounded-full border theme-border text-[10px] font-mono tracking-wide text-[var(--muted)]">
                        OSS
                    </span>`;

                return `
                    <article
                        data-project-card="${project.id}"
                        tabindex="0"
                        role="button"
                        aria-label="Open case study for ${project.title}"
                        class="project-card animate-filter-in rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                    >
                        <div>
                            <div class="flex items-start justify-between gap-2">
                                <div>
                                    <h3 class="text-[15px] font-semibold text-[var(--text)] tracking-tight">
                                        ${project.title}
                                    </h3>
                                    <p class="font-mono text-[11px] text-[var(--muted)] mt-0.5">
                                        ${project.tagline}
                                    </p>
                                </div>
                                ${badgeHtml}
                            </div>

                            <p class="mt-3 text-[13px] leading-relaxed text-[var(--text-secondary)] line-clamp-2">
                                ${project.description}
                            </p>
                        </div>

                        <div class="pt-3 border-t theme-border flex items-center justify-between gap-2 flex-wrap">
                            <div class="flex items-center flex-wrap gap-1.5">
                                ${project.tags
                        .map(
                            (tag) =>
                                `<span class="px-2 py-0.5 rounded border theme-border theme-surface font-mono text-[10.5px] text-[var(--muted)]">${tag}</span>`
                        )
                        .join('')}
                            </div>

                            <div class="flex items-center gap-3 font-mono text-[11px] text-[var(--muted)]">
                                <a href="#preview-${project.id}" data-card-link="Previewing ${project.title}" class="hover:text-[var(--text)] transition-colors">Preview ↗</a>
                                <a href="#code-${project.id}" data-card-link="Opening ${project.title} repository" class="hover:text-[var(--text)] transition-colors">Code ↗</a>
                            </div>
                        </div>
                    </article>
                `;
            })
            .join('');
    }

    document.querySelectorAll('[data-project-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
            activeProjectFilter = btn.dataset.projectFilter;
            document.querySelectorAll('[data-project-filter]').forEach((b) => {
                b.setAttribute('aria-pressed', String(b.dataset.projectFilter === activeProjectFilter));
            });
            renderProjects();
        });
    });

    projectsGrid.addEventListener('click', (e) => {
        const directLink = e.target.closest('[data-card-link]');
        if (directLink) {
            e.preventDefault();
            e.stopPropagation();
            showToast(directLink.dataset.cardLink);
            return;
        }
        const card = e.target.closest('[data-project-card]');
        if (card) openProjectModal(card.dataset.projectCard);
    });

    projectsGrid.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const card = e.target.closest('[data-project-card]');
            if (card) {
                e.preventDefault();
                openProjectModal(card.dataset.projectCard);
            }
        }
    });

    renderProjects();
}

export function initExperience() {
    const experienceList = document.getElementById('experienceList');
    if (!experienceList) return;

    experienceList.innerHTML = EXPERIENCE.map((item) => {
        const isOpen = item.id === openExperienceId;
        return `
            <div class="accordion-item bg-[var(--bg)]" data-exp-id="${item.id}" data-open="${isOpen}">
                <button
                    type="button"
                    aria-expanded="${isOpen}"
                    class="exp-trigger w-full text-left px-4 sm:px-5 py-4 hover:bg-[var(--surface)] transition-colors flex items-center justify-between gap-4 cursor-pointer"
                >
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h3 class="text-[14.5px] font-semibold text-[var(--text)]">${item.role}</h3>
                            <span class="text-[var(--muted)] text-xs">@</span>
                            <span class="text-[14px] font-medium text-[var(--text-secondary)]">${item.company}</span>
                        </div>
                        <p class="font-mono text-[11.5px] text-[var(--muted)] mt-1">
                            ${item.period} · ${item.location}
                        </p>
                    </div>

                    <svg
                        class="accordion-chevron w-4 h-4 text-[var(--muted)] shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>

                <div class="accordion-body">
                    <div class="accordion-inner">
                        <ul class="px-4 sm:px-5 pb-5 pt-1 space-y-2 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
                            ${item.bullets
                .map(
                    (bullet) => `
                                <li class="flex items-start gap-2.5">
                                    <span class="font-mono text-xs mt-0.5 select-none" style="color: var(--accent);">•</span>
                                    <span>${bullet}</span>
                                </li>
                            `
                )
                .join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    experienceList.addEventListener('click', (e) => {
        const trigger = e.target.closest('.exp-trigger');
        if (!trigger) return;
        const itemEl = trigger.closest('.accordion-item');
        if (!itemEl) return;
        const id = itemEl.dataset.expId;

        openExperienceId = openExperienceId === id ? null : id;
        experienceList.querySelectorAll('.accordion-item').forEach((row) => {
            const match = row.dataset.expId === openExperienceId;
            row.setAttribute('data-open', String(match));
            const btn = row.querySelector('.exp-trigger');
            if (btn) btn.setAttribute('aria-expanded', String(match));
        });
    });
}

export function initStack() {
    const stackGrid = document.getElementById('stackGrid');
    if (!stackGrid) return;

    function renderStack() {
        const list =
            activeStackFilter === 'All'
                ? STACK
                : STACK.filter((item) => item.category === activeStackFilter);

        stackGrid.innerHTML = list
            .map((item, idx) => {
                const iconClasses = [
                    'stack-icon',
                    item.invertDark ? 'icon-invert' : '',
                    item.boostLight ? 'icon-boost-light' : '',
                ]
                    .filter(Boolean)
                    .join(' ');

                const icon = item.slug
                    ? `<img src="https://cdn.simpleicons.org/${item.slug}" alt="" loading="lazy" class="${iconClasses}" aria-hidden="true" />`
                    : item.svg;

                return `
            <span class="stack-pill stack-pill-enter inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border theme-border theme-surface font-mono text-[12px] text-[var(--text)] select-none" style="--i:${idx}">
                ${icon}
                <span>${item.name}</span>
            </span>
        `;
            })
            .join('');
    }

    document.querySelectorAll('[data-stack-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
            activeStackFilter = btn.dataset.stackFilter;
            document.querySelectorAll('[data-stack-filter]').forEach((b) => {
                b.setAttribute('aria-pressed', String(b.dataset.stackFilter === activeStackFilter));
            });
            renderStack();
        });
    });

    renderStack();
}

export function initNotes() {
    const notesIndex = document.getElementById('notesIndex');
    if (!notesIndex) return;

    notesIndex.innerHTML = NOTES.map(
        (note) => `
            <button
                type="button"
                data-note-id="${note.id}"
                class="note-row w-full text-left py-3.5 px-2 -mx-2 rounded-lg hover:bg-[var(--surface)] transition-all duration-200 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 items-baseline cursor-pointer"
            >
                <span class="sm:col-span-2 font-mono text-[11.5px] text-[var(--muted)]">
                    ${note.date}
                </span>
                <span class="sm:col-span-8 text-[14.5px] font-medium text-[var(--text)]">
                    ${note.title}
                </span>
                <span class="sm:col-span-2 sm:text-right font-mono text-[11.5px] text-[var(--muted)]">
                    ${note.readTime} read
                </span>
            </button>
        `
    ).join('');

    notesIndex.addEventListener('click', (e) => {
        const row = e.target.closest('[data-note-id]');
        if (!row) return;
        const note = NOTES.find((n) => n.id === row.dataset.noteId);
        if (!note) return;

        openModal({
            kicker: `TECHNICAL NOTE · ${note.date.toUpperCase()} · ${note.readTime.toUpperCase()} READ`,
            title: note.title,
            footerNote: `manav.here / notes / ${note.id}`,
            html:
                note.paragraphs.map((p) => `<p>${p}</p>`).join('') +
                `<pre class="mt-4 p-4 rounded-lg border theme-border theme-surface font-mono text-xs text-[var(--text)] overflow-x-auto leading-relaxed"><code>${note.code}</code></pre>`,
        });
    });
}
