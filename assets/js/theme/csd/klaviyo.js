class CsdKlaviyo {

	onCustomerSubscribed(callback) {
		this._init()
		this.callbacks.push(callback)
	}

	_init() {
		if (this.isInitialized) return
		this.isInitialized = true

		this.isSubscribed = false
		this.callbacks = []
		$(document).on('click', 'button.needsclick', this._onKlavioPopupFormButtonClick.bind(this))
		$(document).on('keypress', 'input[name="email"]', this._onKlavioPopupFormInputKeypress.bind(this))
	}

	_onKlavioPopupFormInputKeypress(e) {
		if ( this._isEventFromKlavioForm(e) ) {
			$(document).off('keypress', 'input[name="email"]', this._onKlavioPopupFormInputKeypress.bind(this))
			this._subscribeOnSuccess()			
		}
	}

	_onKlavioPopupFormButtonClick(e) {
		if ( this._isEventFromKlavioForm(e) ) {
			$(document).off('click', '.needsclick', this._onKlavioPopupFormButtonClick)
			this._subscribeOnSuccess()			
		}
	}

	_subscribeOnSuccess() {
		this._waitForSubscriptionConfirmation(() => {
			if (this.isSubscribed) return;
			this.isSubscribed = true;

			this.callbacks.forEach(callback => callback())
		})
	}

	_isEventFromKlavioForm(event) {
		if (!event.target) return false
		const $form = $(event.target).closest('form')
		var classNames = $form.attr('class')
		classNames = classNames ? classNames : ''
		return classNames.indexOf('klaviyo-form-version-') !== -1
	}

	_waitForSubscriptionConfirmation(callback) {
		try {
			const $editor = $('.ql-editor')
			if ( ! $editor.length )  throw new Error('Popup content not found')
			const editorText = $.trim( $editor.text().toLowerCase() )
			if ( editorText.indexOf('check your email') !== -1 ) {
				return callback()
			} else {
				throw new Error('No success message yet')
			}
		} catch (err) {
			setTimeout(() => {
				this._waitForSubscriptionConfirmation(callback)
			}, 200)
		}
	}

}

const csdKlaviyo = new CsdKlaviyo();

export default csdKlaviyo;
