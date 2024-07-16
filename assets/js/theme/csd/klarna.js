import CsdHelpers from './helpers';

class Klarna {

	load(context) {
		const hasUserConsent = !!$('#KlarnaScript').length
		if ( hasUserConsent ) {
			CsdHelpers.onUserInteracted(() => {
				const $klarnaScript = $('script[data-klarna-base-script]').first()
				if ( $klarnaScript.length ) {
					$klarnaScript.attr( 'src', $klarnaScript.attr( 'data-src' ) )
				}
			});
		}
	}

	refreshPlacements() {
	  window.KlarnaOnsiteService = window.KlarnaOnsiteService || [];
	  window.KlarnaOnsiteService.push({ eventName: 'refresh-placements' });
	}

}

const instance = new Klarna();

export default instance;
