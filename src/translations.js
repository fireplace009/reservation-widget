export const translations = {
    'en': {
        'reserve_table': 'Reserve a Table',
        'date': 'Date',
        'time': 'Time',
        'guests': 'Guests',
        'email': 'Email',
        'select_time': 'Select a time',
        'confirm_reservation': 'Confirm Reservation',
        'loading': 'Loading...',
        'reservation_confirmed': 'Reservation Confirmed!',
        'thank_you_message': 'Thank you! Your table for {guests} on {date} at {time} has been reserved.',
        'confirmation_email': 'A confirmation email has been sent to {email}.',
        'make_another': 'Make Another Reservation',
        'closed_day': 'We are closed on this day. Please choose Wed-Sat.',
        'fill_all': 'Please fill in all fields.',
        'slot_full': '{time} (Full)',
        'slot_unavailable': 'Sorry, this time slot is fully booked for your party size.',
        'seats_left': '({count} seats left)',
        'only_seats_left': '(Only {count} left)',
        'placeholder_email': 'you@example.com'
    },
    'nl-BE': {
        'reserve_table': 'Reserveer een Tafel',
        'date': 'Datum',
        'time': 'Tijd',
        'guests': 'Gasten',
        'email': 'E-mail',
        'select_time': 'Kies een tijdstip',
        'confirm_reservation': 'Bevestig Reservering',
        'loading': 'Laden...',
        'reservation_confirmed': 'Reservering Bevestigd!',
        'thank_you_message': 'Bedankt! Je tafel voor {guests} op {date} om {time} is gereserveerd.',
        'confirmation_email': 'Een bevestigingsmail is verzonden naar {email}.',
        'make_another': 'Maak nog een reservering',
        'closed_day': 'We zijn gesloten op deze dag. Kies a.u.b. wo-za.',
        'fill_all': 'Vul a.u.b. alle velden in.',
        'slot_full': '{time} (Volzet)',
        'slot_unavailable': 'Sorry, dit tijdslot is volzet voor uw groepsgrootte.',
        'seats_left': '({count} plaatsen over)',
        'only_seats_left': '(Nog maar {count} over)',
        'placeholder_email': 'jouw@email.com'
    }
};

export function getLocale() {
    const browserLocale = navigator.language;
    if (browserLocale.startsWith('nl')) {
        return 'nl-BE';
    }
    return 'en';
}

export function t(key, locale, params = {}) {
    const dict = translations[locale] || translations['en'];
    let str = dict[key] || key;

    Object.keys(params).forEach(param => {
        str = str.replace(`{${param}}`, params[param]);
    });

    return str;
}
