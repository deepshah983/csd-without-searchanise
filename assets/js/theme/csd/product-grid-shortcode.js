import utils from '@bigcommerce/stencil-utils';
// import CsdWishlist from './wishlist';
import csdSwymWishlistPlus from './swym-wishlist-plus';

class CsdProductGridShortcode {

	load(context) {
		let grids = []
		$('.csd-product-grid-shortcode').each((index, item) => {
			grids.push( this.processGrid( $(item) ) )
		})
		Promise.allSettled(grids).then(() => {
			// CsdWishlist.indicateAllProductsInWishlists();
			csdSwymWishlistPlus.indicateAllProductsInWishlists();
		})
	}

	processGrid($container) {
		return new Promise((resolve, reject) => {
			let productIds = $container.attr('data-product-ids') || ''
			productIds = productIds.split(',')
			productIds = productIds.map(productId => parseInt($.trim(productId)))
			productIds = productIds.filter(productId => !isNaN(productId))
			const promises = productIds.map( this.loadProductCard )
			
			Promise.allSettled(promises).then((data) => {
				let $list = $('<div>', {'class': 'productGrid productGrid--maxCol4'})
				data.forEach((item) => {
					if ( (item.status === 'fulfilled') && item.value ) {
						$list.append( $(item.value) )
					}
				})

				if ($list.length) {
					let $grid = $('<div class="container container-product csd-product-grid-shortcode">')
					$grid.append( $list )
					$container.after( $grid )
					$container.remove()
				}

				resolve()
			})
		})
	}

	loadProductCard(productId) {
		return new Promise((resolve, reject) => {
			productId = parseInt(productId);
			if ( isNaN( productId ) ) {
				return resolve('')
			}
			// utils.api.product.getById(productId, { template: 'products/card' }, (err, response) => {
			utils.api.product.getById(productId, { template: 'csd/products/product-grid-shortcode-item' }, (err, response) => {
				if (response) return resolve(response)
				else return resolve('')
			});		
		})
	}

}

const csdProductGridShortcode = new CsdProductGridShortcode();

export default csdProductGridShortcode;
