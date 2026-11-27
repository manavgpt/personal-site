import { initGitHubGraph } from './github-graph.js';
import { initTheme } from './theme.js';
import {
    initModal,
    initResumeAndCopy,
    initObservers,
    initDynamicFavicon,
    initMorphingNavbar,
    initCommandPalette,
} from './ui.js';
import {
    initProjects,
    openProjectModal,
    initExperience,
    initStack,
    initNotes,
} from './sections.js';
import { initRoleRotator, initInteractiveAvatar, initNameGlitch } from './hero-fx.js';
import { initBookshelf } from './bookshelf.js';
import { initSnow } from './snow.js';
import { initOrbitalHeader } from './canvas/orbital-header.js';
import { initGlobe3D } from './canvas/globe-3d.js';
import { initStarbaseFooter } from './canvas/starbase-footer.js';

const initializers = [
    initTheme,
    initModal,
    initResumeAndCopy,
    initProjects,
    initExperience,
    initStack,
    initNotes,
    initBookshelf,
    initSnow,
    initObservers,
    initDynamicFavicon,
    initInteractiveAvatar,
    initNameGlitch,
    initRoleRotator,
    initMorphingNavbar,
    initOrbitalHeader,
    initGlobe3D,
    initStarbaseFooter,
    initGitHubGraph,
    () => initCommandPalette(openProjectModal),
];

initializers.forEach((fn) => {
    try {
        fn();
    } catch (err) {
        console.error('Portfolio module init failed:', fn.name || 'anonymous', err);
    }
});
