import 'foundation-sites/js/foundation/foundation';
import 'foundation-sites/js/foundation/foundation.dropdown';
import utils from '@bigcommerce/stencil-utils';

export const CartPreviewEvents = {
    close: 'closed.fndtn.dropdown',
    open: 'opened.fndtn.dropdown',
};

export default function (secureBaseUrl, cartId) {
    const loadingClass = 'is-loading';
    const $cart = $('[data-cart-preview]');
    const $cartDropdown = $('.cart-popup');
    const $cartLoading = $('<div class="loadingOverlay"></div>');
    const $cartPopup = $('.cart-popup-wrapper');
    const $body = $('body');
    const $add = $('.custom-add-to-cart');
    
    if (window.ApplePaySession) {
        $cartDropdown.addClass('apple-pay-supported');
    }

    $body.on('cart-quantity-update', (event, quantity) => {
        $cart.attr('aria-label', (_, prevValue) => prevValue.replace(/\d+/, quantity));

        if (!quantity) {
            $cart.addClass('navUser-item--cart__hidden-s');
        } else {
            $cart.removeClass('navUser-item--cart__hidden-s');
        }

        $('.cart-quantity')
            .text(quantity)
            .toggleClass('countPill--positive', quantity > 0);
        if (utils.tools.storage.localStorageAvailable()) {
            localStorage.setItem('cart-quantity', quantity);
        }

        $(document).on('click','.custom-add-to-cart',function(evnt){
            var _this = $(this);
            //var qty = $('.form-field--success .form-input--incrementTotal').val();
            if($('.qty-dropdown').length > 0){
                var qty = $('.qty-dropdown option:selected').text();
            }else{
                var qty = 1;
            }
            
            var _this_product_id = $(this).attr("data-product-id");
            add_to_cart_with_ajax(_this_product_id, qty, _this);
        });
        
        function add_to_cart_with_ajax(product_id,qty,_this){
            _this.attr('disabled',true);
            $.ajax({
                url:'/remote/v1/cart/add',
                type:'post',
                dataType: 'json',
                data:{'action':'add','product_id':product_id,qty:qty},
                success: function(res){ 
                    if(res.data.error){
                        $('.error-popup-wrapper p').html(res.data.error);
                        $('.error-popup-wrapper').show();
                    }else{         
                        const options = {
                            template: 'common/cart-preview',
                        };
                        utils.api.cart.getContent(options, (err, response) => {
                            $cartPopup
                                .addClass('is-open').html(response); 
                                $('.body').addClass('overlay');    
                                $('body').addClass('fixed');     
                        });
                        $.ajax({
                                type: "GET",
                                url:"/cart.php",
                                success: function(data){

                                    var cart_total_quantity = $(data).find('.cart').attr('data-cart-quantity');
                                    $('.cart-quantity').text(cart_total_quantity);
                                    
                                }
                            }); 
                    }
                    $('.error-popup-wrapper .button').click(function(){
                        $('.error-popup-wrapper').fadeOut();
                    })
                },
                error: function(xhr, type) {
                    $('#error-popup').text("Something went wrong!");
                    $("#error-popup").show();
                    setTimeout(function() { $("#error-popup").hide(); }, 5000);
                }
            });
            _this.attr('disabled',false);
        }
        $(document).on('click','.remove-product',function(evnt){
            var _this = $(this);
            var qty = 1;
            var _this_product_id = $(this).attr("data-product-id");
            var product_id = $(this).attr("product-id");
            var product_sku = $(this).attr("data-product-sku");
            var currency = $('#currencySelection .active-currency').attr('data-currency-code');
            
                        var price = $(this).parent('.previewCartItem').find('.previewCartItem-content .previewCartItem-price span').text().replace(/[^\d\.]/g, '');
                        var brand_name = $(this).parent('.previewCartItem').find('.previewCartItem-content .previewCartItem-brand a').text();
                        var product_name = $(this).parent('.previewCartItem').find('.previewCartItem-content .previewCartItem-name a').text();
                        var cat_list = $(this).parent('.previewCartItem').find('.previewCartItem-content .category-names').text();
                        let cat_arr = cat_list.split(',');
                        
                        
                       
                        fetch('/api/storefront/carts?include=',
                            {
                                'credentials': 'include',
                                'headers': {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                }
                            }).then(function (response) {
                                response.json().then(function (data) {

                                    let items = data[0].lineItems.physicalItems;

                                    items.forEach(element => {
                                        if(element.productId == product_id){
                                   

                                     window.dataLayer = window.dataLayer || []; 
                                     var bodl_data = {
                                        'event': 'bodl_v1_cart_product_removed'
                                    }
                                    var payload = {
                                        'product_value': price,
                                        'channel_id': 1,
                                        'currency': currency,
                                        'line_items': [{
                                            'base_price': element.originalPrice,
                                            'brand_name': brand_name,
                                            'category_names': cat_arr,
                                            'currency': currency,
                                            'gift_certificate_id': '',
                                            'gift_certificate_name': '',
                                            'gift_certificate_theme': '',
                                            'product_id': _this_product_id,
                                            'product_name': product_name,
                                            'purchase_price': price,
                                            'quantity': element.quantity,
                                            'retail_price': '',
                                            'sale_price': price,
                                            'sku': element.sku,
                                            'variant_id': element.variantId
                                        }]
                                    }
                                    bodl_data.bodl_ecommerce = payload;
                                     
                                     window.dataLayer.push(bodl_data);
                                  
                                    }
                                });
                                });
                            });
                        
                      
                       
                   
                        
                        

            remove_cart_with_ajax(_this_product_id, qty, _this);
        });
        function remove_cart_with_ajax(product_id,qty,_this){
            _this.attr('disabled',true);
          
            $.ajax({
                url: '/cart.php',
                success: function(data) {
                    data=$(data).find('.page-content').attr('data-cart-id');
                    const settings = {
                        "async": true,
                        "crossDomain": true,
                        "url": "/api/storefront/carts/" +data+ "/items/" + product_id,
                        "method": "DELETE",
                        "headers": {
                        "Content-Type": "application/json"
                        }
                    };
                    $.ajax(settings).done(function (response) {
                        /* $('.body').addClass('overlay');
                        $('body').addClass('fixed'); */
                        const options = {
                            template: 'common/cart-preview',
                        };
                        //$('.cart-popup-wrapper').addClass('is-open').html();
                    
                    utils.api.cart.getContent(options, (err, response) => {                       
                        $cartPopup
                            .html(response);
                                    
                    });
                        $.ajax({
                                type: "POST",
                                url:"/cart.php",
                                success: function(data){
                                
                                    if($(data).find('.cart').attr('data-cart-quantity')){
                                        var cart_total_quantity = $(data).find('.cart').attr('data-cart-quantity');
                                        $('.cart-quantity').text(cart_total_quantity);
                                    }else{
                                        $('.cart-quantity').text('0');
                                    }
                                    
                                }
                            });
                    });
                }
            });
            
            _this.attr('disabled',false);
        }
    });
    $(document).on('click','.product-with-options',function(evnt){
            
        var selected_option = $(".form-option-wrapper input:checked + .form-option span").text();
    
        if(selected_option){
           
            setTimeout(function(){
                $.ajax({
                    type: "GET",
                    url:"/cart.php",
                    success: function(data){

                        var cart_total_quantity = $(data).find('.cart').attr('data-cart-quantity');
                        $('.cart-quantity').text(cart_total_quantity);
                        
                    }
                }); 
                const options = {
                    template: 'common/cart-preview',
                };
                utils.api.cart.getContent(options, (err, response) => {
                    $cartPopup
                        .addClass('is-open').html(response); 
                        $('.body').addClass('overlay');    
                        $('body').addClass('fixed');     
                });
            }, 1500);
            
        }else{
            alert("Please select any option!");
        } 
    });
    $cart.on('click', event => {
        const options = {
            template: 'common/cart-preview',
        };

        // Redirect to full cart page
        //
        // https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
        // In summary, we recommend looking for the string 'Mobi' anywhere in the User Agent to detect a mobile device.
        if (/Mobi/i.test(navigator.userAgent)) {
            return event.stopPropagation();
        }

        event.preventDefault();
        utils.api.cart.getContent(options, (err, response) => {
            $cartPopup
            .addClass('is-open').html(response);
            
        });
    });

    let quantity = 0;

    if (cartId) {
        // Get existing quantity from localStorage if found
        if (utils.tools.storage.localStorageAvailable()) {
            if (localStorage.getItem('cart-quantity')) {
                quantity = Number(localStorage.getItem('cart-quantity'));
                $body.trigger('cart-quantity-update', quantity);
            }
        }

        // Get updated cart quantity from the Cart API
        const cartQtyPromise = new Promise((resolve, reject) => {
            utils.api.cart.getCartQuantity({ baseUrl: secureBaseUrl, cartId }, (err, qty) => {
                if (err) {
                    // If this appears to be a 404 for the cart ID, set cart quantity to 0
                    if (err === 'Not Found') {
                        resolve(0);
                    } else {
                        reject(err);
                    }
                }
                resolve(qty);
            });
        });

        // If the Cart API gives us a different quantity number, update it
        cartQtyPromise.then(qty => {
            quantity = qty;
            $body.trigger('cart-quantity-update', quantity);
        });
    } else {
        $body.trigger('cart-quantity-update', quantity);
    }
}
