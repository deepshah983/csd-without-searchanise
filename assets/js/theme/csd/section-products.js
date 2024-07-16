import csdSwymWishlistPlus from '../csd/swym-wishlist-plus';
import CsdHelpers from '../csd/helpers';
import CsdScrollingProducts from '../csd/scrolling-products';

/*
	Dynamically loads products into a grid by provided HTML attributes
	Selector: .container-product[data-section-products]
	
	Attribute "data-load-on-interacted": will load products only when user interacted
	Attribute "data-url": link to a category or brand page to load products from
	Attribute "data-paginate": will paginate category or brand page to load all products there, otherwise will load products from the first page only
	Attribute "data-limit": limits the amount of products displayed after loading

	Sample container:
	<div class="container container-product" data-section-products data-load-on-interacted data-url="/shop/women/deals/featured-deals?sort=newest" data-limit="24">
    <h2 class="page-heading"><a href="https://csd.shop/shop/women/deals/?sort=newest">Designer <span style="color:#900;">Deals</span> Up To 90% Off</a></h2>
    <ul class="productGrid loaded-products-container">
    </ul>
	</div>
*/

class CsdSectionProducts {

	load( context ) {

		// Load when user interacts
		CsdHelpers.onUserInteracted(() => {
			$('.container-product[data-section-products][data-load-on-interacted]').not('.processing, .processed').each(( index, item ) => {
				const $container = $( item );
				this.loadSectionProducts( $container, () => {
					if ( $container.hasClass( 'container-scrolling-products' ) ) {
						CsdScrollingProducts( $container.find('.loaded-products-container') );
					}
				} );
			});
		});

		// Load on page load
		$('.container-product[data-section-products]').not('[data-load-on-interacted], .processing, .processed').each(( index, item ) => {
			const $container = $( item );
			this.loadSectionProducts( $container, () => {
				if ( $container.hasClass( 'container-scrolling-products' ) ) {
					CsdScrollingProducts( $container.find('.loaded-products-container') );
				}
			} );
		});

	}

	parseProductSortMap( categoryDescription ) {
		// const matches = categoryDescription && categoryDescription.toLowerCase().match( /\<\!\-\- sort order: (.*?) \-\-\>/i );
		const matches = categoryDescription && categoryDescription.toLowerCase().match( /\<div\s+class=\"CsdCategoryProductsSortOrder\"\>(.*?)\<\/div\>/i );
		let productsSortMap = undefined;
		if ( matches && $.isArray( matches ) && ( matches.length === 2 ) ) {
			productsSortMap = {};
			let sortOrder = $.trim( matches[ 1 ] );
			sortOrder = sortOrder.split(',');
			sortOrder = sortOrder.map(item => $.trim(item));
			sortOrder = sortOrder.filter(item => !!item);
			sortOrder.forEach( (id, index) => {
				id = Number( id );
				productsSortMap[ id ] = index + 1;
			} );
		}

		return productsSortMap;
	}


	loadProductsFromCategory( url ) {
		return new Promise(( resolve, reject ) => {
			$.ajax({
				url: url, 
				processData : false,
				cache: true,
				success: (data) => {
					const $products = $(data).find('#product-listing-container').find('.productGrid li.product');
					const nextPageUrl = $(data).find('#product-listing-container .pagination-item--next').first().find('.pagination-link').attr('href');

					// <div id="CsdCategoryProductsSortOrder">1485,1484,1483,1482,1481,1480,1479,1478,1477,1466,1467,1475,1474,1473,1472,1471,1470,1469,1468,1476</div> 
					const categoryDescription = $(data).find('.container--category .category-description').html();
					const productsSortMap = this.parseProductSortMap( categoryDescription );

					return resolve( {
						$products,
						productsSortMap,
						nextPageUrl
					} );
				}
			});
		});
	}

	loadAllProductsFromCategory( url ) {
		// Remove page number initially
		url = url.replace(/&page=\d+/gi, '')

		const _loadAllProductsFromCategory = (callback, acc, page) => {
			acc = acc || {};
			page = page || 1;
			const pageUrl = `${url}&page=${page}`
			// const result = this.loadProductsFromCategory( url );

			this.loadProductsFromCategory( pageUrl ).then(( result ) => {
				if ( result.$products ) {
					acc.$products = acc.$products ? acc.$products.add( result.$products ) : result.$products;
				}

				if ( result.productsSortMap ) {
					acc.productsSortMap = result.productsSortMap;
				}

				if ( result.nextPageUrl ) {
					setTimeout(() => _loadAllProductsFromCategory( callback, acc, page + 1 ), 0 );
				} else {
					callback( acc );
				}

			});
		};
		_loadAllProductsFromCategory.bind(this);

		return new Promise(( resolve, reject ) => {
			_loadAllProductsFromCategory( loadedData => {
				return resolve( loadedData )
			});
		});
	}

	sortProductsBySortMap( $products, productsSortMap ) {
		const $productsSorted = $products.sort( (a, b) => {
			a = $(a).find('.card[data-entity-id]').first().attr('data-entity-id');
			a = Number(a);
			a = productsSortMap[a] ? productsSortMap[a] : -1;
			b = $(b).find('.card[data-entity-id]').first().attr('data-entity-id');
			b = Number(b);
			b = productsSortMap[b] ? productsSortMap[b] : -1;

			if ( a < b ) return -1;
			else if ( a > b ) return 1;
			else return 0;
		});

		return $productsSorted;
	}

	loadSectionProducts( $container, callback ) {
		if ( $container.hasClass('processing') || $container.hasClass('processed') ) return;
		
		$container.addClass('processing');
		const url = $container.attr('data-url');
		if ( url ) {
			// AJAX
			const paginate = $container.attr('data-paginate') ? true : false;
			const limit = Number( $container.attr('data-limit') ) || 24;
			const loadingFoo = paginate ? this.loadAllProductsFromCategory.bind(this) : this.loadProductsFromCategory.bind(this);
			loadingFoo(url).then(( loadedProductsData ) => {

				// Maybe sort products
				let $products = loadedProductsData.$products;
				if ( loadedProductsData.productsSortMap ) {
					$products = this.sortProductsBySortMap( $products, loadedProductsData.productsSortMap );
				}

				// Maybe hide sold out products
				if ( $container.attr('data-hide-sold-products') ) {
					$products = $products.filter( ( index, item ) => {
						return !$(item).find('.badge-sold').length;
					} );
				}

				$container.find('.loaded-products-container').append( $products.slice(0, limit) );
				csdSwymWishlistPlus.indicateAllProductsInWishlists();
				$container.addClass('processed').removeClass('processing');
				if (callback) setTimeout(callback, 0);
			});
		} else {
			// GraphQL
			const categoryDescription = $container.find('.category-description').html();
			const productsSortMap = this.parseProductSortMap( categoryDescription );

			// Maybe sort products
			if ( productsSortMap ) {
				let $products = $container.find('.productGrid li.product');
				$products = this.sortProductsBySortMap( $products, productsSortMap );
				$products.detach();
				$container.find('.productGrid').append( $products );
			}

			csdSwymWishlistPlus.indicateAllProductsInWishlists();
			$container.addClass('processed').removeClass('processing');
			if (callback) setTimeout(callback, 0);
		}

	}

}

const instance = new CsdSectionProducts();
export default instance;
