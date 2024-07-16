// document.readyState === "complete" => window.load
// document.readyState === "interactive"; DOMReady

var callbacks = [];
var isUserInteracted = false;
const uicb = function () {
  if ( isUserInteracted ) return;
  isUserInteracted = true;
  window.removeEventListener('wheel', uicb);
  window.removeEventListener('mousemove', uicb);
  window.removeEventListener('keydown', uicb);
  // window.removeEventListener('click', uicb);
  window.removeEventListener('touchstart', uicb);

  for (let i = 0, count = callbacks.length; i < count; i++) {
    setTimeout( callbacks[i], 0 );
  }
};
window.addEventListener('wheel', uicb);
window.addEventListener('mousemove', uicb);
window.addEventListener('keydown', uicb);
// window.addEventListener('click', uicb);
window.addEventListener('touchstart', uicb);

const helperFunctions = {

	isDebugging: function () {
    return document.cookie.indexOf('csd_debug') !== -1;
  },

  debug: function () {
    if ( helperFunctions.isDebugging() ) {
      console.log.apply( null, arguments );
    }
  },

  onUserInteracted: function (callback) {
		if ( isUserInteracted ) setTimeout( callback, 0 );
		else callbacks.push( callback );
	},

  isLocalStorageSupported: function() {
    try {
      var key = 'CsdLocalStorageTest';
      localStorage.setItem(key, key);
      localStorage.removeItem(key);
      return true;
      // return key === localStorage.getItem(key);
    } catch( err ) {
      return false;
    }
  },

  getCookieValue: (name) => (
    document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
  ),

  setCookieValue: (name, value, days) => {
    var expires;
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toGMTString();
    }
    else {
      expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
  },

  removeCookie: (name) => {
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  },

  arrayChunks: ( array, chunkSize ) => {
    const chunks = [];
    const arr = [].concat( array );

    for ( let i = 0, count = Math.ceil( arr.length / chunkSize ); i < count; i++ ) {
      chunks.push( arr.splice( 0, chunkSize) );
    }

    return chunks;
  },

};

export default helperFunctions;
