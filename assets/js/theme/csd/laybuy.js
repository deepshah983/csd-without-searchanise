import CsdHelpers from './helpers';
// ORIGINAL SCRIPT: https://integration-assets.laybuy.com/bigcommerce/laybuy.min.js
// Unminified: https://integration-assets.laybuy.com/bigcommerce/laybuy.js

(function (arr) {
    arr.forEach(function (item) {
        if (item.hasOwnProperty('after')) {
            return;
        }
        Object.defineProperty(item, 'after', {
            configurable: true,
            enumerable  : true,
            writable    : true,
            value       : function after() {
                var argArr = Array.prototype.slice.call(arguments),
                    docFrag = document.createDocumentFragment();

                argArr.forEach(function (argItem) {
                    var isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });

                this.parentNode.insertBefore(docFrag, this.nextSibling);
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

class LayBuy {

	load(context) {
		if ( ! this._isStyleLoaded() ) {
			this._loadStyle()
			this._setupEvents()
			// this._addModal()
		}
	}

	run( $scope ) {
    new CsdLaybuySnippet(new CsdLaybuyHtmlParser( 'default', $scope ), $scope).display();
	}

	_isStyleLoaded() {
		const links = document.getElementsByTagName("link")
		return Array.from(links).filter(link => link.href && (link.href.indexOf('integration-assets.laybuy.com/bigcommerce/laybuy.min.css') !== -1) ? true : false).length
	}

	_addModal() {
		CsdHelpers.onUserInteracted(() => {
	    if ( ! $('#laybuy-modal').length ) {
	      var modalNode = document.createElement('div');
	      modalNode.innerHTML = '<div class="laybuy-inline-widget"><div id="laybuy-modal" class="laybuy-popup-modal"><div id="laybuy-popup-outer"><div class="laybuy-popup-modal-content"><iframe src="https://popup.laybuy.com/"></iframe><span class="close">x</span></div> </div></div></div>';
	      document.body.appendChild(modalNode);
	    }
		});
	}

	_loadStyle() {
		var head = document.getElementsByTagName("head")[0],
		    css = document.createElement("link"),
		    cssUrl = window.location.protocol + "//integration-assets.laybuy.com/bigcommerce/laybuy.min.css";
		css.href = cssUrl;
		css.rel = "stylesheet";
		head.appendChild(css);
	}

  _setupEvents () {

      $(document).on("click", '#laybuy-what-is-modal', (event) => {
          event.preventDefault();
          // this.$scope.find('#laybuy-modal').get(0).style.display = 'block';
          // $('#laybuy-modal').get(0).style.display = 'block';
          $('#laybuy-modal').show()
      });

      $(document).on("click", '.laybuy-popup-modal-content .close', (event) => {
          event.preventDefault();
          // this.$scope.find('#laybuy-modal').get(0).style.display = 'none';
          // $('#laybuy-modal').get(0).style.display = 'none';
          $('#laybuy-modal').hide()
      });
  };

}


var CsdLaybuyHtmlParser = function (type, $scope) {

    this.type = type;
    this.$scope = $scope;

    this.getPrice = () => {

        if (this.type === 'dynamic') {

            if ( this.$scope.find('.price.price--withTax').length ) {
                var price = $scope.find('.price.price--withTax').text().trim();

                if (price) {
                    return price.replace(',','').match(/([0-9.]+)/)[0];
                }
            }

        }

        if ( this.$scope.find('.cart-laybuy').length ) {
            return this.$scope.find('.cart-laybuy').attr('data-total');
        }

        if ( this.$scope.find('[property="product:price:amount"]').length ) {
            return this.$scope.find('[property="product:price:amount"]').attr('content');
        }

        if ( this.$scope.find('[itemprop="price"]').length ) {
            return this.$scope.find('[itemprop="price"]').attr('content');
        }

        if ( this.$scope.find('[data-product-price]').length ) {
            return this.$scope.find('[data-product-price]').text().trim();
        }

        return null;
    };

    this.getCurrency = () => {

        if ( this.$scope.find('.cart-laybuy').length ) {
            return this.$scope.find('.cart-laybuy').attr('data-currency');
        }

        if ( this.$scope.find('[property="product:price:currency"]').length ) {
            return this.$scope.find('[property="product:price:currency"]').attr('content');
        }

        if (this.$scope.find('[itemprop="priceCurrency"]')) {
            return this.$scope.find('[itemprop="priceCurrency"]').attr('content');
        }

        return null;
    };

    this.getPriceElement = () => {

        var priceElement = this.$scope.find('.payment_wrap_desktop').get(0);

        if ( !priceElement ) {
            priceElement = this.$scope.find('.cart-laybuy').get(0);
        }

        if ( !priceElement ) {
            priceElement = this.$scope.find('div[data-content-region="product_below_price"').get(0);
        }

        if ( !priceElement ) {
            priceElement = this.$scope.find('.productView-price').get(0);
        }

        if ( !priceElement ) {
            priceElement = this.$scope.find('.product-details-price').get(0);
        }

        if ( !priceElement ) {
            priceElement = this.$scope.find('.price').get(0);
        }

        return priceElement;
    };

    this.getRefreshElement = () => {
   		  return this.$scope.find('#laybuy-refresh').get(0);
    }
};


var CsdLaybuySnippet = function (htmlParser, $scope) {
    
		this.$scope = $scope
    this.price = htmlParser.getPrice();
    this.currency = htmlParser.getCurrency();

    this.htmlParser = htmlParser;

    var config = {
        NZD: {
            min: 0.06,
            max: 1500
        },
        AUD: {
            min: 0.06,
            max: 1200
        },
        GBP: {
            min: 0.06,
            max: 720
        },
        USD: {
            min: 0.06,
            max: 1200
        }
    };

    this.currencyLocaleMap = {
        'NZD': 'en-NZ',
        'AUD': 'en-AU',
        'GBP': 'en-GB',
        'USD': 'en-US'
    };

    this.formatPrice = function (price) {
        return price.toLocaleString(this.currencyLocaleMap[this.currency], {
            style   : 'currency',
            currency: this.currency
        });
    };

    this.refresh = function() {

        var price = htmlParser.getPrice();

        if (
            !this.currencyLocaleMap.hasOwnProperty(this.currency) ||
            !price ||
            price < config[this.currency].min
        ) {
            return;
        }

        var todayPrice,
            overPrice,
            fromPrice,
            refreshSnippet;

        if (price > config[this.currency].max) {
            overPrice = price - config[this.currency].max;
            todayPrice = this.formatPrice(overPrice);
            fromPrice = this.formatPrice(config[this.currency].max / 5);
            refreshSnippet = 'or from <strong>' + todayPrice + '</strong> today and 5 weekly interest-free payments of <strong><span class="laybuy-price">' + fromPrice + '</span></strong>';
        } else {
            fromPrice = this.formatPrice(price / 6);
            refreshSnippet = 'or 6 weekly interest-free payments from <strong><span class="laybuy-price">' + fromPrice + '</span></strong>';
        }

        var refreshElement = this.htmlParser.getRefreshElement();

        if (!this.htmlParser.getRefreshElement()) {
            return false;
        }

        refreshElement.innerHTML = refreshSnippet;

        return true;
    }

    this.display = function () {
       
        if (
            !this.currencyLocaleMap.hasOwnProperty(this.currency) ||
            !this.price ||
            this.price < config[this.currency].min
        ) {
            return;
        }
        
        var todayPrice,
            overPrice,
            fromPrice,
            htmlSnippet;
            
        if (this.price > config[this.currency].max) {
            overPrice = this.price - config[this.currency].max;
            todayPrice = this.formatPrice(overPrice);
            fromPrice = this.formatPrice(config[this.currency].max / 5);
            htmlSnippet = '<span id="laybuy-refresh">or from <strong>' + todayPrice + '</strong> today and 5 weekly interest-free payments of <strong><span class="laybuy-price">' + fromPrice + '</span></strong></span> with <span><img src="https://integration-assets.laybuy.com/price-breakdown/laybuy_badge_neon_grape.svg" alt="Laybuy"></span><span id="laybuy-what-is-modal" style="font-size: 12px; cursor: pointer;"><u>what\'s this?</u></span><div id="laybuy-modal" class="laybuy-popup-modal"><div id="laybuy-popup-outer"><div class="laybuy-popup-modal-content"><iframe src="https://popup.laybuy.com/"></iframe><span class="close">x</span></div> </div></div>';
        } else {
            fromPrice = this.formatPrice(this.price / 6);
            htmlSnippet = '<span id="laybuy-refresh">or 6 weekly interest-free payments from <strong><span class="laybuy-price">' + fromPrice + '</span></strong></span> with <span><img src="https://integration-assets.laybuy.com/price-breakdown/laybuy_badge_neon_grape.svg" alt="Laybuy"></span> <span id="laybuy-what-is-modal" style="font-size: 12px; cursor: pointer;"><u>what\'s this?</u></span><div id="laybuy-modal" class="laybuy-popup-modal"><div id="laybuy-popup-outer"><div class="laybuy-popup-modal-content"><iframe src="https://popup.laybuy.com/"></iframe><span class="close">x</span></div> </div></div>';
        }
        
        var priceElement = this.htmlParser.getPriceElement();
        

        const existingLaybuy = document.getElementsByClassName('laybuy-inline-widget');
        if (!existingLaybuy[0]) {
            var widget = document.createElement('div');
            widget.className = 'laybuy-inline-widget';
            widget.innerHTML = htmlSnippet;

            priceElement.after(widget);

            $(document).on( "click","#laybuy-what-is-modal", function() {
                $('#laybuy-modal').show()
            });
            $(document).on( "click", ".laybuy-popup-modal-content .close", function() {
                $('#laybuy-modal').hide()
            });
        }
    }
};


const instance = new LayBuy();

export default instance;
