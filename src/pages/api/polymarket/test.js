// Simple test of Polymarket API
export default async function handler(req, res) {
  try {
    // Try the documented CLOB endpoint
    const response = await fetch('https://clob.polymarket.com/markets', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    const text = await response.text();
    console.log('[Polymarket Test] Status:', response.status);
    console.log('[Polymarket Test] Headers:', response.headers);
    console.log('[Polymarket Test] Response preview:', text.substring(0, 500));

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(200).json({
        error: 'Failed to parse JSON',
        status: response.status,
        preview: text.substring(0, 1000)
      });
    }

    // Check structure
    const isArray = Array.isArray(data);
    const keys = isArray ? [] : Object.keys(data);
    const firstItem = isArray ? data[0] : data[keys[0]];

    return res.status(200).json({
      status: response.status,
      isArray,
      keys,
      length: isArray ? data.length : keys.length,
      firstItem: firstItem ? JSON.stringify(firstItem).substring(0, 500) : null,
      sample: data
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}