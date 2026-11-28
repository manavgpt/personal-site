import { playThemeSwitchSound } from './audio.js';

const htmlEl = document.documentElement;
const themeChangeListeners = new Set();
let userOverrodeTheme = false;
let isThemeTransitioning = false;

export function onThemeChange(callback) {
    if (typeof callback === 'function') {
        themeChangeListeners.add(callback);
    }
    return () => themeChangeListeners.delete(callback);
}

function notifyThemeChange() {
    themeChangeListeners.forEach((cb) => {
        try {
            cb();
        } catch (_) {
            // Isolate canvas redraw failures
        }
    });
}

function applyThemeSwitch() {
    userOverrodeTheme = true;
    const isNowDark = htmlEl.classList.toggle('dark');
    playThemeSwitchSound(isNowDark);
    notifyThemeChange();
}

export function toggleTheme(event) {
    // Prevent overlapping GPU snapshots on rapid toggles
    if (isThemeTransitioning) return;

    const reducedMotion =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || typeof document.startViewTransition !== 'function') {
        applyThemeSwitch();
        return;
    }

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    let x = window.innerWidth - 36;
    let y = 28;
    if (event && typeof event.clientX === 'number' && event.clientX > 0) {
        x = event.clientX;
        y = event.clientY;
    } else if (themeToggleBtn) {
        const rect = themeToggleBtn.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
    }

    const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
    );

    isThemeTransitioning = true;
    htmlEl.classList.add('theme-transitioning');

    const transition = document.startViewTransition(() => {
        applyThemeSwitch();
    });

    transition.ready
        .then(() => {
            const timing = {
                duration: 750,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            };

            document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`,
                    ],
                    filter: ['blur(8px)', 'blur(0px)'],
                    opacity: [0.75, 1],
                },
                {
                    ...timing,
                    pseudoElement: '::view-transition-new(root)',
                }
            );

            document.documentElement.animate(
                {
                    filter: ['blur(0px)', 'blur(4px)'],
                    opacity: [1, 0.88],
                },
                {
                    ...timing,
                    pseudoElement: '::view-transition-old(root)',
                }
            );
        })
        .catch(() => { });

    transition.finished.finally(() => {
        htmlEl.classList.remove('theme-transitioning');
        isThemeTransitioning = false;
    });
}

export function initTheme() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', (e) => toggleTheme(e));
    }

    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = (e) => {
            if (userOverrodeTheme) return;
            htmlEl.classList.toggle('dark', e.matches);
            notifyThemeChange();
        };
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleSystemThemeChange);
        }
    }

    document.addEventListener('keydown', (e) => {
        const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) {
            return;
        }
        if (e.key === 't' || e.key === 'T') {
            if (e.repeat) return;
            toggleTheme();
        }
    });
}
