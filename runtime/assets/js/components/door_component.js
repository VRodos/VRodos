AFRAME.registerComponent('door-listener', {
    schema: { type: "string", default: "default value" },
    init: function () {
        this.el.setAttribute("link", "on: click; href: " + this.data);
        this.el.addEventListener("click", e => {
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'door_click');
            }
        });
    }
});
