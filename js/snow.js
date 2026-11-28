import { playSnowPurr } from './audio.js';

const SNOW_PERCH_HTML = `
    <div id="snowCatSlot" class="shelf-cat-perch" role="button" tabindex="0"
        aria-label="Snow, white Persian cat sleeping on the bookshelf ledge. Click to hear her purr.">
        <canvas id="snowCanvas" class="snow-canvas" aria-hidden="true"></canvas>
    </div>
`;

export function initSnow() {
    const readsSection = document.getElementById('reads');
    if (!readsSection) return;

    if (!readsSection.querySelector('.shelf-cat-perch')) {
        readsSection.insertAdjacentHTML('beforeend', SNOW_PERCH_HTML);
    }

    const snowEl = readsSection.querySelector('.shelf-cat-perch');
    if (!snowEl) return;

    let snowPurrTimer = null;
    let isHovered = false;
    let isPurring = false;

    function spawnPurrMotes(count) {
        const symbols = ['purr', 'purr', 'purr'];
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (!snowEl.isConnected) return;
                const mote = document.createElement('span');
                mote.className = 'snow-mote';
                mote.textContent = symbols[i % symbols.length];
                const leftPx = 24 + i * 14 + (Math.random() - 0.5) * 6;
                const driftPx = (Math.random() - 0.5) * 16;
                mote.style.left = `${leftPx}px`;
                mote.style.top = '-8px';
                mote.style.setProperty('--drift', `${driftPx.toFixed(1)}px`);
                snowEl.appendChild(mote);
                setTimeout(() => mote.remove(), 1400);
            }, i * 260);
        }
    }

    function petSnow() {
        playSnowPurr();
        spawnPurrMotes(3);
        isPurring = true;
        snowEl.classList.add('is-purring');
        clearTimeout(snowPurrTimer);
        snowPurrTimer = setTimeout(() => {
            isPurring = false;
            snowEl.classList.remove('is-purring');
        }, 1400);
    }

    snowEl.addEventListener('pointerenter', (e) => {
        isHovered = true;
        if (e.pointerType === 'mouse') petSnow();
    });

    snowEl.addEventListener('pointerleave', () => {
        isHovered = false;
    });

    snowEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        petSnow();
    });

    snowEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            petSnow();
        }
    });

    /* Smooth C1-Continuous Flexible Tail Wave Renderer */
    const snowCanvas = snowEl.querySelector('#snowCanvas');
    const sCtx = snowCanvas ? snowCanvas.getContext('2d') : null;
    if (!snowCanvas || !sCtx) return;

    const reducedMotion =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const padX = 14;
    const tailStartRatio = 0.48;
    const img = new Image();
    let cssW = 0;
    let cssH = 0;
    let catW = 0;
    let catH = 0;
    let phase = 0;
    let speed = 1.65;
    let lastTs = performance.now();
    let inView = true;
    let rafId = null;

    function sizeCanvas() {
        if (!img.naturalWidth) return;
        const slotW = snowEl.getBoundingClientRect().width || 112;
        const aspect = img.naturalHeight / img.naturalWidth;
        catW = slotW;
        catH = slotW * aspect;
        cssW = catW + padX * 2;
        cssH = catH;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        snowCanvas.width = Math.round(cssW * dpr);
        snowCanvas.height = Math.round(cssH * dpr);
        snowCanvas.style.height = `${cssH.toFixed(1)}px`;
        sCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        sCtx.imageSmoothingEnabled = true;
        sCtx.imageSmoothingQuality = 'high';
        drawSnow(0);
    }

    function drawSnow(dt) {
        if (!img.naturalWidth || !catW) return;
        const targetSpeed = isPurring || isHovered ? 3.2 : 1.65;
        speed += (targetSpeed - speed) * Math.min(1, dt * 4.5);
        if (!reducedMotion) phase += dt * speed;

        sCtx.clearRect(0, 0, cssW, cssH);

        const srcW = img.naturalWidth;
        const srcH = img.naturalHeight;
        const splitSrcY = srcH * tailStartRatio;
        const splitDstY = catH * tailStartRatio;

        // 1. Static sleeping body, head, and tucked paws
        sCtx.drawImage(img, 0, 0, srcW, splitSrcY, padX, 0, catW, splitDstY);

        // 2. Flexible hanging tail (1.5px slices, quadratic C1-continuous wave)
        const tailDstH = catH - splitDstY;
        const maxSway = catW * 0.085;
        const step = 1.5;

        for (let dy = 0; dy < tailDstH; dy += step) {
            const t = dy / tailDstH;
            const dx = reducedMotion
                ? 0
                : Math.sin(phase - t * 1.25) * (t * t) * maxSway;

            const sy = splitSrcY + t * (srcH - splitSrcY);
            const sh = Math.min(srcH - sy, (step + 0.7) * (srcH / catH));
            const dh = Math.min(tailDstH - dy, step + 0.7);

            sCtx.drawImage(
                img,
                0, sy, srcW, sh,
                padX + dx, splitDstY + dy, catW, dh
            );
        }
    }

    function loop(now) {
        if (!inView || reducedMotion) {
            rafId = null;
            return;
        }
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) * 0.001));
        lastTs = now;
        if (!document.hidden) drawSnow(dt);
        rafId = requestAnimationFrame(loop);
    }

    function start() {
        if (reducedMotion) {
            drawSnow(0);
            return;
        }
        if (!rafId && inView) {
            lastTs = performance.now();
            rafId = requestAnimationFrame(loop);
        }
    }

    img.onload = () => {
        sizeCanvas();
        start();
    };
    img.src = 'images/snow.png';

    if (typeof IntersectionObserver === 'function') {
        new IntersectionObserver(
            (entries) => {
                inView = entries[0].isIntersecting;
                if (inView) start();
                else if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            },
            { threshold: 0.01 }
        ).observe(snowEl);
    }

    if (typeof ResizeObserver === 'function') {
        new ResizeObserver(sizeCanvas).observe(snowEl);
    } else {
        window.addEventListener('resize', sizeCanvas);
    }
}
