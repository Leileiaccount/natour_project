/*eslint-disable*/
import { showAlert } from './alert';
import axios from 'axios';
export const bookTour = async function(tourId) {
  const stripe = Stripe(
    'pk_test_51MWYaoF5JdTnKbJt9oIQkkWPed02TGezfUAQFsdumsAFFKOO3vUH6PTd6W1yJNrfWP4MN547Hx0xuz1pQz3bfZ5L00WtGpDMX7'
  );
  try {
    // 1) Get checkout session from API
    // Only get method available
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
    //2) Create checkout form + charge credit card
  } catch (error) {
    showAlert('error', error);
  }
};
