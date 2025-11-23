/**
 * Simulates a reservation submission to a backend API.
 * @param {Object} reservationData - The reservation details.
 * @returns {Promise<Object>} - A promise that resolves with the success response.
 */
export const submitReservation = async (reservationData) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate a 10% chance of failure
            if (Math.random() < 0.1) {
                reject(new Error('Failed to reserve table. Please try again.'));
            } else {
                resolve({
                    success: true,
                    message: 'Reservation confirmed!',
                    data: reservationData,
                });
            }
        }, 1500); // Simulate network delay
    });
};
