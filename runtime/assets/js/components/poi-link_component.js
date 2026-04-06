AFRAME.registerComponent('link-listener', {
    schema: { type: "string"},
    init: function () {

        if (this.data){
            this.el.addEventListener("click", e => {
                if (!this.data.match(/^https?:\/\//i)) {
                    this.data = '//' + this.data;
                }
                if (typeof window.gtag === 'function') {
                    window.gtag('event', 'poilink_link_open');
                }
                window.open(this.data);
            });
        }
    }
});
