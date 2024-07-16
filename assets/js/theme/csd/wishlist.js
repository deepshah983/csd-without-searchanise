import utils from '@bigcommerce/stencil-utils';

class CsdWishlist {
    load(context) {
        this.lsWishlistsKey = 'CsdWls';
        this.lsWishlistProductsKey = 'CsdWlProducts';
        this.wishlistProductsLoaded = false

        if ( ! this.isLocalStorageSupported() ) {
            this.customerWishlists = [];
            this.wishlistProductIds = [];
            this.showWishlistIcon();
            return;
        }

        this.maybeClearWishlistProducts();

        // Customer is not logged in
        if ( ! context.customerEmail ) {
            this.customerWishlists = [];
            this.wishlistProductIds = [];
            this.wishlistProductsLoaded = true
            this.clearWishListProductIds();
            this.showWishlistIcon();
            return;
        }

        // Wishlists are not available everywhere, for example, not available on blog posts
        // Therefore, we need to save them to localstorage when available and then load from it when not available
        if ( context.customerWishlists ) {
            this.setWishLists(context.customerWishlists)
            this.customerWishlists = context.customerWishlists;
        } else {
            this.customerWishlists = this.getWishLists()
        }

        // Process even if wishlist data is not available because we need to show the heart icons
        this.customerWishlists = this.customerWishlists || []

        this.updateWishlistsData().then( () => {
            this.wishlistProductsLoaded = true
            this.indicateAllProductsInWishlists()
            this.showWishlistItemsCount()
        });
    }

    showWishlistItemsCount() {
        // TODO: Potentially need to wait for user interaction
        $('.wishlist-items-count').html( this.wishlistProductIds.length ).addClass( 'ready' )
    }

    /*
    Should clear product IDs every time when user adds or removes a product to/from a wishlist
     */
    maybeClearWishlistProducts() {
        if ( location && location.pathname && ( '/wishlist.php' === location.pathname ) ) {
            if ( ( -1 !== location.search.indexOf( 'action=viewwishlistitems' ) ) ) {
                this.clearWishListProductIds();
            }
        }

        $( '[data-wishlist-delete]' ).on( 'click', ( e ) => {
            this.clearWishListProductIds();
        } );
    }

    updateWishlistsData() {
        return new Promise((resolve, reject) => {
            // See if need to update wishlists

            this.wishlistProductIds = this.getWishListProductIds();

            if ( this.wishlistProductIds && this.wishlistProductIds.length ) {
                return resolve();
            }
            else {
                // Load wishlists
                var loaders = [];
                this.customerWishlists.forEach( ( wishlist ) => {
                    loaders.push( new Promise( (resolve, reject) => {
                        $.get( wishlist.view_url, ( data ) => {
                            try {
                                const wishlistData = JSON.parse( $.trim( $(data).find( '#CsdWishlistData' ).html() ) );
                                resolve( wishlistData.items );
                            }
                            catch (err) {
                                resolve( [] );
                            }
                        } );
                    } ) );
                });
                
                Promise.all( loaders ).then( ( wishlists ) => {
                    this.wishlistProductIds = [];
                    wishlists.forEach( ( wishlistProducts ) => {
                        wishlistProducts.forEach( ( productData ) => {
                            this.wishlistProductIds.push( productData.product_id );
                        } );
                    } );
                    this.setWishListProductIds( this.wishlistProductIds );
                    return resolve();
                });
            }
        });
    }

    onCustomerLogin() {
        this.clearWishListProductIds();
    }

    showWishlistIcon() {
        $('.product-wishlist[data-productid]:not(.wishlists-initialized)').each( ( index, item ) => {
            $( item ).addClass( 'wishlists-initialized' );
        });
    }

    indicateAllProductsInWishlists() {
        if ( !this.wishlistProductsLoaded ) return

        // Reverse array because we'll be prepending wishlist options and need to keep the right order
        const reversedWishlists = this.customerWishlists.reverse()

        $('.product-wishlist[data-productid]:not(.wishlists-initialized)').each( ( index, item ) => {
            const productId = Number( $( item ).attr( 'data-productid' ) );

            // Ensure add wishlist options list is there
            // BC BUG: for the cards loaded via AJAX, it is not supplying customer data and thus these products have no customer wishlists
            const $addToWishlistDropdown = $(item).find('.dropdown-menu')
            reversedWishlists.forEach((wishlist) => {
                if ( !$addToWishlistDropdown.find(`form[data-wishlistid="${wishlist.id}"]`).length ) {
                    $addToWishlistDropdown.prepend(`
                    <li>
                        <form action="/wishlist.php?action=add&amp;wishlistid=${wishlist.id}&amp;product_id=${productId}" class="form" method="post" data-wishlistid="${wishlist.id}">
                            <input type="submit" class="button button--primary button--small" value="${wishlist.name}">
                        </form>
                    </li>
                    `)
                }
            })

            // Indicate if an item is in the wishlist
            if ( -1 !== this.wishlistProductIds.indexOf( productId ) ) {
                $( item ).addClass( 'has-in-wishlists' );
            }
            else {
                $( item ).removeClass( 'has-in-wishlists' );
            }
        });
        this.showWishlistIcon();
    }

    getWishListProductIds() {
        var wishlistProductIds = [];
        try {
            wishlistProductIds = localStorage.getItem( this.lsWishlistProductsKey );
            wishlistProductIds = JSON.parse( wishlistProductIds );
            wishlistProductIds = wishlistProductIds && $.isArray( wishlistProductIds ) ? wishlistProductIds : [];
            wishlistProductIds = wishlistProductIds.map( ( id ) => parseInt( id ) );
        }
        catch (err) {
            wishlistProductIds = [];
        }

        return wishlistProductIds;
    }

    setWishListProductIds( productIds ) {
        localStorage.setItem( this.lsWishlistProductsKey, JSON.stringify( productIds ) );
    }

    clearWishListProductIds() {
        localStorage.removeItem( this.lsWishlistProductsKey );
    }

    getWishLists( wishlists ) {
        var wishlists = [];
        try {
            wishlists = localStorage.getItem( this.lsWishlistsKey );
            wishlists = JSON.parse( wishlists );
        }
        catch (err) {
            wishlists = [];
        }

        return wishlists;
    }

    setWishLists( wishlists ) {
        localStorage.setItem( this.lsWishlistsKey, JSON.stringify( wishlists ) );
    }

    clearWishLists() {
        localStorage.removeItem( this.lsWishlistsKey );
    }

    isLocalStorageSupported() {
        try {
            var key = 'CsdLocalStorageTest';
            localStorage.setItem(key, key);
            localStorage.removeItem(key);
            return true;
            // return key === localStorage.getItem(key);
        } catch( err ) {
            return false;
        }
    }

    onWishlistInitialized( callback ) {
        if (this.wishlistProductIds) {
            return callback();
        }
        else {
            setTimeout(() => {
                this.onWishlistInitialized(callback);
            } , 50);
        }
    }

}

const csdWishlist = new CsdWishlist();

export default {
    load: (context) => {
        csdWishlist.load(context);
    },
    onCustomerLogin: () => {
        csdWishlist.onCustomerLogin();
    },
    indicateAllProductsInWishlists: () => {
        csdWishlist.onWishlistInitialized( () => {
            csdWishlist.indicateAllProductsInWishlists();
        });
    }
}
