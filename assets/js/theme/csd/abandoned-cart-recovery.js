import utils from '@bigcommerce/stencil-utils';
import CsdHelpers from './helpers';

class AbandonedCartRecovery {

	load(context) {
		this.context = context;
		CsdHelpers.debug( 'AbandonedCartRecovery', { context } );

		if ( context.pageType === 'checkout' ) {
			this.trackAbandonedCart();
		} else if ( context.template === 'pages/custom/page/page-abandoned-cart-recovery' ) {
			this.handleAbandonedCartRecovery();
		}
	}

	trackAbandonedCart() {
		CsdHelpers.debug( 'trackAbandonedCart' );
		utils.api.cart.getCart({}, (err, response) => {
			CsdHelpers.debug( 'getCart', { err, response } );
			if ( response ) {
				$.ajax({
					type: 'POST',
					crossDomain: true,
					cache: false,
					xhrFields: {
						withCredentials: true
					},  
					dataType: 'json',
					url: `https://consignor.csd.shop/?csd_track_abandoned_cart=yes`,
					data: { cart_id: response.id }
				});
			}
		});
	}

	confirmRecoveredCartId( token, recoveredCartId, callback ) {
		CsdHelpers.debug( 'confirmRecoveredCartId' );

		$.ajax({
			type: 'POST',
			crossDomain: true,
			cache: false,
			xhrFields: {
				withCredentials: true
			},  
			dataType: 'json',
			url: `https://consignor.csd.shop/?csd_confirm_recovered_abandoned_cart=yes`,
			data: { cart_id: recoveredCartId, token: token },
			success: data => {
				CsdHelpers.debug( 'success', { data } );
				if ( data.error ) {
					return this.displayError( 'Recovery of your abandoned cart cannot be successfully completed' );
				}

				return callback();
			},
			error: ( jqXHR, textStatus, errorThrown ) => {
				CsdHelpers.debug( 'error', { textStatus, errorThrown } );
				return this.displayError( 'An error occured before your abandoned cart recovery was completed' );
			}
		});
	}

	handleAbandonedCartRecovery() {
		CsdHelpers.debug( 'handleAbandonedCartRecovery' );
		const searchParams = new URLSearchParams( location.search );
		const token = searchParams.get('token');
		if ( ! token ) {
			return this.displayError( 'Abandoned cart token is missing...' );
		}

		this.clearCart( _ => {
			this.recoverCart( token, result => {
				if ( result !== true ) {
					return this.displayError( result );
				}

				// All good, redirect
				this.displaySuccess( 'Your abandoned cart has been successfully recovered. Redirecting to cart page...' );

				window.location = '/cart.php';
			});
		});
	}

	clearCart( callback ) {
		CsdHelpers.debug( 'clearCart' );
		utils.api.cart.getCart({}, (err, response) => {
			CsdHelpers.debug( 'getCart', { err, response } );
			if ( response ) {
			  fetch( `/api/storefront/carts/${response.id}`, {
			    method: "DELETE",
			    headers: {
			      "Content-Type": "application/json"
			    }
			  })
			  .then(response => {
					return setTimeout( callback, 0 );
			  })
			  .catch(error => {
					return setTimeout( callback, 0 );
			  });
			} else {
				return setTimeout( callback, 0 );
			}
		});
	}

	recoverCart( token, callback ) {
		CsdHelpers.debug( 'recoverCart', { token } );
		$.ajax({
			type: 'GET',
			crossDomain: true,
			cache: false,
			xhrFields: {
				withCredentials: true
			},  
			dataType: 'json',
			url: `https://consignor.csd.shop/?csd_abandoned_cart_recovery=yes&token=${token}`,
			success: data => {
				CsdHelpers.debug( { data } );
				if ( data.error ) {
					return callback( data.error );
				}

				// Create cart
				this.createCart( data.cart.items, cart => {
					CsdHelpers.debug( 'createCart response', { cart } );
					if ( ! cart ) {
						return this.displayError( 'Cannot recover abandoned cart' );
					}

					this.confirmRecoveredCartId( token, cart.id, _ => {
						CsdHelpers.debug( 'confirmRecoveredCartId callback' );
						// Apply coupon
				    utils.api.cart.applyCode( data.cart.coupon, (err, response) => {
				      if (response.data.status === 'success') {
				        return callback( true );
				      } else {
				        return callback( response.data.errors.join( '<br />' ) );
				      }
				    });
					});

				} );
			},
			error: ( jqXHR, textStatus, errorThrown ) => {
				return this.displayError( 'There was an error recovering your cart' );
			}
		});
	}

	createCart( cartItems, callback ) {
		CsdHelpers.debug( 'createCart', { cartItems } );
		const payload = {
			lineItems: cartItems
		};
		CsdHelpers.debug( 'payload', { payload } );
		// TODO NEXT: This method not working with the supplied data. Try doing it manualy from developer console with the same products.
		// maybe just the product ids are missing? try on live also.. then replace with staging product id and variant id
	  fetch( '/api/storefront/carts', {
	    method: "POST",
	    credentials: "same-origin",
	    headers: {
	      "Content-Type": "application/json"
	    },
	    body: JSON.stringify( payload ),
	  })
	  .then( response => response.json() )
	  .then( response => callback( response ) )
	  .catch( error => {
	  	console.error( error );
	  	callback( null );
	  } );
	}

	displayError( message ) {
		this.displayNotification( message, 'error' );
		console.error( message );
	}

	displaySuccess( message ) {
		this.displayNotification( message, 'success' );
	}

	displayNotification( message, type ) {
		$('.csd-abandoned-cart-recovery-status').removeClass('error').removeClass('success').addClass( type ).html( message );
		$('.csd-abandoned-cart-recovery-spinner').remove();
	}

}

const abandonedCartRecovery = new AbandonedCartRecovery();

export default abandonedCartRecovery;
