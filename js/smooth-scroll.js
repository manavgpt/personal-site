import Lenis from 'https://cdn.jsdelivr.net/npm/lenis@1.1.20/+esm';

let lenisInstance = null;

export function initSmoothScroll() {
    // Respect OS accessibility preference
    const reducedMotion =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return null;

    lenisInstance = new Lenis({
        lerp: 0.085,          // Lower = silkier/heavier glide (0.07–0.1 is the sweet spot)
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.5,
    });

    function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return lenisInstance;
}

export function getLenis() {
    return lenisInstance;
}
