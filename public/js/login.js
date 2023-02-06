/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert.js';

export const login = async function(email, password) {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: { email, password }
    });
    // After logging in, auto move to another page
    if (res.data.status === 'success') {
      showAlert('success', 'Nicely done, you have logged in');
      setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', 'Sorry man! not correct info!');
  }
};
