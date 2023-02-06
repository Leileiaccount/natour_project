/*eslint-disable*/
import axios from 'axios';

import { showAlert } from './alert';
export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout'
    });
    console.log(res.data.status);
    if (res.data.status === 'success') {
      console.log('logout is working!!');
      location.reload(true);
    }
  } catch (err) {
    showAlert(err);
  }
};
