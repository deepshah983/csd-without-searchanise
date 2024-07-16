import _ from 'lodash';
import 'slick-carousel';

export default ( $container ) => {
	// Order products based on the order specified
	let productsOrder = $container.data('order') || '';
	productsOrder = $.trim( productsOrder );
	productsOrder = productsOrder.split(',');
	productsOrder = productsOrder.map(item => $.trim(item));
	productsOrder = productsOrder.filter(item => !!item)
	let productsSortMap = {};
	productsOrder.forEach( (id, index) => {
		id = Number( id );
		productsSortMap[ id ] = index + 1;
	} );

	const $products = $container.find('.product');
	$products.sort( (a, b) => {
		a = $(a).find('.card[data-entity-id]').first().attr('data-entity-id');
		a = Number(a);
		a = productsSortMap[a] ? productsSortMap[a] : 9999;
		b = $(b).find('.card[data-entity-id]').first().attr('data-entity-id');
		b = Number(b);
		b = productsSortMap[b] ? productsSortMap[b] : 9999;

		if ( a < b ) return -1;
		else if ( a > b ) return 1;
		else return 0;
	});
	$container.append( $products );

	// Init carousel
  const options = {
    accessibility: false,
    arrows: true,
    dots: false,
	autoplay: true,
	autoplaySpeed: 4000,
    slidesToShow: 2,
    slidesToScroll: 1,
    slide: '.product',
    infinite: false,
    mobileFirst: true,
    responsive: [
      {
        breakpoint: 961,
        settings: {
          slidesToShow: 5,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 551,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1
        }
      }
    ]

  };

  $container.slick(options);
}

/*
const initScrollingProducts = (id) => {
	if ( ! window.csdLoadScrollingProducts) return;

	const el = document.getElementById(id);
	const $el = $(el);
	const $productsContainer = $el.find('.loaded-products-container').first();
	if ( ! $productsContainer.length ) return;

	const $scrollableContainer = $el.find('.container-scrolling-products-container').first();
	if ( ! $scrollableContainer.length ) return;

	let touchCapturedPos;
	let scrollCapturedPos;
	const capturePosition = _.throttle((touchPos, scrollPos) => {
		touchCapturedPos = touchPos;
		scrollCapturedPos = scrollPos;
	}, 100, { leading: true, trailing: false });

	let scrollStartPos;
	let touchStartPos;
	let containerWidth;
	let maxScrollPos;
	let scrollableContainerWidth;
	let touchLastPos;
	let scrollingAllowed;
	let timeoutRef;
	const $window = $(window);
	const $body = $(document.body);
	window.csdLoadScrollingProducts(id, () => {
		el.addEventListener('touchstart', (e) => {
			scrollingAllowed = $window.width() <= 960;
			if ( ! scrollingAllowed ) return;
			touchStartPos = e.touches[0].clientX;
			containerWidth = $productsContainer.width();
			scrollableContainerWidth = $scrollableContainer.width();
			scrollStartPos = $scrollableContainer.scrollLeft();
			maxScrollPos = containerWidth - scrollableContainerWidth;
			$scrollableContainer.stop();
			$body.addClass('horizontal-scrolling');
			timeoutRef = setTimeout(() => {
				$body.removeClass('horizontal-scrolling');
			}, 1000 );
		});
		el.addEventListener('touchmove', (e) => {
			if ( ! scrollingAllowed ) return;
			if (touchStartPos === undefined) return;
			const touchCurrentPos = e.touches[0].clientX;
			const touchPosDiff = touchCurrentPos - touchStartPos;
			const scrollTarget = Math.max( 0, Math.min( maxScrollPos, scrollStartPos - touchPosDiff ) );
			$scrollableContainer.scrollLeft( scrollTarget );
			touchLastPos = touchCurrentPos;
			capturePosition(touchCurrentPos, scrollTarget);
		});
		el.addEventListener('touchend', (e) => {
			if ( ! scrollingAllowed ) return;
			touchStartPos = undefined;
			if ( touchCapturedPos === undefined ) return;

			clearTimeout(timeoutRef);
			$body.removeClass('horizontal-scrolling');


			const touchCurrentPos = touchLastPos;
			const touchPosDiff = touchCurrentPos - touchCapturedPos;
			const scrollTarget = Math.max( 0, Math.min( maxScrollPos, scrollCapturedPos - touchPosDiff * 4 ) );

			$scrollableContainer.animate({
			  scrollLeft: scrollTarget
			}, 200);
		});
	});

}

window.initScrollingProducts = initScrollingProducts;
export default initScrollingProducts
*/
