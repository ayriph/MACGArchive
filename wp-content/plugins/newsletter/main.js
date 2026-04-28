<html><head><meta name="color-scheme" content="light dark"></head><body><pre style="word-wrap: break-word; white-space: pre-wrap;">// For compatibility with optimizers
if (document.readyState !== 'loading') {
    //console.log('Newsletter loaded (late)');
    tnp_ajax_init();
} else {
    document.addEventListener("DOMContentLoaded", function () {
        //console.log('Newsletter loaded');
        tnp_ajax_init();
    });
}

function tnp_ajax_init() {
    document.querySelectorAll('form.tnp-ajax').forEach(el =&gt; {
        el.addEventListener('submit', async function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            const response = await fetch(newsletter_data.action_url + '?action=tnp&amp;na=sa', {
                method: "POST",
                body: new FormData(this)
            });
            this.innerHTML = await response.text();
        });
    });
}



</pre></body></html>