import CsdHelpers from './helpers'

class CsdStorefrontCarts {

	// physicalItemOptions: 'lineItems.physicalItems.options',
	// physicalItemOptions: 'lineItems.digitalItems.options',
	// physicalAndDigitalItemOptions: 'lineItems.digitalItems.options%2ClineItems.physicalItems.options',

  static get physicalItemOptions() {
    return 'lineItems.physicalItems.options';
  }

  static get digitalItemOptions() {
    return 'lineItems.digitalItems.options';
  }

  static get physicalAndDigitalItemOptions() {
    return 'lineItems.digitalItems.options%2ClineItems.physicalItems.options';
  }

	getCarts( callback ) {
		CsdHelpers.debug('CsdStorefrontCarts.getCarts');
		fetch("/api/storefront/carts?include=lineItems.physicalItems.options", {
		  "method": "GET",
		  "headers": {
		    "Content-Type": "application/json"
		  }
		})
		.then(response => response.json())
		.then(response => {
			CsdHelpers.debug('CsdStorefrontCarts.getCarts -> response', { response });
			callback( response );
		})
		.catch(err => {
			CsdHelpers.debug('CsdStorefrontCarts.getCarts -> catch error', { err });
		});
	}

	getCart( callback ) {
		this.getCarts( response => {
			if ( ! response || ! response.length ) {
				callback( null );
			} else {
				return response[0];
			}
		} );
	}

	postCarts( params, callback ) {
		const { body, include } = params;
		fetch(`/api/storefront/carts${include ? '?include=' + include : ''}`, {
		  "method": "POST",
		  "headers": {
		    "Content-Type": "application/json"
		  },
		  "body": JSON.stringify( body )
		})
		.then(response => response.json())
		.then(response => {
			CsdHelpers.debug('CsdStorefrontCarts.postCarts -> response', { response });
			callback( response );
		})
		.catch(err => {
			CsdHelpers.debug('CsdStorefrontCarts.postCarts -> catch error', { err });
		});
	}

	deleteCart( cartId ) {
		fetch(`/api/storefront/carts/${cartId}`, {
		  "method": "DELETE",
		  "headers": {
		    "Content-Type": "application/json"
		  }
		})
		.then(response => response.json())
		.then(response => {
			CsdHelpers.debug('CsdStorefrontCarts.deleteCart -> response', { response });
			callback( response );
		})
		.catch(err => {
			CsdHelpers.debug('CsdStorefrontCarts.deleteCart -> catch error', { err });
		});
	}

	addLineItems( params, callback ) {
		const { cartId, lineItems, include } = params;
		const body = { lineItems };
		fetch(`/api/storefront/carts/${cartId}/items${include ? '?include=' + include : ''}`, {
		  "method": "POST",
		  "headers": {
		    "Content-Type": "application/json"
		  },
		  "body": JSON.stringify( body )
		})
		.then(response => response.json())
		.then(response => {
			CsdHelpers.debug('CsdStorefrontCarts.addLineItems -> response', { response });
			callback( response );
		})
		.catch(err => {
			CsdHelpers.debug('CsdStorefrontCarts.addLineItems -> catch error', { err });
		});
	}

	updateLineItems( params, callback ) {
		const { cartId, lineItemId, lineItem, include } = params;
		const body = { lineItem };
		fetch(`/api/storefront/carts/${cartId}/items/${lineItemId}${include ? '?include=' + include : ''}`, {
		  "method": "PUT",
		  "headers": {
		    "Content-Type": "application/json"
		  },
		  "body": JSON.stringify( body )
		})
		.then(response => response.json())
		.then(response => {
			CsdHelpers.debug('CsdStorefrontCarts.updateLineItems -> response', { response });
			callback( response );
		})
		.catch(err => {
			CsdHelpers.debug('CsdStorefrontCarts.updateLineItems -> catch error', { err });
		});
	}

	deleteLineItems( params, callback ) {
		const { cartId, lineItemId, include } = params;
		fetch(`/api/storefront/carts/${cartId}/items/${lineItemId}${include ? '?include=' + include : ''}`, {
		  "method": "DELETE",
		  "headers": {
		    "Content-Type": "application/json"
		  },
		})
		.then(response => response.json())
		.then(response => {
			CsdHelpers.debug('CsdStorefrontCarts.deleteLineItems -> response', { response });
			callback( response );
		})
		.catch(err => {
			CsdHelpers.debug('CsdStorefrontCarts.deleteLineItems -> catch error', { err });
		});
	}

}

const instance = new CsdStorefrontCarts();

export default instance;
