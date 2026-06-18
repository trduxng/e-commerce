const https = require('https');
function getPhotoId(query) {
    return new Promise(resolve => {
        https.get('https://unsplash.com/s/photos/' + query, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const match = data.match(/"id":"([a-zA-Z0-9_-]{10,20})"/);
                resolve(match ? match[1] : null);
            });
        }).on('error', () => resolve(null));
    });
}
async function run() {
    const queries = ['cap', 'espresso-machine', 'kettle', 'marshall-speaker', 'sony-speaker', 'sofa', 'office-desk'];
    for(let q of queries) {
        console.log(q + ' -> ' + await getPhotoId(q));
    }
}
run();
