import utils from '@bigcommerce/stencil-utils';
import CsdHelpers from './helpers'

class CsdProductWishlistCartCount {

	load( context, $scope ) {
		this.context = context;
		this.$scope = $scope;
		this.$productCountWidget = this.$scope.find('.wishlist-and-cart-product-count').not('.loaded');
		this.$productCount = this.$productCountWidget.find('.count');
		this.productId = this.$productCountWidget.length ? this.$productCountWidget.attr('data-product-id') : 0;

    CsdHelpers.onUserInteracted(() => {
	    // TODO: Set Add to Wishlist tracking... not sure if listening to standard BC Wishlists or Swym https://api-docs.swym.it/#get-user-39-s-wishlist-count-wishlistcount
	    this.updateProductCounts();

    });
	}

	updateProductCounts() { 
    // 1. Get count for the current product from the server
    // 2. Get security string for tracking
		if ( ! this.productId ) return;

  	if ( this.productId ) {
			$.ajax({
				type: 'GET',
				crossDomain: true,
				cache: false,
				xhrFields: {
					withCredentials: true
				},  
				dataType: 'json',
				url: `https://consignor.csd.shop/?csd_wishlist_and_product_count_get=${this.productId}`,
				success: data => {
					this.securityNonce = data.nonce;
					const count = Number( data.count );
					if ( count && ! isNaN( count ) ) {
						this.$productCount.html( data.count );
						this.$productCountWidget.addClass('loaded');
					}
				}
			});
  	}
	}

	incrementProductCount( count, $scope ) {
		if ( ! this.$productCount.length ) return;

		$scope = $scope ? $scope : $( document );

		const currentCount = Number( this.$productCount.html() );
		if ( isNaN( currentCount ) ) return;
		if ( ! count || isNaN( count ) ) return;

		this.$productCount.html( currentCount + count );

		if ( ! this.$productCountWidget.hasClass('loaded') ) {
			this.$productCountWidget.addClass('loaded');
		}
	}

	trackCustomerWishlistProducts( productIds, count, customerId ) {
    if ( ! productIds ) return;

    if ( ! Array.isArray( productIds ) ) {
    	productIds = [ productIds ];
    }

    count = count ? count : 1;

    productIds = productIds.map( productId => Number( productId ) );
    productIds = productIds.filter( productId => productId && ! isNaN( productId ) );
    if ( ! productIds.length ) return;

    this.ensureNonce( () => {
			$.ajax({
				type: 'POST',
				crossDomain: true,
				xhrFields: {
					cache: false,
					withCredentials: true
				},  
				dataType: 'json',
				url: `https://consignor.csd.shop/?csd_wishlist_and_product_count_track=${Date.now()}`,
				data: {
					product_ids: productIds,
					customer_id: customerId ? customerId : this.context.customerId,
					type: 'wishlist',
					count: count,
					nonce: this.securityNonce
				}
			});
    });
	}

	ensureNonce( callback ) {
		if ( this.securityNonce ) setTimeout( callback, 0 );
		else { setTimeout( () => this.ensureNonce( callback), 100 ) }
	}

	// changeProductCount( productId, value ) {
	// 	// TODO: live update product count
	// }

	trackAddProductToCart( productId ) {
    if ( ! productId ) return;
    productId = Number( productId );
    if ( isNaN( productId ) ) return;

		$.ajax({
			type: 'POST',
			crossDomain: true,
			cache: false,
			xhrFields: {
				withCredentials: true
			},  
			dataType: 'json',
			url: `https://consignor.csd.shop/?csd_wishlist_and_product_count_track=${Date.now()}`,
			data: {
				product_id: productId,
				type: 'cart',
				count: 1,
				nonce: this.securityNonce
			}
		});
	}

}

const instance = new CsdProductWishlistCartCount();

export default instance;
