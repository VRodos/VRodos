AFRAME.registerComponent('door-listener', {
    schema: { type: "string", default: "default value" },
    init: function () {
        this.el.setAttribute("link", "on: click; href: " + this.data);
        this.el.addEventListener("click", evt => {
            if (evt.detail && evt.detail.originalEvent && evt.detail.originalEvent.button !== undefined) {
                if (evt.detail.originalEvent.button !== 0) return;
            }
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'door_click');
            }
        });
    }
});
