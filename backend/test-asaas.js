
require('dotenv').config({ path: './.env' });
const axios = require('axios');

async function testAsaas() {
    const url = 'https://api.asaas.com/v3/customers';
    const apiKey = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmY3NWRjN2ZhLTY3MTgtNDQ0ZC1iYWYyLTZkNDUyM2Y2YjhmMjo6JGFhY2hfZDY5YTRlYWItYWI4MC00MGY2LTg0ZWQtNGY5OTVhOGFhYzdk';

    console.log('Testing Asaas Connection...');
    console.log('URL:', url);
    console.log('API Key length:', apiKey.length);

    try {
        const response = await axios.get(url + '?limit=1', {
            headers: {
                'access_token': apiKey
            }
        });
        console.log('Connection Successful!');
        console.log('Status:', response.status);
    } catch (error) {
        console.error('Connection Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }

    console.log('\nTesting Customer Creation...');
    try {
        const payload = {
            name: "Test User",
            cpfCnpj: "00000000000" // Intentionally invalid to see validation error or success if Sandbox allows
        };
        const createResponse = await axios.post(url, payload, {
            headers: {
                'access_token': apiKey
            }
        });
        console.log('Customer Created!', createResponse.data.id);
    } catch (error) {
        console.error('Creation Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testAsaas();
