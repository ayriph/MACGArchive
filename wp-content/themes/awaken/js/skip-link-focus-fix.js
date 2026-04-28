<html><head><meta name="color-scheme" content="light dark"></head><body><pre style="word-wrap: break-word; white-space: pre-wrap;">( function() {
	var is_webkit = navigator.userAgent.toLowerCase().indexOf( 'webkit' ) &gt; -1,
	    is_opera  = navigator.userAgent.toLowerCase().indexOf( 'opera' )  &gt; -1,
	    is_ie     = navigator.userAgent.toLowerCase().indexOf( 'msie' )   &gt; -1;

	if ( ( is_webkit || is_opera || is_ie ) &amp;&amp; document.getElementById &amp;&amp; window.addEventListener ) {
		window.addEventListener( 'hashchange', function() {
			var element = document.getElementById( location.hash.substring( 1 ) );

			if ( element ) {
				if ( ! /^(?:a|select|input|button|textarea)$/i.test( element.tagName ) )
					element.tabIndex = -1;

				element.focus();
			}
		}, false );
	}
})();
</pre></body></html>