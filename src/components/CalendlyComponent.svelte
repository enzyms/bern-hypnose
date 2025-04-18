<script>
    let isIframeLoaded = false;

    const scriptSrc = 'https://assets.calendly.com/assets/external/widget.js';
    const scriptId = 'calendly-widget-script';

    // Check if the Calendly script is already loaded
    if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.src = scriptSrc;
        script.id = scriptId;
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            initializeCalendlyWidget();
        };
    } else if (window.Calendly) {
        initializeCalendlyWidget();
    }

    function initializeCalendlyWidget() {
        const container = document.getElementById('calendly-inline-widget');

        // Avoid reinitialization if the iframe already exists
        if (container && !container.querySelector('iframe')) {
            window.Calendly.initInlineWidget({
                parentElement: container,
                prefill: {},
                utm: {}
            });
        }

        // Add listener to detect when the iframe loads
        const iframe = container.querySelector('iframe');
        if (iframe) {
            iframe.addEventListener('load', () => {
                isIframeLoaded = true;
            });
        }
    }
</script>

<div class="calendly-wrapper">
    {#if !isIframeLoaded}
        <div class="loader">
            <div class="spinner"></div>
        </div>
    {/if}
    <div
        id="calendly-inline-widget"
        class="calendly-inline-widget"
        data-resize="true"
        data-url="https://calendly.com/bern-hypnose/erstsitzung?hide_event_type_details=1&background_color=f9f2f1&text_color=000000&primary_color=b91c1c&hide_gdpr_banner=1"
        style="display: {isIframeLoaded ? 'block' : 'none'};"
    ></div>
</div>

<style>
    .calendly-wrapper {
        min-height: 620px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 -20px 12px;
        position: relative;

        @media (min-width: 644px) {
            margin: 0 -48px;
        }

        @media (min-width: 768px) {
            margin: 0 -48px;
            width: calc(100% + 80px);
        }

        @media (min-width: 1280px) {
            position: relative;
            left: -20px;
        }
    }

    .loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 1px solid #b91c1c;
        border-top: 1px solid transparent;
        border-radius: 50%;
        animation: spin 0.4s linear infinite;
        opacity: 0.4;
    }

    .loader p {
        margin-top: 10px;
        font-size: 16px;
        color: #b91c1c;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .calendly-inline-widget {
        position: relative;
        z-index: 0;
        min-width: 100%;
        min-height: 620px;
        margin: 0 -20px;

        @media (min-width: 644px) {
            margin-top: -48px;
        }

        @media (min-width: 644px) {
            margin: -48px 0 -12px;
        }

        @media (min-width: 768px) {
            margin: -64px -56px -24px;
            width: calc(100% + 80px);
        }
    }
</style>
