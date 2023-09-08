AFRAME.registerComponent('door-listener', {
    schema: { type: "string", default: "default value" },
    init: function () {
        this.el.setAttribute("link", "on: click; href: " + this.data);
    }
});