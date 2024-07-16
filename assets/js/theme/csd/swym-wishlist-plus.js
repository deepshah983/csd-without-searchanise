import utils from '@bigcommerce/stencil-utils';
import CsdHelpers from './helpers'
import csdProductWishlistCartCount from './product-wishlist-cart-count'
import csdStorefrontCarts from './storefront-carts'

class CsdSwymWishlistPlus {

	load( context ) {
		this.context = context;
		CsdHelpers.debug( 'CsdSwymWishlistPlus.load', { context } );

		if ( ! window.SwymCallbacks ) {
			window.SwymCallbacks = [];
		}
		window.SwymCallbacks.push( swat => {
			CsdHelpers.debug( 'CsdSwymWishlistPlus.load -> SwymCallbacks call', { swat } );
			this.swat = swat;
			this.init();
		});

	}

	init() {
		CsdHelpers.debug( 'CsdSwymWishlistPlus.init' );
		this.customerSession = CsdHelpers.getCookieValue('swym-session-id');
		this.updateProductDetailsWishlistProductCount();
		this.setupProductCardEvents();
		this.indicateAllProductsInWishlists();
		this.updateMenuWishlistCount();
		this.handleAccountWishlistsPage();
	}

	displayEmptyWishlistPageContent() {
		const $wishlistPage = $('#swymWishlistPage');
		$wishlistPage.removeClass( 'loading-container' );
		$wishlistPage.html( `
			<div class="swym-empty-wishlist">
				<p>Star your favourite pieces to start building your wishlist</p>
				<a class="button button--alt" href="/shop/women/we-love/">Get Inspired</a>
			</div>
		` );
	}

	handleAccountWishlistsPage () {
		CsdHelpers.debug( 'CsdSwymWishlistPlus.handleAccountWishlistsPage' );
		const $wishlistPage = $('#swymWishlistPage');
		if ( ! $wishlistPage.length ) return;

		this.swat.fetch( products => {
			CsdHelpers.debug( 'CsdSwymWishlistPlus.handleAccountWishlistsPage', { products } );
			if ( ! products.length ) {
				this.displayEmptyWishlistPageContent();
				return;
			}
			
			utils.api.cart.getCart({includeOptions: true}, (err, response) => {
				console.log('getCart', {response, err});
				let cartProducts = [];
				if ( response && response.lineItems && response.lineItems.physicalItems && response.lineItems.physicalItems.length ) {
					cartProducts = response.lineItems.physicalItems.map( lineItem => {
						return `${lineItem.productId}_${lineItem.variantId}`;
					} );
				}

				const updateProductBySelectedOptions = $card => {
					CsdHelpers.debug( 'CsdSwymWishlistPlus.handleAccountWishlistsPage -> updateProductBySelectedOptions', { $card } );
					const $form = $card.find('.form');
					const productId = $form.find('input[name="product_id"]').val();

				  utils.api.productAttributes.optionChange( productId, $form.serialize(), (err, response) => {
						CsdHelpers.debug( 'CsdSwymWishlistPlus.handleAccountWishlistsPage -> updateProductBySelectedOptions -> optionChange', { err, response } );

				    const attributesData = response.data || {};

						$card.attr('data-product-id', productId);
						$card.attr('data-variant-id', attributesData.v3_variant_id);

				    if ( attributesData.price ) {
					    const price = attributesData.price.without_tax || attributesData.price.with_tax;
					    $card.find('.price--withoutTax[data-product-price-without-tax]').html( price.formatted );
				    }

				    if ( attributesData.image && attributesData.image.data ) {
				    	$card.find( '.card-main-image .card-image' ).attr( 'src', attributesData.image.data.replace('{:size}', '300x300') );
				    }

				    // Update cart status
				    const productKey = `${productId}_${attributesData.v3_variant_id}`;
				    const isProductInCart = cartProducts.indexOf(productKey) !== -1;
						if ( isProductInCart ) {
							$card.addClass( 'in-cart' );
						} else {
							$card.removeClass( 'in-cart' );
						}
				  });
				};

				const variantIdsMap = products.reduce( ( acc, product ) => {
					const values = acc[ product.empi ] ? acc[ product.empi ] : [];
					values.push( product.epi );
					acc[ product.empi ] = values;
					return acc;
				}, {} );

				const productIds = products.map( product => product.empi );

				const promises = productIds.map( this.loadProductCard );

				Promise.allSettled( promises ).then( ( data ) => {
					let $list = $( '<div>', { 'class': 'productGrid productGrid--maxCol4' } );
					data.forEach( ( item ) => {
						if ( ( item.status === 'fulfilled' ) && item.value ) {
							const $card = $( item.value );
							const $cardWishlistLink = $card.find( '.product-wishlist[data-product-id]' );

							// Append variant data so we can remove/add this item from/to wishlist
							const productId = Number( $cardWishlistLink.first().attr( 'data-product-id' ) );
							const variantId = variantIdsMap[ productId ] && variantIdsMap[ productId ].length ? variantIdsMap[ productId ][ 0 ] : undefined;
							if ( variantId ) {
								variantIdsMap[ productId ].shift();
								$cardWishlistLink.attr( 'data-variant-id', variantId );
							}
							const productKey = `${productId}_${variantId}`;
							const isProductInCart = cartProducts.indexOf( productKey ) !== -1;
							if ( isProductInCart ) {
								$card.addClass( 'in-cart' );
							}

							$card.attr('data-product-id', productId);
							$card.attr('data-variant-id', variantId);

							// Activate selected variant
							const variantsAttr = $card.attr('data-variants');
							if ( variantsAttr ) {
								try {
									const variants = JSON.parse( variantsAttr );
									const selectedVariant = variants.filter( item => item.node.entityId == variantId )[0].node;

									const $optionsContainer = $card.find('.productView-options-inner');
									selectedVariant.options.edges.forEach( item => {
										const node = item.node;
										const optionId = node.entityId;
										const value = node.values.edges[0].node.entityId;
										$optionsContainer.find(`[name="attribute[${optionId}]"]`).val( value );

										if ( node.isRequired ) {
											$optionsContainer.find(`select[name="attribute[${optionId}]"]`).find('option').not('[data-product-attribute-value]').remove();
										}
									});
								} catch (err) {
									console.log( { err } );
								}
							}

							$list.append( $card );
						}
					})

					if ( $list.length ) {
						let $grid = $('<div class="container container-product">');
						$grid.append( $list );
						$wishlistPage.append( $grid );
						$wishlistPage.removeClass( 'loading-container' );

						this.indicateAllProductsInWishlists( true );
						this.setupProductCardEvents( result => {
							CsdHelpers.debug( 'CsdSwymWishlistPlus.handleAccountWishlistsPage -> setupProductCardEvents callback call', { result } );
							if ( result.action === 'removed' ) {
								$(`.product-wishlist[data-product-id="${result.productId}"][data-variant-id="${result.variantId}"]`).closest('.swym-wishlist-product').remove();

								this.swat.fetch( products => {
									CsdHelpers.debug( 'CsdSwymWishlistPlus.handleAccountWishlistsPage -> fetch after removal', { products } );
									if ( ! products.length ) {
										this.displayEmptyWishlistPageContent();
										return;
									}
								} );
							}
						} );

						// Initially update variable product details
						$list.find('.swym-wishlist-product[data-variants]').each( (index, item) => {
							console.log("each selected item");
							updateProductBySelectedOptions( $(item) );
						} );

						// Setup add to cart events
						$list.on( 'submit', '.form[data-cart-item-add]', e => {
							CsdHelpers.debug( 'CsdSwymWishlistPlus.handleAccountWishlistsPage -> Add to cart', { e } );
							e.preventDefault();
							const $card = $(e.currentTarget).closest('.swym-wishlist-product');
							const isProductInCart = $card.hasClass('in-cart');
							if ( isProductInCart ) return;
							const $form = $(e.currentTarget).closest('.form');

							utils.api.cart.itemAdd( new FormData( $form.get(0) ), (err, response) => {
								CsdHelpers.debug( 'CsdSwymWishlistPlus.handleAccountWishlistsPage -> itemAdd', { err, response } );
								const errorMessage = err || response.data.error;
								if ( ! errorMessage ) {
									$card.addClass('in-cart');
									console.log("in cart");

									const productId = $card.attr('data-product-id');
									const variantId = $card.attr('data-variant-id');
									const productKey = `${productId}_${variantId}`;
									if ( cartProducts.indexOf( productKey ) === -1 ) {
										cartProducts.push( productKey );
									}
								}
							 });
						} );

						// Setup option change events
						$list.on( 'change', '.form[data-cart-item-add]', e => {
							const $card = $(e.currentTarget).closest('.swym-wishlist-product');
							CsdHelpers.debug( 'CsdSwymWishlistPlus.handleAccountWishlistsPage -> product form change', { e } );
							updateProductBySelectedOptions( $card );
						});
					}

				}); // end Promise.allSettled

			});  // end utils.api.cart.getCart
		});
	}

	loadProductCard( productId ) {
		return new Promise((resolve, reject) => {
			productId = parseInt(productId);
			if ( isNaN( productId ) ) {
				return resolve('')
			}
			// Re-using product-grid-shortcode-item template for rendering product card
			// utils.api.product.getById(productId, { template: 'csd/products/product-grid-shortcode-item' }, (err, response) => {
			utils.api.product.getById(productId, { template: 'csd/products/swym-wishlist-product' }, (err, response) => {
				if (response) return resolve(response)
				else return resolve('')
			});		
		})
	}

	onWishlistUpdated() {
		this.updateProductDetailsWishlistProductCount( true );
		this.updateMenuWishlistCount();
	}

	updateMenuWishlistCount() {
		CsdHelpers.debug( 'CsdSwymWishlistPlus.updateMenuWishlistCount' );
		this.swat.fetch( products => {
			CsdHelpers.debug( 'CsdSwymWishlistPlus.updateMenuWishlistCount -> ', { products } );
			const count = products ? products.length : 0;
			$('.wishlist-items-count').addClass('ready').html( count );
		} );
	}

	setupProductCardEvents( callback ) {
		CsdHelpers.debug( 'CsdSwymWishlistPlus.setupProductCardEvents' );
		$('.productGrid, .container-scrolling-products-container, .csd-product-grid-shortcode, .productView-images').on( 'click', '.product-wishlist', e => {
			e.preventDefault();

			const $item = $(e.currentTarget);
			const productId = Number( $item.attr('data-product-id') );
			const variantId = Number( $item.attr('data-variant-id') );
			CsdHelpers.debug( 'CsdSwymWishlistPlus.setupProductCardEvents -> on wishlist button click', { $item, productId, variantId } );

			this.swat.fetch( products => {
				CsdHelpers.debug( 'CsdSwymWishlistPlus.setupProductCardEvents -> swat.fetch', { products } );
				const wishlistProductIds = products.map( product => product.empi );
				
				const found = products.filter( product => {
					// Check variation if present
					if ( variantId && ( variantId !== product.epi) ) {
						return false;
					}
					return productId === product.empi;
				});
				CsdHelpers.debug( 'CsdSwymWishlistPlus.setupProductCardEvents -> on wishlist button click', { found, wishlistProductIds } );

				if ( found && found.length ) {
					CsdHelpers.debug( 'CsdSwymWishlistPlus.setupProductCardEvents -> removeProductFromWishlist' );
					this.removeProductFromWishlist( productId, variantId && ! isNaN( variantId ) ? variantId : undefined, _ => {
						CsdHelpers.debug( 'CsdSwymWishlistPlus.setupProductCardEvents -> removeProductFromWishlist callback', { callback } );
						if ( callback ) callback( { action: 'removed', productId, variantId } );
					} );
				} else {
					CsdHelpers.debug( 'CsdSwymWishlistPlus.setupProductCardEvents -> addProductToWishlist' );
					this.addProductToWishlist( productId, variantId && ! isNaN( variantId ) ? variantId : undefined, _ => {
						CsdHelpers.debug( 'CsdSwymWishlistPlus.setupProductCardEvents -> addProductToWishlist callback', { callback } );
						if ( callback ) callback( { action: 'added', productId, variantId } );
					} );
				}
			});
		});
	}

	getProductData( productId, variantId, callback ) {
		const graphQlQuery = `
				query ProductDetails {
					site {
						product(entityId: ${productId}) {
							entityId
							path
							defaultImage {
								urlOriginal
							}
							variants(first:${variantId ? 1 : 20}${variantId ? ', entityIds: [' + variantId + ']' : ''}) {
								edges {
									node {
										entityId
										defaultImage {
											urlOriginal
										}
										prices {
											price {
												value
											}
										}
									}
								}
							}
						}
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
			if ( json.data && json.data.site ) {
				return callback( json.data.site.product );
			} else {
				return callback( null );
			}
		});
	}

	addProductToWishlist( productId, variantId, callback ) {
		if ( ! this.swat ) return;

		this.getProductData( productId, variantId, productData => {
			if ( ! productData ) return;

			const variantData = productData.variants.edges.length === 1 ? productData.variants.edges[0].node : productData.variants.edges.reduce( ( acc, item ) => {
				return item.node.entityId == variantId ? item.node : acc;
			}, null );
			if ( ! variantData ) return;

			const requestData = {
				"du": this.context.secureBaseUrl + productData.path,
				"empi": productId,
				"epi": variantData.entityId,
				"pr": variantData.prices.price.value,
				"iu" : variantData.defaultImage ? variantData.defaultImage.urlOriginal : ( productData.defaultImage ? productData.defaultImage.urlOriginal : '' )
			};

			this.swat.addToWishList(
				requestData,
				result => {
					this.indicateAllProductsInWishlists( true );
					this.onWishlistUpdated();

					if ( callback ) setTimeout( callback, 0 );
				}
			);

		} );
	}

	removeProductFromWishlist( productId, variantId, callback ) {
		if ( ! this.swat ) return;

		this.getProductData( productId, variantId, productData => {
			if ( ! productData ) return;

			const variantData = productData.variants.edges.length === 1 ? productData.variants.edges[0].node : productData.variants.edges.reduce( ( acc, item ) => {
				return item.node.entityId == variantId ? item.node : acc;
			}, null );
			if ( ! variantData ) return;

			const requestData = {
				"du": this.context.secureBaseUrl + productData.path,
				"empi": productId,
				"epi": variantData.entityId,
				"pr": variantData.prices.price.value,
				"iu" : variantData.defaultImage ? variantData.defaultImage.urlOriginal : ( productData.defaultImage ? productData.defaultImage.urlOriginal : '' )
			};

			this.swat.removeFromWishList(
				requestData,
				result => {
					this.indicateAllProductsInWishlists( true );
					this.onWishlistUpdated();

					if ( callback ) setTimeout( callback, 0 );
				}
			);

		} );
	}

	handleProductDetails( $scope ) {
		CsdHelpers.debug( 'CsdSwymWishlistPlus.handleProductDetails', { $scope } );
		if ( ! this.swat ) {
			setTimeout( () => {
				this.handleProductDetails( $scope );
			}, 50 );
			return;
		}
		// this.watchProductDetailsWishlistButton( $scope );

		const productId = $scope.find('input[name="product_id"]').first().val();
		
		// Initially indicate
		this.getProductData( productId, undefined, productData => {
			CsdHelpers.debug( 'CsdSwymWishlistPlus.handleProductDetails -> getProductData', { productData } );
			if ( ! productData ) return;

			const isVariableProduct = productData.variants.edges.length > 1;
			CsdHelpers.debug( { isVariableProduct } );

			this.swat.fetch( wishlistProducts => {
				// if ( ! wishlistProducts || ! Array.isArray( wishlistProducts ) || ! wishlistProducts.length ) return;
				wishlistProducts = ! wishlistProducts || ! Array.isArray( wishlistProducts ) || ! wishlistProducts.length ? [] : wishlistProducts;
				CsdHelpers.debug( 'CsdSwymWishlistPlus.handleProductDetails -> swat.fetch', { wishlistProducts } );

				if ( isVariableProduct ) {
					this.handleVariableProduct( { $scope, productData, wishlistProducts } );
				} else {
					this.handleSimpleProduct( { $scope, productData, wishlistProducts } );
				}
			});

		});

	}

	handleSimpleProduct( params ) {
		CsdHelpers.debug( 'CsdSwymWishlistPlus.handleSimpleProduct', { params } );
		const { $scope, productData, wishlistProducts } = params;
		const variantData = productData.variants.edges[0].node;
		
		// const variantData = productData.variants.edges.length === 1 ? productData.variants.edges[0].node : productData.variants.edges.reduce( ( acc, item ) => {
		// 	return item.node.entityId == variantId ? item.node : acc;
		// }, null );
		if ( ! variantData ) return;

		const $wishlistBtn = $scope.find( '.csd-swym-wishlist-btn' );

		let found = wishlistProducts.reduce( ( acc, item ) => ( item.empi == productData.entityId ) && ( item.epi == variantData.entityId ) ? item : acc, undefined );

		// Indicate initially
		if ( found ) {
			$wishlistBtn.addClass( 'added' );
		}

		// Indicate on button click
		$wishlistBtn.on( 'click', e => {
			e.preventDefault();

			this.swat.fetch( products => {
				found = products.reduce( ( acc, item ) => ( item.empi == productData.entityId ) && ( item.epi == variantData.entityId ) ? item : acc, undefined );

				if ( found ) {
					this.removeProductFromWishlist( productData.entityId, variantData.entityId, () => {
						$wishlistBtn.removeClass( 'added' );
						this.updateProductCount( -1, $scope );
					} );
				} else {
					this.addProductToWishlist( productData.entityId, variantData.entityId, () => {
						$wishlistBtn.addClass( 'added' );
						this.updateProductCount( 1, $scope );
					} );
				}

			});

		} );

		$wishlistBtn.addClass('visible');
	}

	handleVariableProduct( params ) {
		CsdHelpers.debug( 'CsdSwymWishlistPlus.handleVariableProduct', { params } );
		const { $scope, productData, wishlistProducts } = params;
		const $wishlistBtn = $scope.find( '.csd-swym-wishlist-btn' );

		const $form = $scope.find('form[data-cart-item-add]');
		const $productOptionsElement = $scope.find('[data-product-option-change]', $form);
		let productId, variantId;
		CsdHelpers.debug( 'CsdSwymWishlistPlus.handleVariableProduct', { $wishlistBtn, $productOptionsElement } );

		$productOptionsElement.on('change', event => {
			CsdHelpers.debug( 'Option changed', { event } );
			utils.api.productAttributes.optionChange(productData.entityId, $form.serialize(), 'products/bulk-discount-rates', (err, response) => {
				const attributesData = response.data || {};
				productId = productData.entityId;
				// productId = attributesData.productId;
				variantId = attributesData.v3_variant_id;
				CsdHelpers.debug( 'CsdSwymWishlistPlus.handleVariableProduct -> On optionChange response', { response, attributesData, productId, variantId } );

				if ( productId && variantId ) {

					this.swat.fetch( products => {
						const found = products.reduce( ( acc, item ) => ( item.empi == productId ) && ( item.epi == variantId ) ? item : acc, undefined );
						CsdHelpers.debug( 'CsdSwymWishlistPlus.handleVariableProduct -> Fetched products', { products, found } );
	
						if ( found ) {
							$wishlistBtn.addClass( 'added' );
						} else {
							$wishlistBtn.removeClass( 'added' );
						}

						$wishlistBtn.addClass('visible');
					});

				} else {
					$wishlistBtn.removeClass('visible');
				}
			});
		});

		// Indicate on button click
		$wishlistBtn.on( 'click', e => {
			e.preventDefault();

			this.swat.fetch( products => {
				const found = products.reduce( ( acc, item ) => ( item.empi == productId ) && ( item.epi == variantId ) ? item : acc, undefined );

				if ( found ) {
					this.removeProductFromWishlist( productId, variantId, () => {
						$wishlistBtn.removeClass( 'added' );
						this.updateProductCount( -1, $scope );
					} );
				} else {
					this.addProductToWishlist( productId, variantId, () => {
						$wishlistBtn.addClass( 'added' );
						this.updateProductCount( 1, $scope );
					} );
				}
			});
		} );

	}

	updateProductCount( count, $scope ) {
		csdProductWishlistCartCount.incrementProductCount( count, $scope );

		setTimeout(() => {
			this.updateProductDetailsWishlistProductCount( true );
		}, 1000 );
	}

	// watchProductDetailsWishlistButton( $scope ) {
	// 	const $addToCartBtn = $scope.find('#form-action-addToCart');
	// 	if ( ! $addToCartBtn.length ) return;

	// 	const $addToCartContainer = $addToCartBtn.closest( '.form-action' );

	// 	$addToCartContainer.on( 'click', '.swym-add-to-wishlist', e => {
	// 	  e.preventDefault();

	// 	  const isAdded = ! $(e.currentTarget).hasClass('swym-removing');
	// 	  csdProductWishlistCartCount.incrementProductCount( isAdded ? 1 : -1 );

	// 	  setTimeout(() => {
	// 		  this.updateProductDetailsWishlistProductCount( true );
	// 	  }, 1000 );
	// 	} );
	// }

	updateProductDetailsWishlistProductCount( force ) {
		// Track wishlist products just once
		if ( ! force && ! CsdHelpers.getCookieValue('csd_wishlist_count_updated') ) return;

		// No need to run immediately to improve performance
		CsdHelpers.onUserInteracted(() => {
			this.swat.fetch( products => {
				if ( ! products || ! Array.isArray( products ) || ! products.length ) return;

				let productIds = products.map( product => Number( product.empi ) );
				productIds = productIds.filter( productId => productId && ! isNaN( productId ) );

				csdProductWishlistCartCount.trackCustomerWishlistProducts( productIds, undefined, this.customerSession );

				CsdHelpers.setCookieValue('csd_wishlist_count_updated', 1, 0.25);
			} );
		});
	}

	showWishlistIcon() {
		$('.product-wishlist[data-product-id]:not(.wishlists-initialized)').each( ( index, item ) => {
				$( item ).addClass( 'wishlists-initialized' );
		});
	}

	indicateAllProductsInWishlists( force ) {
		CsdHelpers.debug( 'CsdSwymWishlistPlus.indicateAllProductsInWishlists', { force } );
		if ( ! this.swat ) {
			CsdHelpers.debug( 'CsdSwymWishlistPlus.indicateAllProductsInWishlists -> No swat yet' );
			// window.SwymCallbacks.push( this.indicateAllProductsInWishlists );
			return;
		}

		this.swat.fetch( products => {
			
			CsdHelpers.debug( 'CsdSwymWishlistPlus.indicateAllProductsInWishlists -> fetch', { products } );
			if ( force ) {
				$('.product-wishlist.wishlists-initialized[data-product-id]').removeClass('wishlists-initialized');
			}

			$('.product-wishlist[data-product-id]:not(.wishlists-initialized)').each( ( index, item ) => {
				const $item = $( item );
				const productId = Number( $item.attr( 'data-product-id' ) );
				const variantId = Number( $item.attr('data-variant-id') );

				const found = products.filter( product => {
					// Check variation if present
					if ( variantId && ( variantId !== product.epi) ) {
						return false;
					}

					return productId === product.empi;
				});

				// Indicate if an item is in the wishlist
				// if ( -1 !== wishlistProductIds.indexOf( productId ) ) {
				if ( found.length ) {
					$item.addClass( 'has-in-wishlists' );
				}
				else {
					$item.removeClass( 'has-in-wishlists' );
				}
			});

			this.showWishlistIcon();
		});
	}

}

const instance = new CsdSwymWishlistPlus();

export default instance;
