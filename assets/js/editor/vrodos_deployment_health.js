(function () {
    'use strict';

    const config = window.vrodosDeploymentHealth;
    const button = document.querySelector('[data-vrodos-health-run]');
    const spinner = document.querySelector('[data-vrodos-health-spinner]');
    const status = document.querySelector('[data-vrodos-health-status]');
    if (!config || !button || !spinner || !status) return;

    const request = async (action, values = {}) => {
        const body = new URLSearchParams({ action, nonce: config.nonce, ...values });
        const response = await fetch(config.ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
            throw new Error(payload?.data?.message || config.labels.failed);
        }
        return payload.data;
    };

    const finish = (message) => {
        button.disabled = false;
        spinner.classList.remove('is-active');
        status.textContent = message;
    };

    button.addEventListener('click', async () => {
        button.disabled = true;
        spinner.classList.add('is-active');
        status.textContent = config.labels.running;

        try {
            const probe = await request('vrodos_deployment_health_run');
            const deadline = Date.now() + Number(probe.expiresIn || 90) * 1000;
            const poll = async () => {
                try {
                    const result = await request('vrodos_deployment_health_probe_status', { token: probe.token });
                    if (result.status === 'complete') {
                        window.location.reload();
                        return;
                    }
                    if (result.status === 'timeout' || Date.now() > deadline) {
                        finish(config.labels.timeout);
                        return;
                    }
                    window.setTimeout(poll, 2000);
                } catch (error) {
                    finish(error.message || config.labels.failed);
                }
            };
            window.setTimeout(poll, 2000);
        } catch (error) {
            finish(error.message || config.labels.failed);
        }
    });
}());
