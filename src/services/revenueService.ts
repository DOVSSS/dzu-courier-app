import api from './api';

export type MyOwedResponse = {
  owed: number;
  orderCount: number;
};

export async function getMyOwed(): Promise<MyOwedResponse> {
  const { data } = await api.get<MyOwedResponse>('/revenue/my-owed');
  return data;
}
