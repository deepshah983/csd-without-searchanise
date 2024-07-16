import PageManager from '../page-manager';
import CsdHelpers from '../csd/helpers';

export default class Checkout extends PageManager {
    constructor(context) {
        super(context);
    }

    onReady() {
        if ( ! $( '#checkout-app' ).length ) {
          return;
        }

        this.csdWaitForSheppleSocialLogin(( $socialLogin ) => {
            $socialLogin.insertAfter( $('#checkout-customer-login') );
        });

        // Setup listeners
        this.hookAjax({
          open: (arg, xhr) => {
            var requestURI = $.isArray( arg ) && arg.length && arg[ 1 ] ? arg[ 1 ] : '';
            var requestMethod = $.isArray( arg ) && arg.length && arg[ 0 ] ? arg[ 0 ] : '';

            // LogOut Action (DELETE - logout, POST - login)
            if ( requestURI === '/internalapi/v1/checkout/customer' ) {
                // Do Login or logout
            }
            // Initial customer login screen
            else if ( requestURI === '/api/storefront/form-fields' ) {
                this.csdWaitForSheppleSocialLogin( ( $socialLogin ) => {
                    $socialLogin.insertAfter( $('#checkout-customer-login') );
                });
            }
            // Payment Step
            else if ( requestURI === '/api/storefront/payments' ) {
              this.handlePayments();
            } // END /api/storefront/payments
            else if ( requestURI.indexOf( 'consignments.availableShippingOptions' ) !== -1 ) {
                // Shipping methods
            }

          }
        });  

        this.handleCouponSection();
    }

    onPayButtonDisplayed() {
        var $container = $('#checkout-payment-continue').closest('.form-actions');
        if ( $container.find('CsdTrustPilotStars').length ) {
            return;
        }
        
        var $CsdTrustPilotStars = $('#CsdTrustPilotStars').clone();
        $CsdTrustPilotStars.detach();
        $CsdTrustPilotStars.css({
          'display': 'block',
          'text-align': 'center',
          'font-weight': 'bold',
          'margin': '20px 0'
        });
        $CsdTrustPilotStars.find('.trustpilot-stars').css({
            'color': '#000'
        })
        $CsdTrustPilotStars.appendTo( $container );
    }

    csdWaitForSheppleSocialLogin( callback ) {
      var $socialLogin = $('.shepple_social_login_wrapper');
      if ( ! $socialLogin.length ) setTimeout( _ => { return this.csdWaitForSheppleSocialLogin( callback ); }, 50 );
      else callback( $socialLogin );
    }

    waitForPaymentButton( callback ) {
      if ( ! $('#checkout-payment-continue').length ) setTimeout( _ => { return this.waitForPaymentButton( callback ); }, 50 );
      else callback();
    }

    handlePayments() {
      CsdHelpers.debug('handlePayments');
      this.waitForPaymentButton( _ => {
        this.onPayButtonDisplayed();
      });


      const waitForBitcoin = callback => {
        const $bitcoin = $('#247opennodepayment');
        if ( $bitcoin.length ) setTimeout( _ => { callback( $bitcoin ); }, 0 );
        else setTimeout( _ => { waitForBitcoin( callback ); }, 100 );
      };

      const waitForPaymentMethodsForm = callback => {
        const $paymentMethodForm = $('.checkout-step--payment').find('.checkout-view-content .checkout-form .form-fieldset .form-checklist').eq(0);
        if ( $paymentMethodForm.length ) setTimeout( _ => { callback( $paymentMethodForm ); }, 0 );
        else setTimeout( _ => { waitForPaymentMethodsForm( callback ); }, 100 );
      };

      waitForBitcoin( $bitcoin => {
        CsdHelpers.debug('waitForBitcoin', {$bitcoin});
        waitForPaymentMethodsForm( $paymentMethodForm => {
          CsdHelpers.debug( 'waitForPaymentMethodsForm', { $paymentMethodForm } );
          $bitcoin.insertAfter( $paymentMethodForm );
          $bitcoin.addClass('processed');
        });
      });

      // var bitCoinInterval = setInterval( _ => {
      //   const $paymentStep = $('.checkout-step--payment');
      //   const $bitcoin = $('#247opennodepayment');
      //   CsdHelpers.debug('bitCoinInterval', {$bitcoin});
      //   if ( ! $bitcoin.hasClass('processed') ) {
      //     const $paymentMethodForm = $paymentStep.find('.checkout-view-content .checkout-form .form-fieldset').eq(0);
      //     CsdHelpers.debug('Move bitcoin', { $paymentMethodForm });
      //     $bitcoin.insertAfter( $paymentMethodForm );
      //     $bitcoin.addClass('processed');
      //     clearInterval( bitCoinInterval );
      //   }
      // }, 100 );

    }

    handleCouponSection() {
        setInterval( _ => {
            const $couponLabel = $('.redeemable-label').filter( ( index, item ) => $(item).text().toLowerCase().indexOf('coupon') !== -1 );
            this.refactorCouponBox( $couponLabel.parent() );
        }, 1000 );
    }

    refactorCouponBox( $couponSection ) {
        const $couponLabel = $couponSection.find('.redeemable-label');
        if ( ! $couponLabel.length ) return;

        if ( $couponLabel.text().toLowerCase().indexOf('gift') !== -1 ) {
            $couponLabel.html('Coupon');
        }

        $couponSection.each( ( index, item ) => {
            const $item = $(item);
            if ( ! $item.find('#applyRedeemableButton').length ) {
                const $label = $item.find('.redeemable-label');
                if ( $label.length ) {
                    $label[0].click();
                }
            }
        } );
    }

    hookAjax(proxy) {
        window._ahrealxhr = window._ahrealxhr || XMLHttpRequest
        XMLHttpRequest = function() {
            var xhr = new window._ahrealxhr;
            Object.defineProperty(this, 'xhr', {
                value: xhr
            })
        }

        var prototype = window._ahrealxhr.prototype;
        for (var attr in prototype) {
            var type = "";
            try {
                type = typeof prototype[attr]
            } catch (e) {}
            if (type === "function") {
                XMLHttpRequest.prototype[attr] = hookfun(attr);
            } else {
                Object.defineProperty(XMLHttpRequest.prototype, attr, {
                    get: getFactory(attr),
                    set: setFactory(attr),
                    enumerable: true
                })
            }
        }

        function getFactory(attr) {
            return function() {
                var v = this.hasOwnProperty(attr + "_") ? this[attr + "_"] : this.xhr[attr];
                var attrGetterHook = (proxy[attr] || {})["getter"]
                return attrGetterHook && attrGetterHook(v, this) || v
            }
        }

        function setFactory(attr) {
            return function(v) {
                var xhr = this.xhr;
                var that = this;
                var hook = proxy[attr];
                if (typeof hook === "function") {
                    xhr[attr] = function() {
                        proxy[attr](that) || v.apply(xhr, arguments);
                    }
                } else {
                    //If the attribute isn't writeable, generate proxy attribute
                    var attrSetterHook = (hook || {})["setter"];
                    v = attrSetterHook && attrSetterHook(v, that) || v
                    try {
                        xhr[attr] = v;
                    } catch (e) {
                        this[attr + "_"] = v;
                    }
                }
            }
        }

        function hookfun(fun) {
            return function() {
                var args = [].slice.call(arguments)
                if (proxy[fun] && proxy[fun].call(this, args, this.xhr)) {
                    return;
                }
                return this.xhr[fun].apply(this.xhr, args);
            }
        }
        return window._ahrealxhr;
    }


}
