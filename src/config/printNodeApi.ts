import axios from 'axios';
import { PRINT_NODE_URL } from './config';
import { Buffer } from 'buffer';

const apiKey = 'PrDdPPH6bJJpWSYwONmfapRUCCkL-770o5ZTsWSyY7g';
const base64ApiKey = Buffer.from(`${apiKey}:`).toString('base64');

const printNodeApi = axios.create({
  baseURL: PRINT_NODE_URL,
  headers: {
    Authorization: `Basic ${base64ApiKey}`,
    'Content-Type': 'application/json',
  },
});

export default printNodeApi;
