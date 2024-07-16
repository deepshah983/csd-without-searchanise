import utils from '@bigcommerce/stencil-utils';
import _ from 'lodash'
import CsdHelpers from './helpers';
import CsdKlaviyo from './klaviyo';
// import csdFacebook from './facebook';

class CsdGTM {

	load(context) {
		this.context = context;
		window.dataLayer = window.dataLayer || [];
		
		CsdKlaviyo.onCustomerSubscribed(() => {
			// Customer subscribed via Klaviyo popup newsletter subscription form
			dataLayer.push({'event': 'newsletterSubscription', 'newsletterSubscriptionType': 'Klaviyo'});
		});

		// csdFacebook.getInstance( FB => {
		// 	console.log('getInstance', { FB });
		// 	FB.getLoginStatus( response => {
		// 		console.log('getLoginStatus', { response });
		// 	});
		// });

		if ( 'pages/subscribed' === context.template ) {
			// Customer subscribed using standard BigCommerce subscription form
			dataLayer.push({'event': 'newsletterSubscription', 'newsletterSubscriptionType': 'BigCommerce'});
		} else if ( 'pages/auth/account-created' === context.template ) {
			// User registered an account via Account registration form
			this.getCurrentCustomerData( customer => {
				if ( customer ) {
					dataLayer.push({
						event: 'accountRegistered',
						accountRegistrationMethod: 'Registration Form',
						customerEmail: customer.email,
						customerPhone: customer.phone,
						customerFirstName: customer.firstName,
						customerLastName: customer.lastName,
						customerCity: context.customerCity,
						customerState: context.customerState,
						customerCountry: context.customerCountry,
						customerIpAddress: context.clientIpAddress,
					});
				}
			});
		} else if ( 'pages/order-confirmation' === context.template ) {
			// Order made
			this.getCurrentCustomerData( customer => {
				if ( customer ) {
					dataLayer.push({
						event: 'orderConfirmationCustomer',
						customerEmail: customer.email,
						customerPhone: customer.phone,
						customerFirstName: customer.firstName,
						customerLastName: customer.lastName,
						customerCity: context.customerCity,
						customerState: context.customerState,
						customerCountry: context.customerCountry,
						customerIpAddress: context.clientIpAddress,
					});
				}
			});
		} else if ( 'pages/search' === context.template ) {
			try {
				const url = new URL(location.href)
				dataLayer.push({'event': 'searchPageView', 'searchQuery': url.searchParams.get('q')});
				// dataLayer.push({'event': 'searchPageView', 'searchQuery': url.searchParams.get('search_query')});
			} catch (err) {}
		} else if ( 'pages/product' === context.template ) {
			this.trackProductPageVisit()
		} else if ( 'pages/category' === context.template ) {
			this.trackProductCategory()
		} else if ( 'pages/brand' === context.template ) {
			this.trackProductBrand()
		} else if ( 'pages/cart' === context.template ) {
			// console.log( 'CART PAGE' );
			// console.log( { context } );
			// cartId: null vs cartId: "e46c2446-bb8f-4d6a-a89b-e103e69f1020"
			// https://developer.bigcommerce.com/theme-objects/cart
			// https://developer.bigcommerce.com/api-docs/storefront/overview
			// https://developer.bigcommerce.com/api-reference/storefront/carts/cart/getacart
		}

		if (context.customerEmail) {
			// Customer is logged in
			var md5 = require('md5');
			dataLayer.push({'customerEmailHashMd5': md5(context.customerEmail)});
		}

		// Submit customer data to GTM
		this.getCurrentCustomerData( customer => {
			if ( customer ) {
				dataLayer.push({
					event: 'customerData',
					customerEmail: customer.email,
					customerPhone: customer.phone,
					customerFirstName: customer.firstName,
					customerLastName: customer.lastName,
					customerCity: context.customerCity,
					customerState: context.customerState,
					customerCountry: context.customerCountry,
					customerIpAddress: context.clientIpAddress,
				});
			}
		});

		CsdHelpers.onUserInteracted(() => {
			// User interacts with the page
			dataLayer.push({'event': 'userInteracted'});
		});

		// Add to cart from products list
		// $(document).on('click', '.product .card .button[data-event-type="product-click"]', (e) => {
		$(document).on('click', '.product .card .button-card-add-to-cart', (e) => {
			try {
				const $productCard = $(e.target).closest('.card')
				const product = this._parseProductCardData($productCard)
				this.trackAddToCart(Object.assign({ quantity: 1 }, product))
			} catch (err) {
				console.log('Exception', err)
			}
		});


		const trackQuickSearch = _.debounce((searchQuery) => {
			dataLayer.push({ 'event': 'quickSearch', 'searchQuery': searchQuery });
		}, 1000)
    utils.hooks.on('search-quick', (event) => {
      const searchQuery = $(event.currentTarget).val();

      // server will only perform search with at least 3 characters
      if (searchQuery.length < 3) {
          return;
      }

      trackQuickSearch(searchQuery)
    });

    try {
	    let bcConsent = CsdHelpers.getCookieValue('bc_consent');
	    bcConsent = decodeURIComponent(bcConsent)
	    bcConsent = bcConsent ? JSON.parse(bcConsent) : null
	    const allowedCookies = bcConsent && bcConsent.allow ? bcConsent.allow : []
	    const isFunctionalCookiesAllowed = bcConsent.allow.indexOf(2) !== -1
	    const isAnalyticsCookiesAllowed = bcConsent.allow.indexOf(3) !== -1
	    const isAdvertisingCookiesAllowed = bcConsent.allow.indexOf(4) !== -1
	    const isAllCookiesAllowed = isFunctionalCookiesAllowed && isAnalyticsCookiesAllowed && isAdvertisingCookiesAllowed
	    const isAllCookiesDenied = ! isFunctionalCookiesAllowed && ! isAnalyticsCookiesAllowed && ! isAdvertisingCookiesAllowed
			dataLayer.push({
				'hasUserCookiePreferences': Number(!!bcConsent),
				'isFunctionalCookiesAllowed': Number(isFunctionalCookiesAllowed),
				'isAnalyticsCookiesAllowed': Number(isAnalyticsCookiesAllowed),
				'isAdvertisingCookiesAllowed': Number(isAdvertisingCookiesAllowed),
				'isAllCookiesAllowed': Number(isAllCookiesAllowed),
				'isAllCookiesDenied': Number(isAllCookiesDenied)
			});

			// 2 - functional cookies
			// 3 - analytics cookies
			// 4 - advertising cookies
			
			// If user has disabled all cookies, we need to flush this setting
			// because this is most likely past mistake
			if ( ! isAllCookiesAllowed ) {
		    let consetResetFlag = CsdHelpers.getCookieValue('csd_verify_consent');

		    // Before resetting the user consent, we need to check if we've set the flag that we did it already
		    // This is to prevent resetting const if user has consciously chosen to reset the state
		    if ( ! consetResetFlag ) {
		    	// Reset user consent
					CsdHelpers.removeCookie('bc_consent');
	
					// Set a flaf that we've flushed the user consent
					CsdHelpers.setCookieValue('csd_verify_consent', 1, 1);

					// Reload page
					window.location.reload();
		    }
			}

    }
    catch (err) {}

	}

	getCurrentCustomerData( callback ) {
		const graphQlQuery = `
			query Customer {
			  customer {
			    firstName
			    lastName
			    email
			    phone
			  }
			}
		`;
		fetch('/graphql', {
		  method: 'POST',
		  credentials: 'same-origin',
		  headers: {
		      'Content-Type': 'application/json',
		      'Authorization': `Bearer ${this.context.storefrontApiToken}`
		  },
		  body: JSON.stringify({
		    query: graphQlQuery
		  }),
		})
		.then(res => res.json())
		.then(json => {
			if ( json.data && json.data.customer ) {
				return callback( json.data.customer );
			} else {
				return callback( null );
			}
		});
	}

	trackProductCategory() {
		var eventObject = { 'event': 'categoryPageView' }

		const title = $.trim( $('.page--category h1.page-heading').text() )
		if (title) {
			eventObject.categoryTitle = title
		}

		var products = this._collectProductsList( $('#product-listing-container') )

		eventObject.products = products

		dataLayer.push(eventObject);
	}

	trackProductBrand() {
		var eventObject = { 'event': 'brandPageView' }

		const title = $.trim( $('.page-brand h1.page-heading').text() )
		if (title) {
			eventObject.brandTitle = title
		}

		var products = this._collectProductsList( $('#product-listing-container') )

		eventObject.products = products

		dataLayer.push(eventObject);
	}

	_collectProductsList($container) {
		var products = []

		$container.find('.productGrid .product .card').each((index, item) => {
			const $item = $(item)
			const product = this._parseProductCardData( $(item) )
			products.push(product)
		})

		return products
	}

	_parseProductCardData($productCard) {
		var product = {}
		
		const title = $.trim( $productCard.attr('data-name') )
		if (title) {
			product.name = title
		}

		const id = $.trim( $productCard.attr('data-entity-id') )
		if (id) {
			product.id = parseInt(id, 10)
			product.quantity = 1
		}

		const brand = $.trim( $productCard.attr('data-product-brand') )
		if (brand) {
			product.brand = brand
		}

		const price = $.trim( $productCard.attr('data-product-price') )
		if (price) {
			product.price = parseFloat(price.replace(/[^\d\.]/gi, ''))
		}

		const currency = $.trim( $productCard.attr('data-product-currency') )
		if (currency) {
			product.currency = currency ? currency : 'GBP'
		}

		let categories = $.trim( $productCard.attr('data-product-category') ).split(',')
		categories = categories.filter(category => !!category)
		if (categories.length) {
			var category = categories[0].split('/')
			product.category = category.pop()
		}

		return product
	}

	trackProductPageVisit() {
		if ( !window.product ) return

		var eventObject = { 'event': 'productPageView' }
		var productObject = {}
		
		if (product.id) {
			productObject.id = parseInt(product.id, 10)
		}
		
		if (product.title) {
			productObject.name = product.title
		}

		if (product.brand && product.brand.name) {
			productObject.brand = product.brand.name
		}

		if (product.category && product.category.length) {
			productObject.category = product.category[0]
		}

		if (product.price && product.price.without_tax && product.price.without_tax.value) {
			productObject.price = product.price.without_tax.value
			productObject.currency = product.price.without_tax.currency
		}
		productObject.currency = productObject.currency ? productObject.currency : 'GBP'

		eventObject.product = productObject

		var products = this._collectProductsList( $('.page-product') )
		eventObject.products = products

		dataLayer.push(eventObject);
	}

	trackProductQuickView( $container ) {
		var eventObject = { 'event': 'productQuickView' }
		var product = {}
		const $product = $container.find('.productView')

		const productId = parseInt($product.attr('data-entity-id'), 10)
		if (productId && !isNaN(productId)) {
			product.id = productId
		} else {
			return
		}

		var price = $.trim( $product.attr('data-product-price') )
		price = parseFloat(price.replace(/[^\d\.]/gi, ''))
		if ( price && !isNaN(price) ) {
			product.price = price
		} else {
			return
		}

		const currency = $product.attr('data-product-currency')
		if ( currency ) {
			product.currency = currency
		} else {
			return
		}

		const productTitle = $.trim( $product.find('.productView-title.main-heading').text() )
		if (productTitle) {
			product.name = productTitle
		}

		const brand = $product.attr('data-product-brand')
		if (brand) {
			product.brand = brand
		}

		const categories = $product.attr('data-product-category').split(',').map(item => $.trim( item )).filter(item => !!item)
		if (categories.length) {
			product.categories = categories
			product.category = categories[0]
		}

		eventObject.product = product

		dataLayer.push(eventObject);
	}

	trackAddToCart(params) {
		const id = parseInt( params.id, 10 )
		const quantity = parseInt( params.quantity, 10 )
		const price = parseFloat( params.price )
		if (!id || !quantity || !price) return;
		const total = price * quantity

		var eventObject = {
			event: 'addToCart',
			product: {
				id,
				quantity,
				total,
				currency: params.currency,
			}
		}

		dataLayer.push(eventObject);
	}


}

const csdGTM = new CsdGTM();

export default csdGTM;
