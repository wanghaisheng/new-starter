import axios from 'axios';

export async function fetchMatchAlgorithms() {
  // 推荐后端返回算法列表和算法元信息
  const res = await axios.get('/api/match/algorithms');
  return res.data; // [{key, name, vipOnly, needTest, testFlag, testUrl}]
}

export async function fetchUserMatchPreference() {
  const res = await axios.get('/api/user/match-preference');
  return res.data; // {algoOrder: string[], disableAlgos: string[]}
}

export async function fetchUserStatus() {
  const res = await axios.get('/api/user/profile');
  return res.data; // {isVip, hasBaziTest, hasWuxingTest, ...}
}

export async function saveUserMatchPreference(payload: {algoOrder: string[], disableAlgos: string[]}) {
  const res = await axios.post('/api/user/match-preference', payload);
  return res.data;
}
