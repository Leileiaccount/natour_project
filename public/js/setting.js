/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alert';

export const settingUpdate = async (data, type) => {
  try {
    const endpoint = type === 'data' ? 'updateme' : 'updatepassword';
    const newUserInfo = await axios({
      method: 'patch',
      url: `http://127.0.0.1:3000/api/v1/users/${endpoint}`,
      data: data
    });

    if (newUserInfo.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Information updated`);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
