/*
TODO NEXT:
- Communicate from embedded iframe to tell what iframe height should be
*/

class CsdConsignorProfile {

	load(context) {
		var params = new URLSearchParams( window.location.href )
		var page = params.get('consignor')
		// var pageNumber = params.get('page_num')
		// pageNumber = pageNumber ? Number( pageNumber ) : 1;

		if ( -1 !== [ 'items_for_sale', 'sales_history' ].indexOf( page ) ) {
			this.loadConsignorProfilePage( page )
		} else {
			this.unlockEditAccount()
		}
	}

	loadConsignorProfilePage(page) {
        $('#EditAccount').remove();
        $("#SectionItemsforsale").css("display", "block");

		const $menu_item = $(".nav-items-for-sale ")
		if ( ! $menu_item.length ) {
			// Fallback to edit account if page is unknown
			this.unlockEditAccount()
			return
		}

		// Highlight consignor page
		$(`.navBar--account .navBar-item.is-active`).removeClass('is-active');
		$menu_item.addClass('is-active');

		const currentPageUrl = encodeURIComponent( window.location.href );

	    var xmlhttp = new XMLHttpRequest();
	    xmlhttp.onreadystatechange = () => {
	        if (xmlhttp.readyState == 4 ) {
				if (xmlhttp.status == 200) {
					this.setupIframe( `https://consignor.csd.shop/${page}/?token=${xmlhttp.responseText}&page_url=${currentPageUrl}` );
				}
	        }
	    };
	    xmlhttp.open("GET", "/customer/current.jwt?app_client_id=rb87r5oj750ry78f9whpab7e911inzz", true);
	    xmlhttp.send();
	}

	setupIframe( url ) {

		window.addEventListener('message', event => {
			var action = event.data ? event.data.action : '';
			if ( action === 'setConsignorAppHeight' ) {
				let height = Number( event.data.height );
				height = isNaN( height ) ? 0 : height;
				height = Math.max( height, 300 );
				height += 40;
				$( '#ConsignorProfileIframe' ).height( height );
			}
		});

		var iframe = document.createElement("iframe");
		iframe.id = 'ConsignorProfileIframe';
		iframe.setAttribute("src", url);
		// iframe.onload = () => {
		// 	iframe.contentWindow.postMessage( { action: 'getAppHeight' }, 'https://consignor.csd.shop' );
		// }

		document.getElementById('ConsignorProfile').appendChild(iframe);
	}

	unlockEditAccount() {
		$(".nav-edit-details").addClass('is-active');
		$('#EditAccount').css('display', 'block');
		$('#SectionItemsforsale').remove();

		$('.csd-account-content-item.details').on('click', '.csd-account-content-link', e => {
			if ( location.search.indexOf('action=account_details') !== -1 ) {
				e.preventDefault();
				$( e.currentTarget ).closest('.csd-account-content-item').find('.csd-account-content').slideToggle();
			}
		});
	}

}

const csdConsignorProfile = new CsdConsignorProfile();

export default csdConsignorProfile;
