import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL
// For Expo Go on physical device, use your machine's LAN IP, e.g. http://192.168.1.5:4000
// For Android emulator: http://10.0.2.2:4000
// For iOS simulator: http://localhost:4000
// For web: http://localhost:4000
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export async function getToken() {
  return AsyncStorage.getItem('token');
}
export async function setToken(token: string) {
  await AsyncStorage.setItem('token', token);
}
export async function clearToken() {
  await AsyncStorage.removeItem('token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: any = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  requestOtp: (phone: string) => request('/api/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, otp: string) => request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  getLoans: () => request('/api/loans'),
  getSummary: () => request('/api/loans/summary'),
  createLoan: (payload: { friendName: string; amount: number; dueDate: string; receiptUrl?: string }) =>
    request('/api/loans', { method: 'POST', body: JSON.stringify(payload) }),
  markRepaid: (id: number) => request(`/api/loans/${id}/repay`, { method: 'PATCH' }),
  
  // For receipt upload, use multipart
  uploadReceipt: async (id: number, uri: string) => {
    const token = await getToken();
    const formData = new FormData();
    // @ts-ignore - React Native FormData
    formData.append('receipt', {
      uri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    } as any);

    const res = await fetch(`${BASE_URL}/api/loans/${id}/receipt`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type, let fetch set boundary
      },
      body: formData as any,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
};
