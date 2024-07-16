class CsdShippingTimer {

	load(context, $scope) {
		this.context = context;
		this.$scope = $scope;

		const $container = $scope.find('.shipping-timer');
		const $timer = $container.find('.shipping-timer-timer');
		const $lastTitle = $container.find('.shipping-timer-title-last');
		const $counterContainer = $container.find('.shipping-timer-counter-container');
		if ( ! $counterContainer.length ) return;

		const targetConfig = this.getDispatchTargetConfig();
		const { dispatchDate: targetDate, isSameDay } = this.getDispatchTargetConfig();

		// Display static message
		if ( ! targetDate ) {
			$counterContainer.html('Delivery between Monday and Friday');
			return;
		}

		// Display counter
		if ( ! $timer.length || ! $lastTitle.length ) return;
		
		const targetTime = targetDate.getTime();
		$lastTitle.html(`to get ${isSameDay ? 'same' : 'next'} day shipping`);

		const countdownfunction = setInterval(() => {
			const now = this.getLondonDate();

			// now.setUTCDate( now.getUTCDate() + 4 ); // TEST
			// now.setUTCHours(11); // TEST

			const distance = targetTime - now.getTime();

			if (distance < 0) {
				clearInterval(countdownfunction);
				$container.remove();
				// location.reload();
			} else {
				let days = Math.floor(distance / (1000 * 60 * 60 * 24));
				let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
				let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
				// let seconds = Math.floor((distance % (1000 * 60)) / 1000);
				
				let message = [];
				if (days) {
					message.push(`${days < 10 ? '0' + days : days} ${days === 1 ? 'day' : 'days'}`);
				}
				if (hours) {
					message.push(`${hours < 10 ? '0' + hours : hours} ${hours === 1 ? 'hour' : 'hours'}`);
				}
				if (minutes) {
					message.push(`${minutes < 10 ? '0' + minutes : minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
				}
				// if (seconds) {
				// 	message.push(`${seconds < 10 ? '0' + seconds : seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
				// }

				// Sample: 01 days 07 hours 18 minutes 01 seconds
			  message = message.join(' ');

				$timer.html(message);
			}
		}, 1000);
	}

	getDayOfWeek(date) {
		const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		return weekday[date.getUTCDay()];
	}

	getDispatchTargetConfig(){
		const now = this.getLondonDate();

		// now.setUTCDate( now.getUTCDate() + 4 ); // TEST
		// now.setUTCHours(11); // TEST

		// const hours = now.getUTCHours() + londonHoursFromUtcOffset;
		const hours = now.getUTCHours();
		const minutes = now.getUTCMinutes(); 
		const dayOfWeekToday = this.getDayOfWeek(now);
		const dispatchDate = new Date();
		// dispatchDate.setUTCDate( dispatchDate.getUTCDate() + 4 ); // TEST
		
		if (
				( ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf( dayOfWeekToday ) !== -1 ) &&
				( hours < 16 )
			) {
			// Ship same day if order placed before 15:59 from Monday till Friday
			dispatchDate.setUTCHours( 15 );
			dispatchDate.setUTCMinutes( 59 );
			dispatchDate.setUTCSeconds( 59 );

			return {
				isSameDay: true,
				dispatchDate: dispatchDate,
			};
		} else if (
				( ['Monday', 'Tuesday', 'Wednesday', 'Thursday'].indexOf( dayOfWeekToday ) !== -1 ) &&
				( hours <= 23 ) &&
				( minutes <= 59 )
			) {
			// Ship next day if placed before 23:59 from Monday till Thursday
			dispatchDate.setUTCHours( 23 );
			dispatchDate.setUTCMinutes( 59 );
			dispatchDate.setUTCSeconds( 59 );

			return {
				isSameDay: false,
				dispatchDate: dispatchDate,
			};
		} else {
			// Ship next week
			return false;
		}
	}

	/* Return a Date for the last Sunday in a month
	** @param {number} year - full year number (e.g. 2015)
	** @param {number} month - calendar month number (jan=1)
	** @returns {Date} date for last Sunday in given month
	*/
	getLastSunday(year, month) {
	  // Create date for last day in month
	  const date = new Date(year, month, 0);
	  // Adjust to previous Sunday
	  date.setDate( date.getDate() - date.getDay() );
	  return date;
	}

	getLondonDate() {
		const date = new Date();
	  const dateSummer = this.getLastSunday( date.getFullYear(), 3 );
	  const dateWinter = this.getLastSunday( date.getFullYear(), 10 );
	  const hoursOffset = ( date > dateSummer ) && ( date < dateWinter ) ? 1 : 0;


		if ( hoursOffset !== 0 ) {
			date.setUTCHours( date.getUTCHours() + hoursOffset );
		}

	  return date;
	}
	
}

const instance = new CsdShippingTimer();

export default instance;
