// Desktop resolution budgeting, shared by runtime quality profiles.
(function () {
    const PERFORMANCE_DESKTOP_RENDER_PIXEL_BUDGET = 1650000;
    const DPR_PIXEL_BUDGET_QUERY_PARAM = 'vrodos_dpr_pixel_budget';
    function readDprPixelBudgetOverride() {
        try {
            const params = new URLSearchParams(window.location.search || '');
            const value = params.get(DPR_PIXEL_BUDGET_QUERY_PARAM);
            if (value === null || value === '') {
                return null;
            }
            const parsed = Number(value);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        } catch (error) {
            return null;
        }
    }

    function getRendererCssSize(renderer) {
        const canvas = renderer && renderer.domElement ? renderer.domElement : null;
        const pixelRatio = renderer && typeof renderer.getPixelRatio === 'function'
            ? renderer.getPixelRatio()
            : (window.devicePixelRatio || 1);
        let width = canvas && canvas.clientWidth ? canvas.clientWidth : 0;
        let height = canvas && canvas.clientHeight ? canvas.clientHeight : 0;

        if ((!width || !height) && renderer && typeof renderer.getSize === 'function') {
            const target = {
                width: 0,
                height: 0,
                set(w, h) {
                    this.width = w;
                    this.height = h;
                    return this;
                },
                divideScalar(scalar) {
                    this.width /= scalar;
                    this.height /= scalar;
                    return this;
                }
            };
            renderer.getSize(target);
            width = width || target.width;
            height = height || target.height;
        }

        if ((!width || !height) && canvas && pixelRatio > 0) {
            width = width || (canvas.width / pixelRatio);
            height = height || (canvas.height / pixelRatio);
        }

        return {
            width: Math.max(1, Math.round(width || window.innerWidth || 1)),
            height: Math.max(1, Math.round(height || window.innerHeight || 1))
        };
    }

    function applyDesktopRenderPixelBudget(component, renderer, targetPixelRatio, options) {
        const cssSize = getRendererCssSize(renderer);
        const overrideBudget = readDprPixelBudgetOverride();
        const activeProfile = window.VRODOS_ACTIVE_DESKTOP_PROFILE || null;
        const activeBudget = activeProfile && activeProfile.renderBudget ? activeProfile.renderBudget : null;
        const isImmersiveXr = Boolean(
            component &&
            typeof component.isVrPresentationActive === 'function' &&
            component.isVrPresentationActive()
        );
        const profilePixelBudget = activeBudget && activeBudget.pixelBudget !== null && Number.isFinite(Number(activeBudget.pixelBudget))
            ? Number(activeBudget.pixelBudget)
            : null;
        const shouldApplyBudget = !isImmersiveXr && (options.isPerformanceQuality || profilePixelBudget !== null || overrideBudget !== null);
        const pixelBudget = overrideBudget !== null
            ? overrideBudget
            : (profilePixelBudget !== null ? profilePixelBudget : PERFORMANCE_DESKTOP_RENDER_PIXEL_BUDGET);
        const originalPixelRatio = targetPixelRatio;
        let budgetPixelRatio = null;

        if (shouldApplyBudget) {
            const cssPixels = cssSize.width * cssSize.height;
            budgetPixelRatio = cssPixels > 0 ? Math.sqrt(pixelBudget / cssPixels) : null;
            if (Number.isFinite(budgetPixelRatio) && budgetPixelRatio > 0) {
                targetPixelRatio = Math.min(targetPixelRatio, budgetPixelRatio);
            }
        }

        targetPixelRatio = Math.max(options.minPixelRatio, Math.min(targetPixelRatio, options.maxPixelRatio));

        if (component) {
            component._vrodosRenderPixelBudget = {
                renderQuality: options.renderQuality,
                devicePixelRatio: window.devicePixelRatio || 1,
                cssWidth: cssSize.width,
                cssHeight: cssSize.height,
                pixelBudget: shouldApplyBudget ? pixelBudget : null,
                budgetPixelRatio,
                originalPixelRatio,
                pixelRatio: targetPixelRatio,
                estimatedRenderPixels: Math.round(cssSize.width * cssSize.height * targetPixelRatio * targetPixelRatio),
                applied: Boolean(shouldApplyBudget && targetPixelRatio < originalPixelRatio - 0.0001),
                source: shouldApplyBudget ? (overrideBudget !== null ? 'query' : (activeProfile ? `desktop-${activeProfile.id}` : 'performance-profile')) : 'none',
                immersiveXr: isImmersiveXr
            };
        }

        return targetPixelRatio;
    }
    VRODOSMaster.RenderPixelBudget = Object.freeze({ apply: applyDesktopRenderPixelBudget });
})();
