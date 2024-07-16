import CsdConsignorProfile from './consignor-profile';
import CsdGTM from './google-tag-manager';
// import CsdFacebook from './facebook';
import CsdProductGridShortcode from './product-grid-shortcode';
import CsdKlarna from './klarna';
import CsdLayBuy from './laybuy';
// import CsdCurrencySelector from './currency-selector';
import csdSwymWishlistPlus from './swym-wishlist-plus';
import csdSectionProducts from './section-products';

class CsdGlobal {

	load(context) {

		CsdGTM.load(context);
		// CsdFacebook.load(context);
		CsdKlarna.load(context);
        CsdLayBuy.load(context);
		CsdProductGridShortcode.load(context);
		csdSwymWishlistPlus.load(context);
		csdSectionProducts.load(context);
		
		if ( 'pages/account/edit' === context.template ) {
			CsdConsignorProfile.load(context);
		}
		
		//this.handleConsentManager()
		//this.handleLineClamp();
		//this.handleExpandable();
		//this.handleLoginRedirect();
		//this.handleCurrencySelectors();
		
		if ( ( context.pageType === 'checkout' ) || ( context.template === 'pages/custom/page/page-abandoned-cart-recovery' ) ) {
    	import('./abandoned-cart-recovery').then( module => {
    		module.default.load( context );
    	} );
		}

	}
	
	handleCurrencySelectors() {
		// console.log({context: this.context});
		// currency_selector
		$('.csd-currency-selector').each(( index, item ) => {
			new CsdCurrencySelector( item, this.context );
			// new CsdCurrencySelector( item, this.context.countryCode, this.context.countryFlagCdnBaseUrl, this.context.currencySelector );
		});
	}

	handleLoginRedirect() {
		// Don't process for logged in customers
		if ( this.context.customerEmail ) return;

		// Check browser support
		if ( ! window.location ) return;

		if ( window.location.pathname === '/login.php' ) {
			// Maybe set up redirect on login page
			const lastVisitedPage = CsdHelpers.getCookieValue( 'csdLastVisitedPage' );
			if ( lastVisitedPage ) {
				$('#redirect_to').val(lastVisitedPage);
			}
		} else {
			// Remember the current page
			const currentPagePath = `${location.pathname}${location.search}`
			CsdHelpers.setCookieValue( 'csdLastVisitedPage', currentPagePath, 90 );
		}
		
	}

	handleExpandable() {
		$('.expandable').on('click', '.expand-trigger, .collapse-trigger', event => {
			event.preventDefault();
			$(event.target).closest('.expandable').toggleClass('expanded');
		});

		$('.banners .expandable').on('click', '.expand-trigger', event => {
				console.log('CLICK EX');
			const $expandableContainer = $(event.target).closest('.expandable')
			if ( ! $expandableContainer.hasClass('popup') ) {
				console.log('INIT');
				$expandableContainer.addClass('popup')

				const $moreContainer = $expandableContainer.find('.expandable-more');
				const $wrapper = $('<div>', { 'class': 'wrapper' }).html( $moreContainer.html() )
				const $closeBtn = $('<div>', { 'class': 'expandable-popup-close-btn collapse-trigger' } ).html('x')

				$moreContainer.html('').append( $closeBtn ).append( $wrapper )
			}
		});
	}

	handleLineClamp() {
		const onMoreLessClickHandle = e => {
			let done = false;
			let node = e.target;
			let isLinkClicked = false;
			while (!done) {
				if ( node.tagName === 'A' ) {
					isLinkClicked = true;
				}

				if (!node || (node === e.currentTarget)) {
					done = true;
				}
				node = node.parentNode;
			}

			if (!isLinkClicked) {
				e.preventDefault();
				$(e.currentTarget).toggleClass('expanded');
			}
		}

		// $('.blog-page-header h2, .page-brand .banners h2, .page-category .banners h2, .page-default .banners h2').css('-webkit-box-orient', 'vertical');
		// $('.blog-page-header h2, .page-brand .banners h2, .page-category .banners h2, .page-default .banners h1').on('click', (e) => {
		// $('.blog-page-header, .page-brand .banners, .page-category .banners, .page-default .banners, .homepage-top-heading').on('click', 'h1, h2', (e) => {
		$('.blog-page-header, .page-brand .banners, .page-category .banners').on('click', 'h1, h2', onMoreLessClickHandle);
		$('.moreless').on('click', onMoreLessClickHandle);
	}
	
	handleConsentManager() {
		const el = document.getElementById('consent-manager')

		// Check if consent manager has been loaded
		if ( ! el ) {
			return setTimeout( () => {
				this.handleConsentManager();
			}, 200 );
		}

		CsdHelpers.setCookieValue( 'bc_consent', encodeURIComponent('{"allow":[3,4,2],"deny":[]}') );

		const hasPreferences = document.cookie.indexOf("bc_consent") > 0
		if ( hasPreferences ) {
			el.classList.add('has-preferences');
		} else {
			el.classList.add('no-preferences');
		}
	}

	handleMobileProductCardClick() {
		$(document).on( 'touchstart', '.card-alt-img--hover', (e) => {
			if ( ! $(e.currentTarget).hasClass('csd-touched') ) {
				$(e.currentTarget).addClass('csd-touched');
				e.preventDefault();
				// $(e.currentTarget).toggleClass('csd-mobile-do-hover');
				
				$(e.currentTarget).click();
			}
		} );
	}
}

const csdGlobal = new CsdGlobal();

export default csdGlobal;
