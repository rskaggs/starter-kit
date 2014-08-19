require(['jquery-private', 'lib/picturefill', 'lib/fastClick'], function ($, picturefill) {
	'use strict';

	var $site = {}, $fastclick;
	function isWebAppMode() {
	    var userAgent = window.navigator.userAgent.toLowerCase();
	    if(!/iphone|ipad|ipod/.test( userAgent ) || !window.navigator.standalone) {
	    	return false;
	    }
	    return true;
	};

	function initFastClick() {
		if ($fastclick !== undefined) {
			$fastclick.destroy();
		}
		$fastclick = new FastClick(document.body);
	}
	
	$site.picturefill = picturefill;
	$site.picturefill();
	$('html').removeClass('no-js');
	$site.webAppMode = isWebAppMode();

	$(document).ready(function () {
		initFastClick();
	});

});
