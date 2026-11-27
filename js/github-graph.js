/* ---------------------------------------------------------------------
 * GITHUB CONTRIBUTION GRAPH (52-WEEK HEATMAP + SESSION CACHE)
 * ------------------------------------------------------------------- */
const GITHUB_USER = 'manavgpt';
const CACHE_KEY = `gh_contrib_${GITHUB_USER}_v1`;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(isoDate) {
    const [y, m, d] = isoDate.split('-').map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
}

async function fetchContributions() {
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.ts < CACHE_TTL_MS && Array.isArray(parsed.contributions)) {
                return parsed;
            }
        }
    } catch (_) {
        // Ignore storage errors
    }

    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const payload = {
        ts: Date.now(),
        total: data.total?.lastYear ?? data.contributions.reduce((s, d) => s + d.count, 0),
        contributions: data.contributions || [],
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

    function render(contributions, total) {
        if (totalEl) {
            totalEl.textContent = `${total.toLocaleString()} contributions in the last year`;
        }

        // Pad start so column 0 aligns cleanly to Sunday (row 0)
        const firstDay = new Date(`${contributions[0].date}T00:00:00`).getDay();
        const padded = Array.from({ length: firstDay }, () => null).concat(contributions);

        // Render cells
        gridEl.innerHTML = padded
            .map((day) => {
                if (!day) return `<span class="gh-cell opacity-0 pointer-events-none" aria-hidden="true"></span>`;
                return `<span class="gh-cell" data-level="${day.level}" data-date="${day.date}" data-count="${day.count}"></span>`;
            })
            .join('');

        // Render month labels above their starting week column
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

        // Auto-scroll to most recent weeks on narrow mobile screens
        if (scrollEl) {
            scrollEl.scrollLeft = scrollEl.scrollWidth;
        }
    }

    // Delegated hover readout (no jittery floating popup clipping)
    gridEl.addEventListener('pointerover', (e) => {
        const cell = e.target.closest('.gh-cell[data-date]');
        if (!cell || !readoutEl) return;
        const count = Number(cell.dataset.count);
        const label = count === 1 ? '1 contribution' : `${count} contributions`;
        readoutEl.textContent = `${label} · ${formatDate(cell.dataset.date)}`;
    });

    gridEl.addEventListener('pointerleave', () => {
        if (readoutEl) readoutEl.textContent = 'Hover a day for details';
    });

    fetchContributions()
        .then(({ contributions, total }) => {
            if (!contributions.length) throw new Error('Empty dataset');
            render(contributions, total);
        })
        .catch(() => {
            if (totalEl) totalEl.textContent = 'Live feed unavailable';
            if (readoutEl) readoutEl.textContent = 'View full activity on GitHub ↗';
        });
}
