/* ---------------------------------------------------------------------
 * GITHUB CONTRIBUTION GRAPH (CIRCLES + COUNTS + NEW REPO MARKERS)
 * ------------------------------------------------------------------- */
const GITHUB_USER = 'manavgpt';
const CACHE_KEY = `gh_contrib_${GITHUB_USER}_v2`;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STARSHIP_SVG = `
<svg class="gh-starship" viewBox="0 0 24 24" aria-hidden="true">
    <g transform="rotate(38 12 12)">
        <!-- Flickering Raptor exhaust plume -->
        <path class="gh-ship-flame" d="M10.2 17.5 L12 23.2 L13.8 17.5 Z" fill="#f97316" />
        <path class="gh-ship-flame" d="M11 17.5 L12 21.2 L13 17.5 Z" fill="#fef08a" />
        <!-- Aft & forward flaps -->
        <path class="gh-ship-flap" d="M9.4 13.5 L6.5 17.2 L9.4 17.2 Z" />
        <path class="gh-ship-flap" d="M14.6 13.5 L17.5 17.2 L14.6 17.2 Z" />
        <path class="gh-ship-flap" d="M9.8 6.8 L7.6 9.5 L9.4 9.8 Z" />
        <path class="gh-ship-flap" d="M14.2 6.8 L16.4 9.5 L14.6 9.8 Z" />
        <!-- Stainless-steel Starship hull -->
        <path class="gh-ship-hull" d="M9.4 17.2 L9.4 7.8 C9.4 5 11 3.1 12 2.4 C13 3.1 14.6 5 14.6 7.8 L14.6 17.2 Z" />
        <!-- Black ceramic heat shield side -->
        <path class="gh-ship-shield" d="M9.4 17.2 L9.4 7.8 C9.4 5.2 10.8 3.4 11.7 2.6 L11.7 17.2 Z" />
    </g>
</svg>`;


function formatDate(isoDate) {
    const [y, m, d] = isoDate.split('-').map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
}

async function fetchGitHubData() {
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.ts < CACHE_TTL_MS && Array.isArray(parsed.contributions)) {
                return parsed;
            }
        }
    } catch (_) { }

    const [contribRes, reposRes] = await Promise.all([
        fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`),
        fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=created`).catch(() => null),
    ]);

    if (!contribRes.ok) throw new Error(`HTTP ${contribRes.status}`);
    const contribData = await contribRes.json();

    // Map YYYY-MM-DD -> repo name for days a new repo was created
    const repoDates = {};
    if (reposRes && reposRes.ok) {
        const repos = await reposRes.json();
        if (Array.isArray(repos)) {
            repos.forEach((r) => {
                if (r.created_at && !r.fork) {
                    const day = r.created_at.slice(0, 10);
                    repoDates[day] = repoDates[day] ? `${repoDates[day]}, ${r.name}` : r.name;
                }
            });
        }
    }

    const payload = {
        ts: Date.now(),
        total: contribData.total?.lastYear ?? contribData.contributions.reduce((s, d) => s + d.count, 0),
        contributions: contribData.contributions || [],
        repoDates,
    };

    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (_) { }

    return payload;
}

export function initGitHubGraph() {
    const gridEl = document.getElementById('ghGrid');
    const monthsEl = document.getElementById('ghMonths');
    const totalEl = document.getElementById('ghTotalCount');
    const readoutEl = document.getElementById('ghHoverReadout');
    const scrollEl = document.getElementById('ghGraphScroll');
    if (!gridEl || !monthsEl) return;

    function render(contributions, total, repoDates = {}) {
        if (totalEl) {
            totalEl.textContent = `${total.toLocaleString()} contributions in the last year`;
        }
        // Keep last 35 weeks (~8 months) so 16px numbered circles fit 780px with zero scrollbar
        const visible = contributions.slice(-245);
        const firstDay = new Date(`${visible[0].date}T00:00:00`).getDay();
        const padded = Array.from({ length: firstDay }, () => null).concat(visible);

        gridEl.innerHTML = padded
            .map((day) => {
                if (!day) return `<span class="gh-cell opacity-0 pointer-events-none" aria-hidden="true"></span>`;
                const repoName = repoDates[day.date];
                if (repoName) {
                    return `<span class="gh-cell is-repo" data-level="${day.level}" data-date="${day.date}" data-count="${day.count}" data-repo="${repoName}">${STARSHIP_SVG}</span>`;
                }
                const num = day.count > 0 ? (day.count > 99 ? '99' : day.count) : '';
                return `<span class="gh-cell" data-level="${day.level}" data-date="${day.date}" data-count="${day.count}">${num}</span>`;
            })
            .join('');

        const totalWeeks = Math.ceil(padded.length / 7);
        const monthCells = [];
        let lastMonth = -1;

        for (let w = 0; w < totalWeeks; w++) {
            const sample = padded[w * 7] || padded[w * 7 + 6];
            let label = '';
            if (sample) {
                const m = Number(sample.date.split('-')[1]) - 1;
                if (m !== lastMonth) {
                    label = MONTHS[m];
                    lastMonth = m;
                }
            }
            monthCells.push(`<span class="whitespace-nowrap">${label}</span>`);
        }
        monthsEl.innerHTML = monthCells.join('');

        // Auto-scroll to the most recent weeks on the right
        if (scrollEl) {
            scrollEl.scrollLeft = scrollEl.scrollWidth;
        }
    }

    gridEl.addEventListener('pointerover', (e) => {
        const cell = e.target.closest('.gh-cell[data-date]');
        if (!cell || !readoutEl) return;
        const count = Number(cell.dataset.count);
        const label = count === 1 ? '1 contribution' : `${count} contributions`;
        const repoInfo = cell.dataset.repo ? ` · New repo: ${cell.dataset.repo}` : '';
        readoutEl.textContent = `${label} · ${formatDate(cell.dataset.date)}${repoInfo}`;
    });

    gridEl.addEventListener('pointerleave', () => {
        if (readoutEl) readoutEl.textContent = 'Hover a day for details';
    });

    fetchGitHubData()
        .then(({ contributions, total, repoDates }) => {
            if (!contributions.length) throw new Error('Empty dataset');
            render(contributions, total, repoDates);
        })
        .catch(() => {
            if (totalEl) totalEl.textContent = 'Live feed unavailable';
            if (readoutEl) readoutEl.textContent = 'View full activity on GitHub ↗';
        });
}
