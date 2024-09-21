<script>
    import { onMount } from 'svelte';

    onMount(() => {
        function deferLoading() {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    setTimeout(() => loadSplineScene(), 100);
                });
            } else {
                setTimeout(() => loadSplineScene(), 100);
            }
        }

        deferLoading();

        async function loadSplineScene() {
            function isMobileDevice() {
                return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            }

            if (isMobileDevice()) {
                const fallbackBg = document.getElementById('fallbackBg');
                fallbackBg?.classList.remove('hidden');
            } else {
                const canvas3d = document.getElementById('canvas3d');
                canvas3d?.classList.remove('hidden');
                await loadSpline();
            }
        }

        async function loadSpline() {
            try {
                const { Application } = await import('@splinetool/runtime');
                const canvas = document.getElementById('canvas3d');
                document.app = new Application(canvas);

                await document.app.load('https://prod.spline.design/Q-ARPU7hL1T2t409/scene.splinecode');
                setupEventListeners();
            } catch (error) {
                console.error('Failed to load Spline scene:', error);
            }
        }

        function setupEventListeners() {
            function menuClose() {
                const menu = document.querySelector('.menu');
                const menuToggleBtn = document.querySelector('.menu-toggle');
                menuToggleBtn?.setAttribute('aria-expanded', 'false');
                menuToggleBtn?.setAttribute('aria-label', 'Close Menu');
                menu?.classList.remove('is-visible');
            }

            document.querySelector('#menu-items li:nth-child(1) a')?.addEventListener('click', () => {
                document.app.emitEvent('mouseDown', 'trigger-to-1');
                menuClose();
            });
            document.querySelectorAll('#menu-items li:nth-child(2) a').forEach((item) => {
                item?.addEventListener('click', () => {
                    document.app.emitEvent('mouseDown', 'trigger-to-2');
                    menuClose();
                });
            });
            document.querySelector('#menu-items li:nth-child(3) a')?.addEventListener('click', () => {
                document.app.emitEvent('mouseDown', 'trigger-to-3');
                menuClose();
            });
            document.querySelector('#menu-items li:nth-child(4) a')?.addEventListener('click', () => {
                document.app.emitEvent('mouseDown', 'trigger-to-4');
                menuClose();
            });
            document.querySelector('#menu-items li:nth-child(5) a')?.addEventListener('click', () => {
                document.app.emitEvent('mouseDown', 'trigger-to-3');
                menuClose();
            });
        }
    });
</script>
