import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import { createTranslationDictionary } from '../theme/common/utils/translations-utils';
import azbrands from './global/azbrands';
import InfiniteScroll from 'infinite-scroll';

export default class Brand extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    onReady() {
        compareProducts(this.context);
        azbrands(this.context);
        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.brandProductsPerPage;
        const requestOptions = {
            template: {
                productListing: 'brand/product-listing',
                sidebar: 'brand/sidebar',
            },
            config: {
                shop_by_brand: true,
                brand: {
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            showMore: 'brand/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }
}


let lastUrl = location.href; 
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log(lastUrl);
      infiniteScroll();
   
    }
  }).observe(document, {subtree: true, childList: true})
  function infiniteScroll() {
    //  console.log("fun call");
      if(document.querySelectorAll(".pagination-item--next .pagination-link").length > 0){
        //   console.log("next link found");
          if(document.querySelectorAll(".product-listing-show-products").length > 1){
              document.querySelectorAll(".product-listing-show-products")[0].style.display = "block";
              document.querySelectorAll(".product-listing-show-products")[1].style.display = "block";
          }
          const elem = document.querySelector('.productGrid');
     
          const infScroll = new InfiniteScroll(elem, {
          // options
              path: '.pagination-item--next .pagination-link',
              append: '.productGrid .product',
              history: false,
              //offset: 200,
              //button: '.view-more-button',
              // using button, disable loading on scroll 
              //scrollThreshold: false
              status: '.page-load-status',
          });
          
          return infScroll;
      }
  }
infiniteScroll();